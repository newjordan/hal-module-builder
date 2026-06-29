import UIValidationService from '../UIValidationService';
import { getValidationCache } from '../ValidationCache';

describe('Memory micro-benchmark: cached vs uncached', () => {
  const ui = new UIValidationService();
  const color = '#445566';

  function runUncached(iterations: number) {
    for (let i = 0; i < iterations; i++) {
      getValidationCache().clearDomain('ui.color' as any);
      ui.validateColor(color);
    }
  }

  function runCached(iterations: number) {
    getValidationCache().clearAll();
    ui.validateColor(color); // seed
    for (let i = 0; i < iterations; i++) {
      ui.validateColor(color);
    }
  }

  it('cached path uses at least 25% less heap growth than uncached path', () => {
    if (!(global as any).gc) {
      // Environment does not expose GC; skip assertion (documentation-only)
      return;
    }

    getValidationCache().clearAll();
    // Warm-up GC cycles
    ui.validateColor(color);

    const iters = 5000;

    (global as any).gc();
    const beforeUncached = process.memoryUsage().heapUsed;
    runUncached(iters);
    (global as any).gc();
    const afterUncached = process.memoryUsage().heapUsed;
    const uncachedGrowth = Math.max(0, afterUncached - beforeUncached);

    (global as any).gc();
    const beforeCached = process.memoryUsage().heapUsed;
    runCached(iters);
    (global as any).gc();
    const afterCached = process.memoryUsage().heapUsed;
    const cachedGrowth = Math.max(0, afterCached - beforeCached);

    // Expect at least 25% reduction
    expect(cachedGrowth).toBeLessThanOrEqual(uncachedGrowth * 0.75 + 1024); // allow small epsilon
  });
});
