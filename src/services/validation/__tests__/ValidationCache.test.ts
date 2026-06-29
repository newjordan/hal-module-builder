import {
  ValidationCache,
  getValidationCache,
  stableKey,
} from '../ValidationCache';

describe('ValidationCache', () => {
  test('hits and misses with default TTL', () => {
    const cache = new ValidationCache({ defaultTTLms: 1000 });
    const domain = 'layer';
    const key = stableKey({ a: 1, b: 2 });
    expect(cache.get(domain, key)).toBeUndefined();
    cache.set(domain, key, { ok: true });
    expect(cache.get(domain, key)).toEqual({ ok: true });
    const m = cache.getMetrics(domain);
    expect(m.hits).toBe(1);
    expect(m.misses).toBe(1);
    expect(m.sets).toBe(1);
  });

  test('TTL expiry evicts entries', async () => {
    const cache = new ValidationCache({ defaultTTLms: 10 });
    const domain = 'ui.color';
    const key = stableKey('red');
    cache.set(domain, key, { ok: true });
    await new Promise(r => setTimeout(r, 15));
    expect(cache.get(domain, key)).toBeUndefined();
  });

  test('clearDomain and clearAll', () => {
    const cache = new ValidationCache({ defaultTTLms: 1000 });
    cache.set('layer', 'k1', 1);
    cache.set('ui.color', 'k2', 2);
    cache.clearDomain('layer');
    expect(cache.get('layer', 'k1')).toBeUndefined();
    expect(cache.get('ui.color', 'k2')).toBe(2);
    cache.clearAll();
    expect(cache.get('ui.color', 'k2')).toBeUndefined();
  });

  test('singleton works', () => {
    const c1 = getValidationCache();
    const c2 = getValidationCache();
    expect(c1).toBe(c2);
  });
});
