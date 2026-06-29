/**
 * SaveTemplateDialog - Dialog for saving current layers as a template
 */
import React from 'react';

interface SaveTemplateDialogProps {
  theme: 'frost_light' | 'frost_dark';
  isVisible: boolean;
  presetName: string;
  isLoading: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  compact?: boolean;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  theme,
  isVisible,
  presetName,
  isLoading,
  onNameChange,
  onSave,
  onCancel,
  compact = false,
}) => {
  const inputClasses = `
    ${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}
    ${compact ? 'frost-text-sm' : ''}
  `;

  const smallButtonClasses = `
    ${theme === 'frost_light' ? 'frostlight-button-action-sm' : 'frostdark-button-action-sm'}
  `;

  if (!isVisible) return null;

  return (
    <div
      className={`
        frost-p-2 frost-rounded frost-border
        ${
          theme === 'frost_light'
            ? 'frost-bg-white frost-border-gray-200'
            : 'frost-bg-gray-800 frost-border-gray-600'
        }
      `}
    >
      <input
        type='text'
        value={presetName}
        onChange={e => onNameChange(e.target.value)}
        placeholder='Enter preset name...'
        className={`frost-w-full frost-mb-2 ${inputClasses}`}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
      />
      <div className='frost-flex frost-gap-2'>
        <button
          onClick={onSave}
          disabled={!presetName.trim() || isLoading}
          className={`frost-flex-1 ${smallButtonClasses} ${!presetName.trim() ? 'frost-opacity-50' : ''}`}
        >
          {isLoading ? '💾 Saving...' : '✅ Save'}
        </button>
        <button
          onClick={onCancel}
          className={`frost-flex-1 ${smallButtonClasses}`}
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
};

export default SaveTemplateDialog;
