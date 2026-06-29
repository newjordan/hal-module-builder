/**
 * GradientUtils - Gradient creation and management utilities
 * Extracted from RenderUtils for better modularity
 */

export interface GradientConfig {
  type: 'linear' | 'radial' | 'conic';
  colors: string[];
  stops?: number[];
  angle?: number;
  center?: { x: number; y: number };
  radius?: number;
}

export class GradientUtils {
  private static gradientCache: Map<string, CanvasGradient> = new Map();

  /**
   * Create optimized gradient with caching
   */
  static createGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    width: number,
    height: number
  ): CanvasGradient {
    const cacheKey = this.createGradientCacheKey(config, width, height);
    const cached = this.gradientCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    let gradient: CanvasGradient;

    switch (config.type) {
      case 'linear':
        gradient = this.createLinearGradient(ctx, config, width, height);
        break;
      case 'radial':
        gradient = this.createRadialGradient(ctx, config, width, height);
        break;
      case 'conic':
        gradient = this.createConicGradient(ctx, config, width, height);
        break;
      default:
        gradient = this.createLinearGradient(ctx, config, width, height);
    }

    // Cache if space available
    if (this.gradientCache.size < 100) {
      this.gradientCache.set(cacheKey, gradient);
    }

    return gradient;
  }

  /**
   * Create linear gradient
   */
  private static createLinearGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    width: number,
    height: number
  ): CanvasGradient {
    const angle = ((config.angle || 0) * Math.PI) / 180;
    const x1 = width / 2 + (Math.cos(angle + Math.PI) * width) / 2;
    const y1 = height / 2 + (Math.sin(angle + Math.PI) * height) / 2;
    const x2 = width / 2 + (Math.cos(angle) * width) / 2;
    const y2 = height / 2 + (Math.sin(angle) * height) / 2;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    this.addColorStops(gradient, config);
    return gradient;
  }

  /**
   * Create radial gradient
   */
  private static createRadialGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    width: number,
    height: number
  ): CanvasGradient {
    const centerX = config.center?.x ?? width / 2;
    const centerY = config.center?.y ?? height / 2;
    const radius = config.radius ?? Math.max(width, height) / 2;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );
    this.addColorStops(gradient, config);
    return gradient;
  }

  /**
   * Create conic gradient (with fallback)
   */
  private static createConicGradient(
    ctx: CanvasRenderingContext2D,
    config: GradientConfig,
    width: number,
    height: number
  ): CanvasGradient {
    // Fallback to radial if conic not supported
    if (typeof (ctx as any).createConicGradient !== 'function') {
      return this.createRadialGradient(ctx, config, width, height);
    }

    const centerX = config.center?.x ?? width / 2;
    const centerY = config.center?.y ?? height / 2;
    const angle = ((config.angle || 0) * Math.PI) / 180;

    const gradient = (ctx as any).createConicGradient(angle, centerX, centerY);
    this.addColorStops(gradient, config);
    return gradient;
  }

  /**
   * Add color stops to gradient
   */
  private static addColorStops(
    gradient: CanvasGradient,
    config: GradientConfig
  ): void {
    const colors = config.colors;
    const stops = config.stops || colors.map((_, i) => i / (colors.length - 1));

    colors.forEach((color, index) => {
      const stop = stops[index] ?? index / (colors.length - 1);
      gradient.addColorStop(Math.max(0, Math.min(1, stop)), color);
    });
  }

  /**
   * Create gradient cache key
   */
  private static createGradientCacheKey(
    config: GradientConfig,
    width: number,
    height: number
  ): string {
    return `${config.type}_${config.colors.join('_')}_${config.angle || 0}_${width}_${height}`;
  }

  /**
   * Clear gradient cache
   */
  static clearCache(): void {
    this.gradientCache.clear();
  }
}
