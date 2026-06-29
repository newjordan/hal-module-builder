/*
 * ValidationCache: simple in-memory, namespaced TTL cache with hit/miss metrics.
 */

export type CacheDomain =
  | 'layer'
  | 'ui.color'
  | 'ui.gradient'
  | 'ui.circle'
  | 'effect.equalizer'
  | string;

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
}

interface Entry<T = unknown> {
  v: T;
  exp: number; // epoch ms expiry
}

export interface CacheOptions {
  defaultTTLms?: number; // default 30s
  maxEntries?: number; // naive size cap across all domains
}

export class ValidationCache {
  private store = new Map<CacheDomain, Map<string, Entry>>();
  private metrics = new Map<CacheDomain, CacheMetrics>();
  private defaultTTLms: number;
  private maxEntries: number;

  constructor(opts: CacheOptions = {}) {
    this.defaultTTLms = opts.defaultTTLms ?? 30_000;
    this.maxEntries = opts.maxEntries ?? 5000;
  }

  getMetrics(
    domain?: CacheDomain
  ): CacheMetrics | Record<string, CacheMetrics> {
    if (!domain) {
      const all: Record<string, CacheMetrics> = {};
      for (const [d, m] of this.metrics.entries()) all[d] = { ...m };
      return all;
    }
    return {
      ...(this.metrics.get(domain) ?? {
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0,
      }),
    };
  }

  clearAll() {
    this.store.clear();
    this.metrics.clear();
  }

  clearDomain(domain: CacheDomain) {
    this.store.delete(domain);
    this.metrics.delete(domain);
  }

  get<T = unknown>(domain: CacheDomain, key: string): T | undefined {
    const d = this.store.get(domain);
    if (!d) {
      this.bump(domain, 'misses');
      return undefined;
    }
    const e = d.get(key);
    if (!e) {
      this.bump(domain, 'misses');
      return undefined;
    }
    if (e.exp < Date.now()) {
      d.delete(key);
      this.bump(domain, 'misses');
      return undefined;
    }
    this.bump(domain, 'hits');
    return e.v as T;
  }

  set<T = unknown>(domain: CacheDomain, key: string, value: T, ttlMs?: number) {
    // naive global size cap
    if (this.totalEntries() >= this.maxEntries) {
      this.evictSome();
      this.bump(domain, 'evictions');
    }
    const d = this.ensureDomain(domain);
    const exp = Date.now() + (ttlMs ?? this.defaultTTLms);
    d.set(key, { v: value, exp });
    this.bump(domain, 'sets');
  }

  private ensureDomain(domain: CacheDomain): Map<string, Entry> {
    let d = this.store.get(domain);
    if (!d) {
      d = new Map();
      this.store.set(domain, d);
    }
    if (!this.metrics.has(domain))
      this.metrics.set(domain, { hits: 0, misses: 0, sets: 0, evictions: 0 });
    return d;
  }

  private bump(domain: CacheDomain, k: keyof CacheMetrics) {
    const m = this.metrics.get(domain) ?? {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };
    (m[k] as number)++;
    this.metrics.set(domain, m);
  }

  private totalEntries(): number {
    let n = 0;
    for (const d of this.store.values()) n += d.size;
    return n;
  }

  private evictSome() {
    // naive eviction: drop oldest domain entirely
    const it = this.store.keys().next();
    if (!it.done) this.store.delete(it.value);
  }
}

// Stable key computation for object inputs
export function stableKey(input: unknown): string {
  return typeof input === 'string' ||
    typeof input === 'number' ||
    typeof input === 'boolean'
    ? String(input)
    : stableStringify(input);
}

// Deterministic stringify by sorting object keys
function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  return (function stringify(v: any): string {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (seen.has(v)) return '"[Circular]"';
    seen.add(v);
    if (Array.isArray(v)) return '[' + v.map(x => stringify(x)).join(',') + ']';
    const keys = Object.keys(v).sort();
    const body = keys
      .map(k => JSON.stringify(k) + ':' + stringify(v[k]))
      .join(',');
    return '{' + body + '}';
  })(value);
}

// Singleton factory
let cacheSingleton: ValidationCache | null = null;
export function getValidationCache(): ValidationCache {
  if (!cacheSingleton) cacheSingleton = new ValidationCache();
  return cacheSingleton;
}
