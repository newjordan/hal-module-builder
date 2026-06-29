/**
 * useTemplate Hook - Template CRUD operations
 * Provides template/preset management with storage integration and validation
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Layer, Preset } from '../types/layer-types';
import { getStorageService } from '../services/StorageService';

export interface UseTemplateReturn {
  presets: Preset[];
  isLoading: boolean;
  error: string | null;
  saveCurrentAsPreset: (name: string, layers: Layer[]) => Promise<boolean>;
  loadPreset: (presetId: string) => Preset | null;
  deletePreset: (presetId: string) => boolean;
  updatePreset: (preset: Preset) => boolean;
  exportPreset: (presetId: string) => string | null;
  importPreset: (jsonString: string) => {
    success: boolean;
    error?: string;
    preset?: Preset;
  };
  importPresetFromFile: (
    file: File
  ) => Promise<{ success: boolean; error?: string; preset?: Preset }>;
  clearAllPresets: () => boolean;
  getPresetStats: () => { count: number; totalSize: number };
  searchPresets: (query: string) => Preset[];
  duplicatePreset: (presetId: string, newName?: string) => Preset | null;
}

export interface UseTemplateOptions {
  autoLoad?: boolean;
  autoSave?: boolean;
  onPresetLoad?: (preset: Preset) => void;
  onPresetSave?: (preset: Preset) => void;
  onPresetDelete?: (presetId: string) => void;
  onError?: (error: string) => void;
}

export const useTemplate = (
  options: UseTemplateOptions = {}
): UseTemplateReturn => {
  const {
    autoLoad = true,
    // autoSave = true,
    // onPresetLoad,
    // onPresetSave,
    // onPresetDelete,
    // onError
  } = options;

  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageService = getStorageService();
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Load presets on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad) {
      loadPresets();
    }
  }, [autoLoad]);

  /**
   * Load all presets from storage
   */
  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedPresets = storageService.loadPresets();
      setPresets(loadedPresets);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load presets';
      setError(errorMessage);

      if (optionsRef.current.onError) {
        optionsRef.current.onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [storageService]);

  /**
   * Save current layer configuration as a new preset
   */
  const saveCurrentAsPreset = useCallback(
    async (name: string, layers: Layer[]): Promise<boolean> => {
      if (!name.trim()) {
        setError('Preset name is required');
        return false;
      }

      if (layers.length === 0) {
        setError('Cannot save empty preset');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const newPreset: Preset = {
          id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: name.trim(),
          timestamp: Date.now(),
          layers: JSON.parse(JSON.stringify(layers)), // Deep clone
        };

        const success = storageService.savePreset(newPreset);

        if (success) {
          setPresets(prev => [...prev, newPreset]);

          if (optionsRef.current.onPresetSave) {
            optionsRef.current.onPresetSave(newPreset);
          }

          return true;
        } else {
          setError('Failed to save preset to storage');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to save preset';
        setError(errorMessage);

        if (optionsRef.current.onError) {
          optionsRef.current.onError(errorMessage);
        }

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [storageService]
  );

  /**
   * Load a specific preset by ID
   */
  const loadPreset = useCallback(
    (presetId: string): Preset | null => {
      const preset = presets.find(p => p.id === presetId);

      if (!preset) {
        setError(`Preset with ID ${presetId} not found`);
        return null;
      }

      // Call callback if provided
      if (optionsRef.current.onPresetLoad) {
        optionsRef.current.onPresetLoad(preset);
      }

      return preset;
    },
    [presets]
  );

  /**
   * Delete a preset by ID
   */
  const deletePreset = useCallback(
    (presetId: string): boolean => {
      const presetExists = presets.some(p => p.id === presetId);

      if (!presetExists) {
        setError(`Preset with ID ${presetId} not found`);
        return false;
      }

      try {
        const success = storageService.deletePreset(presetId);

        if (success) {
          setPresets(prev => prev.filter(p => p.id !== presetId));

          if (optionsRef.current.onPresetDelete) {
            optionsRef.current.onPresetDelete(presetId);
          }

          return true;
        } else {
          setError('Failed to delete preset from storage');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete preset';
        setError(errorMessage);

        if (optionsRef.current.onError) {
          optionsRef.current.onError(errorMessage);
        }

        return false;
      }
    },
    [presets, storageService]
  );

  /**
   * Update an existing preset
   */
  const updatePreset = useCallback(
    (updatedPreset: Preset): boolean => {
      const existingIndex = presets.findIndex(p => p.id === updatedPreset.id);

      if (existingIndex === -1) {
        setError(`Preset with ID ${updatedPreset.id} not found`);
        return false;
      }

      try {
        // Update timestamp
        const presetWithTimestamp = {
          ...updatedPreset,
          timestamp: Date.now(),
        };

        const success = storageService.savePreset(presetWithTimestamp);

        if (success) {
          setPresets(prev => {
            const updated = [...prev];
            updated[existingIndex] = presetWithTimestamp;
            return updated;
          });

          return true;
        } else {
          setError('Failed to update preset in storage');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update preset';
        setError(errorMessage);

        if (optionsRef.current.onError) {
          optionsRef.current.onError(errorMessage);
        }

        return false;
      }
    },
    [presets, storageService]
  );

  /**
   * Export a preset to JSON string
   */
  const exportPreset = useCallback(
    (presetId: string): string | null => {
      const preset = presets.find(p => p.id === presetId);

      if (!preset) {
        setError(`Preset with ID ${presetId} not found`);
        return null;
      }

      try {
        return storageService.exportPreset(preset);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to export preset';
        setError(errorMessage);

        if (optionsRef.current.onError) {
          optionsRef.current.onError(errorMessage);
        }

        return null;
      }
    },
    [presets, storageService]
  );

  /**
   * Import a preset from JSON string
   */
  const importPreset = useCallback(
    (
      jsonString: string
    ): { success: boolean; error?: string; preset?: Preset } => {
      try {
        const result = storageService.importPreset(jsonString);

        if (result.error) {
          setError(result.error);
          return { success: false, error: result.error };
        }

        if (result.preset) {
          // Add to local state
          setPresets(prev => [...prev, result.preset!]);

          if (optionsRef.current.onPresetSave) {
            optionsRef.current.onPresetSave(result.preset);
          }

          return { success: true, preset: result.preset };
        }

        return { success: false, error: 'Unknown import error' };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to import preset';
        setError(errorMessage);

        if (optionsRef.current.onError) {
          optionsRef.current.onError(errorMessage);
        }

        return { success: false, error: errorMessage };
      }
    },
    [storageService]
  );

  /**
   * Import preset from file
   */
  const importPresetFromFile = useCallback(
    (
      file: File
    ): Promise<{ success: boolean; error?: string; preset?: Preset }> => {
      return new Promise(resolve => {
        if (!file.type.includes('json') && !file.name.endsWith('.json')) {
          const error = 'Please select a valid JSON file';
          setError(error);
          resolve({ success: false, error });
          return;
        }

        const reader = new FileReader();

        reader.onload = e => {
          try {
            const jsonString = e.target?.result as string;
            const result = importPreset(jsonString);
            resolve(result);
          } catch (err) {
            const error =
              err instanceof Error ? err.message : 'Failed to read file';
            setError(error);
            resolve({ success: false, error });
          }
        };

        reader.onerror = () => {
          const error = 'Failed to read file';
          setError(error);
          resolve({ success: false, error });
        };

        reader.readAsText(file);
      });
    },
    [importPreset]
  );

  /**
   * Clear all presets
   */
  const clearAllPresets = useCallback((): boolean => {
    try {
      const success = storageService.clearAll();

      if (success) {
        setPresets([]);
        return true;
      } else {
        setError('Failed to clear presets from storage');
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to clear presets';
      setError(errorMessage);

      if (optionsRef.current.onError) {
        optionsRef.current.onError(errorMessage);
      }

      return false;
    }
  }, [storageService]);

  /**
   * Get preset statistics
   */
  const getPresetStats = useCallback(() => {
    const stats = storageService.getStorageStats();

    return {
      count: stats.presetCount,
      totalSize: stats.totalSize,
    };
  }, [storageService]);

  /**
   * Search presets by name
   */
  const searchPresets = useCallback(
    (query: string): Preset[] => {
      if (!query.trim()) {
        return presets;
      }

      const lowerQuery = query.toLowerCase();

      return presets.filter(
        preset =>
          preset.name.toLowerCase().includes(lowerQuery) ||
          preset.layers.some(layer =>
            layer.name.toLowerCase().includes(lowerQuery)
          )
      );
    },
    [presets]
  );

  /**
   * Duplicate a preset
   */
  const duplicatePreset = useCallback(
    (presetId: string, newName?: string): Preset | null => {
      const originalPreset = presets.find(p => p.id === presetId);

      if (!originalPreset) {
        setError(`Preset with ID ${presetId} not found`);
        return null;
      }

      try {
        const duplicatedPreset: Preset = {
          id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: newName || `${originalPreset.name} (Copy)`,
          timestamp: Date.now(),
          layers: JSON.parse(JSON.stringify(originalPreset.layers)), // Deep clone
        };

        const success = storageService.savePreset(duplicatedPreset);

        if (success) {
          setPresets(prev => [...prev, duplicatedPreset]);

          if (optionsRef.current.onPresetSave) {
            optionsRef.current.onPresetSave(duplicatedPreset);
          }

          return duplicatedPreset;
        } else {
          setError('Failed to save duplicated preset');
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to duplicate preset';
        setError(errorMessage);

        if (optionsRef.current.onError) {
          optionsRef.current.onError(errorMessage);
        }

        return null;
      }
    },
    [presets, storageService]
  );

  return {
    presets,
    isLoading,
    error,
    saveCurrentAsPreset,
    loadPreset,
    deletePreset,
    updatePreset,
    exportPreset,
    importPreset,
    importPresetFromFile,
    clearAllPresets,
    getPresetStats,
    searchPresets,
    duplicatePreset,
  };
};
