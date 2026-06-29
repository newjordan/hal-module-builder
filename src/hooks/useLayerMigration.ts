/**
 * useLayerMigration - Safe migration wrapper from useLayerManagement to useLayer
 * Part of Phase 2: Core System Upgrades
 *
 * Provides gradual rollout of advanced layer management features with feature flags
 * Maintains backward compatibility while enabling performance improvements
 */

import { useState, useEffect, useMemo } from 'react';
import { Layer } from '../types/layer-types';
import { useLayerManagement } from './useLayerManagement';
import { useLayer, UseLayerOptions } from './useLayer';
import { isAdvancedLayerManagementEnabled } from '../config/featureFlags';

export interface UseLayerMigrationOptions {
  initialLayers?: Layer[];
  initialSelectedLayerId?: string;
  enableBatchOperations?: boolean;
  enableMultiSelection?: boolean;
  enablePerformanceMonitoring?: boolean;
  onMigrationStateChange?: (isAdvanced: boolean) => void;
}

export interface UseLayerMigrationReturn {
  // Unified interface that works for both hooks
  layers: Layer[];
  selectedLayerId: string;
  multiSelectedLayers: Set<string>;
  expandedLayers: Set<string>;
  newLayerType: Layer['type'];

  // Core operations available in both
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  renameLayer: (layerId: string, newName: string) => void;

  // State setters
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  setSelectedLayerId: React.Dispatch<React.SetStateAction<string>>;
  setMultiSelectedLayers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setNewLayerType: React.Dispatch<React.SetStateAction<Layer['type']>>;

  // Layer CRUD operations
  addNewLayer: () => void;

  // Selection management
  selectAllLayers: () => void;
  deselectAllLayers: () => void;
  deleteSelectedLayers: () => void;
  duplicateSelectedLayers: () => void;
  handleLayerClick: (layerId: string, event: React.MouseEvent) => void;

  // Layer management
  handleShapeTypeChange: (layerId: string, newShapeType: string) => void;
  toggleLayerExpanded: (layerId: string) => void;

  // Migration status
  isUsingAdvancedManagement: boolean;
  migrationComplete: boolean;
}

/**
 * Migration wrapper that safely transitions from useLayerManagement to useLayer
 * Uses feature flags for gradual rollout and maintains API compatibility
 */
export const useLayerMigration = (
  options: UseLayerMigrationOptions = {}
): UseLayerMigrationReturn => {
  const {
    initialLayers = [],
    initialSelectedLayerId = '',
    enableBatchOperations: _enableBatchOperations = true,
    enableMultiSelection: _enableMultiSelection = true,
    enablePerformanceMonitoring = false,
    onMigrationStateChange,
  } = options;

  // Check if advanced layer management is enabled
  const useAdvancedManagement = isAdvancedLayerManagementEnabled();
  const [migrationComplete, setMigrationComplete] = useState(false);

  // Notify about migration state changes
  useEffect(() => {
    onMigrationStateChange?.(useAdvancedManagement);
  }, [useAdvancedManagement, onMigrationStateChange]);

  // Configure advanced layer options
  const advancedOptions: UseLayerOptions = useMemo(
    () => ({
      initialLayers,
      initialSelectedLayer: initialSelectedLayerId,
      validateOnUpdate: true,
      enablePerformanceMonitoring,
      onLayersChange: () => {
        if (!migrationComplete) {
          setMigrationComplete(true);
        }
      },
    }),
    [
      initialLayers,
      initialSelectedLayerId,
      enablePerformanceMonitoring,
      migrationComplete,
    ]
  );

  // Choose which hook to use based on feature flag
  const legacyLayerManagement = useLayerManagement(
    initialLayers,
    initialSelectedLayerId
  );
  const advancedLayerManagement = useLayer(advancedOptions);

  // Return unified interface
  if (useAdvancedManagement) {
    // Map advanced hook to legacy interface for compatibility
    return {
      // Core state
      layers: advancedLayerManagement.layers,
      selectedLayerId: advancedLayerManagement.selectedLayerId,
      multiSelectedLayers: advancedLayerManagement.multiSelectedLayers,
      expandedLayers: new Set<string>(), // Not directly supported in advanced mode
      newLayerType: 'shape' as Layer['type'], // Default type

      // Core operations
      updateLayer: advancedLayerManagement.updateLayer,
      moveLayer: advancedLayerManagement.moveLayer,
      deleteLayer: (layerId: string) => {
        advancedLayerManagement.deleteLayer(layerId);
      },
      duplicateLayer: (layerId: string) => {
        advancedLayerManagement.duplicateLayer(layerId);
      },
      renameLayer: advancedLayerManagement.renameLayer,

      // State setters
      setLayers: updater => {
        if (typeof updater === 'function') {
          const nextLayers = (updater as (prev: Layer[]) => Layer[])(
            advancedLayerManagement.layers
          );
          advancedLayerManagement.setLayers(nextLayers);
        } else {
          advancedLayerManagement.setLayers(updater);
        }
      },
      setSelectedLayerId: updater => {
        if (typeof updater === 'function') {
          const nextId = (updater as (prev: string) => string)(
            advancedLayerManagement.selectedLayerId
          );
          advancedLayerManagement.setSelectedLayerId(nextId);
        } else {
          advancedLayerManagement.setSelectedLayerId(updater);
        }
      },
      setMultiSelectedLayers: updater => {
        if (typeof updater === 'function') {
          const nextSet = (updater as (prev: Set<string>) => Set<string>)(
            advancedLayerManagement.multiSelectedLayers
          );
          advancedLayerManagement.setMultiSelectedLayers(nextSet);
        } else {
          advancedLayerManagement.setMultiSelectedLayers(updater);
        }
      },
      setNewLayerType: () => {}, // No-op in advanced mode

      // Layer CRUD operations
      addNewLayer: () => {
        advancedLayerManagement.addLayer({ type: 'shape', name: 'New Layer' });
      },

      // Selection management
      selectAllLayers: advancedLayerManagement.selectAllLayers,
      deselectAllLayers: advancedLayerManagement.deselectAllLayers,
      deleteSelectedLayers: () => {
        const selectedIds = Array.from(
          advancedLayerManagement.multiSelectedLayers
        );
        advancedLayerManagement.deleteLayers(selectedIds);
      },
      duplicateSelectedLayers: () => {
        const selectedIds = Array.from(
          advancedLayerManagement.multiSelectedLayers
        );
        advancedLayerManagement.duplicateLayers(selectedIds);
      },
      handleLayerClick: (layerId: string, event: React.MouseEvent) => {
        if (event.shiftKey) {
          // Shift-click for range selection (simplified)
          advancedLayerManagement.setSelectedLayerId(layerId);
        } else if (event.ctrlKey || event.metaKey) {
          // Ctrl/Cmd-click for multi-selection
          const current = new Set(advancedLayerManagement.multiSelectedLayers);
          if (current.has(layerId)) {
            current.delete(layerId);
          } else {
            current.add(layerId);
          }
          advancedLayerManagement.setMultiSelectedLayers(current);
        } else {
          // Normal click
          advancedLayerManagement.setSelectedLayerId(layerId);
          advancedLayerManagement.deselectAllLayers();
        }
      },

      // Layer management
      handleShapeTypeChange: (layerId: string, newShapeType: string) => {
        advancedLayerManagement.updateLayer(layerId, {
          shapeType: newShapeType as NonNullable<Layer['shapeType']>,
        });
      },
      toggleLayerExpanded: () => {}, // No-op in advanced mode

      // Migration status
      isUsingAdvancedManagement: true,
      migrationComplete: true,
    };
  } else {
    // Use legacy layer management
    return {
      // Core state
      layers: legacyLayerManagement.layers,
      selectedLayerId: legacyLayerManagement.selectedLayerId,
      multiSelectedLayers: legacyLayerManagement.multiSelectedLayers,
      expandedLayers: legacyLayerManagement.expandedLayers,
      newLayerType: legacyLayerManagement.newLayerType,

      // Core operations
      updateLayer: legacyLayerManagement.updateLayer,
      moveLayer: legacyLayerManagement.moveLayer,
      deleteLayer: legacyLayerManagement.deleteLayer,
      duplicateLayer: legacyLayerManagement.duplicateLayer,
      renameLayer: legacyLayerManagement.renameLayer,

      // State setters
      setLayers: legacyLayerManagement.setLayers,
      setSelectedLayerId: legacyLayerManagement.setSelectedLayerId,
      setMultiSelectedLayers: legacyLayerManagement.setMultiSelectedLayers,
      setNewLayerType: legacyLayerManagement.setNewLayerType,

      // Layer CRUD operations
      addNewLayer: legacyLayerManagement.addNewLayer,

      // Selection management
      selectAllLayers: legacyLayerManagement.selectAllLayers,
      deselectAllLayers: legacyLayerManagement.deselectAllLayers,
      deleteSelectedLayers: legacyLayerManagement.deleteSelectedLayers,
      duplicateSelectedLayers: legacyLayerManagement.duplicateSelectedLayers,
      handleLayerClick: legacyLayerManagement.handleLayerClick,

      // Layer management
      handleShapeTypeChange: legacyLayerManagement.handleShapeTypeChange,
      toggleLayerExpanded: legacyLayerManagement.toggleLayerExpanded,

      // Migration status
      isUsingAdvancedManagement: false,
      migrationComplete: false,
    };
  }
};
