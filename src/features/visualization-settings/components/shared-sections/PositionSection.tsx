/**
 * PositionSection - Position and spatial settings
 * Single Responsibility: Handle position, rotation, and radial settings
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import { CheckboxControl, SliderControl } from '../../../../components/PropertyPanel/controls';
import { COMMON_CONSTRAINTS } from '../../utils/settings-schema';
import type { SectionProps } from '../../types';

interface PositionSectionProps extends SectionProps {
  settings: {
    positionX: number;
    positionY: number;
    rotation: number;
    innerRadius: number;
    showRadialPath: boolean;
    enablePartialArc: boolean;
    startAngle?: number;
    endAngle?: number;
  };
}

export const PositionSection: React.FC<PositionSectionProps> = ({
  settings,
  onChange,
  theme,
  className = '',
}) => {
  return (
    <PropertySection
      title='Position'
      collapsible={true}
      defaultExpanded={true}
      theme={theme}
      className={className}
    >
      {/* Position X */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Pos X:
            <EditableNumericValue
              value={settings.positionX}
              onChange={value => onChange({ positionX: value })}
              suffix='%'
              min={COMMON_CONSTRAINTS.positionX.min}
              max={COMMON_CONSTRAINTS.positionX.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Pos X'
          value={settings.positionX}
          min={COMMON_CONSTRAINTS.positionX.min}
          max={COMMON_CONSTRAINTS.positionX.max}
          step={COMMON_CONSTRAINTS.positionX.step}
          onChange={value => onChange({ positionX: value })}
          theme={theme}
          suffix='%'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Position Y */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Pos Y:
            <EditableNumericValue
              value={settings.positionY}
              onChange={value => onChange({ positionY: value })}
              suffix='%'
              min={COMMON_CONSTRAINTS.positionY.min}
              max={COMMON_CONSTRAINTS.positionY.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Pos Y'
          value={settings.positionY}
          min={COMMON_CONSTRAINTS.positionY.min}
          max={COMMON_CONSTRAINTS.positionY.max}
          step={COMMON_CONSTRAINTS.positionY.step}
          onChange={value => onChange({ positionY: value })}
          theme={theme}
          suffix='%'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Rotation */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Rotation:
            <EditableNumericValue
              value={settings.rotation}
              onChange={value => onChange({ rotation: value })}
              suffix='°'
              min={COMMON_CONSTRAINTS.rotation.min}
              max={COMMON_CONSTRAINTS.rotation.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Rotation'
          value={settings.rotation}
          min={COMMON_CONSTRAINTS.rotation.min}
          max={COMMON_CONSTRAINTS.rotation.max}
          step={COMMON_CONSTRAINTS.rotation.step}
          onChange={value => onChange({ rotation: value })}
          theme={theme}
          suffix='°'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Inner Radius */}
      <PropertyRow
        label={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Inner Radius:
            <EditableNumericValue
              value={settings.innerRadius}
              onChange={value => onChange({ innerRadius: value })}
              suffix='px'
              min={COMMON_CONSTRAINTS.innerRadius.min}
              max={COMMON_CONSTRAINTS.innerRadius.max}
              precision={0}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Inner Radius'
          value={settings.innerRadius}
          min={COMMON_CONSTRAINTS.innerRadius.min}
          max={COMMON_CONSTRAINTS.innerRadius.max}
          step={COMMON_CONSTRAINTS.innerRadius.step}
          onChange={value => onChange({ innerRadius: value })}
          theme={theme}
          suffix='px'
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Show Radial Path */}
      <PropertyRow label='Show Radial Path'>
        <CheckboxControl
          label='Show Radial Path'
          checked={settings.showRadialPath}
          onChange={checked => onChange({ showRadialPath: checked })}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      {/* Enable Partial Arc */}
      <PropertyRow label='Enable Partial Arc'>
        <CheckboxControl
          label='Enable Partial Arc'
          checked={settings.enablePartialArc}
          onChange={checked => onChange({ enablePartialArc: checked })}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      {/* Start Angle (if partial arc enabled) */}
      {settings.enablePartialArc && settings.startAngle !== undefined && (
        <PropertyRow
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Start Angle:
              <EditableNumericValue
                value={settings.startAngle}
                onChange={value => onChange({ startAngle: value })}
                suffix='°'
                min={COMMON_CONSTRAINTS.startAngle.min}
                max={COMMON_CONSTRAINTS.startAngle.max}
                precision={0}
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Start Angle'
            value={settings.startAngle}
            min={COMMON_CONSTRAINTS.startAngle.min}
            max={COMMON_CONSTRAINTS.startAngle.max}
            step={COMMON_CONSTRAINTS.startAngle.step}
            onChange={value => onChange({ startAngle: value })}
            theme={theme}
            suffix='°'
            hideLabel={true}
            editableValue={false}
          />
        </PropertyRow>
      )}

      {/* End Angle (if partial arc enabled) */}
      {settings.enablePartialArc && settings.endAngle !== undefined && (
        <PropertyRow
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              End Angle:
              <EditableNumericValue
                value={settings.endAngle}
                onChange={value => onChange({ endAngle: value })}
                suffix='°'
                min={COMMON_CONSTRAINTS.endAngle.min}
                max={COMMON_CONSTRAINTS.endAngle.max}
                precision={0}
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='End Angle'
            value={settings.endAngle}
            min={COMMON_CONSTRAINTS.endAngle.min}
            max={COMMON_CONSTRAINTS.endAngle.max}
            step={COMMON_CONSTRAINTS.endAngle.step}
            onChange={value => onChange({ endAngle: value })}
            theme={theme}
            suffix='°'
            hideLabel={true}
            editableValue={false}
          />
        </PropertyRow>
      )}
    </PropertySection>
  );
};

export default PositionSection;

