/**
 * EqualizerEngine - Main component integrating the modular equalizer system
 * Replaces the legacy inline equalizer code in HalModuleBuilder
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  EqualizerUtils,
  initializeIntegratedEqualizer,
  VisualizationConfig,
  VisualizationLibrary,
} from '../../assets/equalizer';
import { useRadialTransform } from '../../hooks/useRadialTransform';

export interface EqualizerEngineProps {
  // Legacy compatibility props
  equalizerSettings?: any;
  audioData?: number[];
  isActive?: boolean;
  size: number;
  theme: 'frost_light' | 'frost_dark';

  // New modular props
  visualizationType?: string;
  config?: VisualizationConfig;

  // Styling
  className?: string;
  style?: React.CSSProperties;

  // Event handlers
  onError?: (error: Error) => void;
  onVisualizationChange?: (type: string) => void;
}

const DEFAULT_POSITION_PERCENT = 50;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// Disable per-frame logging to avoid console spam; toggle for deep debugging only
const DEBUG_PER_FRAME = false;

const computeOffsetFromPercent = (percent: number, size: number): number =>
  ((percent - DEFAULT_POSITION_PERCENT) / 100) * size;

const buildConfigFromLayerSettings = (
  settings: unknown,
  size: number
): VisualizationConfig => {
  const source =
    settings && typeof settings === 'object'
      ? (settings as Record<string, unknown>)
      : {};

  const normalized = EqualizerUtils.normalizeConfig(
    source as Partial<VisualizationConfig>
  );
  const safeSize = isFiniteNumber(size) ? size : 0;

  if (isFiniteNumber(source.positionX) || isFiniteNumber(source.positionY)) {
    const percentX = isFiniteNumber(source.positionX)
      ? (source.positionX as number)
      : DEFAULT_POSITION_PERCENT;
    const percentY = isFiniteNumber(source.positionY)
      ? (source.positionY as number)
      : DEFAULT_POSITION_PERCENT;

    normalized.offsetX = computeOffsetFromPercent(percentX, safeSize);
    normalized.offsetY = computeOffsetFromPercent(percentY, safeSize);
  } else {
    if (isFiniteNumber(source.offsetX)) {
      normalized.offsetX = source.offsetX as number;
    }
    if (isFiniteNumber(source.offsetY)) {
      normalized.offsetY = source.offsetY as number;
    }
  }

  return normalized;
};

export const EqualizerEngine: React.FC<EqualizerEngineProps> = ({
  equalizerSettings,
  audioData = [],
  isActive = true,
  size,
  theme: _theme,
  visualizationType,
  config,
  className,
  style,
  onError,
  onVisualizationChange,
}) => {
  // Generate demo/fallback data when no audio is available
  const generateDemoData = (): number[] => {
    const barCount = equalizerSettings?.barCount || 64;
    const demoData = [];
    const time = Date.now() / 1000;

    for (let i = 0; i < barCount; i++) {
      // Create animated sine wave pattern with some randomness
      const frequency = (i / barCount) * 4 + 1;
      const phase = time * 2 + i * 0.1;
      const base = Math.sin(phase * frequency) * 0.3 + 0.4;
      const noise = Math.random() * 0.2;
      demoData.push(Math.max(0, Math.min(1, base + noise)));
    }

    return demoData;
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const audioDataRef = useRef<number[]>([]);
  const [visualizationLib, setVisualizationLib] =
    useState<VisualizationLibrary | null>(null);
  const initRef = useRef(false);

  // Build normalized configuration for the visualization pipeline
  const equalizerConfig = useMemo(() => {
    if (config) {
      return EqualizerUtils.normalizeConfig(config);
    }

    if (equalizerSettings) {
      return buildConfigFromLayerSettings(equalizerSettings, size);
    }

    return EqualizerUtils.createDefaultConfig();
  }, [config, equalizerSettings, size]);

  // Determine visualization type
  const activeVisualizationType = useMemo(() => {
    if (visualizationType) return visualizationType;
    if (equalizerSettings?.barStyle) {
      return EqualizerUtils.getVisualizationTypeFromBarStyle(
        equalizerSettings.barStyle
      );
    }
    return 'block';
  }, [visualizationType, equalizerSettings?.barStyle]);

  // Create a type-safe config that avoids cross-visualization validator conflicts
  const typeSafeConfig = useMemo(() => {
    const cfg: any = { ...equalizerConfig };

    if (activeVisualizationType === 'bar') {
      const allowed = ['line', 'block', 'vertical'];
      if (!allowed.includes(cfg.style)) {
        cfg.style = cfg.style === 'line' ? 'line' : 'block';
      }
      if (!['radial', 'linear'].includes(cfg.layout)) {
        cfg.layout = 'radial';
      }
    } else {
      if ('style' in cfg) delete cfg.style;
    }

    // Preserve invert flags as provided by normalization; avoid re-syncing here to prevent stale overwrites

    // Back-compat: blockAlignment -> barAlignment
    if (cfg.blockAlignment && !cfg.barAlignment) {
      cfg.barAlignment = cfg.blockAlignment;
    }

    // Always coerce radialOrientation to a valid value so the hook stays in sync
    const allowedOrientation = ['follow-radius', 'follow-tangent', 'maintain'];
    if (!allowedOrientation.includes(cfg.radialOrientation)) {
      cfg.radialOrientation = 'follow-radius';
    }

    return cfg;
  }, [equalizerConfig, activeVisualizationType]);

  const radialOrientation = (typeSafeConfig as any).radialOrientation as
    | 'follow-radius'
    | 'follow-tangent'
    | 'maintain'
    | undefined;

  // Overscan to render unconstrained beyond the visible container (prevents clipping)
  const overscanFactor = 2; // 2x canvas size to allow drawing beyond container
  const canvasPixelSize = Math.round(size * overscanFactor);
  const drawCenter = { x: canvasPixelSize / 2, y: canvasPixelSize / 2 };

  // Connect useRadialTransform hook for optimized circular layouts
  const radialTransform = useRadialTransform({
    config: typeSafeConfig,
    center: drawCenter,
    orientationMode: radialOrientation || 'follow-radius',
  });

  // Initialize visualization library once
  useEffect(() => {
    if (!canvasRef.current || initRef.current) return;

    try {
      // Option A: Full integrated initialization (RECOMMENDED per guide)
      const library = initializeIntegratedEqualizer(canvasRef.current, {
        enableErrorRecovery: true,
        enableStatePreservation: true,
        enableMetrics: false,
        fallbackVisualizationType: 'block', // Use 'block' as fallback instead of 'bar'
        // skipRegistration handled automatically by singleton pattern
      });

      setVisualizationLib(library);
      initRef.current = true;
    } catch (error) {
      console.error('❌ Failed to initialize visualization library:', error);
      console.error(
        '❌ Error details:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      console.error(
        '❌ Stack trace:',
        error instanceof Error ? error.stack : 'No stack trace'
      );
      onError?.(error as Error);
    }
  }, [onError]);

  // Keep latest audio data without re-creating the RAF loop each update
  useEffect(() => {
    audioDataRef.current = Array.isArray(audioData) ? audioData : [];
  }, [audioData]);

  // Animation loop for continuous rendering
  useEffect(() => {
    if (!isActive || !visualizationLib) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      try {
        const currentData =
          audioDataRef.current && audioDataRef.current.length > 0
            ? audioDataRef.current
            : generateDemoData();
        renderVisualization(timestamp, currentData);
        animationFrameRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error('Animation error:', error);
        onError?.(error as Error);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Stop external audio data injection when component unmounts or becomes inactive
      if (visualizationLib) {
        visualizationLib.stopExternalAudioData();
      }
    };
  }, [isActive, activeVisualizationType, typeSafeConfig, visualizationLib]);

  const lastInvertRef = useRef<boolean | undefined>(undefined);

  const renderVisualization = (_timestamp: number, inputData: number[]) => {
    if (!visualizationLib || !inputData || inputData.length === 0) {
      return;
    }

    // Prepare audio data without symmetry; symmetry is applied to mapped bands in the renderer
    const preparedAudioData = Array.from(inputData);

    try {
      // 1. Inject audio data into the system
      visualizationLib.injectAudioData(preparedAudioData);

      // 2. Create enhanced config with radial transform functionality
      // Resolve invert once and enforce both flags consistently to avoid stale mirrors
      const resolvedInvert =
        typeof (typeSafeConfig as any).invert === 'boolean'
          ? Boolean((typeSafeConfig as any).invert)
          : typeof (typeSafeConfig as any).invertDirection === 'boolean'
            ? Boolean((typeSafeConfig as any).invertDirection)
            : false;

      const enhancedConfig = {
        ...typeSafeConfig,
        invert: resolvedInvert,
        invertDirection: resolvedInvert,
        // Add radial transform functions from hook for optimized calculations
        radialTransform: radialTransform,
        // Add center position for accurate transforms (account for overscan)
        centerX: drawCenter.x,
        centerY: drawCenter.y,
      } as any;

      // Log invert only when it changes to avoid console spam
      const currentInvert = resolvedInvert;
      if (lastInvertRef.current !== currentInvert) {
        console.debug('[EqualizerEngine] invert changed', {
          invert: currentInvert,
          invertDirection: enhancedConfig.invertDirection,
        });
        lastInvertRef.current = currentInvert;
      }

      // 3. Render with the active visualization type and enhanced config
      // Get actual canvas position for debugging
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const parentRect =
        canvasRef.current?.parentElement?.getBoundingClientRect();

      if (DEBUG_PER_FRAME) {
        console.debug('[EqualizerEngine] rendering', {
          type: activeVisualizationType,
          centerX: enhancedConfig.centerX,
          centerY: enhancedConfig.centerY,
          canvasSize: canvasPixelSize,
          viewportSize: size,
          invert: currentInvert,
          canvasRect: canvasRect
            ? {
                left: canvasRect.left,
                top: canvasRect.top,
                width: canvasRect.width,
                height: canvasRect.height,
              }
            : null,
          parentRect: parentRect
            ? {
                left: parentRect.left,
                top: parentRect.top,
                width: parentRect.width,
                height: parentRect.height,
              }
            : null,
          expectedCanvasCenter: {
            screenX: canvasRect
              ? canvasRect.left +
                enhancedConfig.centerX * (canvasRect.width / canvasPixelSize)
              : null,
            screenY: canvasRect
              ? canvasRect.top +
                enhancedConfig.centerY * (canvasRect.height / canvasPixelSize)
              : null,
          },
        });
      }
      const result = visualizationLib.renderVisualization(
        activeVisualizationType,
        enhancedConfig
      );

      if (DEBUG_PER_FRAME) {
        console.debug('[EqualizerEngine] render result', result);
      }

      // DEBUG: Draw crosshair at center for debugging (disabled)
      // To enable: change the condition below from `false` to `true`
      // if (canvasRef.current) {
      //   const debugCtx = canvasRef.current.getContext('2d');
      //   if (debugCtx) {
      //     debugCtx.save();
      //     debugCtx.strokeStyle = 'red';
      //     debugCtx.lineWidth = 2;
      //     debugCtx.beginPath();
      //     debugCtx.moveTo(enhancedConfig.centerX - 50, enhancedConfig.centerY);
      //     debugCtx.lineTo(enhancedConfig.centerX + 50, enhancedConfig.centerY);
      //     debugCtx.moveTo(enhancedConfig.centerX, enhancedConfig.centerY - 50);
      //     debugCtx.lineTo(enhancedConfig.centerX, enhancedConfig.centerY + 50);
      //     debugCtx.stroke();
      //     debugCtx.restore();
      //   }
      // }

      // Optional: draw radial path overlay for debugging when enabled
      if (
        (enhancedConfig as any).layout === 'radial' &&
        (enhancedConfig as any).showRadialPath &&
        canvasRef.current
      ) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.save();
          try {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            // dashed guide
            if (typeof ctx.setLineDash === 'function') {
              ctx.setLineDash([4, 3]);
            }
            const cx = enhancedConfig.centerX;
            const cy = enhancedConfig.centerY;
            const radius =
              (enhancedConfig as any).innerRadius ??
              Math.min(size, size) * 0.35;
            const startDeg = (enhancedConfig as any).startAngle ?? 0;
            const endDeg = (enhancedConfig as any).endAngle ?? 360;
            const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
            ctx.beginPath();
            if ((enhancedConfig as any).arcMode) {
              ctx.arc(cx, cy, radius, toRad(startDeg), toRad(endDeg));
            } else {
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            }
            ctx.stroke();
          } finally {
            ctx.restore();
          }
        }
      }

      // 4. Handle results
      if (!result.success) {
        // Graceful fallback when orchestration reports failure
        renderFallback(preparedAudioData);
      }
    } catch (_error) {
      // Avoid logging per-frame errors; fallback silently to keep UI responsive
      renderFallback(preparedAudioData);
    }
  };

  const renderFallback = (audioData: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas before rendering
    ctx.clearRect(0, 0, size, size);

    // Normalize audio data to 0-1 range
    const normalizedData = audioData.map(value =>
      Math.max(0, Math.min(1, value))
    );

    // Create colorful bars
    const barCount = Math.min(48, normalizedData.length);
    const barWidth = (size - 40) / barCount;

    normalizedData.slice(0, barCount).forEach((value, index) => {
      const barHeight = value * (size / 2);
      const x = 20 + index * barWidth;
      const y = size - 20 - barHeight;

      // Create rainbow colors
      const hue = (index / barCount) * 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  };

  // Handle visualization type changes
  useEffect(() => {
    onVisualizationChange?.(activeVisualizationType);
  }, [activeVisualizationType, onVisualizationChange]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: size,
    height: size,
    background: 'transparent',
    overflow: 'visible',
    pointerEvents: 'none',
    ...style,
  };

  const computedClassName = useMemo(() => {
    return ['equalizer-engine', className]
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0
      )
      .join(' ')
      .trim();
  }, [className]);

  // Apply legacy compatibility transformations (compose with incoming transform)
  const transformStyle = useMemo(() => {
    const transforms: string[] = [];

    if (typeSafeConfig.scale !== undefined && typeSafeConfig.scale !== 1) {
      transforms.push(`scale(${typeSafeConfig.scale})`);
    }

    if (
      typeSafeConfig.rotation !== undefined &&
      typeSafeConfig.rotation !== 0
    ) {
      transforms.push(`rotate(${typeSafeConfig.rotation}deg)`);
    }

    const offsetX = typeSafeConfig.offsetX ?? 0;
    const offsetY = typeSafeConfig.offsetY ?? 0;

    if (offsetX || offsetY) {
      transforms.push(`translate(${offsetX}px, ${offsetY}px)`);
    }

    return transforms.length > 0 ? transforms.join(' ') : undefined;
  }, [
    typeSafeConfig.scale,
    typeSafeConfig.rotation,
    typeSafeConfig.offsetX,
    typeSafeConfig.offsetY,
  ]);
  // Helper: convert hex color to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace('#', '');
    const bigint = parseInt(
      normalized.length === 3
        ? normalized
            .split('')
            .map(c => c + c)
            .join('')
        : normalized,
      16
    );
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  };

  // Compute CSS filters from appearance settings (drop shadow, outer glow)
  const cssFilter = React.useMemo(() => {
    const appearance =
      (config as any)?.appearance ||
      (equalizerSettings as any)?.appearance ||
      (typeSafeConfig as any)?.appearance;
    if (!appearance) return undefined;

    const parts: string[] = [];

    // Drop Shadow
    if (appearance.dropShadow?.enabled) {
      const angleRad = ((appearance.dropShadow.angle ?? 135) * Math.PI) / 180;
      const distance = appearance.dropShadow.distance ?? 0;
      const dx = Math.cos(angleRad) * distance;
      const dy = Math.sin(angleRad) * distance;
      const size = appearance.dropShadow.size ?? 10;
      const color = appearance.dropShadow.color || '#000000';
      const opacity = appearance.dropShadow.opacity ?? 0.5;
      parts.push(
        `drop-shadow(${dx.toFixed(1)}px ${dy.toFixed(1)}px ${size}px ${hexToRgba(color, opacity)})`
      );
    }

    // Outer Glow (approximate via drop-shadow with zero offset)
    if (appearance.outerGlow?.enabled) {
      const size = appearance.outerGlow.size ?? 20;
      const color = appearance.outerGlow.color || '#ffffff';
      const opacity = appearance.outerGlow.opacity ?? 0.5;
      parts.push(`drop-shadow(0 0 ${size}px ${hexToRgba(color, opacity)})`);
    }

    return parts.length > 0 ? parts.join(' ') : undefined;
  }, [config, equalizerSettings, typeSafeConfig]);

  // Merge centering transform with legacy transform
  const mergedTransform = useMemo(() => {
    const centerTransform = 'translate(-50%, -50%)';
    if (transformStyle) return `${centerTransform} ${transformStyle}`;
    return centerTransform;
  }, [transformStyle]);

  return (
    <div
      className={computedClassName || undefined}
      style={{
        ...baseStyle,
        transform: mergedTransform,
        opacity:
          equalizerSettings?.opacity ?? (typeSafeConfig as any).opacity ?? 1,
        mixBlendMode:
          (equalizerSettings?.blendMode as any) ??
          ((typeSafeConfig as any).blendMode as any) ??
          'normal',
        filter: cssFilter,
      }}
    >
      {/* Canvas rendering for visualization library */}
      <canvas
        ref={canvasRef}
        width={canvasPixelSize}
        height={canvasPixelSize}
        style={{
          position: 'absolute',
          left: -((canvasPixelSize - size) / 2),
          top: -((canvasPixelSize - size) / 2),
          width: canvasPixelSize,
          height: canvasPixelSize,
          background: 'transparent',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      />

      {/* SVG fallback (currently unused) */}
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          display: 'none', // Hidden by default, Canvas is primary
        }}
      />

      {/* Debug logging and outline when parent toggles it via className */}
      {className?.includes('debug') && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var container = document.currentScript.parentElement;
                  if (!container) return;
                  var rect = container.getBoundingClientRect();

                } catch (e) { console.warn('EQ debug log error', e); }
              })();
            `,
          }}
        />
      )}
    </div>
  );
};

export default EqualizerEngine;
