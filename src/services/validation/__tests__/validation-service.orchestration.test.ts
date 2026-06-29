import { getValidationService } from '../../ValidationService';
import { layerValidators } from '../../validators/layerValidators';

describe('ValidationService orchestration (parity-first delegation)', () => {
  const svc = getValidationService();

  it('validateLayer delegates with parity for a solid layer', () => {
    const layer: any = {
      id: 'L1',
      name: 'Solid',
      type: 'solid',
      visible: true,
      opacity: 0.8,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      color: '#ffffff',
    };
    const svcRes = svc.validateLayer(layer);
    const extracted = layerValidators.validateLayerStructure(layer);
    expect(svcRes).toEqual(extracted);
  });

  it('validateLayer delegates with parity for effect+equalizer', () => {
    const layer: any = {
      id: 'L2',
      name: 'Fx',
      type: 'effect',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      equalizerSettings: {
        barCount: null,
        colorMode: 'solid',
        primaryColor: '#f00',
        secondaryColor: '#00f',
      },
    };
    const svcRes = svc.validateLayer(layer);
    const extracted = layerValidators.validateLayerStructure(layer);
    expect(svcRes).toEqual(extracted);
  });

  it('validateLayer delegates with parity for a gradient layer', () => {
    const layer: any = {
      id: 'L3',
      name: 'Grad',
      type: 'gradient',
      visible: true,
      gradient: {
        type: 'radial',
        colors: ['#fff', 'rgba(0,0,0,1)'],
        stops: [0, 0.8, 1],
      },
    };
    const svcRes = svc.validateLayer(layer);
    const extracted = layerValidators.validateLayerStructure(layer);
    expect(svcRes).toEqual(extracted);
  });

  it('validateLayer delegates with parity for a circle layer', () => {
    const layer: any = {
      id: 'L4',
      name: 'Circle',
      type: 'circle',
      circleSettings: {
        radius: '99',
        thickness: 0.2,
        fillType: 'solid',
        strokeType: 'solid',
        fillColor: 'hsl(0, 0%, 100%)',
        strokeColor: '#GGGGGG',
        glowIntensity: 5,
        dashArray: ' 5, 5 ',
        animation: 'rotate',
        animationSpeed: 'fast',
      },
    };
    const svcRes = svc.validateLayer(layer);
    const extracted = layerValidators.validateLayerStructure(layer);
    expect(svcRes).toEqual(extracted);
  });
});
