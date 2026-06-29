import { getValidationCache } from '../ValidationCache';
import UIValidationService from '../UIValidationService';
import LayerValidationService from '../LayerValidationService';
import EffectValidationService from '../EffectValidationService';

function hitRate(domain: string) {
  const m = getValidationCache().getMetrics(domain as any) as any;
  const hits = m.hits || 0;
  const misses = m.misses || 0;
  const total = hits + misses;
  return total === 0 ? 0 : hits / total;
}

describe('Validation cache effectiveness', () => {
  beforeEach(() => {
    getValidationCache().clearAll();
  });

  it('achieves >= 70% hit rate for repeated UI color validations', () => {
    const ui = new UIValidationService();
    const color = '#aabbcc';
    for (let i = 0; i < 10; i++) ui.validateColor(color);
    expect(hitRate('ui.color')).toBeGreaterThanOrEqual(0.7);
  });

  it('achieves >= 70% hit rate for repeated gradient validations', () => {
    const ui = new UIValidationService();
    const gradient = {
      type: 'linear',
      colors: ['#fff', '#000'],
      stops: [0, 1],
    };
    for (let i = 0; i < 10; i++) ui.validateGradient(gradient);
    expect(hitRate('ui.gradient')).toBeGreaterThanOrEqual(0.7);
  });

  it('achieves >= 70% hit rate for repeated layer validations', () => {
    const layerSvc = new LayerValidationService();
    const layer = {
      id: 'L3',
      name: 'Solid',
      type: 'solid',
      color: '#123456',
    } as any;
    for (let i = 0; i < 10; i++) layerSvc.validateLayer(layer);
    expect(hitRate('layer')).toBeGreaterThanOrEqual(0.7);
  });

  it('achieves >= 70% hit rate for repeated equalizer validations', () => {
    const eff = new EffectValidationService();
    const eq = {
      barCount: 16,
      barStyle: 'line',
      primaryColor: '#f00',
      secondaryColor: '#0f0',
    } as any;
    for (let i = 0; i < 10; i++) eff.validateEqualizerSettings(eq);
    expect(hitRate('effect.equalizer')).toBeGreaterThanOrEqual(0.7);
  });
});
