import { generateAsset } from '../assetGenerationService';
import { assetClamps } from '../../config/assetGenerationConfig';
import { generateAssetWithGemini } from '../geminiService';

jest.mock('../geminiService', () => ({
  generateAssetWithGemini: jest.fn(),
}));

describe('assetGenerationService', () => {
  const generateAssetWithGeminiMock = generateAssetWithGemini as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error for an invalid asset category', async () => {
    await expect(
      generateAsset('invalid-category' as any, 'test prompt', 'test-key', '')
    ).rejects.toThrow('Invalid asset category: invalid-category');
  });

  it('should call the Gemini service with the composed prompt and clamps', async () => {
    const expectedPrompt = assetClamps.lens.basePrompt.replace(
      '{USER_PROMPT}',
      'a test lens'
    );
    generateAssetWithGeminiMock.mockResolvedValue('http://example.com/image.png');

    const result = await generateAsset('lens', 'a test lens', 'test-api-key', '');

    expect(generateAssetWithGeminiMock).toHaveBeenCalledWith(
      expectedPrompt,
      'test-api-key',
      {
        negativePrompt: assetClamps.lens.negativePrompt,
      }
    );
    expect(result).toBe('http://example.com/image.png');
  });

  it('should propagate errors from the Gemini service', async () => {
    generateAssetWithGeminiMock.mockRejectedValue(new Error('API Error'));

    await expect(generateAsset('lens', 'test', 'test-key', '')).rejects.toThrow(
      'API Error'
    );
  });
});
