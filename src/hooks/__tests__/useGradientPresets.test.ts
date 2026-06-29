import { renderHook, act } from '@testing-library/react';
import { useGradientPresets } from '../useGradientPresets';
import { Layer } from '../../types/layer-types';
import { GradientData } from '../../utils/gradient';
import * as gradientPresetsModule from '../../utils/gradientPresets';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock useGradientTargets
jest.mock('../useGradientTargets', () => ({
  useGradientTargets: () => ({
    applyToTarget: jest.fn((layer, gradient, target) => ({
      gradient: gradient,
    })),
  }),
}));

describe('useGradientPresets', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  const mockGradientData: GradientData = {
    type: 'linear',
    colors: ['#ff0000', '#00ff00'],
    stops: [0, 100],
    angle: 45,
  };

  const mockLayers: Layer[] = [
    {
      id: '1',
      name: 'Gradient Layer',
      type: 'gradient',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    },
    {
      id: '2',
      name: 'Circle Layer',
      type: 'circle',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
    },
  ];

  describe('Built-in presets', () => {
    it('should provide access to built-in presets', () => {
      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.presets).toBeDefined();
      expect(Array.isArray(result.current.presets)).toBe(true);
      expect(result.current.presets.length).toBeGreaterThan(0);
    });

    it('should provide preset categories', () => {
      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.categories).toBeDefined();
      expect(Array.isArray(result.current.categories)).toBe(true);
      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    it('should get preset by name', () => {
      const { result } = renderHook(() => useGradientPresets());

      // Using actual preset name from gradientPresets module
      // First check what presets are actually available
      const availablePresets = result.current.presets;
      if (availablePresets.length > 0) {
        const firstPreset = availablePresets[0];
        const preset = result.current.getPresetByName(firstPreset.name);

        expect(preset).toBeDefined();
        expect(preset?.name).toBe(firstPreset.name);
      } else {
        // If no presets available, skip test
        expect(true).toBe(true);
      }
    });

    it('should get presets by category', () => {
      const { result } = renderHook(() => useGradientPresets());

      const presets = result.current.getPresetsByCategory('Nature');

      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    it('should get presets by tag', () => {
      const { result } = renderHook(() => useGradientPresets());

      const presets = result.current.getPresetsByTag('vibrant');

      expect(Array.isArray(presets)).toBe(true);
    });

    it('should get random preset', () => {
      const { result } = renderHook(() => useGradientPresets());

      const preset = result.current.getRandomPreset();

      expect(preset).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.colors).toBeDefined();
    });
  });

  describe('Custom presets', () => {
    it('should create a custom preset', () => {
      const { result } = renderHook(() => useGradientPresets());

      const preset = result.current.createCustomPreset(
        'My Custom Gradient',
        mockGradientData,
        'A beautiful custom gradient',
        ['custom', 'test']
      );

      expect(preset.name).toBe('My Custom Gradient');
      expect(preset.custom).toBe(true);
      expect(preset.type).toBe('linear');
      expect(preset.colors).toEqual(['#ff0000', '#00ff00']);
      expect(preset.description).toBe('A beautiful custom gradient');
      expect(preset.tags).toEqual(['custom', 'test']);
      expect(preset.createdAt).toBeInstanceOf(Date);
      expect(preset.id).toContain('custom-');
    });

    it('should save a custom preset', () => {
      const { result } = renderHook(() => useGradientPresets());

      const preset = result.current.createCustomPreset(
        'Test Preset',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(preset);
      });

      expect(result.current.customPresets).toHaveLength(1);
      expect(result.current.customPresets[0].name).toBe('Test Preset');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should delete a custom preset', () => {
      const { result } = renderHook(() => useGradientPresets());

      const preset = result.current.createCustomPreset(
        'To Delete',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(preset);
      });

      expect(result.current.customPresets).toHaveLength(1);

      act(() => {
        result.current.deleteCustomPreset(preset.id);
      });

      expect(result.current.customPresets).toHaveLength(0);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should update a custom preset', () => {
      const { result } = renderHook(() => useGradientPresets());

      const preset = result.current.createCustomPreset(
        'Original Name',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(preset);
      });

      act(() => {
        result.current.updateCustomPreset(preset.id, {
          name: 'Updated Name',
          description: 'Updated description',
        });
      });

      expect(result.current.customPresets[0].name).toBe('Updated Name');
      expect(result.current.customPresets[0].description).toBe(
        'Updated description'
      );
    });

    it('should load custom presets from localStorage on initialization', () => {
      const storedPresets = [
        {
          id: 'stored-1',
          name: 'Stored Preset',
          type: 'linear',
          colors: ['#000000', '#ffffff'],
          stops: [0, 100],
          custom: true,
          createdAt: new Date().toISOString(),
        },
      ];

      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify(storedPresets)
      );

      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.customPresets).toHaveLength(1);
      expect(result.current.customPresets[0].name).toBe('Stored Preset');
      expect(result.current.customPresets[0].createdAt).toBeInstanceOf(Date);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.customPresets).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load custom gradients from localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Preset application', () => {
    it('should apply a built-in preset to a layer', () => {
      const { result } = renderHook(() => useGradientPresets());
      const updateLayer = jest.fn();

      // Use first available preset
      const availablePresets = result.current.presets;
      if (availablePresets.length > 0) {
        const firstPreset = availablePresets[0];

        act(() => {
          result.current.applyPreset(
            '1',
            firstPreset.name,
            updateLayer,
            mockLayers,
            'layer'
          );
        });

        expect(updateLayer).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            gradient: expect.objectContaining({
              type: expect.any(String),
              colors: expect.any(Array),
              stops: expect.any(Array),
            }),
          })
        );
      } else {
        expect(true).toBe(true);
      }
    });

    it('should throw error when applying preset to non-existent layer', () => {
      const { result } = renderHook(() => useGradientPresets());
      const updateLayer = jest.fn();

      expect(() => {
        result.current.applyPreset(
          'non-existent',
          'Sunset',
          updateLayer,
          mockLayers,
          'layer'
        );
      }).toThrow("Layer 'non-existent' not found");
    });

    it('should throw error when applying non-existent preset', () => {
      const { result } = renderHook(() => useGradientPresets());
      const updateLayer = jest.fn();

      expect(() => {
        result.current.applyPreset(
          '1',
          'NonExistentPreset_12345_DoesNotExist',
          updateLayer,
          mockLayers,
          'layer'
        );
      }).toThrow("Preset 'NonExistentPreset_12345_DoesNotExist' not found");
    });

    it('should apply a custom preset and update lastUsed', () => {
      const { result } = renderHook(() => useGradientPresets());
      const updateLayer = jest.fn();

      const preset = result.current.createCustomPreset(
        'Custom Preset',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(preset);
      });

      act(() => {
        result.current.applyCustomPreset(
          '1',
          preset,
          updateLayer,
          mockLayers,
          'layer'
        );
      });

      expect(updateLayer).toHaveBeenCalled();
      expect(result.current.customPresets[0].lastUsed).toBeInstanceOf(Date);
    });
  });

  describe('Import/Export', () => {
    it('should export custom presets', () => {
      const { result } = renderHook(() => useGradientPresets());

      const preset = result.current.createCustomPreset(
        'Export Test',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(preset);
      });

      const exported = result.current.exportCustomPresets();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe('1.0');
      expect(parsed.exportDate).toBeDefined();
      expect(parsed.presets).toHaveLength(1);
      expect(parsed.presets[0].name).toBe('Export Test');
    });

    it('should import valid custom presets', () => {
      const { result } = renderHook(() => useGradientPresets());

      const importData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        presets: [
          {
            name: 'Imported Preset',
            type: 'linear',
            colors: ['#123456', '#654321'],
            stops: [0, 100],
            angle: 90,
          },
        ],
      };

      let success: boolean = false;
      act(() => {
        success = result.current.importCustomPresets(
          JSON.stringify(importData)
        );
      });

      expect(success).toBe(true);
      expect(result.current.customPresets).toHaveLength(1);
      expect(result.current.customPresets[0].name).toBe('Imported Preset');
      expect(result.current.customPresets[0].id).toContain('imported-');
    });

    it('should reject invalid import data', () => {
      const { result } = renderHook(() => useGradientPresets());

      const invalidData = {
        version: '1.0',
        // Missing presets array
      };

      let success: boolean = true;
      act(() => {
        success = result.current.importCustomPresets(
          JSON.stringify(invalidData)
        );
      });

      expect(success).toBe(false);
      expect(result.current.customPresets).toHaveLength(0);
    });

    it('should filter out invalid presets during import', () => {
      const { result } = renderHook(() => useGradientPresets());

      const importData = {
        version: '1.0',
        presets: [
          {
            name: 'Valid Preset',
            type: 'linear',
            colors: ['#123456', '#654321'],
            stops: [0, 100],
          },
          {
            // Invalid - missing required fields
            name: 'Invalid Preset',
          },
        ],
      };

      act(() => {
        result.current.importCustomPresets(JSON.stringify(importData));
      });

      expect(result.current.customPresets).toHaveLength(1);
      expect(result.current.customPresets[0].name).toBe('Valid Preset');
    });

    it('should handle import errors gracefully', () => {
      const { result } = renderHook(() => useGradientPresets());
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      let success: boolean = true;
      act(() => {
        success = result.current.importCustomPresets('invalid json');
      });

      expect(success).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to import custom presets:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Utility functions', () => {
    it('should get all presets (built-in + custom)', () => {
      const { result } = renderHook(() => useGradientPresets());

      const customPreset = result.current.createCustomPreset(
        'Custom',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(customPreset);
      });

      const allPresets = result.current.getAllPresets();

      expect(allPresets.length).toBe(
        result.current.presets.length + result.current.customPresets.length
      );
    });

    it('should search presets by name', () => {
      const { result } = renderHook(() => useGradientPresets());

      const customPreset = result.current.createCustomPreset(
        'Unique Test Name',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(customPreset);
      });

      const results = result.current.searchPresets('Unique');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.name === 'Unique Test Name')).toBe(true);
    });

    it('should search presets by description', () => {
      const { result } = renderHook(() => useGradientPresets());

      const customPreset = result.current.createCustomPreset(
        'Test',
        mockGradientData,
        'Special description for testing'
      );

      act(() => {
        result.current.saveCustomPreset(customPreset);
      });

      const results = result.current.searchPresets('Special');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].description).toContain('Special');
    });

    it('should search presets by tags', () => {
      const { result } = renderHook(() => useGradientPresets());

      const customPreset = result.current.createCustomPreset(
        'Tagged',
        mockGradientData,
        undefined,
        ['searchable', 'test']
      );

      act(() => {
        result.current.saveCustomPreset(customPreset);
      });

      const results = result.current.searchPresets('searchable');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tags).toContain('searchable');
    });

    it('should handle case-insensitive search', () => {
      const { result } = renderHook(() => useGradientPresets());

      const customPreset = result.current.createCustomPreset(
        'CaseSensitive',
        mockGradientData
      );

      act(() => {
        result.current.saveCustomPreset(customPreset);
      });

      const results = result.current.searchPresets('casesensitive');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('CaseSensitive');
    });
  });
});
