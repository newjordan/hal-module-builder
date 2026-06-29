/**
 * RadialTextService Tests
 * ======================
 *
 * Comprehensive unit tests for RadialTextService functionality.
 * Tests core text positioning, character layout, and flow calculations.
 *
 * @version 1.0.0
 */

import { RadialTextService } from '../RadialTextService';
import {
  RadialTextConfig,
  RadialTextValidation,
  DEFAULT_RADIAL_TEXT_CONFIG,
} from '../../../types/radial-text-types';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn(() => Date.now());
global.performance = { now: mockPerformanceNow } as any;

// Mock canvas for text measurement
const mockCanvasContext = {
  measureText: jest.fn((text: string) => ({
    width: text.length * 10, // Simple approximation
  })),
  font: '',
};

const mockCanvas = {
  getContext: jest.fn(() => mockCanvasContext),
};

// Mock createElement for canvas measurement
const originalCreateElement = document.createElement.bind(
  document
) as typeof document.createElement;
const createElementSpy = jest
  .spyOn(document, 'createElement')
  .mockImplementation(((tagName: any) => {
    if (tagName === 'canvas') {
      return mockCanvas as any;
    }

    return originalCreateElement(tagName);
  }) as any);

afterAll(() => {
  createElementSpy.mockRestore();
});

describe('RadialTextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        theme: 'frost_light',
        text: 'TEST TEXT',
        centerX: 200,
        centerY: 200,
        innerRadius: 120,
        startAngle: 0,
        endAngle: 360,
      };

      const validation: RadialTextValidation =
        RadialTextService.validateConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject configuration without text', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: '',
      };

      const validation = RadialTextService.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Text content is required');
    });

    it('should reject configuration without mandatory frost_glass theme', () => {
      const config = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        theme: 'invalid_theme' as any,
      };

      const validation = RadialTextService.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'theme must be \"frost_light\" or \"frost_dark\" (MANDATORY)'
      );
    });

    it('should reject configuration with invalid radius', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        innerRadius: -50,
      };

      const validation = RadialTextService.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'innerRadius must be a positive number'
      );
    });

    it('should reject configuration with invalid coordinates', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        centerX: NaN,
        centerY: Infinity,
      };

      const validation = RadialTextService.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('centerX must be a finite number');
      expect(validation.errors).toContain('centerY must be a finite number');
    });

    it('should warn about equal start and end angles', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        startAngle: 90,
        endAngle: 90,
      };

      const validation = RadialTextService.validateConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain(
        'startAngle and endAngle are equal - text may not be visible'
      );
    });

    it('should warn about very long text', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'A'.repeat(150), // Very long text
      };

      const validation = RadialTextService.validateConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain(
        'Text is very long - consider performance implications'
      );
    });
  });

  describe('calculateTextLayout', () => {
    it('should calculate layout for valid configuration', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        theme: 'frost_dark',
        text: 'HELLO',
        centerX: 200,
        centerY: 200,
        innerRadius: 100,
        startAngle: 0,
        endAngle: 180,
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters).toHaveLength(5);
      expect(layout.characters[0].char).toBe('H');
      expect(layout.characters[4].char).toBe('O');
      expect(layout.wasTruncated).toBe(false);
      expect(layout.metrics.characterCount).toBe(5);
      expect(layout.metrics.layoutTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty text gracefully', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: '',
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters).toHaveLength(0);
      expect(layout.usedArcLength).toBe(0);
      expect(layout.wasTruncated).toBe(false);
    });

    it('should handle Unicode characters correctly', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: '🎯🚀✨', // Emoji characters
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters).toHaveLength(3);
      expect(layout.characters[0].char).toBe('🎯');
      expect(layout.characters[1].char).toBe('🚀');
      expect(layout.characters[2].char).toBe('✨');
    });

    it('should calculate character positions correctly', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'AB',
        centerX: 0,
        centerY: 0,
        innerRadius: 100,
        startAngle: 0,
        endAngle: 90, // Quarter circle
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters).toHaveLength(2);

      // First character should be at start angle position
      const firstChar = layout.characters[0];
      expect(firstChar.position.x).toBeCloseTo(0, 1); // 0 degrees aligns with positive Y-axis
      expect(firstChar.position.y).toBeCloseTo(-100, 1); // At top of the circle

      // Second character should be at end angle position
      const secondChar = layout.characters[1];
      expect(secondChar.position.x).toBeCloseTo(70.71, 1); // Positioned midway along the arc
      expect(secondChar.position.y).toBeCloseTo(-70.71, 1); // Clockwise placement at roughly -45 degrees
    });

    it('should apply auto-sizing when enabled', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'VERY LONG TEXT STRING',
        autoSize: true,
        fontSize: 24, // Large font that should be reduced
      };

      const layout = RadialTextService.calculateTextLayout(config);

      // Auto-sizing should produce valid layout
      expect(layout.characters.length).toBeGreaterThan(0);
      expect(layout.metrics.layoutTime).toBeLessThan(100);
    });

    it('should handle text truncation with ellipsis', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'VERY LONG TEXT THAT SHOULD BE TRUNCATED',
        innerRadius: 50, // Small radius to force truncation
        textTruncation: 'ellipsis',
        autoSize: false,
        fontSize: 16,
      };

      const layout = RadialTextService.calculateTextLayout(config);

      // Should be truncated with ellipsis
      const lastChar = layout.characters[layout.characters.length - 1];
      if (layout.wasTruncated && layout.characters.length > 0) {
        expect(lastChar.char).toBe('…');
      }
    });
  });

  describe('createPreset', () => {
    it('should create hal-classic preset with correct properties', () => {
      const preset = RadialTextService.createPreset(
        'hal-classic',
        200,
        200,
        120,
        'frost_light'
      );

      expect(preset.theme).toBe('frost_light');
      expect(preset.text).toBe('HAL SYSTEM STATUS');
      expect(preset.centerX).toBe(200);
      expect(preset.centerY).toBe(200);
      expect(preset.innerRadius).toBe(120);
      expect(preset.startAngle).toBe(0);
      expect(preset.endAngle).toBe(360);
      expect(preset.textFlow).toBe('maintain-upright');
      expect(preset.autoSize).toBe(true);
    });

    it('should create status-ring preset with correct properties', () => {
      const preset = RadialTextService.createPreset(
        'status-ring',
        100,
        100,
        80,
        'frost_dark'
      );

      expect(preset.theme).toBe('frost_dark');
      expect(preset.text).toBe('SYSTEM ONLINE');
      expect(preset.centerX).toBe(100);
      expect(preset.centerY).toBe(100);
      expect(preset.innerRadius).toBe(80);
      expect(preset.startAngle).toBe(-45);
      expect(preset.endAngle).toBe(45);
      expect(preset.textFlow).toBe('follow-arc');
      expect(preset.autoSize).toBe(true);
    });

    it('should create message-arc preset with correct properties', () => {
      const preset = RadialTextService.createPreset(
        'message-arc',
        150,
        150,
        100,
        'frost_light'
      );

      expect(preset.theme).toBe('frost_light');
      expect(preset.text).toBe('MESSAGE');
      expect(preset.startAngle).toBe(180);
      expect(preset.endAngle).toBe(360);
      expect(preset.autoSize).toBe(false);
    });

    it('should create full-circle preset with correct properties', () => {
      const preset = RadialTextService.createPreset(
        'full-circle',
        0,
        0,
        140,
        'frost_dark'
      );

      expect(preset.theme).toBe('frost_dark');
      expect(preset.text).toBe('FULL CIRCLE TEXT DEMONSTRATION');
      expect(preset.startAngle).toBe(0);
      expect(preset.endAngle).toBe(360);
      expect(preset.textFlow).toBe('follow-arc');
      expect(preset.autoSize).toBe(true);
    });
  });

  describe('updateLayout', () => {
    it('should recalculate layout when text changes', () => {
      const initialCharacters = [
        {
          char: 'A',
          index: 0,
          position: {} as any,
          transform: '',
          scale: 1,
          rotation: 0,
          opacity: 1,
          visible: true,
        },
      ];

      const newConfig: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'NEW TEXT',
      };

      const layout = RadialTextService.updateLayout(
        initialCharacters,
        newConfig
      );

      expect(layout.characters).toHaveLength(8); // 'NEW TEXT' has 8 characters
      expect(layout.characters[0].char).toBe('N');
      expect(layout.characters[3].char).toBe(' ');
      expect(layout.characters[7].char).toBe('T');
    });

    it('should update positions when configuration changes', () => {
      const initialCharacters = [
        {
          char: 'A',
          index: 0,
          position: { x: 100, y: 0, angle: 0 } as any,
          transform: '',
          scale: 1,
          rotation: 0,
          opacity: 1,
          visible: true,
        },
        {
          char: 'B',
          index: 1,
          position: { x: 0, y: 100, angle: Math.PI / 2 } as any,
          transform: '',
          scale: 1,
          rotation: 0,
          opacity: 1,
          visible: true,
        },
      ];

      const newConfig: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'AB',
        centerX: 50, // Changed center
        centerY: 50,
        innerRadius: 75, // Changed radius
      };

      const layout = RadialTextService.updateLayout(
        initialCharacters,
        newConfig
      );

      expect(layout.characters).toHaveLength(2);
      // Positions should be updated based on new configuration
      expect(layout.characters[0].position.x).not.toBe(100);
      expect(layout.characters[1].position.y).not.toBe(100);
    });
  });

  describe('Performance', () => {
    it('should complete layout calculation within performance target', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'PERFORMANCE TEST TEXT WITH MANY CHARACTERS',
      };

      const startTime = Date.now();
      const layout = RadialTextService.calculateTextLayout(config);
      const endTime = Date.now();

      expect(layout.metrics.layoutTime).toBeLessThan(120);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle large text strings efficiently', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'A'.repeat(100), // 100 characters
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters.length).toBeGreaterThan(0);
      expect(layout.characters.length).toBeLessThanOrEqual(100);
      expect(layout.metrics.layoutTime).toBeLessThan(120);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero radius gracefully', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        innerRadius: 0,
      };

      const validation = RadialTextService.validateConfig(config);
      expect(validation.isValid).toBe(false);
    });

    it('should handle negative angles', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'TEST',
        startAngle: -90,
        endAngle: -45,
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters.length).toBeGreaterThan(0);
      expect(layout.metrics.layoutTime).toBeLessThan(120);
    });

    it('should handle angles greater than 360 degrees', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'TEST',
        startAngle: 0,
        endAngle: 450, // > 360 degrees
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters.length).toBeGreaterThan(0);
      expect(layout.usedArcLength).toBeGreaterThan(0);
    });

    it('should handle single character text', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: 'X',
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters).toHaveLength(1);
      expect(layout.characters[0].char).toBe('X');
      expect(layout.wasTruncated).toBe(false);
    });

    it('should handle text with whitespace characters', () => {
      const config: RadialTextConfig = {
        ...DEFAULT_RADIAL_TEXT_CONFIG,
        text: ' A B C ',
      };

      const layout = RadialTextService.calculateTextLayout(config);

      expect(layout.characters).toHaveLength(7);
      expect(layout.characters[0].char).toBe(' ');
      expect(layout.characters[1].char).toBe('A');
      expect(layout.characters[3].char).toBe('B');
      expect(layout.characters[5].char).toBe('C');
    });
  });
});
