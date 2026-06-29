/**
 * ColorPicker - Atomic component for color selection
 * Single Responsibility: Manages color input with label
 */
import React from 'react';

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  theme: 'frost_light' | 'frost_dark';
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  theme,
  disabled = false,
  className = '',
  hideLabel = false,
}) => {
  const labelClass = `
    frost-block frost-text-sm frost-font-medium frost-mb-1
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  return (
    <div className={`color-picker ${className}`}>
      {!hideLabel && <label className={labelClass}>{label}</label>}
      <input
        type='color'
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className='frost-w-full frost-h-8 frost-rounded frost-border-0'
        aria-label={hideLabel ? label : undefined}
      />
    </div>
  );
};

export default ColorPicker;
