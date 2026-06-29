import { renderHook, act } from '@testing-library/react';
import useLayerManagement from '../useLayerManagement';
import { Layer } from '../../types/layer-types';

describe('useLayerManagement', () => {
  const mockInitialLayers: Layer[] = [
    {
      id: 'layer1',
      name: 'Test Layer 1',
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
    {
      id: 'layer2',
      name: 'Test Layer 2',
      type: 'image',
      visible: true,
      opacity: 0.8,
      blendMode: 'multiply',
      scale: 1.5,
      rotation: 45,
      offsetX: 10,
      offsetY: -5,
      src: 'test-image.png',
      brightness: 1.2,
      contrast: 1.1,
    },
  ];

  it('initializes with provided layers and selected layer ID', () => {
    const { result } = renderHook(() =>
      useLayerManagement(mockInitialLayers, 'layer2')
    );

    expect(result.current.layers).toEqual(mockInitialLayers);
    expect(result.current.selectedLayerId).toBe('layer2');
    expect(result.current.multiSelectedLayers.size).toBe(0);
    expect(result.current.expandedLayers.size).toBe(0);
  });

  it('updates layer properties correctly', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    act(() => {
      result.current.updateLayer('layer1', { opacity: 0.5, visible: false });
    });

    const updatedLayer = result.current.layers.find(l => l.id === 'layer1');
    expect(updatedLayer?.opacity).toBe(0.5);
    expect(updatedLayer?.visible).toBe(false);
    expect(updatedLayer?.color).toBe('#ffffff'); // Other properties preserved
  });

  it('adds new layers with correct defaults', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    // Set layer type to gradient and add new layer
    act(() => {
      result.current.setNewLayerType('gradient');
    });

    act(() => {
      result.current.addNewLayer();
    });

    expect(result.current.layers).toHaveLength(3);
    const newLayer = result.current.layers[2];
    expect(newLayer.type).toBe('gradient');
    expect(newLayer.name).toBe('Gradient Layer 1');
    expect(newLayer.gradient).toBeDefined();
    expect(result.current.selectedLayerId).toBe(newLayer.id);
  });

  it('duplicates layers correctly', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    act(() => {
      result.current.duplicateLayer('layer1');
    });

    expect(result.current.layers).toHaveLength(3);
    const duplicatedLayer = result.current.layers[1]; // Should be inserted after original
    expect(duplicatedLayer.name).toBe('Test Layer 1 (Copy)');
    expect(duplicatedLayer.color).toBe('#ffffff');
    expect(duplicatedLayer.id).not.toBe('layer1');
    expect(result.current.selectedLayerId).toBe(duplicatedLayer.id);
  });

  it('deletes layers correctly but prevents deleting the last layer', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    // Delete one layer - should work
    act(() => {
      result.current.deleteLayer('layer2');
    });

    expect(result.current.layers).toHaveLength(1);
    expect(result.current.layers[0].id).toBe('layer1');

    // Try to delete the last layer - should be prevented
    act(() => {
      result.current.deleteLayer('layer1');
    });

    expect(result.current.layers).toHaveLength(1); // Still has one layer
  });

  it('handles multi-selection correctly', () => {
    const { result } = renderHook(() =>
      useLayerManagement(mockInitialLayers, 'layer1')
    );

    // Mock event with ctrlKey
    const mockEvent = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
    } as React.MouseEvent;

    act(() => {
      result.current.handleLayerClick('layer2', mockEvent);
    });

    expect(result.current.multiSelectedLayers.has('layer2')).toBe(true);
    expect(result.current.selectedLayerId).toBe('layer1'); // Should remain unchanged

    // Click again to deselect
    act(() => {
      result.current.handleLayerClick('layer2', mockEvent);
    });

    expect(result.current.multiSelectedLayers.has('layer2')).toBe(false);
  });

  it('selects all and deselects all layers', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    act(() => {
      result.current.selectAllLayers();
    });

    expect(result.current.multiSelectedLayers.size).toBe(2);
    expect(result.current.multiSelectedLayers.has('layer1')).toBe(true);
    expect(result.current.multiSelectedLayers.has('layer2')).toBe(true);

    act(() => {
      result.current.deselectAllLayers();
    });

    expect(result.current.multiSelectedLayers.size).toBe(0);
    expect(result.current.selectedLayerId).toBe('');
  });

  it('renames layers correctly', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    act(() => {
      result.current.renameLayer('layer1', 'New Layer Name');
    });

    const renamedLayer = result.current.layers.find(l => l.id === 'layer1');
    expect(renamedLayer?.name).toBe('New Layer Name');
  });

  it('toggles layer expanded state', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    expect(result.current.expandedLayers.has('layer1')).toBe(false);

    act(() => {
      result.current.toggleLayerExpanded('layer1');
    });

    expect(result.current.expandedLayers.has('layer1')).toBe(true);

    act(() => {
      result.current.toggleLayerExpanded('layer1');
    });

    expect(result.current.expandedLayers.has('layer1')).toBe(false);
  });

  it('moves layers up and down correctly', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    const initialOrder = result.current.layers.map(l => l.id);
    expect(initialOrder).toEqual(['layer1', 'layer2']);

    // Moving 'layer1' up (toward beginning of array) should swap with previous
    act(() => {
      result.current.moveLayer('layer2', 'up');
    });

    const newOrder = result.current.layers.map(l => l.id);
    expect(newOrder).toEqual(['layer2', 'layer1']);

    // Moving it back down should restore original order
    act(() => {
      result.current.moveLayer('layer2', 'down');
    });

    const finalOrder = result.current.layers.map(l => l.id);
    expect(finalOrder).toEqual(['layer1', 'layer2']);
  });

  it('deletes selected layers correctly', () => {
    const { result } = renderHook(() =>
      useLayerManagement([
        ...mockInitialLayers,
        {
          id: 'layer3',
          name: 'Test Layer 3',
          type: 'solid',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          color: '#ff0000',
        },
      ])
    );

    // Select multiple layers
    act(() => {
      result.current.setMultiSelectedLayers(new Set(['layer1', 'layer2']));
    });

    // Delete selected layers
    act(() => {
      result.current.deleteSelectedLayers();
    });

    expect(result.current.layers).toHaveLength(1);
    expect(result.current.layers[0].id).toBe('layer3');
    expect(result.current.multiSelectedLayers.size).toBe(0);
  });

  it('prevents deleting all layers', () => {
    const { result } = renderHook(() => useLayerManagement(mockInitialLayers));

    // Select all layers
    act(() => {
      result.current.setMultiSelectedLayers(new Set(['layer1', 'layer2']));
    });

    // Try to delete all layers - should be prevented
    act(() => {
      result.current.deleteSelectedLayers();
    });

    expect(result.current.layers).toHaveLength(2); // Should still have layers
  });
});
