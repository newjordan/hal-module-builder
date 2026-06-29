/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useTemplates } from '../useTemplates';
import { Layer } from '../../types/layer-types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the template utilities
jest.mock('../../utils/templates/templateStorage', () => ({
  loadPresets: jest.fn(() => []),
  savePresets: jest.fn(() => ({ success: true })),
  createRecoveryPoint: jest.fn(),
  getStorageStats: jest.fn(() => ({
    used: 0,
    available: 1000000,
    presetCount: 0,
  })),
}));

jest.mock('../../utils/templates/templateValidation', () => ({
  validatePresetName: jest.fn(() => null),
  validateImportedPreset: jest.fn(() => ({ isValid: true, preset: null })),
}));

jest.mock('../../utils/templates/templateSerialization', () => ({
  exportPresetToFile: jest.fn(),
  importPresetFromFile: jest.fn(),
  clonePreset: jest.fn(preset => ({ ...preset })),
}));

describe('useTemplates', () => {
  const mockLayers: Layer[] = [
    {
      id: 'test-layer',
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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useTemplates());

    expect(result.current.presets).toEqual([]);
    expect(result.current.presetName).toBe('');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('provides preset management functions', () => {
    const { result } = renderHook(() => useTemplates());

    expect(typeof result.current.setPresetName).toBe('function');
    expect(typeof result.current.savePreset).toBe('function');
    expect(typeof result.current.loadPreset).toBe('function');
    expect(typeof result.current.deletePreset).toBe('function');
    expect(typeof result.current.exportPreset).toBe('function');
    expect(typeof result.current.importPreset).toBe('function');
  });

  it('handles save preset', async () => {
    const { result } = renderHook(() => useTemplates());

    await act(async () => {
      const success = await result.current.savePreset(
        mockLayers,
        'Test Preset'
      );
      expect(success).toBe(true);
    });
  });

  it('handles load preset', () => {
    const mockPreset = {
      id: '1',
      name: 'Test Preset',
      timestamp: Date.now(),
      layers: mockLayers,
    };

    const { result } = renderHook(() => useTemplates());

    act(() => {
      const layers = result.current.loadPreset(mockPreset);
      expect(layers).toEqual(mockLayers);
    });
  });

  it('handles delete preset', async () => {
    // Mock loadPresets to return a preset that can be deleted
    const { loadPresets } = require('../../utils/templates/templateStorage');
    const mockPresetToDelete = {
      id: 'test-id',
      name: 'Test Preset to Delete',
      timestamp: Date.now(),
      layers: mockLayers,
    };
    loadPresets.mockReturnValue([mockPresetToDelete]);

    const { result } = renderHook(() => useTemplates());

    await act(async () => {
      const success = await result.current.deletePreset('test-id');
      expect(success).toBe(true);
    });
  });

  it('validates preset names', () => {
    const { result } = renderHook(() => useTemplates());

    act(() => {
      const error = result.current.validateName('Test Name');
      expect(error).toBe(null);
    });
  });

  it('checks if preset name exists', () => {
    const mockPresets = [
      {
        id: '1',
        name: 'Existing Preset',
        timestamp: Date.now(),
        layers: mockLayers,
      },
    ];

    const { loadPresets } = require('../../utils/templates/templateStorage');
    loadPresets.mockReturnValue(mockPresets);

    const { result } = renderHook(() => useTemplates());

    act(() => {
      expect(result.current.presetNameExists('Existing Preset')).toBe(true);
      expect(result.current.presetNameExists('New Preset')).toBe(false);
    });
  });

  it('provides storage stats', () => {
    const { result } = renderHook(() => useTemplates());

    expect(result.current.storageStats).toEqual({
      used: 0,
      available: 1000000,
      presetCount: 0,
    });
  });

  it('handles custom configuration', () => {
    // Clear the mock to ensure empty presets for this test
    const { loadPresets } = require('../../utils/templates/templateStorage');
    loadPresets.mockReturnValueOnce([]);

    const config = {
      autoSave: true,
      autoSaveDelay: 5000,
      maxPresets: 50,
    };

    const { result } = renderHook(() => useTemplates(config));

    expect(result.current.presets).toEqual([]);
  });

  it('handles errors gracefully', async () => {
    const { savePresets } = require('../../utils/templates/templateStorage');
    savePresets.mockReturnValue({ success: false, error: 'Storage error' });

    const onError = jest.fn();
    const { result } = renderHook(() => useTemplates({ onError }));

    await act(async () => {
      const success = await result.current.savePreset(
        mockLayers,
        'Test Preset'
      );
      expect(success).toBe(false);
    });

    expect(onError).toHaveBeenCalled();
  });
});
