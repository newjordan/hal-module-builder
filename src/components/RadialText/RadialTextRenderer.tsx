/**
 * HAL Radial Text Renderer
 * ========================
 *
 * Canvas-based text rendering component with visual effects support.
 * MANDATORY: Uses frost_glass.css styling exclusively - NO custom CSS allowed.
 *
 * Single Responsibility: Text rendering and visual effects application only.
 *
 * @version 1.0.0
 * @requires frost_glass.css
 */

import * as React from 'react';
const { useRef, useEffect, useCallback, useMemo } = React;
import { RadialTextService } from '../../services/radial/RadialTextService';
import { TextEffectProcessor } from '../../assets/effects/text/TextEffectProcessor';
import { useRadialTextAnimation } from '../../hooks/useRadialTextAnimation';
import {
  RadialTextRendererProps,
  RadialTextCharacter,
  RadialTextConfig,
  RadialTextEffects,
  DEFAULT_RADIAL_TEXT_CONFIG,
  DEFAULT_RADIAL_TEXT_EFFECTS,
} from '../../types/radial-text-types';

/**
 * Canvas rendering context configuration
 */
interface CanvasRenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  size: number;
}

/**
 * RadialTextRenderer Component
 *
 * MANDATORY FROST_GLASS CSS COMPLIANCE:
 * - Uses only frost_glass.css classes
 * - Theme prop required for all styling
 * - Container uses frost-card styling
 *
 * @example
 * ```tsx
 * <RadialTextRenderer
 *   theme="frost_dark"
 *   config={textConfig}
 *   effects={textEffects}
 *   className="frost-card frost-backdrop-blur-xl"
 * />
 * ```
 */
export const RadialTextRenderer: React.FC<RadialTextRendererProps> = ({
  theme,
  config: rawConfig,
  effects,
  appearance,
  animation,
  audioData,
  isActive = true,
  size = 400,
  onClick,
  onAnimationComplete,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const charactersRef = useRef<RadialTextCharacter[]>([]);
  const effectProcessor = TextEffectProcessor.getInstance();
  const config = useMemo<RadialTextConfig>(() => {
    const baseConfig = {
      ...DEFAULT_RADIAL_TEXT_CONFIG,
      ...rawConfig,
    } as RadialTextConfig;

    if (
      (baseConfig.innerRadius === undefined || baseConfig.innerRadius <= 0) &&
      typeof (rawConfig as any)?.radius === 'number'
    ) {
      baseConfig.innerRadius = (rawConfig as any).radius;
    }

    if (
      baseConfig.letterSpacing === undefined &&
      typeof (rawConfig as any)?.characterSpacing === 'number'
    ) {
      baseConfig.letterSpacing = (rawConfig as any).characterSpacing;
    }

    if (!baseConfig.textFlow && (rawConfig as any)?.flowMode) {
      baseConfig.textFlow = (rawConfig as any).flowMode;
    }

    if (!baseConfig.textFlow) {
      baseConfig.textFlow = 'follow-arc';
    }

    return baseConfig;
  }, [rawConfig]);

  // MANDATORY: frost_glass.css theme classes
  const themeClasses = useMemo(() => {
    const baseClasses =
      theme === 'frost_light'
        ? 'frost_light frostlight-card'
        : 'frost_dark frostdark-card';

    const backgroundClasses =
      theme === 'frost_light'
        ? 'frost-bg-white/10 frost-backdrop-blur-xl'
        : 'frost-bg-gray-900/10 frost-backdrop-blur-xl';

    const borderClasses =
      theme === 'frost_light'
        ? 'frost-border frost-border-gray-200/20'
        : 'frost-border frost-border-gray-700/20';

    return `${baseClasses} ${backgroundClasses} ${borderClasses} frost-rounded-lg frost-overflow-hidden`;
  }, [theme]);

  const resolvedEffects = useMemo<RadialTextEffects>(() => {
    const base: RadialTextEffects = {
      ...DEFAULT_RADIAL_TEXT_EFFECTS,
      theme,
      ...(effects ?? {}),
    };

    base.theme = effects?.theme ?? theme;

    const gradientColors = appearance?.fillGradient?.colors;
    const primaryFromGradient =
      gradientColors && gradientColors.length > 0
        ? gradientColors[0]
        : undefined;

    const strokeGradientColors = appearance?.strokeGradient?.colors;

    base.primaryColor =
      effects?.primaryColor ??
      appearance?.fillColor ??
      appearance?.color ??
      primaryFromGradient ??
      base.primaryColor;

    if (!base.secondaryColor && gradientColors && gradientColors.length > 1) {
      const lastColor = gradientColors[gradientColors.length - 1];
      if (lastColor) base.secondaryColor = lastColor;
    }

    if (
      !effects?.colorMode &&
      appearance?.fillType === 'gradient' &&
      gradientColors &&
      gradientColors.length > 1
    ) {
      base.colorMode = 'gradient';
    }

    if (appearance?.strokeWidth !== undefined) {
      if (effects?.strokeWidth === undefined) {
        base.strokeWidth = appearance.strokeWidth;
      }

      if (!effects?.strokeColor && appearance.strokeColor) {
        base.strokeColor = appearance.strokeColor;
      }
    }

    if (
      appearance?.strokeType === 'gradient' &&
      strokeGradientColors &&
      strokeGradientColors.length > 0 &&
      !effects?.strokeColor
    ) {
      const lastStrokeColor =
        strokeGradientColors[strokeGradientColors.length - 1];
      if (lastStrokeColor) base.strokeColor = lastStrokeColor;
    }

    const glowOverride = appearance?.outerGlow;
    if (glowOverride?.enabled) {
      if (effects?.glowIntensity === undefined) {
        const opacity = glowOverride.opacity ?? 0;
        const size = glowOverride.size ?? 0;
        const derivedIntensity = Math.min(2, (opacity * size) / 50);
        base.glowIntensity = Math.max(base.glowIntensity, derivedIntensity);
      }

      if (!effects?.glowColor && glowOverride.color) {
        base.glowColor = glowOverride.color;
      }
    }

    return base;
  }, [effects, appearance, theme]);

  // Calculate character layout using RadialTextService
  const characterLayout = useMemo(() => {
    return RadialTextService.calculateTextLayout(config);
  }, [config]);

  // Integrate animation system
  const animationConfig = useMemo(
    () => ({
      animationType: animation?.textAnimationType || 'none',
      duration: animation?.animationDuration || 2000,
      staggerDelay: animation?.staggerDelay || 100,
      theme,
      autoStart: isActive && animation?.textAnimationType !== 'none',
    }),
    [animation, theme, isActive]
  );

  const {
    animatedCharacters,
    isPlaying: _animationIsPlaying,
    isComplete: animationIsComplete,
    startAnimation: _startAnimation,
    resetAnimation: _resetAnimation,
  } = useRadialTextAnimation(
    `${config.text}-${config.innerRadius}-${config.startAngle}`, // Unique layer ID
    characterLayout.characters,
    animationConfig,
    audioData
  );

  // Use animated characters or static characters
  const currentCharacters =
    animation?.textAnimationType !== 'none'
      ? animatedCharacters
      : characterLayout.characters;

  // Update characters reference
  useEffect(() => {
    charactersRef.current = currentCharacters;
  }, [currentCharacters]);

  // Handle animation completion callback
  useEffect(() => {
    if (animationIsComplete && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [animationIsComplete, onAnimationComplete]);

  /**
   * Setup canvas with high DPI support
   * Ensures crisp text rendering on all displays
   */
  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement): CanvasRenderContext | null => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Calculate device pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size with DPI scaling
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      // Scale context for high DPI
      ctx.scale(dpr, dpr);

      // Enable text antialiasing
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      return { canvas, ctx, dpr, size };
    },
    [size]
  );

  /**
   * Render a single character with all effects applied
   * Now integrates with TextEffectProcessor for advanced effects
   */
  const renderCharacter = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      character: RadialTextCharacter,
      timestamp: number
    ) => {
      if (!character.visible || character.opacity <= 0) return;

      const effectsToApply = resolvedEffects;

      const { x, y } = character.position;

      // Save context state
      ctx.save();

      // Apply character transform
      const centerX = size / 2;
      const centerY = size / 2;
      const relativeX = x - config.centerX + centerX;
      const relativeY = y - config.centerY + centerY;

      ctx.translate(relativeX, relativeY);
      ctx.rotate(character.rotation);
      ctx.scale(character.scale, character.scale);

      // Set font properties
      ctx.font = `${config.fontWeight || 'normal'} ${config.fontSize || 16}px ${config.fontFamily || 'inherit'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = character.opacity;

      // Process character effects using the effect processor
      if (effectsToApply) {
        try {
          await effectProcessor.processCharacterEffects(
            character,
            charactersRef.current,
            effectsToApply,
            {
              canvasCtx: ctx,
              theme,
              ...(audioData !== undefined ? { audioData } : {}),
              timestamp,
            }
          );
        } catch (error) {
          console.warn(
            'Effect processing failed, falling back to basic rendering:',
            error
          );
        }
      }

      // Set basic colors if no effects or effect processing failed
      if (!effectsToApply || effectsToApply.colorMode === 'solid') {
        ctx.fillStyle =
          effectsToApply?.primaryColor ||
          (theme === 'frost_light' ? '#1f2937' : '#f9fafb');
      }

      // Draw character stroke if configured
      const strokeWidth = effectsToApply?.strokeWidth ?? 0;
      if (strokeWidth > 0) {
        ctx.strokeStyle = effectsToApply.strokeColor || '#000000';
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(character.char, 0, 0);
      }

      // Draw character fill
      ctx.fillText(character.char, 0, 0);

      // Restore context state
      ctx.restore();
    },
    [size, config, resolvedEffects, theme, audioData, effectProcessor]
  );

  /**
   * Render all characters to canvas
   * Main rendering loop with performance optimizations and effect integration
   */
  const renderFrame = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const renderContext = setupCanvas(canvas);
    if (!renderContext) return;

    const { ctx } = renderContext;
    const characters = charactersRef.current;
    const timestamp = performance.now();

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Apply blur effect if configured
    if (resolvedEffects.blur && resolvedEffects.blur > 0) {
      ctx.filter = `blur(${resolvedEffects.blur}px)`;
    }

    // Render all visible characters
    const startTime = performance.now();

    for (const character of characters) {
      if (character.visible) {
        await renderCharacter(ctx, character, timestamp);
      }
    }

    const renderTime = performance.now() - startTime;

    // Update performance metrics
    if (characterLayout.metrics) {
      characterLayout.metrics.renderTime = renderTime;
      characterLayout.metrics.frameTime = renderTime;
    }

    // Reset filter
    ctx.filter = 'none';
  }, [
    isActive,
    size,
    resolvedEffects,
    renderCharacter,
    setupCanvas,
    characterLayout.metrics,
  ]);

  /**
   * Animation loop for continuous rendering
   */
  const animate = useCallback(() => {
    renderFrame();

    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [renderFrame, isActive]);

  // Start/stop animation loop
  useEffect(() => {
    if (isActive) {
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, isActive]);

  // Initial render when not animating
  useEffect(() => {
    if (!isActive) {
      renderFrame();
    }
  }, [renderFrame, isActive, characterLayout]);

  // Handle container click
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <div
      ref={containerRef}
      className={`radial-text-renderer ${themeClasses} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={handleClick}
      data-theme={theme}
      data-character-count={characterLayout.characters.length}
      data-performance-ok={characterLayout.metrics.performanceOk}
    >
      {/* Canvas for text rendering */}
      <canvas
        ref={canvasRef}
        className='frost-absolute frost-inset-0 frost-w-full frost-h-full'
        style={{
          pointerEvents: 'none',
        }}
      />

      {/* Performance indicator (development mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className={`frost-absolute frost-top-2 frost-right-2 frost-text-xs ${theme === 'frost_light' ? 'frost-text-gray-600' : 'frost-text-gray-400'}`}
        >
          {characterLayout.characters.length}ch /{' '}
          {characterLayout.metrics.layoutTime.toFixed(1)}ms
        </div>
      )}
    </div>
  );
};

RadialTextRenderer.displayName = 'RadialTextRenderer';

export default RadialTextRenderer;
