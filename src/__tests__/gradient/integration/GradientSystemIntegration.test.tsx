import { renderHook, act } from '@testing-library/react';
import { useGradientManagement } from '../../../hooks/useGradientManagement';
import { useGradientTargets } from '../../../hooks/useGradientTargets';
import { useGradientPresets } from '../../../hooks/useGradientPresets';
import { useGradientCSS } from '../../../hooks/useGradientCSS';
import { Layer } from '../../../types/layer-types';
import { GradientData, GradientTarget } from '../../../utils/gradient';

// Mock localStorage for preset tests
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Gradient System Integration Tests', () => {
  const createTestLayer = (
    type: Layer['type'],
    customSettings?: any
  ): Layer => {
    const baseLayer: Layer = {
      id: `${type}-layer`,
      name: `Test ${type}`,
      type,
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    };

    switch (type) {
      case 'gradient':
        return {
          ...baseLayer,
          gradient: {
            type: 'linear',
            colors: ['#ff0000', '#0000ff'],
            stops: [0, 1],
            angle: 45,
          },
          ...customSettings,
        };

      case 'circle':
        return {
          ...baseLayer,
          circleSettings: {
            radius: 50,
            strokeWidth: 2,
            fillColor: '#ff0000',
            strokeColor: '#0000ff',
            fillGradient: {
              type: 'linear',
              colors: ['#ff0000', '#00ff00'],
              stops: [0, 1],
              angle: 90,
            },
            strokeGradient: {
              type: 'radial',
              colors: ['#0000ff', '#ffff00'],
              stops: [0, 1],
              centerX: 30,
              centerY: 70,
            },
          },
          ...customSettings,
        };

      case 'equalizer':
        return {
          ...baseLayer,
          equalizerSettings: {
            barCount: 32,
            barStyle: 'line',
            barWidth: 2,
            barSpacing: 1,
            barRotation: 0,
            innerRadius: 120,
            maxHeight: 30,
            responseSpeed: 0.7,
            frequencyRange: 'full',
            colorMode: 'custom-gradient',
            primaryColor: '#00ff00',
            secondaryColor: '#0000ff',
            customGradient: {
              colors: ['#ff0000', '#00ff00'],
              stops: [0, 1],
            },
            radialGradientSettings: {
              fromCenter: true,
              colors: ['#ffffff', '#ff0000'],
              stops: [0, 1],
            },
            glowIntensity: 0.5,
            symmetry: 'none',
            pulseMode: 'none',
            positionX: 50,
            positionY: 50,
            startAngle: 0,
            endAngle: 360,
            arcMode: false,
          },
          ...customSettings,
        };

      default:
        return baseLayer;
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
  });

  describe('Complete Workflow: Add Color → Update → Generate CSS', () => {
    it('performs complete gradient workflow for layer target', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: cssResult } = renderHook(() => useGradientCSS());

      const layer = createTestLayer('gradient');
      const layers = [layer];
      let updatedLayer: Layer | null = null;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          updatedLayer = { ...layers.find(l => l.id === layerId)!, ...updates };
        }
      );

      // Step 1: Add a color to the gradient
      act(() => {
        managementResult.current.addGradientColor(
          'gradient-layer',
          mockUpdateLayer,
          layers,
          false,
          'layer'
        );
      });

      expect(mockUpdateLayer).toHaveBeenCalled();
      expect(updatedLayer?.gradient?.colors).toHaveLength(3);

      // Step 2: Update the new color
      act(() => {
        managementResult.current.updateGradientColor(
          'gradient-layer',
          2,
          '#00ff00',
          mockUpdateLayer,
          [updatedLayer!],
          false,
          'layer'
        );
      });

      expect(updatedLayer?.gradient?.colors[2]).toBe('#00ff00');

      // Step 3: Generate CSS from the updated gradient
      const css = cssResult.current.generateCSS(updatedLayer!.gradient!);

      expect(css).toContain('linear-gradient');
      expect(css).toContain('#ff0000');
      expect(css).toContain('#0000ff');
      expect(css).toContain('#00ff00');
    });

    it('performs complete workflow for circle fill target', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: cssResult } = renderHook(() => useGradientCSS());

      const layer = createTestLayer('circle');
      const layers = [layer];
      let updatedLayer: Layer | null = null;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          updatedLayer = { ...layers.find(l => l.id === layerId)!, ...updates };
        }
      );

      // Step 1: Update gradient type
      act(() => {
        managementResult.current.updateGradientType(
          'circle-layer',
          'radial',
          mockUpdateLayer,
          layers,
          'fill'
        );
      });

      expect(updatedLayer?.circleSettings?.fillGradient?.type).toBe('radial');

      // Step 2: Update gradient center
      act(() => {
        managementResult.current.updateGradientCenter(
          'circle-layer',
          25,
          75,
          mockUpdateLayer,
          [updatedLayer!],
          'fill'
        );
      });

      expect(updatedLayer?.circleSettings?.fillGradient?.centerX).toBe(25);
      expect(updatedLayer?.circleSettings?.fillGradient?.centerY).toBe(75);

      // Step 3: Generate CSS
      const css = cssResult.current.generateCSS(
        updatedLayer!.circleSettings!.fillGradient!
      );

      expect(css).toContain('radial-gradient');
      expect(css).toContain('25% 75%');
    });

    it('performs complete workflow for equalizer custom gradient', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: targetsResult } = renderHook(() => useGradientTargets());

      const layer = createTestLayer('equalizer');
      const layers = [layer];
      let updatedLayer: Layer | null = null;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          updatedLayer = { ...layers.find(l => l.id === layerId)!, ...updates };
        }
      );

      // Step 1: Add color to custom gradient (isEqualizer = true)
      act(() => {
        managementResult.current.addGradientColor(
          'equalizer-layer',
          mockUpdateLayer,
          layers,
          true, // isEqualizer
          'custom'
        );
      });

      expect(
        updatedLayer?.equalizerSettings?.customGradient?.colors
      ).toHaveLength(3);

      // Step 2: Extract gradient using targets
      const extractedGradient = targetsResult.current.extractFromTarget(
        updatedLayer!,
        'custom'
      );

      expect(extractedGradient).toBeDefined();
      expect(extractedGradient?.colors).toHaveLength(3);
    });
  });

  describe('Preset Integration with All Targets', () => {
    it('applies presets to different target types', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: presetsResult } = renderHook(() => useGradientPresets());

      const layers = [
        createTestLayer('gradient'),
        createTestLayer('circle'),
        createTestLayer('equalizer'),
      ];

      const updatedLayers: { [key: string]: Layer } = {};

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          const layer = layers.find(l => l.id === layerId);
          if (layer) {
            updatedLayers[layerId] = { ...layer, ...updates };
          }
        }
      );

      // Create a custom preset
      const testGradient: GradientData = {
        type: 'linear',
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
        stops: [0, 0.5, 1],
        angle: 135,
      };

      let customPreset;
      act(() => {
        customPreset = presetsResult.current.createCustomPreset(
          'Test Preset',
          testGradient
        );
        presetsResult.current.saveCustomPreset(customPreset);
      });

      // Apply to gradient layer
      act(() => {
        presetsResult.current.applyCustomPreset(
          'gradient-layer',
          customPreset,
          mockUpdateLayer,
          layers,
          'layer'
        );
      });

      // Apply to circle fill
      act(() => {
        presetsResult.current.applyCustomPreset(
          'circle-layer',
          customPreset,
          mockUpdateLayer,
          layers,
          'fill'
        );
      });

      // Apply to equalizer custom
      act(() => {
        presetsResult.current.applyCustomPreset(
          'equalizer-layer',
          customPreset,
          mockUpdateLayer,
          layers,
          'custom'
        );
      });

      // Verify all applications worked
      expect(updatedLayers['gradient-layer'].gradient?.colors).toEqual(
        testGradient.colors
      );
      expect(
        updatedLayers['circle-layer'].circleSettings?.fillGradient?.colors
      ).toEqual(testGradient.colors);
      expect(
        updatedLayers['equalizer-layer'].equalizerSettings?.customGradient
          ?.colors
      ).toEqual(testGradient.colors);
    });
  });

  describe('Target Validation and Error Handling', () => {
    it('handles invalid target applications gracefully', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: targetsResult } = renderHook(() => useGradientTargets());

      const gradientLayer = createTestLayer('gradient');
      const equalizerLayer = createTestLayer('equalizer');
      const layers = [gradientLayer, equalizerLayer];

      const mockUpdateLayer = jest.fn();

      // Try to apply fill target to gradient layer (should fail)
      expect(() => {
        managementResult.current.addGradientColor(
          'gradient-layer',
          mockUpdateLayer,
          layers,
          false,
          'fill'
        );
      }).not.toThrow(); // Should handle gracefully

      // Try to apply layer target to equalizer (should fail)
      expect(() => {
        managementResult.current.addGradientColor(
          'equalizer-layer',
          mockUpdateLayer,
          layers,
          false,
          'layer'
        );
      }).not.toThrow(); // Should handle gracefully

      // Verify no updates were made
      expect(mockUpdateLayer).not.toHaveBeenCalled();

      // Test target validation directly
      expect(targetsResult.current.validateTarget(gradientLayer, 'layer')).toBe(
        true
      );
      expect(targetsResult.current.validateTarget(gradientLayer, 'fill')).toBe(
        false
      );
      expect(
        targetsResult.current.validateTarget(equalizerLayer, 'custom')
      ).toBe(true);
      expect(
        targetsResult.current.validateTarget(equalizerLayer, 'layer')
      ).toBe(false);
    });

    it('provides correct supported targets for each layer type', () => {
      const { result: targetsResult } = renderHook(() => useGradientTargets());

      const gradientLayer = createTestLayer('gradient');
      const circleLayer = createTestLayer('circle');
      const equalizerLayer = createTestLayer('equalizer');

      const gradientTargets =
        targetsResult.current.getSupportedTargets(gradientLayer);
      const circleTargets =
        targetsResult.current.getSupportedTargets(circleLayer);
      const equalizerTargets =
        targetsResult.current.getSupportedTargets(equalizerLayer);

      expect(gradientTargets).toContain('layer');
      expect(gradientTargets).not.toContain('fill');
      expect(gradientTargets).not.toContain('stroke');

      expect(circleTargets).toContain('fill');
      expect(circleTargets).toContain('stroke');
      expect(circleTargets).not.toContain('layer');
      expect(circleTargets).not.toContain('custom');

      expect(equalizerTargets).toContain('custom');
      expect(equalizerTargets).toContain('radial');
      expect(equalizerTargets).not.toContain('layer');
      expect(equalizerTargets).not.toContain('fill');
    });
  });

  describe('CSS Generation Integration', () => {
    it('generates correct CSS for all gradient types from management system', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );

      const layer = createTestLayer('gradient');
      const layers = [layer];
      let updatedLayer: Layer | null = null;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          updatedLayer = { ...layers.find(l => l.id === layerId)!, ...updates };
        }
      );

      // Test linear gradient CSS
      const linearCSS = managementResult.current.generateGradientCSS(
        layer,
        'layer'
      );
      expect(linearCSS).toContain('linear-gradient');

      // Update to radial gradient
      act(() => {
        managementResult.current.updateGradientType(
          'gradient-layer',
          'radial',
          mockUpdateLayer,
          layers,
          'layer'
        );
      });

      const radialCSS = managementResult.current.generateGradientCSS(
        updatedLayer!,
        'layer'
      );
      expect(radialCSS).toContain('radial-gradient');

      // Update to conic gradient
      act(() => {
        managementResult.current.updateGradientType(
          'gradient-layer',
          'conic',
          mockUpdateLayer,
          [updatedLayer!],
          'layer'
        );
      });

      const conicCSS = managementResult.current.generateGradientCSS(
        updatedLayer!,
        'layer'
      );
      expect(conicCSS).toContain('conic-gradient');
    });

    it('validates generated CSS strings', () => {
      const { result: cssResult } = renderHook(() => useGradientCSS());
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );

      const layer = createTestLayer('gradient');

      // Generate CSS using management system
      const css = managementResult.current.generateGradientCSS(layer, 'layer');

      // Validate using CSS hook
      expect(cssResult.current.validateGradientCSS(css)).toBe(true);

      // Test with various options
      const minifiedCSS = cssResult.current.generateCSS(layer.gradient!, {
        minifyOutput: true,
      });
      expect(cssResult.current.validateGradientCSS(minifiedCSS)).toBe(true);

      const prefixedCSS = cssResult.current.generateCSS(layer.gradient!, {
        includePrefixes: true,
      });
      // Only validate the last part (standard CSS) since validation doesn't handle prefixes
      const standardPart = prefixedCSS.split(', ').pop()!;
      expect(cssResult.current.validateGradientCSS(standardPart)).toBe(true);
    });
  });

  describe('Performance and Memory Integration', () => {
    it('handles rapid successive operations efficiently', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );

      const layer = createTestLayer('gradient');
      const layers = [layer];
      let currentLayer = layer;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          currentLayer = { ...currentLayer, ...updates };
        }
      );

      const startTime = performance.now();

      // Perform 100 rapid operations
      act(() => {
        for (let i = 0; i < 100; i++) {
          managementResult.current.addGradientColor(
            'gradient-layer',
            mockUpdateLayer,
            [currentLayer],
            false,
            'layer'
          );

          managementResult.current.updateGradientColor(
            'gradient-layer',
            0,
            `#${i.toString(16).padStart(6, '0')}`,
            mockUpdateLayer,
            [currentLayer],
            false,
            'layer'
          );
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(mockUpdateLayer).toHaveBeenCalledTimes(200); // 100 add + 100 update operations
    });

    it('maintains consistent memory usage across operations', () => {
      const { result: presetsResult } = renderHook(() => useGradientPresets());

      const initialCustomPresets = presetsResult.current.customPresets.length;

      // Create and save multiple presets
      act(() => {
        for (let i = 0; i < 50; i++) {
          const preset = presetsResult.current.createCustomPreset(
            `Preset ${i}`,
            {
              type: 'linear',
              colors: [`#${i.toString(16).padStart(6, '0')}`, '#ffffff'],
              stops: [0, 1],
            }
          );
          presetsResult.current.saveCustomPreset(preset);
        }
      });

      expect(presetsResult.current.customPresets.length).toBe(
        initialCustomPresets + 50
      );

      // Delete half of them
      act(() => {
        const presetsToDelete = presetsResult.current.customPresets.slice(
          0,
          25
        );
        presetsToDelete.forEach(preset => {
          presetsResult.current.deleteCustomPreset(preset.id);
        });
      });

      expect(presetsResult.current.customPresets.length).toBe(
        initialCustomPresets + 25
      );

      // Ensure localStorage operations work
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(75); // 50 saves + 25 deletes
    });
  });

  describe('Complex Multi-Hook Workflows', () => {
    it('coordinates between all hooks for complete gradient management', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: presetsResult } = renderHook(() => useGradientPresets());
      const { result: targetsResult } = renderHook(() => useGradientTargets());
      const { result: cssResult } = renderHook(() => useGradientCSS());

      const layer = createTestLayer('circle');
      const layers = [layer];
      let updatedLayer: Layer | null = null;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          updatedLayer = { ...layers.find(l => l.id === layerId)!, ...updates };
        }
      );

      // Step 1: Use targets to validate supported targets
      const supportedTargets = targetsResult.current.getSupportedTargets(layer);
      expect(supportedTargets).toContain('fill');
      expect(supportedTargets).toContain('stroke');

      // Step 2: Use management to modify fill gradient
      act(() => {
        managementResult.current.addGradientColor(
          'circle-layer',
          mockUpdateLayer,
          layers,
          false,
          'fill'
        );
      });

      // Step 3: Create custom preset from current gradient
      const currentFillGradient = targetsResult.current.extractFromTarget(
        updatedLayer!,
        'fill'
      );
      expect(currentFillGradient).toBeDefined();

      let customPreset;
      act(() => {
        customPreset = presetsResult.current.createCustomPreset(
          'My Circle Fill',
          currentFillGradient!,
          'Created from circle fill'
        );
        presetsResult.current.saveCustomPreset(customPreset);
      });

      // Step 4: Apply same preset to stroke
      act(() => {
        presetsResult.current.applyCustomPreset(
          'circle-layer',
          customPreset,
          mockUpdateLayer,
          [updatedLayer!],
          'stroke'
        );
      });

      // Step 5: Generate CSS for both gradients
      const fillGradient = targetsResult.current.extractFromTarget(
        updatedLayer!,
        'fill'
      );
      const strokeGradient = targetsResult.current.extractFromTarget(
        updatedLayer!,
        'stroke'
      );

      const fillCSS = cssResult.current.generateCSS(fillGradient!);
      const strokeCSS = cssResult.current.generateCSS(strokeGradient!);

      // Step 6: Validate both CSS outputs
      expect(cssResult.current.validateGradientCSS(fillCSS)).toBe(true);
      expect(cssResult.current.validateGradientCSS(strokeCSS)).toBe(true);

      // Step 7: Verify they have the same colors (from preset)
      expect(fillGradient?.colors).toEqual(strokeGradient?.colors);

      // Step 8: Search for the created preset
      const searchResults = presetsResult.current.searchPresets('Circle Fill');
      expect(searchResults).toContain(customPreset);
    });

    it('handles error propagation across hook boundaries', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: presetsResult } = renderHook(() => useGradientPresets());

      const invalidLayer = { id: 'invalid', type: 'unknown' } as any;
      const mockUpdateLayer = jest.fn();

      // Test error handling in management system
      expect(() => {
        managementResult.current.addGradientColor(
          'invalid',
          mockUpdateLayer,
          [invalidLayer],
          false,
          'layer'
        );
      }).not.toThrow();

      // Test error handling in presets system
      expect(() => {
        presetsResult.current.applyPreset(
          'non-existent-layer',
          'sunset',
          mockUpdateLayer,
          [invalidLayer]
        );
      }).toThrow("Layer 'non-existent-layer' not found");

      expect(() => {
        presetsResult.current.applyPreset(
          'invalid',
          'non-existent-preset',
          mockUpdateLayer,
          [invalidLayer]
        );
      }).toThrow("Preset 'non-existent-preset' not found");
    });
  });

  describe('Data Consistency Across Hooks', () => {
    it('maintains gradient data consistency across all operations', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: targetsResult } = renderHook(() => useGradientTargets());
      const { result: cssResult } = renderHook(() => useGradientCSS());

      const layer = createTestLayer('gradient');
      const layers = [layer];
      let updatedLayer: Layer | null = null;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          updatedLayer = { ...layers.find(l => l.id === layerId)!, ...updates };
        }
      );

      // Perform a series of modifications
      act(() => {
        // Add color
        managementResult.current.addGradientColor(
          'gradient-layer',
          mockUpdateLayer,
          layers,
          false,
          'layer'
        );

        // Update angle
        managementResult.current.updateGradientAngle(
          'gradient-layer',
          90,
          mockUpdateLayer,
          [updatedLayer!],
          'layer'
        );

        // Update stop
        managementResult.current.updateGradientStop(
          'gradient-layer',
          1,
          0.75,
          mockUpdateLayer,
          [updatedLayer!],
          'layer'
        );
      });

      // Extract using targets
      const extractedGradient = targetsResult.current.extractFromTarget(
        updatedLayer!,
        'layer'
      );

      // Verify consistency
      expect(extractedGradient?.colors).toHaveLength(3);
      expect(extractedGradient?.angle).toBe(90);
      expect(extractedGradient?.stops[1]).toBe(0.75);

      // Generate CSS and verify it reflects all changes
      const css = cssResult.current.generateCSS(extractedGradient!);
      expect(css).toContain('90deg');
      expect(css).toContain('75%');
      expect(css.split(',').length).toBe(4); // 3 colors = 4 parts (function + 3 color stops)
    });

    it('preserves gradient properties across type changes', () => {
      const { result: managementResult } = renderHook(() =>
        useGradientManagement()
      );
      const { result: targetsResult } = renderHook(() => useGradientTargets());

      const layer = createTestLayer('gradient');
      const layers = [layer];
      let updatedLayer: Layer | null = null;

      const mockUpdateLayer = jest.fn(
        (layerId: string, updates: Partial<Layer>) => {
          updatedLayer = { ...layers.find(l => l.id === layerId)!, ...updates };
        }
      );

      // Add more colors and set center
      act(() => {
        managementResult.current.addGradientColor(
          'gradient-layer',
          mockUpdateLayer,
          layers,
          false,
          'layer'
        );

        managementResult.current.updateGradientCenter(
          'gradient-layer',
          25,
          75,
          mockUpdateLayer,
          [updatedLayer!],
          'layer'
        );
      });

      const beforeChange = targetsResult.current.extractFromTarget(
        updatedLayer!,
        'layer'
      );
      const originalColors = beforeChange?.colors;

      // Change type from linear to radial
      act(() => {
        managementResult.current.updateGradientType(
          'gradient-layer',
          'radial',
          mockUpdateLayer,
          [updatedLayer!],
          'layer'
        );
      });

      const afterChange = targetsResult.current.extractFromTarget(
        updatedLayer!,
        'layer'
      );

      // Colors should be preserved
      expect(afterChange?.colors).toEqual(originalColors);
      expect(afterChange?.type).toBe('radial');
      expect(afterChange?.centerX).toBe(25);
      expect(afterChange?.centerY).toBe(75);
    });
  });

  describe('Stress Testing', () => {
    it('handles complex layer hierarchies with multiple gradient targets', () => {
      const complexLayer = createTestLayer('circle', {
        circleSettings: {
          radius: 100,
          strokeWidth: 10,
          fillColor: '#ff0000',
          strokeColor: '#0000ff',
          fillGradient: {
            type: 'linear',
            colors: ['#ff0000', '#ff8800', '#ffff00'],
            stops: [0, 0.3, 1],
            angle: 45,
          },
          strokeGradient: {
            type: 'radial',
            colors: ['#0000ff', '#8800ff', '#ff00ff'],
            stops: [0, 0.7, 1],
            centerX: 30,
            centerY: 30,
          },
        },
      });

      const { result: targetsResult } = renderHook(() => useGradientTargets());
      const { result: cssResult } = renderHook(() => useGradientCSS());

      // Extract both gradients
      const fillGradient = targetsResult.current.extractFromTarget(
        complexLayer,
        'fill'
      );
      const strokeGradient = targetsResult.current.extractFromTarget(
        complexLayer,
        'stroke'
      );

      // Generate CSS for both
      const fillCSS = cssResult.current.generateCSS(fillGradient!);
      const strokeCSS = cssResult.current.generateCSS(strokeGradient!);

      // Validate both
      expect(cssResult.current.validateGradientCSS(fillCSS)).toBe(true);
      expect(cssResult.current.validateGradientCSS(strokeCSS)).toBe(true);

      // Verify different types
      expect(fillCSS).toContain('linear-gradient');
      expect(strokeCSS).toContain('radial-gradient');

      // Verify color counts
      expect(fillGradient?.colors).toHaveLength(3);
      expect(strokeGradient?.colors).toHaveLength(3);
    });
  });
});
