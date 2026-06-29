/**
 * DotStyleSection - Dot-specific style settings
 * Single Responsibility: Handle dot count, size, spacing, and pulsing effect
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { CheckboxControl, SliderControl } from '../../../../components/PropertyPanel/controls';
import { DOT_CONSTRAINTS } from '../../utils/settings-schema';
import type { DotStyleSettings, SectionProps } from '../../types';

interface DotStyleSectionProps extends SectionProps {
  settings: DotStyleSettings;
}

export const DotStyleSection: React.FC<DotStyleSectionProps> = ({
  settings,
  onChange,
  theme,
  className = '',
}) => {
  return (
    <PropertySection
      title='Style'
      collapsible={true}
      defaultExpanded={true}
      theme={theme}
      className={className}
    >
      {/* Dot Count */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Dot Count:
            <EditableNumericValue
              value={settings.dotCount}
              onChange={value => onChange({ dotCount: value })}
              min={DOT_CONSTRAINTS.dotCount.min}
              max={DOT_CONSTRAINTS.dotCount.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Dot Count'
          value={settings.dotCount}
          min={DOT_CONSTRAINTS.dotCount.min}
          max={DOT_CONSTRAINTS.dotCount.max}
          step={DOT_CONSTRAINTS.dotCount.step}
          onChange={value => onChange({ dotCount: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Dot Size */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Dot Size:
            <EditableNumericValue
              value={settings.dotSize}
              onChange={value => onChange({ dotSize: value })}
              suffix='px'
              min={DOT_CONSTRAINTS.dotSize.min}
              max={DOT_CONSTRAINTS.dotSize.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Dot Size'
          value={settings.dotSize}
          min={DOT_CONSTRAINTS.dotSize.min}
          max={DOT_CONSTRAINTS.dotSize.max}
          step={DOT_CONSTRAINTS.dotSize.step}
          onChange={value => onChange({ dotSize: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Dot Spacing */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Dot Spacing:
            <EditableNumericValue
              value={settings.dotSpacing}
              onChange={value => onChange({ dotSpacing: value })}
              suffix='px'
              min={DOT_CONSTRAINTS.dotSpacing.min}
              max={DOT_CONSTRAINTS.dotSpacing.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Dot Spacing'
          value={settings.dotSpacing}
          min={DOT_CONSTRAINTS.dotSpacing.min}
          max={DOT_CONSTRAINTS.dotSpacing.max}
          step={DOT_CONSTRAINTS.dotSpacing.step}
          onChange={value => onChange({ dotSpacing: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Pulsing Effect */}
      {settings.pulsingEffect !== undefined && (
        <PropertyRow label='Pulsing Effect'>
          <CheckboxControl
            label='Pulsing Effect'
            checked={settings.pulsingEffect}
            onChange={checked => onChange({ pulsingEffect: checked })}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}
    </PropertySection>
  );
};

export default DotStyleSection;

