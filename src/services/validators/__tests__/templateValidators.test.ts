import { validateTemplate as legacyValidateTemplate } from '../../../utils/templates/templateValidation';
import { templateValidators } from '../../validators/templateValidators';

describe('templateValidators.validateTemplateStructure (parity)', () => {
  it('parity: minimal valid template', () => {
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
    const newRes = templateValidators.validateTemplateStructure(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });

  it('parity: invalid structure', () => {
    const bad = { id: 123, name: '', layers: 'nope' } as any;
    const newRes = templateValidators.validateTemplateStructure(bad);
    const oldRes = legacyValidateTemplate(bad);
    expect(newRes).toEqual(oldRes);
  });

  it('parity: propagates layer-level errors with index prefix', () => {
    const template = {
      id: 'T2',
      name: 'Bad Layer',
      layers: [
        {
          id: 'Lbad',
          name: 'No Type',
          // type missing to trigger layer error
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
        } as any,
      ],
    } as any;

    const newRes = templateValidators.validateTemplateStructure(template);
    const oldRes = legacyValidateTemplate(template);
    // Parity on validity and errors; warnings may be added during new-layer checks
    expect(newRes.valid).toEqual(oldRes.valid);
    expect(newRes.errors).toEqual(oldRes.errors);
  });

  it('parity: detects too many layers consistently', () => {
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

    const newRes = templateValidators.validateTemplateStructure(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });

  it('parity: detects circular references', () => {
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
    // Introduce circular reference
    (template as any).self = template;

    const newRes = templateValidators.validateTemplateStructure(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });

  it('parity: missing name produces matching errors', () => {
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
    const newRes = templateValidators.validateTemplateStructure(template);
    const oldRes = legacyValidateTemplate(template);
    expect(newRes).toEqual(oldRes);
  });
});
