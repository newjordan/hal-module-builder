import { EffectParameters } from '../IEffect';
import { normalizeWaveformParams } from '../utils/waveform';
import { ProcessingContext } from './IEffectProcessor';

export class WaveformProcessor {
  // Reuse an output buffer to minimize per-frame allocations
  private cachedOut: ImageData | null = null;
  private cachedW = 0;
  private cachedH = 0;

  processRipple(
    input: ImageData,
    ctx: ProcessingContext,
    params: EffectParameters & {
      centerX?: number;
      centerY?: number;
      radius?: number;
    }
  ): ImageData {
    const width = ctx.width;
    const height = ctx.height;

    const norm = normalizeWaveformParams(width, height, params);
    const centerX = width * norm.centerX;
    const centerY = height * norm.centerY;
    const amplitude = norm.amplitude;
    const frequency = norm.frequency;
    const speed = norm.speed;
    const phase = norm.phase + (ctx.time ?? 0) * speed * 0.001;
    const radius = norm.radius;

    if (!this.cachedOut || this.cachedW !== width || this.cachedH !== height) {
      this.cachedOut = new ImageData(width, height);
      this.cachedW = width;
      this.cachedH = height;
    }
    const destData = this.cachedOut;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < radius) {
          const amount = (radius - distance) / radius;
          const ripple =
            Math.sin(distance * frequency - phase) * amplitude * amount;
          const angle = Math.atan2(dy, dx);

          const sourceX = Math.round(x + Math.cos(angle) * ripple);
          const sourceY = Math.round(y + Math.sin(angle) * ripple);

          if (
            sourceX >= 0 &&
            sourceX < width &&
            sourceY >= 0 &&
            sourceY < height
          ) {
            const sourceIdx = (sourceY * width + sourceX) * 4;
            const destIdx = (y * width + x) * 4;

            destData.data[destIdx] = input.data[sourceIdx] ?? 0;
            destData.data[destIdx + 1] = input.data[sourceIdx + 1] ?? 0;
            destData.data[destIdx + 2] = input.data[sourceIdx + 2] ?? 0;
            destData.data[destIdx + 3] = input.data[sourceIdx + 3] ?? 255;
          }
        } else {
          const idx = (y * width + x) * 4;
          destData.data[idx] = input.data[idx] ?? 0;
          destData.data[idx + 1] = input.data[idx + 1] ?? 0;
          destData.data[idx + 2] = input.data[idx + 2] ?? 0;
          destData.data[idx + 3] = input.data[idx + 3] ?? 255;
        }
      }
    }

    return destData;
  }
}
