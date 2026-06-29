/**
 * ColorUtils - Color manipulation and conversion utilities
 * Extracted from RenderUtils for better modularity
 */

export class ColorUtils {
  private static colorCache: Map<string, string> = new Map();

  /**
   * Convert HSL to RGB with caching
   */
  static hslToRgb(h: number, s: number, l: number): string {
    const cacheKey = `hsl_${h}_${s}_${l}`;
    const cached = this.colorCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const result = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

    // Cache if space available
    if (this.colorCache.size < 1000) {
      this.colorCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Interpolate between colors efficiently
   */
  static interpolateColor(color1: string, color2: string, t: number): string {
    const cacheKey = `interp_${color1}_${color2}_${t.toFixed(3)}`;
    const cached = this.colorCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);

    if (!rgb1 || !rgb2) {
      return color1;
    }

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

    const result = `rgb(${r}, ${g}, ${b})`;

    if (this.colorCache.size < 1000) {
      this.colorCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Parse color string to RGB
   */
  private static parseColor(
    color: string
  ): { r: number; g: number; b: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return { r, g, b };
    }

    // Handle rgb() colors
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]!, 10),
        g: parseInt(rgbMatch[2]!, 10),
        b: parseInt(rgbMatch[3]!, 10),
      };
    }

    return null;
  }

  /**
   * Clear color cache
   */
  static clearCache(): void {
    this.colorCache.clear();
  }
}
