import { jsx as _jsx } from 'react/jsx-runtime';
/**
 * AnimationEngine Component - High-performance animation rendering and timeline management
 * Optimized for 60fps with viewport culling and rendering batching
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getRenderService } from '../../services/RenderService';
import type { Layer, PerformanceMetrics } from '../../types';
import { EqualizerEngine } from '../EqualizerEngine/EqualizerEngine';
import { LayerRenderer } from './LayerRenderer';
import { usePerformanceMonitor } from './PerformanceMonitor';

export interface AnimationEngineProps {
  layers: Layer[];
  audioData?: Float32Array;
  isActive: boolean;
  size?: number;
  onClick?: () => void;
  className?: string;
  enablePerformanceMonitoring?: boolean;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  enableViewportCulling?: boolean;
  viewportPadding?: number;
  maxVisibleLayers?: number;
}

export const AnimationEngine = React.memo(
  ({
    layers,
    audioData,
    isActive,
    size = 400,
    onClick,
    className = '',
    enablePerformanceMonitoring = false,
    onPerformanceUpdate,
    enableViewportCulling = true,
    viewportPadding = 100,
    maxVisibleLayers = 50,
  }: AnimationEngineProps) => {
    const [animationRotation, setAnimationRotation] = useState(0);
    const renderService = getRenderService();
    const animationFrameRef = useRef<number>();
    const lastFrameTime = useRef<number>(performance.now());
    // Viewport culling - only render layers visible in viewport
    const visibleLayers = useMemo(() => {
      if (!enableViewportCulling) {
        return layers.slice(0, maxVisibleLayers);
      }

      const viewport = {
        left: -viewportPadding,
        top: -viewportPadding,
        right: size + viewportPadding,
        bottom: size + viewportPadding,
      };

      return layers
        .filter(layer => {
          if (!layer.visible) return false;

          const layerBounds = {
            left: layer.offsetX - (size * layer.scale) / 2,
            top: layer.offsetY - (size * layer.scale) / 2,
            right: layer.offsetX + (size * layer.scale) / 2,
            bottom: layer.offsetY + (size * layer.scale) / 2,
          };

          return !(
            layerBounds.right < viewport.left ||
            layerBounds.left > viewport.right ||
            layerBounds.bottom < viewport.top ||
            layerBounds.top > viewport.bottom
          );
        })
        .slice(0, maxVisibleLayers);
    }, [
      layers,
      enableViewportCulling,
      size,
      viewportPadding,
      maxVisibleLayers,
    ]);

    // Use performance monitor hook
    usePerformanceMonitor({
      isEnabled: enablePerformanceMonitoring,
      isActive,
      ...(onPerformanceUpdate && { onPerformanceUpdate }),
    });

    // Optimized animation loop with frame rate limiting
    useEffect(() => {
      if (isActive) {
        const animate = (currentTime: number) => {
          const deltaTime = currentTime - lastFrameTime.current;

          if (deltaTime >= 16.67) {
            setAnimationRotation(prev => prev + 0.1 * (deltaTime / 16.67));
            lastFrameTime.current = currentTime;
          }

          animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationRotation(0);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isActive]);
    // Batched layer rendering with memoization
    const renderLayers = useCallback(() => {
      return visibleLayers.map((layer: Layer) => {
        if (layer.type === 'equalizer' && layer.equalizerSettings) {
          const baseStyle = {
            position: 'absolute' as const,
            left: '50%',
            top: '50%',
            width: size,
            height: size,
            transform: renderService.generateTransform(layer),
            opacity: layer.opacity,
            mixBlendMode: layer.blendMode as any,
            pointerEvents: 'none' as const,
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden' as const,
          };
          return _jsx(
            EqualizerEngine,
            {
              equalizerSettings: layer.equalizerSettings,
              audioData: audioData ? Array.from(audioData) : undefined,
              isActive: isActive,
              size: size,
              theme: 'frost_dark',
              style: baseStyle,
              className: 'animation-eq-layer',
            },
            layer.id
          );
        }
        return _jsx(
          LayerRenderer,
          {
            layer: layer,
            size: size,
            animationRotation: animationRotation,
            isActive: isActive,
            renderService: renderService,
          },
          layer.id
        );
      });
    }, [
      visibleLayers,
      isActive,
      animationRotation,
      audioData,
      size,
      renderService,
    ]);
    const containerStyle = useMemo(
      () => ({
        width: size,
        height: size,
        transform: 'translateZ(0)',
        willChange: 'transform',
      }),
      [size]
    );

    return _jsx('div', {
      className: `animation-engine frost-relative frost-inline-block ${className}`,
      style: containerStyle,
      onClick: onClick,
      'data-layer-count': layers.length,
      'data-visible-layers': visibleLayers.length,
      children: renderLayers(),
    });
  },
  (prevProps, nextProps) => {
    const layersEqual =
      prevProps.layers.length === nextProps.layers.length &&
      prevProps.layers.every((layer, index) => {
        const nextLayer = nextProps.layers[index];
        return (
          nextLayer &&
          layer.id === nextLayer.id &&
          layer.visible === nextLayer.visible &&
          layer.opacity === nextLayer.opacity &&
          layer.offsetX === nextLayer.offsetX &&
          layer.offsetY === nextLayer.offsetY &&
          layer.scale === nextLayer.scale &&
          layer.rotation === nextLayer.rotation
        );
      });

    return (
      layersEqual &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.size === nextProps.size &&
      prevProps.enableViewportCulling === nextProps.enableViewportCulling &&
      prevProps.maxVisibleLayers === nextProps.maxVisibleLayers
    );
  }
);

AnimationEngine.displayName = 'AnimationEngine';
export default AnimationEngine;
