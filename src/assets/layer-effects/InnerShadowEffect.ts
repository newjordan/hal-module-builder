import { BaseLayerEffect } from './BaseLayerEffect';
import { ILayerEffect } from './ILayerEffect';
import {
  EffectMetadata,
  EffectParameters,
  EffectContext,
  ParameterDescriptor,
  ValidationResult,
} from '../effects/IEffect';

export class InnerShadowEffect extends BaseLayerEffect implements ILayerEffect {
  readonly appliesToLayer = true as const;
  readonly expandsBounds = false;

  readonly metadata: EffectMetadata = {
    type: 'inner-shadow',
    displayName: 'Inner Shadow',
    description: 'Adds shadow inside layer bounds',
    category: 'filter',
    version: '1.0.0',
    author: 'HAL-9001',
  };

  readonly defaultParameters: EffectParameters = {
    blur: 10,
    offsetX: 5,
    offsetY: 5,
    color: '#000000',
    spread: 0,
    opacity: 1.0,
  };

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      {
        key: 'blur',
        displayName: 'Blur',
        type: 'range',
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        animatable: true,
      },
      {
        key: 'offsetX',
        displayName: 'Offset X',
        type: 'range',
        defaultValue: 5,
        min: -50,
        max: 50,
        step: 1,
        animatable: true,
      },
      {
        key: 'offsetY',
        displayName: 'Offset Y',
        type: 'range',
        defaultValue: 5,
        min: -50,
        max: 50,
        step: 1,
        animatable: true,
      },
      {
        key: 'color',
        displayName: 'Color',
        type: 'color',
        defaultValue: '#000000',
        animatable: false,
      },
      {
        key: 'spread',
        displayName: 'Spread',
        type: 'range',
        defaultValue: 0,
        min: 0,
        max: 25,
        step: 1,
        animatable: true,
      },
      {
        key: 'opacity',
        displayName: 'Opacity',
        type: 'range',
        defaultValue: 1.0,
        min: 0,
        max: 1,
        step: 0.01,
        animatable: true,
      },
    ];
  }

  calculateBoundsExpansion(_params: EffectParameters) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  override validateParameters(params: EffectParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (params.blur !== undefined && (params.blur < 0 || params.blur > 50)) {
      errors.push('Blur must be between 0 and 50');
    }
    if (
      params.offsetX !== undefined &&
      (params.offsetX < -50 || params.offsetX > 50)
    ) {
      errors.push('Offset X must be between -50 and 50');
    }
    if (
      params.offsetY !== undefined &&
      (params.offsetY < -50 || params.offsetY > 50)
    ) {
      errors.push('Offset Y must be between -50 and 50');
    }
    if (
      params.spread !== undefined &&
      (params.spread < 0 || params.spread > 25)
    ) {
      errors.push('Spread must be between 0 and 25');
    }
    if (
      params.opacity !== undefined &&
      (params.opacity < 0 || params.opacity > 1)
    ) {
      errors.push('Opacity must be between 0 and 1');
    }

    if (params.blur && params.blur > 30) {
      warnings.push('High blur values may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private hexToRgba(hex: string, opacity: number): string {
    // Handle various color formats
    if (!hex) {
      return `rgba(0, 0, 0, ${opacity})`;
    }

    // Handle rgb/rgba strings
    if (hex.startsWith('rgb')) {
      const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
      }
    }

    // Remove # prefix if present
    const cleanHex = hex.replace(/^#/, '');

    // Handle shorthand hex (#fff -> #ffffff)
    let fullHex = cleanHex;
    if (cleanHex.length === 3) {
      fullHex =
        (cleanHex[0] ?? '') +
        (cleanHex[0] ?? '') +
        (cleanHex[1] ?? '') +
        (cleanHex[1] ?? '') +
        (cleanHex[2] ?? '') +
        (cleanHex[2] ?? '');
    }

    // Parse 6-character hex
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    if (!result) {
      return `rgba(0, 0, 0, ${opacity})`;
    }

    const r = parseInt(result[1]!, 16);
    const g = parseInt(result[2]!, 16);
    const b = parseInt(result[3]!, 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  async process(
    input: HTMLCanvasElement | ImageData,
    params: EffectParameters,
    context: EffectContext
  ): Promise<HTMLCanvasElement | ImageData> {
    const { canvas, dimensions } = context;
    const ctx = this.ensure2DContext(context.ctx);

    const inputCanvas =
      input instanceof ImageData ? this.imageDataToCanvas(input) : input;

    if (
      canvas.width !== dimensions.width ||
      canvas.height !== dimensions.height
    ) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const color = this.hexToRgba(
      params.color || '#000000',
      params.opacity || 1.0
    );
    const blur = params.blur || 10;
    const offsetX = params.offsetX || 5;
    const offsetY = params.offsetY || 5;

    // Create a temporary canvas to draw the shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = canvas.width;
    shadowCanvas.height = canvas.height;
    const shadowCtx = shadowCanvas.getContext('2d')!;

    // Draw the original shape onto the shadow canvas
    shadowCtx.drawImage(inputCanvas, 0, 0);

    // Use 'source-in' to color the shape with the shadow color
    shadowCtx.globalCompositeOperation = 'source-in';
    shadowCtx.fillStyle = color;
    shadowCtx.fillRect(0, 0, canvas.width, canvas.height);

    // On the main canvas, draw the blurred shadow
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;
    ctx.drawImage(shadowCanvas, 0, 0);

    // Use 'destination-in' to clip the shadow to the original shape's alpha
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(inputCanvas, 0, 0);

    // Reset composite operation and shadow
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw the original shape on top
    ctx.drawImage(inputCanvas, 0, 0);

    return canvas;
  }
}
