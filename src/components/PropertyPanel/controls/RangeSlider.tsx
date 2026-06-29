/**
 * RangeSlider - Atomic component for dual-handle range selection
 * Single Responsibility: Manages range input with two handles (min/max)
 */
import React from 'react';

export interface RangeSliderProps {
  label: string;
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (minValue: number, maxValue: number) => void;
  theme: 'frost_light' | 'frost_dark';
  suffix?: string;
  disabled?: boolean;
  className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  minValue,
  maxValue,
  min,
  max,
  step,
  onChange,
  theme,
  suffix = '',
  disabled = false,
  className = '',
}) => {
  const inputClass = `
    frost-w-full frost-text-sm
    ${theme === 'frost_light' ? 'frostlight-input-field' : 'frostdark-input-field'}
  `;

  const labelClass = `
    frost-block frost-text-sm frost-font-medium frost-mb-1
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, maxValue - step);
    onChange(newMin, maxValue);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, minValue + step);
    onChange(minValue, newMax);
  };

  return (
    <div className={`range-slider ${className}`}>
      <div className={labelClass}>
        {label} ({minValue}
        {suffix} - {maxValue}
        {suffix})
      </div>

      <div className='frost-space-y-2'>
        <div>
          <label className='frost-text-xs frost-opacity-75'>Min</label>
          <input
            type='range'
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={e => handleMinChange(parseFloat(e.target.value))}
            disabled={disabled}
            className={inputClass}
          />
        </div>

        <div>
          <label className='frost-text-xs frost-opacity-75'>Max</label>
          <input
            type='range'
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={e => handleMaxChange(parseFloat(e.target.value))}
            disabled={disabled}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
