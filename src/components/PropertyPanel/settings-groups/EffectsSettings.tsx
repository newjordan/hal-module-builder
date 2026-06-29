/**
 * EffectsSettings - Grouped visual effects controls
 * Single Responsibility: Manages glow, blur, trails, and other visual effects
 */
import React from 'react';
import EditableNumericValue from '../../EditableNumericValue';
import PropertyRow from '../../PropertyRow';
import { CheckboxControl, ColorPicker, SliderControl } from '../controls';

export interface EffectsSettingsProps {
  glowIntensity: number;
  glowColor?: string | undefined;
  blur?: number | undefined;
  trailsEnabled?: boolean | undefined;
  trailsIntensity?: number | undefined;
  onGlowIntensityChange: (intensity: number) => void;
  onGlowColorChange?: ((color: string) => void) | undefined;
  onBlurChange?: ((blur: number) => void) | undefined;
  onTrailsEnabledChange?: ((enabled: boolean) => void) | undefined;
  onTrailsIntensityChange?: ((intensity: number) => void) | undefined;
  theme: 'frost_light' | 'frost_dark';
  showBlur?: boolean | undefined;
  showTrails?: boolean | undefined;
  className?: string | undefined;
}

export const EffectsSettings: React.FC<EffectsSettingsProps> = ({
  glowIntensity,
  glowColor,
  blur,
  trailsEnabled,
  trailsIntensity,
  onGlowIntensityChange,
  onGlowColorChange,
  onBlurChange,
  onTrailsEnabledChange,
  onTrailsIntensityChange,
  theme,
  showBlur = false,
  showTrails = false,
}) => {
  return (
    <>
      <PropertyRow
        label={
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Glow Intensity:
            <EditableNumericValue
              value={glowIntensity}
              onChange={onGlowIntensityChange}
              min={0}
              max={2}
              precision={2}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Glow Intensity'
          value={glowIntensity}
          min={0}
          max={2}
          step={0.1}
          onChange={onGlowIntensityChange}
          theme={theme}
          precision={2}
          editableValue={false}
          hideLabel={true}
        />
      </PropertyRow>

      {onGlowColorChange && glowColor && (
        <PropertyRow label='Glow Color'>
          <ColorPicker
            label='Glow Color'
            value={glowColor}
            onChange={onGlowColorChange}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      {showBlur && onBlurChange && blur !== undefined && (
        <PropertyRow
          label={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Blur:
              <EditableNumericValue
                value={blur}
                onChange={onBlurChange}
                min={0}
                max={10}
                precision={1}
                theme={theme}
                suffix='px'
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Blur'
            value={blur}
            min={0}
            max={10}
            step={0.5}
            onChange={onBlurChange}
            theme={theme}
            suffix='px'
            precision={1}
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>
      )}

      {showTrails && onTrailsEnabledChange && trailsEnabled !== undefined && (
        <>
          <PropertyRow label='Enable Trails'>
            <CheckboxControl
              label='Enable Trails'
              checked={trailsEnabled}
              onChange={onTrailsEnabledChange}
              theme={theme}
              hideLabel={true}
            />
          </PropertyRow>

          {trailsEnabled &&
            onTrailsIntensityChange &&
            trailsIntensity !== undefined && (
              <PropertyRow
                label={
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Trail Intensity:
                    <EditableNumericValue
                      value={trailsIntensity}
                      onChange={onTrailsIntensityChange}
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
                  label='Trail Intensity'
                  value={trailsIntensity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={onTrailsIntensityChange}
                  theme={theme}
                  precision={2}
                  editableValue={false}
                  hideLabel={true}
                />
              </PropertyRow>
            )}
        </>
      )}
    </>
  );
};

export default EffectsSettings;
