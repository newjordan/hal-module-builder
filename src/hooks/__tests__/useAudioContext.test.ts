/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useAudioContext } from '../useAudioContext';
import { Layer } from '../../types/layer-types';

// Mock the AudioContext
const mockAnalyser = {
  fftSize: 128,
  frequencyBinCount: 64,
  connect: jest.fn(),
  getByteFrequencyData: jest.fn(),
};

const mockSource = {
  connect: jest.fn(),
  disconnect: jest.fn(),
};

const mockAudioContext = {
  createMediaStreamSource: jest.fn(() => mockSource),
  createAnalyser: jest.fn(() => mockAnalyser),
  suspend: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  state: 'suspended',
};

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
});

// Mock AudioContext
(global as any).AudioContext = jest.fn(() => mockAudioContext);
(global as any).webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

describe('useAudioContext', () => {
  const mockLayers: Layer[] = [
    {
      id: 'equalizer',
      name: 'Audio Equalizer',
      type: 'effect',
      visible: true,
      opacity: 1,
      blendMode: 'screen',
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      equalizerSettings: {
        barCount: 48,
        barStyle: 'line',
        barWidth: 2,
        barSpacing: 1,
        barRotation: 0,
        innerRadius: 140,
        maxHeight: 40,
        responseSpeed: 0.8,
        frequencyRange: 'full',
        colorMode: 'gradient',
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0.5,
        glowColor: '#dc2626',
        symmetry: 'none',
        pulseMode: 'subtle',
        positionX: 0,
        positionY: 0,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAudioContext(mockLayers));

    expect(result.current.audioData).toEqual(new Array(64).fill(0));
    expect(result.current.audioContextState).toBe('suspended');
    expect(result.current.isActive).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('provides audio control functions', () => {
    const { result } = renderHook(() => useAudioContext(mockLayers));

    expect(typeof result.current.startAudio).toBe('function');
    expect(typeof result.current.stopAudio).toBe('function');
    expect(typeof result.current.toggleAudio).toBe('function');
  });

  it('handles start audio', async () => {
    const { result } = renderHook(() => useAudioContext(mockLayers));

    await act(async () => {
      await result.current.startAudio();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    });
    expect(result.current.isActive).toBe(true);
  });

  it('handles start audio failure', async () => {
    const mockError = new Error('Microphone access denied');
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      mockError
    );

    const { result } = renderHook(() => useAudioContext(mockLayers));

    await act(async () => {
      await result.current.startAudio();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('handles toggle audio', async () => {
    const { result } = renderHook(() => useAudioContext(mockLayers));

    // Initially inactive
    expect(result.current.isActive).toBe(false);

    // Toggle to active
    await act(async () => {
      await result.current.toggleAudio();
    });

    expect(result.current.isActive).toBe(true);

    // Toggle back to inactive
    await act(async () => {
      await result.current.toggleAudio();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('accepts custom configuration', () => {
    const config = {
      fftSize: 256,
      defaultResponseSpeed: 0.9,
      autoCleanup: false,
    };

    const { result } = renderHook(() => useAudioContext(mockLayers, config));

    expect(result.current.audioData).toEqual(new Array(128).fill(0)); // fftSize / 2
  });

  it('detects Web Audio API support', () => {
    const { result } = renderHook(() => useAudioContext(mockLayers));
    expect(result.current.isSupported).toBe(true);

    // Test when AudioContext is not available
    const originalAudioContext = (global as any).AudioContext;
    const originalWebkitAudioContext = (global as any).webkitAudioContext;

    delete (global as any).AudioContext;
    delete (global as any).webkitAudioContext;

    const { result: resultUnsupported } = renderHook(() =>
      useAudioContext(mockLayers)
    );
    expect(resultUnsupported.current.isSupported).toBe(false);

    // Restore
    (global as any).AudioContext = originalAudioContext;
    (global as any).webkitAudioContext = originalWebkitAudioContext;
  });
});
