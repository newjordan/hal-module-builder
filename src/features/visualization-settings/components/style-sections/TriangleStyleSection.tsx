/**
 * TriangleStyleSection - Triangle-specific style settings
 * Single Responsibility: Handle triangle count, size, spacing, and orientation
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { SelectControl, SliderControl } from '../../../../components/PropertyPanel/controls';
import { TRIANGLE_CONSTRAINTS } from '../../utils/settings-schema';
import type { SectionProps, TriangleStyleSettings } from '../../types';

interface TriangleStyleSectionProps extends SectionProps {
  settings: TriangleStyleSettings;
}

const TRIANGLE_ORIENTATION_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'alternating', label: 'Alternating' },
];

export const TriangleStyleSection: React.FC<TriangleStyleSectionProps> = ({
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
      {/* Triangle Count */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Triangle Count:
            <EditableNumericValue
              value={settings.triangleCount}
              onChange={value => onChange({ triangleCount: value })}
              min={TRIANGLE_CONSTRAINTS.triangleCount.min}
              max={TRIANGLE_CONSTRAINTS.triangleCount.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Triangle Count'
          value={settings.triangleCount}
          min={TRIANGLE_CONSTRAINTS.triangleCount.min}
          max={TRIANGLE_CONSTRAINTS.triangleCount.max}
          step={TRIANGLE_CONSTRAINTS.triangleCount.step}
          onChange={value => onChange({ triangleCount: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Triangle Size */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Triangle Size:
            <EditableNumericValue
              value={settings.triangleSize}
              onChange={value => onChange({ triangleSize: value })}
              suffix='px'
              min={TRIANGLE_CONSTRAINTS.triangleSize.min}
              max={TRIANGLE_CONSTRAINTS.triangleSize.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Triangle Size'
          value={settings.triangleSize}
          min={TRIANGLE_CONSTRAINTS.triangleSize.min}
          max={TRIANGLE_CONSTRAINTS.triangleSize.max}
          step={TRIANGLE_CONSTRAINTS.triangleSize.step}
          onChange={value => onChange({ triangleSize: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Triangle Spacing */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Triangle Spacing:
            <EditableNumericValue
              value={settings.triangleSpacing}
              onChange={value => onChange({ triangleSpacing: value })}
              suffix='px'
              min={TRIANGLE_CONSTRAINTS.triangleSpacing.min}
              max={TRIANGLE_CONSTRAINTS.triangleSpacing.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Triangle Spacing'
          value={settings.triangleSpacing}
          min={TRIANGLE_CONSTRAINTS.triangleSpacing.min}
          max={TRIANGLE_CONSTRAINTS.triangleSpacing.max}
          step={TRIANGLE_CONSTRAINTS.triangleSpacing.step}
          onChange={value => onChange({ triangleSpacing: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Triangle Orientation */}
      <PropertyRow label='Triangle Orientation'>
        <SelectControl
          label='Triangle Orientation'
          value={settings.triangleOrientation}
          options={TRIANGLE_ORIENTATION_OPTIONS}
          onChange={value => onChange({ triangleOrientation: value as 'up' | 'down' | 'alternating' })}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default TriangleStyleSection;

