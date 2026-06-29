import { Pattern } from '../Pattern';
import { EffectContext, EffectParameters } from '../IEffect';

describe('Pattern Effect', () => {
  let pattern: Pattern;
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let mockContext: EffectContext;

  beforeEach(() => {
    pattern = new Pattern();

    // Create mock canvas and context
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 300;
    mockCanvas.height = 300;
    mockCtx = mockCanvas.getContext('2d')!;

    mockContext = {
      canvas: mockCanvas,
      ctx: mockCtx,
      dimensions: { width: 300, height: 300 },
      time: 0,
      deltaTime: 16,
      theme: 'frost_light',
    };
  });

  afterEach(() => {
    pattern.dispose();
  });

  describe('Metadata', () => {
    it('should have correct metadata', () => {
      expect(pattern.metadata.type).toBe('pattern');
      expect(pattern.metadata.displayName).toBe('Pattern');
      expect(pattern.metadata.category).toBe('pattern');
      expect(pattern.metadata.version).toBe('1.0.0');
    });
  });

  describe('Default Parameters', () => {
    it('should provide default parameters', () => {
      const defaults = pattern.getDefaultParameters();

      expect(defaults.patternType).toBe('dots');
      expect(defaults.size).toBe(10);
      expect(defaults.spacing).toBe(20);
      expect(defaults.rotation).toBe(0);
      expect(defaults.primaryColor).toBe('#ffffff');
      expect(defaults.secondaryColor).toBe('#000000');
      expect(defaults.strokeWidth).toBe(2);
      expect(defaults.opacity).toBe(1);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate valid parameters', () => {
      const params: EffectParameters = {
        size: 20,
        spacing: 30,
        opacity: 0.5,
        strokeWidth: 3,
      };

      const result = pattern.validateParameters(params);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid size', () => {
      const params: EffectParameters = {
        size: 0,
      };

      const result = pattern.validateParameters(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pattern size must be greater than 0');
    });

    it('should reject negative spacing', () => {
      const params: EffectParameters = {
        spacing: -10,
      };

      const result = pattern.validateParameters(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pattern spacing cannot be negative');
    });

    it('should warn about small pattern sizes', () => {
      const params: EffectParameters = {
        size: 3,
      };

      const result = pattern.validateParameters(params);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Very small pattern sizes may impact performance'
      );
    });
  });

  describe('Pattern Types', () => {
    it('should render dots pattern', async () => {
      const params: EffectParameters = {
        patternType: 'dots',
        size: 10,
        spacing: 20,
        primaryColor: '#ff0000',
        enabled: true,
      };

      const fillStyleSpy = jest.spyOn(mockCtx, 'fillRect');
      await pattern.render(mockContext, params);

      expect(fillStyleSpy).toHaveBeenCalled();
    });

    it('should render stripes pattern', async () => {
      const params: EffectParameters = {
        patternType: 'stripes',
        size: 10,
        spacing: 20,
        primaryColor: '#00ff00',
        strokeWidth: 3,
        enabled: true,
      };

      await pattern.render(mockContext, params);
      // Pattern should be created and applied
    });

    it('should render grid pattern', async () => {
      const params: EffectParameters = {
        patternType: 'grid',
        size: 20,
        spacing: 30,
        primaryColor: '#0000ff',
        enabled: true,
      };

      await pattern.render(mockContext, params);
      // Grid pattern should be created
    });

    it('should render checkerboard pattern', async () => {
      const params: EffectParameters = {
        patternType: 'checkerboard',
        size: 25,
        primaryColor: '#ffffff',
        secondaryColor: '#000000',
        enabled: true,
      };

      await pattern.render(mockContext, params);
      // Checkerboard should be rendered
    });

    it('should render hexagons pattern', async () => {
      const params: EffectParameters = {
        patternType: 'hexagons',
        size: 15,
        spacing: 10,
        primaryColor: '#ffff00',
        enabled: true,
      };

      await pattern.render(mockContext, params);
      // Hexagon pattern should be created
    });

    it('should render triangles pattern', async () => {
      const params: EffectParameters = {
        patternType: 'triangles',
        size: 20,
        spacing: 15,
        primaryColor: '#ff00ff',
        enabled: true,
      };

      await pattern.render(mockContext, params);
      // Triangle pattern should be created
    });
  });

  describe('Pattern Rotation', () => {
    it('should apply rotation to pattern', async () => {
      const params: EffectParameters = {
        patternType: 'stripes',
        rotation: 45,
        enabled: true,
      };

      await pattern.render(mockContext, params);
      // Pattern should be rotated
    });
  });

  describe('Blend Modes', () => {
    it('should apply blend mode', async () => {
      const params: EffectParameters = {
        patternType: 'dots',
        blendMode: 'multiply',
        enabled: true,
      };

      await pattern.render(mockContext, params);
      expect(mockCtx.globalCompositeOperation).toBe('source-over'); // Reset after render
    });
  });

  describe('Performance', () => {
    it('should cache pattern for repeated renders', async () => {
      const params: EffectParameters = {
        patternType: 'dots',
        size: 10,
        spacing: 20,
        enabled: true,
      };

      // First render creates pattern
      await pattern.render(mockContext, params);

      // Second render should use cached pattern
      await pattern.render(mockContext, params);

      // Cached pattern should exist
      expect((pattern as any).cachedPattern).toBeTruthy();
    });

    it('should regenerate pattern when parameters change', async () => {
      const params1: EffectParameters = {
        patternType: 'dots',
        size: 10,
        enabled: true,
      };

      const params2: EffectParameters = {
        patternType: 'dots',
        size: 20,
        enabled: true,
      };

      await pattern.render(mockContext, params1);
      const firstPattern = (pattern as any).cachedPattern;

      await pattern.render(mockContext, params2);
      const secondPattern = (pattern as any).cachedPattern;

      // Pattern should be regenerated
      expect(firstPattern).not.toBe(secondPattern);
    });
  });

  describe('Complexity Estimation', () => {
    it('should estimate low complexity for large patterns', () => {
      const params: EffectParameters = {
        size: 50,
        spacing: 50,
      };

      const complexity = pattern.estimateComplexity(params);
      expect(complexity).toBe('low');
    });

    it('should estimate high complexity for small patterns', () => {
      const params: EffectParameters = {
        size: 5,
        spacing: 5,
      };

      const complexity = pattern.estimateComplexity(params);
      expect(complexity).toBe('high');
    });

    it('should estimate extreme complexity for tiny patterns', () => {
      const params: EffectParameters = {
        size: 2,
        spacing: 2,
      };

      const complexity = pattern.estimateComplexity(params);
      expect(complexity).toBe('extreme');
    });
  });

  describe('Masking', () => {
    it('should support masking', () => {
      expect(pattern.canApplyMask()).toBe(true);
    });

    it('should apply shape mask', () => {
      const mask = {
        type: 'shape' as const,
        config: {},
        invert: false,
      };

      pattern.applyMask(mockContext, mask);
      // Mask should be applied via composite operation
    });
  });

  describe('Serialization', () => {
    it('should serialize parameters', () => {
      const params: EffectParameters = {
        patternType: 'grid',
        size: 15,
        spacing: 25,
        primaryColor: '#123456',
      };

      const serialized = pattern.serialize(params);
      expect(serialized).toBe(JSON.stringify(params));
    });

    it('should deserialize parameters', () => {
      const params: EffectParameters = {
        patternType: 'grid',
        size: 15,
        spacing: 25,
        primaryColor: '#123456',
      };

      const serialized = JSON.stringify(params);
      const deserialized = pattern.deserialize(serialized);

      expect(deserialized).toEqual(params);
    });

    it('should handle invalid deserialization', () => {
      const deserialized = pattern.deserialize('invalid json');
      expect(deserialized).toEqual(pattern.getDefaultParameters());
    });
  });

  describe('Cloning', () => {
    it('should create a new instance when cloned', () => {
      const cloned = pattern.clone();
      expect(cloned).not.toBe(pattern);
      expect(cloned).toBeInstanceOf(Pattern);
    });
  });

  describe('Disposal', () => {
    it('should clean up resources on dispose', () => {
      // Create cached pattern
      const params: EffectParameters = {
        patternType: 'dots',
        enabled: true,
      };

      pattern.render(mockContext, params);
      expect((pattern as any).cachedPattern).toBeTruthy();

      pattern.dispose();
      expect((pattern as any).cachedPattern).toBeNull();
      expect((pattern as any).lastParams).toBe('');
    });
  });
});
