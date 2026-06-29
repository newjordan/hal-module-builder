/**
 * useAppearanceMapping - Map between visualization and appearance panel schemas
 * Single Responsibility: Handle bidirectional mapping between settings formats
 */

import { useCallback, useMemo } from 'react';
import type { AppearancePanelMapping, VisualizationSettings } from '../types';

export interface UseAppearanceMappingProps {
  settings: VisualizationSettings;
  onUpdate: (updates: Partial<VisualizationSettings>) => void;
}

export interface UseAppearanceMappingReturn {
  appearanceSettings: AppearancePanelMapping;
  updateAppearanceSettings: (updates: Partial<AppearancePanelMapping>) => void;
}

/**
 * Hook to map visualization settings to/from appearance panel format
 */
export function useAppearanceMapping({
  settings,
  onUpdate,
}: UseAppearanceMappingProps): UseAppearanceMappingReturn {
  // Map visualization settings to appearance panel format
  const appearanceSettings = useMemo<AppearancePanelMapping>(() => {
    const a = settings.appearance || ({} as any);
    return {
      // Fill - map from color settings
      fillType: settings.colorMode === 'solid' ? 'solid' : 'gradient',
      fillColor: settings.primaryColor,
      fillGradient:
        settings.colorMode === 'gradient'
          ? {
              type: (a.fillGradient?.type as any) || 'linear',
              colors: a.fillGradient?.colors || [
                settings.primaryColor,
                settings.secondaryColor || '#ffffff',
              ],
              stops: a.fillGradient?.stops || [0, 1],
              angle: a.fillGradient?.angle ?? 0,
              centerX: a.fillGradient?.centerX,
              centerY: a.fillGradient?.centerY,
            }
          : undefined,

      // Stroke - from appearance or default
      strokeType: a.strokeType || 'none',
      strokeWidth: a.strokeWidth || 0,
      strokeColor: a.strokeColor,
      strokeAlign: a.strokeAlign || 'center',

      // Effects - from appearance
      dropShadow: a.dropShadow,
      innerShadow: a.innerShadow,
      outerGlow: a.outerGlow,
      innerGlow: a.innerGlow,
      bevelEmboss: a.bevelEmboss,
      globalLight: a.globalLight,

      // Blend
      blendMode: settings.blendMode,
      opacity: settings.opacity,
    };
  }, [settings]);

  // Map appearance panel changes back to visualization settings
  const updateAppearanceSettings = useCallback(
    (updates: Partial<AppearancePanelMapping>) => {
      const visualizationUpdates: Partial<VisualizationSettings> = {};

      // Map blend mode and opacity
      if (updates.blendMode !== undefined) {
        visualizationUpdates.blendMode = updates.blendMode;
      }
      if (updates.opacity !== undefined) {
        visualizationUpdates.opacity = updates.opacity;
      }

      // Map fill settings to color settings
      if (updates.fillType !== undefined) {
        if (updates.fillType === 'solid') {
          visualizationUpdates.colorMode = 'solid';
        } else if (updates.fillType === 'gradient') {
          visualizationUpdates.colorMode = 'gradient';
        }
      }
      if (updates.fillColor !== undefined) {
        visualizationUpdates.primaryColor = updates.fillColor;
      }
      if (updates.fillGradient !== undefined) {
        const gradient = updates.fillGradient as any;
        if (gradient?.colors && gradient.colors.length >= 2) {
          visualizationUpdates.primaryColor = gradient.colors[0];
          visualizationUpdates.secondaryColor = gradient.colors[1];
        }
      }

      // Persist all other appearance updates under settings.appearance
      const passthroughKeys: (keyof AppearancePanelMapping)[] = [
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
        'fillGradient',
      ];
      const currentAppearance = (settings as any).appearance || {};
      const nextAppearance: any = { ...currentAppearance };
      for (const k of passthroughKeys) {
        if (Object.prototype.hasOwnProperty.call(updates, k)) {
          (nextAppearance as any)[k] = (updates as any)[k];
        }
      }
      if (Object.keys(nextAppearance).length > 0) {
        (visualizationUpdates as any).appearance = nextAppearance;
      }

      // Apply updates if any
      if (Object.keys(visualizationUpdates).length > 0) {
        onUpdate(visualizationUpdates);
      }
    },
    [onUpdate]
  );

  return {
    appearanceSettings,
    updateAppearanceSettings,
  };
}
