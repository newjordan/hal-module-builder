/**
 * TemplateListItem - Individual template item with actions
 */
import React from 'react';
import { Preset } from '../../types/layer-types';

interface TemplateListItemProps {
  theme: 'frost_light' | 'frost_dark';
  preset: Preset;
  compact?: boolean;
  onLoad: (presetId: string) => void;
  onDuplicate: (presetId: string) => void;
  onExport: (presetId: string) => void;
  onDelete: (presetId: string) => void;
}

export const TemplateListItem: React.FC<TemplateListItemProps> = ({
  theme,
  preset,
  compact = false,
  onLoad,
  onDuplicate,
  onExport,
  onDelete,
}) => {
  const smallButtonClasses = `
    ${theme === 'frost_light' ? 'frostlight-button-action-sm' : 'frostdark-button-action-sm'}
  `;

  const handleDelete = () => {
    if (confirm(`Delete "${preset.name}"?`)) {
      onDelete(preset.id);
    }
  };

  return (
    <div
      className={`
        frost-p-2 frost-rounded frost-border
        ${
          theme === 'frost_light'
            ? 'frost-bg-white frost-border-gray-200 hover:frost-border-blue-300'
            : 'frost-bg-gray-800 frost-border-gray-600 hover:frost-border-blue-500'
        }
        frost-transition-colors
      `}
    >
      <div className='frost-flex frost-items-start frost-justify-between frost-mb-2'>
        <div className='frost-flex-1 frost-min-w-0'>
          <h4
            className={`
              frost-font-medium frost-truncate
              ${theme === 'frost_light' ? 'frost-text-gray-900' : 'frost-text-gray-100'}
              ${compact ? 'frost-text-sm' : 'frost-text-base'}
            `}
          >
            {preset.name}
          </h4>
          <div
            className={`
              frost-text-xs frost-mt-1
              ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
            `}
          >
            {preset.layers.length} layers •{' '}
            {new Date(preset.timestamp).toLocaleDateString()}
          </div>
        </div>

        <div className='frost-flex frost-gap-1 frost-ml-2'>
          <button
            onClick={() => onLoad(preset.id)}
            className={`${smallButtonClasses} frost-text-xs`}
            title='Load preset'
          >
            📂
          </button>
          <button
            onClick={() => onDuplicate(preset.id)}
            className={`${smallButtonClasses} frost-text-xs`}
            title='Duplicate preset'
          >
            📋
          </button>
          <button
            onClick={() => onExport(preset.id)}
            className={`${smallButtonClasses} frost-text-xs`}
            title='Export preset'
          >
            💾
          </button>
          <button
            onClick={handleDelete}
            className={`
              ${theme === 'frost_light' ? 'frostlight-button-action-danger-sm' : 'frostdark-button-action-danger-sm'}
              frost-text-xs
            `}
            title='Delete preset'
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Layer preview */}
      <div className='frost-flex frost-gap-1 frost-flex-wrap'>
        {preset.layers.slice(0, 5).map((layer, index) => (
          <span
            key={index}
            className={`
              frost-text-xs frost-px-1 frost-py-0.5 frost-rounded
              ${
                theme === 'frost_light'
                  ? 'frost-bg-blue-100 frost-text-blue-600'
                  : 'frost-bg-blue-900/30 frost-text-blue-300'
              }
            `}
          >
            {layer.type}
          </span>
        ))}
        {preset.layers.length > 5 && (
          <span
            className={`
              frost-text-xs frost-px-1 frost-py-0.5
              ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
            `}
          >
            +{preset.layers.length - 5}
          </span>
        )}
      </div>
    </div>
  );
};

export default TemplateListItem;
