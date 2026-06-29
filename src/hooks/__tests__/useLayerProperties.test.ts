import { renderHook } from '@testing-library/react';
import { useLayerProperties } from '../useLayerProperties';
import { Layer } from '../../types/layer-types';

describe('useLayerProperties', () => {
  const mockLayer: Layer = {
    id: 'test-layer-1',
    name: 'Test Layer',
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

  const mockUpdateLayer = jest.fn();
  const mockOnShapeTypeChange = jest.fn();

  const defaultProps = {
    layer: mockLayer,
    theme: 'frost_light',
    updateLayer: mockUpdateLayer,
    onShapeTypeChange: mockOnShapeTypeChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      expect(result.current).toBeDefined();
      expect(typeof result.current.handleSliderChange).toBe('function');
      expect(typeof result.current.handleColorChange).toBe('function');
      expect(typeof result.current.renderPropertyPanel).toBe('function');
    });
  });

  describe('handleSliderChange', () => {
    it('should call updateLayer with correct parameters for numeric properties', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      result.current.handleSliderChange('opacity', 0.5);

      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        opacity: 0.5,
      });
    });

    it('should call updateLayer with correct parameters for scale property', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      result.current.handleSliderChange('scale', 1.5);

      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        scale: 1.5,
      });
    });

    it('should call updateLayer with correct parameters for rotation property', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      result.current.handleSliderChange('rotation', 45);

      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        rotation: 45,
      });
    });
  });

  describe('handleColorChange', () => {
    it('should call updateLayer with correct parameters for color property', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      result.current.handleColorChange('color', '#ff0000');

      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        color: '#ff0000',
      });
    });
  });

  describe('Property validation', () => {
    it('should validate numeric properties within bounds', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      // Test opacity bounds (0-1)
      result.current.handleSliderChange('opacity', 0.5);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        opacity: 0.5,
      });

      result.current.handleSliderChange('opacity', 0);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        opacity: 0,
      });

      result.current.handleSliderChange('opacity', 1);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        opacity: 1,
      });
    });

    it('should handle scale property correctly', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      // Test scale bounds (0.1-3)
      result.current.handleSliderChange('scale', 0.1);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        scale: 0.1,
      });

      result.current.handleSliderChange('scale', 3);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        scale: 3,
      });
    });

    it('should handle rotation property correctly', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      // Test rotation bounds (0-360)
      result.current.handleSliderChange('rotation', 0);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        rotation: 0,
      });

      result.current.handleSliderChange('rotation', 360);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        rotation: 360,
      });
    });

    it('should handle offset properties correctly', () => {
      const { result } = renderHook(() => useLayerProperties(defaultProps));

      // Test offset bounds (-500 to 500)
      result.current.handleSliderChange('offsetX', -250);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        offsetX: -250,
      });

      result.current.handleSliderChange('offsetY', 250);
      expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer-1', {
        offsetY: 250,
      });
    });
  });

  describe('Performance requirements', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() =>
        useLayerProperties(defaultProps)
      );

      const initialHandleSliderChange = result.current.handleSliderChange;
      const initialHandleColorChange = result.current.handleColorChange;

      rerender();

      expect(result.current.handleSliderChange).toBe(initialHandleSliderChange);
      expect(result.current.handleColorChange).toBe(initialHandleColorChange);
    });
  });

  describe('Theme integration', () => {
    it('should handle frost_light theme', () => {
      const { result } = renderHook(() =>
        useLayerProperties({
          ...defaultProps,
          theme: 'frost_light',
        })
      );

      expect(result.current).toBeDefined();
    });

    it('should handle frost_dark theme', () => {
      const { result } = renderHook(() =>
        useLayerProperties({
          ...defaultProps,
          theme: 'frost_dark',
        })
      );

      expect(result.current).toBeDefined();
    });
  });
});
