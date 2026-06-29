import { LayerValidationService } from '../LayerValidationService';
import { getValidationService } from '../../ValidationService';

/**
 * E5-1 Parity Test: LayerValidationService should match ValidationService
 * behavior exactly (Phase 1 delegates to the monolith).
 */

describe('LayerValidationService (parity)', () => {
  const svc = new LayerValidationService();
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

  it('matches legacy for valid solid color', () => {
    const layer = { ...base, color: '#ff0000' };
    const newRes = svc.validateLayer(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });

  it('matches legacy for invalid color fallback/warnings', () => {
    const layer = { ...base, color: 'not-a-color' };
    const newRes = svc.validateLayer(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });

  it('matches legacy for gradient with missing stops/colors', () => {
    const layer = {
      ...base,
      type: 'gradient',
      gradient: { type: 'linear', colors: ['#fff'] },
    };
    const newRes = svc.validateLayer(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });

  it('matches legacy for image with src and adjustments', () => {
    const layer = {
      ...base,
      type: 'image',
      src: 'http://example.com/a.png',
      brightness: 2,
      contrast: 0.5,
    };
    const newRes = svc.validateLayer(layer);
    const oldRes = legacy.validateLayer(layer);
    expect(newRes).toEqual(oldRes);
  });
});
