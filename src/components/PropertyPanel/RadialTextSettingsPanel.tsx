/**
 * HAL Radial Text Settings Panel
 * ==============================
 *
 * Radial text configuration surface that reuses shared appearance controls and
 * aligns with the PropertyPanel architecture.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import PropertyRow from '../PropertyRow';
import PropertySection from '../PropertySection';
import { AppearancePanel } from '../panels/AppearancePanel';
import { RadialSettings } from './settings-groups/RadialSettings';
import { ColorSettings } from './settings-groups/ColorSettings';
import { EffectsSettings } from './settings-groups/EffectsSettings';
import { AnimationSettings } from './settings-groups/AnimationSettings';
import {
  CheckboxControl,
  NumericInput,
  SelectControl,
  SliderControl,
  ColorPicker,
} from './controls';
import {
  RadialTextLayer,
  RadialTextAnimationType,
  AudioResponseMapping,
  RadialTextFlow,
  TextTruncationMode,
  DEFAULT_RADIAL_TEXT_CONFIG,
  DEFAULT_RADIAL_TEXT_EFFECTS,
  DEFAULT_RADIAL_TEXT_ANIMATION,
  RadialTextConfig,
  RadialTextEffects,
  RadialTextAnimation,
} from '../../types/radial-text-types';
import { Layer } from '../../types/layer-types';

const FLOW_TO_ORIENTATION: Record<
  RadialTextFlow,
  'follow-radius' | 'follow-tangent' | 'maintain'
> = {
  'follow-arc': 'follow-tangent',
  'maintain-upright': 'maintain',
  'radial-out': 'follow-radius',
};

const ORIENTATION_TO_FLOW: Record<
  'follow-radius' | 'follow-tangent' | 'maintain',
  RadialTextFlow
> = {
  'follow-radius': 'radial-out',
  'follow-tangent': 'follow-arc',
  maintain: 'maintain-upright',
};

const deriveGlowIntensity = (outerGlow?: Layer['outerGlow']): number => {
  if (!outerGlow || !outerGlow.enabled) {
    return 0;
  }

  const opacity = outerGlow.opacity ?? 0;
  const size = outerGlow.size ?? 0;
  return Math.min(2, (opacity * size) / 50);
};

const computeEffectOverridesFromAppearance = (
  updates: Partial<Layer>,
  current: RadialTextEffects
): Partial<RadialTextEffects> => {
  const overrides: Partial<RadialTextEffects> = {};

  const setOverride = <K extends keyof RadialTextEffects>(
    key: K,
    value: RadialTextEffects[K]
  ) => {
    overrides[key] = value;
  };

  if ('fillColor' in updates && updates.fillColor) {
    setOverride('primaryColor', updates.fillColor);
    setOverride('colorMode', 'solid');
  }

  if ('fillGradient' in updates && updates.fillGradient?.colors?.length) {
    const colors = updates.fillGradient.colors;
    if (colors[0]) setOverride('primaryColor', colors[0]);
    if (colors[colors.length - 1])
      setOverride('secondaryColor', colors[colors.length - 1]);
    setOverride('colorMode', 'gradient');
  }

  if ('fillType' in updates) {
    if (updates.fillType === 'solid') {
      setOverride('colorMode', 'solid');
    } else if (updates.fillType === 'gradient') {
      setOverride('colorMode', 'gradient');
    }
  }

  if ('strokeWidth' in updates && updates.strokeWidth !== undefined) {
    setOverride('strokeWidth', updates.strokeWidth);
  }

  if ('strokeColor' in updates) {
    setOverride('strokeColor', updates.strokeColor ?? current.strokeColor);
  }

  if ('outerGlow' in updates) {
    const outerGlow = updates.outerGlow;
    if (outerGlow && outerGlow.enabled) {
      setOverride(
        'glowColor',
        outerGlow.color ?? current.glowColor ?? current.primaryColor
      );
      setOverride('glowIntensity', deriveGlowIntensity(outerGlow));
    } else {
      setOverride('glowIntensity', 0);
    }
  }

  return overrides;
};

const textFlowToOrientation = (
  flow: RadialTextFlow | undefined
): 'follow-radius' | 'follow-tangent' | 'maintain' => {
  if (!flow) {
    return 'follow-tangent';
  }
  return FLOW_TO_ORIENTATION[flow] ?? 'follow-tangent';
};

const orientationToTextFlow = (
  orientation: 'follow-radius' | 'follow-tangent' | 'maintain'
): RadialTextFlow => ORIENTATION_TO_FLOW[orientation];

export interface RadialTextSettingsPanelProps {
  theme: 'frost_light' | 'frost_dark';
  layer: Layer;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  className?: string;
}

export const RadialTextSettingsPanel: React.FC<
  RadialTextSettingsPanelProps
> = ({ theme, layer, updateLayer, className = '' }) => {
  const radialLayer = layer as RadialTextLayer;

  const currentConfig = useMemo<RadialTextConfig>(
    () => ({
      ...DEFAULT_RADIAL_TEXT_CONFIG,
      ...(radialLayer.radialTextConfig ?? {}),
      theme: radialLayer.radialTextConfig?.theme ?? theme,
    }),
    [radialLayer.radialTextConfig, theme]
  );

  const currentEffects = useMemo<RadialTextEffects>(
    () => ({
      ...DEFAULT_RADIAL_TEXT_EFFECTS,
      ...(radialLayer.radialTextEffects ?? {}),
      theme: radialLayer.radialTextEffects?.theme ?? theme,
    }),
    [radialLayer.radialTextEffects, theme]
  );

  const currentAnimation = useMemo<RadialTextAnimation>(
    () => ({
      ...DEFAULT_RADIAL_TEXT_ANIMATION,
      ...(radialLayer.radialTextAnimation ?? {}),
      theme: radialLayer.radialTextAnimation?.theme ?? theme,
    }),
    [radialLayer.radialTextAnimation, theme]
  );

  const inputClasses =
    theme === 'frost_light'
      ? 'frostlight-input-field frost-w-full'
      : 'frostdark-input-field frost-w-full';

  const updateConfig = useCallback(
    (updates: Partial<RadialTextConfig>) => {
      const merged: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        ...(radialLayer.radialTextConfig ?? {}),
        ...updates,
        theme,
      };

      // Remove legacy fields if present
      delete (merged as any).radius;
      delete (merged as any).characterSpacing;
      delete (merged as any).flowMode;

      updateLayer(layer.id, { radialTextConfig: merged } as any);
    },
    [layer.id, radialLayer.radialTextConfig, theme, updateLayer]
  );

  const updateEffects = useCallback(
    (updates: Partial<RadialTextEffects>) => {
      const merged: RadialTextEffects = {
        ...DEFAULT_RADIAL_TEXT_EFFECTS,
        ...(radialLayer.radialTextEffects ?? {}),
        ...updates,
        theme,
      };
      updateLayer(layer.id, { radialTextEffects: merged } as any);
    },
    [layer.id, radialLayer.radialTextEffects, theme, updateLayer]
  );

  const updateAnimation = useCallback(
    (updates: Partial<RadialTextAnimation>) => {
      const merged: RadialTextAnimation = {
        ...DEFAULT_RADIAL_TEXT_ANIMATION,
        ...(radialLayer.radialTextAnimation ?? {}),
        ...updates,
        theme,
      };
      updateLayer(layer.id, { radialTextAnimation: merged } as any);
    },
    [layer.id, radialLayer.radialTextAnimation, theme, updateLayer]
  );

  const handleAppearanceUpdate = useCallback(
    (updates: Partial<Layer>) => {
      const overrides = computeEffectOverridesFromAppearance(
        updates,
        currentEffects
      );
      const next: Partial<Layer> = { ...updates };

      if (Object.keys(overrides).length > 0) {
        (next as any).radialTextEffects = {
          ...currentEffects,
          ...overrides,
          theme,
        };
      }

      updateLayer(layer.id, next);
    },
    [currentEffects, layer.id, theme, updateLayer]
  );

  // Migrate legacy config keys on mount
  useEffect(() => {
    if (!radialLayer.radialTextConfig) {
      return;
    }

    const legacy = radialLayer.radialTextConfig as unknown as Record<
      string,
      unknown
    >;
    const migrations: Partial<RadialTextConfig> = {};

    if (
      'radius' in legacy &&
      legacy.radius !== undefined &&
      currentConfig.innerRadius === undefined
    ) {
      migrations.innerRadius =
        (Number(legacy.radius) || DEFAULT_RADIAL_TEXT_CONFIG.innerRadius) ??
        100;
    }

    if (
      'characterSpacing' in legacy &&
      legacy.characterSpacing !== undefined &&
      currentConfig.letterSpacing === undefined
    ) {
      migrations.letterSpacing =
        (Number(legacy.characterSpacing) ||
          DEFAULT_RADIAL_TEXT_CONFIG.letterSpacing) ??
        0;
    }

    if (
      'flowMode' in legacy &&
      legacy.flowMode !== undefined &&
      !currentConfig.textFlow
    ) {
      migrations.textFlow = legacy.flowMode as RadialTextFlow;
    }

    if (Object.keys(migrations).length > 0) {
      updateConfig(migrations);
    }
  }, []);

  useEffect(() => {
    if (currentConfig.theme !== theme) {
      updateConfig({ theme });
    }
  }, [currentConfig.theme, theme, updateConfig]);

  useEffect(() => {
    if (currentEffects.theme !== theme) {
      updateEffects({ theme });
    }
  }, [currentEffects.theme, theme, updateEffects]);

  useEffect(() => {
    if (currentAnimation.theme !== theme) {
      updateAnimation({ theme });
    }
  }, [currentAnimation.theme, theme, updateAnimation]);

  const fontWeightOptions = useMemo(
    () => [
      { value: 'lighter', label: 'Lighter' },
      { value: 'normal', label: 'Normal' },
      { value: 'bold', label: 'Bold' },
      { value: '300', label: '300' },
      { value: '400', label: '400' },
      { value: '500', label: '500' },
      { value: '600', label: '600' },
      { value: '700', label: '700' },
    ],
    []
  );

  const textAlignOptions = useMemo(
    () => [
      { value: 'start', label: 'Start' },
      { value: 'center', label: 'Center' },
      { value: 'end', label: 'End' },
    ],
    []
  );

  const truncationOptions = useMemo(
    () => [
      { value: 'ellipsis', label: 'Ellipsis' },
      { value: 'wrap', label: 'Wrap' },
      { value: 'none', label: 'None' },
    ],
    []
  );

  const directionOptions = useMemo(
    () => [
      { value: 'clockwise', label: 'Clockwise' },
      { value: 'counterclockwise', label: 'Counter Clockwise' },
    ],
    []
  );

  const animationTypeOptions = useMemo(
    () => [
      { value: 'none', label: 'None' },
      { value: 'typewriter', label: 'Typewriter' },
      { value: 'spiral-in', label: 'Spiral In' },
      { value: 'fade-sequential', label: 'Fade Sequential' },
      { value: 'wave', label: 'Wave' },
    ],
    []
  );

  const audioResponseOptions = useMemo(
    () => [
      { value: 'color', label: 'Color' },
      { value: 'size', label: 'Size' },
      { value: 'position', label: 'Position' },
      { value: 'rotation', label: 'Rotation' },
    ],
    []
  );

  const handleFontWeightChange = useCallback(
    (value: string) => {
      const numeric = Number(value);
      if (!isNaN(numeric)) {
        updateConfig({
          fontWeight: numeric as NonNullable<RadialTextConfig['fontWeight']>,
        });
      } else {
        updateConfig({
          fontWeight: value as NonNullable<RadialTextConfig['fontWeight']>,
        });
      }
    },
    [updateConfig]
  );

  const handleLetterSpacingChange = useCallback(
    (value: number) => {
      updateConfig({ letterSpacing: Number.isFinite(value) ? value : 0 });
    },
    [updateConfig]
  );

  const handleWordSpacingChange = useCallback(
    (value: number) => {
      updateConfig({ wordSpacing: Number.isFinite(value) ? value : 0 });
    },
    [updateConfig]
  );

  const handleStrokeWidthChange = useCallback(
    (value: number) => {
      updateEffects({ strokeWidth: value });
    },
    [updateEffects]
  );

  const orientation = textFlowToOrientation(currentConfig.textFlow);

  return (
    <div className={`radial-text-settings-panel ${className}`}>
      <PropertySection
        title='Text Content'
        defaultExpanded
        theme={theme}
        collapsible
      >
        <PropertyRow label='Text'>
          <input
            type='text'
            value={currentConfig.text}
            onChange={event => updateConfig({ text: event.target.value })}
            className={inputClasses}
            placeholder='Enter your text...'
          />
        </PropertyRow>

        <PropertyRow label='Font Family'>
          <input
            type='text'
            value={currentConfig.fontFamily ?? ''}
            onChange={event => updateConfig({ fontFamily: event.target.value })}
            className={inputClasses}
            placeholder='inherit'
          />
        </PropertyRow>

        <PropertyRow label={`Font Size (${currentConfig.fontSize ?? 16}px)`}>
          <SliderControl
            label='Font Size'
            value={currentConfig.fontSize ?? 16}
            min={8}
            max={160}
            step={1}
            onChange={value => updateConfig({ fontSize: value })}
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        <PropertyRow label='Font Weight'>
          <SelectControl
            label='Font Weight'
            value={String(currentConfig.fontWeight ?? 'normal')}
            options={fontWeightOptions}
            onChange={handleFontWeightChange}
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        <PropertyRow
          label={`Letter Spacing (${currentConfig.letterSpacing ?? 0}px)`}
        >
          <SliderControl
            label='Letter Spacing'
            value={currentConfig.letterSpacing ?? 0}
            min={-10}
            max={40}
            step={0.5}
            onChange={handleLetterSpacingChange}
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        <PropertyRow
          label={`Word Spacing (${currentConfig.wordSpacing ?? 0}px)`}
        >
          <SliderControl
            label='Word Spacing'
            value={currentConfig.wordSpacing ?? 0}
            min={-10}
            max={60}
            step={1}
            onChange={handleWordSpacingChange}
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        <PropertyRow label='Text Align'>
          <SelectControl
            label='Text Align'
            value={currentConfig.textAlign ?? 'center'}
            options={textAlignOptions}
            onChange={value =>
              updateConfig({
                textAlign: value as NonNullable<RadialTextConfig['textAlign']>,
              })
            }
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        <PropertyRow label='Auto Size'>
          <CheckboxControl
            label='Auto Size'
            checked={!!currentConfig.autoSize}
            onChange={checked => updateConfig({ autoSize: checked })}
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        {!currentConfig.autoSize && (
          <PropertyRow label='Max Width (px)'>
            <NumericInput
              label='Max Width (px)'
              value={currentConfig.maxTextWidth ?? 0}
              min={0}
              max={2000}
              step={10}
              theme={theme}
              onChange={value => updateConfig({ maxTextWidth: value })}
            />
          </PropertyRow>
        )}

        <PropertyRow label='Text Truncation'>
          <SelectControl
            label='Text Truncation'
            value={currentConfig.textTruncation ?? 'ellipsis'}
            options={truncationOptions}
            onChange={value =>
              updateConfig({ textTruncation: value as TextTruncationMode })
            }
            theme={theme}
            hideLabel
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection
        title='Radial Layout'
        defaultExpanded
        theme={theme}
        collapsible
      >
        <RadialSettings
          innerRadius={currentConfig.innerRadius}
          startAngle={currentConfig.startAngle}
          endAngle={currentConfig.endAngle}
          arcMode={!!currentConfig.arcMode}
          radialOrientation={orientation}
          onInnerRadiusChange={value => updateConfig({ innerRadius: value })}
          onStartAngleChange={value => updateConfig({ startAngle: value })}
          onEndAngleChange={value => updateConfig({ endAngle: value })}
          onArcModeChange={value => updateConfig({ arcMode: value })}
          onRadialOrientationChange={value =>
            updateConfig({
              textFlow: orientationToTextFlow(
                value as 'follow-radius' | 'follow-tangent' | 'maintain'
              ),
            })
          }
          theme={theme}
          showOuterRadius={false}
          showSizingMode={false}
        />

        <PropertyRow label='Direction'>
          <SelectControl
            label='Direction'
            value={currentConfig.direction ?? 'clockwise'}
            options={directionOptions}
            onChange={value =>
              updateConfig({
                direction: value as 'clockwise' | 'counterclockwise',
              })
            }
            theme={theme}
            hideLabel
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection
        title='Visual Style'
        defaultExpanded
        theme={theme}
        collapsible
      >
        <ColorSettings
          primaryColor={currentEffects.primaryColor}
          secondaryColor={currentEffects.secondaryColor}
          glowColor={currentEffects.glowColor}
          colorMode={currentEffects.colorMode}
          onPrimaryColorChange={color =>
            updateEffects({
              primaryColor: color,
              colorMode: currentEffects.colorMode,
            })
          }
          onSecondaryColorChange={color =>
            updateEffects({
              secondaryColor: color ?? currentEffects.secondaryColor,
            })
          }
          onGlowColorChange={color => updateEffects({ glowColor: color })}
          onColorModeChange={mode =>
            updateEffects({ colorMode: mode as RadialTextEffects['colorMode'] })
          }
          theme={theme}
          showGlowColor
        />

        <EffectsSettings
          glowIntensity={currentEffects.glowIntensity}
          glowColor={currentEffects.glowColor ?? currentEffects.primaryColor}
          blur={currentEffects.blur}
          onGlowIntensityChange={value =>
            updateEffects({ glowIntensity: value })
          }
          onGlowColorChange={color => updateEffects({ glowColor: color })}
          onBlurChange={value => updateEffects({ blur: value })}
          theme={theme}
          showBlur
        />

        <PropertyRow
          label={`Stroke Width (${currentEffects.strokeWidth ?? 0}px)`}
        >
          <SliderControl
            label='Stroke Width'
            value={currentEffects.strokeWidth ?? 0}
            min={0}
            max={20}
            step={0.5}
            onChange={handleStrokeWidthChange}
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        {(currentEffects.strokeWidth ?? 0) > 0 && (
          <PropertyRow label='Stroke Color'>
            <ColorPicker
              label='Stroke Color'
              value={currentEffects.strokeColor ?? '#000000'}
              onChange={color => updateEffects({ strokeColor: color })}
              theme={theme}
              hideLabel
            />
          </PropertyRow>
        )}
      </PropertySection>

      <PropertySection
        title='Appearance (Advanced)'
        defaultExpanded={false}
        theme={theme}
        collapsible
      >
        <AppearancePanel
          layer={layer}
          onUpdate={handleAppearanceUpdate}
          theme={theme}
        />
      </PropertySection>

      <PropertySection
        title='Animation'
        defaultExpanded
        theme={theme}
        collapsible
      >
        <PropertyRow label='Text Animation'>
          <SelectControl
            label='Text Animation'
            value={currentAnimation.textAnimationType ?? 'none'}
            options={animationTypeOptions}
            onChange={value =>
              updateAnimation({
                textAnimationType: value as RadialTextAnimationType,
              })
            }
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        {currentAnimation.textAnimationType &&
          currentAnimation.textAnimationType !== 'none' && (
            <>
              <PropertyRow
                label={`Duration (${currentAnimation.animationDuration ?? 2000}ms)`}
              >
                <SliderControl
                  label='Duration'
                  value={currentAnimation.animationDuration ?? 2000}
                  min={100}
                  max={10000}
                  step={100}
                  onChange={value =>
                    updateAnimation({ animationDuration: value })
                  }
                  theme={theme}
                  hideLabel
                />
              </PropertyRow>

              <PropertyRow
                label={`Stagger Delay (${currentAnimation.staggerDelay ?? 100}ms)`}
              >
                <SliderControl
                  label='Stagger Delay'
                  value={currentAnimation.staggerDelay ?? 100}
                  min={0}
                  max={1000}
                  step={25}
                  onChange={value => updateAnimation({ staggerDelay: value })}
                  theme={theme}
                  hideLabel
                />
              </PropertyRow>
            </>
          )}

        <AnimationSettings
          responseSpeed={currentAnimation.responseSpeed}
          smoothing={currentAnimation.smoothing}
          pulseMode={currentAnimation.pulseMode}
          onResponseSpeedChange={value =>
            updateAnimation({ responseSpeed: value })
          }
          onSmoothingChange={value => updateAnimation({ smoothing: value })}
          onPulseModeChange={value =>
            updateAnimation({
              pulseMode: value as RadialTextAnimation['pulseMode'],
            })
          }
          theme={theme}
          showSmoothing
        />
      </PropertySection>

      <PropertySection
        title='Audio Reactivity'
        defaultExpanded={false}
        theme={theme}
        collapsible
      >
        <PropertyRow label='Enable Audio Reactive'>
          <CheckboxControl
            label='Audio Reactive'
            checked={!!currentAnimation.audioReactive}
            onChange={checked => updateAnimation({ audioReactive: checked })}
            theme={theme}
            hideLabel
          />
        </PropertyRow>

        {currentAnimation.audioReactive && (
          <PropertyRow label='Audio Response'>
            <SelectControl
              label='Audio Response'
              value={currentAnimation.audioResponseMapping ?? 'color'}
              options={audioResponseOptions}
              onChange={value =>
                updateAnimation({
                  audioResponseMapping: value as AudioResponseMapping,
                })
              }
              theme={theme}
              hideLabel
            />
          </PropertyRow>
        )}
      </PropertySection>
    </div>
  );
};

export default RadialTextSettingsPanel;
