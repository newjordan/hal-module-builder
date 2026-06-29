import { getValidationService } from '../../ValidationService';
import CrossDomainValidationService from '../CrossDomainValidationService';
import { getValidationCache } from '../ValidationCache';

describe('Cross-domain validation integration', () => {
  beforeEach(() => {
    getValidationCache().clearAll();
  });

  it('works directly via CrossDomainValidationService', () => {
    const svc = new CrossDomainValidationService();
    const res = svc.validate({
      layer: {
        id: 'L1',
        name: 'MyGrad',
        type: 'gradient',
        gradient: { type: 'linear', colors: ['#fff', '#000'], stops: [0, 1] },
      },
      equalizerSettings: {
        barCount: 16,
        barStyle: 'line',
        primaryColor: '#ff0000',
        secondaryColor: '#00f',
      },
      ui: { color: '#abcdef' },
    });
    expect(typeof res.isValid).toBe('boolean');
    expect(Array.isArray(res.errors)).toBe(true);
    expect(Array.isArray(res.warnings)).toBe(true);
  });

  it('works via ValidationService.validateCrossDomain', () => {
    const vs = getValidationService();
    const res = (vs as any).validateCrossDomain({
      layer: {
        id: 'L2',
        name: 'MyCircle',
        type: 'circle',
        circleSettings: { radius: 10, color: '#fff' },
      },
      ui: { color: '#00ff00' },
    });
    expect(res).toHaveProperty('isValid');
    expect(res).toHaveProperty('errors');
  });
});
