import { DEFAULT_HAL_LAYERS } from '../../config/defaultHalDesign';
import type { Layer } from '../../types/layer-types';
import { planEye, readStoredDesign } from '../layerPlan';

describe('planEye', () => {
  const parts = planEye(DEFAULT_HAL_LAYERS);

  it('keeps every visible default HAL layer in back-to-front order', () => {
    expect(parts.map(part => part.id)).toEqual(
      DEFAULT_HAL_LAYERS.filter(layer => layer.visible).map(layer => layer.id)
    );
    expect(parts[0]?.depth).toBe(0);
    expect(parts[parts.length - 1]?.depth).toBe(1);
  });

  it('normalizes radii so the outermost layer is 1', () => {
    expect(Math.max(...parts.map(part => part.radius))).toBeCloseTo(1);
    const core = parts.find(part => part.id === 'hal-core');
    expect(core?.radius).toBeGreaterThan(0.3);
    expect(core?.radius).toBeLessThan(0.6);
  });

  it('maps shapes, strokes and equalizers to discs, rings and bars', () => {
    const byId = Object.fromEntries(parts.map(part => [part.id, part]));
    expect(byId['hal-housing']?.kind).toBe('ring');
    expect(byId['hal-iris-backdrop']?.kind).toBe('disc');
    expect(byId['hal-iris-backdrop']?.gradient).toBe('radial');
    expect(byId['hal-eq-outer']).toMatchObject({
      kind: 'bars',
      barCount: 96,
      barStyle: 'line',
      reactive: true,
    });
    // radius 148, dash "2 22": 2π·148 / 24 ≈ 39 ticks lit 1/12 of the time.
    expect(byId['hal-tick-ring']).toMatchObject({
      kind: 'ring',
      additive: true,
    });
    expect(byId['hal-tick-ring']?.dash?.count).toBe(39);
    expect(byId['hal-tick-ring']?.dash?.duty).toBeCloseTo(2 / 24);
    expect(byId['hal-tick-ring']?.spin).toBeGreaterThan(0);
    expect(byId['hal-core']?.reactive).toBe(true);
  });

  it('flips studio offsets into 3D up-is-positive space', () => {
    const specular = parts.find(part => part.id === 'hal-specular');
    expect(specular?.offsetX).toBeLessThan(0);
    expect(specular?.offsetY).toBeGreaterThan(0);
  });

  it('skips hidden, text and audio layers', () => {
    const layers = [
      { ...DEFAULT_HAL_LAYERS[0], id: 'hidden', visible: false },
      { ...DEFAULT_HAL_LAYERS[0], id: 'text', type: 'radialText' },
      { ...DEFAULT_HAL_LAYERS[0], id: 'audio', type: 'audio' },
      { ...DEFAULT_HAL_LAYERS[0], id: 'kept' },
    ] as Layer[];
    expect(planEye(layers).map(part => part.id)).toEqual(['kept']);
    expect(planEye([])).toEqual([]);
  });
});

describe('readStoredDesign', () => {
  const storage = (value: string | null) => ({ getItem: () => value });

  it('reads the studio design from storage', () => {
    expect(
      readStoredDesign(storage(JSON.stringify(DEFAULT_HAL_LAYERS)))
    ).toHaveLength(DEFAULT_HAL_LAYERS.length);
  });

  it('falls back on empty or corrupt storage', () => {
    expect(readStoredDesign(storage(null))).toBeNull();
    expect(readStoredDesign(storage('[]'))).toBeNull();
    expect(readStoredDesign(storage('{nope'))).toBeNull();
    expect(readStoredDesign(storage('[{"name":"no id"}]'))).toBeNull();
    expect(readStoredDesign(undefined)).toBeNull();
  });
});
