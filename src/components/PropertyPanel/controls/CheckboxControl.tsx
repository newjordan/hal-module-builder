/**
 * CheckboxControl - Atomic component for boolean toggles with description
 * Single Responsibility: Manages checkbox input with label and optional description
 */
import React from 'react';

export interface CheckboxControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  theme: 'frost_light' | 'frost_dark';
  description?: string;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}

export const CheckboxControl: React.FC<CheckboxControlProps> = ({
  label,
  checked,
  onChange,
  theme,
  description,
  disabled = false,
  className = '',
  hideLabel = false,
}) => {
  const labelClass = `
    frost-text-sm frost-font-medium
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const descriptionClass = `
    frost-text-xs frost-ml-6
    ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
  `;

  return (
    <div className={`checkbox-control ${className}`}>
      <div className='frost-flex frost-items-center frost-gap-2'>
        <input
          type='checkbox'
          checked={checked}
          onChange={e => {
            const next = e.target.checked;
            try {
              console.debug('[UI][CheckboxControl] onChange', {
                label,
                checked: next,
              });
            } catch {}
            onChange(next);
          }}
          disabled={disabled}
          className='frost-rounded'
          aria-label={hideLabel ? label : undefined}
        />
        {!hideLabel && <span className={labelClass}>{label}</span>}
      </div>
      {!hideLabel && description && (
        <div className={descriptionClass}>{description}</div>
      )}
    </div>
  );
};

export default CheckboxControl;
