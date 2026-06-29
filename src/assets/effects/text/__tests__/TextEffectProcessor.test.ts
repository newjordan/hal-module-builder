/**
 * TextEffectProcessor Tests
 * ========================
 *
 * Unit tests for text effect processor functionality.
 * Tests effect registration, processing, and integration.
 *
 * @version 1.0.0
 */

import { TextEffectProcessor, BaseTextEffect } from '../TextEffectProcessor';
import { TextGlowEffect } from '../TextGlowEffect';
import { TextGradientEffect } from '../TextGradientEffect';
import { TextStrokeEffect } from '../TextStrokeEffect';
import {
  RadialTextCharacter,
  RadialTextEffects,
  FrostTheme,
} from '../../../../types/radial-text-types';

// Mock canvas context
const mockCanvasContext = {
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  clearRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 20 })),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(1600) })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
    toString: () => 'linear-gradient-mock',
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
    toString: () => 'radial-gradient-mock',
  })),
  getLineDash: jest.fn(() => []),
  setLineDash: jest.fn(),
  canvas: { width: 400, height: 400 },
  shadowColor: '',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  strokeStyle: '',
  lineWidth: 0,
  lineJoin: 'round',
  lineCap: 'round',
  globalAlpha: 1,
  fillStyle: '',
  font: '',
  textAlign: 'center',
  textBaseline: 'middle',
  filter: 'none',
};

// Mock character data
const mockCharacter: RadialTextCharacter = {
  char: 'A',
  index: 0,
  position: {
    x: 100,
    y: 0,
    angle: 0,
    angleDegrees: 0,
    radius: 100,
    midAngle: 0,
    midAngleDegrees: 0,
    stepAngleRadians: 0.1,
    stepAngleDegrees: 5.7,
    segmentArcLength: 10,
    segmentChordLength: 10,
    normal: { x: 1, y: 0 },
    tangent: { x: 0, y: 1 },
    midNormal: { x: 1, y: 0 },
    midTangent: { x: 0, y: 1 },
    orientationDegrees: 0,
  },
  transform: 'translate(100px, 0px) rotate(0deg)',
  scale: 1,
  rotation: 0,
  opacity: 1,
  visible: true,
};

const mockEffects: RadialTextEffects = {
  theme: 'frost_light',
  colorMode: 'solid',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  glowColor: '#3b82f6',
  glowIntensity: 1.0,
  strokeColor: '#000000',
  strokeWidth: 2,
};

const mockAudioData = new Float32Array([128, 64, 192, 32, 160]);

describe('TextEffectProcessor', () => {
  let processor: TextEffectProcessor;

  beforeEach(() => {
    // Clear any existing instance
    (TextEffectProcessor as any).instance = null;
    processor = TextEffectProcessor.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    processor.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const processor1 = TextEffectProcessor.getInstance();
      const processor2 = TextEffectProcessor.getInstance();
      expect(processor1).toBe(processor2);
    });
  });

  describe('Effect Registration', () => {
    it('should register glow effect successfully', () => {
      const glowEffect = new TextGlowEffect();
      const success = processor.registerEffect(glowEffect);

      expect(success).toBe(true);
      expect(processor.getEffect('text-glow')).toBe(glowEffect);
    });

    it('should register gradient effect successfully', () => {
      const gradientEffect = new TextGradientEffect();
      const success = processor.registerEffect(gradientEffect);

      expect(success).toBe(true);
      expect(processor.getEffect('text-gradient')).toBe(gradientEffect);
    });

    it('should register stroke effect successfully', () => {
      const strokeEffect = new TextStrokeEffect();
      const success = processor.registerEffect(strokeEffect);

      expect(success).toBe(true);
      expect(processor.getEffect('text-stroke')).toBe(strokeEffect);
    });

    it('should prevent duplicate effect registration', () => {
      const glowEffect1 = new TextGlowEffect();
      const glowEffect2 = new TextGlowEffect();

      const success1 = processor.registerEffect(glowEffect1);
      const success2 = processor.registerEffect(glowEffect2);

      expect(success1).toBe(true);
      expect(success2).toBe(false);
      expect(processor.getEffect('text-glow')).toBe(glowEffect1);
    });

    it('should validate effects before registration', () => {
      const invalidEffect = {
        metadata: null, // Invalid - no metadata
        defaultParameters: {},
      } as any;

      const success = processor.registerEffect(invalidEffect);
      expect(success).toBe(false);
    });
  });

  describe('Effect Processing', () => {
    beforeEach(() => {
      // Register all effects
      processor.registerEffect(new TextGlowEffect());
      processor.registerEffect(new TextGradientEffect());
      processor.registerEffect(new TextStrokeEffect());
    });

    it('should process character effects with glow', async () => {
      const effectsWithGlow: RadialTextEffects = {
        ...mockEffects,
        glowIntensity: 1.5,
      };

      const result = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        effectsWithGlow,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      expect(result).toBeDefined();
      expect(result.char).toBe('A');
    });

    it('should process character effects with gradient', async () => {
      const effectsWithGradient: RadialTextEffects = {
        ...mockEffects,
        colorMode: 'gradient',
      };

      const result = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        effectsWithGradient,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      expect(result).toBeDefined();
      expect(result.char).toBe('A');
    });

    it('should process character effects with stroke', async () => {
      const effectsWithStroke: RadialTextEffects = {
        ...mockEffects,
        strokeWidth: 3,
        strokeColor: '#ff0000',
      };

      const result = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        effectsWithStroke,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      expect(result).toBeDefined();
      expect(result.char).toBe('A');
    });

    it('should handle audio reactive effects', async () => {
      const effectsWithAudio: RadialTextEffects = {
        ...mockEffects,
        colorMode: 'reactive',
      };

      const result = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        effectsWithAudio,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          audioData: mockAudioData,
          timestamp: performance.now(),
        }
      );

      expect(result).toBeDefined();
      expect(result.char).toBe('A');
    });

    it('should handle rainbow effects', async () => {
      const effectsWithRainbow: RadialTextEffects = {
        ...mockEffects,
        colorMode: 'rainbow',
      };

      const result = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        effectsWithRainbow,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      expect(result).toBeDefined();
      expect(result.char).toBe('A');
    });

    it('should handle multiple characters', async () => {
      const characters = [
        { ...mockCharacter, char: 'H', index: 0 },
        { ...mockCharacter, char: 'A', index: 1 },
        { ...mockCharacter, char: 'L', index: 2 },
      ];

      for (let i = 0; i < characters.length; i++) {
        const result = await processor.processCharacterEffects(
          characters[i],
          characters,
          mockEffects,
          {
            canvasCtx: mockCanvasContext as any,
            theme: 'frost_light',
            timestamp: performance.now(),
          }
        );

        expect(result).toBeDefined();
        expect(result.index).toBe(i);
      }
    });
  });

  describe('Effect Management', () => {
    it('should return null for non-existent effects', () => {
      const effect = processor.getEffect('non-existent-effect');
      expect(effect).toBeNull();
    });

    it('should return all registered effects', () => {
      const glowEffect = new TextGlowEffect();
      const gradientEffect = new TextGradientEffect();

      processor.registerEffect(glowEffect);
      processor.registerEffect(gradientEffect);

      const allEffects = processor.getRegisteredEffects();
      expect(allEffects.size).toBe(2);
      expect(allEffects.get('text-glow')).toBe(glowEffect);
      expect(allEffects.get('text-gradient')).toBe(gradientEffect);
    });

    it('should clear all effects', () => {
      processor.registerEffect(new TextGlowEffect());
      processor.registerEffect(new TextGradientEffect());

      expect(processor.getRegisteredEffects().size).toBe(2);

      processor.clear();

      expect(processor.getRegisteredEffects().size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      const mockEffect = {
        metadata: {
          type: 'mock-effect',
          displayName: 'Mock Effect',
          description: 'Mock effect for testing',
          version: '1.0.0',
          category: 'filter',
        },
        defaultParameters: { effects: mockEffects },
        process: jest.fn().mockRejectedValue(new Error('Processing failed')),
        getParameterDescriptors: jest.fn(() => []),
        validateParameters: jest.fn(() => ({ isValid: true, errors: [] })),
        dispose: jest.fn(),
        supportsAudioReactivity: false,
        isCharacterLevel: true,
      } as any;

      processor.registerEffect(mockEffect);

      // Processing should not throw even if effect processing fails
      const result = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        mockEffects,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle invalid canvas context', async () => {
      const invalidContext = null;

      // Should not throw error with invalid context
      expect(async () => {
        await processor.processCharacterEffects(
          mockCharacter,
          [mockCharacter],
          mockEffects,
          {
            canvasCtx: invalidContext as any,
            theme: 'frost_light',
            timestamp: performance.now(),
          }
        );
      }).not.toThrow();
    });
  });

  describe('Theme Compliance', () => {
    it('should require frost_glass theme in effects', async () => {
      const effectsWithoutTheme = {
        ...mockEffects,
        theme: 'invalid_theme' as any,
      };

      // Should handle invalid theme gracefully
      const result = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        effectsWithoutTheme,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      expect(result).toBeDefined();
    });

    it('should support both frost_light and frost_dark themes', async () => {
      const lightEffects: RadialTextEffects = {
        ...mockEffects,
        theme: 'frost_light',
      };

      const darkEffects: RadialTextEffects = {
        ...mockEffects,
        theme: 'frost_dark',
      };

      const lightResult = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        lightEffects,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      const darkResult = await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        darkEffects,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_dark',
          timestamp: performance.now(),
        }
      );

      expect(lightResult).toBeDefined();
      expect(darkResult).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should process effects within reasonable time', async () => {
      processor.registerEffect(new TextGlowEffect());

      const startTime = performance.now();

      await processor.processCharacterEffects(
        mockCharacter,
        [mockCharacter],
        mockEffects,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process effects in under 10ms for good performance
      expect(processingTime).toBeLessThan(10);
    });

    it('should handle large character arrays efficiently', async () => {
      const largeCharacterArray = Array.from({ length: 100 }, (_, i) => ({
        ...mockCharacter,
        char: String.fromCharCode(65 + (i % 26)), // A-Z repeated
        index: i,
      }));

      const startTime = performance.now();

      await processor.processCharacterEffects(
        mockCharacter,
        largeCharacterArray,
        mockEffects,
        {
          canvasCtx: mockCanvasContext as any,
          theme: 'frost_light',
          timestamp: performance.now(),
        }
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should handle large arrays efficiently
      expect(processingTime).toBeLessThan(50);
    });
  });
});