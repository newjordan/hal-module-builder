/**
 * SpatialSettings - Grouped spatial and positioning controls
 * Single Responsibility: Manages position, rotation, scale, and layout settings
 */
import React from 'react';
import PropertyRow from '../../PropertyRow';

import EditableNumericValue from '../../EditableNumericValue';

import { SelectControl, SliderControl } from '../controls';

import type { SelectOption } from '../controls';

export interface SpatialSettingsProps {
  positionX?: number | undefined;
  positionY?: number | undefined;
  rotation?: number | undefined;
  scale?: number | undefined;
  layout?: 'linear' | 'radial' | 'grid' | undefined;
  onPositionXChange?: ((x: number) => void) | undefined;
  onPositionYChange?: ((y: number) => void) | undefined;
  onRotationChange?: ((rotation: number) => void) | undefined;
  onScaleChange?: ((scale: number) => void) | undefined;
  onLayoutChange?: ((layout: string) => void) | undefined;
  theme: 'frost_light' | 'frost_dark';
  showPosition?: boolean | undefined;
  showRotation?: boolean | undefined;
  showScale?: boolean | undefined;
  showLayout?: boolean | undefined;
  className?: string | undefined;
}

const LAYOUT_OPTIONS: SelectOption[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
  { value: 'grid', label: 'Grid' },
];

export const SpatialSettings: React.FC<SpatialSettingsProps> = ({
  positionX = 50,
  positionY = 50,
  rotation = 0,
  scale = 1,
  layout = 'linear',
  onPositionXChange,
  onPositionYChange,
  onRotationChange,
  onScaleChange,
  onLayoutChange,
  theme,
  showPosition = false,
  showRotation = false,
  showScale = false,
  showLayout = false,
}) => {
  // Don't render if no spatial settings are enabled
  const hasSettings = showPosition || showRotation || showScale || showLayout;
  if (!hasSettings) return null;

  return (
    <>
      {showLayout && onLayoutChange && (
        <PropertyRow label='Layout'>
          <SelectControl
            label='Layout'
            value={layout}
            options={LAYOUT_OPTIONS}
            onChange={onLayoutChange}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      {showPosition && (
        <>
          {onPositionXChange && (
            <PropertyRow
              label={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Position X:
                  <EditableNumericValue
                    value={positionX}
                    onChange={onPositionXChange}
                    min={0}
                    max={100}
                    precision={0}
                    suffix='%'
                    theme={theme}
                    style={{ fontWeight: 'bold' }}
                  />
                </span>
              }
            >
              <SliderControl
                label='Position X'
                value={positionX}
                min={0}
                max={100}
                step={1}
                onChange={onPositionXChange}
                theme={theme}
                suffix='%'
                editableValue={false}
                hideLabel={true}
              />
            </PropertyRow>
          )}

          {onPositionYChange && (
            <PropertyRow
              label={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Position Y:
                  <EditableNumericValue
                    value={positionY}
                    onChange={onPositionYChange}
                    min={0}
                    max={100}
                    precision={0}
                    suffix='%'
                    theme={theme}
                    style={{ fontWeight: 'bold' }}
                  />
                </span>
              }
            >
              <SliderControl
                label='Position Y'
                value={positionY}
                min={0}
                max={100}
                step={1}
                onChange={onPositionYChange}
                theme={theme}
                suffix='%'
                editableValue={false}
                hideLabel={true}
              />
            </PropertyRow>
          )}
        </>
      )}

      {showRotation && onRotationChange && (
        <PropertyRow
          label={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Rotation:
              <EditableNumericValue
                value={rotation}
                onChange={onRotationChange}
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
            label='Rotation'
            value={rotation}
            min={0}
            max={360}
            step={1}
            onChange={onRotationChange}
            theme={theme}
            suffix='°'
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      {showScale && onScaleChange && (
        <PropertyRow
          label={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Scale:
              <EditableNumericValue
                value={scale * 100}
                onChange={value => onScaleChange(value / 100)}
                min={10}
                max={300}
                precision={0}
                suffix='%'
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Scale'
            value={scale * 100}
            min={10}
            max={300}
            step={1}
            onChange={value => onScaleChange(value / 100)}
            theme={theme}
            suffix='%'
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>
      )}
    </>
  );
};

export default SpatialSettings;
