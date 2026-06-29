/**
 * useVisualizationSettings - Main settings management hook
 * Single Responsibility: Manage visualization settings state and changes
 */

import { useCallback, useMemo } from 'react';
import type { VisualizationSettings } from '../types';
import { getDefaultSettings } from '../utils/settings-defaults';

export interface UseVisualizationSettingsProps {
  initialSettings: Partial<VisualizationSettings>;
  onUpdate: (updates: Partial<VisualizationSettings>) => void;
}

export interface UseVisualizationSettingsReturn {
  settings: VisualizationSettings;
  updateSettings: (updates: Partial<VisualizationSettings>) => void;
  updateSetting: <K extends keyof VisualizationSettings>(
    key: K,
    value: VisualizationSettings[K]
  ) => void;
  resetSettings: () => void;
}

/**
 * Hook to manage visualization settings
 */
export function useVisualizationSettings({
  initialSettings,
  onUpdate,
}: UseVisualizationSettingsProps): UseVisualizationSettingsReturn {
  // Memoize settings with defaults merged in
  const settings = useMemo(() => {
    const visualizationType = initialSettings.visualizationType || 'bar';
    const defaults = getDefaultSettings(visualizationType);

    // Merge defaults with provided settings (provided settings take precedence)
    return {
      ...defaults,
      ...initialSettings,
      visualizationType, // Ensure type is always set
    } as VisualizationSettings;
  }, [initialSettings]);

  // Update multiple settings at once
  const updateSettings = useCallback(
    (updates: Partial<VisualizationSettings>) => {
      onUpdate(updates);
    },
    [onUpdate]
  );

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof VisualizationSettings>(
      key: K,
      value: VisualizationSettings[K]
    ) => {
      onUpdate({ [key]: value } as Partial<VisualizationSettings>);
    },
    [onUpdate]
  );

  // Reset to default settings (will be implemented with defaults)
  const resetSettings = useCallback(() => {
    // This will be implemented when we integrate with the parent component
    console.log('Reset settings');
  }, []);

  return {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
  };
}
