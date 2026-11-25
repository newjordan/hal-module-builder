import type { Layer } from '../../types/layer-types';
import {
  batchLayerUpdates,
  getVisibleLayers,
  moveLayerOptimized,
  optimizedLayerUpdate,
} from '../layer-utils';

function layer(id: string, overrides: Partial<Layer> = {}): Layer {
  return {
    id,
    name: id,
    type: 'shape',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    ...overrides,
  };
}

describe('layer-utils', () => {
  const layers = [
    layer('back'),
    layer('eye', {
      equalizerSettings: { barStyle: 'bar', lineWidth: 2 },
    }),
    layer('front', { visible: false, opacity: 0.4 }),
  ];

  it('updates one layer immutably and deep-merges equalizer settings', () => {
    const next = optimizedLayerUpdate(layers, 'eye', {
      opacity: 0.5,
      equalizerSettings: { lineWidth: 6 },
    });

    expect(next).not.toBe(layers);
    expect(layers[1]?.opacity).toBe(1);
    expect(next[1]?.opacity).toBe(0.5);
    expect(next[1]?.equalizerSettings).toMatchObject({
      barStyle: 'bar',
      lineWidth: 6,
    });
    expect(optimizedLayerUpdate(layers, 'missing', { opacity: 0 })).toBe(
      layers
    );
  });

  it('applies a batch of changes and filters visible layers', () => {
    const next = batchLayerUpdates(layers, [
      { layerId: 'back', changes: { rotation: 15 } },
      { layerId: 'missing', changes: { opacity: 0 } },
    ]);

    expect(next[0]?.rotation).toBe(15);
    expect(next[2]).toBe(layers[2]);
    expect(getVisibleLayers(next).map(item => item.id)).toEqual([
      'back',
      'eye',
    ]);
  });

  it('moves a layer up or down and ignores edges', () => {
    const up = moveLayerOptimized(layers, 'eye', 'up');
    expect(up.map(item => item.id)).toEqual(['eye', 'back', 'front']);

    const down = moveLayerOptimized(layers, 'eye', 'down');
    expect(down.map(item => item.id)).toEqual(['back', 'front', 'eye']);

    expect(moveLayerOptimized(layers, 'back', 'up')).toEqual(layers);
    expect(moveLayerOptimized(layers, 'missing', 'down')).toBe(layers);
  });
});
