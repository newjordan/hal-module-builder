/**
 * AddLayerPanel Component - UI for adding new layers
 * Extracted from HalModuleBuilder.tsx for better organization
 */
import React from 'react';
import { Layer } from '../../types/layer-types';

export interface AddLayerPanelProps {
  theme: 'frost_light' | 'frost_dark';
  newLayerType: Layer['type'];
  onLayerTypeChange: (type: Layer['type']) => void;
  onAddLayer: () => void;
  className?: string;
}

export const AddLayerPanel: React.FC<AddLayerPanelProps> = ({
  theme,
  newLayerType,
  onLayerTypeChange,
  onAddLayer,
  className = '',
}) => {
  const themeClasses = {
    card:
      theme === 'frost_light'
        ? 'frostlight-app-content-card'
        : 'frostdark-app-content-card',
    inputContainer:
      theme === 'frost_light'
        ? 'frostlight-input-container'
        : 'frostdark-input-container',
    inputField:
      theme === 'frost_light'
        ? 'frostlight-input-field'
        : 'frostdark-input-field',
    buttonAction:
      theme === 'frost_light'
        ? 'frostlight-button-action'
        : 'frostdark-button-action',
  };

  return (
    <div className={`${themeClasses.card} frost-mb-4 ${className}`}>
      <h3 className='frost-mb-2 frost-text-primary'>Add New Layer</h3>

      <div className='frost-flex frost-gap-2'>
        <div className={`${themeClasses.inputContainer} frost-flex-1`}>
          <select
            value={newLayerType}
            onChange={e => onLayerTypeChange(e.target.value as Layer['type'])}
            className={themeClasses.inputField}
          >
            <option value='shape'>🔷 Shape</option>
            <option value='image'>🖼️ Image</option>
            <option value='equalizer'>🎵 Equalizer</option>
            <option value='radialText'>📝 Radial Text</option>
          </select>
        </div>
        <button
          onClick={onAddLayer}
          className={themeClasses.buttonAction}
          title='Add new layer (Ctrl+N)'
        >
          + Add
        </button>
      </div>

      {/* Layer Type Descriptions */}
      <div className='frost-mt-2 frost-text-xs frost-opacity-75'>
        {newLayerType === 'image' && (
          <div>✨ Add an image layer with filters and transform controls</div>
        )}
        {newLayerType === 'shape' && (
          <div>
            ✨ Add a geometric shape with customizable fill and stroke
            (including gradients)
          </div>
        )}
        {newLayerType === 'equalizer' && (
          <div>✨ Add a real-time audio equalizer visualization</div>
        )}
        {newLayerType === 'radialText' && (
          <div>✨ Add animated radial text with effects and audio reactivity</div>
        )}
      </div>
    </div>
  );
};

export default AddLayerPanel;
