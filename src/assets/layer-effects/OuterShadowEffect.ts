import { BaseLayerEffect } from './BaseLayerEffect';
import { ILayerEffect } from './ILayerEffect';
import {
  EffectMetadata,
  EffectParameters,
  EffectContext,
  ParameterDescriptor,
  ValidationResult,
  BlendMode,
  ComplexityLevel,
  IEffect,
} from '../effects/IEffect';

export class OuterShadowEffect extends BaseLayerEffect implements ILayerEffect {
  readonly appliesToLayer = true as const;
  readonly expandsBounds = true;

  readonly metadata: EffectMetadata = {
    type: 'outer-shadow',
    displayName: 'Outer Shadow',
    description: 'Adds drop shadow beneath the layer',
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

  override getParameterDescriptors(): ParameterDescriptor[] {
    return [
      {
        key: 'blur',
        displayName: 'Blur',
        type: 'range',
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        description: 'Blur radius in pixels',
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
        description: 'Horizontal offset in pixels',
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
        description: 'Vertical offset in pixels',
        animatable: true,
      },
      {
        key: 'color',
        displayName: 'Color',
        type: 'color',
        defaultValue: '#000000',
        description: 'Shadow color',
        animatable: false,
      },
      {
        key: 'spread',
        displayName: 'Spread',
        type: 'range',
        defaultValue: 0,
        min: -25,
        max: 25,
        step: 1,
        description: 'Shadow spread in pixels',
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
        description: 'Shadow opacity',
        animatable: true,
      },
    ];
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
      (params.spread < -25 || params.spread > 25)
    ) {
      errors.push('Spread must be between -25 and 25');
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

  override getAnimatableParameters(): string[] {
    return ['blur', 'offsetX', 'offsetY', 'spread', 'opacity'];
  }

  override canChainWith(_effect: IEffect): boolean {
    return true; // Can chain with any effect
  }

  override getSupportedBlendModes(): BlendMode[] {
    return ['normal', 'multiply', 'screen', 'overlay'];
  }

  override supportsMasking(): boolean {
    return true;
  }

  override canCache(params: EffectParameters): boolean {
    // Can cache if not using animated parameters
    return !params.time;
  }

  calculateBoundsExpansion(params: EffectParameters) {
    const blur = params.blur || 10;
    const spread = params.spread || 0;
    const offsetX = params.offsetX || 5;
    const offsetY = params.offsetY || 5;

    // Shadow expands bounds by blur radius + spread
    const expansion = blur + Math.abs(spread);

    return {
      top: Math.max(0, expansion - offsetY),
      right: Math.max(0, expansion + offsetX),
      bottom: Math.max(0, expansion + offsetY),
      left: Math.max(0, expansion - offsetX),
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

  override async process(
    input: HTMLCanvasElement | ImageData,
    params: EffectParameters,
    context: EffectContext
  ): Promise<HTMLCanvasElement | ImageData> {
    const { canvas, dimensions } = context;
    const ctx = this.ensure2DContext(context.ctx);
    const inputCanvas =
      input instanceof ImageData ? this.imageDataToCanvas(input) : input;

    // Calculate expanded canvas size
    const expansion = this.calculateBoundsExpansion(params);
    const expandedWidth = dimensions.width + expansion.left + expansion.right;
    const expandedHeight = dimensions.height + expansion.top + expansion.bottom;

    // Resize canvas if needed
    if (canvas.width !== expandedWidth || canvas.height !== expandedHeight) {
      canvas.width = expandedWidth;
      canvas.height = expandedHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply shadow settings
    const color = this.hexToRgba(
      params.color || '#000000',
      params.opacity || 1.0
    );
    const blur = params.blur || 10;
    const offsetX = params.offsetX || 5;
    const offsetY = params.offsetY || 5;
    const spread = params.spread || 0;

    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;

    if (spread > 0) {
      // Positive spread: draw multiple times to increase shadow density
      const spreadIterations = Math.min(Math.max(1, spread), 10); // Clamp iterations for performance
      for (let i = 0; i < spreadIterations; i++) {
        ctx.drawImage(inputCanvas, expansion.left, expansion.top);
      }
    } else if (spread < 0) {
      // Negative spread: contract the shadow by scaling down the source
      // Calculate scale factor: larger negative = smaller shadow
      const scaleFactor = Math.max(0.5, 1 + spread / 50); // -25 gives ~0.5, 0 gives 1
      const scaledWidth = inputCanvas.width * scaleFactor;
      const scaledHeight = inputCanvas.height * scaleFactor;
      const offsetForCenter = (inputCanvas.width - scaledWidth) / 2;
      const offsetForCenterY = (inputCanvas.height - scaledHeight) / 2;

      ctx.drawImage(
        inputCanvas,
        expansion.left + offsetForCenter,
        expansion.top + offsetForCenterY,
        scaledWidth,
        scaledHeight
      );
    } else {
      // Zero spread: draw normally with shadow
      ctx.drawImage(inputCanvas, expansion.left, expansion.top);
    }

    // Draw the original image without the shadow offset, to place it on top of the shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(inputCanvas, expansion.left, expansion.top);

    return canvas;
  }

  override estimateComplexity(
    params: EffectParameters,
    _context: EffectContext
  ): ComplexityLevel {
    const blur = params.blur || 10;
    if (blur < 10) return 'low';
    if (blur < 25) return 'medium';
    if (blur < 40) return 'high';
    return 'extreme';
  }

  override dispose(): void {
    // No resources to cleanup
  }
}
