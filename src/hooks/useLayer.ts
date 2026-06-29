/**
 * useLayer Hook - Layer management operations
 * Provides optimized layer CRUD operations with validation and performance monitoring
 */
import { useState, useCallback, useRef } from 'react';
import { Layer } from '../types/layer-types';
import { getValidationService } from '../services/ValidationService';
import { optimizedLayerUpdate, moveLayerOptimized } from '../utils/layer-utils';

export interface UseLayerReturn {
  layers: Layer[];
  selectedLayerId: string;
  multiSelectedLayers: Set<string>;
  setLayers: (layers: Layer[]) => void;
  setSelectedLayerId: (id: string) => void;
  setMultiSelectedLayers: (layers: Set<string>) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  addLayer: (layer: Partial<Layer>) => Layer | null;
  duplicateLayer: (layerId: string) => Layer | null;
  deleteLayer: (layerId: string) => boolean;
  deleteLayers: (layerIds: string[]) => number;
  duplicateLayers: (layerIds: string[]) => Layer[];
  renameLayer: (layerId: string, newName: string) => boolean;
  toggleLayerVisibility: (layerId: string) => boolean;
  getLayer: (layerId: string) => Layer | null;
  getLayers: (layerIds: string[]) => Layer[];
  validateLayer: (layer: Partial<Layer>) => boolean;
  selectAllLayers: () => void;
  deselectAllLayers: () => void;
  selectLayerRange: (startId: string, endId: string) => void;
}

export interface UseLayerOptions {
  initialLayers?: Layer[];
  initialSelectedLayer?: string;
  onLayerUpdate?: (layer: Layer) => void;
  onLayersChange?: (layers: Layer[]) => void;
  onSelectionChange?: (selectedId: string, multiSelected: Set<string>) => void;
  validateOnUpdate?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export const useLayer = (options: UseLayerOptions = {}): UseLayerReturn => {
  const {
    initialLayers = [],
    initialSelectedLayer = '',
    onLayerUpdate,
    onLayersChange,
    onSelectionChange,
    validateOnUpdate = true,
    enablePerformanceMonitoring = false,
  } = options;

  const [layers, setLayersState] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerIdState] =
    useState(initialSelectedLayer);
  const [multiSelectedLayers, setMultiSelectedLayersState] = useState<
    Set<string>
  >(new Set());

  const validationService = getValidationService();
  const performanceRef = useRef({ updateCount: 0, lastUpdate: Date.now() });

  /**
   * Update performance metrics
   */
  const trackPerformance = useCallback(() => {
    if (!enablePerformanceMonitoring) return;

    performanceRef.current.updateCount++;
    performanceRef.current.lastUpdate = Date.now();
  }, [enablePerformanceMonitoring]);

  /**
   * Set layers with validation and callbacks
   */
  const setLayers = useCallback(
    (newLayers: Layer[]) => {
      if (validateOnUpdate) {
        // Validate all layers
        const validatedLayers = newLayers
          .map(layer => {
            const validation = validationService.validateLayer(layer);
            return validation.isValid
              ? layer
              : (validation.sanitizedValue as Layer);
          })
          .filter((layer): layer is Layer => Boolean(layer));

        setLayersState(validatedLayers);
        trackPerformance();

        if (onLayersChange) {
          onLayersChange(validatedLayers);
        }
      } else {
        setLayersState(newLayers);
        trackPerformance();

        if (onLayersChange) {
          onLayersChange(newLayers);
        }
      }
    },
    [validateOnUpdate, validationService, trackPerformance, onLayersChange]
  );

  /**
   * Set selected layer with callback
   */
  const setSelectedLayerId = useCallback(
    (id: string) => {
      setSelectedLayerIdState(id);

      if (onSelectionChange) {
        onSelectionChange(id, multiSelectedLayers);
      }
    },
    [onSelectionChange, multiSelectedLayers]
  );

  /**
   * Set multi-selected layers with callback
   */
  const setMultiSelectedLayers = useCallback(
    (selected: Set<string>) => {
      setMultiSelectedLayersState(selected);

      if (onSelectionChange) {
        onSelectionChange(selectedLayerId, selected);
      }
    },
    [onSelectionChange, selectedLayerId]
  );

  /**
   * Update a specific layer with optimized performance
   */
  const updateLayer = useCallback(
    (layerId: string, updates: Partial<Layer>) => {
      const optimized = optimizedLayerUpdate(layers, layerId, updates);

      // Find updated layer and call callback
      if (onLayerUpdate) {
        const updatedLayer = optimized.find(l => l.id === layerId);
        if (updatedLayer) {
          onLayerUpdate(updatedLayer);
        }
      }

      setLayers(optimized);
    },
    [layers, setLayers, onLayerUpdate]
  );

  /**
   * Move layer up or down with optimized performance
   */
  const moveLayer = useCallback(
    (layerId: string, direction: 'up' | 'down') => {
      const optimized = moveLayerOptimized(layers, layerId, direction);
      setLayers(optimized);
    },
    [layers, setLayers]
  );

  /**
   * Add a new layer with validation
   */
  const addLayer = useCallback(
    (layerData: Partial<Layer>): Layer | null => {
      // Generate ID if not provided
      const newLayer: Layer = {
        id: layerData.id || `layer_${Date.now()}`,
        name: layerData.name || 'New Layer',
        type: layerData.type || 'solid',
        visible: layerData.visible !== undefined ? layerData.visible : true,
        opacity: layerData.opacity !== undefined ? layerData.opacity : 1,
        blendMode: layerData.blendMode || 'normal',
        scale: layerData.scale !== undefined ? layerData.scale : 1,
        rotation: layerData.rotation !== undefined ? layerData.rotation : 0,
        offsetX: layerData.offsetX !== undefined ? layerData.offsetX : 0,
        offsetY: layerData.offsetY !== undefined ? layerData.offsetY : 0,
        ...layerData,
      } as Layer;

      // Validate the new layer
      if (validateOnUpdate) {
        const validation = validationService.validateLayer(newLayer);
        if (!validation.isValid) {
          console.error('Invalid layer data:', validation.errors);
          return null;
        }

        // Use sanitized version
        const sanitizedLayer = validation.sanitizedValue as Layer;
        setLayers([...layers, sanitizedLayer]);
        return sanitizedLayer;
      } else {
        setLayers([...layers, newLayer]);
        return newLayer;
      }
    },
    [layers, setLayers, validateOnUpdate, validationService]
  );

  /**
   * Duplicate a layer
   */
  const duplicateLayer = useCallback(
    (layerId: string): Layer | null => {
      const originalLayer = layers.find(l => l.id === layerId);
      if (!originalLayer) {
        return null;
      }

      const duplicatedLayer: Layer = {
        ...JSON.parse(JSON.stringify(originalLayer)),
        id: `${layerId}_copy_${Date.now()}`,
        name: `${originalLayer.name} (Copy)`,
      };

      const index = layers.findIndex(l => l.id === layerId);
      const newLayers = [...layers];
      newLayers.splice(index + 1, 0, duplicatedLayer);
      setLayers(newLayers);

      return duplicatedLayer;
    },
    [layers, setLayers]
  );

  /**
   * Delete a single layer
   */
  const deleteLayer = useCallback(
    (layerId: string): boolean => {
      const layerExists = layers.some(l => l.id === layerId);
      if (!layerExists) {
        return false;
      }

      setLayers(layers.filter(l => l.id !== layerId));

      // Clear selection if deleted layer was selected
      if (selectedLayerId === layerId) {
        setSelectedLayerId('');
      }

      // Remove from multi-selection if present
      if (multiSelectedLayers.has(layerId)) {
        const newSelection = new Set(multiSelectedLayers);
        newSelection.delete(layerId);
        setMultiSelectedLayers(newSelection);
      }

      return true;
    },
    [
      layers,
      setLayers,
      selectedLayerId,
      setSelectedLayerId,
      multiSelectedLayers,
      setMultiSelectedLayers,
    ]
  );

  /**
   * Delete multiple layers
   */
  const deleteLayers = useCallback(
    (layerIds: string[]): number => {
      const existingIds = layerIds.filter(id => layers.some(l => l.id === id));

      if (existingIds.length === 0) {
        return 0;
      }

      setLayers(layers.filter(l => !existingIds.includes(l.id)));

      // Clear selections for deleted layers
      if (existingIds.includes(selectedLayerId)) {
        setSelectedLayerId('');
      }

      const newMultiSelection = new Set(multiSelectedLayers);
      existingIds.forEach(id => newMultiSelection.delete(id));
      if (newMultiSelection.size !== multiSelectedLayers.size) {
        setMultiSelectedLayers(newMultiSelection);
      }

      return existingIds.length;
    },
    [
      layers,
      setLayers,
      selectedLayerId,
      setSelectedLayerId,
      multiSelectedLayers,
      setMultiSelectedLayers,
    ]
  );

  /**
   * Duplicate multiple layers
   */
  const duplicateLayers = useCallback(
    (layerIds: string[]): Layer[] => {
      const layersToDuplicate = layers.filter(l => layerIds.includes(l.id));
      const duplicatedLayers: Layer[] = [];

      layersToDuplicate.forEach(layer => {
        const duplicated: Layer = {
          ...JSON.parse(JSON.stringify(layer)),
          id: `${layer.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: `${layer.name} (Copy)`,
        };
        duplicatedLayers.push(duplicated);
      });

      setLayers([...layers, ...duplicatedLayers]);
      return duplicatedLayers;
    },
    [layers, setLayers]
  );

  /**
   * Rename a layer
   */
  const renameLayer = useCallback(
    (layerId: string, newName: string): boolean => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) {
        return false;
      }

      updateLayer(layerId, { name: newName.trim() });
      return true;
    },
    [layers, updateLayer]
  );

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = useCallback(
    (layerId: string): boolean => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) {
        return false;
      }

      updateLayer(layerId, { visible: !layer.visible });
      return true;
    },
    [layers, updateLayer]
  );

  /**
   * Get a specific layer by ID
   */
  const getLayer = useCallback(
    (layerId: string): Layer | null => {
      return layers.find(l => l.id === layerId) || null;
    },
    [layers]
  );

  /**
   * Get multiple layers by IDs
   */
  const getLayers = useCallback(
    (layerIds: string[]): Layer[] => {
      return layers.filter(l => layerIds.includes(l.id));
    },
    [layers]
  );

  /**
   * Validate layer data
   */
  const validateLayer = useCallback(
    (layer: Partial<Layer>): boolean => {
      const validation = validationService.validateLayer(layer);
      return validation.isValid;
    },
    [validationService]
  );

  /**
   * Select all layers
   */
  const selectAllLayers = useCallback(() => {
    const allLayerIds = new Set(layers.map(l => l.id));
    setMultiSelectedLayers(allLayerIds);
    setSelectedLayerId('');
  }, [layers, setMultiSelectedLayers, setSelectedLayerId]);

  /**
   * Deselect all layers
   */
  const deselectAllLayers = useCallback(() => {
    setMultiSelectedLayers(new Set());
    setSelectedLayerId('');
  }, [setMultiSelectedLayers, setSelectedLayerId]);

  /**
   * Select a range of layers
   */
  const selectLayerRange = useCallback(
    (startId: string, endId: string) => {
      const startIndex = layers.findIndex(l => l.id === startId);
      const endIndex = layers.findIndex(l => l.id === endId);

      if (startIndex === -1 || endIndex === -1) {
        return;
      }

      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      const rangeIds = new Set<string>();

      for (let i = start; i <= end; i++) {
        const layer = layers[i];
        if (layer) {
          rangeIds.add(layer.id);
        }
      }

      setMultiSelectedLayers(rangeIds);
    },
    [layers, setMultiSelectedLayers]
  );

  return {
    layers,
    selectedLayerId,
    multiSelectedLayers,
    setLayers,
    setSelectedLayerId,
    setMultiSelectedLayers,
    updateLayer,
    moveLayer,
    addLayer,
    duplicateLayer,
    deleteLayer,
    deleteLayers,
    duplicateLayers,
    renameLayer,
    toggleLayerVisibility,
    getLayer,
    getLayers,
    validateLayer,
    selectAllLayers,
    deselectAllLayers,
    selectLayerRange,
  };
};
