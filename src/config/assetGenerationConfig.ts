// src/config/assetGenerationConfig.ts
export const assetClamps = {
  lens: {
    basePrompt:
      'A photorealistic, circular, intricate glass lens object on a pure black background with these characteristics: {USER_PROMPT}.',
    negativePrompt:
      'square, rectangle, border, frame, text, watermark, person, animal',
  },
  'element-circuit': {
    basePrompt:
      'A glowing, radial, circular circuit board pattern on a transparent background with these characteristics: {USER_PROMPT}.',
    negativePrompt:
      'square, rectangle, border, text, watermark, organic, flesh',
  },
  'element-iris': {
    basePrompt:
      'A photorealistic, detailed eyeball iris, centered with a dark pupil, on a transparent background with these features: {USER_PROMPT}.',
    negativePrompt:
      'full eye, eyelashes, skin, square, border, text, mechanical',
  },
};

export type AssetCategory = keyof typeof assetClamps;
