/**
 * TemplateList - List of templates with search and empty states
 */
import React from 'react';
import { Preset } from '../../types/layer-types';
import { TemplateListItem } from './TemplateListItem';

interface TemplateListProps {
  theme: 'frost_light' | 'frost_dark';
  presets: Preset[];
  filteredPresets: Preset[];
  searchQuery: string;
  compact?: boolean;
  onLoadPreset: (presetId: string) => void;
  onDuplicatePreset: (presetId: string) => void;
  onExportPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
  onSearchChange: (query: string) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  theme,
  presets,
  filteredPresets,
  searchQuery,
  compact = false,
  onLoadPreset,
  onDuplicatePreset,
  onExportPreset,
  onDeletePreset,
  onSearchChange,
}) => {
  const inputClasses = `
    ${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}
    ${compact ? 'frost-text-sm' : ''}
  `;

  return (
    <div className='template-list'>
      {/* Search */}
      {presets.length > 3 && (
        <div className='frost-mb-3'>
          <input
            type='text'
            placeholder='Search templates...'
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className={`frost-w-full ${inputClasses}`}
          />
        </div>
      )}

      {/* Preset List */}
      <div className='preset-list'>
        {filteredPresets.length === 0 ? (
          <div
            className={`
              frost-py-8 frost-text-center
              ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
            `}
          >
            <div className='frost-mb-2 frost-text-2xl'>
              {searchQuery ? '🔍' : '📂'}
            </div>
            <div className='frost-text-sm'>
              {searchQuery ? 'No templates found' : 'No templates saved yet'}
            </div>
            <div className='frost-text-xs frost-mt-1'>
              {searchQuery
                ? 'Try a different search term'
                : 'Save your current layer setup as a template'}
            </div>
          </div>
        ) : (
          <div className='frost-space-y-2'>
            {filteredPresets.map(preset => (
              <TemplateListItem
                key={preset.id}
                theme={theme}
                preset={preset}
                compact={compact}
                onLoad={onLoadPreset}
                onDuplicate={onDuplicatePreset}
                onExport={onExportPreset}
                onDelete={onDeletePreset}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateList;
