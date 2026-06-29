/**
 * DotVisualizationSettings - Dot-specific visualization settings
 * Single Responsibility: Manages all settings specific to dot visualizations
 * Uses SRP reactive architecture with grouped setting components
 */
import React from 'react';
import type { SelectOption } from '../controls';
import { SelectControl, SliderControl } from '../controls';
import {
  AnimationSettings,
  ColorSettings,
  FrequencySettings,
  RadialSettings,
  SpatialSettings,
} from '../settings-groups';

export interface DotVisualizationSettingsProps {
  settings: {
    // Dot-specific
    dotSize: number;
    dotSpacing?: number;
    shape?: 'circle' | 'square' | 'diamond' | 'triangle';
    fillMode?: 'solid' | 'hollow';

    // Common settings
    barCount: number;
    primaryColor: string;
    secondaryColor?: string;

    colorMode: 'solid' | 'gradient' | 'rainbow' | 'reactive';
    responseSpeed: number;
    frequencyRange: 'bass' | 'mid' | 'treble' | 'full';

    pulseMode: 'none' | 'subtle' | 'strong';

    // Layout
    layout?: 'linear' | 'radial' | 'grid';
    gridColumns?: number;
    gridRows?: number;

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
    updates: Partial<DotVisualizationSettingsProps['settings']>
  ) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

const DOT_SHAPE_OPTIONS: SelectOption[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'triangle', label: 'Triangle' },
];

const FILL_MODE_OPTIONS: SelectOption[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'hollow', label: 'Hollow' },
];

export const DotVisualizationSettings: React.FC<
  DotVisualizationSettingsProps
> = ({ settings, onChange, theme, className = '' }) => {
  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    onChange({ [key]: value });
  };

  const isRadialLayout = settings.layout === 'radial';
  const isGridLayout = settings.layout === 'grid';
  const showSecondaryColor = [
    'gradient',
    'custom-gradient',
    'radial-gradient',
  ].includes(settings.colorMode);

  const sectionClasses = `
    frost-mb-4 frost-p-3 frost-rounded
    ${theme === 'frost_light' ? 'frostlight-standard-glass-card' : 'frostdark-standard-glass-card'}
  `;

  const titleClasses = `
    frost-text-sm frost-font-medium frost-mb-3
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  return (
    <div className={`dot-visualization-settings ${className}`}>
      {/* Dot-specific settings */}
      <div className={sectionClasses}>
        <h4 className={titleClasses}>Dot Properties</h4>

        <div className='frost-space-y-3'>
          <div className='frost-grid frost-grid-cols-2 frost-gap-3'>
            <SliderControl
              label='Dot Size'
              value={settings.dotSize}
              min={2}
              max={50}
              step={1}
              onChange={value => updateSetting('dotSize', value)}
              theme={theme}
              suffix='px'
              editableValue={true}
            />

            {settings.dotSpacing !== undefined && (
              <SliderControl
                label='Dot Spacing'
                value={settings.dotSpacing}
                min={5}
                max={50}
                step={1}
                onChange={value => updateSetting('dotSpacing', value)}
                theme={theme}
                suffix='px'
                editableValue={true}
              />
            )}
          </div>

          <div className='frost-grid frost-grid-cols-2 frost-gap-3'>
            <SelectControl
              label='Dot Shape'
              value={settings.shape || 'circle'}
              options={DOT_SHAPE_OPTIONS}
              onChange={value => updateSetting('shape', value as any)}
              theme={theme}
            />

            <SelectControl
              label='Fill Mode'
              value={settings.fillMode || 'solid'}
              options={FILL_MODE_OPTIONS}
              onChange={value => updateSetting('fillMode', value as any)}
              theme={theme}
            />
          </div>
        </div>
      </div>

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

      {/* Layout & Position */}
      <SpatialSettings
        layout={settings.layout}
        onLayoutChange={layout => updateSetting('layout', layout as any)}
        theme={theme}
        showLayout={true}
      />

      {/* Grid settings - only show when grid layout is selected */}
      {isGridLayout && (
        <div className={sectionClasses}>
          <h4 className={titleClasses}>Grid Layout</h4>
          <div className='frost-grid frost-grid-cols-2 frost-gap-3'>
            <SliderControl
              label='Grid Columns'
              value={settings.gridColumns || 8}
              min={2}
              max={20}
              step={1}
              onChange={value => updateSetting('gridColumns', value)}
              theme={theme}
              editableValue={true}
            />

            <SliderControl
              label='Grid Rows'
              value={settings.gridRows || 6}
              min={2}
              max={20}
              step={1}
              onChange={value => updateSetting('gridRows', value)}
              theme={theme}
              editableValue={true}
            />
          </div>
        </div>
      )}

      {/* Radial settings - only show when radial layout is selected */}
      {isRadialLayout && (
        <RadialSettings
          innerRadius={settings.innerRadius}
          startAngle={settings.startAngle}
          endAngle={settings.endAngle}
          arcMode={settings.arcMode}
          radialOrientation={settings.radialOrientation}
          radialSizingMode={settings.radialSizingMode}
          showRadialPath={settings.showRadialPath}
          invertDirection={settings.invertDirection}
          onInnerRadiusChange={radius => updateSetting('innerRadius', radius)}
          onStartAngleChange={angle => updateSetting('startAngle', angle)}
          onEndAngleChange={angle => updateSetting('endAngle', angle)}
          onArcModeChange={arcMode => updateSetting('arcMode', arcMode)}
          onRadialOrientationChange={orientation =>
            updateSetting('radialOrientation', orientation as any)
          }
          onRadialSizingModeChange={mode =>
            updateSetting('radialSizingMode', mode as any)
          }
          onShowRadialPathChange={show => updateSetting('showRadialPath', show)}
          onInvertDirectionChange={invert =>
            updateSetting('invertDirection', invert)
          }
          theme={theme}
          showSizingMode={true}
        />
      )}

      {/* Compositing */}
      <div className={sectionClasses}>
        <h4 className={titleClasses}>Compositing</h4>
        <SliderControl
          label='Opacity'
          value={(settings as any).opacity ?? 1}
          min={0}
          max={1}
          step={0.01}
          onChange={value => onChange({ opacity: value } as any)}
          theme={theme}
          editableValue={true}
        />
      </div>

      {/* Colors */}
      <ColorSettings
        primaryColor={settings.primaryColor}
        secondaryColor={settings.secondaryColor}
        colorMode={settings.colorMode}
        onPrimaryColorChange={color => updateSetting('primaryColor', color)}
        onSecondaryColorChange={
          showSecondaryColor
            ? color => updateSetting('secondaryColor', color)
            : undefined
        }
        onColorModeChange={mode => updateSetting('colorMode', mode as any)}
        theme={theme}
      />

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
