import { getValidationService } from '../../ValidationService';

describe('ValidationService API compatibility', () => {
  const vs = getValidationService() as any;

  it('exposes all required API methods', () => {
    [
      'validateLayer',
      'validateTemplate',
      'validateAudioParams',
      'validateUIInput',
      'validateEffect',
      'validate',
      'validateCrossDomain',
    ].forEach(name => expect(typeof vs[name]).toBe('function'));
  });

  it('methods return ValidationResult-shaped objects', () => {
    const layer = { id: 'L', name: 'Solid', type: 'solid', color: '#123456' };
    const r1 = vs.validateLayer(layer);
    expect(r1).toHaveProperty('isValid');
    expect(r1).toHaveProperty('errors');

    const r2 = vs.validateUIInput('#aabbcc', 'color');
    expect(r2).toHaveProperty('isValid');

    const r3 = vs.validateEffect({
      equalizerSettings: {
        barCount: 8,
        barStyle: 'bar',
        primaryColor: '#fff',
        secondaryColor: '#000',
        radialSizingMode: 'depth',
      },
    });
    expect(r3).toHaveProperty('isValid');

    const r4 = vs.validateCrossDomain({ ui: { color: '#00ff00' } });
    expect(r4).toHaveProperty('isValid');
  });
});
