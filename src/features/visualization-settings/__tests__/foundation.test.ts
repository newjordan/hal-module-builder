/**
 * Foundation tests - Automated verification of Phase 1
 * Tests types, defaults, schemas, and basic structure
 */
import {
  BAR_CONSTRAINTS,
  CIRCLE_CONSTRAINTS,
  clamp,
  COMMON_CONSTRAINTS,
  DEFAULT_BAR_SETTINGS,
  DEFAULT_CIRCLE_SETTINGS,
  DEFAULT_COMMON_SETTINGS,
  DEFAULT_DIAMOND_SETTINGS,
  DEFAULT_DOT_SETTINGS,
  DEFAULT_HEXAGON_SETTINGS,
  DEFAULT_TRIANGLE_SETTINGS,
  DIAMOND_CONSTRAINTS,
  DOT_CONSTRAINTS,
  getDefaultSettings,
  HEXAGON_CONSTRAINTS,
  TRIANGLE_CONSTRAINTS,
  validateSetting,
} from '../index';

describe('Visualization Settings - Foundation', () => {
  describe('Type Definitions', () => {
    it('should export all required types', () => {
      // This test verifies that imports work correctly
      expect(DEFAULT_COMMON_SETTINGS).toBeDefined();
      expect(DEFAULT_BAR_SETTINGS).toBeDefined();
      expect(DEFAULT_DOT_SETTINGS).toBeDefined();
      expect(DEFAULT_TRIANGLE_SETTINGS).toBeDefined();
      expect(DEFAULT_DIAMOND_SETTINGS).toBeDefined();
      expect(DEFAULT_HEXAGON_SETTINGS).toBeDefined();
      expect(DEFAULT_CIRCLE_SETTINGS).toBeDefined();
    });
  });

  describe('Default Settings', () => {
    it('should have valid common settings', () => {
      expect(DEFAULT_COMMON_SETTINGS.visualizationType).toBe('bar');
      expect(DEFAULT_COMMON_SETTINGS.blendMode).toBe('normal');
      expect(DEFAULT_COMMON_SETTINGS.opacity).toBe(1);
      expect(DEFAULT_COMMON_SETTINGS.symmetry).toBe('none');
      expect(DEFAULT_COMMON_SETTINGS.layout).toBe('radial');
    });

    it('should have valid bar settings', () => {
      expect(DEFAULT_BAR_SETTINGS.barCount).toBe(48);
      expect(DEFAULT_BAR_SETTINGS.barHeight).toBe(200);
      expect(DEFAULT_BAR_SETTINGS.barWidth).toBe(8);
      expect(DEFAULT_BAR_SETTINGS.barSpacing).toBe(2);
      expect(DEFAULT_BAR_SETTINGS.radialOrientation).toBe('follow-radius');
      expect(DEFAULT_BAR_SETTINGS.invert).toBe(false);
    });

    it('should have valid dot settings', () => {
      expect(DEFAULT_DOT_SETTINGS.dotCount).toBe(48);
      expect(DEFAULT_DOT_SETTINGS.dotSize).toBe(6);
      expect(DEFAULT_DOT_SETTINGS.dotSpacing).toBe(4);
    });

    it('should have valid triangle settings', () => {
      expect(DEFAULT_TRIANGLE_SETTINGS.triangleCount).toBe(48);
      expect(DEFAULT_TRIANGLE_SETTINGS.triangleSize).toBe(10);
      expect(DEFAULT_TRIANGLE_SETTINGS.triangleOrientation).toBe('up');
    });

    it('should have valid diamond settings', () => {
      expect(DEFAULT_DIAMOND_SETTINGS.diamondCount).toBe(48);
      expect(DEFAULT_DIAMOND_SETTINGS.diamondSize).toBe(8);
    });

    it('should have valid hexagon settings', () => {
      expect(DEFAULT_HEXAGON_SETTINGS.hexagonCount).toBe(48);
      expect(DEFAULT_HEXAGON_SETTINGS.hexSize).toBe(8);
    });

    it('should have valid circle settings', () => {
      expect(DEFAULT_CIRCLE_SETTINGS.circleCount).toBe(48);
      expect(DEFAULT_CIRCLE_SETTINGS.circleRadius).toBe(6);
    });

    it('should get correct defaults by type', () => {
      expect(getDefaultSettings('bar')).toEqual(DEFAULT_BAR_SETTINGS);
      expect(getDefaultSettings('dot')).toEqual(DEFAULT_DOT_SETTINGS);
      expect(getDefaultSettings('triangle')).toEqual(DEFAULT_TRIANGLE_SETTINGS);
      expect(getDefaultSettings('diamond')).toEqual(DEFAULT_DIAMOND_SETTINGS);
      expect(getDefaultSettings('hexagon')).toEqual(DEFAULT_HEXAGON_SETTINGS);
      expect(getDefaultSettings('circle')).toEqual(DEFAULT_CIRCLE_SETTINGS);
    });

    it('should fallback to bar settings for unknown type', () => {
      expect(getDefaultSettings('unknown')).toEqual(DEFAULT_BAR_SETTINGS);
    });
  });

  describe('Validation Schema', () => {
    it('should have valid common constraints', () => {
      expect(COMMON_CONSTRAINTS.opacity).toEqual({
        min: 0,
        max: 1,
        step: 0.01,
      });
      expect(COMMON_CONSTRAINTS.positionX).toEqual({
        min: 0,
        max: 100,
        step: 1,
      });
      expect(COMMON_CONSTRAINTS.rotation).toEqual({
        min: 0,
        max: 360,
        step: 1,
      });
    });

    it('should have valid bar constraints', () => {
      expect(BAR_CONSTRAINTS.barCount).toEqual({ min: 2, max: 128, step: 1 });
      expect(BAR_CONSTRAINTS.barHeight).toEqual({
        min: 10,
        max: 500,
        step: 10,
      });
      expect(BAR_CONSTRAINTS.barWidth).toEqual({ min: 1, max: 50, step: 1 });
    });

    it('should have valid dot constraints', () => {
      expect(DOT_CONSTRAINTS.dotCount).toEqual({ min: 2, max: 128, step: 1 });
      expect(DOT_CONSTRAINTS.dotSize).toEqual({ min: 1, max: 30, step: 1 });
    });

    it('should have valid triangle constraints', () => {
      expect(TRIANGLE_CONSTRAINTS.triangleCount).toEqual({
        min: 2,
        max: 128,
        step: 1,
      });
      expect(TRIANGLE_CONSTRAINTS.triangleSize).toEqual({
        min: 2,
        max: 40,
        step: 1,
      });
    });

    it('should have valid diamond constraints', () => {
      expect(DIAMOND_CONSTRAINTS.diamondCount).toEqual({
        min: 2,
        max: 128,
        step: 1,
      });
      expect(DIAMOND_CONSTRAINTS.diamondSize).toEqual({
        min: 2,
        max: 40,
        step: 1,
      });
    });

    it('should have valid hexagon constraints', () => {
      expect(HEXAGON_CONSTRAINTS.hexagonCount).toEqual({
        min: 2,
        max: 128,
        step: 1,
      });
      expect(HEXAGON_CONSTRAINTS.hexSize).toEqual({ min: 2, max: 40, step: 1 });
    });

    it('should have valid circle constraints', () => {
      expect(CIRCLE_CONSTRAINTS.circleCount).toEqual({
        min: 2,
        max: 128,
        step: 1,
      });
      expect(CIRCLE_CONSTRAINTS.circleRadius).toEqual({
        min: 1,
        max: 30,
        step: 1,
      });
    });
  });

  describe('Validation Functions', () => {
    describe('clamp', () => {
      it('should clamp values within range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
      });

      it('should handle edge cases', () => {
        expect(clamp(0, 0, 10)).toBe(0);
        expect(clamp(10, 0, 10)).toBe(10);
      });
    });

    describe('validateSetting', () => {
      it('should validate and clamp values', () => {
        const constraint = { min: 0, max: 100, step: 10 };
        expect(validateSetting(50, constraint)).toBe(50);
        expect(validateSetting(-10, constraint)).toBe(0);
        expect(validateSetting(110, constraint)).toBe(100);
      });

      it('should round to nearest step', () => {
        const constraint = { min: 0, max: 100, step: 10 };
        expect(validateSetting(45, constraint)).toBe(50);
        expect(validateSetting(44, constraint)).toBe(40);
        expect(validateSetting(55, constraint)).toBe(60);
      });

      it('should handle decimal steps', () => {
        const constraint = { min: 0, max: 1, step: 0.1 };
        expect(validateSetting(0.45, constraint)).toBeCloseTo(0.5, 1);
        expect(validateSetting(0.44, constraint)).toBeCloseTo(0.4, 1);
      });
    });
  });

  describe('Settings Structure', () => {
    it('should have all required common properties', () => {
      const settings = DEFAULT_BAR_SETTINGS;

      // Type
      expect(settings.visualizationType).toBeDefined();

      // Appearance
      expect(settings.blendMode).toBeDefined();
      expect(settings.opacity).toBeDefined();

      // Color
      expect(settings.colorMode).toBeDefined();
      expect(settings.primaryColor).toBeDefined();

      // Symmetry
      expect(settings.symmetry).toBeDefined();

      // Position
      expect(settings.positionX).toBeDefined();
      expect(settings.positionY).toBeDefined();
      expect(settings.rotation).toBeDefined();
      expect(settings.innerRadius).toBeDefined();
      expect(settings.showRadialPath).toBeDefined();
      expect(settings.enablePartialArc).toBeDefined();

      // Audio Integration
      expect(settings.responseSpeed).toBeDefined();
      expect(settings.pulseMode).toBeDefined();

      // Layout
      expect(settings.layout).toBeDefined();
    });

    it('should have bar-specific properties', () => {
      const settings = DEFAULT_BAR_SETTINGS;
      expect(settings.barCount).toBeDefined();
      expect(settings.barHeight).toBeDefined();
      expect(settings.barWidth).toBeDefined();
      expect(settings.barSpacing).toBeDefined();
      expect(settings.radialOrientation).toBeDefined();
      expect(settings.invert).toBeDefined();
    });
  });

  describe('Default Values Within Constraints', () => {
    it('should have bar defaults within constraints', () => {
      expect(DEFAULT_BAR_SETTINGS.barCount).toBeGreaterThanOrEqual(
        BAR_CONSTRAINTS.barCount.min
      );
      expect(DEFAULT_BAR_SETTINGS.barCount).toBeLessThanOrEqual(
        BAR_CONSTRAINTS.barCount.max
      );
      expect(DEFAULT_BAR_SETTINGS.barWidth).toBeGreaterThanOrEqual(
        BAR_CONSTRAINTS.barWidth.min
      );
      expect(DEFAULT_BAR_SETTINGS.barWidth).toBeLessThanOrEqual(
        BAR_CONSTRAINTS.barWidth.max
      );
    });

    it('should have common defaults within constraints', () => {
      expect(DEFAULT_COMMON_SETTINGS.opacity).toBeGreaterThanOrEqual(
        COMMON_CONSTRAINTS.opacity.min
      );
      expect(DEFAULT_COMMON_SETTINGS.opacity).toBeLessThanOrEqual(
        COMMON_CONSTRAINTS.opacity.max
      );
      expect(DEFAULT_COMMON_SETTINGS.positionX).toBeGreaterThanOrEqual(
        COMMON_CONSTRAINTS.positionX.min
      );
      expect(DEFAULT_COMMON_SETTINGS.positionX).toBeLessThanOrEqual(
        COMMON_CONSTRAINTS.positionX.max
      );
    });
  });
});
