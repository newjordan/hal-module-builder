/**
 * Template Storage Utilities
 *
 * Handles localStorage persistence, backup, and recovery for templates/presets.
 * Provides safe storage operations with error handling and data recovery.
 */

import { Preset } from '../../types/layer-types';
import { validatePreset, validateTemplate } from './templateValidation';

/**
 * Storage configuration
 */
interface StorageConfig {
  /** localStorage key for presets */
  presetsKey: string;
  /** localStorage key for backup */
  backupKey: string;
  /** localStorage key for recovery points */
  recoveryKey: string;
  /** Maximum number of recovery points to keep */
  maxRecoveryPoints: number;
  /** Maximum storage size in bytes */
  maxStorageSize: number;
  /** Whether to enable automatic backups */
  enableAutoBackup: boolean;
}

/**
 * Recovery point interface
 */
interface RecoveryPoint {
  id: string;
  timestamp: number;
  presets: Preset[];
  description: string;
}

/**
 * Storage operation result
 */
interface StorageResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Default storage configuration
 */
const DEFAULT_CONFIG: StorageConfig = {
  presetsKey: 'hal-presets',
  backupKey: 'hal-presets-backup',
  recoveryKey: 'hal-presets-recovery',
  maxRecoveryPoints: 10,
  maxStorageSize: 5 * 1024 * 1024, // 5MB
  enableAutoBackup: true,
};

/**
 * Current storage configuration
 */
let storageConfig = { ...DEFAULT_CONFIG };

/**
 * Updates storage configuration
 * @param config - Partial configuration to update
 */
export const updateStorageConfig = (config: Partial<StorageConfig>): void => {
  storageConfig = { ...storageConfig, ...config };
};

/**
 * Checks if localStorage is available and functional
 * @returns True if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    return false;
  }
};

/**
 * Gets current storage usage in bytes
 * @returns Storage usage statistics
 */
export const getStorageUsage = () => {
  if (!isStorageAvailable()) {
    return { used: 0, available: 0, total: 0, percentage: 0 };
  }

  try {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }

    // Estimate available space (browsers typically allow 5-10MB)
    const estimated = 5 * 1024 * 1024; // 5MB estimate
    const available = Math.max(0, estimated - used);

    return {
      used,
      available,
      total: estimated,
      percentage: (used / estimated) * 100,
    };
  } catch (error) {
    console.warn('Failed to calculate storage usage:', error);
    return { used: 0, available: 0, total: 0, percentage: 0 };
  }
};

/**
 * Safely gets data from localStorage
 * @param key - Storage key
 * @returns Parsed data or null if not found/invalid
 */
const safeGetItem = (key: string): any => {
  if (!isStorageAvailable()) return null;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Failed to get item from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Safely sets data in localStorage
 * @param key - Storage key
 * @param data - Data to store
 * @returns Success result
 */
const safeSetItem = (key: string, data: any): StorageResult => {
  if (!isStorageAvailable()) {
    return { success: false, error: 'localStorage is not available' };
  }

  try {
    const serialized = JSON.stringify(data);

    // Check storage size limit
    if (serialized.length > storageConfig.maxStorageSize) {
      return {
        success: false,
        error: `Data exceeds maximum storage size of ${storageConfig.maxStorageSize} bytes`,
      };
    }

    localStorage.setItem(key, serialized);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown storage error';
    console.error(`Failed to set item in localStorage (${key}):`, error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Creates a recovery point for the current presets
 * @param presets - Current presets to backup
 * @param description - Description of the recovery point
 * @returns Success result
 */
export const createRecoveryPoint = (
  presets: Preset[],
  description: string = 'Auto backup'
): StorageResult => {
  try {
    const recoveryPoints: RecoveryPoint[] =
      safeGetItem(storageConfig.recoveryKey) || [];

    const newRecoveryPoint: RecoveryPoint = {
      id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      presets: [...presets],
      description,
    };

    // Add new recovery point
    recoveryPoints.unshift(newRecoveryPoint);

    // Keep only the maximum number of recovery points
    if (recoveryPoints.length > storageConfig.maxRecoveryPoints) {
      recoveryPoints.splice(storageConfig.maxRecoveryPoints);
    }

    // Save recovery points
    const result = safeSetItem(storageConfig.recoveryKey, recoveryPoints);
    if (!result.success) {
      return {
        success: false,
        error: `Failed to create recovery point: ${result.error}`,
      };
    }

    console.log(`Created recovery point: ${description}`);
    return { success: true, data: newRecoveryPoint };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create recovery point:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Gets all available recovery points
 * @returns Array of recovery points
 */
export const getRecoveryPoints = (): RecoveryPoint[] => {
  const recoveryPoints = safeGetItem(storageConfig.recoveryKey);
  return Array.isArray(recoveryPoints) ? recoveryPoints : [];
};

/**
 * Restores presets from a recovery point
 * @param recoveryPointId - ID of the recovery point to restore
 * @returns Restoration result with presets
 */
export const restoreFromRecoveryPoint = (
  recoveryPointId: string
): StorageResult => {
  try {
    const recoveryPoints = getRecoveryPoints();
    const recoveryPoint = recoveryPoints.find(
      point => point.id === recoveryPointId
    );

    if (!recoveryPoint) {
      return { success: false, error: 'Recovery point not found' };
    }

    // Validate recovered presets
    const validationErrors: string[] = [];
    const validatedPresets: Preset[] = [];

    for (const preset of recoveryPoint.presets) {
      const validation = validatePreset(preset);
      if (validation.isValid && validation.preset) {
        const repaired = validation.preset;
        // Additional structural check (non-blocking): log warnings if structure issues found
        try {
          const struct = validateTemplate({
            id: repaired.id,
            name: repaired.name,
            layers: repaired.layers,
          } as any);
          if (!struct.valid) {
            validationErrors.push(
              `${repaired.name || 'Unknown'}: structural check: ${struct.errors?.join(', ') || 'invalid structure'}`
            );
          }
        } catch (e) {
          validationErrors.push(
            `${repaired.name || 'Unknown'}: structural check exception`
          );
        }
        validatedPresets.push(repaired);
      } else {
        validationErrors.push(
          `${preset.name || 'Unknown'}: ${validation.error}`
        );
      }
    }

    if (validationErrors.length > 0) {
      console.warn(
        'Some presets had validation errors during recovery:',
        validationErrors
      );
    }

    if (validationErrors.length > 0) {
      return {
        success: true,
        data: validatedPresets,
        error: `Some presets had issues: ${validationErrors.join(', ')}`,
      };
    } else {
      return {
        success: true,
        data: validatedPresets,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to restore from recovery point:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Creates a backup of current presets
 * @param presets - Presets to backup
 * @returns Backup result
 */
export const createBackup = (presets: Preset[]): StorageResult => {
  try {
    const backup = {
      timestamp: Date.now(),
      presets: [...presets],
      version: '1.0',
    };

    const result = safeSetItem(storageConfig.backupKey, backup);
    if (!result.success) {
      return {
        success: false,
        error: `Failed to create backup: ${result.error}`,
      };
    }

    console.log('Created backup of presets');
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create backup:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Restores presets from backup
 * @returns Restoration result with presets
 */
export const restoreFromBackup = (): StorageResult => {
  try {
    const backup = safeGetItem(storageConfig.backupKey);

    if (!backup || !Array.isArray(backup.presets)) {
      return { success: false, error: 'No valid backup found' };
    }

    // Validate backup presets
    const validationErrors: string[] = [];
    const validatedPresets: Preset[] = [];

    for (const preset of backup.presets) {
      const validation = validatePreset(preset);
      if (validation.isValid && validation.preset) {
        const repaired = validation.preset;
        // Additional structural check (non-blocking): log warnings if structure issues found
        try {
          const struct = validateTemplate({
            id: repaired.id,
            name: repaired.name,
            layers: repaired.layers,
          } as any);
          if (!struct.valid) {
            validationErrors.push(
              `${repaired.name || 'Unknown'}: structural check: ${struct.errors?.join(', ') || 'invalid structure'}`
            );
          }
        } catch (e) {
          validationErrors.push(
            `${repaired.name || 'Unknown'}: structural check exception`
          );
        }
        validatedPresets.push(repaired);
      } else {
        validationErrors.push(
          `${preset.name || 'Unknown'}: ${validation.error}`
        );
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: true,
        data: validatedPresets,
        error: `Some presets had issues: ${validationErrors.join(', ')}`,
      };
    } else {
      return {
        success: true,
        data: validatedPresets,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to restore from backup:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Loads presets from localStorage
 * @returns Array of loaded presets
 */
export const loadPresets = (): Preset[] => {
  try {
    const stored = safeGetItem(storageConfig.presetsKey);

    if (!stored || !Array.isArray(stored)) {
      console.log('No presets found in storage');
      return [];
    }

    // Validate each preset
    const validatedPresets: Preset[] = [];
    const validationErrors: string[] = [];

    for (const preset of stored) {
      const validation = validatePreset(preset);
      if (validation.isValid && validation.preset) {
        const repaired = validation.preset;
        // Additional structural check (non-blocking): log warnings if structure issues found
        try {
          const struct = validateTemplate({
            id: repaired.id,
            name: repaired.name,
            layers: repaired.layers,
          } as any);
          if (!struct.valid) {
            validationErrors.push(
              `${repaired.name || 'Unknown'}: structural check: ${struct.errors?.join(', ') || 'invalid structure'}`
            );
          }
        } catch (e) {
          validationErrors.push(
            `${repaired.name || 'Unknown'}: structural check exception`
          );
        }
        validatedPresets.push(repaired);
      } else {
        validationErrors.push(
          `${preset.name || 'Unknown'}: ${validation.error}`
        );
      }
    }

    if (validationErrors.length > 0) {
      console.warn('Some presets failed validation:', validationErrors);
    }

    console.log(`Loaded ${validatedPresets.length} valid presets from storage`);
    return validatedPresets;
  } catch (error) {
    console.error('Failed to load presets from storage:', error);
    return [];
  }
};

/**
 * Saves presets to localStorage
 * @param presets - Presets to save
 * @returns Success result
 */
export const savePresets = (presets: Preset[]): StorageResult => {
  try {
    // Create backup before saving (if enabled)
    if (storageConfig.enableAutoBackup) {
      const currentPresets = loadPresets();
      if (currentPresets.length > 0) {
        createBackup(currentPresets);
      }
    }

    // Validate all presets before saving
    const validationErrors: string[] = [];
    const validatedPresets: Preset[] = [];

    for (const preset of presets) {
      const validation = validatePreset(preset);
      if (validation.isValid && validation.preset) {
        const repaired = validation.preset;
        // Additional structural check (non-blocking): log warnings if structure issues found
        try {
          const struct = validateTemplate({
            id: repaired.id,
            name: repaired.name,
            layers: repaired.layers,
          } as any);
          if (!struct.valid) {
            validationErrors.push(
              `${repaired.name || 'Unknown'}: structural check: ${struct.errors?.join(', ') || 'invalid structure'}`
            );
          }
        } catch (e) {
          validationErrors.push(
            `${repaired.name || 'Unknown'}: structural check exception`
          );
        }
        validatedPresets.push(repaired);
      } else {
        validationErrors.push(
          `${preset.name || 'Unknown'}: ${validation.error}`
        );
      }
    }

    if (validationErrors.length > 0 && validatedPresets.length === 0) {
      return {
        success: false,
        error: `All presets failed validation: ${validationErrors.join(', ')}`,
      };
    }

    // Save validated presets
    const result = safeSetItem(storageConfig.presetsKey, validatedPresets);
    if (!result.success) {
      return {
        success: false,
        error: `Failed to save presets: ${result.error}`,
      };
    }

    console.log(`Saved ${validatedPresets.length} presets to storage`);

    if (validationErrors.length > 0) {
      return {
        success: true,
        data: validatedPresets,
        error: `Some presets had issues: ${validationErrors.join(', ')}`,
      };
    } else {
      return {
        success: true,
        data: validatedPresets,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to save presets:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Adds a single preset to storage
 * @param preset - Preset to add
 * @returns Success result
 */
export const addPreset = (preset: Preset): StorageResult => {
  try {
    const currentPresets = loadPresets();

    // Check for duplicate names
    const existingPreset = currentPresets.find(p => p.name === preset.name);
    if (existingPreset) {
      return {
        success: false,
        error: 'A preset with this name already exists',
      };
    }

    // Add new preset
    const updatedPresets = [...currentPresets, preset];
    return savePresets(updatedPresets);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to add preset:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Updates an existing preset in storage
 * @param presetId - ID of preset to update
 * @param updatedPreset - Updated preset data
 * @returns Success result
 */
export const updatePreset = (
  presetId: string,
  updatedPreset: Preset
): StorageResult => {
  try {
    const currentPresets = loadPresets();
    const presetIndex = currentPresets.findIndex(p => p.id === presetId);

    if (presetIndex === -1) {
      return { success: false, error: 'Preset not found' };
    }

    // Update preset
    const updatedPresets = [...currentPresets];
    updatedPresets[presetIndex] = updatedPreset;

    return savePresets(updatedPresets);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update preset:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Deletes a preset from storage
 * @param presetId - ID of preset to delete
 * @returns Success result
 */
export const deletePreset = (presetId: string): StorageResult => {
  try {
    const currentPresets = loadPresets();
    const filteredPresets = currentPresets.filter(p => p.id !== presetId);

    if (filteredPresets.length === currentPresets.length) {
      return { success: false, error: 'Preset not found' };
    }

    return savePresets(filteredPresets);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete preset:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Clears all presets from storage (with backup)
 * @returns Success result
 */
export const clearAllPresets = (): StorageResult => {
  try {
    // Create backup before clearing
    const currentPresets = loadPresets();
    if (currentPresets.length > 0) {
      createRecoveryPoint(currentPresets, 'Before clearing all presets');
    }

    const result = safeSetItem(storageConfig.presetsKey, []);
    if (!result.success) {
      return {
        success: false,
        error: `Failed to clear presets: ${result.error}`,
      };
    }

    console.log('Cleared all presets from storage');
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to clear presets:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Gets storage statistics
 * @returns Storage statistics object
 */
export const getStorageStats = () => {
  const presets = loadPresets();
  const usage = getStorageUsage();
  const recoveryPoints = getRecoveryPoints();

  return {
    totalPresets: presets.length,
    totalLayers: presets.reduce((sum, preset) => sum + preset.layers.length, 0),
    recoveryPoints: recoveryPoints.length,
    storageUsage: usage,
    lastSaved: Math.max(...presets.map(p => p.timestamp), 0),
  };
};
