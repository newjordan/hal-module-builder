import { Distortion } from '../../Distortion';
import { FilterProcessor } from '../FilterProcessor';
import { EffectContext, EffectParameters } from '../../IEffect';

function createSampleCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // stripes
  for (let x = 0; x < w; x++) {
    ctx.fillStyle = x % 2 === 0 ? '#000' : '#fff';
    ctx.fillRect(x, 0, 1, h);
  }
  return { canvas, ctx };
}

function equalImageData(a: ImageData, b: ImageData): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  const da = a.data,
    db = b.data;
  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) return false;
  }
  return true;
}

describe('FilterProcessor parity with Distortion', () => {
  it('matches Distortion output for bulge', async () => {
    const width = 32,
      height = 32;
    const { canvas, ctx } = createSampleCanvas(width, height);

    const effect = new Distortion();
    const params: EffectParameters = {
      enabled: true,
      intensity: 1,
      opacity: 1,
      distortionType: 'bulge',
      centerX: 0.5,
      centerY: 0.5,
      radius: 12,
      amplitude: 15,
    };

    const inputData = ctx.getImageData(0, 0, width, height);

    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time: 0,
    };
    await effect.render(effectContext, params);
    const expected = ctx.getImageData(0, 0, width, height);

    const proc = new FilterProcessor();
    const actual = proc.processBulge(inputData, { width, height }, params);

    expect(equalImageData(actual, expected)).toBe(true);
  });

  it('matches Distortion output for pinch', async () => {
    const width = 32,
      height = 32;
    const { canvas, ctx } = createSampleCanvas(width, height);

    const effect = new Distortion();
    const params: EffectParameters = {
      enabled: true,
      intensity: 1,
      opacity: 1,
      distortionType: 'pinch',
      centerX: 0.52,
      centerY: 0.48,
      radius: 10,
      amplitude: 12,
    };

    const inputData = ctx.getImageData(0, 0, width, height);

    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time: 0,
    };
    await effect.render(effectContext, params);
    const expected = ctx.getImageData(0, 0, width, height);

    const proc = new FilterProcessor();
    const actual = proc.processPinch(inputData, { width, height }, params);

    expect(equalImageData(actual, expected)).toBe(true);
  });
});
