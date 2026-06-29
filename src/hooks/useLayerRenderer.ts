import { useCallback } from 'react';
import { Layer } from '../types/layer-types';

interface UseLayerRendererProps {
  layer: Layer;
  theme: string;
}

interface UseLayerRendererReturn {
  renderPreview: () => React.ReactElement;
  getPreviewStyle: () => React.CSSProperties;
  getShapeIcon: () => string;
  generateGradientString: () => string;
}

/**
 * Hook for managing layer canvas rendering and visual state updates
 * Extracts canvas rendering logic, render optimization, and visual state management
 * from the LayerItem monolith (Lines 36-188: LayerPreview Component)
 *
 * @param props - Renderer configuration
 * @returns Rendering functions and style generators
 */
export const useLayerRenderer = ({
  layer,
  theme,
}: UseLayerRendererProps): UseLayerRendererReturn => {
  const previewSize = 40;

  // TODO: Extract getPreviewStyle logic from LayerItem lines 38-55
  const getPreviewStyle = useCallback((): React.CSSProperties => {
    return {
      width: previewSize,
      height: previewSize,
      borderRadius: '4px',
      overflow: 'hidden',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: layer.visible ? layer.opacity : 0.3,
      transform: `scale(${Math.min(layer.scale, 2)}) rotate(${layer.rotation}deg)`,
      filter: layer.visible ? 'none' : 'grayscale(1)',
    };
  }, [layer.visible, layer.opacity, layer.scale, layer.rotation]);

  // TODO: Extract generateGradientString logic from LayerItem lines 97-125
  const generateGradientString = useCallback((): string => {
    const gradient =
      layer.type === ('gradient' as any) ||
      (layer.type === 'shape' && layer.fillType === 'gradient')
        ? layer.gradient
        : null;

    if (!gradient) return 'transparent';

    const colors =
      Array.isArray(gradient.colors) && gradient.colors.length > 0
        ? gradient.colors
        : ['transparent'];
    const colorStops = colors.join(', ');

    if (gradient.type === 'radial') {
      const centerX = gradient.centerX ?? 50;
      const centerY = gradient.centerY ?? 50;
      return `radial-gradient(circle at ${centerX}% ${centerY}%, ${colorStops})`;
    }

    if (gradient.type === 'conic') {
      const angle = gradient.angle ?? 0;
      return `conic-gradient(from ${angle}deg, ${colorStops})`;
    }

    const angle = gradient.angle ?? 0;
    return `linear-gradient(${angle}deg, ${colorStops})`;
  }, [layer]);

  // TODO: Extract getShapeIcon logic from LayerItem lines 155-159
  const getShapeIcon = useCallback((): string => {
    // Placeholder - will be implemented during extraction
    switch (layer.shapeType || 'circle') {
      case 'circle':
        return '⭕';
      case 'rectangle':
        return '⬛';
      case 'triangle':
        return '🔺';
      case 'polygon':
        return '⬢';
      case 'star':
        return '⭐';
      default:
        return '⭕';
    }
  }, [layer.shapeType]);

  // TODO: Extract renderPreview logic from LayerItem lines 36-188
  const renderPreview = useCallback((): React.ReactElement => {
    // Placeholder - will be implemented during extraction
    // This will contain the full preview rendering logic
    return null as any;
  }, [layer, theme, getPreviewStyle, generateGradientString, getShapeIcon]);

  return {
    renderPreview,
    getPreviewStyle,
    getShapeIcon,
    generateGradientString,
  };
};
