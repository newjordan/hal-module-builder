import CrossDomainValidationService, {
  CrossDomainPayload,
} from '../CrossDomainValidationService';
import { createValidationContext } from '../ValidationContext';

describe('CrossDomainValidationService', () => {
  it('aggregates results across domains using ValidationResultAggregator', () => {
    const svc = new CrossDomainValidationService();
    const payload: CrossDomainPayload = {
      layer: {
        id: 'L1',
        name: 'Grad',
        type: 'gradient',
        gradient: {
          type: 'linear',
          colors: ['#fff', 'rgba(0,0,0,1)'],
          stops: [0, 1],
        },
      },
      equalizerSettings: {
        barCount: 32,
        barStyle: 'bar',
        primaryColor: '#ff0000',
        secondaryColor: '#00f',
        radialSizingMode: 'flat',
      },
      ui: { color: '#abcdef' },
    };

    const ctx = createValidationContext({ correlationId: 'test-ctx' });
    const res = svc.validate(payload, ctx);
    expect(res).toHaveProperty('isValid');
    expect(Array.isArray(res.errors)).toBe(true);
    expect(Array.isArray(res.warnings)).toBe(true);
    // Should contain sanitized composite object when aggregator merges objects
    // Exact shape depends on aggregator impl; we just assert it's a valid ValidationResult
  });
});
