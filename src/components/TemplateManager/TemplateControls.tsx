/**
 * TemplateControls - Save and Import controls for templates
 */
import React, { useRef } from 'react';
import { SaveTemplateDialog } from './SaveTemplateDialog';

interface TemplateControlsProps {
  theme: 'frost_light' | 'frost_dark';
  currentLayers: any[];
  showSaveDialog: boolean;
  presetName: string;
  isLoading: boolean;
  onShowSaveDialog: (show: boolean) => void;
  onPresetNameChange: (name: string) => void;
  onSavePreset: () => void;
  onImportPreset: (event: React.ChangeEvent<HTMLInputElement>) => void;
  compact?: boolean;
}

export const TemplateControls: React.FC<TemplateControlsProps> = ({
  theme,
  currentLayers,
  showSaveDialog,
  presetName,
  isLoading,
  onShowSaveDialog,
  onPresetNameChange,
  onSavePreset,
  onImportPreset,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buttonClasses = `
    ${theme === 'frost_light' ? 'frostlight-button-action' : 'frostdark-button-action'}
    ${compact ? 'frost-text-sm frost-px-2 frost-py-1' : ''}
  `;

  const handleSaveDialogCancel = () => {
    onShowSaveDialog(false);
    onPresetNameChange('');
  };

  return (
    <div
      className={`
        frost-p-3 frost-rounded frost-mb-4
        ${theme === 'frost_light' ? 'frostlight-standard-glass-card' : 'frostdark-standard-glass-card'}
      `}
    >
      <div className='frost-flex frost-gap-2 frost-mb-2'>
        <button
          onClick={() => onShowSaveDialog(true)}
          disabled={currentLayers.length === 0}
          className={`frost-flex-1 ${buttonClasses} ${currentLayers.length === 0 ? 'frost-opacity-50 frost-cursor-not-allowed' : ''}`}
        >
          💾 Save Current
        </button>

        <label
          className={`frost-flex-1 ${buttonClasses} frost-cursor-pointer frost-text-center`}
        >
          <input
            ref={fileInputRef}
            type='file'
            accept='.json'
            onChange={onImportPreset}
            className='frost-hidden'
          />
          📁 Import
        </label>
      </div>

      <SaveTemplateDialog
        theme={theme}
        isVisible={showSaveDialog}
        presetName={presetName}
        isLoading={isLoading}
        onNameChange={onPresetNameChange}
        onSave={onSavePreset}
        onCancel={handleSaveDialogCancel}
        compact={compact}
      />
    </div>
  );
};

export default TemplateControls;
