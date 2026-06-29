import { getValidationService } from '../../ValidationService';

describe('ValidationService API Completeness', () => {
  const svc = getValidationService();

  describe('All required API methods exist', () => {
    it('has validateLayer method', () => {
      expect(typeof svc.validateLayer).toBe('function');
    });

    it('has validateTemplate method', () => {
      expect(typeof svc.validateTemplate).toBe('function');
    });

    it('has validateAudioParams method', () => {
      expect(typeof svc.validateAudioParams).toBe('function');
    });

    it('has validateUIInput method', () => {
      expect(typeof svc.validateUIInput).toBe('function');
    });

    it('has validateEffect method', () => {
      expect(typeof svc.validateEffect).toBe('function');
    });

    it('has validate method', () => {
      expect(typeof svc.validate).toBe('function');
    });

    it('has validateColor method (legacy)', () => {
      expect(typeof svc.validateColor).toBe('function');
    });
  });

  describe('API method functionality', () => {
    it('validateTemplate delegates properly', () => {
      const template = { name: 'Test', layers: [] };
      const result = svc.validateTemplate(template);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('validateAudioParams handles array input', () => {
      const audioData = [0.1, 0.2, 0.3];
      const result = svc.validateAudioParams(audioData);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });

    it('validateUIInput routes by type', () => {
      const colorResult = svc.validateUIInput('#ffffff', 'color');
      expect(colorResult).toHaveProperty('isValid');

      const unknownResult = svc.validateUIInput('test', 'unknown');
      expect(unknownResult.warnings).toContain(
        'Unknown UI input type: unknown'
      );
    });

    it('validateEffect handles equalizer settings', () => {
      const effect = { equalizerSettings: { barCount: 16 } };
      const result = svc.validateEffect(effect);
      expect(result).toHaveProperty('isValid');
    });

    it('validate provides legacy compatibility', () => {
      const result = svc.validate({ test: 'data' }, []);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual({ test: 'data' });
    });
  });
});
