import { Distortion } from '../../Distortion';
import { DistortionProcessor } from '../DistortionProcessor';
import { EffectContext, EffectParameters } from '../../IEffect';

function createSampleCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Simple deterministic pattern
  ctx.fillStyle = '#112233';
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

function equalImageData(a: ImageData, b: ImageData): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  const da = a.data,
    db = b.data;
  for (let i = 0; i < da.length; i++) {
    if (da[i] !== db[i]) return false;
  }
  return true;
}

describe('DistortionProcessor (wave variants) parity with Distortion', () => {
  const directions: Array<'horizontal' | 'vertical' | 'diagonal' | 'radial'> = [
    'horizontal',
    'vertical',
    'diagonal',
    'radial',
  ];

  it.each(directions)('matches Distortion output for %s', async dir => {
    const width = 32,
      height = 32;
    const { canvas, ctx } = createSampleCanvas(width, height);

    const effect = new Distortion();
    const params: EffectParameters = {
      enabled: true,
      intensity: 1,
      opacity: 1,
      distortionType: 'wave',
      amplitude: 8,
      frequency: 0.1,
      speed: 1,
      phase: 0.3,
      direction: dir,
      centerX: 0.5,
      centerY: 0.5,
    };

    const inputData = ctx.getImageData(0, 0, width, height);

    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time: 1000,
    };

    await effect.render(effectContext, params);
    const expected = ctx.getImageData(0, 0, width, height);

    const proc = new DistortionProcessor();
    const actual = proc.processWave(
      inputData,
      { width, height, time: 1000 },
      params
    );

    expect(equalImageData(actual, expected)).toBe(true);
  });
});
