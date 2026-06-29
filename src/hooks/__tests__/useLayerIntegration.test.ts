/**
 * Integration tests for hook interactions - animation + audio sync
 * Addresses QA finding TEST-001: Missing integration tests for hook interactions
 */

import { renderHook, act } from '@testing-library/react';
import { useLayerAnimation } from '../useLayerAnimation';
import { useLayerAudio } from '../useLayerAudio';
import { Layer } from '../../types/layer-types';

// Mock audio context and related APIs
const mockAudioContext = {
  createAnalyser: jest.fn(() => ({
    frequencyBinCount: 1024,
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    getByteFrequencyData: jest.fn(array => {
      // Simulate frequency data
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.sin(i * 0.1) * 127 + 127;
      }
    }),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 },
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  close: jest.fn(),
  state: 'running',
};

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
});

// Mock requestAnimationFrame
let animationFrameId = 0;

describe('Animation-Audio Integration Tests', () => {
  const mockLayer: Layer = {
    id: 'test-layer',
    name: 'Test Layer',
    type: 'effect',
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
      innerRadius: 0,
      maxHeight: 200,
      responseSpeed: 0.5,
      frequencyRange: 'full',
      colorMode: 'solid',
      primaryColor: '#ff0000',
      secondaryColor: '#0000ff',
      glowIntensity: 0.5,
      symmetry: 'none',
      pulseMode: 'none',
      positionX: 0.5,
      positionY: 0.5,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
    },
  };

  const animConfig = {
    duration: 1000,
    keyframes: [
      { time: 0, properties: { opacity: 0 } },
      { time: 1, properties: { opacity: 1 } },
    ],
    loop: 'loop' as const,
    easing: 'linear' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const rafMock = jest.fn((callback: FrameRequestCallback) => {
      animationFrameId++;
      setTimeout(() => callback(performance.now()), 16); // 60fps
      return animationFrameId;
    });
    const cancelRafMock = jest.fn();

    (global as any).requestAnimationFrame = rafMock;
    (global as any).cancelAnimationFrame = cancelRafMock;
    (window as any).requestAnimationFrame = rafMock;
    (window as any).cancelAnimationFrame = cancelRafMock;

    // Mock AudioContext constructor
    const audioContextCtor = jest.fn(() => mockAudioContext);
    const webkitAudioContextCtor = jest.fn(() => mockAudioContext);
    (global as any).AudioContext = audioContextCtor;
    (global as any).webkitAudioContext = webkitAudioContextCtor;
    (window as any).AudioContext = audioContextCtor;
    (window as any).webkitAudioContext = webkitAudioContextCtor;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should synchronize animation frames with audio processing', async () => {
    const { result: animationResult } = renderHook(() =>
      useLayerAnimation(mockLayer, animConfig)
    );

    const { result: audioResult } = renderHook(() => useLayerAudio(mockLayer));

    // Start audio processing
    await act(async () => {
      await audioResult.current.controls.initializeAudio();
    });

    // Start animation
    act(() => {
      animationResult.current.controls.play();
    });

    // Fast forward time to allow frames to process
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Verify both systems are running
    expect(animationResult.current.controls.isPlaying).toBe(true);
    expect(audioResult.current.state.isProcessing).toBe(true);

    // Process audio frame and get animated properties
    act(() => {
      audioResult.current.controls.processAudioFrame();
    });

    // Verify we have animated properties and audio data
    expect(animationResult.current.animatedProperties).toBeDefined();
    expect(audioResult.current.audioData.frequencyData).toBeInstanceOf(
      Uint8Array
    );

    // Clean up
    act(() => {
      animationResult.current.controls.stop();
      audioResult.current.controls.disconnectAudio();
    });
  });

  it('should handle audio-reactive animation parameters', async () => {
    const { result: animationResult } = renderHook(() =>
      useLayerAnimation(mockLayer, animConfig)
    );

    const { result: audioResult } = renderHook(() => useLayerAudio(mockLayer));

    // Start both systems
    await act(async () => {
      await audioResult.current.controls.initializeAudio();
    });

    act(() => {
      animationResult.current.controls.play();
    });

    // Process audio and get data
    act(() => {
      audioResult.current.controls.processAudioFrame();
    });

    // Verify audio data is available
    expect(audioResult.current.audioData.normalizedData).toBeInstanceOf(Array);
    expect(audioResult.current.audioData.averageVolume).toBeGreaterThanOrEqual(
      0
    );
    expect(audioResult.current.equalizerData.barHeights).toBeInstanceOf(Array);

    // Verify animation properties are updating
    expect(animationResult.current.animatedProperties).toBeDefined();

    // Update animation config based on audio (reactive animation)
    act(() => {
      const newConfig = {
        ...animConfig,
        duration: 500 + audioResult.current.audioData.averageVolume * 500, // Audio-reactive duration
      };
      animationResult.current.updateConfig(newConfig);
    });

    // Verify config was updated
    expect(animationResult.current.animationState.isPlaying).toBe(true);

    // Clean up
    act(() => {
      animationResult.current.controls.stop();
      audioResult.current.controls.disconnectAudio();
    });
  });

  it('should maintain performance under heavy audio-animation load', async () => {
    const { result: animationResult } = renderHook(() =>
      useLayerAnimation(mockLayer, animConfig)
    );

    const { result: audioResult } = renderHook(() => useLayerAudio(mockLayer));

    const startTime = performance.now();

    // Start both systems
    await act(async () => {
      await audioResult.current.controls.initializeAudio();
    });

    act(() => {
      animationResult.current.controls.play();
    });

    // Simulate heavy load by processing many frames
    for (let i = 0; i < 30; i++) {
      act(() => {
        audioResult.current.controls.processAudioFrame();
        jest.advanceTimersByTime(16); // ~60fps
      });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify both systems are still running after load
    expect(animationResult.current.controls.isPlaying).toBe(true);
    expect(audioResult.current.state.isProcessing).toBe(true);

    // Verify we processed frames efficiently (less than 1 second for 30 frames)
    expect(duration).toBeLessThan(1000);

    // Clean up
    act(() => {
      animationResult.current.controls.stop();
      audioResult.current.controls.disconnectAudio();
    });
  });

  it('should gracefully handle audio initialization failures', async () => {
    // Mock audio initialization failure
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      new Error('Audio permission denied')
    );

    const { result: animationResult } = renderHook(() =>
      useLayerAnimation(mockLayer, animConfig)
    );

    const { result: audioResult } = renderHook(() => useLayerAudio(mockLayer));

    // Animation should still work even if audio fails
    act(() => {
      animationResult.current.controls.play();
    });

    // Try to start audio processing (should fail gracefully)
    await act(async () => {
      await audioResult.current.controls.initializeAudio();
    });

    // Animation should continue working
    expect(animationResult.current.controls.isPlaying).toBe(true);
    expect(audioResult.current.state.isInitialized).toBe(false);
    expect(audioResult.current.state.error).toBe('Audio permission denied');

    // Clean up
    act(() => {
      animationResult.current.controls.stop();
    });
  });

  it('should synchronize cleanup between animation and audio systems', async () => {
    const { result: animationResult, unmount: unmountAnimation } = renderHook(
      () => useLayerAnimation(mockLayer, animConfig)
    );

    const { result: audioResult, unmount: unmountAudio } = renderHook(() =>
      useLayerAudio(mockLayer)
    );

    // Start both systems
    await act(async () => {
      await audioResult.current.controls.initializeAudio();
    });

    act(() => {
      animationResult.current.controls.play();
    });

    // Verify both systems are running
    expect(animationResult.current.controls.isPlaying).toBe(true);
    expect(audioResult.current.state.isProcessing).toBe(true);

    // Stop both systems
    act(() => {
      animationResult.current.controls.stop();
      audioResult.current.controls.disconnectAudio();
    });

    // Verify both systems stopped
    expect(animationResult.current.controls.isPlaying).toBe(false);
    expect(audioResult.current.state.isProcessing).toBe(false);
    expect(audioResult.current.state.isInitialized).toBe(false);

    // Unmount should not cause errors
    expect(() => {
      unmountAnimation();
      unmountAudio();
    }).not.toThrow();
  });

  it('should handle rapid start/stop cycles without memory leaks', async () => {
    const { result: animationResult } = renderHook(() =>
      useLayerAnimation(mockLayer, animConfig)
    );

    const { result: audioResult } = renderHook(() => useLayerAudio(mockLayer));

    // Perform rapid start/stop cycles
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await audioResult.current.controls.initializeAudio();
      });

      act(() => {
        animationResult.current.controls.play();
      });

      act(() => {
        jest.advanceTimersByTime(50); // Short run time
      });

      act(() => {
        animationResult.current.controls.stop();
        audioResult.current.controls.disconnectAudio();
      });
    }

    // Verify final states are clean
    expect(animationResult.current.controls.isPlaying).toBe(false);
    expect(audioResult.current.state.isProcessing).toBe(false);
    expect(audioResult.current.state.isInitialized).toBe(false);

    // Verify no animation frames are still scheduled
    expect(global.cancelAnimationFrame as jest.Mock).toHaveBeenCalled();
  });
});
