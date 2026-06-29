import { layerValidators } from '../../validators/layerValidators';
import { getValidationService } from '../../../services/ValidationService';

describe('layerValidators.validateLayerStructure (parity)', () => {
  const legacy = getValidationService();

  const base = {
    id: 'L1',
    name: 'Test Layer',
    type: 'solid',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  } as const;

  it('parity: solid with valid color', () => {
    const layer = { ...base, color: '#00ff00' };
    const newRes = layerValidators.validateLayerStructure(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });

  it('parity: gradient with 1 color (auto-fix stops/colors)', () => {
    const layer = {
      ...base,
      type: 'gradient',
      gradient: { type: 'linear', colors: ['#fff'] },
    };
    const newRes = layerValidators.validateLayerStructure(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });

  it('parity: circle settings sanitation', () => {
    const layer = {
      ...base,
      type: 'circle',
      circleSettings: { radius: -10, thickness: 100, animation: 'spin' },
    } as any;
    const newRes = layerValidators.validateLayerStructure(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });

  it('parity: effect equalizer defaults', () => {
    const layer = {
      ...base,
      type: 'effect',
      equalizerSettings: { barCount: null },
    } as any;
    const newRes = layerValidators.validateLayerStructure(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });
});
