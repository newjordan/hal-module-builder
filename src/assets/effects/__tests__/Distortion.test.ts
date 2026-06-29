import { Distortion } from '../Distortion';
import { EffectContext, EffectParameters } from '../IEffect';

describe('Distortion Effect', () => {
  let effect: Distortion;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let context: EffectContext;

  beforeEach(() => {
    effect = new Distortion();
    canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    ctx = canvas.getContext('2d')!;

    context = {
      canvas,
      ctx,
      dimensions: { width: 64, height: 64 },
      time: 1000,
      deltaTime: 16,
      theme: 'frost_light',
    };
  });

  afterEach(() => {
    effect.dispose();
  });

  it('has correct metadata and defaults', () => {
    expect(effect.metadata.type).toBe('distortion');
    expect(effect.metadata.displayName).toBe('Distortion');
    const defaults = effect.getDefaultParameters();
    expect(defaults.distortionType).toBe('wave');
    expect(typeof defaults.amplitude).toBe('number');
  });

  it('provides parameter descriptors', () => {
    const descriptors = effect.getParameterDescriptors();
    const keys = descriptors.map(d => d.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'distortionType',
        'amplitude',
        'frequency',
        'speed',
        'phase',
        'centerX',
        'centerY',
        'radius',
        'twist',
        'direction',
        'intensity',
      ])
    );
  });

  it('validates parameters (valid)', () => {
    const res = effect.validateParameters({
      amplitude: 10,
      frequency: 0.1,
      radius: 100,
      centerX: 0.5,
      centerY: 0.5,
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('validates parameters (invalid)', () => {
    const res = effect.validateParameters({
      amplitude: -1,
      frequency: 0,
      radius: 0,
      centerX: 2,
      centerY: -0.1,
    } as EffectParameters);
    expect(res.isValid).toBe(false);
    expect(res.errors.join(' ')).toMatch(
      /Amplitude|Frequency|Radius|Center X|Center Y/
    );
  });

  const renderTypes: Array<EffectParameters['distortionType']> = [
    'wave',
    'ripple',
    'twist',
    'bulge',
    'pinch',
    'swirl',
  ];

  it.each(renderTypes)(
    'renders without throwing for type: %s',
    async (t: any) => {
      const spyPut = jest.spyOn(ctx, 'putImageData');
      const spyDraw = jest.spyOn(ctx, 'drawImage');

      const params: EffectParameters = {
        enabled: true,
        opacity: 1,
        intensity: 1,
        distortionType: t,
        amplitude: 5,
        frequency: 0.05,
        speed: 0.5,
        phase: 0,
        centerX: 0.5,
        centerY: 0.5,
        radius: 20,
        twist: 1,
        direction: 'horizontal',
      };

      await effect.render(context, params);

      // At least one of the canvas ops should be called during rendering
      expect(
        spyPut.mock.calls.length + spyDraw.mock.calls.length
      ).toBeGreaterThan(0);
    }
  );

  it('process() returns an HTMLCanvasElement', async () => {
    const out = await effect.process(
      canvas,
      { distortionType: 'wave', enabled: true },
      context
    );
    expect(out).toBeInstanceOf(HTMLCanvasElement);
  });

  it('serialize/deserialize round trips', () => {
    const p: EffectParameters = { distortionType: 'ripple', amplitude: 7 };
    const s = effect.serialize(p);
    const d = effect.deserialize(s);
    expect(d).toMatchObject(p);
  });

  it('reports animatable parameters and caching behavior', () => {
    const anim = effect.getAnimatableParameters();
    expect(anim).toEqual(
      expect.arrayContaining(['amplitude', 'frequency', 'speed'])
    );

    expect(effect.canCache({ speed: 0 } as any)).toBe(true);
    expect(effect.canCache({ speed: 1 } as any)).toBe(false);
  });

  it('re-initializes after dispose without error', async () => {
    await effect.render(context, { distortionType: 'wave', enabled: true });
    effect.dispose();
    await expect(
      effect.render(context, { distortionType: 'wave', enabled: true })
    ).resolves.toBeUndefined();
  });
});
