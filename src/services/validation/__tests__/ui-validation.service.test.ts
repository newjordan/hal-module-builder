import { getValidationService } from '../../ValidationService';
import { layerValidators } from '../../validators/layerValidators';
import { UIValidationService } from '../UIValidationService';

describe('UIValidationService.validateColor (parity)', () => {
  const legacy = getValidationService();
  const svc = new UIValidationService();

  const cases = [
    '#ffffff',
    '#000000',
    '#12ABef',
    'rgb(255, 0, 0)',
    'rgba(0, 255, 0, 0.5)',
    'hsl(120, 100%, 50%)',
    'hsla(240, 100%, 50%, 0.25)',
    'not-a-color',
    '',
    123 as any,
  ];

  it('matches legacy validateColor across valid/invalid samples', () => {
    for (const c of cases) {
      const newRes = svc.validateColor(c as any);
      const oldRes = legacy.validateColor(c as any);
      expect(newRes).toEqual(oldRes);
    }
  });
});

describe('UIValidationService.validateGradient and validateCircleSettings (parity via layerValidators)', () => {
  it('matches layerValidators for gradient wrapper', () => {
    const svc = new UIValidationService();
    const gradient = {
      type: 'linear',
      colors: ['#fff', '#000'],
      stops: [0, 0.5, 1],
    } as any;
    const res = svc.validateGradient(gradient);

    const shaped = layerValidators.validateLayerStructure({
      id: '',
      name: '',
      type: 'gradient',
      gradient,
    } as any);

    expect(res.sanitizedValue).toEqual(shaped.sanitizedValue?.gradient);
    expect(res.errors).toEqual(shaped.errors);
    expect(res.warnings).toEqual(shaped.warnings ?? []);
    expect(res.isValid).toBe(shaped.errors.length === 0);
  });

  it('matches layerValidators for circle wrapper', () => {
    const svc = new UIValidationService();
    const circleSettings = {
      radius: '150',
      thickness: 99,
      fillType: 'gradient',
      strokeType: 'solid',
      fillColor: 'rgb(255,0,0)',
      strokeColor: '#xyzzzz',
      glowIntensity: -1,
      dashArray: '10,10',
      animation: 'none',
      animationSpeed: 'slow',
    } as any;
    const res = svc.validateCircleSettings(circleSettings);

    const shaped = layerValidators.validateLayerStructure({
      id: '',
      name: '',
      type: 'circle',
      circleSettings,
    } as any);

    expect(res.sanitizedValue).toEqual(shaped.sanitizedValue?.circleSettings);
    expect(res.errors).toEqual(shaped.errors);
    expect(res.warnings).toEqual(shaped.warnings ?? []);
    expect(res.isValid).toBe(shaped.errors.length === 0);
  });
});
