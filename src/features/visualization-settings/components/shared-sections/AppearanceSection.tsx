/**
 * AppearanceSection - Appearance settings wrapper
 * Single Responsibility: Integrate full appearance panel for visualizations
 *
 * This component wraps the existing AppearancePanel and adapts it for
 * visualization settings, providing blend mode, opacity, and full appearance
 * effects (Fill, Stroke, Shadows, Glows, Bevel/Emboss, Global Light).
 */

import React from 'react';
import EditableNumericValue from '../../../../components/EditableNumericValue';
import { AppearancePanel } from '../../../../components/panels/AppearancePanel';
import {
  SelectControl,
  SliderControl,
} from '../../../../components/PropertyPanel/controls';
import PropertyRow from '../../../../components/PropertyRow';
import PropertySection from '../../../../components/PropertySection';
import {
  BLEND_MODE_OPTIONS,
  formatBlendMode,
} from '../../../../features/appearance/utils/blend-mode';

import type { Layer } from '../../../../types/layer-types';
import { useAppearanceMapping } from '../../hooks/useAppearanceMapping';
import type { SectionProps } from '../../types';
import { COMMON_CONSTRAINTS } from '../../utils/settings-schema';

interface AppearanceSectionProps extends SectionProps {
  settings: {
    blendMode: string;
    opacity: number;
    // Future: Full appearance panel integration
    // fillType?: 'none' | 'solid' | 'gradient';
    // fillColor?: string;
    // strokeType?: 'none' | 'solid' | 'gradient';
    // dropShadow?: any;
    // innerShadow?: any;
    // outerGlow?: any;
    // innerGlow?: any;
    // bevelEmboss?: any;
    // globalLight?: any;
  };
}

const blendModeOptions = BLEND_MODE_OPTIONS.map(mode => ({
  value: mode,
  label: formatBlendMode(mode),
}));

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  settings,
  onChange,
  theme,
  className = '',
}) => {
  return (
    <PropertySection
      title='Appearance'
      collapsible={true}
      defaultExpanded={true}
      theme={theme}
      className={className}
    >
      {/* Blend Mode */}
      <PropertyRow label='Blend Mode'>
        <SelectControl
          label='Blend Mode'
          value={settings.blendMode}
          options={blendModeOptions}
          onChange={value => onChange({ blendMode: value })}
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
              value={settings.opacity}
              onChange={value => onChange({ opacity: value })}
              min={COMMON_CONSTRAINTS.opacity.min}
              max={COMMON_CONSTRAINTS.opacity.max}
              precision={2}
              theme={theme}
              style={{ fontWeight: 'bold' }}
            />
          </span>
        }
      >
        <SliderControl
          label='Opacity'
          value={settings.opacity}
          min={COMMON_CONSTRAINTS.opacity.min}
          max={COMMON_CONSTRAINTS.opacity.max}
          step={COMMON_CONSTRAINTS.opacity.step}
          onChange={value => onChange({ opacity: value })}
          theme={theme}
          hideLabel={true}
          editableValue={false}
        />
      </PropertyRow>

      {/* Full Appearance Panel */}
      {(() => {
        // Map to/from existing AppearancePanel using adapter
        const { appearanceSettings, updateAppearanceSettings } =
          useAppearanceMapping({
            settings: settings as any,
            onUpdate: onChange as any,
          });

        const virtualLayer: Layer = {
          id: 'viz-appearance',
          name: 'Visualization Appearance',
          type: 'equalizer',
          visible: true,
          opacity: settings.opacity,
          blendMode: settings.blendMode,
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          // Fill
          fillType: appearanceSettings.fillType,
          fillColor: appearanceSettings.fillColor,
          fillGradient: appearanceSettings.fillGradient as any,
          // Stroke
          strokeType: appearanceSettings.strokeType,
          strokeWidth: appearanceSettings.strokeWidth,
          strokeColor: appearanceSettings.strokeColor,
          strokeAlign: (appearanceSettings.strokeAlign as any) || 'center',
          // Effects
          dropShadow: appearanceSettings.dropShadow as any,
          innerShadow: appearanceSettings.innerShadow as any,
          outerGlow: appearanceSettings.outerGlow as any,
          innerGlow: appearanceSettings.innerGlow as any,
          bevelEmboss: appearanceSettings.bevelEmboss as any,
          globalLight: appearanceSettings.globalLight as any,
        } as any;

        const handleAppearanceUpdate = (layerUpdates: Partial<Layer>) => {
          const mappingUpdates: any = {};
          const keys = [
            'fillType',
            'fillColor',
            'fillGradient',
            'strokeType',
            'strokeWidth',
            'strokeColor',
            'strokeAlign',
            'dropShadow',
            'innerShadow',
            'outerGlow',
            'innerGlow',
            'bevelEmboss',
            'globalLight',
          ] as const;
          for (const k of keys) {
            if (Object.prototype.hasOwnProperty.call(layerUpdates, k)) {
              (mappingUpdates as any)[k] = (layerUpdates as any)[k];
            }
          }
          updateAppearanceSettings(mappingUpdates);
        };

        return (
          <div style={{ marginTop: 8 }}>
            <AppearancePanel
              layer={virtualLayer}
              onUpdate={handleAppearanceUpdate}
              theme={theme}
            />
          </div>
        );
      })()}
    </PropertySection>
  );
};

export default AppearanceSection;
