import { adaptLegacyToSrp, adaptSrpToLegacy } from '../equalizerMapping';

describe('equalizerMapping', () => {
  it('keeps alignment keys in sync when SRP updates barAlignment', () => {
    const base = { blockAlignment: 'bottom' } as any;
    const updates = { barAlignment: 'top' } as any;

    const merged = adaptSrpToLegacy({ ...base, ...updates });
    expect(merged.barAlignment).toBe('top');
    expect(merged.blockAlignment).toBe('top');
  });

  it('mirrors blockAlignment to barAlignment when only blockAlignment present', () => {
    const base = { blockAlignment: 'center' } as any;
    const adapted = adaptLegacyToSrp(base);
    expect(adapted.barAlignment).toBe('center');
  });

  it('keeps invert flags in sync from invertDirection', () => {
    const merged = adaptSrpToLegacy({ invertDirection: true });
    expect(merged.invertDirection).toBe(true);
    expect(merged.invert).toBe(true);
  });

  it('mirrors invert to invertDirection when only invert present', () => {
    const adapted = adaptLegacyToSrp({ invert: false });
    expect(adapted.invertDirection).toBe(false);
  });

  it('SRP invert overrides pre-existing invertDirection when both present (merged object)', () => {
    // Simulate merged object passed to mapping: existing layer had invertDirection=true, SRP updates invert=false
    const merged = adaptSrpToLegacy({
      invertDirection: true,
      invert: false,
    } as any);
    expect(merged.invert).toBe(false);
    expect(merged.invertDirection).toBe(false);
  });

  it('removes legacy radialSizingMode on writes', () => {
    const merged = adaptSrpToLegacy({ radialSizingMode: 'flat', barWidth: 3 });
    expect(merged.radialSizingMode).toBeUndefined();
    expect(merged.barWidth).toBe(3);
  });
});
