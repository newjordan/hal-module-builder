import { BaseLayerEffect } from './BaseLayerEffect';
import { ILayerEffect } from './ILayerEffect';
import { EffectMetadata, EffectParameters, EffectContext, ParameterDescriptor, ValidationResult } from '../effects/IEffect';

export class BlurEffect extends BaseLayerEffect implements ILayerEffect {
  readonly appliesToLayer = true as const;
  readonly expandsBounds = false;

  readonly metadata: EffectMetadata = {
    type: 'blur',
    displayName: 'Blur',
    description: 'Applies Gaussian blur to the layer',
    category: 'filter',
    version: '1.0.0',
    author: 'HAL-9001'
  };

  readonly defaultParameters: EffectParameters = {
    radius: 5,
    opacity: 1.0
  };

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      { key: 'radius', displayName: 'Radius', type: 'range', defaultValue: 5, min: 0, max: 50, step: 1, animatable: true }
    ];
  }

  calculateBoundsExpansion(_params: EffectParameters) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  override validateParameters(params: EffectParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (params.radius !== undefined && (params.radius < 0 || params.radius > 50)) {
      errors.push('Blur radius must be between 0 and 50');
    }

    if (params.radius && params.radius > 30) {
      warnings.push('High blur values may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async process(input: HTMLCanvasElement | ImageData, params: EffectParameters, context: EffectContext): Promise<HTMLCanvasElement | ImageData> {
    const { canvas, dimensions } = context;
    const ctx = this.ensure2DContext(context.ctx);
    const inputCanvas = input instanceof ImageData ? this.imageDataToCanvas(input) : input;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const radius = params.radius || 5;
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(inputCanvas, 0, 0);
    ctx.filter = 'none';

    return canvas;
  }
}