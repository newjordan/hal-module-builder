import { Distortion } from '../../Distortion';
import { NoiseProcessor } from '../NoiseProcessor';
import { EffectContext, EffectParameters } from '../../IEffect';

function createSampleCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Quadrant colors
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fa8072';
  ctx.fillRect(0, 0, w / 2, h / 2);
  ctx.fillStyle = '#90ee90';
  ctx.fillRect(w / 2, 0, w / 2, h / 2);
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, h / 2, w / 2, h / 2);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
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

describe('NoiseProcessor parity with Distortion', () => {
  it('matches Distortion output for twist', async () => {
    const width = 32,
      height = 32;
    const { canvas, ctx } = createSampleCanvas(width, height);

    const effect = new Distortion();
    const params: EffectParameters = {
      enabled: true,
      intensity: 1,
      opacity: 1,
      distortionType: 'twist',
      centerX: 0.5,
      centerY: 0.5,
      radius: 14,
      twist: 1.2,
      speed: 0.8,
    };

    const inputData = ctx.getImageData(0, 0, width, height);
    const time = 1200;

    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time,
    };
    await effect.render(effectContext, params);
    const expected = ctx.getImageData(0, 0, width, height);

    const proc = new NoiseProcessor();
    const actual = proc.processTwist(
      inputData,
      { width, height, time },
      params
    );

    expect(equalImageData(actual, expected)).toBe(true);
  });

  it('matches Distortion output for swirl', async () => {
    const width = 32,
      height = 32;
    const { canvas, ctx } = createSampleCanvas(width, height);

    const effect = new Distortion();
    const params: EffectParameters = {
      enabled: true,
      intensity: 1,
      opacity: 1,
      distortionType: 'swirl',
      centerX: 0.45,
      centerY: 0.55,
      radius: 16,
      twist: 2.2,
      speed: 1.6,
    };

    const inputData = ctx.getImageData(0, 0, width, height);
    const time = 640;

    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time,
    };
    await effect.render(effectContext, params);
    const expected = ctx.getImageData(0, 0, width, height);

    const proc = new NoiseProcessor();
    const actual = proc.processSwirl(
      inputData,
      { width, height, time },
      params
    );

    expect(equalImageData(actual, expected)).toBe(true);
  });
});
