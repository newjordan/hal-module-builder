import { useState, useEffect, useMemo, useCallback } from 'react';
import useLayerManagement from './useLayerManagement';
import useGradientManagement from './useGradientManagement';
import useAudioContext from './useAudioContext';
import useTemplates from './useTemplates';
import { useMemoryMonitor } from './useMemoryMonitor';
import { performanceMonitor } from '../utils/performance-monitoring';
import { PerformanceBaselineManager } from '../utils/PerformanceBaselines';
import { Layer } from '../types/layer-types';
import { ShortcutDefinition } from '../components/KeyboardShortcuts/KeyboardShortcutProvider';

// Default layers configuration - empty by default, users add layers as needed
const getDefaultLayers = (): Layer[] => [];

export interface AppOrchestrationOptions {
  enablePerformanceMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  defaultLayers?: Layer[];
}

export const useAppOrchestration = (options: AppOrchestrationOptions = {}) => {
  const {
    enablePerformanceMonitoring = false,
    enableMemoryMonitoring = true,
    defaultLayers = getDefaultLayers(),
  } = options;

  // UI State
  const [showControls, setShowControls] = useState(true);
  const [debugOverlay, setDebugOverlay] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(
    enablePerformanceMonitoring
  );
  const [showPresetDialog, setShowPresetDialog] = useState(false);

  // Layer Management
  const layerManagement = useLayerManagement(defaultLayers);
  const {
    layers,
    selectedLayerId,
    multiSelectedLayers,
    expandedLayers,
    newLayerType,
    setLayers,
    setSelectedLayerId,
    setNewLayerType,
    addNewLayer,
    duplicateLayer,
    deleteLayer,
    renameLayer,
    updateLayer,
    moveLayer,
    handleShapeTypeChange,
    handleLayerClick,
    selectAllLayers,
    deselectAllLayers,
    deleteSelectedLayers,
    duplicateSelectedLayers,
    toggleLayerExpanded,
  } = layerManagement;

  // Gradient Management
  const gradientManagement = useGradientManagement();
  const {
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    updateGradientStop,
  } = gradientManagement;

  // Audio Context
  const { audioData, isActive, toggleAudio } = useAudioContext(layers, {
    fftSize: 128,
    defaultResponseSpeed: 0.8,
    autoCleanup: true,
  });

  // Template Management
  const {
    presets,
    presetName,
    setPresetName,
    savePreset: savePresetToStorage,
    loadPreset: loadPresetFromStorage,
    deletePreset,
    exportPreset,
    importPreset,
  } = useTemplates({
    autoSave: false,
    autoRecovery: true,
    maxPresets: 100,
  });

  // Memory Monitoring
  const memoryMonitor = useMemoryMonitor({
    enabled: enableMemoryMonitoring,
    interval: 10000,
    warningThreshold: 0.7,
    criticalThreshold: 0.85,
    onAlert: alert => {
      console.warn(
        `Memory Alert [${alert.type.toUpperCase()}]:`,
        `${alert.stats.usedJSHeapSize.toFixed(2)} bytes used`
      );
    },
  });

  // Performance Monitoring
  useEffect(() => {
    if (showPerformanceMonitor) {
      performanceMonitor.start();
    } else {
      performanceMonitor.stop();
    }

    // Establish performance baseline on first load
    const establishBaseline = async () => {
      try {
        const baselineManager = PerformanceBaselineManager.getInstance();
        await baselineManager.establishBaseline();
        baselineManager.startMonitoring();
      } catch (error) {
        console.warn('Failed to establish performance baseline:', error);
      }
    };

    if (!sessionStorage.getItem('performance-baseline-established')) {
      sessionStorage.setItem('performance-baseline-established', 'true');
      setTimeout(establishBaseline, 2000);
    }

    return () => performanceMonitor.stop();
  }, [showPerformanceMonitor]);

  // Get selected layer
  const selectedLayer = useMemo(
    () => layers.find(l => l.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  // Generate keyboard shortcuts
  const shortcuts: ShortcutDefinition[] = useMemo(
    () => [
      {
        key: 'd',
        ctrl: true,
        action: () => duplicateSelectedLayers(),
        description: 'Duplicate selected layer(s)',
      },
      {
        key: 'Delete',
        action: () => deleteSelectedLayers(),
        description: 'Delete selected layer(s)',
      },
      {
        key: 'h',
        action: () => {
          if (selectedLayerId && selectedLayer) {
            updateLayer(selectedLayerId, { visible: !selectedLayer.visible });
          }
        },
        description: 'Toggle layer visibility',
      },
      {
        key: 'ArrowUp',
        ctrl: true,
        action: () => {
          if (selectedLayerId) moveLayer(selectedLayerId, 'up');
        },
        description: 'Move layer up',
      },
      {
        key: 'ArrowDown',
        ctrl: true,
        action: () => {
          if (selectedLayerId) moveLayer(selectedLayerId, 'down');
        },
        description: 'Move layer down',
      },
      {
        key: 'a',
        ctrl: true,
        action: () => selectAllLayers(),
        description: 'Select all layers',
      },
      {
        key: 'Escape',
        action: () => deselectAllLayers(),
        description: 'Deselect all layers',
      },
      {
        key: 'p',
        alt: true,
        action: () => setShowPerformanceMonitor(prev => !prev),
        description: 'Toggle performance monitor',
      },
    ],
    [
      selectedLayerId,
      selectedLayer,
      duplicateSelectedLayers,
      deleteSelectedLayers,
      updateLayer,
      moveLayer,
      selectAllLayers,
      deselectAllLayers,
    ]
  );

  // Template operations with layer integration
  const savePreset = useCallback(
    (name: string) => {
      savePresetToStorage(layers, name);
    },
    [layers, savePresetToStorage]
  );

  const loadPreset = useCallback(
    (preset: import('../types/layer-types').Preset) => {
      const loadedLayers = loadPresetFromStorage(preset);
      if (loadedLayers) {
        setLayers(loadedLayers);
      }
    },
    [loadPresetFromStorage, setLayers]
  );

  return {
    // UI State
    showControls,
    setShowControls,
    debugOverlay,
    setDebugOverlay,
    showPerformanceMonitor,
    setShowPerformanceMonitor,
    showPresetDialog,
    setShowPresetDialog,

    // Layer Management
    layers,
    selectedLayerId,
    selectedLayer,
    multiSelectedLayers,
    expandedLayers,
    newLayerType,
    setSelectedLayerId,
    setNewLayerType,
    addNewLayer,
    duplicateLayer,
    deleteLayer,
    renameLayer,
    updateLayer,
    moveLayer,
    handleShapeTypeChange,
    handleLayerClick,
    selectAllLayers,
    deselectAllLayers,
    deleteSelectedLayers,
    duplicateSelectedLayers,
    toggleLayerExpanded,

    // Gradient Management
    addGradientColor,
    removeGradientColor,
    updateGradientColor,
    updateGradientStop,

    // Audio
    audioData,
    isActive: isActive as boolean,
    toggleAudio,

    // Templates
    presets,
    presetName,
    setPresetName,
    savePreset,
    loadPreset,
    deletePreset,
    exportPreset,
    importPreset,

    // Shortcuts
    shortcuts,

    // Monitoring
    memoryMonitor,
  };
};

export default useAppOrchestration;
