import { BaseLayerEffect } from './BaseLayerEffect';
import { ILayerEffect } from './ILayerEffect';
import {
  EffectMetadata,
  EffectParameters,
  EffectContext,
  ParameterDescriptor,
} from '../effects/IEffect';

export class OuterGlowEffect extends BaseLayerEffect implements ILayerEffect {
  readonly appliesToLayer = true as const;
  readonly expandsBounds = true;

  readonly metadata: EffectMetadata = {
    type: 'outer-glow',
    displayName: 'Outer Glow',
    description: 'Adds soft glow around layer edges',
    category: 'filter',
    version: '1.0.0',
    author: 'HAL-9001',
  };

  readonly defaultParameters: EffectParameters = {
    blur: 20,
    color: '#ffffff',
    spread: 0,
    opacity: 1.0,
  };

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      {
        key: 'blur',
        displayName: 'Size',
        type: 'range',
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        animatable: true,
      },
      {
        key: 'color',
        displayName: 'Color',
        type: 'color',
        defaultValue: '#ffffff',
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

  calculateBoundsExpansion(params: EffectParameters) {
    const expansion = (params.blur || 20) + (params.spread || 0);
    return {
      top: expansion,
      right: expansion,
      bottom: expansion,
      left: expansion,
    };
  }

  private hexToRgba(hex: string, opacity: number): string {
    // Handle various color formats
    if (!hex) {
      return `rgba(255, 255, 255, ${opacity})`;
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
      return `rgba(255, 255, 255, ${opacity})`;
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
    const expansion = this.calculateBoundsExpansion(params);

    canvas.width = dimensions.width + expansion.left + expansion.right;
    canvas.height = dimensions.height + expansion.top + expansion.bottom;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const color = this.hexToRgba(
      params.color || '#ffffff',
      params.opacity || 1.0
    );
    const blur = params.blur || 20;
    const spread = params.spread || 0;

    ctx.filter = `drop-shadow(0 0 ${blur}px ${color}) drop-shadow(0 0 ${spread}px ${color})`;
    ctx.drawImage(inputCanvas, expansion.left, expansion.top);
    ctx.filter = 'none';

    return canvas;
  }
}
