import { renderHook } from '@testing-library/react';
import { useGradientCore } from '../useGradientCore';
import {
  GradientData,
  GradientType,
} from '../../../utils/gradient/gradientTypes';

describe('useGradientCore', () => {
  let gradientCore: ReturnType<typeof useGradientCore>;
  let testGradient: GradientData;

  beforeEach(() => {
    const { result } = renderHook(() => useGradientCore());
    gradientCore = result.current;

    testGradient = {
      type: 'linear',
      colors: ['#ff0000', '#00ff00'],
      stops: [0, 1],
      angle: 45,
      centerX: 50,
      centerY: 50,
    };
  });

  describe('addColor', () => {
    it('should add color to end with even distribution for 2-color gradient', () => {
      const result = gradientCore.addColor(testGradient, '#0000ff');

      expect(result.colors).toEqual(['#ff0000', '#00ff00', '#0000ff']);
      expect(result.stops).toEqual([0, 0.5, 1]);
    });

    it('should add color to end with even distribution for 3-color gradient', () => {
      const threeColorGradient = {
        ...testGradient,
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [0, 0.5, 1],
      };

      const result = gradientCore.addColor(threeColorGradient, '#ffff00');

      expect(result.colors).toEqual([
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#ffff00',
      ]);
      expect(result.stops).toEqual([0, 1 / 3, 2 / 3, 1]);
    });

    it('should add color at beginning when position is 0', () => {
      const result = gradientCore.addColor(testGradient, '#0000ff', 0);

      expect(result.colors).toEqual(['#0000ff', '#ff0000', '#00ff00']);
      expect(result.stops).toEqual([0, 0, 1]);
    });

    it('should add color at middle position with interpolated stop', () => {
      const result = gradientCore.addColor(testGradient, '#0000ff', 1);

      expect(result.colors).toEqual(['#ff0000', '#0000ff', '#00ff00']);
      expect(result.stops).toEqual([0, 0.5, 1]);
    });

    it('should add color at end when position equals colors length', () => {
      const result = gradientCore.addColor(testGradient, '#0000ff', 2);

      expect(result.colors).toEqual(['#ff0000', '#00ff00', '#0000ff']);
      expect(result.stops).toEqual([0, 0.5, 1]);
    });

    it('should handle single color gradient', () => {
      const singleColorGradient = {
        ...testGradient,
        colors: ['#ff0000'],
        stops: [0],
      };

      const result = gradientCore.addColor(singleColorGradient, '#00ff00');

      expect(result.colors).toEqual(['#ff0000', '#00ff00']);
      expect(result.stops).toEqual([0, 1]);
    });

    it('should handle empty gradient', () => {
      const emptyGradient = {
        ...testGradient,
        colors: [],
        stops: [],
      };

      const result = gradientCore.addColor(emptyGradient, '#ff0000');

      expect(result.colors).toEqual(['#ff0000']);
      expect(result.stops).toEqual([1]);
    });

    it('should not mutate original gradient', () => {
      const originalColors = [...testGradient.colors];
      const originalStops = [...testGradient.stops];

      gradientCore.addColor(testGradient, '#0000ff');

      expect(testGradient.colors).toEqual(originalColors);
      expect(testGradient.stops).toEqual(originalStops);
    });
  });

  describe('removeColor', () => {
    let threeColorGradient: GradientData;

    beforeEach(() => {
      threeColorGradient = {
        ...testGradient,
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [0, 0.5, 1],
      };
    });

    it('should remove color at specified index', () => {
      const result = gradientCore.removeColor(threeColorGradient, 1);

      expect(result.colors).toEqual(['#ff0000', '#0000ff']);
      expect(result.stops).toEqual([0, 1]);
    });

    it('should remove first color', () => {
      const result = gradientCore.removeColor(threeColorGradient, 0);

      expect(result.colors).toEqual(['#00ff00', '#0000ff']);
      expect(result.stops).toEqual([0.5, 1]);
    });

    it('should remove last color', () => {
      const result = gradientCore.removeColor(threeColorGradient, 2);

      expect(result.colors).toEqual(['#ff0000', '#00ff00']);
      expect(result.stops).toEqual([0, 0.5]);
    });

    it('should throw error when trying to remove from 2-color gradient', () => {
      expect(() => gradientCore.removeColor(testGradient, 0)).toThrow(
        'Gradient must have at least 2 colors'
      );
    });

    it('should throw error for invalid index', () => {
      expect(() => gradientCore.removeColor(threeColorGradient, -1)).toThrow(
        'Invalid color index: -1'
      );

      expect(() => gradientCore.removeColor(threeColorGradient, 3)).toThrow(
        'Invalid color index: 3'
      );
    });

    it('should not mutate original gradient', () => {
      const originalColors = [...threeColorGradient.colors];
      const originalStops = [...threeColorGradient.stops];

      gradientCore.removeColor(threeColorGradient, 1);

      expect(threeColorGradient.colors).toEqual(originalColors);
      expect(threeColorGradient.stops).toEqual(originalStops);
    });
  });

  describe('updateColor', () => {
    it('should update color at specified index', () => {
      const result = gradientCore.updateColor(testGradient, 1, '#0000ff');

      expect(result.colors).toEqual(['#ff0000', '#0000ff']);
      expect(result.stops).toEqual([0, 1]); // stops unchanged
    });

    it('should update first color', () => {
      const result = gradientCore.updateColor(testGradient, 0, '#0000ff');

      expect(result.colors).toEqual(['#0000ff', '#00ff00']);
    });

    it('should throw error for invalid index', () => {
      expect(() =>
        gradientCore.updateColor(testGradient, -1, '#0000ff')
      ).toThrow('Invalid color index: -1');

      expect(() =>
        gradientCore.updateColor(testGradient, 2, '#0000ff')
      ).toThrow('Invalid color index: 2');
    });

    it('should not mutate original gradient', () => {
      const originalColors = [...testGradient.colors];

      gradientCore.updateColor(testGradient, 1, '#0000ff');

      expect(testGradient.colors).toEqual(originalColors);
    });
  });

  describe('updateStop', () => {
    it('should update stop at specified index', () => {
      const result = gradientCore.updateStop(testGradient, 1, 0.7);

      expect(result.stops).toEqual([0, 0.7]);
      expect(result.colors).toEqual(testGradient.colors); // colors unchanged
    });

    it('should clamp stop values to 0-1 range', () => {
      const result1 = gradientCore.updateStop(testGradient, 1, 1.5);
      expect(result1.stops[1]).toBe(1);

      const result2 = gradientCore.updateStop(testGradient, 0, -0.5);
      expect(result2.stops[0]).toBe(0);
    });

    it('should throw error for invalid index', () => {
      expect(() => gradientCore.updateStop(testGradient, -1, 0.5)).toThrow(
        'Invalid stop index: -1'
      );

      expect(() => gradientCore.updateStop(testGradient, 2, 0.5)).toThrow(
        'Invalid stop index: 2'
      );
    });

    it('should not mutate original gradient', () => {
      const originalStops = [...testGradient.stops];

      gradientCore.updateStop(testGradient, 1, 0.7);

      expect(testGradient.stops).toEqual(originalStops);
    });
  });

  describe('updateType', () => {
    it('should update gradient type', () => {
      const result = gradientCore.updateType(testGradient, 'radial');

      expect(result.type).toBe('radial');
      expect(result.colors).toEqual(testGradient.colors);
      expect(result.stops).toEqual(testGradient.stops);
    });

    it('should not mutate original gradient', () => {
      const originalType = testGradient.type;

      gradientCore.updateType(testGradient, 'radial');

      expect(testGradient.type).toBe(originalType);
    });
  });

  describe('updateAngle', () => {
    it('should update gradient angle', () => {
      const result = gradientCore.updateAngle(testGradient, 90);

      expect(result.angle).toBe(90);
    });

    it('should normalize angle to 0-360 range', () => {
      const result1 = gradientCore.updateAngle(testGradient, 450);
      expect(result1.angle).toBe(90);

      const result2 = gradientCore.updateAngle(testGradient, -45);
      expect(result2.angle).toBe(315);
    });

    it('should not mutate original gradient', () => {
      const originalAngle = testGradient.angle;

      gradientCore.updateAngle(testGradient, 90);

      expect(testGradient.angle).toBe(originalAngle);
    });
  });

  describe('updateCenter', () => {
    it('should update gradient center position', () => {
      const result = gradientCore.updateCenter(testGradient, 25, 75);

      expect(result.centerX).toBe(25);
      expect(result.centerY).toBe(75);
    });

    it('should clamp center values to 0-100 range', () => {
      const result1 = gradientCore.updateCenter(testGradient, 150, -25);
      expect(result1.centerX).toBe(100);
      expect(result1.centerY).toBe(0);
    });

    it('should not mutate original gradient', () => {
      const originalCenterX = testGradient.centerX;
      const originalCenterY = testGradient.centerY;

      gradientCore.updateCenter(testGradient, 25, 75);

      expect(testGradient.centerX).toBe(originalCenterX);
      expect(testGradient.centerY).toBe(originalCenterY);
    });
  });

  describe('integration', () => {
    it('should chain operations correctly', () => {
      let result = gradientCore.addColor(testGradient, '#0000ff');
      result = gradientCore.updateColor(result, 2, '#ffff00');
      result = gradientCore.updateAngle(result, 90);

      expect(result.colors).toEqual(['#ff0000', '#00ff00', '#ffff00']);
      expect(result.stops).toEqual([0, 0.5, 1]);
      expect(result.angle).toBe(90);
    });
  });
});
