/**
 * CircleStyleSection - Circle-specific style settings
 * Single Responsibility: Handle circle count, radius, and spacing
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { SliderControl } from '../../../../components/PropertyPanel/controls';
import { CIRCLE_CONSTRAINTS } from '../../utils/settings-schema';
import type { CircleStyleSettings, SectionProps } from '../../types';

interface CircleStyleSectionProps extends SectionProps {
  settings: CircleStyleSettings;
}

export const CircleStyleSection: React.FC<CircleStyleSectionProps> = ({
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
      {/* Circle Count */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Circle Count:
            <EditableNumericValue
              value={settings.circleCount}
              onChange={value => onChange({ circleCount: value })}
              min={CIRCLE_CONSTRAINTS.circleCount.min}
              max={CIRCLE_CONSTRAINTS.circleCount.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Circle Count'
          value={settings.circleCount}
          min={CIRCLE_CONSTRAINTS.circleCount.min}
          max={CIRCLE_CONSTRAINTS.circleCount.max}
          step={CIRCLE_CONSTRAINTS.circleCount.step}
          onChange={value => onChange({ circleCount: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Circle Radius */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Circle Radius:
            <EditableNumericValue
              value={settings.circleRadius}
              onChange={value => onChange({ circleRadius: value })}
              suffix='px'
              min={CIRCLE_CONSTRAINTS.circleRadius.min}
              max={CIRCLE_CONSTRAINTS.circleRadius.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Circle Radius'
          value={settings.circleRadius}
          min={CIRCLE_CONSTRAINTS.circleRadius.min}
          max={CIRCLE_CONSTRAINTS.circleRadius.max}
          step={CIRCLE_CONSTRAINTS.circleRadius.step}
          onChange={value => onChange({ circleRadius: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Circle Spacing */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Circle Spacing:
            <EditableNumericValue
              value={settings.circleSpacing}
              onChange={value => onChange({ circleSpacing: value })}
              suffix='px'
              min={CIRCLE_CONSTRAINTS.circleSpacing.min}
              max={CIRCLE_CONSTRAINTS.circleSpacing.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Circle Spacing'
          value={settings.circleSpacing}
          min={CIRCLE_CONSTRAINTS.circleSpacing.min}
          max={CIRCLE_CONSTRAINTS.circleSpacing.max}
          step={CIRCLE_CONSTRAINTS.circleSpacing.step}
          onChange={value => onChange({ circleSpacing: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default CircleStyleSection;

