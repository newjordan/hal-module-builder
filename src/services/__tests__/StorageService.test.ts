/**
 * StorageService Tests
 * Tests for preset/template persistence and theme management
 */
import { StorageService } from '../StorageService';
import { Preset } from '../../types/layer-types';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
  get length() {
    return Object.keys(this.store).length;
  },
  key: jest.fn((index: number) => {
    const keys = Object.keys(mockLocalStorage.store);
    return keys[index] || null;
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    mockLocalStorage.store = {};
    jest.clearAllMocks();
  });

  describe('Theme Operations', () => {
    it('should save and load theme preference', () => {
      const result = storageService.saveTheme('frost_dark');
      expect(result).toBe(true);

      const loaded = storageService.loadTheme();
      expect(loaded).toBe('frost_dark');
    });

    it('should return default theme when none exists', () => {
      const theme = storageService.loadTheme();
      expect(theme).toBe('frost_light');
    });

    it('should handle invalid theme data gracefully', () => {
      mockLocalStorage.store['hal-theme'] = 'invalid_theme';
      const theme = storageService.loadTheme();
      expect(theme).toBe('frost_light');
    });
  });

  describe('User Preferences', () => {
    it('should save and load preferences', () => {
      const preferences = { volume: 0.8, autoSave: true };

      const result = storageService.savePreferences(preferences);
      expect(result).toBe(true);

      const loaded = storageService.loadPreferences();
      expect(loaded).toEqual(preferences);
    });

    it('should return empty object when no preferences exist', () => {
      const preferences = storageService.loadPreferences();
      expect(preferences).toEqual({});
    });
  });

  describe('Preset Operations', () => {
    const mockPreset: Preset = {
      id: 'preset-1',
      name: 'Test Preset',
      layers: [
        {
          id: 'layer-1',
          name: 'Test Layer',
          type: 'solid',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          color: '#ff0000',
        },
      ],
      timestamp: Date.now(),
    };

    it('should save and load single preset', () => {
      const result = storageService.savePreset(mockPreset);
      expect(result).toBe(true);

      const presets = storageService.loadPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe(mockPreset.id);
    });

    it('should save multiple presets', () => {
      const preset2: Preset = {
        ...mockPreset,
        id: 'preset-2',
        name: 'Preset 2',
      };

      storageService.savePreset(mockPreset);
      storageService.savePreset(preset2);

      const presets = storageService.loadPresets();
      expect(presets).toHaveLength(2);
      expect(presets.map(p => p.id)).toContain(mockPreset.id);
      expect(presets.map(p => p.id)).toContain(preset2.id);
    });

    it('should delete preset by ID', () => {
      storageService.savePreset(mockPreset);

      const result = storageService.deletePreset(mockPreset.id);
      expect(result).toBe(true);

      const presets = storageService.loadPresets();
      expect(presets).toHaveLength(0);
    });

    it('should return false when deleting non-existent preset', () => {
      const result = storageService.deletePreset('non-existent');
      expect(result).toBe(false);
    });

    it('should handle invalid preset data', () => {
      const invalidPreset = { name: 'Invalid' }; // Missing required fields
      mockLocalStorage.store['hal-presets'] = JSON.stringify([invalidPreset]);

      const presets = storageService.loadPresets();
      expect(presets).toHaveLength(0); // Invalid presets should be filtered out
    });
  });

  describe('Import/Export Operations', () => {
    const mockPreset: Preset = {
      id: 'preset-1',
      name: 'Test Preset',
      layers: [
        {
          id: 'layer-1',
          name: 'Test Layer',
          type: 'solid',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          color: '#ff0000',
        },
      ],
      timestamp: Date.now(),
    };

    it('should export preset to JSON string', () => {
      const jsonString = storageService.exportPreset(mockPreset);
      expect(jsonString).toBeTruthy();
      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsed = JSON.parse(jsonString);
      expect(parsed.id).toBe(mockPreset.id);
    });

    it('should import preset from JSON string', () => {
      const jsonString = JSON.stringify(mockPreset);
      const result = storageService.importPreset(jsonString);

      expect(result.preset).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.preset?.name).toBe(mockPreset.name);
    });

    it('should handle invalid JSON during import', () => {
      const result = storageService.importPreset('invalid json {');

      expect(result.preset).toBeUndefined();
      expect(result.error).toContain('Failed to parse JSON');
    });

    it('should handle invalid preset structure during import', () => {
      const invalidJson = JSON.stringify({ name: 'Invalid' });
      const result = storageService.importPreset(invalidJson);

      expect(result.preset).toBeUndefined();
      expect(result.error).toContain('Invalid preset format');
    });
  });

  describe('Storage Statistics', () => {
    it('should calculate storage stats', () => {
      const mockPreset: Preset = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [
          {
            id: 'layer-1',
            name: 'Test Layer',
            type: 'solid',
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            scale: 1,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            color: '#ff0000',
          },
        ],
        timestamp: Date.now(),
      };

      storageService.savePreset(mockPreset);
      storageService.saveTheme('frost_dark');

      const stats = storageService.getStorageStats();

      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.presetCount).toBe(1);
    });

    it('should handle empty storage stats', () => {
      const stats = storageService.getStorageStats();

      expect(stats.totalKeys).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.presetCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors when saving presets', () => {
      // Mock localStorage.setItem to throw
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      const mockPreset: Preset = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [
          {
            id: 'layer-1',
            name: 'Test Layer',
            type: 'solid',
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            scale: 1,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            color: '#ff0000',
          },
        ],
        timestamp: Date.now(),
      };

      const result = storageService.savePreset(mockPreset);
      expect(result).toBe(false);
    });

    it('should handle JSON parse errors when loading presets', () => {
      // Manually set invalid JSON
      mockLocalStorage.store['hal-presets'] = 'invalid json {';

      const presets = storageService.loadPresets();
      expect(presets).toEqual([]);
    });

    it('should handle localStorage errors when saving theme', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = storageService.saveTheme('frost_dark');
      expect(result).toBe(false);
    });
  });

  describe('Data Clearing', () => {
    it('should clear all HAL-related data', () => {
      const mockPreset: Preset = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [
          {
            id: 'layer-1',
            name: 'Test Layer',
            type: 'solid',
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            scale: 1,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            color: '#ff0000',
          },
        ],
        timestamp: Date.now(),
      };

      storageService.savePreset(mockPreset);
      storageService.saveTheme('frost_dark');

      const result = storageService.clearAll();
      expect(result).toBe(true);

      const presets = storageService.loadPresets();
      expect(presets).toHaveLength(0);

      const theme = storageService.loadTheme();
      expect(theme).toBe('frost_light'); // Should return default
    });
  });
});
