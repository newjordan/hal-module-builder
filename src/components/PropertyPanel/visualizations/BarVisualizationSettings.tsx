/**
 * BarVisualizationSettings - Bar-specific visualization settings
 * Single Responsibility: Manages all settings specific to bar visualizations
 */
import React from 'react';
import { EQUALIZER_SYMMETRY_OPTIONS } from '../../../config/equalizerSymmetry';
import EditableNumericValue from '../../EditableNumericValue';
import PropertyRow from '../../PropertyRow';
import PropertySection from '../../PropertySection';

import type { SelectOption } from '../controls';
import { CheckboxControl, SelectControl, SliderControl } from '../controls';
import {
  AnimationSettings,
  ColorSettings,
  FrequencySettings,
  // RadialSettings, // inlined rows for legacy parity
  SpatialSettings,
} from '../settings-groups';

export interface BarVisualizationSettingsProps {
  settings: {
    // Bar-specific
    barWidth: number;
    barSpacing: number;
    cornerRadius?: number;
    blockAlignment?: 'bottom' | 'center' | 'top';
    barAlignment?: 'bottom' | 'center' | 'top'; // preferred; replaces blockAlignment

    // Common settings
    barCount: number;
    primaryColor: string;
    secondaryColor?: string;

    colorMode: 'solid' | 'gradient' | 'rainbow' | 'reactive';
    responseSpeed: number;
    frequencyRange: 'bass' | 'mid' | 'treble' | 'full';

    pulseMode: 'none' | 'subtle' | 'strong';
    symmetry?: string;

    maxHeight: number;

    // Spatial / appearance
    opacity?: number;
    positionX?: number;
    positionY?: number;
    rotation?: number;
    blendMode?: string;

    // Layout
    layout?: 'linear' | 'radial' | 'grid';

    // Radial layout
    innerRadius: number;
    startAngle: number;
    endAngle: number;
    arcMode: boolean;
    radialOrientation: 'follow-radius' | 'follow-tangent' | 'maintain';
    radialSizingMode?: 'flat' | 'depth';
    showRadialPath?: boolean;
    invertDirection?: boolean;
  };
  onChange: (
    updates: Partial<BarVisualizationSettingsProps['settings']>
  ) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

const BLEND_MODE_OPTIONS: SelectOption[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
];

const BLOCK_ALIGNMENT_OPTIONS: SelectOption[] = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
];

const RADIAL_ORIENTATION_OPTIONS: SelectOption[] = [
  { value: 'follow-radius', label: 'Outward (radial)' },
  { value: 'follow-tangent', label: 'Along tangent' },
  { value: 'maintain', label: 'Upright' },
];

export const BarVisualizationSettings: React.FC<
  BarVisualizationSettingsProps
> = ({ settings, onChange, theme, className = '' }) => {
  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    onChange({ [key]: value });
  };

  const isRadialLayout = settings.layout === 'radial';
  const showSecondaryColor = [
    'gradient',
    'custom-gradient',
    'radial-gradient',
  ].includes(settings.colorMode);

  const symmetryOptions = EQUALIZER_SYMMETRY_OPTIONS.map(o => ({
    value: o.value,
    label: o.label,
  }));
  const currentSymmetry = (settings as any).symmetry || 'none';
  const symmetryDescription =
    EQUALIZER_SYMMETRY_OPTIONS.find(o => o.value === currentSymmetry)
      ?.description || undefined;

  return (
    <div className={`bar-visualization-settings ${className}`}>
      {/* Bar-specific settings */}
      {/* Properties */}
      <PropertySection
        title='Properties'
        collapsible={true}
        defaultExpanded={true}
        theme={theme}
      >
        <SpatialSettings
          layout={settings.layout || 'linear'}
          positionX={settings.positionX ?? 50}
          positionY={settings.positionY ?? 50}
          rotation={settings.rotation ?? 0}
          onPositionXChange={x => updateSetting('positionX', x)}
          onPositionYChange={y => updateSetting('positionY', y)}
          onRotationChange={deg => updateSetting('rotation', deg as any)}
          onLayoutChange={layout => updateSetting('layout', layout as any)}
          theme={theme}
          showLayout={true}
          showPosition={true}
          showRotation={true}
        />

        {/* Blend Mode */}
        <PropertyRow label='Blend Mode'>
          <SelectControl
            label='Blend Mode'
            value={(settings as any).blendMode || 'normal'}
            options={BLEND_MODE_OPTIONS}
            onChange={mode => updateSetting('blendMode', mode as any)}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>

        {/* Opacity */}
        <PropertyRow
          label={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Opacity:
              <EditableNumericValue
                value={(settings as any).opacity ?? 1}
                onChange={value => updateSetting('opacity', value as any)}
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
            label='Opacity'
            value={(settings as any).opacity ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={value => updateSetting('opacity', value as any)}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection
        title='Bar Properties'
        collapsible={true}
        defaultExpanded={true}
        theme={theme}
      >
        <PropertyRow
          label={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',

                gap: '6px',
              }}
            >
              Bar Width:
              <EditableNumericValue
                value={settings.barWidth}
                onChange={value => updateSetting('barWidth', value)}
                suffix='px'
                min={1}
                max={20}
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
            min={1}
            max={20}
            step={1}
            onChange={value => updateSetting('barWidth', value)}
            theme={theme}
            suffix='px'
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>

        {isRadialLayout && (
          <>
            <PropertyRow
              label={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Inner Radius:
                  <EditableNumericValue
                    value={settings.innerRadius}
                    onChange={value => updateSetting('innerRadius', value)}
                    suffix='px'
                    min={10}
                    max={200}
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
                min={10}
                max={200}
                step={5}
                onChange={value => updateSetting('innerRadius', value)}
                theme={theme}
                suffix='px'
                editableValue={false}
                hideLabel={true}
              />
            </PropertyRow>

            <PropertyRow label='Radial Orientation'>
              <SelectControl
                label='Radial Orientation'
                value={settings.radialOrientation}
                options={RADIAL_ORIENTATION_OPTIONS}
                onChange={value =>
                  updateSetting('radialOrientation', value as any)
                }
                theme={theme}
                hideLabel={true}
              />
            </PropertyRow>

            <PropertyRow label='Show Radial Path'>
              <CheckboxControl
                label='Show Radial Path'
                checked={Boolean(settings.showRadialPath)}
                onChange={checked => updateSetting('showRadialPath', checked)}
                theme={theme}
                hideLabel={true}
              />
            </PropertyRow>

            <PropertyRow label='Enable partial arc'>
              <CheckboxControl
                label='Enable partial arc'
                checked={Boolean(settings.arcMode)}
                onChange={checked => updateSetting('arcMode', checked)}
                theme={theme}
                hideLabel={true}
              />
            </PropertyRow>

            {settings.arcMode && (
              <>
                <PropertyRow
                  label={
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      Start Angle:
                      <EditableNumericValue
                        value={settings.startAngle}
                        onChange={value => updateSetting('startAngle', value)}
                        suffix='°'
                        min={0}
                        max={360}
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
                    min={0}
                    max={360}
                    step={5}
                    onChange={value => updateSetting('startAngle', value)}
                    theme={theme}
                    suffix='°'
                    editableValue={false}
                    hideLabel={true}
                  />
                </PropertyRow>

                <PropertyRow
                  label={
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      End Angle:
                      <EditableNumericValue
                        value={settings.endAngle}
                        onChange={value => updateSetting('endAngle', value)}
                        suffix='°'
                        min={0}
                        max={360}
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
                    min={0}
                    max={360}
                    step={5}
                    onChange={value => updateSetting('endAngle', value)}
                    theme={theme}
                    suffix='°'
                    editableValue={false}
                    hideLabel={true}
                  />
                </PropertyRow>
              </>
            )}

            <PropertyRow label='Invert (grow inward)'>
              <CheckboxControl
                label='Invert (grow inward)'
                checked={Boolean(settings.invertDirection)}
                onChange={invert => updateSetting('invertDirection', invert)}
                theme={theme}
                hideLabel={true}
              />
            </PropertyRow>
          </>
        )}

        <PropertyRow
          label={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Bar Spacing:
              <EditableNumericValue
                value={settings.barSpacing}
                onChange={value => updateSetting('barSpacing', value)}
                suffix='px'
                min={0}
                max={10}
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
            min={0}
            max={10}
            step={1}
            onChange={value => updateSetting('barSpacing', value)}
            theme={theme}
            suffix='px'
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>

        <PropertyRow
          label={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Corner Radius:
              <EditableNumericValue
                value={settings.cornerRadius || 2}
                onChange={value => updateSetting('cornerRadius', value)}
                suffix='px'
                min={0}
                max={20}
                precision={0}
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Corner Radius'
            value={settings.cornerRadius || 2}
            min={0}
            max={20}
            step={1}
            onChange={value => updateSetting('cornerRadius', value)}
            theme={theme}
            suffix='px'
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>

        <PropertyRow label='Alignment'>
          <SelectControl
            label='Alignment'
            value={settings.barAlignment || settings.blockAlignment || 'bottom'}
            options={BLOCK_ALIGNMENT_OPTIONS}
            onChange={value => updateSetting('barAlignment', value as any)}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>

        <PropertyRow
          label={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Max Height:
              <EditableNumericValue
                value={settings.maxHeight}
                onChange={value => updateSetting('maxHeight', value)}
                suffix='px'
                min={20}
                max={200}
                precision={0}
                theme={theme}
                style={{ fontWeight: 'bold' }}
              />
            </span>
          }
        >
          <SliderControl
            label='Max Height'
            value={settings.maxHeight}
            min={20}
            max={200}
            step={5}
            onChange={value => updateSetting('maxHeight', value)}
            theme={theme}
            suffix='px'
            editableValue={false}
            hideLabel={true}
          />
        </PropertyRow>
      </PropertySection>

      {/* Frequency Analysis */}
      <FrequencySettings
        frequencyRange={settings.frequencyRange}
        barCount={settings.barCount}
        onFrequencyRangeChange={range =>
          updateSetting('frequencyRange', range as any)
        }
        onBarCountChange={count => updateSetting('barCount', count)}
        theme={theme}
        minBarCount={8}
        maxBarCount={128}
      />

      {/* Symmetry */}
      <PropertySection
        title='Symmetry'
        collapsible={true}
        defaultExpanded={true}
        theme={theme}
      >
        <PropertyRow label='Symmetry' description={symmetryDescription ?? ''}>
          <SelectControl
            label='Symmetry'
            value={currentSymmetry}
            options={symmetryOptions}
            onChange={value => updateSetting('symmetry', value as any)}
            theme={theme}
            hideLabel={true}
          />
        </PropertyRow>
      </PropertySection>

      {/* Colors */}
      <PropertySection
        title='Colors'
        collapsible={true}
        defaultExpanded={true}
        theme={theme}
      >
        <ColorSettings
          primaryColor={settings.primaryColor}
          {...(settings.secondaryColor
            ? { secondaryColor: settings.secondaryColor }
            : {})}
          colorMode={settings.colorMode}
          onPrimaryColorChange={color => updateSetting('primaryColor', color)}
          onSecondaryColorChange={
            showSecondaryColor
              ? color => updateSetting('secondaryColor', color)
              : () => {}
          }
          onColorModeChange={mode => updateSetting('colorMode', mode as any)}
          theme={theme}
        />
      </PropertySection>

      {/* Animation */}
      <AnimationSettings
        responseSpeed={settings.responseSpeed}
        pulseMode={settings.pulseMode}
        onResponseSpeedChange={speed => updateSetting('responseSpeed', speed)}
        onPulseModeChange={mode => updateSetting('pulseMode', mode as any)}
        theme={theme}
      />
    </div>
  );
};

export default BarVisualizationSettings;
