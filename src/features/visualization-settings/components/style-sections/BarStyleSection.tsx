/**
 * BarStyleSection - Bar-specific style settings
 * Single Responsibility: Handle bar count, height, width, spacing, orientation, and invert
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import {
  CheckboxControl,
  SelectControl,
  SliderControl,
} from '../../../../components/PropertyPanel/controls';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import type {
  BarStyleSettings,
  RadialOrientation,
  SectionProps,
} from '../../types';
import { BAR_CONSTRAINTS } from '../../utils/settings-schema';

interface BarStyleSectionProps extends SectionProps {
  settings: BarStyleSettings;
}

const RADIAL_ORIENTATION_OPTIONS = [
  { value: 'follow-radius', label: 'Outward (radial)' },
  { value: 'follow-tangent', label: 'Along tangent' },
  { value: 'maintain', label: 'Upright' },
];

export const BarStyleSection: React.FC<BarStyleSectionProps> = ({
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
      {/* Bar Count */}
      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Bar Count:
            <EditableNumericValue
              value={settings.barCount}
              onChange={value => onChange({ barCount: value })}
              min={BAR_CONSTRAINTS.barCount.min}
              max={BAR_CONSTRAINTS.barCount.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Bar Count'
          value={settings.barCount}
          min={BAR_CONSTRAINTS.barCount.min}
          max={BAR_CONSTRAINTS.barCount.max}
          step={BAR_CONSTRAINTS.barCount.step}
          onChange={value => onChange({ barCount: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Bar Height */}
      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Bar Height:
            <EditableNumericValue
              value={settings.barHeight}
              onChange={value => onChange({ barHeight: value })}
              suffix='px'
              min={BAR_CONSTRAINTS.barHeight.min}
              max={BAR_CONSTRAINTS.barHeight.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Bar Height'
          value={settings.barHeight}
          min={BAR_CONSTRAINTS.barHeight.min}
          max={BAR_CONSTRAINTS.barHeight.max}
          step={BAR_CONSTRAINTS.barHeight.step}
          onChange={value => onChange({ barHeight: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Bar Width */}
      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Bar Width:
            <EditableNumericValue
              value={settings.barWidth}
              onChange={value => onChange({ barWidth: value })}
              suffix='px'
              min={BAR_CONSTRAINTS.barWidth.min}
              max={BAR_CONSTRAINTS.barWidth.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Bar Width'
          value={settings.barWidth}
          min={BAR_CONSTRAINTS.barWidth.min}
          max={BAR_CONSTRAINTS.barWidth.max}
          step={BAR_CONSTRAINTS.barWidth.step}
          onChange={value => onChange({ barWidth: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Bar Spacing */}
      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Bar Spacing:
            <EditableNumericValue
              value={settings.barSpacing}
              onChange={value => onChange({ barSpacing: value })}
              suffix='px'
              min={BAR_CONSTRAINTS.barSpacing.min}
              max={BAR_CONSTRAINTS.barSpacing.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Bar Spacing'
          value={settings.barSpacing}
          min={BAR_CONSTRAINTS.barSpacing.min}
          max={BAR_CONSTRAINTS.barSpacing.max}
          step={BAR_CONSTRAINTS.barSpacing.step}
          onChange={value => onChange({ barSpacing: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Radial Orientation */}
      <PropertyRow label='Radial Orientation'>
        <SelectControl
          label='Radial Orientation'
          value={settings.radialOrientation}
          options={RADIAL_ORIENTATION_OPTIONS}
          onChange={value =>
            onChange({ radialOrientation: value as RadialOrientation })
          }
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      {/* Invert */}
      <PropertyRow label='Invert'>
        <CheckboxControl
          label='Invert'
          checked={settings.invert}
          onChange={checked => {
            try {
              console.debug('[Panel][BarStyleSection] invert toggled', {
                prev: settings.invert,
                next: checked,
              });
            } catch {}
            onChange({ invert: checked });
          }}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>
    </PropertySection>
  );
};

export default BarStyleSection;
