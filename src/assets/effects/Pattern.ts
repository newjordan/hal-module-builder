import {
  IEffect,
  EffectMetadata,
  EffectParameters,
  ParameterDescriptor,
  ValidationResult,
  EffectContext,
  ComplexityLevel,
  Mask,
  BlendMode,
} from './IEffect';

/**
 * Pattern Effect - Creates repeating visual patterns
 * Story 1.3d: Effects Asset System - Pattern Effects (AC 3.4)
 */
export class Pattern implements IEffect {
  readonly metadata: EffectMetadata = {
    type: 'pattern',
    displayName: 'Pattern',
    description:
      'Creates repeating visual patterns including dots, stripes, and grids',
    version: '1.0.0',
    author: 'HAL Builder Team',
    category: 'pattern',
  };

  readonly defaultParameters: EffectParameters = {
    opacity: 1,
    intensity: 1,
    enabled: true,
    blendMode: 'normal',
    // Pattern-specific parameters
    patternType: 'dots',
    size: 10,
    spacing: 20,
    rotation: 0,
    primaryColor: '#ffffff',
    secondaryColor: '#000000',
    strokeWidth: 2,
    offset: { x: 0, y: 0 },
  };

  private cachedPattern: HTMLCanvasElement | null = null;
  private lastParams: string = '';

  getDefaultParameters(): EffectParameters {
    return {
      opacity: 1,
      intensity: 1,
      enabled: true,
      blendMode: 'normal',
      // Pattern-specific parameters
      patternType: 'dots',
      size: 10,
      spacing: 20,
      rotation: 0,
      primaryColor: '#ffffff',
      secondaryColor: '#000000',
      strokeWidth: 2,
      offset: { x: 0, y: 0 },
    };
  }

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      {
        key: 'patternType',
        displayName: 'Pattern Type',
        type: 'select',
        defaultValue: 'dots',
        options: [
          { value: 'dots', label: 'Dots' },
          { value: 'stripes', label: 'Stripes' },
          { value: 'grid', label: 'Grid' },
          { value: 'checkerboard', label: 'Checkerboard' },
          { value: 'hexagons', label: 'Hexagons' },
          { value: 'triangles', label: 'Triangles' },
        ],
        description: 'Type of pattern to generate',
      },
      {
        key: 'size',
        displayName: 'Element Size',
        type: 'range',
        defaultValue: 10,
        min: 1,
        max: 100,
        step: 1,
        description: 'Size of pattern elements',
        animatable: true,
      },
      {
        key: 'spacing',
        displayName: 'Spacing',
        type: 'range',
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 1,
        description: 'Space between pattern elements',
        animatable: true,
      },
      {
        key: 'rotation',
        displayName: 'Rotation',
        type: 'range',
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        description: 'Pattern rotation in degrees',
        animatable: true,
      },
      {
        key: 'primaryColor',
        displayName: 'Primary Color',
        type: 'color',
        defaultValue: '#ffffff',
        description: 'Primary pattern color',
        animatable: true,
      },
      {
        key: 'secondaryColor',
        displayName: 'Secondary Color',
        type: 'color',
        defaultValue: '#000000',
        description: 'Secondary pattern color (for grids, checkerboards)',
        animatable: true,
      },
      {
        key: 'strokeWidth',
        displayName: 'Stroke Width',
        type: 'range',
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
        description: 'Width of pattern strokes (for grids, stripes)',
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
        description: 'Pattern opacity',
        animatable: true,
      },
    ];
  }

  validateParameters(params: EffectParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (params.size !== undefined && params.size <= 0) {
      errors.push('Pattern size must be greater than 0');
    }

    if (params.spacing !== undefined && params.spacing < 0) {
      errors.push('Pattern spacing cannot be negative');
    }

    if (
      params.opacity !== undefined &&
      (params.opacity < 0 || params.opacity > 1)
    ) {
      errors.push('Opacity must be between 0 and 1');
    }

    if (params.strokeWidth !== undefined && params.strokeWidth < 0) {
      errors.push('Stroke width cannot be negative');
    }

    // Warnings for performance
    if (params.size && params.size < 5) {
      warnings.push('Very small pattern sizes may impact performance');
    }

    if (params.spacing === 0 && params.patternType !== 'checkerboard') {
      warnings.push('Zero spacing may create solid fills');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async render(
    context: EffectContext,
    params: EffectParameters
  ): Promise<void> {
    if (!params.enabled) return;

    const ctx = context.ctx as CanvasRenderingContext2D;
    const { width, height } = context.dimensions;

    // Apply opacity
    ctx.globalAlpha = params.opacity || 1;

    // Apply blend mode
    ctx.globalCompositeOperation = (params.blendMode ||
      'normal') as GlobalCompositeOperation;

    // Create pattern based on type
    const pattern = this.createPattern(context, params);
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private createPattern(
    context: EffectContext,
    params: EffectParameters
  ): CanvasPattern | null {
    const ctx = context.ctx as CanvasRenderingContext2D;

    // Check if we need to regenerate the pattern
    const paramString = JSON.stringify(params);
    if (this.cachedPattern && this.lastParams === paramString) {
      return ctx.createPattern(this.cachedPattern, 'repeat');
    }

    // Create pattern canvas
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d')!;

    const size = params.size || 10;
    const spacing = params.spacing || 20;
    const totalSize = size + spacing;

    // Set pattern canvas size based on pattern type
    switch (params.patternType) {
      case 'dots':
        patternCanvas.width = totalSize;
        patternCanvas.height = totalSize;
        this.drawDots(patternCtx, size, totalSize, params);
        break;

      case 'stripes':
        patternCanvas.width = totalSize;
        patternCanvas.height = totalSize;
        this.drawStripes(patternCtx, size, totalSize, params);
        break;

      case 'grid':
        patternCanvas.width = totalSize;
        patternCanvas.height = totalSize;
        this.drawGrid(patternCtx, size, totalSize, params);
        break;

      case 'checkerboard':
        patternCanvas.width = size * 2;
        patternCanvas.height = size * 2;
        this.drawCheckerboard(patternCtx, size, params);
        break;

      case 'hexagons':
        const hexWidth = size * 2;
        const hexHeight = Math.sqrt(3) * size;
        patternCanvas.width = hexWidth * 1.5 + spacing;
        patternCanvas.height = hexHeight + spacing;
        this.drawHexagons(patternCtx, size, params);
        break;

      case 'triangles':
        patternCanvas.width = totalSize;
        patternCanvas.height = totalSize;
        this.drawTriangles(patternCtx, size, totalSize, params);
        break;
    }

    // Apply rotation if needed
    if (params.rotation && params.rotation !== 0) {
      const rotatedCanvas = this.rotatePattern(patternCanvas, params.rotation);
      this.cachedPattern = rotatedCanvas;
    } else {
      this.cachedPattern = patternCanvas;
    }

    this.lastParams = paramString;

    return ctx.createPattern(this.cachedPattern, 'repeat');
  }

  private drawDots(
    ctx: CanvasRenderingContext2D,
    size: number,
    totalSize: number,
    params: EffectParameters
  ): void {
    const radius = size / 2;
    ctx.fillStyle = params.primaryColor || '#ffffff';

    // Draw dot in center of pattern tile
    ctx.beginPath();
    ctx.arc(totalSize / 2, totalSize / 2, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStripes(
    ctx: CanvasRenderingContext2D,
    size: number,
    totalSize: number,
    params: EffectParameters
  ): void {
    ctx.strokeStyle = params.primaryColor || '#ffffff';
    ctx.lineWidth = params.strokeWidth || 2;

    // Draw vertical stripe
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, totalSize);
    ctx.stroke();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    _size: number,
    totalSize: number,
    params: EffectParameters
  ): void {
    ctx.strokeStyle = params.primaryColor || '#ffffff';
    ctx.lineWidth = params.strokeWidth || 2;

    // Draw vertical line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, totalSize);
    ctx.stroke();

    // Draw horizontal line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(totalSize, 0);
    ctx.stroke();
  }

  private drawCheckerboard(
    ctx: CanvasRenderingContext2D,
    size: number,
    params: EffectParameters
  ): void {
    // Draw checkerboard pattern
    ctx.fillStyle = params.primaryColor || '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillRect(size, size, size, size);

    ctx.fillStyle = params.secondaryColor || '#000000';
    ctx.fillRect(size, 0, size, size);
    ctx.fillRect(0, size, size, size);
  }

  private drawHexagons(
    ctx: CanvasRenderingContext2D,
    size: number,
    params: EffectParameters
  ): void {
    ctx.strokeStyle = params.primaryColor || '#ffffff';
    ctx.lineWidth = params.strokeWidth || 2;

    const drawHexagon = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    };

    drawHexagon(size, (size * Math.sqrt(3)) / 2, size);
  }

  private drawTriangles(
    ctx: CanvasRenderingContext2D,
    size: number,
    totalSize: number,
    params: EffectParameters
  ): void {
    ctx.strokeStyle = params.primaryColor || '#ffffff';
    ctx.lineWidth = params.strokeWidth || 2;

    const cx = totalSize / 2;
    const cy = totalSize / 2;
    const r = size / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx - r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6));
    ctx.lineTo(cx + r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6));
    ctx.closePath();
    ctx.stroke();
  }

  private rotatePattern(
    canvas: HTMLCanvasElement,
    rotation: number
  ): HTMLCanvasElement {
    const rotatedCanvas = document.createElement('canvas');
    const rotatedCtx = rotatedCanvas.getContext('2d')!;

    // Calculate dimensions for rotated canvas
    const diagonal = Math.sqrt(
      canvas.width * canvas.width + canvas.height * canvas.height
    );
    rotatedCanvas.width = Math.ceil(diagonal);
    rotatedCanvas.height = Math.ceil(diagonal);

    // Rotate and draw
    rotatedCtx.save();
    rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
    rotatedCtx.rotate((rotation * Math.PI) / 180);
    rotatedCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    rotatedCtx.restore();

    return rotatedCanvas;
  }

  canApplyMask(): boolean {
    return true;
  }

  applyMask(context: EffectContext, mask: Mask): void {
    const ctx = context.ctx as CanvasRenderingContext2D;

    switch (mask.type) {
      case 'shape':
        // Apply shape-based mask
        ctx.globalCompositeOperation = mask.invert ? 'source-out' : 'source-in';
        break;
      case 'gradient':
        // Apply gradient-based mask
        ctx.globalCompositeOperation = 'multiply';
        break;
      case 'image':
        // Apply image-based mask
        ctx.globalCompositeOperation = mask.invert ? 'source-out' : 'source-in';
        break;
    }
  }

  serialize(params: EffectParameters): string {
    return JSON.stringify(params);
  }

  deserialize(data: string): EffectParameters {
    try {
      return JSON.parse(data);
    } catch {
      return this.getDefaultParameters();
    }
  }

  clone(): IEffect {
    return new Pattern();
  }

  async process(
    input: ImageData | HTMLCanvasElement,
    parameters: EffectParameters,
    context: EffectContext
  ): Promise<ImageData | HTMLCanvasElement> {
    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d')!;

    // Set dimensions from context
    outputCanvas.width = context.dimensions.width;
    outputCanvas.height = context.dimensions.height;

    // Draw input first
    if (input instanceof ImageData) {
      outputCtx.putImageData(input, 0, 0);
    } else {
      outputCtx.drawImage(input, 0, 0);
    }

    // Apply pattern on top
    await this.render(
      { ...context, canvas: outputCanvas, ctx: outputCtx },
      parameters
    );

    return outputCanvas;
  }

  getAnimatableParameters(): string[] {
    return [
      'size',
      'spacing',
      'rotation',
      'opacity',
      'primaryColor',
      'secondaryColor',
      'strokeWidth',
    ];
  }

  canChainWith(effect: IEffect): boolean {
    // Pattern effects can chain with most other effects
    return ['color', 'distortion', 'filter', 'composition'].includes(
      effect.metadata.category
    );
  }

  getSupportedBlendModes(): BlendMode[] {
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

  supportsMasking(): boolean {
    return true;
  }

  canCache(params: EffectParameters): boolean {
    // Can cache if not animated and no audio reactivity
    return !params.audioReactive && params.animated !== true;
  }

  estimateComplexity(
    params: EffectParameters,
    context: EffectContext
  ): ComplexityLevel {
    const size = params.size || 10;
    const spacing = params.spacing || 20;
    const totalSize = size + spacing;
    const width = context?.dimensions?.width || 800;
    const height = context?.dimensions?.height || 600;
    const pixelCount = width * height;
    const patternCount = pixelCount / (totalSize * totalSize);

    // Factor in pattern complexity and count
    if (patternCount > 10000 || totalSize < 5) return 'extreme';
    if (patternCount > 5000 || totalSize <= 10) return 'high';
    if (patternCount > 1000 || totalSize < 20) return 'medium';
    return 'low';
  }

  dispose(): void {
    this.cachedPattern = null;
    this.lastParams = '';
  }
}
