import { Distortion } from '../Distortion';
import { EffectContext, EffectParameters } from '../IEffect';
import { detectMemoryLeaks } from '../../../test-utils/test-helpers';

const drawCheckerboard = (ctx: CanvasRenderingContext2D, size = 8) => {
  const { width, height } = ctx.canvas;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const on = (x / size + y / size) % 2 === 0;
      ctx.fillStyle = on ? '#334455' : '#eef6ff';
      ctx.fillRect(x, y, size, size);
    }
  }
};

const createContext = (w = 64, h = 64): EffectContext => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  drawCheckerboard(ctx, 8);
  return {
    canvas,
    ctx,
    dimensions: { width: w, height: h },
    time: 0,
    deltaTime: 0,
    theme: 'frost_light',
  } as any;
};

const runFrames = async (
  effect: Distortion,
  ctx: EffectContext,
  params: EffectParameters,
  frames = 2000
) => {
  for (let i = 0; i < frames; i++) {
    ctx.time = i * 16;
    ctx.deltaTime = i === 0 ? 0 : 16;
    await effect.render(ctx, params);
  }
};

describe('Distortion Effect - Memory Leak Detection (AC5)', () => {
  const maybe = (cond: boolean) => (cond ? it : it.skip);

  it('does not leak over long-run swirl animation (2000 frames, 64x64)', async () => {
    const leak = detectMemoryLeaks();
    const initial = leak.getInitialMemory();

    const effect = new Distortion();
    const context = createContext(64, 64);
    const params: EffectParameters = {
      enabled: true,
      distortionType: 'swirl',
      intensity: 1,
      amplitude: 8,
      frequency: 0.06,
      speed: 1,
      phase: 0,
      radius: 22,
      centerX: 0.5,
      centerY: 0.5,
      opacity: 1,
    } as any;

    await runFrames(effect, context, params, 2000);

    // If memory API available, assert no >5MB growth
    const leaked = leak.checkForLeaks(5 * 1024 * 1024);
    if (initial > 0) {
      expect(leaked).toBe(false);
    }

    effect.dispose();
  });

  it('does not leak over long-run ripple animation (2000 frames, 64x64)', async () => {
    const leak = detectMemoryLeaks();
    const initial = leak.getInitialMemory();

    const effect = new Distortion();
    const context = createContext(64, 64);
    const params: EffectParameters = {
      enabled: true,
      distortionType: 'ripple',
      intensity: 1,
      amplitude: 6,
      frequency: 0.08,
      speed: 1,
      phase: 0,
      radius: 20,
      centerX: 0.5,
      centerY: 0.5,
      opacity: 1,
    } as any;

    await runFrames(effect, context, params, 2000);

    const leaked = leak.checkForLeaks(5 * 1024 * 1024);
    if (initial > 0) {
      expect(leaked).toBe(false);
    }

    effect.dispose();
  });

  it('does not leak over long-run bulge animation (2000 frames, 64x64)', async () => {
    const leak = detectMemoryLeaks();
    const initial = leak.getInitialMemory();

    const effect = new Distortion();
    const context = createContext(64, 64);
    const params: EffectParameters = {
      enabled: true,
      distortionType: 'bulge',
      intensity: 1,
      amplitude: 10,
      speed: 1,
      phase: 0,
      radius: 24,
      centerX: 0.5,
      centerY: 0.5,
      opacity: 1,
    } as any;

    await runFrames(effect, context, params, 2000);

    const leaked = leak.checkForLeaks(5 * 1024 * 1024);
    if (initial > 0) {
      expect(leaked).toBe(false);
    }

    effect.dispose();
  });
});
