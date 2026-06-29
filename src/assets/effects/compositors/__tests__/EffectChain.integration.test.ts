import { createEffectChain } from '../../compositors/EffectChain';
import { Distortion } from '../../Distortion';
import { createGradientEffect } from '../../Gradient';
import type { EffectContext, EffectParameters } from '../../IEffect';

function makeCanvas(w = 128, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function createSolidColorEffect(color = '#808080') {
  return createGradientEffect();
}

describe('EffectChain + Distortion integration', () => {
  let baseCanvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let context: EffectContext;

  beforeEach(() => {
    baseCanvas = makeCanvas(128, 128);
    ctx = baseCanvas.getContext('2d')!;
    // Fill base with mid-gray
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

    context = {
      canvas: baseCanvas,
      ctx,
      dimensions: { width: baseCanvas.width, height: baseCanvas.height },
      time: 0,
      deltaTime: 16.67,
      audioData: [],
      theme: 'frost_light',
    };
  });

  it('processes solid + distortion with blending without error', async () => {
    const chain = createEffectChain();

    const solid = createSolidColorEffect();
    const distortion = new Distortion();

    chain.addEffect(solid);
    chain.addEffect(distortion);

    // Adjust parameters minimally
    chain.effects[1].parameters = {
      ...(distortion.defaultParameters as EffectParameters),
      enabled: true,
      opacity: 1,
      intensity: 1,
      distortionType: 'wave',
      amplitude: 4,
      frequency: 0.05,
      speed: 0,
    };
    chain.effects[1].blendMode = 'multiply';
    chain.effects[1].opacity = 0.9;

    const out = await chain.process(baseCanvas, context);

    expect(out).toBeInstanceOf(HTMLCanvasElement);
  });

  it('applies a simple shape mask on the chained distortion output', async () => {
    const chain = createEffectChain();

    const solid = createSolidColorEffect();
    const distortion = new Distortion();

    chain.addEffect(solid);
    chain.addEffect(distortion);

    // Configure mask for distortion
    chain.effects[1].parameters = {
      ...(distortion.defaultParameters as EffectParameters),
      enabled: true,
      opacity: 1,
      intensity: 1,
      distortionType: 'ripple',
      amplitude: 3,
      speed: 0,
    };
    chain.effects[1].blendMode = 'screen';
    chain.effects[1].opacity = 1.0;
    chain.effects[1].mask = {
      type: 'shape',
      config: { shape: 'circle', radius: 30 },
      invert: false,
    } as any;

    const out = await chain.process(baseCanvas, context);
    expect(out).toBeInstanceOf(HTMLCanvasElement);
  });
});
