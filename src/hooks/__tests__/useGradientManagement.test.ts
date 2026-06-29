import { renderHook } from '@testing-library/react';
import useGradientManagement, {
  GradientPreset,
} from '../useGradientManagement';
import { Layer } from '../../types/layer-types';

// Mock the layer validation utilities
jest.mock('../../utils/layer-validation', () => ({
  validateGradientColors: jest.fn(colors => colors),
  validateGradientStops: jest.fn(stops => stops),
  validateAngle: jest.fn(angle => angle % 360),
  validatePositionPercentage: jest.fn(pos => Math.max(0, Math.min(1, pos))),
}));

// Mock the layer transforms utility
jest.mock('../../utils/layer-transforms', () => ({
  generateGradientString: jest.fn(gradient =>
    gradient.type === 'linear'
      ? `linear-gradient(${gradient.angle || 0}deg, ${gradient.colors.join(', ')})`
      : gradient.type === 'radial'
        ? `radial-gradient(circle at ${gradient.centerX || 50}% ${gradient.centerY || 50}%, ${gradient.colors.join(', ')})`
        : `conic-gradient(from ${gradient.angle || 0}deg, ${gradient.colors.join(', ')})`
  ),
}));

describe('useGradientManagement', () => {
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
    type: 'effect',
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

  let updatedLayer: Layer | null = null;
  const mockUpdateLayer = jest.fn(
    (layerId: string, updates: Partial<Layer>) => {
      const layer = mockLayers.find(l => l.id === layerId);
      if (layer) {
        updatedLayer = { ...layer, ...updates };
      }
    }
  );

  beforeEach(() => {
    updatedLayer = null;
    mockUpdateLayer.mockClear();
  });

  it('initializes gradient management functions', () => {
    const { result } = renderHook(() => useGradientManagement());

    expect(typeof result.current.addGradientColor).toBe('function');
    expect(typeof result.current.removeGradientColor).toBe('function');
    expect(typeof result.current.updateGradientColor).toBe('function');
    expect(typeof result.current.updateGradientStop).toBe('function');
  });

  it('adds gradient colors to layer gradient', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.addGradientColor(
      'gradient-layer',
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('gradient-layer', {
      gradient: {
        ...mockGradientLayer.gradient,
        colors: ['#ff0000', '#0000ff', '#ffffff'],
        stops: [0, 0.5, 1],
      },
    });
  });

  it('adds gradient colors to equalizer custom gradient', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.addGradientColor(
      'equalizer-layer',
      mockUpdateLayer,
      mockLayers,
      true, // isEqualizer
      'custom' // gradientTarget (should be overridden to 'custom')
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('equalizer-layer', {
      equalizerSettings: {
        ...mockEqualizerLayer.equalizerSettings,
        customGradient: {
          colors: ['#ff0000', '#00ff00', '#ffffff'],
          stops: [0, 0.5, 1],
        },
      },
    });
  });

  it('removes gradient colors from layer gradient', () => {
    const { result } = renderHook(() => useGradientManagement());

    // First add a color to have more than 2 colors
    const layerWithMoreColors = {
      ...mockGradientLayer,
      gradient: {
        ...mockGradientLayer.gradient!,
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        stops: [0, 0.5, 1],
      },
    };
    const layers = [layerWithMoreColors, mockEqualizerLayer];

    result.current.removeGradientColor(
      'gradient-layer',
      1, // Remove middle color
      mockUpdateLayer,
      layers,
      false,
      'layer'
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('gradient-layer', {
      gradient: {
        ...layerWithMoreColors.gradient,
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
      },
    });
  });

  it('prevents removing colors when only 2 colors remain', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.removeGradientColor(
      'gradient-layer',
      0,
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    // Should not call updateLayer because we only have 2 colors
    expect(mockUpdateLayer).not.toHaveBeenCalled();
  });

  it('updates gradient colors correctly', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.updateGradientColor(
      'gradient-layer',
      0,
      '#00ff00',
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('gradient-layer', {
      gradient: {
        ...mockGradientLayer.gradient,
        colors: ['#00ff00', '#0000ff'],
      },
    });
  });

  it('updates gradient stops correctly', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.updateGradientStop(
      'gradient-layer',
      1,
      0.8,
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('gradient-layer', {
      gradient: {
        ...mockGradientLayer.gradient,
        stops: [0, 0.8],
      },
    });
  });

  it('clamps gradient stop values between 0 and 1', () => {
    const { result } = renderHook(() => useGradientManagement());

    // Test value above 1
    result.current.updateGradientStop(
      'gradient-layer',
      1,
      1.5,
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('gradient-layer', {
      gradient: {
        ...mockGradientLayer.gradient,
        stops: [0, 1], // Should be clamped to 1
      },
    });

    mockUpdateLayer.mockClear();

    // Test value below 0
    result.current.updateGradientStop(
      'gradient-layer',
      0,
      -0.5,
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('gradient-layer', {
      gradient: {
        ...mockGradientLayer.gradient,
        stops: [0, 1], // Should be clamped to 0
      },
    });
  });

  it('handles radial gradient settings for equalizer', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.addGradientColor(
      'equalizer-layer',
      mockUpdateLayer,
      mockLayers,
      false,
      'radial'
    );

    expect(mockUpdateLayer).toHaveBeenCalledWith('equalizer-layer', {
      equalizerSettings: {
        ...mockEqualizerLayer.equalizerSettings,
        radialGradientSettings: {
          ...mockEqualizerLayer.equalizerSettings!.radialGradientSettings,
          colors: ['#ffffff', '#ff0000', '#ffffff'],
          stops: [0, 0.5, 1],
        },
      },
    });
  });

  it('handles out of bounds color index gracefully', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.updateGradientColor(
      'gradient-layer',
      5, // Out of bounds index
      '#00ff00',
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    // Should not call updateLayer for out of bounds index
    expect(mockUpdateLayer).not.toHaveBeenCalled();
  });

  it('handles missing layer gracefully', () => {
    const { result } = renderHook(() => useGradientManagement());

    result.current.addGradientColor(
      'non-existent-layer',
      mockUpdateLayer,
      mockLayers,
      false,
      'layer'
    );

    // Should not call updateLayer for non-existent layer
    expect(mockUpdateLayer).not.toHaveBeenCalled();
  });
});
