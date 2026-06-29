/**
 * StorageService - Local storage abstraction for HAL Builder
 * Handles template/preset persistence with validation and migration support
 */
import { Preset } from '../types/layer-types';

export interface StorageServiceOptions {
  keyPrefix?: string;
  enableMigration?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class StorageService {
  private keyPrefix: string;
  // private enableMigration: boolean;

  constructor(options: StorageServiceOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'hal-';
    // this.enableMigration = options.enableMigration !== false;
  }

  /**
   * Save presets to localStorage
   */
  savePresets(presets: Preset[]): boolean {
    try {
      const serialized = JSON.stringify(presets, null, 0);
      localStorage.setItem(`${this.keyPrefix}presets`, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save presets:', error);
      return false;
    }
  }

  /**
   * Load presets from localStorage
   */
  loadPresets(): Preset[] {
    try {
      const saved = localStorage.getItem(`${this.keyPrefix}presets`);
      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);

      // Validate loaded data
      if (!Array.isArray(parsed)) {
        console.warn('Invalid preset data format, returning empty array');
        return [];
      }

      // Validate each preset and filter out invalid ones
      const validPresets = parsed.filter(preset => {
        const validation = this.validatePreset(preset);
        if (!validation.isValid) {
          console.warn(
            `Invalid preset "${preset?.name || 'unnamed'}":`,
            validation.errors
          );
          return false;
        }
        if (validation.warnings.length > 0) {
          console.warn(
            `Warnings for preset "${preset.name}":`,
            validation.warnings
          );
        }
        return true;
      });

      return validPresets;
    } catch (error) {
      console.error('Failed to load presets:', error);
      return [];
    }
  }

  /**
   * Save a single preset
   */
  savePreset(preset: Preset): boolean {
    const presets = this.loadPresets();
    const existingIndex = presets.findIndex(p => p.id === preset.id);

    if (existingIndex >= 0) {
      presets[existingIndex] = preset;
    } else {
      presets.push(preset);
    }

    return this.savePresets(presets);
  }

  /**
   * Delete a preset by ID
   */
  deletePreset(presetId: string): boolean {
    const presets = this.loadPresets();
    const filteredPresets = presets.filter(p => p.id !== presetId);

    if (filteredPresets.length === presets.length) {
      // No preset was found with that ID
      return false;
    }

    return this.savePresets(filteredPresets);
  }

  /**
   * Save theme preference
   */
  saveTheme(theme: 'frost_light' | 'frost_dark'): boolean {
    try {
      localStorage.setItem(`${this.keyPrefix}theme`, theme);
      return true;
    } catch (error) {
      console.error('Failed to save theme:', error);
      return false;
    }
  }

  /**
   * Load theme preference
   */
  loadTheme(): 'frost_light' | 'frost_dark' {
    try {
      const saved = localStorage.getItem(`${this.keyPrefix}theme`);
      if (saved === 'frost_light' || saved === 'frost_dark') {
        return saved;
      }
      return 'frost_light'; // Default theme
    } catch (error) {
      console.error('Failed to load theme:', error);
      return 'frost_light';
    }
  }

  /**
   * Save user preferences
   */
  savePreferences(preferences: Record<string, any>): boolean {
    try {
      const serialized = JSON.stringify(preferences);
      localStorage.setItem(`${this.keyPrefix}preferences`, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  }

  /**
   * Load user preferences
   */
  loadPreferences(): Record<string, any> {
    try {
      const saved = localStorage.getItem(`${this.keyPrefix}preferences`);
      if (!saved) {
        return {};
      }
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return {};
    }
  }

  /**
   * Export preset to JSON string
   */
  exportPreset(preset: Preset): string {
    const validation = this.validatePreset(preset);
    if (!validation.isValid) {
      throw new Error(
        `Cannot export invalid preset: ${validation.errors.join(', ')}`
      );
    }

    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset from JSON string
   */
  importPreset(jsonString: string): { preset?: Preset; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = this.validatePreset(parsed);

      if (!validation.isValid) {
        return {
          error: `Invalid preset format: ${validation.errors.join(', ')}`,
        };
      }

      // Generate new ID for imported preset to avoid conflicts
      const preset: Preset = {
        ...parsed,
        id: `preset_${Date.now()}`,
        timestamp: Date.now(),
      };

      return { preset };
    } catch (error) {
      return { error: `Failed to parse JSON: ${error}` };
    }
  }

  /**
   * Validate preset structure
   */
  private validatePreset(preset: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!preset || typeof preset !== 'object') {
      errors.push('Preset must be an object');
      return { isValid: false, errors, warnings };
    }

    if (!preset.id || typeof preset.id !== 'string') {
      errors.push('Preset must have a valid ID');
    }

    if (!preset.name || typeof preset.name !== 'string') {
      errors.push('Preset must have a valid name');
    }

    if (typeof preset.timestamp !== 'number') {
      warnings.push('Preset timestamp is missing or invalid');
    }

    if (!Array.isArray(preset.layers)) {
      errors.push('Preset must contain a layers array');
    } else {
      // Validate each layer
      preset.layers.forEach((layer: any, index: number) => {
        const layerValidation = this.validateLayer(layer);
        if (!layerValidation.isValid) {
          errors.push(`Layer ${index}: ${layerValidation.errors.join(', ')}`);
        }
        warnings.push(
          ...layerValidation.warnings.map(w => `Layer ${index}: ${w}`)
        );
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate layer structure
   */
  private validateLayer(layer: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!layer || typeof layer !== 'object') {
      errors.push('Layer must be an object');
      return { isValid: false, errors, warnings };
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
    requiredFields.forEach(field => {
      if (layer[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Type validation
    const validTypes = ['image', 'gradient', 'solid', 'effect', 'circle'];
    if (!validTypes.includes(layer.type)) {
      errors.push(`Invalid layer type: ${layer.type}`);
    }

    // Value range validation
    if (
      typeof layer.opacity === 'number' &&
      (layer.opacity < 0 || layer.opacity > 1)
    ) {
      warnings.push('Opacity should be between 0 and 1');
    }

    if (typeof layer.scale === 'number' && layer.scale < 0) {
      warnings.push('Scale should be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Clear all stored data
   */
  clearAll(): boolean {
    try {
      // Get all keys from localStorage
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }

      keys.forEach(key => {
        if (key.startsWith(this.keyPrefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    totalKeys: number;
    totalSize: number;
    presetCount: number;
  } {
    try {
      // Get all keys from localStorage
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }

      const halKeys = keys.filter(key => key.startsWith(this.keyPrefix));

      let totalSize = 0;
      halKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      });

      const presets = this.loadPresets();

      return {
        totalKeys: halKeys.length,
        totalSize,
        presetCount: presets.length,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalKeys: 0,
        totalSize: 0,
        presetCount: 0,
      };
    }
  }
}

/**
 * Default storage service instance
 */
let storageServiceInstance: StorageService | null = null;

export const getStorageService = (
  options?: StorageServiceOptions
): StorageService => {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService(options);
  }
  return storageServiceInstance;
};

export const disposeStorageService = (): void => {
  storageServiceInstance = null;
};
