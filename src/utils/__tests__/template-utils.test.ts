import {
  loadPresets,
  savePresets,
  validateImportedPreset,
  createRecoveryPoint,
  getRecoveryOptions,
} from '../template-utils';

// Mock storage APIs
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock valid layer and preset data
const mockValidLayer = {
  id: 'layer-1',
  name: 'Test Layer',
  type: 'solid' as const,
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  color: '#ff0000',
};

const mockValidPreset = {
  id: 'preset-1',
  name: 'Test Preset',
  layers: [mockValidLayer],
  version: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  modifiedAt: '2024-01-01T00:00:00.000Z',
};

beforeAll(() => {
  // Mock Storage APIs
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });

  // Mock console methods
  Object.defineProperty(console, 'error', {
    value: mockConsole.error,
    writable: true,
  });

  Object.defineProperty(console, 'warn', {
    value: mockConsole.warn,
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('template-utils', () => {
  describe('loadPresets', () => {
    it('should return empty array when no data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = loadPresets();

      expect(result).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('hal-presets');
    });

    it('should load and validate valid presets', () => {
      const presetsData = [mockValidPreset];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(presetsData));

      const result = loadPresets();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'preset-1',
        name: 'Test Preset',
        layers: [expect.objectContaining({ id: 'layer-1' })],
      });
    });

    it('should handle invalid JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = loadPresets();

      expect(result).toEqual([]);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should skip invalid presets and warn', () => {
      const invalidPreset = { id: 'invalid', name: 'Invalid' }; // missing layers
      const validPreset = mockValidPreset;
      const presetsData = [invalidPreset, validPreset];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(presetsData));

      const result = loadPresets();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('preset-1');
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should recover from backup when main storage fails', () => {
      const backupData = {
        data: [mockValidPreset],
        timestamp: '2024-01-01T00:00:00.000Z',
        version: 1,
      };

      mockLocalStorage.getItem.mockReturnValue('invalid json');
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(backupData));

      const result = loadPresets();

      expect(result).toEqual([mockValidPreset]);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Recovered presets from backup'
      );
    });

    it('should handle non-array data', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ not: 'array' })
      );
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = loadPresets();

      expect(result).toEqual([]);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should add missing timestamps and version', () => {
      const presetWithoutTimestamps = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [mockValidLayer],
      };

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([presetWithoutTimestamps])
      );

      const result = loadPresets();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('version');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('modifiedAt');
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('savePresets', () => {
    it('should save valid presets successfully', () => {
      const presets = [mockValidPreset];

      const result = savePresets(presets);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'hal-presets',
        expect.stringContaining('preset-1')
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalled(); // backup created
    });

    it('should add timestamps to presets', () => {
      const presetWithoutTimestamps = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [mockValidLayer],
      };

      savePresets([presetWithoutTimestamps as any]);

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData[0]).toHaveProperty('createdAt');
      expect(savedData[0]).toHaveProperty('modifiedAt');
      expect(savedData[0]).toHaveProperty('version');
    });

    it('should warn about large data size', () => {
      // Create a layer with large properties to reach 4MB threshold
      const largeLayer = {
        ...mockValidLayer,
        // Add a large property to reach the size threshold
        largeData: 'x'.repeat(5 * 1024 * 1024), // 5MB of data
      };

      const largePreset = {
        ...mockValidPreset,
        layers: [largeLayer],
      };

      savePresets([largePreset]);

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Template data is large')
      );
    });

    it('should handle quota exceeded error', () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';

      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw quotaError;
      });

      // Mock successful retry
      mockLocalStorage.setItem.mockImplementationOnce(() => {});

      const result = savePresets([mockValidPreset]);

      expect(result).toBe(true);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('localStorage quota exceeded')
      );
    });

    it('should handle general save errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = savePresets([mockValidPreset]);

      expect(result).toBe(false);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should preserve existing createdAt timestamp', () => {
      const existingTimestamp = '2023-01-01T00:00:00.000Z';
      const presetWithTimestamp = {
        ...mockValidPreset,
        createdAt: existingTimestamp,
      };

      savePresets([presetWithTimestamp]);

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].createdAt).toBe(existingTimestamp);
    });
  });

  describe('validateImportedPreset', () => {
    it('should validate correct preset structure', () => {
      const result = validateImportedPreset(mockValidPreset);

      expect(result.isValid).toBe(true);
      expect(result.preset).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject preset without required fields', () => {
      const invalidPreset = { id: 'test' }; // missing name and layers

      const result = validateImportedPreset(invalidPreset);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('missing or invalid name');
    });

    it('should reject non-object input', () => {
      const result = validateImportedPreset('not an object');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not an object');
    });

    it('should reject preset with invalid layers', () => {
      const presetWithInvalidLayer = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [{ id: 'layer-1' }], // missing required fields
      };

      const result = validateImportedPreset(presetWithInvalidLayer);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Layer 0');
    });

    it('should validate and fix layer ranges', () => {
      const presetWithInvalidRanges = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [
          {
            ...mockValidLayer,
            opacity: 2, // invalid: > 1
            scale: -1, // invalid: negative
          },
        ],
      };

      const result = validateImportedPreset(presetWithInvalidRanges);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.preset?.layers[0].opacity).toBe(1); // clamped
      expect(result.preset?.layers[0].scale).toBe(0.1); // fixed
    });

    it('should reject layers with invalid type', () => {
      const presetWithInvalidType = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [
          {
            ...mockValidLayer,
            type: 'invalid-type',
          },
        ],
      };

      const result = validateImportedPreset(presetWithInvalidType);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid type');
    });

    it('should handle validation exceptions', () => {
      // Create an object that will cause JSON.parse issues
      const cyclicalObject: any = { id: 'test', name: 'test', layers: [] };
      cyclicalObject.self = cyclicalObject;

      // Override the validation to trigger an exception
      const result = validateImportedPreset(cyclicalObject);

      // Should handle gracefully
      expect(result.isValid).toBeDefined();
    });
  });

  describe('createRecoveryPoint', () => {
    it('should create recovery point successfully', () => {
      const presets = [mockValidPreset];

      const result = createRecoveryPoint(presets);

      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'hal-presets-recovery',
        expect.stringContaining('preset-1')
      );
    });

    it('should handle storage errors', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = createRecoveryPoint([mockValidPreset]);

      expect(result).toBe(false);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should include timestamp and version in recovery point', () => {
      createRecoveryPoint([mockValidPreset]);

      const savedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveProperty('timestamp');
      expect(savedData).toHaveProperty('version');
      expect(savedData).toHaveProperty('data');
    });
  });

  describe('getRecoveryOptions', () => {
    it('should return empty object when no recovery options exist', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = getRecoveryOptions();

      expect(result).toEqual({});
    });

    it('should return backup timestamp when backup exists', () => {
      const backupData = {
        timestamp: '2024-01-01T00:00:00.000Z',
        data: [mockValidPreset],
      };

      mockSessionStorage.getItem.mockImplementation(key => {
        if (key === 'hal-presets-backup') {
          return JSON.stringify(backupData);
        }
        return null;
      });

      const result = getRecoveryOptions();

      expect(result.backup).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should return recovery timestamp when recovery exists', () => {
      const recoveryData = {
        timestamp: '2024-01-02T00:00:00.000Z',
        data: [mockValidPreset],
      };

      mockSessionStorage.getItem.mockImplementation(key => {
        if (key === 'hal-presets-recovery') {
          return JSON.stringify(recoveryData);
        }
        return null;
      });

      const result = getRecoveryOptions();

      expect(result.recovery).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should return both backup and recovery when both exist', () => {
      const backupData = { timestamp: '2024-01-01T00:00:00.000Z' };
      const recoveryData = { timestamp: '2024-01-02T00:00:00.000Z' };

      mockSessionStorage.getItem.mockImplementation(key => {
        if (key === 'hal-presets-backup') {
          return JSON.stringify(backupData);
        }
        if (key === 'hal-presets-recovery') {
          return JSON.stringify(recoveryData);
        }
        return null;
      });

      const result = getRecoveryOptions();

      expect(result.backup).toBe('2024-01-01T00:00:00.000Z');
      expect(result.recovery).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should handle invalid JSON in storage gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      const result = getRecoveryOptions();

      expect(result).toEqual({});
      // Should not throw errors or log to console for parsing failures
    });

    it('should handle missing timestamp gracefully', () => {
      const dataWithoutTimestamp = { data: [mockValidPreset] };

      mockSessionStorage.getItem.mockReturnValue(
        JSON.stringify(dataWithoutTimestamp)
      );

      const result = getRecoveryOptions();

      expect(result.backup).toBeUndefined();
      expect(result.recovery).toBeUndefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null and undefined inputs', () => {
      expect(validateImportedPreset(null).isValid).toBe(false);
      expect(validateImportedPreset(undefined).isValid).toBe(false);
    });

    it('should handle empty arrays', () => {
      const emptyPresets: any[] = [];

      const saveResult = savePresets(emptyPresets);
      const recoveryResult = createRecoveryPoint(emptyPresets);

      expect(saveResult).toBe(true);
      expect(recoveryResult).toBe(true);
    });

    it('should handle storage API not being available', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      // Clear any previously set data first
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = loadPresets();

      // Should handle gracefully
      expect(result).toEqual([]);

      // Restore localStorage
      (window as any).localStorage = originalLocalStorage;
    });

    it('should validate layer with missing optional properties', () => {
      const layerMissingOptional = {
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
        // missing color property (type-specific)
      };

      const preset = {
        id: 'preset-1',
        name: 'Test Preset',
        layers: [layerMissingOptional],
      };

      const result = validateImportedPreset(preset);

      // Should still be valid as color is type-specific, not required for all layers
      expect(result.isValid).toBe(true);
    });
  });
});
