export const DEFAULT_GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';

export interface GeminiImageOptions {
  negativePrompt?: string;
  aspectRatio?: string;
  outputMimeType?: string;
  model?: string;
}

export const generateAssetWithGemini = async (
  prompt: string,
  apiKey: string,
  options: GeminiImageOptions = {}
): Promise<string> => {
  try {
    const { GoogleGenAI } = await import('@google/genai');

    const {
      negativePrompt,
      aspectRatio = '1:1',
      outputMimeType = 'image/png',
      model = DEFAULT_GEMINI_IMAGE_MODEL,
    } = options;

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        ...(negativePrompt ? { negativePrompt } : {}),
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(outputMimeType ? { outputMimeType } : {}),
      },
    });

    const images = response.generatedImages ?? [];

    if (!images.length) {
      const feedback = response.positivePromptSafetyAttributes
        ? ' Check safety filters or adjust your prompt.'
        : '';
      throw new Error(
        `Failed to generate asset. The API returned no images.${feedback}`
      );
    }

    const successfulImage = images.find(image => {
      if (image.raiFilteredReason) {
        return false;
      }
      return Boolean(image.image?.imageBytes || image.image?.gcsUri);
    });

    if (!successfulImage) {
      const filtered = images.find(image => image.raiFilteredReason);
      if (filtered?.raiFilteredReason) {
        throw new Error(
          `Image generation was filtered by Responsible AI: ${filtered.raiFilteredReason}`
        );
      }
      throw new Error('Generated image did not include usable data.');
    }

    const imageData = successfulImage.image;

    if (imageData?.imageBytes) {
      const mimeType = imageData.mimeType || outputMimeType;
      return `data:${mimeType};base64,${imageData.imageBytes}`;
    }

    if (imageData?.gcsUri) {
      return imageData.gcsUri;
    }

    throw new Error('Generated image was missing image bytes and URI.');
  } catch (error: any) {
    if (error?.status === 404) {
      throw new Error(
        'Gemini image model not found. Verify that your API key has access to the configured model or update DEFAULT_GEMINI_IMAGE_MODEL.'
      );
    }

    throw error;
  }
};
