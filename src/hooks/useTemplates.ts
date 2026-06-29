/**
 * useTemplates Hook - Template/preset management and persistence
 *
 * Extracted from HalModuleBuilder.tsx to provide reusable template management,
 * including save, load, delete, import, export functionality with localStorage persistence.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TemplateValidationService } from '../services/validation/TemplateValidationService';
import { Layer, Preset } from '../types/layer-types';
import { generatePresetId } from '../utils/id-utils';
import {
  clonePreset,
  exportPresetToFile,
  importPresetFromFile,
} from '../utils/templates/templateSerialization';
import {
  createRecoveryPoint,
  getStorageStats,
  loadPresets,
  savePresets,
} from '../utils/templates/templateStorage';
import {
  validateImportedPreset,
  validatePresetName,
} from '../utils/templates/templateValidation';

/**
 * Hook configuration interface
 */
export interface UseTemplatesConfig {
  /** Whether to auto-save changes */
  autoSave?: boolean;
  /** Auto-save delay in milliseconds */
  autoSaveDelay?: number;
  /** Whether to create recovery points automatically */
  autoRecovery?: boolean;
  /** Maximum number of presets to keep */
  maxPresets?: number;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom success handler */
  onSuccess?: (message: string) => void;
}

/**
 * Hook return interface
 */
export interface UseTemplatesReturn {
  /** Array of available presets */
  presets: Preset[];
  /** Current preset name for saving */
  presetName: string;
  /** Whether any operation is in progress */
  loading: boolean;
  /** Current error message */
  error: string | null;
  /** Storage statistics */
  storageStats: ReturnType<typeof getStorageStats>;

  /** Set the preset name for saving */
  setPresetName: (name: string) => void;
  /** Save current layers as a new preset */
  savePreset: (layers: Layer[], name?: string) => Promise<boolean>;
  /** Load a preset (returns cloned layers) */
  loadPreset: (preset: Preset) => Layer[];
  /** Delete a preset by ID */
  deletePreset: (presetId: string) => Promise<boolean>;
  /** Export a preset to file */
  exportPreset: (
    preset: Preset,
    format?: 'json' | 'yaml' | 'javascript'
  ) => void;
  /** Import presets from file input */
  importPreset: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => Promise<boolean>;
  /** Update an existing preset */
  updatePreset: (presetId: string, layers: Layer[]) => Promise<boolean>;
  /** Validate a preset name */
  validateName: (name: string) => string | null;
  /** Clear all presets */
  clearAllPresets: () => Promise<boolean>;
  /** Refresh presets from storage */
  refreshPresets: () => void;
  /** Check if a preset name exists */
  presetNameExists: (name: string) => boolean;
}

/**
 * Custom hook for managing templates/presets
 * Extracted from HalModuleBuilder.tsx for reusable template functionality
 */
export const useTemplates = (
  config: UseTemplatesConfig = {}
): UseTemplatesReturn => {
  const {
    autoSave = false,
    autoSaveDelay = 2000,
    autoRecovery = true,
    maxPresets = 100,
    onError,
    onSuccess,
  } = config;

  // State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState(() => getStorageStats());

  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  // Stable instance of TemplateValidationService for structural checks
  const templateValidationRef = useRef<TemplateValidationService | null>(null);
  if (!templateValidationRef.current) {
    templateValidationRef.current = new TemplateValidationService();
  }

  // Load presets on mount
  useEffect(() => {
    loadPresetsFromStorage();
  }, []);

  // Auto-save timeout cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Update storage stats when presets change
  useEffect(() => {
    setStorageStats(getStorageStats());
  }, [presets]);

  /**
   * Handles errors with optional callback
   */
  const handleError = useCallback(
    (error: Error | string, context?: string) => {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const fullMessage = context
        ? `${context}: ${errorMessage}`
        : errorMessage;

      console.error('Template operation error:', fullMessage);
      setError(fullMessage);
      onError?.(typeof error === 'string' ? new Error(error) : error);
    },
    [onError]
  );

  /**
   * Handles success with optional callback
   */
  const handleSuccess = useCallback(
    (message: string) => {
      console.log('Template operation success:', message);
      setError(null);
      onSuccess?.(message);
    },
    [onSuccess]
  );

  /**
   * Loads presets from localStorage
   */
  const loadPresetsFromStorage = useCallback(() => {
    try {
      setLoading(true);
      const loadedPresets = loadPresets();
      setPresets(loadedPresets);
      handleSuccess(`Loaded ${loadedPresets.length} presets`);
    } catch (error) {
      handleError(error as Error, 'Failed to load presets');
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Saves presets to localStorage with optional auto-save
   */
  const savePresetsToStorage = useCallback(
    async (updatedPresets: Preset[]) => {
      if (autoSave && autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      const performSave = async () => {
        try {
          setLoading(true);

          // Create recovery point before saving (if enabled)
          if (autoRecovery && presets.length > 0) {
            createRecoveryPoint(presets, 'Auto recovery before save');
          }

          const result = savePresets(updatedPresets);
          if (result.success) {
            setPresets(updatedPresets);
            handleSuccess('Presets saved successfully');
            return true;
          } else {
            handleError(result.error || 'Failed to save presets');
            return false;
          }
        } catch (error) {
          handleError(error as Error, 'Failed to save presets');
          return false;
        } finally {
          setLoading(false);
        }
      };

      if (autoSave) {
        // Debounced auto-save
        autoSaveTimeoutRef.current = setTimeout(performSave, autoSaveDelay);
        return true; // Return immediately for auto-save
      } else {
        // Immediate save
        return await performSave();
      }
    },
    [autoSave, autoSaveDelay, autoRecovery, presets, handleError, handleSuccess]
  );

  /**
   * Validates a preset name
   */
  const validateName = useCallback(
    (name: string): string | null => {
      return validatePresetName(name, presets, {
        version: 1,
        allowMissingOptional: true,
        autoRepair: false,
        maxLayers: 100,
        maxNameLength: 50,
      });
    },
    [presets]
  );

  /**
   * Checks if a preset name already exists
   */
  const presetNameExists = useCallback(
    (name: string): boolean => {
      return presets.some(
        preset => preset.name.toLowerCase() === name.toLowerCase()
      );
    },
    [presets]
  );

  /**
   * Saves current layers as a new preset
   */
  const savePreset = useCallback(
    async (layers: Layer[], name?: string): Promise<boolean> => {
      try {
        const finalName = name || presetName;

        if (!finalName.trim()) {
          handleError('Preset name is required');
          return false;
        }

        // Validate name
        const nameError = validateName(finalName.trim());
        if (nameError) {
          handleError(nameError);
          return false;
        }

        // Check preset limit
        if (presets.length >= maxPresets) {
          handleError(`Maximum number of presets (${maxPresets}) reached`);
          return false;
        }

        // Create new preset
        const newPreset: Preset = {
          id: generatePresetId(),
          name: finalName.trim(),
          timestamp: Date.now(),
          layers: layers.map(layer => ({ ...layer })), // Shallow copy layers
        };

        const updatedPresets = [...presets, newPreset];
        const success = await savePresetsToStorage(updatedPresets);

        if (success) {
          setPresetName(''); // Clear the name after successful save
          handleSuccess(`Preset "${finalName}" saved successfully`);
        }

        return success;
      } catch (error) {
        handleError(error as Error, 'Failed to save preset');
        return false;
      }
    },
    [
      presetName,
      presets,
      maxPresets,
      validateName,
      savePresetsToStorage,
      handleError,
      handleSuccess,
    ]
  );

  /**
   * Loads a preset and returns cloned layers
   */
  const loadPreset = useCallback(
    (preset: Preset): Layer[] => {
      try {
        // Use structured clone for better performance if available
        const clonedPreset = clonePreset(preset);
        handleSuccess(`Preset "${preset.name}" loaded successfully`);
        return clonedPreset.layers;
      } catch (error) {
        handleError(error as Error, 'Failed to load preset');
        return [];
      }
    },
    [handleError, handleSuccess]
  );

  /**
   * Deletes a preset by ID
   */
  const deletePreset = useCallback(
    async (presetId: string): Promise<boolean> => {
      try {
        const presetToDelete = presets.find(p => p.id === presetId);
        if (!presetToDelete) {
          handleError('Preset not found');
          return false;
        }

        // Create recovery point before deletion
        if (autoRecovery) {
          createRecoveryPoint(
            presets,
            `Before deleting preset: ${presetToDelete.name}`
          );
        }

        const updatedPresets = presets.filter(p => p.id !== presetId);
        const success = await savePresetsToStorage(updatedPresets);

        if (success) {
          handleSuccess(`Preset "${presetToDelete.name}" deleted successfully`);
        }

        return success;
      } catch (error) {
        handleError(error as Error, 'Failed to delete preset');
        return false;
      }
    },
    [presets, autoRecovery, savePresetsToStorage, handleError, handleSuccess]
  );

  /**
   * Updates an existing preset
   */
  const updatePresetCallback = useCallback(
    async (presetId: string, layers: Layer[]): Promise<boolean> => {
      try {
        const presetIndex = presets.findIndex(p => p.id === presetId);
        if (presetIndex === -1) {
          handleError('Preset not found');
          return false;
        }

        // Create recovery point before update
        if (autoRecovery && presets[presetIndex]) {
          createRecoveryPoint(
            presets,
            `Before updating preset: ${presets[presetIndex].name}`
          );
        }

        const updatedPresets = [...presets];
        const currentPreset = updatedPresets[presetIndex];
        if (!currentPreset) {
          handleError('Preset not found during update');
          return false;
        }
        updatedPresets[presetIndex] = {
          id: currentPreset.id,
          name: currentPreset.name,
          layers: layers.map(layer => ({ ...layer })),
          timestamp: Date.now(),
          ...(currentPreset.groups ? { groups: currentPreset.groups } : {}),
        };

        const success = await savePresetsToStorage(updatedPresets);

        if (success && updatedPresets[presetIndex]) {
          handleSuccess(
            `Preset "${updatedPresets[presetIndex].name}" updated successfully`
          );
        }

        return success;
      } catch (error) {
        handleError(error as Error, 'Failed to update preset');
        return false;
      }
    },
    [presets, autoRecovery, savePresetsToStorage, handleError, handleSuccess]
  );

  /**
   * Exports a preset to file
   */
  const exportPreset = useCallback(
    (preset: Preset, format: 'json' | 'yaml' | 'javascript' = 'json') => {
      try {
        exportPresetToFile(preset, format);
        handleSuccess(
          `Preset "${preset.name}" exported as ${format.toUpperCase()}`
        );
      } catch (error) {
        handleError(error as Error, 'Failed to export preset');
      }
    },
    [handleError, handleSuccess]
  );

  /**
   * Imports presets from file input
   */
  const importPreset = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<boolean> => {
      try {
        const file = event.target.files?.[0];
        if (!file) {
          handleError('No file selected');
          return false;
        }

        // Check file size (1MB limit)
        if (file.size > 1024 * 1024) {
          handleError('File too large. Maximum size is 1MB.');
          return false;
        }

        setLoading(true);

        // Read file content
        const fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });

        // Import and validate preset
        const importedPreset = importPresetFromFile(fileContent, file.name);
        const validation = validateImportedPreset(
          JSON.stringify(importedPreset)
        );

        if (!validation.isValid || !validation.preset) {
          handleError(validation.error || 'Invalid preset format');
          return false;
        }

        // Ensure unique ID and name
        const preset = validation.preset!;
        preset.id = generatePresetId();

        // Check for name conflicts and resolve
        let finalName = preset.name;
        let counter = 1;
        while (presetNameExists(finalName)) {
          finalName = `${preset.name} (${counter})`;
          counter++;
        }
        preset.name = finalName;

        // Create recovery point before import
        if (autoRecovery) {
          createRecoveryPoint(
            presets,
            `Before importing preset: ${preset.name}`
          );
        }

        // Enforce structural validation: fail import if invalid
        try {
          const svc = templateValidationRef.current!;
          const structCheck = svc.validateTemplate({
            id: preset.id,
            name: finalName,
            layers: preset.layers,
          } as any);
          if (!structCheck.valid) {
            const errMsg =
              structCheck.errors && structCheck.errors.length
                ? structCheck.errors.join(', ')
                : 'Invalid preset format';
            handleError(errMsg);
            return false;
          }
          if (structCheck.warnings && structCheck.warnings.length) {
            console.warn('Template validation warnings:', structCheck.warnings);
          }
        } catch (e) {
          // Validation error -> treat as failure for safety
          const err =
            e instanceof Error ? e : new Error('Template validation error');
          handleError(err, 'Template validation failed');
          return false;
        }

        // Add to presets - ensure preset has all required properties
        const completePreset: Preset = {
          id: preset.id,
          name: finalName,
          timestamp: preset.timestamp,
          layers: preset.layers,
          ...(preset.groups ? { groups: preset.groups } : {}),
        };
        const updatedPresets = [...presets, completePreset];
        const success = await savePresetsToStorage(updatedPresets);

        if (success) {
          handleSuccess(`Preset "${preset.name}" imported successfully`);
        }

        return success;
      } catch (error) {
        handleError(error as Error, 'Failed to import preset');
        return false;
      } finally {
        setLoading(false);

        // Clear file input to allow re-importing the same file
        event.target.value = '';
      }
    },
    [
      presets,
      autoRecovery,
      presetNameExists,
      savePresetsToStorage,
      handleError,
      handleSuccess,
    ]
  );

  /**
   * Clears all presets
   */
  const clearAllPresets = useCallback(async (): Promise<boolean> => {
    try {
      // Create recovery point before clearing
      if (autoRecovery && presets.length > 0) {
        createRecoveryPoint(presets, 'Before clearing all presets');
      }

      const success = await savePresetsToStorage([]);

      if (success) {
        handleSuccess('All presets cleared successfully');
      }

      return success;
    } catch (error) {
      handleError(error as Error, 'Failed to clear presets');
      return false;
    }
  }, [presets, autoRecovery, savePresetsToStorage, handleError, handleSuccess]);

  /**
   * Refreshes presets from storage
   */
  const refreshPresets = useCallback(() => {
    loadPresetsFromStorage();
  }, [loadPresetsFromStorage]);

  return {
    presets,
    presetName,
    loading,
    error,
    storageStats,
    setPresetName,
    savePreset,
    loadPreset,
    deletePreset,
    exportPreset,
    importPreset,
    updatePreset: updatePresetCallback,
    validateName,
    clearAllPresets,
    refreshPresets,
    presetNameExists,
  };
};

export default useTemplates;
