import { Distortion } from '../../Distortion';
import { WaveformProcessor } from '../WaveformProcessor';
import { EffectContext, EffectParameters } from '../../IEffect';

function createSampleCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Checker pattern
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      ctx.fillStyle = (x + y) % 8 === 0 ? '#000' : '#fff';
      ctx.fillRect(x, y, 4, 4);
    }
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

describe('WaveformProcessor (ripple) parity with Distortion', () => {
  it('matches Distortion output for ripple', async () => {
    const width = 32,
      height = 32;
    const { canvas, ctx } = createSampleCanvas(width, height);

    const effect = new Distortion();
    const params: EffectParameters = {
      enabled: true,
      intensity: 1,
      opacity: 1,
      distortionType: 'ripple',
      amplitude: 6,
      frequency: 0.12,
      speed: 1.3,
      phase: 0.1,
      centerX: 0.4,
      centerY: 0.6,
      radius: 18,
    };

    const inputData = ctx.getImageData(0, 0, width, height);

    const effectContext: EffectContext = {
      canvas,
      ctx,
      dimensions: { width, height },
      time: 833,
    };

    await effect.render(effectContext, params);
    const expected = ctx.getImageData(0, 0, width, height);

    const proc = new WaveformProcessor();
    const actual = proc.processRipple(
      inputData,
      { width, height, time: 833 },
      params
    );

    expect(equalImageData(actual, expected)).toBe(true);
  });
});
