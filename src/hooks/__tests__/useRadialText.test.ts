/**
 * useRadialText Hook Tests
 * =======================
 *
 * Comprehensive unit tests for useRadialText hook functionality.
 * Tests hook behavior, caching, validation, and performance optimizations.
 *
 * @version 1.0.0
 */

import { renderHook, act } from '@testing-library/react';
import {
  useRadialText,
  useSimpleRadialText,
  useRadialTextPreset,
  UseRadialTextArgs,
} from '../useRadialText';
import {
  RadialTextConfig,
  DEFAULT_RADIAL_TEXT_CONFIG,
  FrostTheme,
} from '../../types/radial-text-types';

// Mock RadialTextService
jest.mock('../../services/radial/RadialTextService', () => ({
  RadialTextService: {
    calculateTextLayout: jest.fn(() => ({
      characters: [
        {
          char: 'T',
          index: 0,
          position: { x: 100, y: 0, angle: 0, angleDegrees: 0 },
          transform: 'translate(100px, 0px) rotate(0deg)',
          scale: 1,
          rotation: 0,
          opacity: 1,
          visible: true,
        },
        {
          char: 'E',
          index: 1,
          position: { x: 0, y: 100, angle: 90, angleDegrees: 90 },
          transform: 'translate(0px, 100px) rotate(90deg)',
          scale: 1,
          rotation: 0,
          opacity: 1,
          visible: true,
        },
      ],
      usedArcLength: 157.08, // π * 100 / 2
      wasTruncated: false,
      metrics: {
        characterCount: 2,
        layoutTime: 5.2,
        renderTime: 0,
        frameTime: 0,
        memoryUsage: 2048,
        performanceOk: true,
      },
    })),
    validateConfig: jest.fn(() => ({
      isValid: true,
      errors: [],
      warnings: [],
    })),
    createPreset: jest.fn((presetName, centerX, centerY, radius, theme) => ({
      ...DEFAULT_RADIAL_TEXT_CONFIG,
      theme,
      text: `${presetName.toUpperCase()} TEXT`,
      centerX,
      centerY,
      innerRadius: radius,
    })),
  },
}));

describe('useRadialText', () => {
  const mockConfig: RadialTextConfig = {
    ...DEFAULT_RADIAL_TEXT_CONFIG,
    theme: 'frost_light',
    text: 'TEST',
    centerX: 200,
    centerY: 200,
    innerRadius: 100,
    startAngle: 0,
    endAngle: 180,
  };

  const mockCenter = { x: 200, y: 200 };
  const mockTheme: FrostTheme = 'frost_light';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return initial layout data', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(result.current.characters).toHaveLength(2);
      expect(result.current.characters[0].char).toBe('T');
      expect(result.current.characters[1].char).toBe('E');
      expect(result.current.isReady).toBe(true);
      expect(result.current.isValid).toBe(true);
      expect(result.current.usedArcLength).toBe(157.08);
    });

    it('should resolve config with center point and theme', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: { ...mockConfig, centerX: 0, centerY: 0 }, // Different center in config
          center: mockCenter,
          theme: 'frost_dark',
        })
      );

      const resolvedConfig = result.current.resolvedConfig;
      expect(resolvedConfig.centerX).toBe(200); // Should use center prop
      expect(resolvedConfig.centerY).toBe(200); // Should use center prop
      expect(resolvedConfig.theme).toBe('frost_dark'); // Should use theme prop
    });

    it('should return validation results', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(result.current.validation.isValid).toBe(true);
      expect(result.current.validation.errors).toEqual([]);
      expect(result.current.validation.warnings).toEqual([]);
    });

    it('should return performance metrics', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      const metrics = result.current.metrics;
      expect(metrics.characterCount).toBe(2);
      expect(metrics.layoutTime).toBe(5.2);
      expect(metrics.performanceOk).toBe(true);
    });
  });

  describe('Caching Behavior', () => {
    it('should use cached layout when config unchanged', () => {
      const { RadialTextService } = require('../../services/radial/RadialTextService');

      const { result, rerender } = renderHook(
        ({ config }) =>
          useRadialText({
            config,
            center: mockCenter,
            theme: mockTheme,
            enableCaching: true,
          }),
        { initialProps: { config: mockConfig } }
      );

      // Initial render should call service
      expect(RadialTextService.calculateTextLayout).toHaveBeenCalledTimes(1);

      // Rerender with same config should not call service again
      rerender({ config: mockConfig });
      expect(RadialTextService.calculateTextLayout).toHaveBeenCalledTimes(1);
    });

    it('should recalculate layout when config changes', () => {
      const { RadialTextService } = require('../../services/radial/RadialTextService');

      const { result, rerender } = renderHook(
        ({ config }) =>
          useRadialText({
            config,
            center: mockCenter,
            theme: mockTheme,
            enableCaching: true,
          }),
        { initialProps: { config: mockConfig } }
      );

      expect(RadialTextService.calculateTextLayout).toHaveBeenCalledTimes(1);

      // Change config should trigger recalculation
      const changedConfig = { ...mockConfig, text: 'CHANGED' };
      rerender({ config: changedConfig });
      expect(RadialTextService.calculateTextLayout).toHaveBeenCalledTimes(2);
    });

    it('should disable caching when requested', () => {
      const { RadialTextService } = require('../../services/radial/RadialTextService');

      const { result, rerender } = renderHook(
        ({ config }) =>
          useRadialText({
            config,
            center: mockCenter,
            theme: mockTheme,
            enableCaching: false,
          }),
        { initialProps: { config: mockConfig } }
      );

      expect(RadialTextService.calculateTextLayout).toHaveBeenCalledTimes(1);

      // Rerender should call service again when caching disabled
      rerender({ config: mockConfig });
      expect(RadialTextService.calculateTextLayout).toHaveBeenCalledTimes(2);
    });
  });

  describe('Methods', () => {
    it('should provide updateLayout method', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(typeof result.current.updateLayout).toBe('function');

      // Test updateLayout call
      act(() => {
        result.current.updateLayout({ fontSize: 20 });
      });

      // Should not throw errors
      expect(result.current.isReady).toBe(true);
    });

    it('should provide updateCharacter method', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(typeof result.current.updateCharacter).toBe('function');

      // Test updateCharacter call
      act(() => {
        result.current.updateCharacter(0, { opacity: 0.5 });
      });

      // Should not throw errors
      expect(result.current.isReady).toBe(true);
    });

    it('should provide getCharacter method', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(typeof result.current.getCharacter).toBe('function');

      const firstChar = result.current.getCharacter(0);
      expect(firstChar).not.toBeNull();
      expect(firstChar?.char).toBe('T');

      const invalidChar = result.current.getCharacter(999);
      expect(invalidChar).toBeNull();
    });

    it('should provide calculateOptimalSize method', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(typeof result.current.calculateOptimalSize).toBe('function');

      const optimalSize = result.current.calculateOptimalSize();
      expect(typeof optimalSize).toBe('number');
      expect(optimalSize).toBeGreaterThan(0);
    });

    it('should provide validateConfig method', () => {
      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(typeof result.current.validateConfig).toBe('function');

      const validation = result.current.validateConfig();
      expect(validation.isValid).toBe(true);
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', () => {
      const { RadialTextService } = require('../../services/radial/RadialTextService');

      RadialTextService.validateConfig.mockReturnValueOnce({
        isValid: false,
        errors: ['Invalid configuration'],
        warnings: [],
      });

      const { result } = renderHook(() =>
        useRadialText({
          config: mockConfig,
          center: mockCenter,
          theme: mockTheme,
        })
      );

      expect(result.current.isValid).toBe(false);
      expect(result.current.isReady).toBe(false);
      expect(result.current.characters).toEqual([]);
    });

    it('should handle service errors gracefully', () => {
      const { RadialTextService } = require('../../services/radial/RadialTextService');

      RadialTextService.calculateTextLayout.mockImplementationOnce(() => {
        throw new Error('Service error');
      });

      // Should not throw error, but should handle gracefully
      expect(() => {
        renderHook(() =>
          useRadialText({
            config: mockConfig,
            center: mockCenter,
            theme: mockTheme,
          })
        );
      }).not.toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    it('should memoize config resolution', () => {
      const { result, rerender } = renderHook(
        ({ center, theme }) =>
          useRadialText({
            config: mockConfig,
            center,
            theme,
            enableOptimizations: true,
          }),
        {
          initialProps: {
            center: mockCenter,
            theme: mockTheme,
          },
        }
      );

      const initialResolvedConfig = result.current.resolvedConfig;

      // Rerender with same props
      rerender({ center: mockCenter, theme: mockTheme });

      // Should return same reference (memoized)
      expect(result.current.resolvedConfig).toBe(initialResolvedConfig);
    });

    it('should handle configuration changes efficiently', () => {
      const { RadialTextService } = require('../../services/radial/RadialTextService');

      const { result, rerender } = renderHook(
        ({ config }) =>
          useRadialText({
            config,
            center: mockCenter,
            theme: mockTheme,
            enableOptimizations: true,
          }),
        { initialProps: { config: mockConfig } }
      );

      // Change only fontSize (minor change)
      const minorChange = { ...mockConfig, fontSize: 18 };
      rerender({ config: minorChange });

      expect(RadialTextService.calculateTextLayout).toHaveBeenCalledWith(
        expect.objectContaining({ fontSize: 18 })
      );
    });
  });
});

describe('useSimpleRadialText', () => {
  it('should provide simplified interface', () => {
    const { result } = renderHook(() =>
      useSimpleRadialText('SIMPLE', { x: 100, y: 100 }, 80, 'frost_dark')
    );

    expect(result.current.characters).toHaveLength(2);
    expect(result.current.isReady).toBe(true);
    expect(result.current.validation.isValid).toBe(true);
  });

  it('should use default theme when not provided', () => {
    const { result } = renderHook(() =>
      useSimpleRadialText('TEST', { x: 0, y: 0 }, 50)
    );

    // Should not throw errors and should work with default theme
    expect(result.current.isReady).toBe(true);
  });
});

describe('useRadialTextPreset', () => {
  beforeEach(() => {
    const { RadialTextService } = require('../../services/radial/RadialTextService');
    RadialTextService.createPreset.mockClear();
  });

  it('should create hal-classic preset', () => {
    const { result } = renderHook(() =>
      useRadialTextPreset('hal-classic', { x: 200, y: 200 }, 'frost_light', 120)
    );

    const { RadialTextService } = require('../../services/radial/RadialTextService');
    expect(RadialTextService.createPreset).toHaveBeenCalledWith(
      'hal-classic',
      200,
      200,
      120,
      'frost_light'
    );

    expect(result.current.isReady).toBe(true);
  });

  it('should create status-ring preset', () => {
    const { result } = renderHook(() =>
      useRadialTextPreset('status-ring', { x: 150, y: 150 }, 'frost_dark', 100)
    );

    const { RadialTextService } = require('../../services/radial/RadialTextService');
    expect(RadialTextService.createPreset).toHaveBeenCalledWith(
      'status-ring',
      150,
      150,
      100,
      'frost_dark'
    );
  });

  it('should override text when customText provided', () => {
    const { RadialTextService } = require('../../services/radial/RadialTextService');

    // Mock createPreset to return config we can verify
    RadialTextService.createPreset.mockReturnValueOnce({
      ...DEFAULT_RADIAL_TEXT_CONFIG,
      theme: 'frost_light',
      text: 'ORIGINAL TEXT',
    });

    const { result } = renderHook(() =>
      useRadialTextPreset(
        'message-arc',
        { x: 0, y: 0 },
        'frost_light',
        80,
        'CUSTOM MESSAGE'
      )
    );

    // Should use custom text
    expect(result.current.resolvedConfig.text).toBe('CUSTOM MESSAGE');
  });

  it('should use default parameters', () => {
    const { result } = renderHook(() =>
      useRadialTextPreset('full-circle', { x: 100, y: 100 })
    );

    const { RadialTextService } = require('../../services/radial/RadialTextService');
    expect(RadialTextService.createPreset).toHaveBeenCalledWith(
      'full-circle',
      100,
      100,
      120, // default radius
      'frost_light' // default theme
    );
  });

  it('should enable caching and optimizations by default', () => {
    const { result } = renderHook(() =>
      useRadialTextPreset('hal-classic', { x: 0, y: 0 })
    );

    // Should return ready state (indicating optimizations are working)
    expect(result.current.isReady).toBe(true);
    expect(result.current.validation.isValid).toBe(true);
  });
});