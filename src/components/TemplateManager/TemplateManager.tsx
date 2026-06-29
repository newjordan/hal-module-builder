/**
 * TemplateManager Component - Template/preset browser and management
 * Refactored into sub-components for maintainability and size compliance
 */
import React, { useState } from 'react';
import { useTemplate } from '../../hooks/useTemplate';
import { Layer, Preset } from '../../types/layer-types';
import { TemplateControls } from './TemplateControls';
import { TemplateList } from './TemplateList';

export interface TemplateManagerProps {
  theme: 'frost_light' | 'frost_dark';
  currentLayers: Layer[];
  onLoadTemplate: (preset: Preset) => void;
  className?: string;
  compact?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  theme,
  currentLayers,
  onLoadTemplate,
  className = '',
  compact = false,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    presets,
    isLoading,
    error,
    saveCurrentAsPreset,
    loadPreset,
    deletePreset,
    exportPreset,
    importPresetFromFile,
    getPresetStats,
    searchPresets,
    duplicatePreset,
  } = useTemplate({
    onPresetLoad: onLoadTemplate,
    onError: error => console.error('Template error:', error),
  });

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;

    const success = await saveCurrentAsPreset(presetName.trim(), currentLayers);
    if (success) {
      setPresetName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = loadPreset(presetId);
    if (preset) {
      onLoadTemplate(preset);
    }
  };

  const handleExportPreset = (presetId: string) => {
    const jsonString = exportPreset(presetId);
    if (!jsonString) return;

    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const fileName = `hal-preset-${preset.name.replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  };

  const handleImportPreset = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await importPresetFromFile(file);
    if (result.success && result.preset) {
      console.log('Successfully imported preset:', result.preset.name);
    }
  };

  const handleDuplicatePreset = (presetId: string) => {
    const original = presets.find(p => p.id === presetId);
    if (original) {
      duplicatePreset(presetId, `${original.name} (Copy)`);
    }
  };

  const filteredPresets = searchQuery ? searchPresets(searchQuery) : presets;
  const stats = getPresetStats();

  return (
    <div className={`template-manager ${className}`}>
      {/* Header */}
      <div className='frost-mb-4'>
        <div className='frost-flex frost-items-center frost-justify-between frost-mb-2'>
          <h3
            className={`
              frost-font-medium
              ${theme === 'frost_light' ? 'frost-text-gray-900' : 'frost-text-gray-100'}
              ${compact ? 'frost-text-base' : 'frost-text-lg'}
            `}
          >
            Templates
          </h3>

          {stats.count > 0 && (
            <span
              className={`
                frost-text-xs frost-px-2 frost-py-1 frost-rounded
                ${
                  theme === 'frost_light'
                    ? 'frost-bg-gray-100 frost-text-gray-600'
                    : 'frost-bg-gray-700 frost-text-gray-300'
                }
              `}
            >
              {stats.count} presets
            </span>
          )}
        </div>
      </div>

      <TemplateControls
        theme={theme}
        currentLayers={currentLayers}
        showSaveDialog={showSaveDialog}
        presetName={presetName}
        isLoading={isLoading}
        onShowSaveDialog={setShowSaveDialog}
        onPresetNameChange={setPresetName}
        onSavePreset={handleSavePreset}
        onImportPreset={handleImportPreset}
        compact={compact}
      />

      {/* Error Display */}
      {error && (
        <div
          className={`
            frost-p-2 frost-rounded frost-text-sm frost-mb-4
            ${
              theme === 'frost_light'
                ? 'frost-bg-red-50 frost-text-red-700 frost-border frost-border-red-200'
                : 'frost-bg-red-900/20 frost-text-red-300 frost-border frost-border-red-700/50'
            }
          `}
        >
          ⚠️ {error}
        </div>
      )}

      <TemplateList
        theme={theme}
        presets={presets}
        filteredPresets={filteredPresets}
        searchQuery={searchQuery}
        compact={compact}
        onLoadPreset={handleLoadPreset}
        onDuplicatePreset={handleDuplicatePreset}
        onExportPreset={handleExportPreset}
        onDeletePreset={deletePreset}
        onSearchChange={setSearchQuery}
      />

      {/* Storage Stats */}
      {stats.count > 0 && !compact && (
        <div
          className={`
            frost-mt-4 frost-text-xs frost-p-2 frost-rounded
            ${
              theme === 'frost_light'
                ? 'frost-bg-gray-50 frost-text-gray-600'
                : 'frost-bg-gray-800/50 frost-text-gray-400'
            }
          `}
        >
          Storage: {(stats.totalSize / 1024).toFixed(1)}KB used
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
