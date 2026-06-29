import { renderHook, act } from '@testing-library/react';
import {
  useGradientPresets,
  CustomPreset,
} from '../../../hooks/useGradientPresets';
import { Layer } from '../../../types/layer-types';
import { GradientData, GradientTarget } from '../../../utils/gradient';

// Mock dependencies
jest.mock('../../../hooks/useGradientTargets');
jest.mock('../../../utils/gradientPresets');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock console methods
const mockConsoleWarn = jest.fn();
console.warn = mockConsoleWarn;

// Create mock implementations
const mockGradientTargets = {
  applyToTarget: jest.fn((layer, gradient, target) => {
    if (target === 'layer') return { gradient };
    if (target === 'custom')
      return {
        equalizerSettings: {
          ...layer.equalizerSettings,
          customGradient: gradient,
        },
      };
    return {};
  }),
};

const mockBuiltInPresets = [
  {
    name: 'sunset',
    type: 'linear',
    colors: ['#ff6b6b', '#ffa726', '#ffcc02'],
    stops: [0, 0.5, 1],
    angle: 45,
    tags: ['warm', 'nature'],
    description: 'Beautiful sunset colors',
  },
  {
    name: 'ocean',
    type: 'radial',
    colors: ['#0077be', '#00a8cc', '#00c896'],
    stops: [0, 0.5, 1],
    centerX: 50,
    centerY: 50,
    tags: ['cool', 'nature'],
    description: 'Ocean depth colors',
  },
  {
    name: 'fire',
    type: 'conic',
    colors: ['#ff0000', '#ff4500', '#ffd700'],
    stops: [0, 0.7, 1],
    angle: 0,
    tags: ['warm', 'intense'],
    description: 'Fiery gradient',
  },
];

const mockCategories = [
  { name: 'nature', displayName: 'Nature', description: 'Natural gradients' },
  {
    name: 'abstract',
    displayName: 'Abstract',
    description: 'Abstract gradients',
  },
];

// Setup mocks
require('../../../hooks/useGradientTargets').useGradientTargets = jest.fn(
  () => mockGradientTargets
);
require('../../../utils/gradientPresets').ALL_GRADIENT_PRESETS =
  mockBuiltInPresets;
require('../../../utils/gradientPresets').GRADIENT_PRESET_CATEGORIES =
  mockCategories;
require('../../../utils/gradientPresets').getPresetByName = jest.fn(name =>
  mockBuiltInPresets.find(p => p.name === name)
);
require('../../../utils/gradientPresets').getPresetsByCategory = jest.fn(
  category => mockBuiltInPresets.filter(p => p.tags?.includes(category))
);
require('../../../utils/gradientPresets').getPresetsByTag = jest.fn(tag =>
  mockBuiltInPresets.filter(p => p.tags?.includes(tag))
);
require('../../../utils/gradientPresets').getRandomPreset = jest.fn(
  () => mockBuiltInPresets[0]
);

describe('useGradientPresets - Comprehensive Coverage', () => {
  const mockLayer: Layer = {
    id: 'test-layer',
    name: 'Test Layer',
    type: 'gradient',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    gradient: {
      type: 'linear',
      colors: ['#ff0000', '#0000ff'],
      stops: [0, 1],
      angle: 0,
    },
  };

  const mockEqualizerLayer: Layer = {
    id: 'equalizer-layer',
    name: 'Test Equalizer',
    type: 'equalizer',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    equalizerSettings: {
      barCount: 32,
      barStyle: 'line',
      barWidth: 2,
      barSpacing: 1,
      barRotation: 0,
      innerRadius: 120,
      maxHeight: 30,
      responseSpeed: 0.7,
      frequencyRange: 'full',
      colorMode: 'custom-gradient',
      primaryColor: '#00ff00',
      secondaryColor: '#0000ff',
      customGradient: {
        type: 'linear',
        colors: ['#ff0000', '#00ff00'],
        stops: [0, 1],
        angle: 90,
      },
      glowIntensity: 0.5,
      symmetry: 'none',
      pulseMode: 'none',
      positionX: 50,
      positionY: 50,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
    },
  };

  const mockLayers = [mockLayer, mockEqualizerLayer];
  const mockUpdateLayer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockUpdateLayer.mockClear();
    mockConsoleWarn.mockClear();

    // Reset the applyToTarget mock to its default implementation
    mockGradientTargets.applyToTarget.mockImplementation(
      (layer, gradient, target) => {
        if (target === 'layer') return { gradient };
        if (target === 'custom')
          return {
            equalizerSettings: {
              ...layer.equalizerSettings,
              customGradient: gradient,
            },
          };
        return {};
      }
    );
  });

  describe('Hook Initialization', () => {
    it('returns all required functions and properties', () => {
      const { result } = renderHook(() => useGradientPresets());

      expect(result.current).toHaveProperty('presets');
      expect(result.current).toHaveProperty('categories');
      expect(result.current).toHaveProperty('getPresetByName');
      expect(result.current).toHaveProperty('getPresetsByCategory');
      expect(result.current).toHaveProperty('getPresetsByTag');
      expect(result.current).toHaveProperty('getRandomPreset');
      expect(result.current).toHaveProperty('customPresets');
      expect(result.current).toHaveProperty('createCustomPreset');
      expect(result.current).toHaveProperty('saveCustomPreset');
      expect(result.current).toHaveProperty('deleteCustomPreset');
      expect(result.current).toHaveProperty('updateCustomPreset');
      expect(result.current).toHaveProperty('applyPreset');
      expect(result.current).toHaveProperty('applyCustomPreset');
      expect(result.current).toHaveProperty('exportCustomPresets');
      expect(result.current).toHaveProperty('importCustomPresets');
      expect(result.current).toHaveProperty('getAllPresets');
      expect(result.current).toHaveProperty('searchPresets');
    });

    it('exposes built-in presets and categories', () => {
      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.presets).toEqual(mockBuiltInPresets);
      expect(result.current.categories).toEqual(mockCategories);
      expect(result.current.getPresetByName).toBeDefined();
      expect(result.current.getPresetsByCategory).toBeDefined();
      expect(result.current.getPresetsByTag).toBeDefined();
      expect(result.current.getRandomPreset).toBeDefined();
    });

    it('initializes with empty custom presets when localStorage is empty', () => {
      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.customPresets).toEqual([]);
    });

    it('loads custom presets from localStorage on initialization', () => {
      const storedPresets = [
        {
          id: 'custom-1',
          name: 'Custom Sunset',
          type: 'linear',
          colors: ['#ff0000', '#ffff00'],
          stops: [0, 1],
          custom: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedPresets));

      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.customPresets).toHaveLength(1);
      expect(result.current.customPresets[0].name).toBe('Custom Sunset');
      expect(result.current.customPresets[0].createdAt).toBeInstanceOf(Date);
    });

    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.customPresets).toEqual([]);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to load custom gradients from localStorage:',
        expect.any(Error)
      );
    });

    it('handles localStorage with lastUsed date conversion', () => {
      const storedPresets = [
        {
          id: 'custom-1',
          name: 'Custom Sunset',
          type: 'linear',
          colors: ['#ff0000', '#ffff00'],
          stops: [0, 1],
          custom: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          lastUsed: '2023-01-02T00:00:00.000Z',
        },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedPresets));

      const { result } = renderHook(() => useGradientPresets());

      expect(result.current.customPresets[0].lastUsed).toBeInstanceOf(Date);
    });
  });

  describe('Custom Preset Management', () => {
    describe('createCustomPreset', () => {
      it('creates a custom preset with basic properties', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
          angle: 45,
        };

        const preset = result.current.createCustomPreset(
          'My Gradient',
          gradient
        );

        expect(preset).toMatchObject({
          name: 'My Gradient',
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
          angle: 45,
          custom: true,
        });
        expect(preset.id).toMatch(/^custom-\d+-[a-z0-9]+$/);
        expect(preset.createdAt).toBeInstanceOf(Date);
      });

      it('creates preset with optional description and tags', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'radial',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
          centerX: 50,
          centerY: 50,
        };

        const preset = result.current.createCustomPreset(
          'My Radial',
          gradient,
          'A beautiful radial gradient',
          ['custom', 'radial']
        );

        expect(preset.description).toBe('A beautiful radial gradient');
        expect(preset.tags).toEqual(['custom', 'radial']);
      });

      it('handles gradient with all optional properties', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'conic',
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
          angle: 90,
          centerX: 30,
          centerY: 70,
        };

        const preset = result.current.createCustomPreset(
          'Complete Gradient',
          gradient
        );

        expect(preset).toMatchObject({
          type: 'conic',
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          stops: [0, 0.5, 1],
          angle: 90,
          centerX: 30,
          centerY: 70,
        });
      });

      it('creates preset without optional gradient properties', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Simple Gradient',
          gradient
        );

        expect(preset.angle).toBeUndefined();
        expect(preset.centerX).toBeUndefined();
        expect(preset.centerY).toBeUndefined();
      });
    });

    describe('saveCustomPreset', () => {
      it('saves preset to state and localStorage', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Preset',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        expect(result.current.customPresets).toContain(preset);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'hal-gradient-custom-presets',
          JSON.stringify([preset])
        );
      });

      it('handles localStorage save errors gracefully', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage full');
        });

        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Preset',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        expect(result.current.customPresets).toContain(preset);
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Failed to save custom presets to localStorage:',
          expect.any(Error)
        );
      });
    });

    describe('deleteCustomPreset', () => {
      it('removes preset from state and updates localStorage', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Preset',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        expect(result.current.customPresets).toHaveLength(1);

        act(() => {
          result.current.deleteCustomPreset(preset.id);
        });

        expect(result.current.customPresets).toHaveLength(0);
        expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
          'hal-gradient-custom-presets',
          JSON.stringify([])
        );
      });

      it('handles deletion of non-existent preset gracefully', () => {
        const { result } = renderHook(() => useGradientPresets());

        act(() => {
          result.current.deleteCustomPreset('non-existent-id');
        });

        expect(result.current.customPresets).toHaveLength(0);
      });
    });

    describe('updateCustomPreset', () => {
      it('updates preset properties', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Preset',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        act(() => {
          result.current.updateCustomPreset(preset.id, {
            name: 'Updated Preset',
            description: 'Updated description',
          });
        });

        const updatedPreset = result.current.customPresets.find(
          p => p.id === preset.id
        );
        expect(updatedPreset?.name).toBe('Updated Preset');
        expect(updatedPreset?.description).toBe('Updated description');
      });

      it('updates lastUsed timestamp', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Preset',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        const testDate = new Date('2023-12-25T12:00:00.000Z');

        act(() => {
          result.current.updateCustomPreset(preset.id, { lastUsed: testDate });
        });

        const updatedPreset = result.current.customPresets.find(
          p => p.id === preset.id
        );
        expect(updatedPreset?.lastUsed).toEqual(testDate);
      });

      it('handles update of non-existent preset gracefully', () => {
        const { result } = renderHook(() => useGradientPresets());

        act(() => {
          result.current.updateCustomPreset('non-existent-id', {
            name: 'New Name',
          });
        });

        expect(result.current.customPresets).toHaveLength(0);
      });
    });
  });

  describe('Preset Application', () => {
    describe('applyPreset', () => {
      it('applies built-in preset to layer', () => {
        const { result } = renderHook(() => useGradientPresets());

        act(() => {
          result.current.applyPreset(
            'test-layer',
            'sunset',
            mockUpdateLayer,
            mockLayers
          );
        });

        expect(mockGradientTargets.applyToTarget).toHaveBeenCalledWith(
          mockLayer,
          expect.objectContaining({
            type: 'linear',
            colors: ['#ff6b6b', '#ffa726', '#ffcc02'],
            stops: [0, 0.5, 1],
            angle: 45,
          }),
          'layer'
        );
        expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer', {
          gradient: expect.any(Object),
        });
      });

      it('applies preset to specific gradient target', () => {
        const { result } = renderHook(() => useGradientPresets());

        act(() => {
          result.current.applyPreset(
            'equalizer-layer',
            'ocean',
            mockUpdateLayer,
            mockLayers,
            'custom'
          );
        });

        expect(mockGradientTargets.applyToTarget).toHaveBeenCalledWith(
          mockEqualizerLayer,
          expect.objectContaining({
            type: 'radial',
            colors: ['#0077be', '#00a8cc', '#00c896'],
            centerX: 50,
            centerY: 50,
          }),
          'custom'
        );
      });

      it('throws error for non-existent preset', () => {
        const { result } = renderHook(() => useGradientPresets());

        expect(() => {
          result.current.applyPreset(
            'test-layer',
            'non-existent-preset',
            mockUpdateLayer,
            mockLayers
          );
        }).toThrow("Preset 'non-existent-preset' not found");
      });

      it('throws error for non-existent layer', () => {
        const { result } = renderHook(() => useGradientPresets());

        expect(() => {
          result.current.applyPreset(
            'non-existent-layer',
            'sunset',
            mockUpdateLayer,
            mockLayers
          );
        }).toThrow("Layer 'non-existent-layer' not found");
      });

      it('throws error when applyToTarget fails', () => {
        mockGradientTargets.applyToTarget.mockImplementation(() => {
          throw new Error('Target application failed');
        });

        const { result } = renderHook(() => useGradientPresets());

        expect(() => {
          result.current.applyPreset(
            'test-layer',
            'sunset',
            mockUpdateLayer,
            mockLayers
          );
        }).toThrow(
          "Failed to apply preset 'sunset': Error: Target application failed"
        );
      });

      it('handles preset without optional properties', () => {
        const simplePreset = {
          name: 'simple',
          type: 'linear',
          colors: ['#000000', '#ffffff'],
          stops: [0, 1],
        };

        require('../../../utils/gradientPresets').getPresetByName.mockReturnValue(
          simplePreset
        );

        const { result } = renderHook(() => useGradientPresets());

        act(() => {
          result.current.applyPreset(
            'test-layer',
            'simple',
            mockUpdateLayer,
            mockLayers
          );
        });

        expect(mockGradientTargets.applyToTarget).toHaveBeenCalledWith(
          mockLayer,
          expect.not.objectContaining({ angle: expect.anything() }),
          'layer'
        );
      });
    });

    describe('applyCustomPreset', () => {
      it('applies custom preset to layer', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
          angle: 90,
        };

        const preset = result.current.createCustomPreset(
          'Custom Test',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        act(() => {
          result.current.applyCustomPreset(
            'test-layer',
            preset,
            mockUpdateLayer,
            mockLayers
          );
        });

        expect(mockGradientTargets.applyToTarget).toHaveBeenCalledWith(
          mockLayer,
          expect.objectContaining({
            type: 'linear',
            colors: ['#ff0000', '#00ff00'],
            stops: [0, 1],
            angle: 90,
          }),
          'layer'
        );
        expect(mockUpdateLayer).toHaveBeenCalledWith('test-layer', {
          gradient: expect.any(Object),
        });

        // Should update lastUsed timestamp
        const updatedPreset = result.current.customPresets.find(
          p => p.id === preset.id
        );
        expect(updatedPreset?.lastUsed).toBeInstanceOf(Date);
      });

      it('throws error for non-existent layer', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Preset',
          gradient
        );

        expect(() => {
          result.current.applyCustomPreset(
            'non-existent-layer',
            preset,
            mockUpdateLayer,
            mockLayers
          );
        }).toThrow("Layer 'non-existent-layer' not found");
      });

      it('throws error when applyToTarget fails', () => {
        mockGradientTargets.applyToTarget.mockImplementation(() => {
          throw new Error('Target application failed');
        });

        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Preset',
          gradient
        );

        expect(() => {
          result.current.applyCustomPreset(
            'test-layer',
            preset,
            mockUpdateLayer,
            mockLayers
          );
        }).toThrow(
          "Failed to apply custom preset 'Test Preset': Error: Target application failed"
        );
      });
    });
  });

  describe('Import/Export Functionality', () => {
    describe('exportCustomPresets', () => {
      it('exports custom presets as JSON string', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Export Test',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        const exported = result.current.exportCustomPresets();
        const parsed = JSON.parse(exported);

        expect(parsed).toHaveProperty('version', '1.0');
        expect(parsed).toHaveProperty('exportDate');
        expect(parsed).toHaveProperty('presets');
        expect(parsed.presets).toHaveLength(1);
        expect(parsed.presets[0].name).toBe('Export Test');
      });

      it('exports empty array when no custom presets exist', () => {
        const { result } = renderHook(() => useGradientPresets());

        const exported = result.current.exportCustomPresets();
        const parsed = JSON.parse(exported);

        expect(parsed.presets).toEqual([]);
      });
    });

    describe('importCustomPresets', () => {
      it('imports valid custom presets successfully', () => {
        const { result } = renderHook(() => useGradientPresets());
        const importData = {
          version: '1.0',
          exportDate: '2023-01-01T00:00:00.000Z',
          presets: [
            {
              name: 'Imported Gradient',
              type: 'linear',
              colors: ['#ff0000', '#00ff00'],
              stops: [0, 1],
              angle: 45,
              description: 'An imported gradient',
              custom: true,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
          ],
        };

        let success;
        act(() => {
          success = result.current.importCustomPresets(
            JSON.stringify(importData)
          );
        });

        expect(success).toBe(true);
        expect(result.current.customPresets).toHaveLength(1);
        expect(result.current.customPresets[0].name).toBe('Imported Gradient');
        expect(result.current.customPresets[0].id).toMatch(
          /^imported-\d+-[a-z0-9]+$/
        );
      });

      it('filters out invalid presets during import', () => {
        const { result } = renderHook(() => useGradientPresets());
        const importData = {
          presets: [
            {
              name: 'Valid Gradient',
              type: 'linear',
              colors: ['#ff0000', '#00ff00'],
              stops: [0, 1],
            },
            {
              // Missing required fields
              name: 'Invalid Gradient',
            },
            {
              // Missing colors array
              name: 'Another Invalid',
              type: 'linear',
              stops: [0, 1],
            },
          ],
        };

        let success;
        act(() => {
          success = result.current.importCustomPresets(
            JSON.stringify(importData)
          );
        });

        expect(success).toBe(true);
        expect(result.current.customPresets).toHaveLength(1);
        expect(result.current.customPresets[0].name).toBe('Valid Gradient');
      });

      it('handles import of presets with lastUsed dates', () => {
        const { result } = renderHook(() => useGradientPresets());
        const importData = {
          presets: [
            {
              name: 'Preset with lastUsed',
              type: 'linear',
              colors: ['#ff0000', '#00ff00'],
              stops: [0, 1],
              createdAt: '2023-01-01T00:00:00.000Z',
              lastUsed: '2023-01-02T00:00:00.000Z',
            },
          ],
        };

        let success;
        act(() => {
          success = result.current.importCustomPresets(
            JSON.stringify(importData)
          );
        });

        expect(success).toBe(true);
        expect(result.current.customPresets[0].lastUsed).toBeInstanceOf(Date);
      });

      it('returns false for invalid JSON', () => {
        const { result } = renderHook(() => useGradientPresets());

        const success = result.current.importCustomPresets('invalid json');

        expect(success).toBe(false);
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          'Failed to import custom presets:',
          expect.any(Error)
        );
      });

      it('returns false for data without presets array', () => {
        const { result } = renderHook(() => useGradientPresets());

        const success = result.current.importCustomPresets(
          JSON.stringify({ version: '1.0' })
        );

        expect(success).toBe(false);
      });

      it('returns false for data with non-array presets', () => {
        const { result } = renderHook(() => useGradientPresets());

        const success = result.current.importCustomPresets(
          JSON.stringify({ presets: 'not-array' })
        );

        expect(success).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getAllPresets', () => {
      it('returns combined built-in and custom presets', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Custom Test',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        const allPresets = result.current.getAllPresets();

        expect(allPresets).toHaveLength(mockBuiltInPresets.length + 1);
        expect(allPresets).toContain(preset);
        mockBuiltInPresets.forEach(builtIn => {
          expect(allPresets).toContain(builtIn);
        });
      });
    });

    describe('searchPresets', () => {
      it('searches presets by name (case-insensitive)', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'My Custom Ocean',
          gradient
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        const results = result.current.searchPresets('ocean');

        expect(results).toHaveLength(2); // Built-in 'ocean' + custom 'My Custom Ocean'
        expect(results.some(p => p.name === 'ocean')).toBe(true);
        expect(results.some(p => p.name === 'My Custom Ocean')).toBe(true);
      });

      it('searches presets by description', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Test Gradient',
          gradient,
          'Beautiful ocean colors'
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        const results = result.current.searchPresets('beautiful');

        expect(results).toContain(preset);
      });

      it('searches presets by tags', () => {
        const { result } = renderHook(() => useGradientPresets());
        const gradient: GradientData = {
          type: 'linear',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
        };

        const preset = result.current.createCustomPreset(
          'Tagged Gradient',
          gradient,
          undefined,
          ['custom', 'bright']
        );

        act(() => {
          result.current.saveCustomPreset(preset);
        });

        const results = result.current.searchPresets('bright');

        expect(results).toContain(preset);
      });

      it('returns empty array for no matches', () => {
        const { result } = renderHook(() => useGradientPresets());

        const results = result.current.searchPresets('nonexistent');

        expect(results).toEqual([]);
      });

      it('handles case-insensitive search across all fields', () => {
        const { result } = renderHook(() => useGradientPresets());

        // Test with built-in preset tag search
        const results = result.current.searchPresets('NATURE');

        expect(results.length).toBeGreaterThan(0);
        expect(
          results.every(
            p =>
              p.name.toLowerCase().includes('nature') ||
              p.description?.toLowerCase().includes('nature') ||
              p.tags?.some(tag => tag.toLowerCase().includes('nature'))
          )
        ).toBe(true);
      });
    });
  });

  describe('Memory and Performance', () => {
    it('maintains referential stability for memoized values', () => {
      const { result, rerender } = renderHook(() => useGradientPresets());

      const firstPresets = result.current.presets;
      const firstCategories = result.current.categories;

      rerender();

      const secondPresets = result.current.presets;
      const secondCategories = result.current.categories;

      expect(firstPresets).toBe(secondPresets);
      expect(firstCategories).toBe(secondCategories);
    });

    it('updates localStorage efficiently', () => {
      const { result } = renderHook(() => useGradientPresets());
      const gradient: GradientData = {
        type: 'linear',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
      };

      const preset1 = result.current.createCustomPreset('Test 1', gradient);
      const preset2 = result.current.createCustomPreset('Test 2', gradient);

      act(() => {
        result.current.saveCustomPreset(preset1);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.saveCustomPreset(preset2);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles preset creation with extreme gradient values', () => {
      const { result } = renderHook(() => useGradientPresets());
      const gradient: GradientData = {
        type: 'linear',
        colors: new Array(100).fill('#ff0000'), // Many colors
        stops: new Array(100).fill(0).map((_, i) => i / 99), // Many stops
        angle: 720, // Large angle
      };

      const preset = result.current.createCustomPreset(
        'Extreme Gradient',
        gradient
      );

      expect(preset.colors).toHaveLength(100);
      expect(preset.stops).toHaveLength(100);
      expect(preset.angle).toBe(720);
    });

    it('handles preset names with special characters', () => {
      const { result } = renderHook(() => useGradientPresets());
      const gradient: GradientData = {
        type: 'linear',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
      };

      const specialName = 'Test™ Gradient® with émojis 🌈';
      const preset = result.current.createCustomPreset(specialName, gradient);

      act(() => {
        result.current.saveCustomPreset(preset);
      });

      expect(result.current.customPresets[0].name).toBe(specialName);

      const searchResults = result.current.searchPresets('émojis');
      expect(searchResults).toContain(preset);
    });

    it('handles rapid successive operations', () => {
      const { result } = renderHook(() => useGradientPresets());
      const gradient: GradientData = {
        type: 'linear',
        colors: ['#ff0000', '#0000ff'],
        stops: [0, 1],
      };

      const preset = result.current.createCustomPreset('Rapid Test', gradient);

      act(() => {
        result.current.saveCustomPreset(preset);
        result.current.updateCustomPreset(preset.id, {
          description: 'Updated',
        });
        result.current.updateCustomPreset(preset.id, { name: 'New Name' });
      });

      const finalPreset = result.current.customPresets.find(
        p => p.id === preset.id
      );
      expect(finalPreset?.name).toBe('New Name');
      expect(finalPreset?.description).toBe('Updated');
    });
  });
});
