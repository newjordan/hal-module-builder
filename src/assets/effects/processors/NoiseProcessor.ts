import { EffectParameters } from '../IEffect';
import { animatedTwist as computeAnimatedTwist } from '../utils/noise';
import { ProcessingContext } from './IEffectProcessor';

export class NoiseProcessor {
  // Reuse an output buffer to minimize per-frame allocations across noise ops
  private cachedOut: ImageData | null = null;
  private cachedW = 0;
  private cachedH = 0;

  processTwist(
    input: ImageData,
    ctx: ProcessingContext,
    params: EffectParameters & {
      centerX?: number;
      centerY?: number;
      radius?: number;
      twist?: number;
    }
  ): ImageData {
    const width = ctx.width;
    const height = ctx.height;

    const centerX = width * (params.centerX ?? 0.5);
    const centerY = height * (params.centerY ?? 0.5);
    const radius = params.radius ?? 200;
    const twist = params.twist ?? 1;
    const animated = computeAnimatedTwist(
      twist,
      params.intensity,
      ctx.time,
      params.speed,
      0.5
    );

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
          const angle = Math.atan2(dy, dx);
          const newAngle = angle + animated * amount;

          const sourceX = Math.round(centerX + distance * Math.cos(newAngle));
          const sourceY = Math.round(centerY + distance * Math.sin(newAngle));

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

  processSwirl(
    input: ImageData,
    ctx: ProcessingContext,
    params: EffectParameters & {
      centerX?: number;
      centerY?: number;
      radius?: number;
      twist?: number;
    }
  ): ImageData {
    const width = ctx.width;
    const height = ctx.height;

    const centerX = width * (params.centerX ?? 0.5);
    const centerY = height * (params.centerY ?? 0.5);
    const radius = params.radius ?? 200;
    const twist = params.twist ?? 2;
    const animated = computeAnimatedTwist(
      twist,
      params.intensity,
      ctx.time,
      params.speed,
      Math.PI
    );

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
          const percent = (radius - distance) / radius;
          const theta = percent * percent * animated;
          const angle = Math.atan2(dy, dx);
          const newAngle = angle + theta;

          const sourceX = Math.round(centerX + distance * Math.cos(newAngle));
          const sourceY = Math.round(centerY + distance * Math.sin(newAngle));

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
