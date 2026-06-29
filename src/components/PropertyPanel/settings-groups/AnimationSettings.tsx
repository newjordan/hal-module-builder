/**
 * AnimationSettings - Grouped animation and responsiveness controls
 * Single Responsibility: Manages all animation-related settings
 */
import React from 'react';
import EditableNumericValue from '../../EditableNumericValue';
import PropertyRow from '../../PropertyRow';
import { SelectControl, SliderControl } from '../controls';

import type { SelectOption } from '../controls';

export interface AnimationSettingsProps {
  responseSpeed: number;
  smoothing?: number | undefined;
  pulseMode: 'none' | 'subtle' | 'strong';
  onResponseSpeedChange: (speed: number) => void;
  onSmoothingChange?: ((smoothing: number) => void) | undefined;
  onPulseModeChange: (mode: string) => void;
  theme: 'frost_light' | 'frost_dark';
  showSmoothing?: boolean | undefined;
  className?: string | undefined;
}

const PULSE_MODE_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'strong', label: 'Strong' },
];

export const AnimationSettings: React.FC<AnimationSettingsProps> = ({
  responseSpeed,
  smoothing,
  pulseMode,
  onResponseSpeedChange,
  onSmoothingChange,
  onPulseModeChange,
  theme,
  showSmoothing = false,
}) => {
  return (
    <>
      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Response Speed:
            <EditableNumericValue
              value={responseSpeed}
              onChange={onResponseSpeedChange}
              min={0.1}
              max={3}
              precision={2}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Response Speed'
          value={responseSpeed}
          min={0.1}
          max={3}
          step={0.1}
          onChange={onResponseSpeedChange}
          theme={theme}
          precision={2}
          editableValue={false}
          hideLabel={true}
        />
      </PropertyRow>

      {showSmoothing && onSmoothingChange && smoothing !== undefined && (
        <PropertyRow
          label={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Smoothing:
              <EditableNumericValue
                value={smoothing}
                onChange={onSmoothingChange}
                min={0}
                max={1}
                precision={2}
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Smoothing'
            value={smoothing}
            min={0}
            max={1}
            step={0.05}
            onChange={onSmoothingChange}
            theme={theme}
            precision={2}
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      <PropertyRow label='Pulse Mode'>
        <SelectControl
          label='Pulse Mode'
          value={pulseMode}
          options={PULSE_MODE_OPTIONS}
          onChange={onPulseModeChange}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>
    </>
  );
};

export default AnimationSettings;
