// src/components/controls/AssetGeneratorPanel.tsx
import { useState } from 'react';
import { useLayerManagement } from '../../hooks/useLayerManagement';
import { useApiKey } from '../../context/ApiKeyContext';
import { generateAsset } from '../../services/assetGenerationService';
import { assetClamps, AssetCategory } from '../../config/assetGenerationConfig';
import type { Layer } from '../../types/layer-types';

interface AssetGeneratorPanelProps {
  layer: Layer;
  layers: Layer[];
  onUpdate: (updates: Partial<Layer>) => void;
  theme: 'frost_light' | 'frost_dark';
}

export const AssetGeneratorPanel = ({
  layer: _layer,
  layers,
  onUpdate: _onUpdate,
  theme,
}: AssetGeneratorPanelProps) => {
  const { apiKey, setIsApiKeyModalOpen } = useApiKey();
  const { updateLayerImageSource } = useLayerManagement();
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<AssetCategory>('lens');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await generateAsset(category, prompt, apiKey, ''); // projectId is not needed anymore
      const baseLayer = layers.find(l => l.type === 'image');
      const elementLayer = layers.find(
        l => l.type === 'image' && l.id !== baseLayer?.id
      );
      const targetLayer =
        category === 'lens' ? baseLayer?.id : elementLayer?.id;
      if (targetLayer) {
        updateLayerImageSource(targetLayer, imageUrl);
      } else {
        throw new Error(
          `Target layer ID for category '${category}' is not defined.`
        );
      }
    } catch (err: any) {
      console.error('Generation failed', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputContainerClass =
    theme === 'frost_light'
      ? 'frostlight-input-container'
      : 'frostdark-input-container';
  const inputClass =
    theme === 'frost_light'
      ? 'frostlight-input-field'
      : 'frostdark-input-field';
  const buttonClass =
    theme === 'frost_light'
      ? 'frostlight-button-action'
      : 'frostdark-button-action';

  return (
    <>
      <h3 className='frost-mb-2 frost-text-primary'>Asset Generator</h3>
      <div className='frost-flex frost-flex-col frost-gap-2'>
        <div className={inputContainerClass}>
          <label htmlFor='asset-category' className='text-label'>
            Category
          </label>
          <select
            id='asset-category'
            value={category}
            onChange={e => setCategory(e.target.value as AssetCategory)}
            className={inputClass}
          >
            {(Object.keys(assetClamps) as AssetCategory[]).map(key => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div className={inputContainerClass}>
          <label htmlFor='asset-prompt' className='text-label'>
            Prompt
          </label>
          <input
            id='asset-prompt'
            type='text'
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g., 'glowing gold and silver'"
            className={inputClass}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={buttonClass}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
        {error && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>Error: {error}</p>
        )}
      </div>
    </>
  );
};
