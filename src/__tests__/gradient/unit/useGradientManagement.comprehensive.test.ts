import { renderHook } from '@testing-library/react';
import useGradientManagement from '../../../hooks/useGradientManagement';
import { Layer } from '../../../types/layer-types';
import { GradientType, GradientTarget } from '../../../utils/gradient';

// Mock all dependencies
jest.mock('../../../hooks/gradient/useGradientCore');
jest.mock('../../../hooks/gradient/useGradientValidation');
jest.mock('../../../hooks/useGradientTargets');
jest.mock('../../../hooks/useGradientPresets');
jest.mock('../../../hooks/useGradientCSS');

// Create mock implementations
const mockGradientCore = {
  addColor: jest.fn((gradient, color) => ({
    ...gradient,
    colors: [...gradient.colors, color],
    stops: gradient.stops.length === 2 ? [0, 0.5, 1] : [...gradient.stops, 1],
  })),
  removeColor: jest.fn((gradient, index) => {
    if (gradient.colors.length <= 2) return gradient;
    const newColors = gradient.colors.filter((_, i) => i !== index);
    const newStops = gradient.stops.filter((_, i) => i !== index);
    return { ...gradient, colors: newColors, stops: newStops };
  }),
  updateColor: jest.fn((gradient, index, color) => ({
    ...gradient,
    colors: gradient.colors.map((c, i) => (i === index ? color : c)),
  })),
  updateStop: jest.fn((gradient, index, stop) => ({
    ...gradient,
    stops: gradient.stops.map((s, i) =>
      i === index ? Math.max(0, Math.min(1, stop)) : s
    ),
  })),
  updateType: jest.fn((gradient, type) => ({ ...gradient, type })),
  updateAngle: jest.fn((gradient, angle) => ({ ...gradient, angle })),
  updateCenter: jest.fn((gradient, centerX, centerY) => ({
    ...gradient,
    centerX,
    centerY,
  })),
};

const mockGradientValidation = {
  validateColor: jest.fn(color => /^#[0-9a-fA-F]{6}$/.test(color)),
  validateAngle: jest.fn(angle => angle >= 0 && angle <= 360),
  validatePosition: jest.fn(pos => pos >= 0 && pos <= 100),
  validateGradientData: jest.fn((colors, stops) => ({
    isValid: colors.length === stops.length && colors.length >= 2,
    errors: [],
  })),
};

const mockGradientTargets = {
  applyToTarget: jest.fn((layer, gradient, target) => {
    if (target === 'layer') return { gradient };
    if (target === 'custom')
      return {
        equalizerSettings: {
          ...layer.equalizerSettings,
          customGradient: gradient,
        },
      };
    if (target === 'radial')
      return {
        equalizerSettings: {
          ...layer.equalizerSettings,
          radialGradientSettings: gradient,
        },
      };
    if (target === 'fill')
      return {
        circleSettings: { ...layer.circleSettings, fillGradient: gradient },
      };
    if (target === 'stroke')
      return {
        circleSettings: { ...layer.circleSettings, strokeGradient: gradient },
      };
    return {};
  }),
  extractFromTarget: jest.fn((layer, target) => {
    if (target === 'layer') return layer.gradient;
    if (target === 'custom') return layer.equalizerSettings?.customGradient;
    if (target === 'radial')
      return layer.equalizerSettings?.radialGradientSettings;
    if (target === 'fill') return layer.circleSettings?.fillGradient;
    if (target === 'stroke') return layer.circleSettings?.strokeGradient;
    return null;
  }),
};

const mockGradientPresets = {
  presets: [
    {
      name: 'sunset',
      colors: ['#ff6b6b', '#ffa726', '#ffcc02'],
      stops: [0, 0.5, 1],
    },
    {
      name: 'ocean',
      colors: ['#0077be', '#00a8cc', '#00c896'],
      stops: [0, 0.5, 1],
    },
  ],
  applyPreset: jest.fn(),
};

const mockGradientCSS = {
  generateCSS: jest.fn(
    gradient =>
      `linear-gradient(${gradient.angle || 0}deg, ${gradient.colors.join(', ')})`
  ),
};

// Mock the hook modules
require('../../../hooks/gradient/useGradientCore').useGradientCore = jest.fn(
  () => mockGradientCore
);
require('../../../hooks/gradient/useGradientValidation').useGradientValidation =
  jest.fn(() => mockGradientValidation);
require('../../../hooks/useGradientTargets').useGradientTargets = jest.fn(
  () => mockGradientTargets
);
require('../../../hooks/useGradientPresets').useGradientPresets = jest.fn(
  () => mockGradientPresets
);
require('../../../hooks/useGradientCSS').useGradientCSS = jest.fn(
  () => mockGradientCSS
);

describe('useGradientManagement - Comprehensive Coverage', () => {
  const mockGradientLayer: Layer = {
    id: 'gradient-layer',
    name: 'Test Gradient',
    type: 'gradient',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    gradient: {
      type: 'linear',
      colors: ['#ff0000', '#0000ff'],
      stops: [0, 1],
      angle: 0,
    },
  };

  const mockEqualizerLayer: Layer = {
    id: 'equalizer-layer',
    name: 'Test Equalizer',
    type: 'equalizer',
    visible: true,
    opacity: 1,
    blendMode: 'screen',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
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
        type: 'linear',
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        angle: 90,
      },
      radialGradientSettings: {
        fromCenter: true,
        type: 'radial',
        colors: ['#ffffff', '#ff0000'],
        stops: [0, 1],
        centerX: 50,
        centerY: 50,
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
  };

  const mockCircleLayer: Layer = {
    id: 'circle-layer',
    name: 'Test Circle',
    type: 'circle',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
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
  };

  const mockLayers = [mockGradientLayer, mockEqualizerLayer, mockCircleLayer];
  const mockUpdateLayer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateLayer.mockClear();
  });

  describe('Hook Initialization', () => {
    it('returns all required functions and properties', () => {
      const { result } = renderHook(() => useGradientManagement());

      expect(result.current).toHaveProperty('addGradientColor');
      expect(result.current).toHaveProperty('removeGradientColor');
      expect(result.current).toHaveProperty('updateGradientColor');
      expect(result.current).toHaveProperty('updateGradientStop');
      expect(result.current).toHaveProperty('updateGradientType');
      expect(result.current).toHaveProperty('updateGradientAngle');
      expect(result.current).toHaveProperty('updateGradientCenter');
      expect(result.current).toHaveProperty('applyGradientPreset');
      expect(result.current).toHaveProperty('generateGradientCSS');
      expect(result.current).toHaveProperty('validateGradientData');
      expect(result.current).toHaveProperty('presets');
    });

    it('exposes presets from useGradientPresets', () => {
      const { result } = renderHook(() => useGradientManagement());

      expect(result.current.presets).toEqual(mockGradientPresets.presets);
    });
  });

  describe('Basic Gradient Operations', () => {
    describe('addGradientColor', () => {
      it('adds color to layer gradient with default parameters', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.addGradientColor(
          'gradient-layer',
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
          mockGradientLayer,
          'layer'
        );
        expect(mockGradientCore.addColor).toHaveBeenCalledWith(
          mockGradientLayer.gradient,
          '#ffffff'
        );
        expect(mockGradientTargets.applyToTarget).toHaveBeenCalled();
        expect(mockUpdateLayer).toHaveBeenCalled();
      });

      it('adds color to equalizer custom gradient when isEqualizer is true', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.addGradientColor(
          'equalizer-layer',
          mockUpdateLayer,
          mockLayers,
          true,
          'layer'
        );

        expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
          mockEqualizerLayer,
          'custom'
        );
      });

      it('handles missing layer gracefully', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.addGradientColor(
          'non-existent-layer',
          mockUpdateLayer,
          mockLayers
        );

        expect(mockUpdateLayer).not.toHaveBeenCalled();
      });

      it('handles missing gradient gracefully', () => {
        const layerWithoutGradient = {
          ...mockGradientLayer,
          gradient: undefined,
        };
        mockGradientTargets.extractFromTarget.mockReturnValueOnce(null);

        const { result } = renderHook(() => useGradientManagement());

        result.current.addGradientColor('gradient-layer', mockUpdateLayer, [
          layerWithoutGradient,
        ]);

        expect(mockUpdateLayer).not.toHaveBeenCalled();
      });
    });

    describe('removeGradientColor', () => {
      it('removes color from gradient', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.removeGradientColor(
          'gradient-layer',
          0,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientCore.removeColor).toHaveBeenCalledWith(
          mockGradientLayer.gradient,
          0
        );
      });

      it('works with all gradient targets', () => {
        const { result } = renderHook(() => useGradientManagement());

        // Test with radial target
        result.current.removeGradientColor(
          'equalizer-layer',
          0,
          mockUpdateLayer,
          mockLayers,
          false,
          'radial'
        );

        expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
          mockEqualizerLayer,
          'radial'
        );
      });
    });

    describe('updateGradientColor', () => {
      it('updates color with valid hex color', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientColor(
          'gradient-layer',
          0,
          '#00ff00',
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientValidation.validateColor).toHaveBeenCalledWith(
          '#00ff00'
        );
        expect(mockGradientCore.updateColor).toHaveBeenCalledWith(
          mockGradientLayer.gradient,
          0,
          '#00ff00'
        );
      });

      it('skips update for invalid color', () => {
        mockGradientValidation.validateColor.mockReturnValueOnce(false);
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientColor(
          'gradient-layer',
          0,
          'invalid-color',
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientCore.updateColor).not.toHaveBeenCalled();
      });

      it('works with circle fill target', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientColor(
          'circle-layer',
          0,
          '#ff00ff',
          mockUpdateLayer,
          mockLayers,
          false,
          'fill'
        );

        expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
          mockCircleLayer,
          'fill'
        );
      });
    });

    describe('updateGradientStop', () => {
      it('updates gradient stop', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientStop(
          'gradient-layer',
          1,
          0.7,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientCore.updateStop).toHaveBeenCalledWith(
          mockGradientLayer.gradient,
          1,
          0.7
        );
      });

      it('works with stroke target', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientStop(
          'circle-layer',
          0,
          0.3,
          mockUpdateLayer,
          mockLayers,
          false,
          'stroke'
        );

        expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
          mockCircleLayer,
          'stroke'
        );
      });
    });
  });

  describe('Advanced Gradient Features', () => {
    describe('updateGradientType', () => {
      it('updates gradient type', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientType(
          'gradient-layer',
          'radial' as GradientType,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientCore.updateType).toHaveBeenCalledWith(
          mockGradientLayer.gradient,
          'radial'
        );
      });

      it('works with custom gradient target', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientType(
          'equalizer-layer',
          'conic' as GradientType,
          mockUpdateLayer,
          mockLayers,
          'custom' as GradientTarget
        );

        expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
          mockEqualizerLayer,
          'custom'
        );
      });
    });

    describe('updateGradientAngle', () => {
      it('updates angle with valid value', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientAngle(
          'gradient-layer',
          45,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientValidation.validateAngle).toHaveBeenCalledWith(45);
        expect(mockGradientCore.updateAngle).toHaveBeenCalledWith(
          mockGradientLayer.gradient,
          45
        );
      });

      it('skips update for invalid angle', () => {
        mockGradientValidation.validateAngle.mockReturnValueOnce(false);
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientAngle(
          'gradient-layer',
          -10,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientCore.updateAngle).not.toHaveBeenCalled();
      });
    });

    describe('updateGradientCenter', () => {
      it('updates center with valid coordinates', () => {
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientCenter(
          'gradient-layer',
          30,
          70,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientValidation.validatePosition).toHaveBeenCalledWith(
          30
        );
        expect(mockGradientValidation.validatePosition).toHaveBeenCalledWith(
          70
        );
        expect(mockGradientCore.updateCenter).toHaveBeenCalledWith(
          mockGradientLayer.gradient,
          30,
          70
        );
      });

      it('skips update for invalid centerX', () => {
        mockGradientValidation.validatePosition.mockImplementation(
          pos => pos === 70
        );
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientCenter(
          'gradient-layer',
          -10,
          70,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientCore.updateCenter).not.toHaveBeenCalled();
      });

      it('skips update for invalid centerY', () => {
        mockGradientValidation.validatePosition.mockImplementation(
          pos => pos === 30
        );
        const { result } = renderHook(() => useGradientManagement());

        result.current.updateGradientCenter(
          'gradient-layer',
          30,
          110,
          mockUpdateLayer,
          mockLayers
        );

        expect(mockGradientCore.updateCenter).not.toHaveBeenCalled();
      });
    });
  });

  describe('Preset Management', () => {
    it('applies gradient preset', () => {
      const { result } = renderHook(() => useGradientManagement());
      const sunsetPreset = mockGradientPresets.presets[0];

      result.current.applyGradientPreset(
        'gradient-layer',
        sunsetPreset,
        mockUpdateLayer,
        mockLayers
      );

      expect(mockGradientPresets.applyPreset).toHaveBeenCalledWith(
        'gradient-layer',
        'sunset',
        mockUpdateLayer,
        mockLayers,
        'layer'
      );
    });

    it('applies preset to specific gradient target', () => {
      const { result } = renderHook(() => useGradientManagement());
      const oceanPreset = mockGradientPresets.presets[1];

      result.current.applyGradientPreset(
        'circle-layer',
        oceanPreset,
        mockUpdateLayer,
        mockLayers,
        'fill' as GradientTarget
      );

      expect(mockGradientPresets.applyPreset).toHaveBeenCalledWith(
        'circle-layer',
        'ocean',
        mockUpdateLayer,
        mockLayers,
        'fill'
      );
    });
  });

  describe('CSS Generation', () => {
    it('generates CSS for layer gradient', () => {
      const { result } = renderHook(() => useGradientManagement());

      const css = result.current.generateGradientCSS(mockGradientLayer);

      expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
        mockGradientLayer,
        'layer'
      );
      expect(mockGradientCSS.generateCSS).toHaveBeenCalledWith(
        mockGradientLayer.gradient
      );
      expect(css).toBe('linear-gradient(0deg, #ff0000, #0000ff)');
    });

    it('generates CSS for specific gradient target', () => {
      const { result } = renderHook(() => useGradientManagement());

      const css = result.current.generateGradientCSS(
        mockCircleLayer,
        'fill' as GradientTarget
      );

      expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
        mockCircleLayer,
        'fill'
      );
    });

    it('returns empty string for missing gradient', () => {
      mockGradientTargets.extractFromTarget.mockReturnValueOnce(null);
      const { result } = renderHook(() => useGradientManagement());

      const css = result.current.generateGradientCSS(mockGradientLayer);

      expect(css).toBe('');
    });
  });

  describe('Validation', () => {
    it('validates gradient data successfully', () => {
      const { result } = renderHook(() => useGradientManagement());
      const colors = ['#ff0000', '#00ff00'];
      const stops = [0, 1];

      const validated = result.current.validateGradientData(colors, stops);

      expect(mockGradientValidation.validateGradientData).toHaveBeenCalledWith(
        colors,
        stops
      );
      expect(validated).toEqual({ colors, stops });
    });

    it('returns empty arrays for invalid gradient data', () => {
      mockGradientValidation.validateGradientData.mockReturnValueOnce({
        isValid: false,
      });
      const { result } = renderHook(() => useGradientManagement());
      const colors = ['invalid'];
      const stops = [0, 1];

      const validated = result.current.validateGradientData(colors, stops);

      expect(validated).toEqual({ colors: [], stops: [] });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined gradient settings gracefully', () => {
      const layerWithoutSettings = { ...mockGradientLayer };
      delete layerWithoutSettings.gradient;
      mockGradientTargets.extractFromTarget.mockReturnValueOnce(undefined);

      const { result } = renderHook(() => useGradientManagement());

      result.current.addGradientColor('gradient-layer', mockUpdateLayer, [
        layerWithoutSettings,
      ]);

      expect(mockUpdateLayer).not.toHaveBeenCalled();
    });

    it('handles null layer in executeGradientOperation', () => {
      const { result } = renderHook(() => useGradientManagement());

      result.current.addGradientColor(
        'missing-layer',
        mockUpdateLayer,
        mockLayers
      );

      expect(mockGradientTargets.extractFromTarget).not.toHaveBeenCalled();
      expect(mockUpdateLayer).not.toHaveBeenCalled();
    });

    it('maintains function stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useGradientManagement());

      const firstAddFunction = result.current.addGradientColor;
      const firstRemoveFunction = result.current.removeGradientColor;

      rerender();

      const secondAddFunction = result.current.addGradientColor;
      const secondRemoveFunction = result.current.removeGradientColor;

      expect(firstAddFunction).toBe(secondAddFunction);
      expect(firstRemoveFunction).toBe(secondRemoveFunction);
    });
  });

  describe('All Gradient Targets Coverage', () => {
    const targets: GradientTarget[] = [
      'layer',
      'custom',
      'radial',
      'fill',
      'stroke',
    ];

    targets.forEach(target => {
      it(`handles ${target} gradient target correctly`, () => {
        const { result } = renderHook(() => useGradientManagement());
        const layerId =
          target === 'layer'
            ? 'gradient-layer'
            : target === 'custom' || target === 'radial'
              ? 'equalizer-layer'
              : 'circle-layer';
        const isEqualizer = target === 'custom' || target === 'radial';

        result.current.addGradientColor(
          layerId,
          mockUpdateLayer,
          mockLayers,
          isEqualizer,
          target
        );

        const expectedTarget = isEqualizer ? 'custom' : target;
        expect(mockGradientTargets.extractFromTarget).toHaveBeenCalledWith(
          expect.any(Object),
          expectedTarget
        );
      });
    });
  });
});
