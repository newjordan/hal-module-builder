import { BaseLayerEffect } from './BaseLayerEffect';
import { ILayerEffect } from './ILayerEffect';
import { EffectMetadata, EffectParameters, EffectContext, ParameterDescriptor } from '../effects/IEffect';

export class StrokeEffect extends BaseLayerEffect implements ILayerEffect {
  readonly appliesToLayer = true as const;
  readonly expandsBounds = true;

  readonly metadata: EffectMetadata = {
    type: 'stroke',
    displayName: 'Stroke',
    description: 'Adds outline around the layer',
    category: 'filter',
    version: '1.0.0',
    author: 'HAL-9001'
  };

  readonly defaultParameters: EffectParameters = {
    width: 3,
    color: '#000000',
    position: 'outside',
    opacity: 1.0
  };

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      { key: 'width', displayName: 'Width', type: 'range', defaultValue: 3, min: 1, max: 20, step: 1, animatable: true },
      { key: 'color', displayName: 'Color', type: 'color', defaultValue: '#000000', animatable: false },
      {
        key: 'position',
        displayName: 'Position',
        type: 'select',
        defaultValue: 'outside',
        options: [
          { value: 'outside', label: 'Outside' },
          { value: 'center', label: 'Center' },
          { value: 'inside', label: 'Inside' }
        ],
        animatable: false
      },
      { key: 'opacity', displayName: 'Opacity', type: 'range', defaultValue: 1.0, min: 0, max: 1, step: 0.01, animatable: true }
    ];
  }

  calculateBoundsExpansion(params: EffectParameters) {
    const width = params.width || 3;
    const position = params.position || 'outside';
    const expansion = position === 'outside' ? width : (position === 'center' ? width / 2 : 0);
    return { top: expansion, right: expansion, bottom: expansion, left: expansion };
  }

  async process(input: HTMLCanvasElement | ImageData, params: EffectParameters, context: EffectContext): Promise<HTMLCanvasElement | ImageData> {
    const { canvas, dimensions } = context;
    const ctx = this.ensure2DContext(context.ctx);
    const inputCanvas = input instanceof ImageData ? this.imageDataToCanvas(input) : input;
    const expansion = this.calculateBoundsExpansion(params);

    canvas.width = dimensions.width + expansion.left + expansion.right;
    canvas.height = dimensions.height + expansion.top + expansion.bottom;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = params.width || 3;
    const color = params.color || '#000000';
    const position = params.position || 'outside';
    const opacity = params.opacity ?? 1.0;

    // Calculate effective stroke width based on position
    const effectiveWidth = position === 'center' ? width / 2 : width;

    // Apply opacity for stroke
    ctx.globalAlpha = opacity;

    // Create stroke effect using multiple shadow passes
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = Math.cos(angle) * effectiveWidth;
      ctx.shadowOffsetY = Math.sin(angle) * effectiveWidth;
      ctx.drawImage(inputCanvas, expansion.left, expansion.top);
    }

    // Reset shadow settings
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalAlpha = 1.0;

    // Draw original on top
    ctx.drawImage(inputCanvas, expansion.left, expansion.top);

    // For inside position, clip to original shape
    if (position === 'inside') {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(inputCanvas, expansion.left, expansion.top);
      ctx.globalCompositeOperation = 'source-over';
    }

    return canvas;
  }
}