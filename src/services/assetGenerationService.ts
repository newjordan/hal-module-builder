import { assetClamps, AssetCategory } from '../config/assetGenerationConfig';
import { generateAssetWithGemini } from './geminiService';

export async function generateAsset(
  assetCategory: AssetCategory,
  userPrompt: string,
  apiKey: string,
  _projectId: string // projectId is no longer needed for the gemini api
): Promise<string> {
  const config = assetClamps[assetCategory];
  if (!config) throw new Error(`Invalid asset category: ${assetCategory}`);

  const finalPrompt = config.basePrompt.replace('{USER_PROMPT}', userPrompt);

  return await generateAssetWithGemini(finalPrompt, apiKey, {
    negativePrompt: config.negativePrompt,
  });
}
