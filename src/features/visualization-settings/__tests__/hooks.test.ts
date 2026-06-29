/**
 * Hooks tests - Automated verification of hooks
 */

import { renderHook } from '@testing-library/react';
import { useAppearanceMapping } from '../hooks/useAppearanceMapping';
import { useVisualizationSettings } from '../hooks/useVisualizationSettings';
import { DEFAULT_BAR_SETTINGS } from '../utils/settings-defaults';

describe('Visualization Settings - Hooks', () => {
  describe('useVisualizationSettings', () => {
    it('should initialize with provided settings', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useVisualizationSettings({
          initialSettings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      expect(result.current.settings).toEqual(DEFAULT_BAR_SETTINGS);
    });

    it('should merge partial settings with defaults', () => {
      const onUpdate = jest.fn();
      const partialSettings = {
        visualizationType: 'bar' as const,
        barCount: 32,
        // Missing barHeight, barWidth, etc.
      };

      const { result } = renderHook(() =>
        useVisualizationSettings({
          initialSettings: partialSettings,
          onUpdate,
        })
      );

      // Should have the provided barCount
      expect(result.current.settings.barCount).toBe(32);

      // Should have default values for missing properties
      expect(result.current.settings.barHeight).toBe(200); // from DEFAULT_BAR_SETTINGS
      expect(result.current.settings.barWidth).toBe(8); // from DEFAULT_BAR_SETTINGS
      expect(result.current.settings.rotation).toBe(0); // from DEFAULT_COMMON_SETTINGS
      expect(result.current.settings.opacity).toBe(1); // from DEFAULT_COMMON_SETTINGS
    });

    it('should update multiple settings', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useVisualizationSettings({
          initialSettings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      const updates = { barCount: 64, barWidth: 10 };
      result.current.updateSettings(updates);

      expect(onUpdate).toHaveBeenCalledWith(updates);
    });

    it('should update single setting', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useVisualizationSettings({
          initialSettings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      result.current.updateSetting('barCount', 64);

      expect(onUpdate).toHaveBeenCalledWith({ barCount: 64 });
    });
  });

  describe('useAppearanceMapping', () => {
    it('should map visualization settings to appearance format', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      const appearance = result.current.appearanceSettings;

      expect(appearance.blendMode).toBe(DEFAULT_BAR_SETTINGS.blendMode);
      expect(appearance.opacity).toBe(DEFAULT_BAR_SETTINGS.opacity);
      expect(appearance.fillColor).toBe(DEFAULT_BAR_SETTINGS.primaryColor);
    });

    it('should map solid color mode correctly', () => {
      const onUpdate = jest.fn();
      const settings = { ...DEFAULT_BAR_SETTINGS, colorMode: 'solid' as const };
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings,
          onUpdate,
        })
      );

      expect(result.current.appearanceSettings.fillType).toBe('solid');
    });

    it('should map gradient color mode correctly', () => {
      const onUpdate = jest.fn();
      const settings = {
        ...DEFAULT_BAR_SETTINGS,
        colorMode: 'gradient' as const,
      };
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings,
          onUpdate,
        })
      );

      expect(result.current.appearanceSettings.fillType).toBe('gradient');
      expect(result.current.appearanceSettings.fillGradient).toBeDefined();
    });

    it('should update blend mode', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      result.current.updateAppearanceSettings({ blendMode: 'multiply' });

      expect(onUpdate).toHaveBeenCalledWith({ blendMode: 'multiply' });
    });

    it('should update opacity', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      result.current.updateAppearanceSettings({ opacity: 0.5 });

      expect(onUpdate).toHaveBeenCalledWith({ opacity: 0.5 });
    });

    it('should map fill color to primary color', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      result.current.updateAppearanceSettings({ fillColor: '#ff0000' });

      expect(onUpdate).toHaveBeenCalledWith({ primaryColor: '#ff0000' });
    });

    it('should map gradient colors correctly', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      result.current.updateAppearanceSettings({
        fillGradient: {
          type: 'linear',
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
          angle: 0,
        },
      });

      expect(onUpdate).toHaveBeenCalledWith({
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        appearance: {
          fillGradient: {
            type: 'linear',
            colors: ['#ff0000', '#00ff00'],
            stops: [0, 1],
            angle: 0,
          },
        },
      });
    });

    it('should map fill type to color mode', () => {
      const onUpdate = jest.fn();
      const { result } = renderHook(() =>
        useAppearanceMapping({
          settings: DEFAULT_BAR_SETTINGS,
          onUpdate,
        })
      );

      result.current.updateAppearanceSettings({ fillType: 'solid' });
      expect(onUpdate).toHaveBeenCalledWith({ colorMode: 'solid' });

      result.current.updateAppearanceSettings({ fillType: 'gradient' });
      expect(onUpdate).toHaveBeenCalledWith({ colorMode: 'gradient' });
    });
  });
});
