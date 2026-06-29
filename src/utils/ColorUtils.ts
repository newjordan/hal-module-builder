/**
 * ColorUtils - Color manipulation and conversion utilities
 * Provides comprehensive color operations for HAL Builder
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

/**
 * Color conversion utilities
 */
export class ColorUtils {
  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1] ?? '0', 16),
          g: parseInt(result[2] ?? '0', 16),
          b: parseInt(result[3] ?? '0', 16),
        }
      : null;
  }

  /**
   * Convert RGB to hex
   */
  static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Convert RGB to HSL
   */
  static rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * Convert HSL to RGB
   */
  static hslToRgb(h: number, s: number, l: number): RGB {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
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

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Convert RGB to HSV
   */
  static rgbToHsv(r: number, g: number, b: number): HSV {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
    };
  }

  /**
   * Convert HSV to RGB
   */
  static hsvToRgb(h: number, s: number, v: number): RGB {
    h /= 360;
    s /= 100;
    v /= 100;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r: number, g: number, b: number;

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
      default:
        r = g = b = 0;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Interpolate between two colors
   */
  static interpolate(color1: string, color2: string, t: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) {
      return color1; // Fallback
    }

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

    return this.rgbToHex(r, g, b);
  }

  /**
   * Get luminance of a color (for contrast calculations)
   */
  static getLuminance(r: number, g: number, b: number): number {
    const sRGB = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return (
      0.2126 * (sRGB[0] ?? 0) +
      0.7152 * (sRGB[1] ?? 0) +
      0.0722 * (sRGB[2] ?? 0)
    );
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 1;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if color meets WCAG contrast requirements
   */
  static meetsContrastRequirement(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
  }

  /**
   * Adjust color brightness
   */
  static adjustBrightness(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const r = Math.max(0, Math.min(255, rgb.r + amount));
    const g = Math.max(0, Math.min(255, rgb.g + amount));
    const b = Math.max(0, Math.min(255, rgb.b + amount));

    return this.rgbToHex(r, g, b);
  }

  /**
   * Adjust color saturation
   */
  static adjustSaturation(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.s = Math.max(0, Math.min(100, hsl.s + amount));

    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Get complementary color
   */
  static getComplementary(color: string): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + 180) % 360;

    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Generate color palette from base color
   */
  static generatePalette(
    baseColor: string,
    count: number = 5,
    type:
      | 'analogous'
      | 'triadic'
      | 'complementary'
      | 'monochromatic' = 'analogous'
  ): string[] {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return [baseColor];

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const palette: string[] = [baseColor];

    switch (type) {
      case 'analogous':
        for (let i = 1; i < count; i++) {
          const newHue = (hsl.h + i * 30) % 360;
          const newRgb = this.hslToRgb(newHue, hsl.s, hsl.l);
          palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        }
        break;

      case 'triadic':
        for (let i = 1; i < Math.min(count, 3); i++) {
          const newHue = (hsl.h + i * 120) % 360;
          const newRgb = this.hslToRgb(newHue, hsl.s, hsl.l);
          palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        }
        break;

      case 'complementary':
        if (count >= 2) {
          palette.push(this.getComplementary(baseColor));
        }
        break;

      case 'monochromatic':
        const lightnessStep = 20;
        for (let i = 1; i < count; i++) {
          const newLightness = Math.max(
            10,
            Math.min(
              90,
              hsl.l + i * lightnessStep - (count * lightnessStep) / 2
            )
          );
          const newRgb = this.hslToRgb(hsl.h, hsl.s, newLightness);
          palette.push(this.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
        }
        break;
    }

    return palette.slice(0, count);
  }
}

/**
 * Gradient utilities
 */
export class GradientUtils {
  /**
   * Create CSS gradient string
   */
  static createGradient(
    type: 'linear' | 'radial' | 'conic',
    colors: string[],
    stops?: number[],
    angle?: number,
    centerX?: number,
    centerY?: number
  ): string {
    const colorStops = colors
      .map((color, i) => {
        const stop = stops?.[i] ?? i / (colors.length - 1);
        return `${color} ${(stop * 100).toFixed(1)}%`;
      })
      .join(', ');

    switch (type) {
      case 'linear':
        return `linear-gradient(${angle || 0}deg, ${colorStops})`;

      case 'radial':
        const cx = centerX ?? 50;
        const cy = centerY ?? 50;
        return `radial-gradient(circle at ${cx}% ${cy}%, ${colorStops})`;

      case 'conic':
        const conicStops = colors
          .map((color, i) => {
            const stop = stops?.[i] ?? i / (colors.length - 1);
            return `${color} ${(stop * 360).toFixed(1)}deg`;
          })
          .join(', ');
        return `conic-gradient(from 0deg at 50% 50%, ${conicStops})`;

      default:
        return `linear-gradient(0deg, ${colorStops})`;
    }
  }

  /**
   * Optimize gradient by removing unnecessary stops
   */
  static optimizeGradient(
    colors: string[],
    stops: number[]
  ): {
    colors: string[];
    stops: number[];
  } {
    if (colors.length !== stops.length || colors.length < 2) {
      return { colors, stops };
    }

    const optimized = {
      colors: [colors[0] ?? '#000000'],
      stops: [stops[0] ?? 0],
    };

    for (let i = 1; i < colors.length - 1; i++) {
      const prevColor = colors[i - 1];
      const currColor = colors[i];
      const nextColor = colors[i + 1];

      // Keep color if it's significantly different from interpolated color
      const expectedColor = ColorUtils.interpolate(
        prevColor ?? '#000000',
        nextColor ?? '#ffffff',
        ((stops[i] ?? 0) - (stops[i - 1] ?? 0)) /
          ((stops[i + 1] ?? 1) - (stops[i - 1] ?? 0))
      );

      if (currColor !== expectedColor && currColor && stops[i] !== undefined) {
        optimized.colors.push(currColor);
        optimized.stops.push(stops[i] ?? 0);
      }
    }

    // Always keep the last color
    const lastColor = colors[colors.length - 1];
    const lastStop = stops[stops.length - 1];
    if (lastColor && lastStop !== undefined) {
      optimized.colors.push(lastColor);
      optimized.stops.push(lastStop);
    }

    return optimized;
  }

  /**
   * Sample color from gradient at position
   */
  static sampleGradient(
    colors: string[],
    stops: number[],
    position: number
  ): string {
    position = Math.max(0, Math.min(1, position));

    // Find the two colors to interpolate between
    for (let i = 0; i < stops.length - 1; i++) {
      if (position >= (stops[i] ?? 0) && position <= (stops[i + 1] ?? 1)) {
        const currentStop = stops[i] ?? 0;
        const nextStop = stops[i + 1] ?? 1;
        const localT = (position - currentStop) / (nextStop - currentStop);
        return ColorUtils.interpolate(
          colors[i] ?? '#000000',
          colors[i + 1] ?? '#ffffff',
          localT
        );
      }
    }

    // Fallback to first or last color
    return position <= (stops[0] ?? 0)
      ? (colors[0] ?? '#000000')
      : (colors[colors.length - 1] ?? '#ffffff');
  }
}

/**
 * Theme utilities
 */
export class ThemeUtils {
  /**
   * Generate theme-appropriate colors
   */
  static getThemeColors(theme: 'light' | 'dark') {
    const baseColors = {
      light: {
        background: '#ffffff',
        surface: '#f8f9fa',
        border: '#e9ecef',
        text: '#212529',
        textSecondary: '#6c757d',
        primary: '#0d6efd',
        secondary: '#6c757d',
        success: '#198754',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#0dcaf0',
      },
      dark: {
        background: '#121212',
        surface: '#1e1e1e',
        border: '#333333',
        text: '#ffffff',
        textSecondary: '#adb5bd',
        primary: '#0d6efd',
        secondary: '#6c757d',
        success: '#198754',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#0dcaf0',
      },
    };

    return baseColors[theme];
  }

  /**
   * Adapt color for theme
   */
  static adaptColorForTheme(color: string, theme: 'light' | 'dark'): string {
    const rgb = ColorUtils.hexToRgb(color);
    if (!rgb) return color;

    const hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Adjust lightness based on theme
    if (theme === 'dark') {
      hsl.l = Math.min(80, hsl.l + 20); // Lighten for dark theme
    } else {
      hsl.l = Math.max(20, hsl.l - 10); // Darken slightly for light theme
    }

    const newRgb = ColorUtils.hslToRgb(hsl.h, hsl.s, hsl.l);
    return ColorUtils.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }
}

export default {
  ColorUtils,
  GradientUtils,
  ThemeUtils,
};
