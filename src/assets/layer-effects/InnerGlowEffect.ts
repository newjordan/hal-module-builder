import { BaseLayerEffect } from './BaseLayerEffect';
import { ILayerEffect } from './ILayerEffect';
import { EffectMetadata, EffectParameters, EffectContext, ParameterDescriptor, ValidationResult } from '../effects/IEffect';

export class InnerGlowEffect extends BaseLayerEffect implements ILayerEffect {
  readonly appliesToLayer = true as const;
  readonly expandsBounds = false;

  readonly metadata: EffectMetadata = {
    type: 'inner-glow',
    displayName: 'Inner Glow',
    description: 'Adds glow inside layer edges',
    category: 'filter',
    version: '1.0.0',
    author: 'HAL-9001'
  };

  readonly defaultParameters: EffectParameters = {
    blur: 15,
    color: '#ffffff',
    opacity: 1.0
  };

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      { key: 'blur', displayName: 'Size', type: 'range', defaultValue: 15, min: 0, max: 50, step: 1, animatable: true },
      { key: 'color', displayName: 'Color', type: 'color', defaultValue: '#ffffff', animatable: false },
      { key: 'opacity', displayName: 'Opacity', type: 'range', defaultValue: 1.0, min: 0, max: 1, step: 0.01, animatable: true }
    ];
  }

  calculateBoundsExpansion(_params: EffectParameters) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  override validateParameters(params: EffectParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (params.blur !== undefined && (params.blur < 0 || params.blur > 50)) {
      errors.push('Glow size must be between 0 and 50');
    }
    if (params.opacity !== undefined && (params.opacity < 0 || params.opacity > 1)) {
      errors.push('Opacity must be between 0 and 1');
    }

    if (params.blur && params.blur > 30) {
      warnings.push('High glow size may impact performance');
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
    const opacity = params.opacity ?? 1.0;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw original first
    ctx.drawImage(inputCanvas, 0, 0);

    // Apply inner glow with opacity
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = opacity;
    ctx.shadowBlur = params.blur || 15;
    ctx.shadowColor = params.color || '#ffffff';
    ctx.drawImage(inputCanvas, 0, 0);

    // Reset context state
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    return canvas;
  }
}