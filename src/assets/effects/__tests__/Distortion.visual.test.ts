import { Distortion } from '../Distortion';
import { EffectContext, EffectParameters } from '../IEffect';

// Helper: deterministic checkerboard pattern
const drawCheckerboard = (ctx: CanvasRenderingContext2D, size = 8) => {
  const { width, height } = ctx.canvas;
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const on = (x / size + y / size) % 2 === 0;
      ctx.fillStyle = on ? '#445566' : '#ddeeff';
      ctx.fillRect(x, y, size, size);
    }
  }
};

// Create context with deterministic dimensions, theme, and time
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
  };
};

// Fixed parameters to ensure determinism (speed=0, phase=0)
const baseParams: Partial<EffectParameters> = {
  enabled: true,
  opacity: 1,
  intensity: 1,
  amplitude: 6,
  frequency: 0.08,
  speed: 0,
  phase: 0,
  centerX: 0.45,
  centerY: 0.55,
  radius: 18,
  twist: 1.25,
};

describe('Distortion Effect - Visual Regression (subset for AC4)', () => {
  let effect: Distortion;

  beforeEach(() => {
    effect = new Distortion();
  });

  afterEach(() => effect.dispose());

  it('wave-horizontal matches snapshot (64x64 checkerboard)', async () => {
    const context = createContext(64, 64);
    const params: EffectParameters = {
      ...(baseParams as any),
      distortionType: 'wave',
      direction: 'horizontal',
    } as EffectParameters;

    await effect.render(context, params);
    const image = context.ctx.getImageData(0, 0, 64, 64);
    expect(Array.from(image.data)).toMatchSnapshot();
  });

  it('ripple matches snapshot (64x64 checkerboard)', async () => {
    const context = createContext(64, 64);
    const params: EffectParameters = {
      ...(baseParams as any),
      distortionType: 'ripple',
    } as EffectParameters;

    await effect.render(context, params);
    const image = context.ctx.getImageData(0, 0, 64, 64);
    expect(Array.from(image.data)).toMatchSnapshot();
  });

  it('bulge matches snapshot (64x64 checkerboard)', async () => {
    const context = createContext(64, 64);
    const params: EffectParameters = {
      ...(baseParams as any),
      distortionType: 'bulge',
    } as EffectParameters;

    await effect.render(context, params);
    const image = context.ctx.getImageData(0, 0, 64, 64);
    expect(Array.from(image.data)).toMatchSnapshot();
  });

  it('wave-vertical matches snapshot (64x64 checkerboard)', async () => {
    const context = createContext(64, 64);
    const params: EffectParameters = {
      ...(baseParams as any),
      distortionType: 'wave',
      direction: 'vertical',
    } as EffectParameters;
    await effect.render(context, params);
    const image = context.ctx.getImageData(0, 0, 64, 64);
    expect(Array.from(image.data)).toMatchSnapshot();
  });

  it('wave-diagonal matches snapshot (64x64 checkerboard)', async () => {
    const context = createContext(64, 64);
    const params: EffectParameters = {
      ...(baseParams as any),
      distortionType: 'wave',
      direction: 'diagonal',
    } as EffectParameters;
    await effect.render(context, params);
    const image = context.ctx.getImageData(0, 0, 64, 64);
    expect(Array.from(image.data)).toMatchSnapshot();
  });

  it('wave-radial matches snapshot (64x64 checkerboard)', async () => {
    const context = createContext(64, 64);
    const params: EffectParameters = {
      ...(baseParams as any),
      distortionType: 'wave',
      direction: 'radial',
    } as EffectParameters;
    await effect.render(context, params);
    const image = context.ctx.getImageData(0, 0, 64, 64);
    expect(Array.from(image.data)).toMatchSnapshot();
  });

  it('pinch matches snapshot (64x64 checkerboard)', async () => {
    const context = createContext(64, 64);
    const params: EffectParameters = {
      ...(baseParams as any),
      distortionType: 'pinch',
    } as EffectParameters;
    await effect.render(context, params);
    const image = context.ctx.getImageData(0, 0, 64, 64);
    expect(Array.from(image.data)).toMatchSnapshot();
  });

  // Animated frames — twist
  it.each([0, 16, 32])(
    'twist frame %i matches snapshot (64x64 checkerboard)',
    async t => {
      const context = createContext(64, 64);
      context.time = t;
      context.deltaTime = t === 0 ? 0 : 16;
      const params: EffectParameters = {
        ...(baseParams as any),
        distortionType: 'twist',
        speed: 1,
        radius: 24,
        twist: 1.5,
      } as EffectParameters;
      await effect.render(context, params);
      const image = context.ctx.getImageData(0, 0, 64, 64);
      expect(Array.from(image.data)).toMatchSnapshot(`twist-${t}`);
    }
  );

  // Animated frames — swirl
  it.each([0, 16, 32])(
    'swirl frame %i matches snapshot (64x64 checkerboard)',
    async t => {
      const context = createContext(64, 64);
      context.time = t;
      context.deltaTime = t === 0 ? 0 : 16;
      const params: EffectParameters = {
        ...(baseParams as any),
        distortionType: 'swirl',
        speed: 1,
        radius: 22,
        twist: 1.25,
      } as EffectParameters;
      await effect.render(context, params);
      const image = context.ctx.getImageData(0, 0, 64, 64);
      expect(Array.from(image.data)).toMatchSnapshot(`swirl-${t}`);
    }
  );
});
