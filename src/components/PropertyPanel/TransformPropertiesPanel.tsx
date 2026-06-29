/**
 * TransformPropertiesPanel - Layer transform properties (scale, rotation, offset)
 */
import React from 'react';
import { Layer } from '../../types/layer-types';

interface TransformPropertiesPanelProps {
  theme: 'frost_light' | 'frost_dark';
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
}

export const TransformPropertiesPanel: React.FC<
  TransformPropertiesPanelProps
> = ({ theme, layer, onUpdate }) => {
  const inputClasses = `
    frost-w-full frost-text-sm
    ${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}
  `;

  const labelClasses = `
    frost-block frost-text-sm frost-font-medium frost-mb-1
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const sectionClasses = `
    frost-mb-4 frost-p-3 frost-rounded
    ${theme === 'frost_light' ? 'frostlight-standard-glass-card' : 'frostdark-standard-glass-card'}
  `;

  return (
    <div className={sectionClasses}>
      <h4 className={labelClasses}>Transform</h4>

      <div className='frost-grid frost-grid-cols-2 frost-gap-2 frost-mb-2'>
        <div>
          <label className={labelClasses}>
            Scale ({layer.scale.toFixed(2)})
          </label>
          <input
            type='range'
            min='0.1'
            max='3'
            step='0.1'
            value={layer.scale}
            onChange={e => onUpdate({ scale: parseFloat(e.target.value) })}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Rotation ({layer.rotation}°)</label>
          <input
            type='range'
            min='0'
            max='360'
            value={layer.rotation}
            onChange={e => onUpdate({ rotation: parseInt(e.target.value) })}
            className={inputClasses}
          />
        </div>
      </div>

      <div className='frost-grid frost-grid-cols-2 frost-gap-2'>
        <div>
          <label className={labelClasses}>Offset X ({layer.offsetX}px)</label>
          <input
            type='range'
            min='-200'
            max='200'
            value={layer.offsetX}
            onChange={e => onUpdate({ offsetX: parseInt(e.target.value) })}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Offset Y ({layer.offsetY}px)</label>
          <input
            type='range'
            min='-200'
            max='200'
            value={layer.offsetY}
            onChange={e => onUpdate({ offsetY: parseInt(e.target.value) })}
            className={inputClasses}
          />
        </div>
      </div>
    </div>
  );
};

export default TransformPropertiesPanel;
