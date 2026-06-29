/**
 * HAL Text Stroke Effect
 * ======================
 *
 * Professional text stroke/outline effect with customizable width and style.
 * Integrates with existing EffectLibrary system and supports audio reactivity.
 *
 * Single Responsibility: Text stroke effect processing only.
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
 * Stroke style options
 */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient';

/**
 * Stroke join styles
 */
export type StrokeJoin = 'round' | 'bevel' | 'miter';

/**
 * Text Stroke Effect Parameters
 */
export interface TextStrokeParameters extends TextEffectParameters {
  /** Stroke color */
  color: string;
  /** Secondary color for gradient strokes */
  secondaryColor?: string;
  /** Stroke width in pixels */
  width: number;
  /** Stroke style */
  style: StrokeStyle;
  /** Line join style */
  join: StrokeJoin;
  /** Line cap style */
  cap: 'butt' | 'round' | 'square';
  /** Opacity of stroke */
  opacity: number;
  /** Enable audio reactivity */
  audioReactive: boolean;
  /** Dash pattern for dashed strokes */
  dashPattern?: number[];
}

/**
 * Text Stroke Effect
 * Creates professional stroke/outline effects for radial text
 *
 * Features:
 * - Multiple stroke styles (solid, dashed, dotted, double, gradient)
 * - Customizable width and opacity
 * - Audio-reactive stroke width
 * - Performance optimized rendering
 * - Gradient stroke support
 *
 * @example
 * ```tsx
 * const strokeEffect = new TextStrokeEffect();
 * TextEffectProcessor.getInstance().registerEffect(strokeEffect);
 * ```
 */
export class TextStrokeEffect extends BaseTextEffect {
  readonly metadata: EffectMetadata = {
    type: 'text-stroke',
    displayName: 'Text Stroke',
    description: 'Professional text stroke/outline effect with multiple styles',
    version: '1.0.0',
    author: 'HAL Text Effects Team',
    category: 'filter',
    requiredFeatures: ['canvas'],
  };

  readonly defaultParameters: TextStrokeParameters = {
    effects: {
      theme: 'frost_light', // MANDATORY frost_glass theme
      colorMode: 'solid',
      primaryColor: '#3b82f6',
      strokeColor: '#000000',
      strokeWidth: 2,
      glowIntensity: 0,
    },
    color: '#000000',
    width: 2,
    style: 'solid',
    join: 'round',
    cap: 'round',
    opacity: 1.0,
    audioReactive: false,
  };

  /**
   * Process stroke effect on character
   * Applies stroke with specified style and properties
   */
  async processStroke(
    context: TextEffectContext,
    parameters: TextStrokeParameters
  ): Promise<TextEffectResult> {
    const startTime = performance.now();

    try {
      const { canvasCtx, character, audioData } = context;
      const {
        color,
        secondaryColor,
        width,
        style,
        join,
        cap,
        opacity,
        audioReactive,
        dashPattern,
      } = parameters;

      // Calculate audio-reactive width if enabled
      let finalWidth = width;
      let finalOpacity = opacity;

      if (audioReactive && audioData && audioData.length > 0) {
        const audioIndex = character.index % audioData.length;
        const audioValue = (audioData[audioIndex] ?? 0) / 255;

        // Audio-reactive width and opacity
        finalWidth = width * (0.5 + audioValue * 1.5);
        finalOpacity = opacity * (0.7 + audioValue * 0.3);
      }

      // Save canvas state
      const originalStrokeStyle = canvasCtx.strokeStyle;
      const originalLineWidth = canvasCtx.lineWidth;
      const originalLineJoin = canvasCtx.lineJoin;
      const originalLineCap = canvasCtx.lineCap;
      const originalGlobalAlpha = canvasCtx.globalAlpha;
      const originalLineDash = canvasCtx.getLineDash();

      // Apply stroke style based on type
      const strokeStyle = this.createStrokeStyle(
        canvasCtx,
        style,
        color,
        secondaryColor
      );

      // Set stroke properties
      canvasCtx.strokeStyle = strokeStyle;
      canvasCtx.lineWidth = finalWidth;
      canvasCtx.lineJoin = join;
      canvasCtx.lineCap = cap;
      canvasCtx.globalAlpha = finalOpacity * character.opacity;

      // Apply dash pattern for dashed/dotted styles
      if (style === 'dashed' || style === 'dotted') {
        const pattern = this.getDashPattern(style, finalWidth, dashPattern);
        canvasCtx.setLineDash(pattern);
      } else {
        canvasCtx.setLineDash([]);
      }

      // Handle double stroke style
      if (style === 'double') {
        await this.applyDoubleStroke(
          canvasCtx,
          character,
          color,
          finalWidth,
          join,
          cap,
          finalOpacity
        );
      }

      // Restore canvas state
      canvasCtx.strokeStyle = originalStrokeStyle;
      canvasCtx.lineWidth = originalLineWidth;
      canvasCtx.lineJoin = originalLineJoin;
      canvasCtx.lineCap = originalLineCap;
      canvasCtx.globalAlpha = originalGlobalAlpha;
      canvasCtx.setLineDash(originalLineDash);

      const canvasModifications: TextEffectResult['canvasModifications'] = {
        globalAlpha: finalOpacity * character.opacity,
      };
      if (typeof strokeStyle === 'string') {
        canvasModifications.strokeStyle = strokeStyle;
      }

      return {
        success: true,
        character,
        canvasModifications,
        processTime: performance.now() - startTime,
      };
    } catch (error) {
      console.error('Text stroke effect processing failed:', error);
      return {
        success: false,
        canvasModifications: {},
        processTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Create stroke style based on type
   */
  private createStrokeStyle(
    ctx: CanvasRenderingContext2D,
    style: StrokeStyle,
    primaryColor: string,
    secondaryColor?: string
  ): string | CanvasGradient {
    switch (style) {
      case 'gradient':
        if (secondaryColor) {
          const gradient = ctx.createLinearGradient(-20, -10, 20, 10);
          gradient.addColorStop(0, primaryColor);
          gradient.addColorStop(1, secondaryColor);
          return gradient;
        }
        return primaryColor;

      case 'solid':
      case 'dashed':
      case 'dotted':
      case 'double':
      default:
        return primaryColor;
    }
  }

  /**
   * Get dash pattern for dashed/dotted strokes
   */
  private getDashPattern(
    style: StrokeStyle,
    width: number,
    customPattern?: number[]
  ): number[] {
    if (customPattern && customPattern.length > 0) {
      return customPattern;
    }

    switch (style) {
      case 'dashed':
        return [width * 3, width * 2];

      case 'dotted':
        return [width, width];

      default:
        return [];
    }
  }

  /**
   * Apply double stroke effect
   * Renders two strokes with different widths
   */
  private async applyDoubleStroke(
    ctx: CanvasRenderingContext2D,
    _character: any,
    color: string,
    width: number,
    join: StrokeJoin,
    cap: 'butt' | 'round' | 'square',
    opacity: number
  ): Promise<void> {
    // Outer stroke (wider)
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 1.5;
    ctx.lineJoin = join;
    ctx.lineCap = cap;
    ctx.globalAlpha = opacity * 0.6;

    // Inner stroke (narrower)
    ctx.strokeStyle = this.lightenColor(color, 0.3);
    ctx.lineWidth = width * 0.7;
    ctx.globalAlpha = opacity;
  }

  /**
   * Lighten a color by a specified amount
   */
  private lightenColor(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const lightenedRgb = {
      r: Math.min(255, rgb.r + 255 * amount),
      g: Math.min(255, rgb.g + 255 * amount),
      b: Math.min(255, rgb.b + 255 * amount),
    };

    return `rgb(${Math.round(lightenedRgb.r)}, ${Math.round(lightenedRgb.g)}, ${Math.round(lightenedRgb.b)})`;
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
   * Get parameter descriptors for UI generation
   */
  override getTextParameterDescriptors() {
    return [
      {
        name: 'color',
        type: 'color' as const,
        default: '#000000',
        description: 'Stroke color',
      },
      {
        name: 'secondaryColor',
        type: 'color' as const,
        default: '#333333',
        description: 'Secondary color for gradient strokes',
      },
      {
        name: 'width',
        type: 'number' as const,
        default: 2,
        min: 0.5,
        max: 20,
        description: 'Stroke width in pixels',
      },
      {
        name: 'style',
        type: 'string' as const,
        default: 'solid',
        description: 'Stroke style (solid, dashed, dotted, double, gradient)',
      },
      {
        name: 'join',
        type: 'string' as const,
        default: 'round',
        description: 'Line join style (round, bevel, miter)',
      },
      {
        name: 'cap',
        type: 'string' as const,
        default: 'round',
        description: 'Line cap style (butt, round, square)',
      },
      {
        name: 'opacity',
        type: 'number' as const,
        default: 1.0,
        min: 0,
        max: 1,
        description: 'Stroke opacity',
      },
      {
        name: 'audioReactive',
        type: 'boolean' as const,
        default: false,
        description: 'Enable audio-reactive stroke width',
      },
    ];
  }

  /**
   * Validate stroke effect parameters
   */
  override validateTextParameters(parameters: TextStrokeParameters): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!parameters.color || typeof parameters.color !== 'string') {
      errors.push('Color must be a valid CSS color string');
    }

    if (
      typeof parameters.width !== 'number' ||
      parameters.width < 0.5 ||
      parameters.width > 20
    ) {
      errors.push('Width must be a number between 0.5 and 20');
    }

    if (
      !['solid', 'dashed', 'dotted', 'double', 'gradient'].includes(
        parameters.style
      )
    ) {
      errors.push(
        'Style must be one of: solid, dashed, dotted, double, gradient'
      );
    }

    if (!['round', 'bevel', 'miter'].includes(parameters.join)) {
      errors.push('Join must be one of: round, bevel, miter');
    }

    if (!['butt', 'round', 'square'].includes(parameters.cap)) {
      errors.push('Cap must be one of: butt, round, square');
    }

    if (
      typeof parameters.opacity !== 'number' ||
      parameters.opacity < 0 ||
      parameters.opacity > 1
    ) {
      errors.push('Opacity must be a number between 0 and 1');
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
    parameters: TextStrokeParameters
  ): Promise<TextEffectResult> {
    return this.processStroke(context, parameters);
  }

  override dispose(): void {
    // Clean up any stroke-specific resources
    super.dispose();
  }
}
