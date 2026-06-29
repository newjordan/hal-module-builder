import { useCallback, useMemo, useState } from 'react';
import { Layer } from '../types/layer-types';
import {
  GradientData,
  GradientTarget,
  GradientPreset,
} from '../utils/gradient';
import { useGradientTargets } from './useGradientTargets';
import {
  ALL_GRADIENT_PRESETS,
  GRADIENT_PRESET_CATEGORIES,
  getPresetByName,
  getPresetsByCategory,
  getPresetsByTag,
  getRandomPreset,
  GradientPresetCategory,
} from '../utils/gradientPresets';

export interface CustomPreset extends GradientPreset {
  id: string;
  custom: true;
  createdAt: Date;
  lastUsed?: Date;
  description?: string;
}

export interface UseGradientPresetsReturn {
  // Built-in presets
  presets: GradientPreset[];
  categories: GradientPresetCategory[];
  getPresetByName: (name: string) => GradientPreset | undefined;
  getPresetsByCategory: (categoryName: string) => GradientPreset[];
  getPresetsByTag: (tag: string) => GradientPreset[];
  getRandomPreset: () => GradientPreset;

  // Custom presets
  customPresets: CustomPreset[];
  createCustomPreset: (
    name: string,
    gradient: GradientData,
    description?: string,
    tags?: string[]
  ) => CustomPreset;
  saveCustomPreset: (preset: CustomPreset) => void;
  deleteCustomPreset: (presetId: string) => void;
  updateCustomPreset: (
    presetId: string,
    updates: Partial<CustomPreset>
  ) => void;

  // Preset application
  applyPreset: (
    layerId: string,
    presetName: string,
    updateLayer: (id: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    target?: GradientTarget
  ) => void;
  applyCustomPreset: (
    layerId: string,
    preset: CustomPreset,
    updateLayer: (id: string, updates: Partial<Layer>) => void,
    layers: Layer[],
    target?: GradientTarget
  ) => void;

  // Import/Export
  exportCustomPresets: () => string;
  importCustomPresets: (jsonString: string) => boolean;

  // Utility
  getAllPresets: () => (GradientPreset | CustomPreset)[];
  searchPresets: (query: string) => (GradientPreset | CustomPreset)[];
}

const STORAGE_KEY = 'hal-gradient-custom-presets';

export const useGradientPresets = (): UseGradientPresetsReturn => {
  const { applyToTarget } = useGradientTargets();

  // Custom presets state
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((preset: any) => ({
          ...preset,
          createdAt: new Date(preset.createdAt),
          lastUsed: preset.lastUsed ? new Date(preset.lastUsed) : undefined,
        }));
      }
    } catch (error) {
      console.warn('Failed to load custom gradients from localStorage:', error);
    }
    return [];
  });

  // Memoized built-in presets
  const presets = useMemo(() => ALL_GRADIENT_PRESETS, []);
  const categories = useMemo(() => GRADIENT_PRESET_CATEGORIES, []);

  // Save custom presets to localStorage
  const saveToStorage = useCallback((presets: CustomPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.warn('Failed to save custom presets to localStorage:', error);
    }
  }, []);

  // Create a custom preset
  const createCustomPreset = useCallback(
    (
      name: string,
      gradient: GradientData,
      description?: string,
      tags?: string[]
    ): CustomPreset => {
      const preset: CustomPreset = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        type: gradient.type,
        colors: [...gradient.colors],
        stops: [...gradient.stops],
        ...(gradient.angle !== undefined && { angle: gradient.angle }),
        ...(gradient.centerX !== undefined && { centerX: gradient.centerX }),
        ...(gradient.centerY !== undefined && { centerY: gradient.centerY }),
        ...(description && { description }),
        ...(tags && { tags }),
        custom: true,
        createdAt: new Date(),
      };

      return preset;
    },
    []
  );

  // Save a custom preset
  const saveCustomPreset = useCallback(
    (preset: CustomPreset) => {
      setCustomPresets(prev => {
        const updated = [...prev, preset];
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Delete a custom preset
  const deleteCustomPreset = useCallback(
    (presetId: string) => {
      setCustomPresets(prev => {
        const updated = prev.filter(p => p.id !== presetId);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Update a custom preset
  const updateCustomPreset = useCallback(
    (presetId: string, updates: Partial<CustomPreset>) => {
      setCustomPresets(prev => {
        const updated = prev.map(preset =>
          preset.id === presetId ? { ...preset, ...updates } : preset
        );
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Apply a built-in preset
  const applyPreset = useCallback(
    (
      layerId: string,
      presetName: string,
      updateLayer: (id: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      target: GradientTarget = 'layer'
    ) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) {
        throw new Error(`Layer '${layerId}' not found`);
      }

      const preset = getPresetByName(presetName);
      if (!preset) {
        throw new Error(`Preset '${presetName}' not found`);
      }

      const gradientData: GradientData = {
        type: preset.type,
        colors: [...preset.colors],
        stops: [...preset.stops],
        ...(preset.angle !== undefined && { angle: preset.angle }),
        ...(preset.centerX !== undefined && { centerX: preset.centerX }),
        ...(preset.centerY !== undefined && { centerY: preset.centerY }),
      };

      try {
        const updates = applyToTarget(layer, gradientData, target);
        updateLayer(layerId, updates);
      } catch (error) {
        throw new Error(`Failed to apply preset '${presetName}': ${error}`);
      }
    },
    [applyToTarget]
  );

  // Apply a custom preset
  const applyCustomPreset = useCallback(
    (
      layerId: string,
      preset: CustomPreset,
      updateLayer: (id: string, updates: Partial<Layer>) => void,
      layers: Layer[],
      target: GradientTarget = 'layer'
    ) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) {
        throw new Error(`Layer '${layerId}' not found`);
      }

      const gradientData: GradientData = {
        type: preset.type,
        colors: [...preset.colors],
        stops: [...preset.stops],
        ...(preset.angle !== undefined && { angle: preset.angle }),
        ...(preset.centerX !== undefined && { centerX: preset.centerX }),
        ...(preset.centerY !== undefined && { centerY: preset.centerY }),
      };

      try {
        const updates = applyToTarget(layer, gradientData, target);
        updateLayer(layerId, updates);
        setCustomPresets(prev => {
          const updated = prev.map(existingPreset =>
            existingPreset.id === preset.id
              ? { ...existingPreset, lastUsed: new Date() }
              : existingPreset
          );
          saveToStorage(updated);
          return updated;
        });
      } catch (error) {
        throw new Error(
          `Failed to apply custom preset '${preset.name}': ${error}`
        );
      }
    },
    [applyToTarget, saveToStorage]
  );

  // Export custom presets
  const exportCustomPresets = useCallback((): string => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      presets: customPresets,
    };
    return JSON.stringify(exportData, null, 2);
  }, [customPresets]);

  // Import custom presets
  const importCustomPresets = useCallback(
    (jsonString: string): boolean => {
      try {
        const importData = JSON.parse(jsonString);

        if (!importData.presets || !Array.isArray(importData.presets)) {
          return false;
        }

        const validPresets: CustomPreset[] = importData.presets
          .filter(
            (preset: any) =>
              preset.name &&
              preset.type &&
              preset.colors &&
              Array.isArray(preset.colors) &&
              preset.stops &&
              Array.isArray(preset.stops)
          )
          .map((preset: any) => ({
            ...preset,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            custom: true,
            createdAt: preset.createdAt
              ? new Date(preset.createdAt)
              : new Date(),
            lastUsed: preset.lastUsed ? new Date(preset.lastUsed) : undefined,
          }));

        setCustomPresets(prev => {
          const updated = [...prev, ...validPresets];
          saveToStorage(updated);
          return updated;
        });

        return true;
      } catch (error) {
        console.warn('Failed to import custom presets:', error);
        return false;
      }
    },
    [saveToStorage]
  );

  // Get all presets (built-in + custom)
  const getAllPresets = useCallback((): (GradientPreset | CustomPreset)[] => {
    return [...presets, ...customPresets];
  }, [presets, customPresets]);

  // Search presets
  const searchPresets = useCallback(
    (query: string): (GradientPreset | CustomPreset)[] => {
      const lowerQuery = query.toLowerCase();
      const allPresets = getAllPresets();

      return allPresets.filter(
        preset =>
          preset.name.toLowerCase().includes(lowerQuery) ||
          preset.description?.toLowerCase().includes(lowerQuery) ||
          preset.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    },
    [getAllPresets]
  );

  return {
    // Built-in presets
    presets,
    categories,
    getPresetByName,
    getPresetsByCategory,
    getPresetsByTag,
    getRandomPreset,

    // Custom presets
    customPresets,
    createCustomPreset,
    saveCustomPreset,
    deleteCustomPreset,
    updateCustomPreset,

    // Preset application
    applyPreset,
    applyCustomPreset,

    // Import/Export
    exportCustomPresets,
    importCustomPresets,

    // Utility
    getAllPresets,
    searchPresets,
  };
};

export default useGradientPresets;
