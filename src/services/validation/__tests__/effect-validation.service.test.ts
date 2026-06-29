import { getValidationService } from '../../ValidationService';
import { EffectValidationService } from '../EffectValidationService';

describe('EffectValidationService (parity)', () => {
  const legacy = getValidationService();
  const svc = new EffectValidationService();

  it('matches legacy sanitized equalizer settings (defaults)', () => {
    const settings: any = { barCount: null };
    const svcRes = svc.validateEqualizerSettings(settings);

    const baseLayer: any = {
      id: 'L1',
      name: 'Fx',
      type: 'effect',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      equalizerSettings: settings,
    };
    const legacyRes = legacy.validateLayer(baseLayer);

    expect(svcRes.isValid).toBe(true);
    expect(svcRes.errors).toEqual([]);
    expect(svcRes.sanitizedValue).toEqual(
      (legacyRes.sanitizedValue as any).equalizerSettings
    );
  });

  it('matches legacy for color format and range bounds', () => {
    const settings: any = {
      barCount: 999,
      barStyle: 'weird',
      barWidth: -10,
      barSpacing: 100,
      innerRadius: -50,
      maxHeight: 1000,
      responseSpeed: 9,
      frequencyRange: 'unknown',
      colorMode: 'nope',
      primaryColor: 'bad',
      secondaryColor: '#00ff00',
    };

    const svcRes = svc.validateEqualizerSettings(settings);

    const baseLayer: any = {
      id: 'L2',
      name: 'Fx2',
      type: 'effect',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      equalizerSettings: settings,
    };
    const legacyRes = legacy.validateLayer(baseLayer);

    expect(svcRes.sanitizedValue).toEqual(
      (legacyRes.sanitizedValue as any).equalizerSettings
    );
  });
});
