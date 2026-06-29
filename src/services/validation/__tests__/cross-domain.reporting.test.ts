import CrossDomainValidationService from '../CrossDomainValidationService';
import { createValidationContext } from '../ValidationContext';

describe('Cross-domain enhanced error reporting', () => {
  it('adds context, performance, and actionable suggestions', () => {
    const svc = new CrossDomainValidationService();
    const ctx = createValidationContext({ correlationId: 'corr-123' });
    const res: any = svc.validate({ ui: { color: 'not-a-color' } } as any, ctx);

    expect(res).toHaveProperty('context');
    expect(res.context).toEqual({ correlationId: 'corr-123' });

    expect(res).toHaveProperty('performance');
    expect(typeof res.performance.totalTimeMs).toBe('number');

    expect(Array.isArray(res.suggestions)).toBe(true);
    // Should include a color suggestion when color errors present
    expect(res.suggestions.join(' ').toLowerCase()).toContain('hex');
  });
});
