/**
 * SelectControl - Atomic component for dropdown selection with validation
 * Single Responsibility: Manages dropdown selection with options
 */
import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectControlProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  theme: 'frost_light' | 'frost_dark';
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  hideLabel?: boolean;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  label,
  value,
  options,
  onChange,
  theme,
  disabled = false,
  className = '',
  placeholder,
  hideLabel = false,
}) => {
  const inputClass = `
    frost-w-full frost-text-sm property-select
    ${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}
  `;

  const labelClass = `
    frost-block frost-text-sm frost-font-medium frost-mb-1
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  return (
    <div className={`select-control ${className}`}>
      {!hideLabel && <label className={labelClass}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={inputClass}
        style={{ padding: '2px 6px', width: '100%' }}
        aria-label={hideLabel ? label : undefined}
      >
        {placeholder && (
          <option value='' disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectControl;
