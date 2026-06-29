/**
 * Layer utility functions for HAL Module Builder
 *
 * This module provides optimized utility functions for layer management,
 * including creation, updates, movement, and performance optimizations.
 * All functions follow immutable patterns to ensure React state integrity.
 *
 * @fileoverview Comprehensive layer manipulation and optimization utilities
 */

import { Layer } from '../types/layer-types';

/**
 * Generate a unique identifier for new layers
 *
 * Creates a unique layer ID using timestamp and random string to ensure
 * no collisions in layer identification.
 *
 * @returns Unique layer identifier string
 * @example
 * ```typescript
 * const newLayer: Layer = {
 *   id: generateLayerId(),
 *   name: 'New Layer',
 *   type: 'gradient',
 *   // ... other properties
 * };
 * ```
 */
export const generateLayerId = (): string => {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Update a single layer with optimized performance
 *
 * Performs an immutable update of a specific layer in the layers array.
 * Uses efficient array operations to minimize re-renders and memory usage.
 *
 * @param layers - Current layers array
 * @param layerId - ID of the layer to update
 * @param updates - Partial layer object with properties to update
 * @returns New layers array with the updated layer
 * @example
 * ```typescript
 * const updatedLayers = optimizedLayerUpdate(layers, 'layer_123', {
 *   opacity: 0.5,
 *   visible: false,
 *   offsetX: 100
 * });
 *
 * setLayers(updatedLayers);
 * ```
 */
export const optimizedLayerUpdate = (
  layers: Layer[],
  layerId: string,
  updates: Partial<Layer>
): Layer[] => {
  const index = layers.findIndex(l => l.id === layerId);
  if (index === -1) return layers;

  const newLayers = [...layers];
  const existingLayer = newLayers[index]!;

  // Deep merge for nested objects like equalizerSettings
  const mergedLayer = { ...existingLayer };

  // Handle equalizerSettings specifically with deep merge
  if ('equalizerSettings' in updates && updates.equalizerSettings) {
    mergedLayer.equalizerSettings = {
      ...existingLayer.equalizerSettings,
      ...updates.equalizerSettings,
    };
    // Remove from updates to avoid overwriting
    const { equalizerSettings, ...restUpdates } = updates;
    Object.assign(mergedLayer, restUpdates);
  } else {
    Object.assign(mergedLayer, updates);
  }

  newLayers[index] = mergedLayer;
  return newLayers;
};

/**
 * Batch update multiple layers efficiently
 *
 * Applies multiple layer updates in a single operation using a Map-based
 * approach for optimal performance when updating many layers simultaneously.
 *
 * @param layers - Current layers array
 * @param updates - Array of layer updates with ID and changes
 * @returns New layers array with all updates applied
 * @example
 * ```typescript
 * const updates = [
 *   { layerId: 'layer_1', changes: { opacity: 0.5 } },
 *   { layerId: 'layer_2', changes: { visible: false } },
 *   { layerId: 'layer_3', changes: { rotation: 45, scale: 1.2 } }
 * ];
 *
 * const updatedLayers = batchLayerUpdates(layers, updates);
 * setLayers(updatedLayers);
 * ```
 */
export const batchLayerUpdates = (
  layers: Layer[],
  updates: Array<{ layerId: string; changes: Partial<Layer> }>
): Layer[] => {
  const layerMap = new Map(layers.map(l => [l.id, l]));

  updates.forEach(({ layerId, changes }) => {
    const layer = layerMap.get(layerId);
    if (layer) {
      // Deep merge for nested objects like equalizerSettings
      let updatedLayer;
      if ('equalizerSettings' in changes && changes.equalizerSettings) {
        updatedLayer = {
          ...layer,
          equalizerSettings: {
            ...layer.equalizerSettings,
            ...changes.equalizerSettings,
          },
        };
        const { equalizerSettings, ...restChanges } = changes;
        updatedLayer = { ...updatedLayer, ...restChanges };
      } else {
        updatedLayer = { ...layer, ...changes };
      }
      layerMap.set(layerId, updatedLayer);
    }
  });

  return layers.map(l => layerMap.get(l.id)!);
};

/**
 * Move a layer up or down in the layer stack with optimization
 *
 * Efficiently reorders layers by swapping positions rather than
 * rebuilding the entire array. Maintains immutability for React.
 *
 * @param layers - Current layers array
 * @param layerId - ID of the layer to move
 * @param direction - Direction to move ('up' or 'down')
 * @returns New layers array with layer moved, or original if move not possible
 * @example
 * ```typescript
 * // Move layer forward in render order (up in z-index, higher array index)
 * const movedUp = moveLayerOptimized(layers, 'layer_123', 'up');
 *
 * // Move layer backward in render order (down in z-index, lower array index)
 * const movedDown = moveLayerOptimized(layers, 'layer_123', 'down');
 * ```
 */
export const moveLayerOptimized = (
  layers: Layer[],
  layerId: string,
  direction: 'up' | 'down'
): Layer[] => {
  const index = layers.findIndex(l => l.id === layerId);
  if (index === -1) return layers;

  const newLayers = [...layers];

  if (direction === 'up' && index > 0) {
    // Moving up in visual list means moving to lower array index (due to reversed display)
    const currentLayer = newLayers[index]!;
    const prevLayer = newLayers[index - 1]!;
    [newLayers[index], newLayers[index - 1]] = [prevLayer, currentLayer];
  } else if (direction === 'down' && index < newLayers.length - 1) {
    // Moving down in visual list means moving to higher array index (due to reversed display)
    const currentLayer = newLayers[index]!;
    const nextLayer = newLayers[index + 1]!;
    [newLayers[index], newLayers[index + 1]] = [nextLayer, currentLayer];
  }

  return newLayers;
};

/**
 * Filter layers to only visible ones
 *
 * Returns a new array containing only layers that have their
 * visible property set to true. Useful for rendering optimization.
 *
 * @param layers - Array of layers to filter
 * @returns Array containing only visible layers
 * @example
 * ```typescript
 * const visibleLayers = getVisibleLayers(allLayers);
 * // Only render the visible layers for performance
 * visibleLayers.forEach(layer => renderLayer(layer));
 * ```
 */
export const getVisibleLayers = (layers: Layer[]): Layer[] => {
  return layers.filter(layer => layer.visible);
};

/**
 * Throttle function calls to limit execution frequency
 *
 * Creates a throttled version of the provided function that will only
 * execute at most once per specified time limit. Useful for performance
 * optimization of frequently called functions like resize handlers.
 *
 * @param func - Function to throttle
 * @param limit - Minimum time between executions in milliseconds
 * @returns Throttled version of the function
 * @example
 * ```typescript
 * const throttledUpdate = throttle((layers: Layer[]) => {
 *   updateLayerPositions(layers);
 * }, 16); // Limit to ~60fps
 *
 * // Will only execute at most once per 16ms
 * window.addEventListener('mousemove', () => throttledUpdate(layers));
 * ```
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
};

/**
 * Debounce function calls to delay execution until after calls have stopped
 *
 * Creates a debounced version of the provided function that will only
 * execute after the specified wait time has elapsed since the last call.
 * Useful for expensive operations that shouldn't run on every event.
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds before execution
 * @returns Debounced version of the function
 * @example
 * ```typescript
 * const debouncedSave = debounce((layers: Layer[]) => {
 *   saveLayersToStorage(layers);
 * }, 500); // Wait 500ms after last change
 *
 * // Will only save 500ms after the last layer update
 * onLayerChange(() => debouncedSave(layers));
 * ```
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
