/**
 * Effect Chain Implementation
 * Manages processing multiple effects in sequence
 * Story 1.3d: Effects Asset System
 */

import {
  BlendMode,
  ComplexityLevel,
  EffectChain,
  EffectContext,
  EffectParameters,
  IEffect,
  Mask,
} from '../IEffect';

export interface ChainedEffect {
  effect: IEffect;
  parameters: EffectParameters;
  blendMode: BlendMode;
  opacity: number;
  mask?: Mask;
  enabled: boolean;
}

/**
 * Implementation of effect chain processing
 */
export class EffectChainProcessor implements EffectChain {
  public readonly id: string;
  public effects: ChainedEffect[] = [];

  private canvasPool: HTMLCanvasElement[] = [];
  private maxPoolSize: number = 5;

  constructor(id?: string) {
    this.id =
      id || `chain_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  async process(
    input: ImageData | HTMLCanvasElement,
    context: EffectContext
  ): Promise<ImageData | HTMLCanvasElement> {
    if (this.effects.length === 0) {
      return input;
    }

    let currentInput = input;

    // Process each effect in sequence
    for (let i = 0; i < this.effects.length; i++) {
      const chainedEffect = this.effects[i];

      // Type guard: ensure chainedEffect exists
      if (!chainedEffect || !chainedEffect.enabled) {
        continue;
      }

      try {
        // Create context for this effect
        const effectContext: EffectContext = {
          ...context,
          chain: this,
        };

        // Process the effect - chainedEffect is guaranteed to exist here
        const effectOutput = await chainedEffect.effect.process(
          currentInput,
          chainedEffect.parameters,
          effectContext
        );

        // Apply blending and opacity if not the final effect or if custom blending is required
        // chainedEffect is guaranteed to exist and be enabled here
        if (
          i < this.effects.length - 1 ||
          chainedEffect.blendMode !== 'normal' ||
          chainedEffect.opacity !== 1
        ) {
          currentInput = this.blendEffectOutput(
            currentInput,
            effectOutput,
            chainedEffect,
            context
          );
        } else {
          currentInput = effectOutput;
        }
      } catch (error) {
        console.error(
          `Error processing effect ${i} in chain ${this.id}:`,
          error
        );
        // Continue with previous input on error
        continue;
      }
    }

    return currentInput;
  }

  addEffect(effect: IEffect, position?: number): void {
    const chainedEffect: ChainedEffect = {
      effect,
      parameters: { ...effect.defaultParameters },
      blendMode: 'normal',
      opacity: 1,
      enabled: true,
    };

    if (
      position !== undefined &&
      position >= 0 &&
      position < this.effects.length
    ) {
      this.effects.splice(position, 0, chainedEffect);
    } else {
      this.effects.push(chainedEffect);
    }

    console.log(`Added effect ${effect.metadata.type} to chain ${this.id}`);
  }

  removeEffect(effectId: string): void {
    const initialLength = this.effects.length;
    this.effects = this.effects.filter(
      ce => ce.effect.metadata.type !== effectId
    );

    if (this.effects.length < initialLength) {
      console.log(`Removed effect ${effectId} from chain ${this.id}`);
    }
  }

  reorderEffects(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.effects.length ||
      toIndex < 0 ||
      toIndex >= this.effects.length
    ) {
      throw new Error('Invalid effect indices for reordering');
    }

    const [movedEffect] = this.effects.splice(fromIndex, 1);
    // Type guard: ensure movedEffect exists
    if (movedEffect) {
      this.effects.splice(toIndex, 0, movedEffect);
    }

    console.log(
      `Reordered effect from index ${fromIndex} to ${toIndex} in chain ${this.id}`
    );
  }

  getComplexity(context: EffectContext): ComplexityLevel {
    let totalComplexity = 0;
    const complexityWeights = { low: 1, medium: 2, high: 3, extreme: 4 };

    for (const chainedEffect of this.effects) {
      if (chainedEffect.enabled) {
        const effectComplexity = chainedEffect.effect.estimateComplexity(
          chainedEffect.parameters,
          context
        );
        totalComplexity += complexityWeights[effectComplexity];
      }
    }

    // Determine overall complexity based on total
    if (totalComplexity >= 10) return 'extreme';
    if (totalComplexity >= 6) return 'high';
    if (totalComplexity >= 3) return 'medium';
    return 'low';
  }

  dispose(): void {
    // Dispose all effects
    for (const chainedEffect of this.effects) {
      try {
        chainedEffect.effect.dispose();
      } catch (error) {
        console.warn(`Error disposing effect in chain ${this.id}:`, error);
      }
    }

    // Clean up canvas pool
    this.canvasPool.length = 0;
    this.effects.length = 0;

    console.log(`Disposed effect chain ${this.id}`);
  }

  /**
   * Blend effect output with previous result
   */
  private blendEffectOutput(
    baseInput: ImageData | HTMLCanvasElement,
    effectOutput: ImageData | HTMLCanvasElement,
    chainedEffect: ChainedEffect,
    context: EffectContext
  ): HTMLCanvasElement {
    const canvas = this.getCanvasFromPool(
      context.dimensions.width,
      context.dimensions.height
    );
    const ctx = canvas.getContext('2d')!;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base input
    if (baseInput instanceof HTMLCanvasElement) {
      ctx.drawImage(baseInput, 0, 0);
    } else {
      ctx.putImageData(baseInput, 0, 0);
    }

    // Prepare effect output on its own canvas to optionally apply masking
    const effectCanvas = this.getCanvasFromPool(
      context.dimensions.width,
      context.dimensions.height
    );
    const effectCtx = effectCanvas.getContext('2d')!;

    // Draw effect output onto isolated canvas
    if (effectOutput instanceof HTMLCanvasElement) {
      effectCtx.drawImage(effectOutput, 0, 0);
    } else {
      effectCtx.putImageData(effectOutput, 0, 0);
    }

    // If masking is requested and supported by the effect, apply a simple shape mask
    if (chainedEffect.mask && chainedEffect.effect.supportsMasking()) {
      const invert = !!chainedEffect.mask.invert;
      effectCtx.save();
      effectCtx.globalCompositeOperation = invert
        ? 'destination-out'
        : 'destination-in';

      // Currently support basic circular/rect shape masks for compatibility
      const w = context.dimensions.width;
      const h = context.dimensions.height;
      const cfg: any = chainedEffect.mask.config || {};
      const shape: string = (cfg.shape || 'circle').toString();
      effectCtx.beginPath();
      if (shape === 'rect') {
        const x = cfg.x ?? 0;
        const y = cfg.y ?? 0;
        const mw = cfg.width ?? w;
        const mh = cfg.height ?? h;
        effectCtx.rect(x, y, mw, mh);
      } else {
        // default circle mask centered
        const cx = cfg.cx ?? w / 2;
        const cy = cfg.cy ?? h / 2;
        const r = cfg.radius ?? Math.min(w, h) / 3;
        effectCtx.arc(cx, cy, r, 0, Math.PI * 2);
      }
      effectCtx.fillStyle = '#fff';
      effectCtx.fill();
      effectCtx.restore();
    }

    // Now composite base input with (optionally masked) effect output
    ctx.globalCompositeOperation = this.getCompositeOperation(
      chainedEffect.blendMode
    ) as GlobalCompositeOperation;
    ctx.globalAlpha = chainedEffect.opacity;
    ctx.drawImage(effectCanvas, 0, 0);

    // Reset context
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    // Return temp effect canvas to pool
    this.returnCanvasToPool(effectCanvas);

    return canvas;
  }

  /**
   * Get canvas from pool or create new one
   */
  private getCanvasFromPool(width: number, height: number): HTMLCanvasElement {
    let canvas = this.canvasPool.pop();

    if (!canvas) {
      canvas = document.createElement('canvas');
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    return canvas;
  }

  /**
   * Return canvas to pool for reuse
   */
  private returnCanvasToPool(canvas: HTMLCanvasElement): void {
    if (this.canvasPool.length < this.maxPoolSize) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      this.canvasPool.push(canvas);
    }
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
   * Get chain summary for debugging
   */
  public getSummary(): {
    id: string;
    effectCount: number;
    enabledCount: number;
    effects: string[];
    complexity: ComplexityLevel | null;
  } {
    return {
      id: this.id,
      effectCount: this.effects.length,
      enabledCount: this.effects.filter(e => e.enabled).length,
      effects: this.effects.map(e => e.effect.metadata.type),
      complexity: null, // Would need context to calculate
    };
  }

  /**
   * Update parameters for specific effect in chain
   */
  public updateEffectParameters(
    effectType: string,
    parameters: Partial<EffectParameters>
  ): boolean {
    const chainedEffect = this.effects.find(
      ce => ce.effect.metadata.type === effectType
    );
    if (!chainedEffect) {
      return false;
    }

    // Validate parameters - chainedEffect is guaranteed to exist here
    const validation = chainedEffect.effect.validateParameters({
      ...chainedEffect.parameters,
      ...parameters,
    });

    if (!validation.isValid) {
      console.error(
        `Invalid parameters for effect ${effectType}:`,
        validation.errors
      );
      return false;
    }

    // Update parameters
    chainedEffect.parameters = { ...chainedEffect.parameters, ...parameters };
    return true;
  }

  /**
   * Set effect enabled/disabled state
   */
  public setEffectEnabled(effectType: string, enabled: boolean): boolean {
    const chainedEffect = this.effects.find(
      ce => ce.effect.metadata.type === effectType
    );
    if (!chainedEffect) {
      return false;
    }

    // chainedEffect is guaranteed to exist here
    chainedEffect.enabled = enabled;
    return true;
  }
}

/**
 * Factory function to create effect chain
 */
export function createEffectChain(id?: string): EffectChainProcessor {
  return new EffectChainProcessor(id);
}
