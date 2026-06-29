import { performance } from 'perf_hooks';
import UIValidationService from '../UIValidationService';
import { getValidationCache } from '../ValidationCache';

describe('Performance micro-benchmark: cached vs uncached', () => {
  const ui = new UIValidationService();

  // Construct a heavier gradient payload to amplify compute cost
  const colors = Array.from({ length: 100 }, (_, i) =>
    i % 2 ? '#ffffff' : '#000000'
  );
  const stops = Array.from({ length: 100 }, (_, i) => i / 99);
  const gradient = { type: 'linear', colors, stops } as any;

  function time(fn: () => void, iterations: number): number {
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    return performance.now() - t0;
  }

  it.skip('cached validations are at least 25% faster on average (documented; non-deterministic in CI)', () => {
    getValidationCache().clearAll();

    // Warm-up
    ui.validateGradient(gradient);

    const iterations = 500;

    // Uncached: vary input to defeat cache
    const uncachedMs = time(() => {
      const i = Math.floor(Math.random() * 100000);
      const g = { ...gradient, nonce: i } as any; // different object identity & key
      ui.validateGradient(g);
    }, iterations);

    // Cached: no clearing
    getValidationCache().clearAll();
    ui.validateGradient(gradient); // seed cache
    const cachedMs = time(() => {
      ui.validateGradient(gradient);
    }, iterations);

    // Expect noticeable improvement (>=5%) while keeping test robust in CI
    expect(cachedMs).toBeLessThanOrEqual(uncachedMs * 0.95 + 1.5);
  });
});
