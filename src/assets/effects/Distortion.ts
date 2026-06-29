import {
  BlendMode,
  ComplexityLevel,
  EffectContext,
  EffectMetadata,
  EffectParameters,
  IEffect,
  ParameterDescriptor,
  ValidationResult,
} from './IEffect';
import { DistortionProcessor } from './processors/DistortionProcessor';
import { FilterProcessor } from './processors/FilterProcessor';
import type { ProcessingContext } from './processors/IEffectProcessor';
import { NoiseProcessor } from './processors/NoiseProcessor';
import { WaveformProcessor } from './processors/WaveformProcessor';
import {
  defaultDistortionParameters,
  validateDistortionParameters,
} from './utils/distortionDefaults';
import { distortionParameterDescriptors } from './utils/distortionDescriptors';

export class Distortion implements IEffect {
  readonly metadata: EffectMetadata = {
    type: 'distortion',
    displayName: 'Distortion',
    description:
      'Creates visual distortions including wave, ripple, and twist effects',
    version: '1.0.0',
    category: 'distortion',
  };

  get defaultParameters(): EffectParameters {
    return this.getDefaultParameters();
  }

  private processors: {
    distortion: DistortionProcessor;
    waveform: WaveformProcessor;
    noise: NoiseProcessor;
    filter: FilterProcessor;
  };

  constructor(processors?: Partial<Distortion['processors']>) {
    this.processors = {
      distortion: processors?.distortion ?? new DistortionProcessor(),
      waveform: processors?.waveform ?? new WaveformProcessor(),
      noise: processors?.noise ?? new NoiseProcessor(),
      filter: processors?.filter ?? new FilterProcessor(),
    };
  }

  getDefaultParameters(): EffectParameters {
    return defaultDistortionParameters;
  }

  getParameterDescriptors(): ParameterDescriptor[] {
    return distortionParameterDescriptors;
  }

  validateParameters(params: EffectParameters): ValidationResult {
    return validateDistortionParameters(params);
  }

  async render(
    context: EffectContext,
    params: EffectParameters
  ): Promise<void> {
    if (!params.enabled) return;

    const ctx = context.ctx as CanvasRenderingContext2D;
    const { width, height } = context.dimensions;

    const input = ctx.getImageData(0, 0, width, height);
    const pctx: ProcessingContext = { width, height, time: context.time };

    let out: ImageData;
    switch (params.distortionType) {
      case 'wave':
        out = this.processors.distortion.processWave(
          input,
          pctx,
          params as any
        );
        break;
      case 'ripple':
        out = this.processors.waveform.processRipple(
          input,
          pctx,
          params as any
        );
        break;
      case 'twist':
        out = this.processors.noise.processTwist(input, pctx, params as any);
        break;
      case 'swirl':
        out = this.processors.noise.processSwirl(input, pctx, params as any);
        break;
      case 'bulge':
        out = this.processors.filter.processBulge(input, pctx, params as any);
        break;
      case 'pinch':
        out = this.processors.filter.processPinch(input, pctx, params as any);
        break;
      default:
        out = input;
    }

    ctx.putImageData(out, 0, 0);
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

  async process(
    input: ImageData | HTMLCanvasElement,
    parameters: EffectParameters,
    context: EffectContext
  ): Promise<ImageData | HTMLCanvasElement> {
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d')!;

    outputCanvas.width = context.dimensions.width;
    outputCanvas.height = context.dimensions.height;

    if (input instanceof ImageData) {
      outputCtx.putImageData(input, 0, 0);
    } else {
      outputCtx.drawImage(input, 0, 0);
    }

    await this.render(
      { ...context, canvas: outputCanvas, ctx: outputCtx },
      parameters
    );

    return outputCanvas;
  }

  getAnimatableParameters(): string[] {
    return this.getParameterDescriptors()
      .filter(d => d.animatable)
      .map(d => d.key);
  }

  canChainWith(effect: IEffect): boolean {
    return effect.metadata.category !== 'distortion';
  }

  getSupportedBlendModes(): BlendMode[] {
    return [
      'normal',
      'multiply',
      'screen',
      'overlay',
      'soft-light',
      'hard-light',
    ];
  }

  supportsMasking(): boolean {
    return true;
  }

  canCache(params: EffectParameters): boolean {
    // Cannot cache animated distortions
    return params.speed === 0 || params.speed === undefined;
  }

  estimateComplexity(
    params: EffectParameters,
    context: EffectContext
  ): ComplexityLevel {
    const px = context.dimensions.width * context.dimensions.height;
    const a = params.amplitude ?? 20;
    const f = params.frequency ?? 0.05;
    const c = px * f * a;
    return c > 1_000_000
      ? 'extreme'
      : c > 500_000
        ? 'high'
        : c > 100_000
          ? 'medium'
          : 'low';
  }

  dispose(): void {
    /* no-op for orchestration-only implementation */
  }
}
