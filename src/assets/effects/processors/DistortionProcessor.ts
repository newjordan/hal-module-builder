import { EffectParameters } from '../IEffect';
import { clamp, roundToInt } from '../utils';
import { ProcessingContext } from './IEffectProcessor';

// Optional DI: external wave algorithms can be supplied; defaults preserve current behavior
export type WaveDirection = 'horizontal' | 'vertical' | 'diagonal' | 'radial';
export type WaveParams = EffectParameters & {
  direction?: WaveDirection;
  centerX?: number;
  centerY?: number;
};
export type WaveAlgoFn = (
  x: number,
  y: number,
  width: number,
  height: number,
  params: WaveParams,
  amplitude: number,
  frequency: number,
  phase: number
) => { sourceX: number; sourceY: number };
export type WaveAlgorithms = {
  horizontal: WaveAlgoFn;
  vertical: WaveAlgoFn;
  diagonal: WaveAlgoFn;
  radial: WaveAlgoFn;
};

const defaultWaveAlgorithms: WaveAlgorithms = {
  horizontal: (x, y, _w, _h, _p, amplitude, frequency, phase) => ({
    sourceX: x + Math.sin(y * frequency + phase) * amplitude,
    sourceY: y,
  }),
  vertical: (x, y, _w, _h, _p, amplitude, frequency, phase) => ({
    sourceX: x,
    sourceY: y + Math.sin(x * frequency + phase) * amplitude,
  }),
  diagonal: (x, y, _w, _h, _p, amplitude, frequency, phase) => {
    const diag = (x + y) * frequency;
    return {
      sourceX: x + Math.sin(diag + phase) * amplitude * 0.7,
      sourceY: y + Math.cos(diag + phase) * amplitude * 0.7,
    };
  },
  radial: (x, y, width, height, params, amplitude, frequency, phase) => {
    const cx = width * (params.centerX ?? 0.5);
    const cy = height * (params.centerY ?? 0.5);
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const offset = Math.sin(dist * frequency + phase) * amplitude;
    return {
      sourceX: x + Math.cos(angle) * offset,
      sourceY: y + Math.sin(angle) * offset,
    };
  },
};

export class DistortionProcessor {
  private algorithms: WaveAlgorithms;
  // Simple per-instance output buffer cache to reduce allocations across frames
  private cachedOut: ImageData | null = null;
  private cachedW = 0;
  private cachedH = 0;

  constructor(algorithms?: Partial<WaveAlgorithms>) {
    this.algorithms = {
      ...defaultWaveAlgorithms,
      ...(algorithms ?? {}),
    } as WaveAlgorithms;
  }

  processWave(
    input: ImageData,
    ctx: ProcessingContext,
    params: EffectParameters & {
      direction?: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
      centerX?: number;
      centerY?: number;
    }
  ): ImageData {
    const width = ctx.width;
    const height = ctx.height;

    const amplitude = (params.amplitude ?? 20) * (params.intensity ?? 1);
    const frequency = params.frequency ?? 0.05;
    const speed = params.speed ?? 1;
    const phase = (params.phase ?? 0) + (ctx.time ?? 0) * speed * 0.001;
    const direction = params.direction ?? 'horizontal';

    // Reuse output buffer when dimensions match to reduce GC pressure
    if (!this.cachedOut || this.cachedW !== width || this.cachedH !== height) {
      this.cachedOut = new ImageData(width, height);
      this.cachedW = width;
      this.cachedH = height;
    }
    const destData = this.cachedOut;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sourceX = x;
        let sourceY = y;

        {
          const algo = this.algorithms[direction];
          const out = algo(
            x,
            y,
            width,
            height,
            params,
            amplitude,
            frequency,
            phase
          );
          sourceX = out.sourceX;
          sourceY = out.sourceY;
        }

        // Clamp/round via utils
        sourceX = clamp(roundToInt(sourceX), 0, width - 1);
        sourceY = clamp(roundToInt(sourceY), 0, height - 1);

        const sourceIdx = (sourceY * width + sourceX) * 4;
        const destIdx = (y * width + x) * 4;

        destData.data[destIdx] = input.data[sourceIdx] ?? 0;
        destData.data[destIdx + 1] = input.data[sourceIdx + 1] ?? 0;
        destData.data[destIdx + 2] = input.data[sourceIdx + 2] ?? 0;
        destData.data[destIdx + 3] = input.data[sourceIdx + 3] ?? 255;
      }
    }

    return destData;
  }
}
