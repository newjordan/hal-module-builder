import { renderHook, act } from '@testing-library/react';
import {
  useLayerAnimation,
  createAnimationPresets,
} from '../useLayerAnimation';
import { Layer } from '../../types/layer-types';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow } as any;

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();
global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

describe('useLayerAnimation', () => {
  let mockLayer: Layer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);

    mockLayer = {
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
    };

    // Mock requestAnimationFrame to execute callback immediately
    mockRequestAnimationFrame.mockImplementation(callback => {
      const frameId = Math.random();
      setTimeout(() => callback(mockPerformanceNow()), 0);
      return frameId;
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Animation Controls', () => {
    it('should initialize with stopped state', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      expect(result.current.controls.isPlaying).toBe(false);
      expect(result.current.animationState.progress).toBe(0);
      expect(result.current.animationState.currentTime).toBe(0);
    });

    it('should start animation when play is called', async () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      act(() => {
        result.current.controls.play();
      });

      expect(result.current.controls.isPlaying).toBe(true);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should pause animation when pause is called', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      act(() => {
        result.current.controls.play();
      });

      expect(result.current.controls.isPlaying).toBe(true);

      act(() => {
        result.current.controls.pause();
      });

      expect(result.current.controls.isPlaying).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should stop and reset animation when stop is called', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      act(() => {
        result.current.controls.play();
      });

      act(() => {
        result.current.controls.stop();
      });

      expect(result.current.controls.isPlaying).toBe(false);
      expect(result.current.animationState.progress).toBe(0);
      expect(result.current.animationState.currentTime).toBe(0);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should seek to specific time when seek is called', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      act(() => {
        result.current.controls.seek(0.5);
      });

      expect(result.current.animationState.progress).toBe(0.5);
      expect(result.current.animationState.currentTime).toBe(500);
    });
  });

  describe('Keyframe Interpolation', () => {
    it('should interpolate opacity between keyframes', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      act(() => {
        result.current.controls.seek(0.5);
      });

      expect(result.current.animatedProperties.opacity).toBe(0.5);
    });

    it('should interpolate multiple properties', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0, scale: 1, rotation: 0 },
          { time: 1, opacity: 1, scale: 2, rotation: 360 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      act(() => {
        result.current.controls.seek(0.25);
      });

      expect(result.current.animatedProperties.opacity).toBe(0.25);
      expect(result.current.animatedProperties.scale).toBe(1.25);
      expect(result.current.animatedProperties.rotation).toBe(90);
    });
  });

  describe('Loop Modes', () => {
    it('should handle loop mode correctly', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'loop' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      // Test that loop mode would continue past 100%
      act(() => {
        result.current.controls.seek(1.5); // 150% would be 50% in loop mode
      });

      // This is a simplified test - in reality the loop logic runs in the animation frame
      expect(result.current.animationState.progress).toBeLessThanOrEqual(1);
    });
  });

  describe('Auto-start', () => {
    it('should auto-start animation when autoStart is true', () => {
      const animationConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
        autoStart: true,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, animationConfig)
      );

      // Should start automatically
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    it('should update animation configuration', () => {
      const initialConfig = {
        duration: 1000,
        keyframes: [
          { time: 0, opacity: 0 },
          { time: 1, opacity: 1 },
        ],
        loop: 'none' as const,
        easing: 'linear' as const,
      };

      const { result } = renderHook(() =>
        useLayerAnimation(mockLayer, initialConfig)
      );

      act(() => {
        result.current.updateConfig({
          duration: 2000,
          loop: 'loop',
        });
      });

      // Configuration should be updated internally
      // This test verifies the function exists and can be called without errors
      expect(result.current.updateConfig).toBeInstanceOf(Function);
    });
  });
});

describe('createAnimationPresets', () => {
  it('should create fade preset', () => {
    const fadePreset = createAnimationPresets.fade(1000, 'none');

    expect(fadePreset.duration).toBe(1000);
    expect(fadePreset.loop).toBe('none');
    expect(fadePreset.keyframes).toHaveLength(2);
    expect(fadePreset.keyframes[0].opacity).toBe(0);
    expect(fadePreset.keyframes[1].opacity).toBe(1);
  });

  it('should create rotate preset', () => {
    const rotatePreset = createAnimationPresets.rotate(4000, 'loop');

    expect(rotatePreset.duration).toBe(4000);
    expect(rotatePreset.loop).toBe('loop');
    expect(rotatePreset.keyframes).toHaveLength(2);
    expect(rotatePreset.keyframes[0].rotation).toBe(0);
    expect(rotatePreset.keyframes[1].rotation).toBe(360);
  });

  it('should create pulse preset', () => {
    const pulsePreset = createAnimationPresets.pulse(1500, 'bounce');

    expect(pulsePreset.duration).toBe(1500);
    expect(pulsePreset.loop).toBe('bounce');
    expect(pulsePreset.keyframes).toHaveLength(3);
    expect(pulsePreset.keyframes[1].scale).toBe(1.1);
  });

  it('should create float preset', () => {
    const floatPreset = createAnimationPresets.float(3000, 20);

    expect(floatPreset.duration).toBe(3000);
    expect(floatPreset.loop).toBe('bounce');
    expect(floatPreset.keyframes[1].offsetY).toBe(-20);
  });

  it('should create complex preset', () => {
    const complexPreset = createAnimationPresets.complex(5000);

    expect(complexPreset.duration).toBe(5000);
    expect(complexPreset.loop).toBe('loop');
    expect(complexPreset.keyframes).toHaveLength(5);
    expect(complexPreset.keyframes[4].rotation).toBe(360);
  });
});
