/**
 * Gradient Effect Module
 * Extracted from HalModuleBuilder.tsx for story 1.3d: Effects Asset System
 */

import {
  EffectMetadata,
  EffectParameters,
  EffectContext,
  ParameterDescriptor,
  BaseEffect,
  BlendMode,
  ComplexityLevel,
  ValidationResult,
} from './IEffect';

export interface GradientParameters extends EffectParameters {
  /** Gradient type */
  type: 'linear' | 'radial' | 'conic';
  /** Gradient colors */
  colors: string[];
  /** Color stop positions (0-1) */
  stops: number[];
  /** Angle for linear gradients (degrees) */
  angle?: number;
  /** Center X position for radial gradients (0-100) */
  centerX?: number;
  /** Center Y position for radial gradients (0-100) */
  centerY?: number;
  /** Common effect parameters */
  opacity?: number;
  intensity?: number;
  enabled?: boolean;
  blendMode?: BlendMode;
}

/**
 * Gradient Effect Implementation
 * Supports linear, radial, and conic gradients with configurable stops
 */
export class GradientEffect extends BaseEffect {
  readonly metadata: EffectMetadata = {
    type: 'gradient',
    displayName: 'Gradient',
    description:
      'Creates linear, radial, or conic gradients with customizable colors and stops',
    version: '1.0.0',
    author: 'HAL Builder',
    category: 'color',
    requiredFeatures: ['canvas-2d'],
  };

  readonly defaultParameters: GradientParameters = {
    type: 'radial',
    colors: ['#ff0000', '#0000ff', 'transparent'],
    stops: [0, 0.5, 1],
    angle: 0,
    centerX: 50,
    centerY: 50,
    opacity: 1,
    intensity: 1,
    enabled: true,
    blendMode: 'normal',
  };

  async process(
    input: ImageData | HTMLCanvasElement,
    parameters: GradientParameters,
    context: EffectContext
  ): Promise<HTMLCanvasElement> {
    const { ctx: renderCtx, dimensions } = context;

    // Ensure we have a 2D context
    if (!renderCtx || renderCtx instanceof WebGLRenderingContext) {
      throw new Error('Gradient effect requires 2D rendering context');
    }

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = dimensions.width;
    outputCanvas.height = dimensions.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    // Apply input if provided
    if (input instanceof HTMLCanvasElement) {
      outputCtx.drawImage(input, 0, 0);
    } else if (input instanceof ImageData) {
      outputCtx.putImageData(input, 0, 0);
    }

    // Create gradient
    const gradient = this.createGradient(outputCtx, parameters, dimensions);

    // Set global composite operation based on blend mode
    outputCtx.globalCompositeOperation = this.getCompositeOperation(
      parameters.blendMode || 'normal'
    ) as GlobalCompositeOperation;
    outputCtx.globalAlpha =
      (parameters.opacity || 1) * (parameters.intensity || 1);

    // Apply gradient
    outputCtx.fillStyle = gradient;

    // Create circular mask for HAL Builder compatibility
    outputCtx.beginPath();
    const radius = Math.min(dimensions.width, dimensions.height) / 2;
    outputCtx.arc(
      dimensions.width / 2,
      dimensions.height / 2,
      radius,
      0,
      2 * Math.PI
    );
    outputCtx.fill();

    return outputCanvas;
  }

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      {
        key: 'type',
        displayName: 'Gradient Type',
        type: 'select',
        defaultValue: 'radial',
        options: [
          { value: 'linear', label: 'Linear' },
          { value: 'radial', label: 'Radial' },
          { value: 'conic', label: 'Conic' },
        ],
        description: 'Type of gradient to create',
        animatable: false,
      },
      {
        key: 'colors',
        displayName: 'Colors',
        type: 'string',
        defaultValue: ['#ff0000', '#0000ff', 'transparent'],
        description: 'Array of gradient colors',
        animatable: true,
      },
      {
        key: 'stops',
        displayName: 'Color Stops',
        type: 'range',
        defaultValue: [0, 0.5, 1],
        min: 0,
        max: 1,
        step: 0.01,
        description: 'Position of each color (0-1)',
        animatable: true,
      },
      {
        key: 'angle',
        displayName: 'Angle',
        type: 'number',
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        description: 'Angle for linear gradients (degrees)',
        animatable: true,
      },
      {
        key: 'centerX',
        displayName: 'Center X',
        type: 'range',
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        description: 'Horizontal center for radial gradients (%)',
        animatable: true,
      },
      {
        key: 'centerY',
        displayName: 'Center Y',
        type: 'range',
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        description: 'Vertical center for radial gradients (%)',
        animatable: true,
      },
      {
        key: 'opacity',
        displayName: 'Opacity',
        type: 'range',
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        description: 'Overall opacity of the gradient',
        animatable: true,
      },
      {
        key: 'intensity',
        displayName: 'Intensity',
        type: 'range',
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
        description: 'Gradient intensity multiplier',
        animatable: true,
      },
    ];
  }

  override validateParameters(params: EffectParameters): ValidationResult {
    const baseValidation = super.validateParameters(params);
    const errors = baseValidation.errors ? [...baseValidation.errors] : [];
    const warnings = baseValidation.warnings
      ? [...baseValidation.warnings]
      : [];

    // Custom validation for colors array
    const colors = params.colors;
    if (colors !== undefined) {
      if (!Array.isArray(colors)) {
        errors.push('Parameter colors must be an array');
      } else {
        if (colors.length < 2) {
          errors.push('Parameter colors must have at least 2 colors');
        }
        colors.forEach((color, index) => {
          if (typeof color !== 'string') {
            errors.push(`Parameter colors[${index}] must be a string`);
          }
        });
      }
    }

    // Validate stops array if present
    const stops = params.stops;
    if (stops !== undefined && Array.isArray(stops)) {
      if (colors && Array.isArray(colors) && stops.length !== colors.length) {
        warnings.push('Number of color stops should match number of colors');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  override canCache(params: GradientParameters): boolean {
    // Can cache if not animated and no dynamic parameters
    return !this.hasAnimatedParameters(params);
  }

  override estimateComplexity(
    params: GradientParameters,
    context: EffectContext
  ): ComplexityLevel {
    const { dimensions } = context;
    const pixelCount = dimensions.width * dimensions.height;
    const colorCount = params.colors?.length || 2;

    // Complexity based on canvas size and gradient complexity
    if (pixelCount > 500000 || colorCount > 10) return 'high';
    if (pixelCount > 100000 || colorCount > 5) return 'medium';
    return 'low';
  }

  override getSupportedBlendModes(): BlendMode[] {
    return [
      'normal',
      'multiply',
      'screen',
      'overlay',
      'soft-light',
      'hard-light',
      'color-dodge',
      'color-burn',
      'darken',
      'lighten',
      'difference',
      'exclusion',
    ];
  }

  /**
   * Create canvas gradient from parameters
   */
  private createGradient(
    ctx: CanvasRenderingContext2D,
    params: GradientParameters,
    dimensions: { width: number; height: number }
  ): CanvasGradient {
    let gradient: CanvasGradient;

    const { width, height } = dimensions;
    const colors = params.colors || this.defaultParameters.colors;
    const stops = params.stops || this.defaultParameters.stops;

    switch (params.type) {
      case 'linear': {
        const angle = ((params.angle || 0) * Math.PI) / 180;
        const x1 = width / 2 - (Math.cos(angle) * width) / 2;
        const y1 = height / 2 - (Math.sin(angle) * height) / 2;
        const x2 = width / 2 + (Math.cos(angle) * width) / 2;
        const y2 = height / 2 + (Math.sin(angle) * height) / 2;

        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        break;
      }

      case 'radial': {
        const centerX = ((params.centerX || 50) / 100) * width;
        const centerY = ((params.centerY || 50) / 100) * height;
        const radius = Math.max(
          Math.sqrt(centerX * centerX + centerY * centerY),
          Math.sqrt((width - centerX) * (width - centerX) + centerY * centerY),
          Math.sqrt(
            centerX * centerX + (height - centerY) * (height - centerY)
          ),
          Math.sqrt(
            (width - centerX) * (width - centerX) +
              (height - centerY) * (height - centerY)
          )
        );

        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        break;
      }

      case 'conic': {
        const centerX = ((params.centerX || 50) / 100) * width;
        const centerY = ((params.centerY || 50) / 100) * height;
        const startAngle = ((params.angle || 0) * Math.PI) / 180;

        gradient = ctx.createConicGradient(startAngle, centerX, centerY);
        break;
      }

      default:
        throw new Error(`Unsupported gradient type: ${params.type}`);
    }

    // Add color stops
    colors.forEach((color, index) => {
      const stop =
        stops[index] !== undefined ? stops[index] : index / (colors.length - 1);
      gradient.addColorStop(Math.max(0, Math.min(1, stop)), color);
    });

    return gradient;
  }

  /**
   * Convert blend mode to canvas composite operation
   */
  private getCompositeOperation(blendMode: BlendMode): string {
    const blendModeMap: Record<BlendMode, string> = {
      normal: 'source-over',
      multiply: 'multiply',
      screen: 'screen',
      overlay: 'overlay',
      'soft-light': 'soft-light',
      'hard-light': 'hard-light',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      darken: 'darken',
      lighten: 'lighten',
      difference: 'difference',
      exclusion: 'exclusion',
      hue: 'hue',
      saturation: 'saturation',
      color: 'color',
      luminosity: 'luminosity',
    };

    return blendModeMap[blendMode] || 'source-over';
  }

  /**
   * Check if parameters contain animated values
   */
  private hasAnimatedParameters(_params: GradientParameters): boolean {
    // This would be expanded to check for animation keyframes in the future
    // For now, assume static parameters can be cached
    return false;
  }
}

/**
 * Factory function to create gradient effect instances
 */
export function createGradientEffect(): GradientEffect {
  return new GradientEffect();
}
