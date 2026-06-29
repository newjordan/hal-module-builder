import { EffectParameters } from '../IEffect';
import { bulgeFactor, pinchFactor, radialAmount } from '../utils/filter';
import { ProcessingContext } from './IEffectProcessor';

export class FilterProcessor {
  // Reuse an output buffer to minimize per-frame allocations across filters
  private cachedOut: ImageData | null = null;
  private cachedW = 0;
  private cachedH = 0;

  processBulge(
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

    const centerX = width * (params.centerX ?? 0.5);
    const centerY = height * (params.centerY ?? 0.5);
    const radius = params.radius ?? 200;
    const strength = (params.amplitude ?? 20) * (params.intensity ?? 1) * 0.01;

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
          const amount = radialAmount(dx, dy, radius, 2);
          const bulge = bulgeFactor(strength, amount);

          const sourceX = Math.round(centerX + dx / bulge);
          const sourceY = Math.round(centerY + dy / bulge);

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

  processPinch(
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

    const centerX = width * (params.centerX ?? 0.5);
    const centerY = height * (params.centerY ?? 0.5);
    const radius = params.radius ?? 200;
    const strength = (params.amplitude ?? 20) * (params.intensity ?? 1) * 0.01;

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
          const amount = radialAmount(dx, dy, radius, 2);
          const pinch = pinchFactor(strength, amount);

          const sourceX = Math.round(centerX + dx * pinch);
          const sourceY = Math.round(centerY + dy * pinch);

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
