/**
 * NumericInput - Atomic component for numeric input with bounds validation
 * Single Responsibility: Manages numeric input with min/max validation
 */
import React, { useState, useEffect } from 'react';

export interface NumericInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  theme: 'frost_light' | 'frost_dark';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  suffix?: string;
  disabled?: boolean;
  className?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  label,
  value,
  onChange,
  theme,
  min = -Infinity,
  max = Infinity,
  step = 1,
  precision = 0,
  suffix = '',
  disabled = false,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(
    precision > 0 ? value.toFixed(precision) : value.toString()
  );

  useEffect(() => {
    setDisplayValue(
      precision > 0 ? value.toFixed(precision) : value.toString()
    );
  }, [value, precision]);

  const inputClass = `
    frost-w-full frost-text-sm
    ${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}
  `;

  const labelClass = `
    frost-block frost-text-sm frost-font-medium frost-mb-1
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
  };

  const handleBlur = () => {
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      const roundedValue =
        precision > 0
          ? Math.round(clampedValue * Math.pow(10, precision)) /
            Math.pow(10, precision)
          : Math.round(clampedValue);

      onChange(roundedValue);
      setDisplayValue(
        precision > 0
          ? roundedValue.toFixed(precision)
          : roundedValue.toString()
      );
    } else {
      // Reset to current value if invalid
      setDisplayValue(
        precision > 0 ? value.toFixed(precision) : value.toString()
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className={`numeric-input ${className}`}>
      <label className={labelClass}>
        {label} {suffix && `(${suffix})`}
      </label>
      <input
        type='number'
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClass}
        style={{ padding: '4px 6px' }}
      />
    </div>
  );
};

export default NumericInput;
