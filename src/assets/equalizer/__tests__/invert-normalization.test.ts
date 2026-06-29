import { EqualizerUtils } from '../../equalizer';

describe('EqualizerUtils.normalizeConfig - invert resolution', () => {
  it('prefers explicit invert over invertDirection and mirrors both', () => {
    const cfg = EqualizerUtils.normalizeConfig({
      invert: true,
      invertDirection: false,
    } as any);
    expect((cfg as any).invert).toBe(true);
    expect((cfg as any).invertDirection).toBe(true);
  });

  it('falls back to invertDirection when invert is absent', () => {
    const cfg = EqualizerUtils.normalizeConfig({
      invertDirection: true,
    } as any);
    expect((cfg as any).invert).toBe(true);
    expect((cfg as any).invertDirection).toBe(true);
  });

  it('defaults to false when neither provided', () => {
    const cfg = EqualizerUtils.normalizeConfig({} as any);
    expect((cfg as any).invert).toBe(false);
    expect((cfg as any).invertDirection).toBe(false);
  });
});
