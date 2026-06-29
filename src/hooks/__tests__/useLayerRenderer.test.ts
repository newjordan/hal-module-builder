import { renderHook } from '@testing-library/react';
import { useLayerRenderer } from '../useLayerRenderer';
import { Layer } from '../../types/layer-types';

describe('useLayerRenderer', () => {
  const mockSolidLayer: Layer = {
    id: 'test-layer-1',
    name: 'Test Solid Layer',
    type: 'solid',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    color: '#ffffff',
  };

  const mockGradientLayer: Layer = {
    id: 'test-layer-2',
    name: 'Test Gradient Layer',
    type: 'gradient',
    visible: true,
    opacity: 0.8,
    blendMode: 'multiply',
    scale: 1.5,
    rotation: 45,
    offsetX: 10,
    offsetY: -5,
    gradient: {
      type: 'linear',
      angle: 90,
      colors: ['#ff0000', '#0000ff'],
      stops: [0, 1],
    },
  };

  const mockShapeLayer: Layer = {
    id: 'test-layer-3',
    name: 'Test Shape Layer',
    type: 'shape',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    shapeType: 'circle',
    color: '#00ff00',
  };

  const defaultProps = {
    theme: 'frost_light',
  };

  describe('Hook initialization', () => {
    it('should initialize with all required renderer functions', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: mockSolidLayer,
          ...defaultProps,
        })
      );

      expect(result.current.renderPreview).toBeDefined();
      expect(result.current.getPreviewStyle).toBeDefined();
      expect(result.current.getShapeIcon).toBeDefined();
      expect(result.current.generateGradientString).toBeDefined();
    });
  });

  describe('getPreviewStyle', () => {
    it('should return correct style for visible layer', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: mockSolidLayer,
          ...defaultProps,
        })
      );

      const style = result.current.getPreviewStyle();

      expect(style.width).toBe(40);
      expect(style.height).toBe(40);
      expect(style.opacity).toBe(1);
      expect(style.transform).toBe('scale(1) rotate(0deg)');
      expect(style.filter).toBe('none');
    });

    it('should return correct style for invisible layer', () => {
      const invisibleLayer = { ...mockSolidLayer, visible: false };
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: invisibleLayer,
          ...defaultProps,
        })
      );

      const style = result.current.getPreviewStyle();

      expect(style.opacity).toBe(0.3);
      expect(style.filter).toBe('grayscale(1)');
    });

    it('should handle layer transformations correctly', () => {
      const transformedLayer = {
        ...mockSolidLayer,
        scale: 1.5,
        rotation: 90,
        opacity: 0.7,
      };

      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: transformedLayer,
          ...defaultProps,
        })
      );

      const style = result.current.getPreviewStyle();

      expect(style.opacity).toBe(0.7);
      expect(style.transform).toBe('scale(1.5) rotate(90deg)');
    });

    it('should cap scale transformation at 2', () => {
      const largeScaleLayer = {
        ...mockSolidLayer,
        scale: 5,
      };

      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: largeScaleLayer,
          ...defaultProps,
        })
      );

      const style = result.current.getPreviewStyle();

      expect(style.transform).toBe('scale(2) rotate(0deg)');
    });
  });

  describe('generateGradientString', () => {
    it('should generate correct gradient string for gradient layer', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: mockGradientLayer,
          ...defaultProps,
        })
      );

      const gradientString = result.current.generateGradientString();

      expect(gradientString).toContain('linear-gradient(90deg');
      expect(gradientString).toContain('#ff0000');
      expect(gradientString).toContain('#0000ff');
    });

    it('should return transparent for non-gradient layers', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: mockSolidLayer,
          ...defaultProps,
        })
      );

      const gradientString = result.current.generateGradientString();

      expect(gradientString).toBe('transparent');
    });

    it('should handle gradient layer without colors', () => {
      const gradientLayerNoColors = {
        ...mockGradientLayer,
        gradient: {
          type: 'linear' as const,
          angle: 45,
          colors: undefined,
          stops: [],
        },
      };

      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: gradientLayerNoColors,
          ...defaultProps,
        })
      );

      const gradientString = result.current.generateGradientString();

      expect(gradientString).toContain('linear-gradient(45deg');
      expect(gradientString).toContain('transparent');
    });
  });

  describe('getShapeIcon', () => {
    it('should return correct icon for circle shape', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: { ...mockShapeLayer, shapeType: 'circle' },
          ...defaultProps,
        })
      );

      const icon = result.current.getShapeIcon();
      expect(icon).toBe('⭕');
    });

    it('should return correct icon for rectangle shape', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: { ...mockShapeLayer, shapeType: 'rectangle' },
          ...defaultProps,
        })
      );

      const icon = result.current.getShapeIcon();
      expect(icon).toBe('⬛');
    });

    it('should return correct icon for triangle shape', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: { ...mockShapeLayer, shapeType: 'triangle' },
          ...defaultProps,
        })
      );

      const icon = result.current.getShapeIcon();
      expect(icon).toBe('🔺');
    });

    it('should return correct icon for polygon shape', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: { ...mockShapeLayer, shapeType: 'polygon' },
          ...defaultProps,
        })
      );

      const icon = result.current.getShapeIcon();
      expect(icon).toBe('⬢');
    });

    it('should return correct icon for star shape', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: { ...mockShapeLayer, shapeType: 'star' },
          ...defaultProps,
        })
      );

      const icon = result.current.getShapeIcon();
      expect(icon).toBe('⭐');
    });

    it('should default to circle for unknown shape types', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: { ...mockShapeLayer, shapeType: 'unknown' as any },
          ...defaultProps,
        })
      );

      const icon = result.current.getShapeIcon();
      expect(icon).toBe('⭕');
    });

    it('should default to circle when no shape type is specified', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: { ...mockShapeLayer, shapeType: undefined },
          ...defaultProps,
        })
      );

      const icon = result.current.getShapeIcon();
      expect(icon).toBe('⭕');
    });
  });

  describe('Performance requirements', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() =>
        useLayerRenderer({
          layer: mockSolidLayer,
          ...defaultProps,
        })
      );

      const initialFunctions = {
        getPreviewStyle: result.current.getPreviewStyle,
        getShapeIcon: result.current.getShapeIcon,
        generateGradientString: result.current.generateGradientString,
        renderPreview: result.current.renderPreview,
      };

      rerender();

      expect(result.current.getPreviewStyle).toBe(
        initialFunctions.getPreviewStyle
      );
      expect(result.current.getShapeIcon).toBe(initialFunctions.getShapeIcon);
      expect(result.current.generateGradientString).toBe(
        initialFunctions.generateGradientString
      );
      expect(result.current.renderPreview).toBe(initialFunctions.renderPreview);
    });
  });

  describe('Theme integration', () => {
    it('should work with frost_light theme', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: mockSolidLayer,
          theme: 'frost_light',
        })
      );

      expect(result.current).toBeDefined();
    });

    it('should work with frost_dark theme', () => {
      const { result } = renderHook(() =>
        useLayerRenderer({
          layer: mockSolidLayer,
          theme: 'frost_dark',
        })
      );

      expect(result.current).toBeDefined();
    });
  });
});
