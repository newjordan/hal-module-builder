/**
 * RadialSettings - Grouped radial layout controls
 * Single Responsibility: Manages inner/outer radius, angles, and radial-specific settings
 */
import React from 'react';
import EditableNumericValue from '../../EditableNumericValue';
import PropertyRow from '../../PropertyRow';
import type { SelectOption } from '../controls';
import { CheckboxControl, SelectControl, SliderControl } from '../controls';

export interface RadialSettingsProps {
  innerRadius: number;
  outerRadius?: number | undefined;
  startAngle: number;
  endAngle: number;
  arcMode: boolean;
  radialOrientation: 'follow-radius' | 'follow-tangent' | 'maintain';
  radialSizingMode?: 'flat' | 'depth' | undefined;
  showRadialPath?: boolean | undefined;
  invertDirection?: boolean | undefined;
  onInnerRadiusChange: (radius: number) => void;
  onOuterRadiusChange?: ((radius: number) => void) | undefined;
  onStartAngleChange: (angle: number) => void;
  onEndAngleChange: (angle: number) => void;
  onArcModeChange: (arcMode: boolean) => void;
  onRadialOrientationChange: (orientation: string) => void;
  onRadialSizingModeChange?: ((mode: string) => void) | undefined;
  onShowRadialPathChange?: ((show: boolean) => void) | undefined;
  onInvertDirectionChange?: ((invert: boolean) => void) | undefined;
  theme: 'frost_light' | 'frost_dark';
  showOuterRadius?: boolean | undefined;
  showSizingMode?: boolean | undefined;
  className?: string | undefined;
}

const RADIAL_ORIENTATION_OPTIONS: SelectOption[] = [
  { value: 'follow-radius', label: 'Outward (radial)' },
  { value: 'follow-tangent', label: 'Along tangent' },
  { value: 'maintain', label: 'Upright' },
];

const SIZING_MODE_OPTIONS: SelectOption[] = [
  { value: 'flat', label: 'Flat (arc-aligned)' },
  { value: 'depth', label: 'Depth (legacy)' },
];

export const RadialSettings: React.FC<RadialSettingsProps> = ({
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  arcMode,
  radialOrientation,
  radialSizingMode,
  showRadialPath = false,
  invertDirection = false,
  onInnerRadiusChange,
  onOuterRadiusChange,
  onStartAngleChange,
  onEndAngleChange,
  onArcModeChange,
  onRadialOrientationChange,
  onRadialSizingModeChange,
  onShowRadialPathChange,
  onInvertDirectionChange,
  theme,
  showOuterRadius = false,
  showSizingMode = false,
  className: _className = '',
}) => {
  return (
    <>
      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Inner Radius:
            <EditableNumericValue
              value={innerRadius}
              onChange={onInnerRadiusChange}
              min={10}
              max={200}
              precision={0}
              suffix='px'
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Inner Radius'
          value={innerRadius}
          min={10}
          max={200}
          step={5}
          onChange={onInnerRadiusChange}
          theme={theme}
          suffix='px'
          editableValue={false}
          hideLabel={true}
        />
      </PropertyRow>

      {showOuterRadius && onOuterRadiusChange && outerRadius !== undefined && (
        <PropertyRow
          label={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Outer Radius:
              <EditableNumericValue
                value={outerRadius}
                onChange={onOuterRadiusChange}
                min={innerRadius + 10}
                max={400}
                precision={0}
                suffix='px'
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Outer Radius'
            value={outerRadius}
            min={innerRadius + 10}
            max={400}
            step={5}
            onChange={onOuterRadiusChange}
            theme={theme}
            suffix='px'
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      <PropertyRow label='Radial Orientation'>
        <SelectControl
          label='Radial Orientation'
          value={radialOrientation}
          options={RADIAL_ORIENTATION_OPTIONS}
          onChange={onRadialOrientationChange}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      {showSizingMode && onRadialSizingModeChange && radialSizingMode && (
        <PropertyRow label='Radial Width Mode'>
          <SelectControl
            label='Radial Width Mode'
            value={radialSizingMode}
            options={SIZING_MODE_OPTIONS}
            onChange={onRadialSizingModeChange}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      {onInvertDirectionChange && (
        <PropertyRow
          label='Invert (grow inward)'
          description='Reverse the expansion direction so bars grow toward the center'
        >
          <CheckboxControl
            label='Invert (grow inward)'
            checked={invertDirection}
            onChange={onInvertDirectionChange}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      <PropertyRow label='Enable partial arc'>
        <CheckboxControl
          label='Enable partial arc'
          checked={arcMode}
          onChange={onArcModeChange}
          theme={theme}
          hideLabel={true}
        />
      </PropertyRow>

      {onShowRadialPathChange && (
        <PropertyRow
          label='Show Radial Path'
          description='Display a visual guide showing the radial path (useful for debugging)'
        >
          <CheckboxControl
            label='Show Radial Path'
            checked={showRadialPath}
            onChange={onShowRadialPathChange}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      {arcMode && (
        <>
          <PropertyRow
            label={
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Start Angle:
                <EditableNumericValue
                  value={startAngle}
                  onChange={onStartAngleChange}
                  min={0}
                  max={360}
                  precision={0}
                  suffix='°'
                  theme={theme}
                  style={{ fontWeight: 'bold' }}
                />
              </span>
            }
          >
            <SliderControl
              label='Start Angle'
              value={startAngle}
              min={0}
              max={360}
              step={5}
              onChange={onStartAngleChange}
              theme={theme}
              suffix='°'
              editableValue={false}
              hideLabel={true}
            />
          </PropertyRow>

          <PropertyRow
            label={
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                End Angle:
                <EditableNumericValue
                  value={endAngle}
                  onChange={onEndAngleChange}
                  min={0}
                  max={360}
                  precision={0}
                  suffix='°'
                  theme={theme}
                  style={{ fontWeight: 'bold' }}
                />
              </span>
            }
          >
            <SliderControl
              label='End Angle'
              value={endAngle}
              min={0}
              max={360}
              step={5}
              onChange={onEndAngleChange}
              theme={theme}
              suffix='°'
              editableValue={false}
              hideLabel={true}
            />
          </PropertyRow>
        </>
      )}
    </>
  );
};

export default RadialSettings;
