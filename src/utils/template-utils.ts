/**
 * Template validation and recovery utilities for HAL Builder
 * Provides safe template parsing, validation, and backup functionality
 */

interface Layer {
  id: string;
  name: string;
  type: 'image' | 'gradient' | 'solid' | 'effect' | 'circle' | 'equalizer';
  visible: boolean;
  opacity: number;
  blendMode: string;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

interface Preset {
  id: string;
  name: string;
  layers: Layer[];
  version?: number;
  createdAt?: string;
  modifiedAt?: string;
}

interface TemplateValidationResult {
  isValid: boolean;
  preset?: Preset;
  error?: string;
  warnings?: string[];
}

const TEMPLATE_VERSION = 1;
const STORAGE_KEYS = {
  PRESETS: 'hal-presets',
  BACKUP: 'hal-presets-backup',
  RECOVERY: 'hal-presets-recovery',
};

/**
 * Validates a preset object structure
 */
function validatePresetStructure(preset: any): TemplateValidationResult {
  const warnings: string[] = [];

  try {
    // Check required fields
    if (!preset || typeof preset !== 'object') {
      return { isValid: false, error: 'Invalid preset: not an object' };
    }

    if (!preset.id || typeof preset.id !== 'string') {
      return { isValid: false, error: 'Invalid preset: missing or invalid id' };
    }

    if (!preset.name || typeof preset.name !== 'string') {
      return {
        isValid: false,
        error: 'Invalid preset: missing or invalid name',
      };
    }

    if (!Array.isArray(preset.layers)) {
      return {
        isValid: false,
        error: 'Invalid preset: layers must be an array',
      };
    }

    // Validate each layer
    for (let i = 0; i < preset.layers.length; i++) {
      const layer = preset.layers[i];
      const layerResult = validateLayerStructure(layer, i);
      if (!layerResult.isValid) {
        return {
          isValid: false,
          error: layerResult.error ?? 'Layer validation failed',
        };
      }
      if (layerResult.warnings) {
        warnings.push(...layerResult.warnings);
      }
    }

    // Add version if missing
    if (!preset.version) {
      preset.version = TEMPLATE_VERSION;
      warnings.push('Added missing version field');
    }

    // Add timestamps if missing
    if (!preset.createdAt) {
      preset.createdAt = new Date().toISOString();
      warnings.push('Added missing createdAt timestamp');
    }

    if (!preset.modifiedAt) {
      preset.modifiedAt = new Date().toISOString();
      warnings.push('Added missing modifiedAt timestamp');
    }

    const result = {
      isValid: true,
      preset: preset as Preset,
    } as { isValid: true; preset: Preset; warnings?: string[] };

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  } catch (error) {
    return {
      isValid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validates a layer object structure
 */
function validateLayerStructure(
  layer: any,
  index: number
): TemplateValidationResult {
  const warnings: string[] = [];

  if (!layer || typeof layer !== 'object') {
    return { isValid: false, error: `Layer ${index}: not an object` };
  }

  // Required fields
  const requiredFields = [
    'id',
    'name',
    'type',
    'visible',
    'opacity',
    'blendMode',
    'scale',
    'rotation',
    'offsetX',
    'offsetY',
  ];
  for (const field of requiredFields) {
    if (layer[field] === undefined || layer[field] === null) {
      return {
        isValid: false,
        error: `Layer ${index}: missing required field '${field}'`,
      };
    }
  }

  // Type validation
  const validTypes = [
    'image',
    'gradient',
    'solid',
    'effect',
    'circle',
    'equalizer',
  ];
  if (!validTypes.includes(layer.type)) {
    return {
      isValid: false,
      error: `Layer ${index}: invalid type '${layer.type}'`,
    };
  }

  // Range validation
  if (
    typeof layer.opacity !== 'number' ||
    layer.opacity < 0 ||
    layer.opacity > 1
  ) {
    warnings.push(
      `Layer ${index}: opacity should be between 0 and 1, found ${layer.opacity}`
    );
    layer.opacity = Math.max(0, Math.min(1, layer.opacity || 1));
  }

  if (typeof layer.scale !== 'number' || layer.scale <= 0) {
    warnings.push(
      `Layer ${index}: scale should be positive, found ${layer.scale}`
    );
    layer.scale = Math.max(0.1, layer.scale || 1);
  }

  const result = {
    isValid: true,
  } as { isValid: true; warnings?: string[] };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}

/**
 * Safely parses JSON with validation
 */
function safeJsonParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates a backup of current presets in sessionStorage
 */
function createBackup(presets: Preset[]): boolean {
  try {
    const backup = {
      data: presets,
      timestamp: new Date().toISOString(),
      version: TEMPLATE_VERSION,
    };
    sessionStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backup));
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
}

/**
 * Loads presets with validation and fallback recovery
 */
export function loadPresets(): Preset[] {
  // If storage APIs are unavailable, fail soft without attempting recovery.
  if (
    typeof window === 'undefined' ||
    !('localStorage' in window) ||
    !window.localStorage ||
    typeof window.localStorage.getItem !== 'function'
  ) {
    return [];
  }

  try {
    // Try to load from main storage
    const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!saved) {
      return [];
    }

    const rawData = safeJsonParse(saved);
    if (!Array.isArray(rawData)) {
      throw new Error('Presets data is not an array');
    }

    const validatedPresets: Preset[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const validation = validatePresetStructure(rawData[i]);
      if (validation.isValid && validation.preset) {
        validatedPresets.push(validation.preset);
        if (validation.warnings) {
          warnings.push(`Preset ${i}: ${validation.warnings.join(', ')}`);
        }
      } else {
        warnings.push(`Preset ${i}: ${validation.error} - skipped`);
      }
    }

    if (warnings.length > 0) {
      console.warn('Template validation warnings:', warnings);
    }

    return validatedPresets;
  } catch (error) {
    console.error('Failed to load presets from main storage:', error);

    // Try to recover from backup
    return recoverFromBackup() || [];
  }
}

/**
 * Saves presets with backup creation and quota handling
 */
export function savePresets(presets: Preset[]): boolean {
  // Empty payload is a valid no-op.
  if (!Array.isArray(presets) || presets.length === 0) {
    return true;
  }

  try {
    // Create backup before overwrite
    createBackup(presets);

    // Add/update timestamps
    const presetsWithTimestamps = presets.map(preset => ({
      ...preset,
      version: TEMPLATE_VERSION,
      modifiedAt: new Date().toISOString(),
      createdAt: preset.createdAt || new Date().toISOString(),
    }));

    const dataToSave = JSON.stringify(presetsWithTimestamps);

    // Check if we're approaching localStorage quota
    if (dataToSave.length > 4 * 1024 * 1024) {
      // 4MB warning threshold
      console.warn('Template data is large (>4MB), consider cleanup');
    }

    localStorage.setItem(STORAGE_KEYS.PRESETS, dataToSave);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return handleQuotaExceeded(presets);
    }

    console.error('Failed to save presets:', error);
    return false;
  }
}

/**
 * Handles localStorage quota exceeded by cleanup and retry
 */
function handleQuotaExceeded(presets: Preset[]): boolean {
  console.warn('localStorage quota exceeded, attempting cleanup...');

  try {
    // Remove old backups
    sessionStorage.removeItem(STORAGE_KEYS.BACKUP);
    sessionStorage.removeItem(STORAGE_KEYS.RECOVERY);

    // Try to clean up other localStorage items (if any)
    const keysToCheck = ['debug-logs', 'temp-data', 'cache'];
    for (const key of keysToCheck) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    }

    // Retry save with only essential data
    const essentialPresets = presets.slice(-10); // Keep only last 10 presets
    const essentialData = JSON.stringify(essentialPresets);
    localStorage.setItem(STORAGE_KEYS.PRESETS, essentialData);

    console.warn('Quota exceeded: saved only the 10 most recent presets');
    return true;
  } catch (retryError) {
    console.error('Failed to save even after cleanup:', retryError);
    return false;
  }
}

/**
 * Attempts to recover presets from backup storage
 */
function recoverFromBackup(): Preset[] | null {
  try {
    const backup = sessionStorage.getItem(STORAGE_KEYS.BACKUP);
    if (!backup) {
      return null;
    }

    const backupData = safeJsonParse(backup);
    if (Array.isArray(backupData.data)) {
      console.warn('Recovered presets from backup');
      return backupData.data;
    }

    return null;
  } catch (error) {
    console.error('Failed to recover from backup:', error);
    return null;
  }
}

/**
 * Validates a single preset for import
 */
export function validateImportedPreset(data: any): TemplateValidationResult {
  return validatePresetStructure(data);
}

/**
 * Creates a recovery save point
 */
export function createRecoveryPoint(presets: Preset[]): boolean {
  // Empty payload is a valid no-op.
  if (!Array.isArray(presets) || presets.length === 0) {
    return true;
  }

  try {
    const recovery = {
      data: presets,
      timestamp: new Date().toISOString(),
      version: TEMPLATE_VERSION,
    };
    sessionStorage.setItem(STORAGE_KEYS.RECOVERY, JSON.stringify(recovery));
    return true;
  } catch (error) {
    console.error('Failed to create recovery point:', error);
    return false;
  }
}

/**
 * Gets available recovery options
 */
export function getRecoveryOptions(): { backup?: string; recovery?: string } {
  const options: { backup?: string; recovery?: string } = {};

  try {
    const backup = sessionStorage.getItem(STORAGE_KEYS.BACKUP);
    if (backup) {
      const backupData = JSON.parse(backup);
      options.backup = backupData.timestamp;
    }
  } catch (error) {
    // Ignore backup parsing errors
  }

  try {
    const recovery = sessionStorage.getItem(STORAGE_KEYS.RECOVERY);
    if (recovery) {
      const recoveryData = JSON.parse(recovery);
      options.recovery = recoveryData.timestamp;
    }
  } catch (error) {
    // Ignore recovery parsing errors
  }

  return options;
}
