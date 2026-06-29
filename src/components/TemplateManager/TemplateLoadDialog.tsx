/**
 * TemplateLoadDialog Component - Template/Preset load dialog
 *
 * Extracted from HalModuleBuilder.tsx to provide modular template loading functionality.
 * Handles preset browsing, loading, deletion, export, and import operations.
 */

import React, { useRef, useState } from 'react';
import { TemplateLoadDialogProps } from './TemplateManager.types';
import { Preset } from '../../types/layer-types';

export const TemplateLoadDialog: React.FC<TemplateLoadDialogProps> = ({
  presets,
  isOpen,
  isLoading = false,
  onLoad,
  onDelete,
  onExport,
  onImport,
  onClose,
  onOpen,
  showAdvancedOptions = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Get current theme
  const theme = document.documentElement.classList.contains('frost_dark')
    ? 'frost_dark'
    : 'frost_light';

  // Theme classes
  const themeClasses = {
    dialog:
      theme === 'frost_dark'
        ? 'frostdark-dialog frostdark-card-primary'
        : 'frostlight-dialog frostlight-card-primary',
    card:
      theme === 'frost_dark'
        ? 'frostdark-standard-glass-card'
        : 'frostlight-standard-glass-card',
    buttonPrimary:
      theme === 'frost_dark'
        ? 'frostdark-button-action frostdark-button-action-sm'
        : 'frostlight-button-action frostlight-button-action-sm',
    buttonSecondary:
      theme === 'frost_dark'
        ? 'frostdark-button-secondary frostdark-button-secondary-sm'
        : 'frostlight-button-secondary frostlight-button-secondary-sm',
    buttonDanger:
      theme === 'frost_dark'
        ? 'frostdark-button-action-danger frostdark-button-action-sm'
        : 'frostlight-button-action-danger frostlight-button-action-sm',
    textPrimary: 'frost-text-primary',
    textSecondary: 'frost-text-secondary',
    textError: 'frost-text-error',
  };

  // Handle preset load
  const handleLoadPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    onLoad(preset);
  };

  // Handle preset delete with confirmation
  const handleDeletePreset = (presetId: string, _presetName: string) => {
    if (showDeleteConfirm === presetId) {
      onDelete(presetId);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(presetId);
    }
  };

  // Handle preset export
  const handleExportPreset = (preset: Preset) => {
    onExport(preset);
  };

  // Handle import file selection
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onImport(event);
    // Reset file input to allow re-importing the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle dialog toggle
  const handleToggleDialog = () => {
    if (isOpen) {
      onClose();
      setShowDeleteConfirm(null);
    } else {
      onOpen?.();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleToggleDialog}
        className={themeClasses.buttonPrimary}
        disabled={presets.length === 0}
        title={
          presets.length === 0 ? 'No presets available' : 'Load saved presets'
        }
      >
        📁 Load Preset ({presets.length})
      </button>
    );
  }

  return (
    <div className='template-load-dialog'>
      <div className={`frost-relative ${themeClasses.dialog}`}>
        <div className='frost-p-4'>
          <h3 className={`${themeClasses.textPrimary} frost-mb-3`}>
            📁 Load Preset
          </h3>

          {/* Import Section */}
          {showAdvancedOptions && (
            <div className='frost-mb-4 frost-border-b frost-pb-3'>
              <div className='frost-flex frost-gap-2 frost-items-center'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.json'
                  onChange={handleFileChange}
                  className='frost-hidden'
                />

                <button
                  onClick={handleImportClick}
                  className={themeClasses.buttonSecondary}
                  disabled={isLoading}
                >
                  📤 Import
                </button>

                <span className={`${themeClasses.textSecondary} frost-text-sm`}>
                  Import preset from file
                </span>
              </div>
            </div>
          )}

          {/* Presets List */}
          <div className='frost-mb-4'>
            <div
              className={`${themeClasses.textSecondary} frost-text-sm frost-mb-2`}
            >
              Available Presets ({presets.length})
            </div>

            {presets.length === 0 ? (
              <div
                className={`${themeClasses.textSecondary} frost-text-center frost-py-8`}
              >
                📭 No presets saved yet
                <div className='frost-text-xs frost-mt-1'>
                  Save your first preset to see it here
                </div>
              </div>
            ) : (
              <div className='frost-flex frost-flex-col frost-gap-1 frost-max-h-64 frost-overflow-y-auto'>
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`frost-flex frost-items-center frost-gap-1 frost-p-2 ${themeClasses.card} ${
                      selectedPreset?.id === preset.id
                        ? 'frost-ring-2 frost-ring-blue-500'
                        : ''
                    }`}
                  >
                    {/* Preset Info */}
                    <div className='frost-flex-1 frost-min-w-0'>
                      <button
                        onClick={() => handleLoadPreset(preset)}
                        disabled={isLoading}
                        className={`frost-w-full frost-text-left ${themeClasses.buttonPrimary}`}
                      >
                        <div
                          className={`${themeClasses.textPrimary} frost-font-medium frost-truncate`}
                        >
                          {preset.name}
                        </div>
                        <div
                          className={`${themeClasses.textSecondary} frost-text-xs`}
                        >
                          {preset.layers.length} layers •{' '}
                          {formatDate(preset.timestamp)}
                        </div>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    {showAdvancedOptions && (
                      <div className='frost-flex frost-gap-1'>
                        {/* Export Button */}
                        <button
                          onClick={() => handleExportPreset(preset)}
                          disabled={isLoading}
                          className={themeClasses.buttonSecondary}
                          title='Export preset to file'
                        >
                          ↓
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() =>
                            handleDeletePreset(preset.id, preset.name)
                          }
                          disabled={isLoading}
                          className={
                            showDeleteConfirm === preset.id
                              ? themeClasses.buttonDanger
                              : themeClasses.buttonSecondary
                          }
                          title={
                            showDeleteConfirm === preset.id
                              ? 'Click again to confirm delete'
                              : 'Delete preset'
                          }
                        >
                          {showDeleteConfirm === preset.id ? '✓ Delete' : '×'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='frost-flex frost-gap-2 frost-justify-end'>
            <button
              onClick={onClose}
              disabled={isLoading}
              className={themeClasses.buttonSecondary}
            >
              Close
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div
              className={`${themeClasses.textSecondary} frost-text-center frost-text-sm frost-mt-2`}
            >
              ⏳ Loading preset...
            </div>
          )}

          {/* Usage Tips */}
          {presets.length > 0 && (
            <div
              className={`${themeClasses.textSecondary} frost-text-xs frost-mt-3 frost-border-t frost-pt-2`}
            >
              <strong>💡 Tips:</strong>
              <ul className='frost-mt-1 frost-ml-4'>
                <li>• Click preset name to load</li>
                <li>• Use ↓ to export preset to file</li>
                <li>• Use × to delete (click twice to confirm)</li>
                <li>• Import presets from .json files</li>
              </ul>
            </div>
          )}

          {/* Delete confirmation warning */}
          {showDeleteConfirm && (
            <div
              className={`${themeClasses.textError} frost-text-xs frost-mt-2 frost-border-t frost-pt-2`}
            >
              ⚠️ Click delete again to permanently remove preset. This cannot be
              undone.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateLoadDialog;
