/**
 * CircleVisualizationSettings - Circle-specific visualization settings
 * Single Responsibility: Manages all settings specific to circle visualizations
 */
import React from 'react';
import { CheckboxControl, SliderControl } from '../controls';
import {
  AnimationSettings,
  ColorSettings,
  FrequencySettings,
  RadialSettings,
  SpatialSettings,
} from '../settings-groups';

export interface CircleVisualizationSettingsProps {
  settings: {
    // Circle-specific
    circleRadius: number;
    pulsingEffect: boolean;

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
    updates: Partial<CircleVisualizationSettingsProps['settings']>
  ) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

export const CircleVisualizationSettings: React.FC<
  CircleVisualizationSettingsProps
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

  const sectionClasses = `
    frost-mb-4 frost-p-3 frost-rounded
    ${theme === 'frost_light' ? 'frostlight-standard-glass-card' : 'frostdark-standard-glass-card'}
  `;

  const titleClasses = `
    frost-text-sm frost-font-medium frost-mb-3
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  return (
    <div className={`circle-visualization-settings ${className}`}>
      {/* Circle-specific settings */}
      <div className={sectionClasses}>
        <h4 className={titleClasses}>Circle Properties</h4>

        <div className='frost-space-y-3'>
          <SliderControl
            label='Circle Radius'
            value={settings.circleRadius}
            min={20}
            max={300}
            step={5}
            onChange={value => updateSetting('circleRadius', value)}
            theme={theme}
            suffix='px'
            editableValue={true}
          />

          <CheckboxControl
            label='Pulsing Effect'
            checked={settings.pulsingEffect}
            onChange={checked => updateSetting('pulsingEffect', checked)}
            theme={theme}
            description='Enable audio-reactive pulsing animation'
          />
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

      {/* Radial settings - only show when radial layout is selected */}
      {isRadialLayout && (
        <RadialSettings
          innerRadius={settings.innerRadius}
          showRadialPath={settings.showRadialPath}
          invertDirection={settings.invertDirection}
          startAngle={settings.startAngle}
          endAngle={settings.endAngle}
          arcMode={settings.arcMode}
          radialOrientation={settings.radialOrientation}
          radialSizingMode={settings.radialSizingMode}
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

export default CircleVisualizationSettings;
