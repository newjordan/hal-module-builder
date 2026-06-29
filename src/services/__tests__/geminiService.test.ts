const generateImagesMock = jest.fn();
const GoogleGenAIMock = jest.fn().mockImplementation(() => ({
  models: {
    generateImages: generateImagesMock,
  },
}));

jest.mock('@google/genai', () => ({
  GoogleGenAI: GoogleGenAIMock,
}));

import {
  DEFAULT_GEMINI_IMAGE_MODEL,
  generateAssetWithGemini,
} from '../geminiService';

describe('generateAssetWithGemini', () => {
  beforeEach(() => {
    generateImagesMock.mockReset();
    GoogleGenAIMock.mockClear();
  });

  it('returns a data URI when image bytes are present', async () => {
    generateImagesMock.mockResolvedValue({
      generatedImages: [
        {
          image: {
            imageBytes: 'YmFzZTY0',
            mimeType: 'image/png',
          },
        },
      ],
    });

    const result = await generateAssetWithGemini('prompt', 'api-key');

    expect(GoogleGenAIMock).toHaveBeenCalledWith({ apiKey: 'api-key' });
    expect(result).toBe('data:image/png;base64,YmFzZTY0');
  });

  it('returns the GCS URI when image bytes are not provided', async () => {
    generateImagesMock.mockResolvedValue({
      generatedImages: [
        {
          image: {
            gcsUri: 'gs://bucket/image.png',
            mimeType: 'image/png',
          },
        },
      ],
    });

    const result = await generateAssetWithGemini('prompt', 'api-key');

    expect(result).toBe('gs://bucket/image.png');
  });

  it('passes clamps through to the Gemini client', async () => {
    generateImagesMock.mockResolvedValue({
      generatedImages: [
        {
          image: {
            imageBytes: 'ZXhwbw==',
          },
        },
      ],
    });

    await generateAssetWithGemini('prompt', 'api-key', {
      negativePrompt: 'no squares',
      aspectRatio: '3:4',
      outputMimeType: 'image/webp',
      model: 'custom-model',
    });

    expect(generateImagesMock).toHaveBeenCalledWith({
      model: 'custom-model',
      prompt: 'prompt',
      config: {
        numberOfImages: 1,
        negativePrompt: 'no squares',
        aspectRatio: '3:4',
        outputMimeType: 'image/webp',
      },
    });
  });

  it('throws when the response is filtered by Responsible AI', async () => {
    generateImagesMock.mockResolvedValue({
      generatedImages: [
        {
          raiFilteredReason: 'SAFETY',
        },
      ],
    });

    await expect(generateAssetWithGemini('prompt', 'api-key')).rejects.toThrow(
      'Responsible AI'
    );
  });

  it('throws when no usable images are returned', async () => {
    generateImagesMock.mockResolvedValue({ generatedImages: [{}] });

    await expect(generateAssetWithGemini('prompt', 'api-key')).rejects.toThrow(
      'Generated image did not include usable data.'
    );
  });

  it('surfaces a model not found error with guidance', async () => {
    const error = Object.assign(new Error('Not found'), { status: 404 });
    generateImagesMock.mockRejectedValue(error);

    await expect(generateAssetWithGemini('prompt', 'api-key')).rejects.toThrow(
      'Gemini image model not found'
    );
  });

  it('falls back to the default model identifier', async () => {
    generateImagesMock.mockResolvedValue({
      generatedImages: [
        {
          image: {
            imageBytes: 'ZXhwbw==',
          },
        },
      ],
    });

    await generateAssetWithGemini('prompt', 'api-key');

    expect(generateImagesMock).toHaveBeenCalledWith({
      model: DEFAULT_GEMINI_IMAGE_MODEL,
      prompt: 'prompt',
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/png',
      },
    });
  });
});
