import { Distortion } from '../../Distortion';
import { WaveformProcessor } from '../WaveformProcessor';
import { FilterProcessor } from '../FilterProcessor';
import { NoiseProcessor } from '../NoiseProcessor';
import { EffectContext, EffectParameters } from '../../IEffect';

function createCanvasPatternA(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // quadrant colors
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, w / 2, h / 2);
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(w / 2, 0, w / 2, h / 2);
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, h / 2, w / 2, h / 2);
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
  return { canvas, ctx };
}

function createCanvasPatternB(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // stripes
  for (let y = 0; y < h; y++) {
    ctx.fillStyle = y % 2 === 0 ? '#000' : '#fff';
    ctx.fillRect(0, y, w, 1);
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

describe('Processor integration: sequential effects parity with Distortion', () => {
  it('ripple -> bulge matches Distortion sequential renders', async () => {
    const width = 40,
      height = 40;
    const { canvas, ctx } = createCanvasPatternA(width, height);

    // Baseline using Distortion twice
    const effect = new Distortion();
    const rippleParams: EffectParameters = {
      enabled: true,
      opacity: 1,
      intensity: 1,
      distortionType: 'ripple',
      amplitude: 6,
      frequency: 0.12,
      speed: 1.1,
      phase: 0.2,
      centerX: 0.5,
      centerY: 0.5,
      radius: 16,
    } as any;
    const bulgeParams: EffectParameters = {
      enabled: true,
      opacity: 1,
      intensity: 1,
      distortionType: 'bulge',
      amplitude: 14,
      centerX: 0.48,
      centerY: 0.52,
      radius: 14,
    } as any;

    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time: 900,
    };
    await effect.render(effectContext, rippleParams);
    await effect.render(effectContext, bulgeParams);
    const expected = ctx.getImageData(0, 0, width, height);

    // Processor pipeline: Waveform(ripple) -> Filter(bulge)
    const inputData = ctx.getImageData(0, 0, width, height); // after baseline, reset by redrawing
    // Recreate original input for fair comparison
    const reset = createCanvasPatternA(width, height);
    const baseInput = reset.ctx.getImageData(0, 0, width, height);

    const wave = new WaveformProcessor();
    const afterRipple = wave.processRipple(
      baseInput,
      { width, height, time: 900 },
      rippleParams
    );

    const filter = new FilterProcessor();
    const actual = filter.processBulge(
      afterRipple,
      { width, height },
      bulgeParams
    );

    expect(equalImageData(actual, expected)).toBe(true);
  });

  it('twist -> swirl matches Distortion sequential renders', async () => {
    const width = 36,
      height = 36;
    const { canvas, ctx } = createCanvasPatternB(width, height);

    const effect = new Distortion();
    const twistParams: EffectParameters = {
      enabled: true,
      opacity: 1,
      intensity: 1,
      distortionType: 'twist',
      centerX: 0.5,
      centerY: 0.5,
      radius: 14,
      twist: 1.4,
      speed: 0.7,
    } as any;
    const swirlParams: EffectParameters = {
      enabled: true,
      opacity: 1,
      intensity: 1,
      distortionType: 'swirl',
      centerX: 0.5,
      centerY: 0.5,
      radius: 16,
      twist: 2.0,
      speed: 1.2,
    } as any;

    const time = 1333;
    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time,
    };
    await effect.render(effectContext, twistParams);
    await effect.render(effectContext, swirlParams);
    const expected = ctx.getImageData(0, 0, width, height);

    // Recreate original input
    const reset = createCanvasPatternB(width, height);
    const baseInput = reset.ctx.getImageData(0, 0, width, height);

    const noise = new NoiseProcessor();
    const afterTwist = noise.processTwist(
      baseInput,
      { width, height, time },
      twistParams
    );
    const actual = noise.processSwirl(
      afterTwist,
      { width, height, time },
      swirlParams
    );

    expect(equalImageData(actual, expected)).toBe(true);
  });
});
