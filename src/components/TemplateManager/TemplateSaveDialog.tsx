/**
 * TemplateSaveDialog Component - Template/Preset save dialog
 *
 * Extracted from HalModuleBuilder.tsx to provide modular template saving functionality.
 * Handles template name input, validation, and save operations.
 */

import React, { useState, useEffect } from 'react';
import { TemplateSaveDialogProps } from './TemplateManager.types';

export const TemplateSaveDialog: React.FC<TemplateSaveDialogProps> = ({
  presetName,
  layers,
  isOpen,
  isSaving = false,
  onPresetNameChange,
  onSave,
  onClose,
  onOpen,
  validateName,
}) => {
  const [localPresetName, setLocalPresetName] = useState(presetName);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update local name when prop changes
  useEffect(() => {
    setLocalPresetName(presetName);
  }, [presetName]);

  // Validate name when it changes
  useEffect(() => {
    if (validateName && localPresetName.trim()) {
      const error = validateName(localPresetName.trim());
      setValidationError(error);
    } else {
      setValidationError(null);
    }
  }, [localPresetName, validateName]);

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
    input:
      theme === 'frost_dark'
        ? 'frostdark-input-field'
        : 'frostlight-input-field',
    buttonPrimary:
      theme === 'frost_dark'
        ? 'frostdark-button-action frostdark-button-action-sm'
        : 'frostlight-button-action frostlight-button-action-sm',
    buttonSecondary:
      theme === 'frost_dark'
        ? 'frostdark-button-secondary frostdark-button-secondary-sm'
        : 'frostlight-button-secondary frostlight-button-secondary-sm',
    textPrimary: 'frost-text-primary',
    textSecondary: 'frost-text-secondary',
    textError: 'frost-text-error',
  };

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalPresetName(newName);
    onPresetNameChange(newName);
  };

  // Handle save
  const handleSave = () => {
    const trimmedName = localPresetName.trim();

    if (!trimmedName) {
      setValidationError('Preset name is required');
      return;
    }

    if (validationError) {
      return; // Don't save if there's a validation error
    }

    onSave(trimmedName);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !validationError && localPresetName.trim()) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle dialog toggle
  const handleToggleDialog = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen?.();
    }
  };

  // Get layer count for display
  const layerCount = layers.length;
  const visibleLayerCount = layers.filter(layer => layer.visible).length;

  if (!isOpen) {
    return (
      <button
        onClick={handleToggleDialog}
        className={themeClasses.buttonPrimary}
        disabled={layerCount === 0}
        title={
          layerCount === 0
            ? 'No layers to save'
            : 'Save current layers as preset'
        }
      >
        💾 Save Preset
      </button>
    );
  }

  return (
    <div className='template-save-dialog'>
      {/* Save Preset Button (when closed) */}
      <div className={`frost-relative ${themeClasses.dialog}`}>
        <div className='frost-p-4'>
          <h3 className={`${themeClasses.textPrimary} frost-mb-3`}>
            💾 Save Preset
          </h3>

          {/* Layer Info */}
          <div
            className={`${themeClasses.textSecondary} frost-text-sm frost-mb-3`}
          >
            <div>Total layers: {layerCount}</div>
            <div>Visible layers: {visibleLayerCount}</div>
          </div>

          {/* Preset Name Input */}
          <div className='frost-mb-3'>
            <label
              className={`${themeClasses.textSecondary} frost-text-sm frost-mb-1 frost-block`}
            >
              Preset Name:
            </label>
            <input
              type='text'
              value={localPresetName}
              onChange={handleNameChange}
              onKeyDown={handleKeyPress}
              placeholder='Enter preset name...'
              className={`frost-w-full ${themeClasses.input}`}
              disabled={isSaving}
              autoFocus
              maxLength={50}
            />

            {/* Validation Error */}
            {validationError && (
              <div
                className={`${themeClasses.textError} frost-text-xs frost-mt-1`}
              >
                ⚠️ {validationError}
              </div>
            )}

            {/* Character count */}
            <div
              className={`${themeClasses.textSecondary} frost-text-xs frost-mt-1`}
            >
              {localPresetName.length}/50 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className='frost-flex frost-gap-2'>
            <button
              onClick={handleSave}
              disabled={
                !localPresetName.trim() || !!validationError || isSaving
              }
              className={`frost-flex-1 ${themeClasses.buttonPrimary}`}
            >
              {isSaving ? '⏳ Saving...' : '💾 Save'}
            </button>

            <button
              onClick={onClose}
              disabled={isSaving}
              className={themeClasses.buttonSecondary}
            >
              Cancel
            </button>
          </div>

          {/* Save Tips */}
          <div
            className={`${themeClasses.textSecondary} frost-text-xs frost-mt-3 frost-border-t frost-pt-2`}
          >
            <strong>💡 Tips:</strong>
            <ul className='frost-mt-1 frost-ml-4'>
              <li>• Use descriptive names for easy identification</li>
              <li>• All {layerCount} layers will be saved</li>
              <li>• Layer visibility and properties are preserved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSaveDialog;
