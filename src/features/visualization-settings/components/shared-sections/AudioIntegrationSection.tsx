/**
 * AudioIntegrationSection - Audio integration settings
 * Single Responsibility: Handle response speed and pulse mode settings
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { SelectControl, SliderControl } from '../../../../components/PropertyPanel/controls';
import { COMMON_CONSTRAINTS } from '../../utils/settings-schema';
import type { PulseMode, SectionProps } from '../../types';

interface AudioIntegrationSectionProps extends SectionProps {
  settings: {
    responseSpeed: number;
    pulseMode: PulseMode;
  };
}

const PULSE_MODE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'strong', label: 'Strong' },
];

export const AudioIntegrationSection: React.FC<AudioIntegrationSectionProps> = ({
  settings,
  onChange,
  theme,
  className = '',
}) => {
  return (
    <PropertySection
      title='Audio Integration'
      collapsible={true}
      defaultExpanded={true}
      theme={theme}
      className={className}
    >
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Response Speed:
            <EditableNumericValue
              value={settings.responseSpeed}
              onChange={value => onChange({ responseSpeed: value })}
              min={COMMON_CONSTRAINTS.responseSpeed.min}
              max={COMMON_CONSTRAINTS.responseSpeed.max}
              precision={1}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Response Speed'
          value={settings.responseSpeed}
          min={COMMON_CONSTRAINTS.responseSpeed.min}
          max={COMMON_CONSTRAINTS.responseSpeed.max}
          step={COMMON_CONSTRAINTS.responseSpeed.step}
          onChange={value => onChange({ responseSpeed: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      <PropertyRow label='Pulse Mode'>
        <SelectControl
          label='Pulse Mode'
          value={settings.pulseMode}
          options={PULSE_MODE_OPTIONS}
          onChange={value => onChange({ pulseMode: value as PulseMode })}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default AudioIntegrationSection;

