import { useState, useCallback, useRef, useEffect } from 'react';
import { Layer } from '../types/layer-types';
import {
  interpolateKeyframes,
  AnimationKeyframe,
} from '../utils/layer-transforms';

/**
 * Animation configuration interface
 */
export interface LayerAnimationConfig {
  /** Animation duration in milliseconds */
  duration: number;
  /** Animation keyframes defining property changes over time */
  keyframes: AnimationKeyframe[];
  /** Animation loop mode */
  loop: 'none' | 'loop' | 'bounce';
  /** Animation easing function */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** Auto-start animation on mount */
  autoStart?: boolean;
}

/**
 * Animation state interface
 */
export interface AnimationState {
  /** Whether animation is currently playing */
  isPlaying: boolean;
  /** Current animation progress (0-1) */
  progress: number;
  /** Current animation time in milliseconds */
  currentTime: number;
  /** Animation start timestamp */
  startTime: number | null;
  /** Current loop iteration */
  loopCount: number;
}

/**
 * Animation control interface
 */
export interface AnimationControls {
  /** Start or resume animation */
  play: () => void;
  /** Pause animation */
  pause: () => void;
  /** Stop animation and reset to beginning */
  stop: () => void;
  /** Seek to specific time (0-1) */
  seek: (progress: number) => void;
  /** Get current animated layer properties */
  getCurrentProperties: () => Partial<Layer>;
  /** Check if animation is playing */
  isPlaying: boolean;
  /** Current animation state */
  state: AnimationState;
}

/**
 * Hook return interface
 */
export interface UseLayerAnimationReturn {
  /** Animation control functions */
  controls: AnimationControls;
  /** Current animated properties to apply to layer */
  animatedProperties: Partial<Layer>;
  /** Animation state information */
  animationState: AnimationState;
  /** Update animation configuration */
  updateConfig: (config: Partial<LayerAnimationConfig>) => void;
}

/**
 * Custom hook for managing layer animations
 * Extracts animation logic from LayerItem component to provide:
 * - Keyframe-based animation system
 * - Smooth 60fps animation timing
 * - Multiple loop modes and easing functions
 * - Precise animation control (play/pause/stop/seek)
 *
 * @param layer - The layer to animate
 * @param config - Animation configuration
 * @returns Animation controls and current animated properties
 */
export const useLayerAnimation = (
  _layer: Layer,
  config: LayerAnimationConfig
): UseLayerAnimationReturn => {
  const scheduleAnimationFrame = useCallback(
    (callback: FrameRequestCallback): number => {
      if (typeof globalThis.requestAnimationFrame === 'function') {
        return globalThis.requestAnimationFrame(callback);
      }
      return window.setTimeout(
        () => callback(performance.now()),
        16
      ) as unknown as number;
    },
    []
  );

  const cancelScheduledAnimationFrame = useCallback((id: number) => {
    if (typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(id);
      return;
    }
    window.clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  }, []);

  // Animation state
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    startTime: null,
    loopCount: 0,
  });

  // Current animated properties
  const [animatedProperties, setAnimatedProperties] = useState<Partial<Layer>>(
    {}
  );

  // Animation configuration
  const [animConfig, setAnimConfig] = useState<LayerAnimationConfig>(config);

  // Animation frame reference
  const animationFrameRef = useRef<number>();

  /**
   * Updates animation frame and calculates new properties
   */
  const updateAnimationFrame = useCallback(
    (timestamp: number) => {
      setAnimationState(prevState => {
        if (!prevState.isPlaying || !prevState.startTime) {
          return prevState;
        }

        const elapsed = timestamp - prevState.startTime;
        let progress = elapsed / animConfig.duration;

        // Handle loop modes
        let newLoopCount = prevState.loopCount;
        if (progress >= 1) {
          switch (animConfig.loop) {
            case 'loop':
              progress = progress % 1;
              newLoopCount = Math.floor(elapsed / animConfig.duration);
              break;
            case 'bounce':
              const cycle = Math.floor(progress);
              progress = progress % 1;
              if (cycle % 2 === 1) {
                progress = 1 - progress; // Reverse direction on odd cycles
              }
              newLoopCount = Math.floor(elapsed / (animConfig.duration * 2));
              break;
            case 'none':
            default:
              progress = 1;
              return {
                ...prevState,
                isPlaying: false,
                progress,
                currentTime: animConfig.duration,
                loopCount: newLoopCount,
              };
          }
        }

        return {
          ...prevState,
          progress,
          currentTime: elapsed,
          loopCount: newLoopCount,
        };
      });

      // Continue animation if still playing
      if (animationState.isPlaying) {
        animationFrameRef.current = scheduleAnimationFrame(updateAnimationFrame);
      }
    },
    [
      animConfig.duration,
      animConfig.loop,
      animationState.isPlaying,
      scheduleAnimationFrame,
    ]
  );

  /**
   * Start or resume animation
   */
  const play = useCallback(() => {
    const now = performance.now();
    setAnimationState(prevState => ({
      ...prevState,
      isPlaying: true,
      startTime: prevState.startTime
        ? now - prevState.currentTime // Resume from current position
        : now, // Start from beginning
    }));
  }, []);

  /**
   * Pause animation
   */
  const pause = useCallback(() => {
    if (animationFrameRef.current) {
      cancelScheduledAnimationFrame(animationFrameRef.current);
    }
    setAnimationState(prevState => ({
      ...prevState,
      isPlaying: false,
    }));
  }, [cancelScheduledAnimationFrame]);

  /**
   * Stop animation and reset to beginning
   */
  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelScheduledAnimationFrame(animationFrameRef.current);
    }
    setAnimationState({
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      startTime: null,
      loopCount: 0,
    });
  }, [cancelScheduledAnimationFrame]);

  /**
   * Seek to specific time in animation
   */
  const seek = useCallback(
    (progress: number) => {
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const newTime = clampedProgress * animConfig.duration;

      setAnimationState(prevState => ({
        ...prevState,
        progress: clampedProgress,
        currentTime: newTime,
        startTime: prevState.isPlaying ? performance.now() - newTime : null,
      }));
    },
    [animConfig.duration]
  );

  /**
   * Get current animated properties
   */
  const getCurrentProperties = useCallback((): Partial<Layer> => {
    if (animConfig.keyframes.length === 0) {
      return {};
    }

    return interpolateKeyframes(animConfig.keyframes, animationState.progress);
  }, [animConfig.keyframes, animationState.progress]);

  /**
   * Update animation configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<LayerAnimationConfig>) => {
      setAnimConfig(prev => ({ ...prev, ...newConfig }));
    },
    []
  );

  // Update animated properties when animation state changes
  useEffect(() => {
    const newProperties = getCurrentProperties();
    setAnimatedProperties(newProperties);
  }, [getCurrentProperties]);

  // Start animation frame loop when playing
  useEffect(() => {
    if (animationState.isPlaying && !animationFrameRef.current) {
      animationFrameRef.current = scheduleAnimationFrame(updateAnimationFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelScheduledAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [
    animationState.isPlaying,
    updateAnimationFrame,
    scheduleAnimationFrame,
    cancelScheduledAnimationFrame,
  ]);

  // Auto-start animation if configured
  useEffect(() => {
    if (
      animConfig.autoStart &&
      !animationState.isPlaying &&
      animationState.currentTime === 0
    ) {
      play();
    }
  }, [
    animConfig.autoStart,
    animationState.isPlaying,
    animationState.currentTime,
    play,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelScheduledAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cancelScheduledAnimationFrame]);

  const controls: AnimationControls = {
    play,
    pause,
    stop,
    seek,
    getCurrentProperties,
    isPlaying: animationState.isPlaying,
    state: animationState,
  };

  return {
    controls,
    animatedProperties,
    animationState,
    updateConfig,
  };
};

/**
 * Utility function to create common animation presets
 */
export const createAnimationPresets = {
  /**
   * Creates a simple fade in/out animation
   */
  fade: (
    duration: number = 2000,
    loop: LayerAnimationConfig['loop'] = 'none'
  ): LayerAnimationConfig => ({
    duration,
    loop,
    easing: 'ease-in-out',
    keyframes: [
      { time: 0, opacity: 0 },
      { time: 1, opacity: 1 },
    ],
  }),

  /**
   * Creates a rotation animation
   */
  rotate: (
    duration: number = 4000,
    loop: LayerAnimationConfig['loop'] = 'loop'
  ): LayerAnimationConfig => ({
    duration,
    loop,
    easing: 'linear',
    keyframes: [
      { time: 0, rotation: 0 },
      { time: 1, rotation: 360 },
    ],
  }),

  /**
   * Creates a pulsing scale animation
   */
  pulse: (
    duration: number = 1500,
    loop: LayerAnimationConfig['loop'] = 'bounce'
  ): LayerAnimationConfig => ({
    duration,
    loop,
    easing: 'ease-in-out',
    keyframes: [
      { time: 0, scale: 1, opacity: 1 },
      { time: 0.5, scale: 1.1, opacity: 0.8 },
      { time: 1, scale: 1, opacity: 1 },
    ],
  }),

  /**
   * Creates a floating motion animation
   */
  float: (
    duration: number = 3000,
    amplitude: number = 20
  ): LayerAnimationConfig => ({
    duration,
    loop: 'bounce',
    easing: 'ease-in-out',
    keyframes: [
      { time: 0, offsetY: 0 },
      { time: 1, offsetY: -amplitude },
    ],
  }),

  /**
   * Creates a complex animation with multiple properties
   */
  complex: (duration: number = 5000): LayerAnimationConfig => ({
    duration,
    loop: 'loop',
    easing: 'ease-in-out',
    keyframes: [
      { time: 0, scale: 1, rotation: 0, opacity: 1 },
      { time: 0.25, scale: 1.2, rotation: 90, opacity: 0.8 },
      { time: 0.5, scale: 0.8, rotation: 180, opacity: 1 },
      { time: 0.75, scale: 1.1, rotation: 270, opacity: 0.9 },
      { time: 1, scale: 1, rotation: 360, opacity: 1 },
    ],
  }),
};

export default useLayerAnimation;
