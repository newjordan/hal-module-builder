/**
 * DiamondVisualizationSettings - Diamond-specific visualization settings
 * Single Responsibility: Manages all settings specific to diamond visualizations
 */
import React from 'react';
import { SliderControl } from '../controls';
import {
  AnimationSettings,
  ColorSettings,
  FrequencySettings,
  RadialSettings,
  SpatialSettings,
} from '../settings-groups';

export interface DiamondVisualizationSettingsProps {
  settings: {
    // Diamond-specific
    diamondSize: number;

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
    updates: Partial<DiamondVisualizationSettingsProps['settings']>
  ) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

export const DiamondVisualizationSettings: React.FC<
  DiamondVisualizationSettingsProps
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
    <div className={`diamond-visualization-settings ${className}`}>
      {/* Diamond-specific settings */}
      <div className={sectionClasses}>
        <h4 className={titleClasses}>Diamond Properties</h4>

        <SliderControl
          label='Diamond Size'
          value={settings.diamondSize}
          min={2}
          max={50}
          step={1}
          onChange={value => updateSetting('diamondSize', value)}
          theme={theme}
          suffix='px'
          editableValue={true}
        />
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

export default DiamondVisualizationSettings;
