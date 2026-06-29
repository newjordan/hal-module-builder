/**
 * BulkEditPanel - Bulk editing controls for multiple selected layers
 */
import React, { useMemo } from 'react';
import { Layer } from '../../types/layer-types';

interface BulkEditPanelProps {
  theme: 'frost_light' | 'frost_dark';
  multiSelectedLayers: Layer[];
  onBulkUpdate: (layerIds: string[], updates: Partial<Layer>) => void;
}

export const BulkEditPanel: React.FC<BulkEditPanelProps> = ({
  theme,
  multiSelectedLayers,
  onBulkUpdate,
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

  // Check if all selected layers have the same type
  const bulkEditableProperties = useMemo(() => {
    const types = new Set(multiSelectedLayers.map(l => l.type));
    const sameType = types.size === 1;
    const commonType = sameType ? (multiSelectedLayers[0]?.type ?? null) : null;

    return {
      sameType,
      commonType,
    };
  }, [multiSelectedLayers]);

  const handleBulkUpdate = (updates: Partial<Layer>) => {
    if (multiSelectedLayers.length > 0) {
      const layerIds = multiSelectedLayers.map(l => l.id);
      onBulkUpdate(layerIds, updates);
    }
  };

  return (
    <div>
      <div className='frost-mb-4'>
        <h3
          className={`
            frost-font-medium frost-mb-2
            ${theme === 'frost_light' ? 'frost-text-gray-900' : 'frost-text-gray-100'}
          `}
        >
          Bulk Edit ({multiSelectedLayers.length} layers)
        </h3>

        {!bulkEditableProperties.sameType && (
          <div
            className={`
              frost-text-xs frost-p-2 frost-rounded frost-mb-3
              ${
                theme === 'frost_light'
                  ? 'frost-bg-yellow-50 frost-text-yellow-700 frost-border frost-border-yellow-200'
                  : 'frost-bg-yellow-900/20 frost-text-yellow-300 frost-border frost-border-yellow-700/50'
              }
            `}
          >
            Different layer types selected. Only common properties can be
            edited.
          </div>
        )}
      </div>

      {/* Common Transform Properties */}
      <div className={sectionClasses}>
        <h4 className={labelClasses}>Transform</h4>

        <div className='frost-grid frost-grid-cols-2 frost-gap-2 frost-mb-2'>
          <div>
            <label className={labelClasses}>Opacity</label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              onChange={e =>
                handleBulkUpdate({ opacity: parseFloat(e.target.value) })
              }
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Scale</label>
            <input
              type='range'
              min='0.1'
              max='3'
              step='0.1'
              onChange={e =>
                handleBulkUpdate({ scale: parseFloat(e.target.value) })
              }
              className={inputClasses}
            />
          </div>
        </div>

        <div className='frost-grid frost-grid-cols-2 frost-gap-2'>
          <div>
            <label className={labelClasses}>Offset X</label>
            <input
              type='range'
              min='-200'
              max='200'
              onChange={e =>
                handleBulkUpdate({ offsetX: parseInt(e.target.value) })
              }
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Offset Y</label>
            <input
              type='range'
              min='-200'
              max='200'
              onChange={e =>
                handleBulkUpdate({ offsetY: parseInt(e.target.value) })
              }
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Visibility and Blend Mode */}
      <div className={sectionClasses}>
        <h4 className={labelClasses}>Appearance</h4>

        <div className='frost-mb-2'>
          <label className='frost-flex frost-items-center'>
            <input
              type='checkbox'
              onChange={e => handleBulkUpdate({ visible: e.target.checked })}
              className='frost-mr-2'
            />
            <span
              className={labelClasses.replace('frost-block', 'frost-inline')}
            >
              Visible
            </span>
          </label>
        </div>

        <div>
          <label className={labelClasses}>Blend Mode</label>
          <select
            onChange={e => handleBulkUpdate({ blendMode: e.target.value })}
            className={inputClasses}
          >
            <option value=''>Keep current</option>
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

export default BulkEditPanel;
