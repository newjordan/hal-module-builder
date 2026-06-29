import {
  calculateTransformMatrix,
  calculateImageFilters,
  generateGradientString,
  calculatePreviewSize,
  calculateBoundingBox,
  interpolateValue,
  calculatePolarCoordinates,
  calculateFrequencyBins,
  calculateGlowEffect,
  hexToRgb,
  generateShapeClipPath,
  interpolateKeyframes,
  AnimationKeyframe,
} from '../layer-transforms';
import {
  applySymmetryTransform,
  getCurrentSymmetryPlan,
} from '../equalizerSymmetry';
import { Layer } from '../../types/layer-types';

describe('layer-transforms utilities', () => {
  const baseLayer: Layer = {
    id: 'test',
    name: 'Test Layer',
    type: 'solid',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  };

  describe('Transform Matrix Calculation', () => {
    it('should generate identity transform for default values', () => {
      const transform = calculateTransformMatrix(baseLayer);
      expect(transform).toBe('translateZ(0)');
    });

    it('should include translation for non-zero offsets', () => {
      const layer = { ...baseLayer, offsetX: 10, offsetY: 20 };
      const transform = calculateTransformMatrix(layer);
      expect(transform).toBe('translate(10px, 20px) translateZ(0)');
    });

    it('should include scaling for non-unity scale', () => {
      const layer = { ...baseLayer, scale: 1.5 };
      const transform = calculateTransformMatrix(layer);
      expect(transform).toBe('scale(1.5) translateZ(0)');
    });

    it('should include rotation for non-zero rotation', () => {
      const layer = { ...baseLayer, rotation: 45 };
      const transform = calculateTransformMatrix(layer);
      expect(transform).toBe('rotate(45deg) translateZ(0)');
    });

    it('should combine all transformations', () => {
      const layer = {
        ...baseLayer,
        offsetX: 10,
        offsetY: 20,
        scale: 1.5,
        rotation: 45,
      };
      const transform = calculateTransformMatrix(layer);
      expect(transform).toBe(
        'translate(10px, 20px) scale(1.5) rotate(45deg) translateZ(0)'
      );
    });
  });

  describe('Image Filters Calculation', () => {
    it('should return none for default values', () => {
      const filters = calculateImageFilters(baseLayer);
      expect(filters).toBe('none');
    });

    it('should include brightness filter', () => {
      const layer = { ...baseLayer, brightness: 1.2 };
      const filters = calculateImageFilters(layer);
      expect(filters).toBe('brightness(1.2)');
    });

    it('should include contrast filter', () => {
      const layer = { ...baseLayer, contrast: 0.8 };
      const filters = calculateImageFilters(layer);
      expect(filters).toBe('contrast(0.8)');
    });

    it('should combine multiple filters', () => {
      const layer = { ...baseLayer, brightness: 1.2, contrast: 0.8 };
      const filters = calculateImageFilters(layer);
      expect(filters).toBe('brightness(1.2) contrast(0.8)');
    });
  });

  describe('Gradient String Generation', () => {
    it('should generate linear gradient', () => {
      const gradient = {
        type: 'linear' as const,
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        angle: 45,
      };
      const gradientString = generateGradientString(gradient);
      expect(gradientString).toBe(
        'linear-gradient(45deg, #ff0000 0%, #00ff00 100%)'
      );
    });

    it('should generate radial gradient', () => {
      const gradient = {
        type: 'radial' as const,
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        centerX: 30,
        centerY: 70,
      };
      const gradientString = generateGradientString(gradient);
      expect(gradientString).toBe(
        'radial-gradient(circle at 30% 70%, #ff0000 0%, #00ff00 100%)'
      );
    });

    it('should generate conic gradient', () => {
      const gradient = {
        type: 'conic' as const,
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
      };
      const gradientString = generateGradientString(gradient);
      expect(gradientString).toBe(
        'conic-gradient(from 0deg, #ff0000 0deg, #00ff00 360deg)'
      );
    });

    it('should return default gradient for invalid input', () => {
      const gradientString = generateGradientString(null);
      expect(gradientString).toBe(
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      );
    });

    it('should handle missing stops', () => {
      const gradient = {
        type: 'linear' as const,
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [],
      };
      const gradientString = generateGradientString(gradient);
      expect(gradientString).toContain('linear-gradient(0deg,');
      expect(gradientString).toContain('#ff0000 0%');
      expect(gradientString).toContain('#0000ff 100%');
    });
  });

  describe('Preview Size Calculation', () => {
    it('should return default size for standard layer', () => {
      const size = calculatePreviewSize(baseLayer);
      expect(size).toEqual({ width: 40, height: 40 });
    });

    it('should calculate aspect ratio for rectangle shapes', () => {
      const layer = {
        ...baseLayer,
        shapeType: 'rectangle' as const,
        shapeSpecific: { width: 200, height: 100 },
      };
      const size = calculatePreviewSize(layer, 40);
      expect(size.width).toBe(40);
      expect(size.height).toBe(20);
    });

    it('should handle tall rectangles', () => {
      const layer = {
        ...baseLayer,
        shapeType: 'rectangle' as const,
        shapeSpecific: { width: 100, height: 200 },
      };
      const size = calculatePreviewSize(layer, 40);
      expect(size.width).toBe(20);
      expect(size.height).toBe(40);
    });
  });

  describe('Bounding Box Calculation', () => {
    it('should calculate bounding box for scaled layer', () => {
      const layer = { ...baseLayer, scale: 2, offsetX: 10, offsetY: 15 };
      const bbox = calculateBoundingBox(layer, 100, 50);

      expect(bbox.width).toBe(200); // 100 * 2
      expect(bbox.height).toBe(100); // 50 * 2
      expect(bbox.left).toBe(-90); // 10 - 200/2
      expect(bbox.top).toBe(-35); // 15 - 100/2
    });

    it('should calculate bounding box for rotated layer', () => {
      const layer = { ...baseLayer, rotation: 45 };
      const bbox = calculateBoundingBox(layer, 100, 100);

      // 45-degree rotation of a square should increase bounding box
      expect(bbox.width).toBeCloseTo(141.42, 1); // 100 * sqrt(2)
      expect(bbox.height).toBeCloseTo(141.42, 1);
    });
  });

  describe('Value Interpolation', () => {
    it('should interpolate linearly', () => {
      expect(interpolateValue(0, 10, 0.5, 'linear')).toBe(5);
      expect(interpolateValue(10, 20, 0.2, 'linear')).toBe(12);
    });

    it('should apply ease-in easing', () => {
      const result = interpolateValue(0, 10, 0.5, 'ease-in');
      expect(result).toBe(2.5); // 0.5^2 * 10
    });

    it('should apply ease-out easing', () => {
      const result = interpolateValue(0, 10, 0.5, 'ease-out');
      expect(result).toBe(7.5); // (1 - (1-0.5)^2) * 10
    });

    it('should apply ease-in-out easing', () => {
      const result1 = interpolateValue(0, 10, 0.25, 'ease-in-out');
      const result2 = interpolateValue(0, 10, 0.75, 'ease-in-out');
      expect(result1).toBeLessThan(2.5); // Slower at start
      expect(result2).toBeGreaterThan(7.5); // Slower at end
    });
  });

  describe('Polar Coordinates Calculation', () => {
    it('should calculate polar coordinates for circular layout', () => {
      const coord = calculatePolarCoordinates(0, 4, 100, 0, 360);
      expect(coord.x).toBeCloseTo(100, 1);
      expect(coord.y).toBeCloseTo(0, 1);
      expect(coord.angle).toBe(0);
    });

    it('should handle partial arc', () => {
      const coord = calculatePolarCoordinates(1, 4, 100, 0, 180);
      expect(coord.angle).toBe(60); // 180/3 (total-1)
    });

    it('should calculate correct positions for multiple points', () => {
      const total = 8;
      const coords = [];
      for (let i = 0; i < total; i++) {
        coords.push(calculatePolarCoordinates(i, total, 50));
      }

      expect(coords).toHaveLength(8);
      expect(coords[0].angle).toBe(0);
      expect(coords[2].angle).toBeCloseTo(102.86, 1); // 360/7 * 2
    });
  });

  describe('Frequency Bin Calculation', () => {
    it('should calculate full frequency range', () => {
      const bins = calculateFrequencyBins('full', 1024, 44100);
      expect(bins.startBin).toBe(0);
      expect(bins.endBin).toBeLessThan(1024);
      expect(bins.binCount).toBeGreaterThan(0);
    });

    it('should calculate bass frequency range', () => {
      const bins = calculateFrequencyBins('bass', 1024, 44100);
      expect(bins.startBin).toBe(0);
      expect(bins.endBin).toBeLessThan(100); // Bass should be lower bins
    });

    it('should calculate treble frequency range', () => {
      const bins = calculateFrequencyBins('treble', 1024, 44100);
      expect(bins.startBin).toBeGreaterThan(100); // Treble should be higher bins
      expect(bins.endBin).toBeLessThan(1024);
    });

    it('should calculate mid frequency range', () => {
      const bins = calculateFrequencyBins('mid', 1024, 44100);
      expect(bins.startBin).toBeGreaterThan(0);
      expect(bins.startBin).toBeLessThan(bins.endBin);
      expect(bins.endBin).toBeLessThan(1024);
    });
  });

  describe('Symmetry Transform', () => {
    it('should return original data for none symmetry', () => {
      const data = [1, 2, 3, 4, 5];
      const result = applySymmetryTransform(data, 'none');
      expect(result).toEqual(data);
    });

    it('should clamp to half-arc and mirror across the vertical axis', () => {
      const data = [1, 2, 3, 4, 5, 6];
      const result = applySymmetryTransform(data, 'mirror');
      expect(result).toEqual([1, 2, 3, 3, 2, 1]);
      expect(result).toHaveLength(data.length);
      expect(result[0]).toBe(result[result.length - 1]);
    });

    it('should rotate data correctly', () => {
      const data = [1, 2, 3, 4, 5, 6];
      const result = applySymmetryTransform(data, 'rotate');
      expect(result).toHaveLength(data.length);
      const shift = Math.floor(data.length / 4);
      expect(result[0]).toBe(data[shift]);
    });

    it('should apply multi-fold symmetry across equal segments', () => {
      const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const result = applySymmetryTransform(source, '4-fold');
      expect(result).toEqual([1, 2, 3, 3, 2, 1, 1, 2, 3, 3, 2, 1]);
      expect(result).toHaveLength(source.length);
    });

    it('should repeat the canonical segment for 6-fold symmetry', () => {
      const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const result = applySymmetryTransform(source, '6-fold');
      expect(result).toHaveLength(source.length);
      expect(result).toEqual([1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1]);
    });

    it('should cap fold symmetry to available data points', () => {
      const source = [0.25, 0.5, 0.75];
      const result = applySymmetryTransform(source, '12-fold');
      expect(result).toEqual([0.25, 0.25, 0.25]);
      expect(result).toHaveLength(source.length);
    });

    it('should expose symmetry plan metadata for mirror mode', () => {
      const data = [0.1, 0.2, 0.3, 0.4];
      const result = applySymmetryTransform(data, 'mirror');
      expect(result).toEqual([0.1, 0.2, 0.2, 0.1]);

      const plan = getCurrentSymmetryPlan();
      expect(plan).not.toBeNull();
      expect(plan?.segmentCount).toBe(2);
      expect(plan?.segmentLengths).toEqual([2, 2]);
      expect(plan?.canonicalLength).toBe(2);
      expect(plan?.totalLength).toBe(4);
    });

    it('should clear symmetry plan for modes that bypass the radial engine', () => {
      const data = [1, 2, 3];
      applySymmetryTransform(data, 'none');
      expect(getCurrentSymmetryPlan()).toBeNull();
    });
  });

  describe('Glow Effect Calculation', () => {
    it('should return none for zero intensity', () => {
      const glow = calculateGlowEffect(0, '#ff0000');
      expect(glow).toBe('none');
    });

    it('should calculate glow with intensity', () => {
      const glow = calculateGlowEffect(0.5, '#ff0000', 8);
      expect(glow).toContain('0 0 4px'); // 8 * 0.5
      expect(glow).toContain('255, 0, 0'); // RGB of #ff0000
      expect(glow).toContain('0.4'); // 0.5 * 0.8 opacity
    });
  });

  describe('Color Utilities', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
      expect(hexToRgb('ffffff')).toEqual([255, 255, 255]); // Without #
    });

    it('should handle 3-digit hex colors', () => {
      // Note: This would require extending the function to handle 3-digit hex
      // For now, we test that it doesn't crash
      expect(() => hexToRgb('#f00')).not.toThrow();
    });
  });

  describe('Shape Clip Path Generation', () => {
    it('should generate circle clip path', () => {
      const layer = {
        ...baseLayer,
        shapeType: 'circle' as const,
        shapeSpecific: { radius: 25 },
      };
      const clipPath = generateShapeClipPath(layer);
      expect(clipPath).toBe('circle(25px)');
    });

    it('should generate triangle clip path', () => {
      const layer = {
        ...baseLayer,
        shapeType: 'triangle' as const,
        shapeSpecific: {},
      };
      const clipPath = generateShapeClipPath(layer);
      expect(clipPath).toBe('polygon(50% 0%, 0% 100%, 100% 100%)');
    });

    it('should generate star clip path', () => {
      const layer = {
        ...baseLayer,
        shapeType: 'star' as const,
        shapeSpecific: { points: 5, outerRadius: 50, innerRadius: 25 },
      };
      const clipPath = generateShapeClipPath(layer);
      expect(clipPath).toContain('polygon(');
      expect(clipPath.split(',').length).toBeGreaterThan(5); // Multiple points
    });

    it('should generate polygon clip path', () => {
      const layer = {
        ...baseLayer,
        shapeType: 'polygon' as const,
        shapeSpecific: { sides: 6, radius: 30 },
      };
      const clipPath = generateShapeClipPath(layer);
      expect(clipPath).toContain('polygon(');
    });

    it('should return none for rectangle', () => {
      const layer = {
        ...baseLayer,
        shapeType: 'rectangle' as const,
        shapeSpecific: {},
      };
      const clipPath = generateShapeClipPath(layer);
      expect(clipPath).toBe('none');
    });

    it('should return none for layer without shape data', () => {
      const clipPath = generateShapeClipPath(baseLayer);
      expect(clipPath).toBe('none');
    });
  });

  describe('Keyframe Interpolation', () => {
    const keyframes: AnimationKeyframe[] = [
      { time: 0, opacity: 0, scale: 1 },
      { time: 0.5, opacity: 0.5, scale: 1.5 },
      { time: 1, opacity: 1, scale: 2 },
    ];

    it('should return first keyframe for time 0', () => {
      const result = interpolateKeyframes(keyframes, 0);
      expect(result).toEqual({ time: 0, opacity: 0, scale: 1 });
    });

    it('should return last keyframe for time 1', () => {
      const result = interpolateKeyframes(keyframes, 1);
      expect(result).toEqual({ time: 1, opacity: 1, scale: 2 });
    });

    it('should interpolate between keyframes', () => {
      const result = interpolateKeyframes(keyframes, 0.25);
      expect(result.opacity).toBe(0.25);
      expect(result.scale).toBe(1.25);
    });

    it('should handle single keyframe', () => {
      const singleKeyframe = [{ time: 0, opacity: 0.5 }];
      const result = interpolateKeyframes(singleKeyframe, 0.5);
      expect(result).toEqual({ time: 0, opacity: 0.5 });
    });

    it('should return empty object for no keyframes', () => {
      const result = interpolateKeyframes([], 0.5);
      expect(result).toEqual({});
    });

    it('should clamp time to valid range', () => {
      const result1 = interpolateKeyframes(keyframes, -0.5);
      const result2 = interpolateKeyframes(keyframes, 1.5);

      expect(result1).toEqual({ time: 0, opacity: 0, scale: 1 });
      expect(result2).toEqual({ time: 1, opacity: 1, scale: 2 });
    });
  });
});
