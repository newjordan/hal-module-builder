/**
 * FrequencySettings - Grouped audio frequency and analysis controls
 * Single Responsibility: Manages frequency range, bands, and sensitivity settings
 */
import React from 'react';
import EditableNumericValue from '../../EditableNumericValue';
import PropertyRow from '../../PropertyRow';
import type { SelectOption } from '../controls';

import { SelectControl, SliderControl } from '../controls';

export interface FrequencySettingsProps {
  frequencyRange: 'bass' | 'mid' | 'treble' | 'full';
  barCount: number;
  sensitivity?: number;
  onFrequencyRangeChange: (range: string) => void;
  onBarCountChange: (count: number) => void;
  onSensitivityChange?: (sensitivity: number) => void;
  theme: 'frost_light' | 'frost_dark';
  showSensitivity?: boolean;
  minBarCount?: number;
  maxBarCount?: number;
  className?: string;
}

const FREQUENCY_RANGE_OPTIONS: SelectOption[] = [
  { value: 'bass', label: 'Bass (20-250 Hz)' },
  { value: 'mid', label: 'Mid (250-4000 Hz)' },
  { value: 'treble', label: 'Treble (4000+ Hz)' },
  { value: 'full', label: 'Full Spectrum' },
];

export const FrequencySettings: React.FC<FrequencySettingsProps> = ({
  frequencyRange,
  barCount,
  sensitivity,
  onFrequencyRangeChange,
  onBarCountChange,
  onSensitivityChange,
  theme,
  showSensitivity = false,
  minBarCount = 8,
  maxBarCount = 128,
}) => {
  return (
    <>
      <PropertyRow label='Frequency Range'>
        <SelectControl
          label='Frequency Range'
          value={frequencyRange}
          options={FREQUENCY_RANGE_OPTIONS}
          onChange={onFrequencyRangeChange}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Bar Count:
            <EditableNumericValue
              value={barCount}
              onChange={onBarCountChange}
              min={minBarCount}
              max={maxBarCount}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Bar Count'
          value={barCount}
          min={minBarCount}
          max={maxBarCount}
          step={8}
          onChange={onBarCountChange}
          theme={theme}
          editableValue={false}
          hideLabel={true}
        />
      </PropertyRow>

      {showSensitivity && onSensitivityChange && sensitivity !== undefined && (
        <PropertyRow
          label={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Sensitivity:
              <EditableNumericValue
                value={sensitivity}
                onChange={onSensitivityChange}
                min={0.1}
                max={3}
                precision={1}
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Sensitivity'
            value={sensitivity}
            min={0.1}
            max={3}
            step={0.1}
            onChange={onSensitivityChange}
            theme={theme}
            precision={1}
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>
      )}
    </>
  );
};

export default FrequencySettings;
