/**
 * RenderContextOptimizer - Context management and optimization
 * Extracted from VisualizationRenderer for better modularity
 */

import type { VisualizationConfig } from '../visualizations/IVisualization';

export interface OptimizedRenderContext {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  time: number;
  theme: string;
  devicePixelRatio: number;
  isOffscreen: boolean;
  clipRegion?: { x: number; y: number; width: number; height: number };
}

export class RenderContextOptimizer {
  private transformCache: Map<string, DOMMatrix> = new Map();
  private lastTransformKey: string = '';
  private currentQualityLevel: number = 1.0;

  /**
   * Create optimized render context with caching
   */
  createOptimizedContext(
    canvas: HTMLCanvasElement | OffscreenCanvas,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    config: VisualizationConfig
  ): OptimizedRenderContext {
    // Cache transform calculations
    const transformKey = `${config.rotation}_${config.scale}_${config.offsetX}_${config.offsetY}`;

    if (transformKey !== this.lastTransformKey) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

      if (config.offsetX || config.offsetY) {
        ctx.translate(config.offsetX, config.offsetY);
      }

      if (config.rotation) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((config.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      if (config.scale !== 1) {
        const scaleOriginX = canvas.width / 2;
        const scaleOriginY = canvas.height / 2;
        ctx.translate(scaleOriginX, scaleOriginY);
        ctx.scale(config.scale, config.scale);
        ctx.translate(-scaleOriginX, -scaleOriginY);
      }

      this.lastTransformKey = transformKey;
    }

    // Respect centerX/centerY if already provided in config (e.g., for overscan canvas)
    // Otherwise default to canvas center
    const centerX = (config as any).centerX ?? canvas.width / 2;
    const centerY = (config as any).centerY ?? canvas.height / 2;

    return {
      ctx,
      width: canvas.width,
      height: canvas.height,
      centerX,
      centerY,
      time: performance.now(),
      theme: 'frost_light', // TODO: Get from theme manager
      devicePixelRatio: window.devicePixelRatio || 1,
      isOffscreen: !!(ctx as any).canvas?.transferControlToOffscreen,
    };
  }

  /**
   * Prepare canvas for rendering with optimizations
   */
  prepareCanvas(context: OptimizedRenderContext): void {
    const ctx = context.ctx as CanvasRenderingContext2D;

    // Efficient clearing
    ctx.clearRect(0, 0, context.width, context.height);

    // Apply quality optimizations
    if (this.currentQualityLevel < 1.0) {
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * Apply adaptive quality based on performance
   */
  applyAdaptiveQuality(
    context: OptimizedRenderContext,
    maxFrameRate: number,
    averageRenderTime: number
  ): void {
    const targetFrameTime = 1000 / maxFrameRate;

    if (averageRenderTime > targetFrameTime * 1.2) {
      // Performance is suffering, reduce quality
      this.currentQualityLevel = Math.max(0.5, this.currentQualityLevel - 0.1);
    } else if (averageRenderTime < targetFrameTime * 0.8) {
      // Performance is good, increase quality
      this.currentQualityLevel = Math.min(1.0, this.currentQualityLevel + 0.05);
    }

    // Apply quality level to context
    const ctx = context.ctx as CanvasRenderingContext2D;
    if (this.currentQualityLevel < 1.0) {
      const scale = this.currentQualityLevel;
      ctx.scale(1 / scale, 1 / scale);
    }
  }

  /**
   * Optimize rendering context settings
   */
  optimizeContext(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  ): void {
    // Enable hardware acceleration hints
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Optimize for animations (only on main canvas context)
    if ('willReadFrequently' in ctx) {
      (ctx as any).willReadFrequently = false;
    }
  }

  /**
   * Reset quality and transform cache
   */
  reset(): void {
    this.transformCache.clear();
    this.currentQualityLevel = 1.0;
    this.lastTransformKey = '';
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.transformCache.clear();
  }
}
