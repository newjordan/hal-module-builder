import { validateTemplate as legacyValidateTemplate } from '../../../utils/templates/templateValidation';
import { TemplateValidationService } from '../TemplateValidationService';

/**
 * E5-1 Parity Test: TemplateValidationService wraps existing utils.
 */

describe('TemplateValidationService (parity)', () => {
  const svc = new TemplateValidationService();

  it('matches legacy for minimal valid template', () => {
    const template = {
      id: 'T1',
      name: 'My Template',
      layers: [
        {
          id: 'L1',
          name: 'Solid',
          type: 'solid',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          color: '#ffffff',
        },
      ],
    };

    const newRes = svc.validateTemplate(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });

  it('matches legacy for invalid structure', () => {
    const bad = { id: 123, name: '', layers: 'not-an-array' } as any;
    const newRes = svc.validateTemplate(bad);
    const oldRes = legacyValidateTemplate(bad);
    expect(newRes).toEqual(oldRes);
  });

  it('matches legacy for too many layers', () => {
    const manyLayers = Array.from({ length: 101 }).map((_, i) => ({
      id: `L${i + 1}`,
      name: `Layer ${i + 1}`,
      type: 'solid',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      color: '#ffffff',
    }));
    const template = { id: 'T3', name: 'Too Many', layers: manyLayers } as any;

    const newRes = svc.validateTemplate(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });

  it('matches legacy for circular references', () => {
    const layer: any = {
      id: 'L1',
      name: 'SelfRef',
      type: 'solid',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      color: '#fff',
    };
    const template: any = { id: 'T4', name: 'Circ', layers: [layer] };
    (template as any).self = template; // introduce circular reference

    const newRes = svc.validateTemplate(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });

  it('matches legacy for missing name', () => {
    const template: any = {
      id: 'T5',
      name: '',
      layers: [
        {
          id: 'L1',
          name: 'Solid',
          type: 'solid',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          color: '#ffffff',
        },
      ],
    };
    const newRes = svc.validateTemplate(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });
});
