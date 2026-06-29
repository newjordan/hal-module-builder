/**
 * SliderControl - Atomic component for slider inputs with label and value display
 * Single Responsibility: Manages one slider input with optional editable value
 */
import React from 'react';
import EditableNumericValue from '../../EditableNumericValue';

export interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  theme: 'frost_light' | 'frost_dark';
  suffix?: string;
  precision?: number;
  editableValue?: boolean;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  theme,
  suffix = '',
  precision = 0,
  editableValue = true,
  disabled = false,
  className = '',
  hideLabel = false,
}) => {
  const inputClass =
    theme === 'frost_light'
      ? 'frostlight-input-field property-slider'
      : 'frostdark-input-field property-slider';

  const labelClass = `
    frost-block frost-text-sm frost-font-medium frost-mb-1
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const safeValue = Number.isFinite(value)
    ? value
    : Number.isFinite(min)
      ? min
      : 0;
  const displayValue =
    precision > 0 ? safeValue.toFixed(precision) : Math.round(safeValue);

  return (
    <div className={`slider-control ${className}`}>
      {!hideLabel && (
        <div className={labelClass}>
          {editableValue ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {label}:
              <EditableNumericValue
                value={value}
                onChange={onChange}
                suffix={suffix}
                min={min}
                max={max}
                precision={precision}
                theme={theme}
                style={{
                  fontWeight: 'bold',
                  flex: 'none',
                  alignSelf: 'center',
                }}
              />
            </span>
          ) : (
            `${label} (${displayValue}${suffix})`
          )}
        </div>
      )}
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={e => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`${inputClass} frost-w-full`}
        aria-label={hideLabel ? label : undefined}
      />
    </div>
  );
};

export default SliderControl;
