/**
 * HAL Text Gradient Effect
 * ========================
 *
 * Advanced gradient effects for radial text with multiple gradient types.
 * Integrates with existing EffectLibrary system and supports audio reactivity.
 *
 * Single Responsibility: Text gradient effect processing only.
 *
 * @version 1.0.0
 * @requires EffectLibrary
 */

import { EffectMetadata } from '../IEffect';
import {
  BaseTextEffect,
  TextEffectContext,
  TextEffectParameters,
  TextEffectResult,
} from './TextEffectProcessor';

/**
 * Gradient direction options
 */
export type GradientDirection = 'linear' | 'radial' | 'follow-text' | 'angular';

/**
 * Text Gradient Effect Parameters
 */
export interface TextGradientParameters extends TextEffectParameters {
  /** Primary gradient color */
  primaryColor: string;
  /** Secondary gradient color */
  secondaryColor: string;
  /** Gradient direction type */
  direction: GradientDirection;
  /** Gradient angle (for linear gradients) */
  angle: number;
  /** Gradient spread radius (for radial gradients) */
  radius: number;
  /** Animation speed for dynamic gradients */
  animationSpeed: number;
  /** Enable audio reactivity */
  audioReactive: boolean;
}

/**
 * Text Gradient Effect
 * Creates dynamic gradient effects for radial text
 *
 * Features:
 * - Multiple gradient types (linear, radial, angular)
 * - Follow-text gradients that adapt to text path
 * - Audio-reactive color shifting
 * - Animated gradients with customizable speed
 * - Performance optimized with caching
 *
 * @example
 * ```tsx
 * const gradientEffect = new TextGradientEffect();
 * TextEffectProcessor.getInstance().registerEffect(gradientEffect);
 * ```
 */
export class TextGradientEffect extends BaseTextEffect {
  readonly metadata: EffectMetadata = {
    type: 'text-gradient',
    displayName: 'Text Gradient',
    description:
      'Advanced gradient effects with multiple types and audio reactivity',
    version: '1.0.0',
    author: 'HAL Text Effects Team',
    category: 'color',
    requiredFeatures: ['canvas'],
  };

  readonly defaultParameters: TextGradientParameters = {
    effects: {
      theme: 'frost_light', // MANDATORY frost_glass theme
      colorMode: 'gradient',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      glowIntensity: 0,
    },
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    direction: 'linear',
    angle: 45,
    radius: 20,
    animationSpeed: 0.5,
    audioReactive: false,
  };

  // Cache for gradient objects to improve performance
  private gradientCache = new Map<string, CanvasGradient>();

  /**
   * Process gradient effect on character
   * Creates and applies gradient based on configuration
   */
  async processGradient(
    context: TextEffectContext,
    parameters: TextGradientParameters
  ): Promise<TextEffectResult> {
    const startTime = performance.now();

    try {
      const { canvasCtx, character, timestamp, audioData } = context;
      const {
        primaryColor,
        secondaryColor,
        direction,
        angle,
        radius,
        animationSpeed,
        audioReactive,
      } = parameters;

      // Calculate animated colors if audio reactive
      let finalPrimaryColor = primaryColor;
      let finalSecondaryColor = secondaryColor;

      if (audioReactive && audioData && audioData.length > 0) {
        const audioIndex = character.index % audioData.length;
        const audioValue = (audioData[audioIndex] ?? 0) / 255;

        // Shift hue based on audio data
        finalPrimaryColor = this.shiftHue(primaryColor, audioValue * 60);
        finalSecondaryColor = this.shiftHue(secondaryColor, audioValue * 60);
      }

      // Apply animation if speed > 0
      if (animationSpeed > 0) {
        const animationOffset = (timestamp * animationSpeed * 0.001) % 1;
        const colors = this.animateColors(
          finalPrimaryColor,
          finalSecondaryColor,
          animationOffset
        );
        finalPrimaryColor = colors.primary;
        finalSecondaryColor = colors.secondary;
      }

      // Create gradient based on direction
      const gradient = this.createGradient(
        canvasCtx,
        character,
        direction,
        angle,
        radius,
        finalPrimaryColor,
        finalSecondaryColor
      );

      if (!gradient) {
        throw new Error('Failed to create gradient');
      }

      return {
        success: true,
        character,
        canvasModifications: {
          fillStyle: gradient.toString(),
        },
        processTime: performance.now() - startTime,
      };
    } catch (error) {
      console.error('Text gradient effect processing failed:', error);
      return {
        success: false,
        canvasModifications: {},
        processTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Create gradient based on direction and parameters
   */
  private createGradient(
    ctx: CanvasRenderingContext2D,
    character: any,
    direction: GradientDirection,
    angle: number,
    radius: number,
    primaryColor: string,
    secondaryColor: string
  ): CanvasGradient | null {
    // Generate cache key
    const cacheKey = `${direction}-${angle}-${radius}-${primaryColor}-${secondaryColor}`;

    // Check cache first
    if (this.gradientCache.has(cacheKey)) {
      return this.gradientCache.get(cacheKey)!;
    }

    let gradient: CanvasGradient;

    try {
      switch (direction) {
        case 'linear':
          gradient = this.createLinearGradient(
            ctx,
            angle,
            primaryColor,
            secondaryColor
          );
          break;

        case 'radial':
          gradient = this.createRadialGradient(
            ctx,
            radius,
            primaryColor,
            secondaryColor
          );
          break;

        case 'angular':
          gradient = this.createAngularGradient(
            ctx,
            primaryColor,
            secondaryColor
          );
          break;

        case 'follow-text':
          gradient = this.createFollowTextGradient(
            ctx,
            character,
            primaryColor,
            secondaryColor
          );
          break;

        default:
          gradient = this.createLinearGradient(
            ctx,
            45,
            primaryColor,
            secondaryColor
          );
          break;
      }

      // Cache the gradient for future use
      this.gradientCache.set(cacheKey, gradient);
      return gradient;
    } catch (error) {
      console.error('Failed to create gradient:', error);
      return null;
    }
  }

  /**
   * Create linear gradient
   */
  private createLinearGradient(
    ctx: CanvasRenderingContext2D,
    angle: number,
    primaryColor: string,
    secondaryColor: string
  ): CanvasGradient {
    // Convert angle to radians and calculate gradient line
    const radians = (angle * Math.PI) / 180;
    const length = 40; // Gradient length

    const x1 = (-Math.cos(radians) * length) / 2;
    const y1 = (-Math.sin(radians) * length) / 2;
    const x2 = (Math.cos(radians) * length) / 2;
    const y2 = (Math.sin(radians) * length) / 2;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);

    return gradient;
  }

  /**
   * Create radial gradient
   */
  private createRadialGradient(
    ctx: CanvasRenderingContext2D,
    radius: number,
    primaryColor: string,
    secondaryColor: string
  ): CanvasGradient {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);

    return gradient;
  }

  /**
   * Create angular/conic gradient (approximated with multiple stops)
   */
  private createAngularGradient(
    ctx: CanvasRenderingContext2D,
    _primaryColor: string,
    _secondaryColor: string
  ): CanvasGradient {
    // Approximate conic gradient with radial gradient and multiple stops
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);

    // Create color wheel effect
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const stop = i / steps;
      const hue = ((i * 360) / steps) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;
      gradient.addColorStop(stop, color);
    }

    return gradient;
  }

  /**
   * Create gradient that follows text path
   */
  private createFollowTextGradient(
    ctx: CanvasRenderingContext2D,
    character: any,
    primaryColor: string,
    secondaryColor: string
  ): CanvasGradient {
    // Create gradient that follows the character's radial position
    const angle = character.position?.angle || 0;

    // Calculate gradient direction based on text path
    const tangentX = Math.cos(angle + Math.PI / 2) * 20;
    const tangentY = Math.sin(angle + Math.PI / 2) * 20;

    const gradient = ctx.createLinearGradient(
      -tangentX,
      -tangentY,
      tangentX,
      tangentY
    );
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);

    return gradient;
  }

  /**
   * Shift hue of a color by specified degrees
   */
  private shiftHue(color: string, shift: number): string {
    // Convert hex to HSL, shift hue, convert back
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + shift) % 360;
    if (hsl.h < 0) hsl.h += 360;

    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return `rgb(${Math.round(newRgb.r)}, ${Math.round(newRgb.g)}, ${Math.round(newRgb.b)})`;
  }

  /**
   * Animate colors by interpolating between them
   */
  private animateColors(
    primaryColor: string,
    secondaryColor: string,
    progress: number
  ): { primary: string; secondary: string } {
    const primaryRgb = this.hexToRgb(primaryColor);
    const secondaryRgb = this.hexToRgb(secondaryColor);

    if (!primaryRgb || !secondaryRgb) {
      return { primary: primaryColor, secondary: secondaryColor };
    }

    // Create oscillating animation
    const oscillation = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;

    const animatedPrimary = {
      r: primaryRgb.r + (secondaryRgb.r - primaryRgb.r) * oscillation * 0.3,
      g: primaryRgb.g + (secondaryRgb.g - primaryRgb.g) * oscillation * 0.3,
      b: primaryRgb.b + (secondaryRgb.b - primaryRgb.b) * oscillation * 0.3,
    };

    const animatedSecondary = {
      r: secondaryRgb.r + (primaryRgb.r - secondaryRgb.r) * oscillation * 0.3,
      g: secondaryRgb.g + (primaryRgb.g - secondaryRgb.g) * oscillation * 0.3,
      b: secondaryRgb.b + (primaryRgb.b - secondaryRgb.b) * oscillation * 0.3,
    };

    return {
      primary: `rgb(${Math.round(animatedPrimary.r)}, ${Math.round(animatedPrimary.g)}, ${Math.round(animatedPrimary.b)})`,
      secondary: `rgb(${Math.round(animatedSecondary.r)}, ${Math.round(animatedSecondary.g)}, ${Math.round(animatedSecondary.b)})`,
    };
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
   * Convert RGB to HSL
   */
  private rgbToHsl(
    r: number,
    g: number,
    b: number
  ): { h: number; s: number; l: number } {
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

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Convert HSL to RGB
   */
  private hslToRgb(
    h: number,
    s: number,
    l: number
  ): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

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

    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  /**
   * Get parameter descriptors for UI generation
   */
  override getTextParameterDescriptors() {
    return [
      {
        name: 'primaryColor',
        type: 'color' as const,
        default: '#3b82f6',
        description: 'Primary gradient color',
      },
      {
        name: 'secondaryColor',
        type: 'color' as const,
        default: '#8b5cf6',
        description: 'Secondary gradient color',
      },
      {
        name: 'direction',
        type: 'string' as const,
        default: 'linear',
        description:
          'Gradient direction (linear, radial, angular, follow-text)',
      },
      {
        name: 'angle',
        type: 'number' as const,
        default: 45,
        min: 0,
        max: 360,
        description: 'Gradient angle in degrees (for linear gradients)',
      },
      {
        name: 'radius',
        type: 'number' as const,
        default: 20,
        min: 5,
        max: 50,
        description: 'Gradient radius (for radial gradients)',
      },
      {
        name: 'animationSpeed',
        type: 'number' as const,
        default: 0.5,
        min: 0,
        max: 5,
        description: 'Animation speed multiplier',
      },
      {
        name: 'audioReactive',
        type: 'boolean' as const,
        default: false,
        description: 'Enable audio-reactive color shifting',
      },
    ];
  }

  /**
   * Validate gradient effect parameters
   */
  override validateTextParameters(parameters: TextGradientParameters): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (
      !parameters.primaryColor ||
      typeof parameters.primaryColor !== 'string'
    ) {
      errors.push('Primary color must be a valid CSS color string');
    }

    if (
      !parameters.secondaryColor ||
      typeof parameters.secondaryColor !== 'string'
    ) {
      errors.push('Secondary color must be a valid CSS color string');
    }

    if (
      !['linear', 'radial', 'angular', 'follow-text'].includes(
        parameters.direction
      )
    ) {
      errors.push(
        'Direction must be one of: linear, radial, angular, follow-text'
      );
    }

    if (
      typeof parameters.angle !== 'number' ||
      parameters.angle < 0 ||
      parameters.angle > 360
    ) {
      errors.push('Angle must be a number between 0 and 360');
    }

    if (
      typeof parameters.radius !== 'number' ||
      parameters.radius < 5 ||
      parameters.radius > 50
    ) {
      errors.push('Radius must be a number between 5 and 50');
    }

    if (
      typeof parameters.animationSpeed !== 'number' ||
      parameters.animationSpeed < 0 ||
      parameters.animationSpeed > 5
    ) {
      errors.push('Animation speed must be a number between 0 and 5');
    }

    // Validate frost_glass theme requirement
    if (
      !parameters.effects?.theme ||
      (parameters.effects.theme !== 'frost_light' &&
        parameters.effects.theme !== 'frost_dark')
    ) {
      errors.push(
        'effects.theme must be "frost_light" or "frost_dark" (MANDATORY)'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if effect supports audio reactivity
   */
  override get supportsAudioReactivity(): boolean {
    return true;
  }

  /**
   * Check if effect is character-level
   */
  override get isCharacterLevel(): boolean {
    return true;
  }

  /**
   * Cleanup effect resources
   */
  override async processText(
    context: TextEffectContext,
    parameters: TextGradientParameters
  ): Promise<TextEffectResult> {
    return this.processGradient(context, parameters);
  }

  override dispose(): void {
    // Clear gradient cache
    this.gradientCache.clear();
    super.dispose();
  }
}
