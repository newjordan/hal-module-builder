import { ShapeRenderer } from '../ShapeRenderer';
import { jsx as _jsx } from 'react/jsx-runtime';
import { RadialTextRenderer } from '../RadialText/RadialTextRenderer';
import { memo, useMemo } from 'react';
import type { Layer } from '../../types';

export interface LayerRendererProps {
  layer: Layer;
  size: number;
  animationRotation: number;
  isActive: boolean;
  renderService: any; // TODO: Type the render service properly
}

export const LayerRenderer = memo(
  ({
    layer,
    size,
    animationRotation,
    isActive,
    renderService,
  }: LayerRendererProps) => {
    if (!layer.visible) return null;
    const canRender = renderService.canRenderLayer(layer);
    if (!canRender.canRender) return null;
    let finalRotation = layer.rotation;
    const transform = renderService.generateTransform({
      ...layer,
      rotation: finalRotation,
    });
    const baseStyle = useMemo(
      () => ({
        position: 'absolute' as const,
        left: '50%',
        top: '50%',
        width: size,
        height: size,
        transform,
        opacity: layer.opacity,
        mixBlendMode: layer.blendMode as any,
        pointerEvents: 'none' as const,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden' as const,
      }),
      [size, transform, layer.opacity, layer.blendMode]
    );
    switch (layer.type) {
      case 'image': {
        const imageFilter = renderService.generateImageFilter(layer);
        return layer.src
          ? _jsx(
              'img',
              {
                src: layer.src,
                alt: layer.name,
                style: {
                  ...baseStyle,
                  filter: imageFilter,
                },
              },
              layer.id
            )
          : null;
      }
      case 'shape': {
        const shapeLayer = {
          ...layer,
          shapeType: layer.shapeType || (layer as any).shapeType || 'circle',
          shapeSpecific:
            layer.shapeSpecific ||
            (layer as any).shapeSpecific ||
            (layer as any).circleSettings ||
            undefined,
          type: 'shape' as const,
        };

        return _jsx(
          'div',
          {
            style: baseStyle,
            children: _jsx(ShapeRenderer, {
              layer: shapeLayer as any,
              size,
              audioData: undefined,
              isActive,
              animationFrame: animationRotation,
            }),
          },
          layer.id
        );
      }
      case 'radialText': {
        const radialTextLayer = layer as any; // Type assertion for radial text layer

        if (!radialTextLayer.radialTextConfig) return null;

        const layerTheme =
          radialTextLayer.radialTextConfig.theme ||
          radialTextLayer.theme ||
          'frost_dark';

        return _jsx(
          RadialTextRenderer,
          {
            theme: layerTheme,
            config: radialTextLayer.radialTextConfig,
            effects: radialTextLayer.radialTextEffects,
            appearance: layer,
            animation: radialTextLayer.radialTextAnimation,
            audioData: renderService.getAudioData
              ? renderService.getAudioData()
              : undefined,
            isActive,
            size,
            className: 'frost-absolute frost-inset-0',
            style: baseStyle,
          },
          layer.id
        );
      }
      default:
        return null;
    }
  },
  (prevProps, nextProps) => {
    return (
      prevProps.layer.id === nextProps.layer.id &&
      prevProps.layer.visible === nextProps.layer.visible &&
      prevProps.layer.opacity === nextProps.layer.opacity &&
      prevProps.layer.offsetX === nextProps.layer.offsetX &&
      prevProps.layer.offsetY === nextProps.layer.offsetY &&
      prevProps.layer.scale === nextProps.layer.scale &&
      prevProps.layer.rotation === nextProps.layer.rotation &&
      prevProps.layer.blendMode === nextProps.layer.blendMode &&
      prevProps.layer.shapeType === nextProps.layer.shapeType &&
      prevProps.layer.shapeSpecific === nextProps.layer.shapeSpecific &&
      prevProps.size === nextProps.size &&
      prevProps.animationRotation === nextProps.animationRotation &&
      prevProps.isActive === nextProps.isActive
    );
  }
);

LayerRenderer.displayName = 'LayerRenderer';
export default LayerRenderer;
