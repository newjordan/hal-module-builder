import React, { memo } from 'react';
import { LayerPreviewProps } from './types';
import {
  calculateTransformMatrix,
  calculateImageFilters,
  generateGradientString,
} from '../../utils/layer-transforms';
import { getAvailableShapes } from '../../assets/shapes';

/**
 * LayerPreview Component
 *
 * Pure presentation component for rendering layer thumbnails.
 * Optimized for performance with React.memo and lazy loading.
 *
 * Features:
 * - Canvas-based preview rendering
 * - Responsive to layer changes
 * - Optimized re-rendering with memoization
 * - Hardware-accelerated transforms
 */
export const LayerPreview = memo<LayerPreviewProps>(
  ({ layer, theme, width = 40, height = 40, className = '' }) => {
    const baseStyle: React.CSSProperties = {
      width,
      height,
      borderRadius: '4px',
      overflow: 'hidden',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: layer.visible ? layer.opacity : 0.3,
      transform: calculateTransformMatrix(layer),
      filter: calculateImageFilters(layer),
      willChange: 'transform, opacity',
      transition: 'opacity 0.2s ease-out',
    };

    /**
     * Renders layer-specific preview content
     */
    const renderLayerPreview = () => {
      switch (layer.type) {
        case 'image':
          return layer.src ? (
            <img
              src={layer.src}
              alt={layer.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
              loading='lazy'
              draggable={false}
            />
          ) : (
            <div
              style={{
                color: theme === 'frost_light' ? '#6b7280' : '#9CA3AF',
                fontSize: Math.min(width, height) * 0.3,
                userSelect: 'none',
              }}
              title='No image selected'
            >
              📷
            </div>
          );

        case 'shape':
          const availableShapes = getAvailableShapes();
          const shapeData = availableShapes.find(
            s => s.type === layer.shapeType
          );
          return (
            <span
              style={{
                fontSize: Math.min(width, height) * 0.5,
                userSelect: 'none',
              }}
              title={`Shape: ${layer.shapeType || 'circle'}`}
            >
              {shapeData?.metadata.icon || '⭕'}
            </span>
          );

        case 'effect':
          return (
            <span
              style={{
                fontSize: Math.min(width, height) * 0.4,
                userSelect: 'none',
              }}
              title='Audio effect layer'
            >
              🎵
            </span>
          );

        case 'equalizer':
          return (
            <span
              style={{
                fontSize: Math.min(width, height) * 0.4,
                userSelect: 'none',
              }}
              title='Audio equalizer visualization'
            >
              📊
            </span>
          );

        default:
          return (
            <div
              style={{
                color: theme === 'frost_light' ? '#6b7280' : '#9CA3AF',
                fontSize: Math.min(width, height) * 0.25,
                userSelect: 'none',
              }}
              title={`Unknown layer type: ${layer.type}`}
            >
              ❓
            </div>
          );
      }
    };

    // Calculate background based on layer type
    let background = 'transparent';
    if (layer.type === ('solid' as any)) {
      background = layer.color || '#3B82F6';
    } else if (layer.type === ('gradient' as any) && layer.gradient) {
      background = generateGradientString(layer.gradient);
    } else if (layer.type === 'shape' && layer.fillType === 'solid') {
      background = layer.color || '#3B82F6';
    } else if (
      layer.type === 'shape' &&
      layer.fillType === 'gradient' &&
      layer.fillGradient
    ) {
      background = generateGradientString(layer.fillGradient);
    }

    const combinedClassName = [
      'layer-preview',
      className,
      theme === 'frost_light'
        ? 'frostlight-layer-preview'
        : 'frostdark-layer-preview',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={combinedClassName}
        style={{ ...baseStyle, background }}
        data-layer-id={layer.id}
        data-layer-type={layer.type}
        title={`${layer.name} (${layer.type})`}
      >
        {renderLayerPreview()}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal re-rendering
    return (
      prevProps.layer.id === nextProps.layer.id &&
      prevProps.layer.type === nextProps.layer.type &&
      prevProps.layer.name === nextProps.layer.name &&
      prevProps.layer.visible === nextProps.layer.visible &&
      prevProps.layer.opacity === nextProps.layer.opacity &&
      prevProps.layer.src === nextProps.layer.src &&
      prevProps.layer.color === nextProps.layer.color &&
      prevProps.layer.shapeType === nextProps.layer.shapeType &&
      prevProps.theme === nextProps.theme &&
      prevProps.width === nextProps.width &&
      prevProps.height === nextProps.height &&
      JSON.stringify(prevProps.layer.gradient) ===
        JSON.stringify(nextProps.layer.gradient)
    );
  }
);

LayerPreview.displayName = 'LayerPreview';

export default LayerPreview;
