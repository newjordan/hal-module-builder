import { Distortion } from '../Distortion';
import { EffectContext, EffectParameters } from '../IEffect';
import {
  performanceBenchmark,
  trackMemoryUsage,
} from '../../../test-utils/performance-benchmarks';

describe('Distortion Effect - Performance Baselines', () => {
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
      time: 0,
      deltaTime: 16,
      theme: 'frost_light',
    };
  });

  afterEach(() => effect.dispose());

  const types: Array<EffectParameters['distortionType']> = [
    'wave',
    'ripple',
    'twist',
    'bulge',
    'pinch',
    'swirl',
  ];

  it.each(types)('establishes baseline metrics for %s', async t => {
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

    const mem = trackMemoryUsage();
    mem.start();

    const result = await performanceBenchmark.benchmark(
      `Distortion-${t}`,
      async () => {
        // Advance time a little for animated types
        context.time += 16;
        await effect.render(context, params);
      },
      5 // keep iterations small to keep tests fast
    );

    const used = mem.measure();

    // Baseline assertions: we only assert that metrics are numeric and sane
    expect(result.iterations).toBe(5);
    expect(result.avgTime).toBeGreaterThanOrEqual(0);
    // Memory measurement might be null in some environments; if available, ensure it's a number
    if (used !== null) {
      expect(typeof used).toBe('number');
    }

    // Optional: log for human baseline capture in CI logs

    console.log(
      `[E3.0] Baseline ${t}: avg=${result.avgTime.toFixed(2)}ms, min=${result.minTime.toFixed(2)}ms, max=${result.maxTime.toFixed(2)}ms`
    );
  });
});
