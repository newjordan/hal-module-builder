import {
  IEffect,
  EffectParameters,
  ValidationResult,
  BlendMode,
  EffectContext,
  ComplexityLevel
} from '../effects/IEffect';

/**
 * Base class providing default implementations for common IEffect methods
 */
export abstract class BaseLayerEffect implements IEffect {
  abstract readonly metadata: any;
  abstract readonly defaultParameters: EffectParameters;
  abstract getParameterDescriptors(): any[];
  abstract process(
    input: HTMLCanvasElement | ImageData,
    parameters: EffectParameters,
    context: EffectContext
  ): Promise<HTMLCanvasElement | ImageData>;

  validateParameters(_params: EffectParameters): ValidationResult {
    // Default: accept all parameters
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  getAnimatableParameters(): string[] {
    return this.getParameterDescriptors()
      .filter(d => d.animatable)
      .map(d => d.key);
  }

  canChainWith(_effect: IEffect): boolean {
    return true;
  }

  getSupportedBlendModes(): BlendMode[] {
    return ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light'];
  }

  supportsMasking(): boolean {
    return true;
  }

  canCache(params: EffectParameters): boolean {
    return !params.time;
  }

  estimateComplexity(_params: EffectParameters, _context: EffectContext): ComplexityLevel {
    return 'medium';
  }

  dispose(): void {
    // Default: no cleanup needed
  }

  /**
   * Helper to convert ImageData to Canvas
   */
  protected imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Helper to ensure we have a 2D rendering context
   */
  protected ensure2DContext(ctx: CanvasRenderingContext2D | WebGLRenderingContext): CanvasRenderingContext2D {
    if (!('drawImage' in ctx)) {
      throw new Error(`${this.metadata.type} requires 2D rendering context`);
    }
    return ctx as CanvasRenderingContext2D;
  }
}