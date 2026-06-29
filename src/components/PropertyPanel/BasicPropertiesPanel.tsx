/**
 * BasicPropertiesPanel - Basic layer properties (name, visibility, opacity, blend mode)
 */
import React from 'react';
import { Layer } from '../../types/layer-types';

interface BasicPropertiesPanelProps {
  theme: 'frost_light' | 'frost_dark';
  layer: Layer;
  onUpdate: (updates: Partial<Layer>) => void;
}

export const BasicPropertiesPanel: React.FC<BasicPropertiesPanelProps> = ({
  theme,
  layer,
  onUpdate,
}) => {
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
      <h4 className={labelClasses}>Basic Properties</h4>

      <div className='frost-mb-2'>
        <label className={labelClasses}>Name</label>
        <input
          type='text'
          value={layer.name}
          onChange={e => onUpdate({ name: e.target.value })}
          className={inputClasses}
        />
      </div>

      <div className='frost-mb-2'>
        <label className='frost-flex frost-items-center'>
          <input
            type='checkbox'
            checked={layer.visible}
            onChange={e => onUpdate({ visible: e.target.checked })}
            className='frost-mr-2'
          />
          <span className={labelClasses.replace('frost-block', 'frost-inline')}>
            Visible
          </span>
        </label>
      </div>

      <div className='frost-grid frost-grid-cols-2 frost-gap-2'>
        <div>
          <label className={labelClasses}>
            Opacity ({(layer.opacity * 100).toFixed(0)}%)
          </label>
          <input
            type='range'
            min='0'
            max='1'
            step='0.01'
            value={layer.opacity}
            onChange={e => onUpdate({ opacity: parseFloat(e.target.value) })}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Blend Mode</label>
          <select
            value={layer.blendMode}
            onChange={e => onUpdate({ blendMode: e.target.value })}
            className={inputClasses}
          >
            <option value='normal'>Normal</option>
            <option value='multiply'>Multiply</option>
            <option value='screen'>Screen</option>
            <option value='overlay'>Overlay</option>
            <option value='darken'>Darken</option>
            <option value='lighten'>Lighten</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default BasicPropertiesPanel;
