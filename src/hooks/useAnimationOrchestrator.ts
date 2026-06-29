import { useCallback, useRef, useState, useEffect } from 'react';
import { useAnimationCoordinator } from './useAnimationCoordinator';
import { Layer } from '../types/layer-types';

/**
 * Animation sequence definition for orchestrating multi-layer animations
 */
export interface AnimationSequence {
  id: string;
  name: string;
  description?: string;
  duration: number;
  layers: Layer[];
  sequences: AnimationStep[];
  loop?: boolean;
  autoplay?: boolean;
}

/**
 * Individual animation step within a sequence
 */
export interface AnimationStep {
  id: string;
  layerId: string;
  startTime: number;
  duration: number;
  property: keyof Layer;
  fromValue: any;
  toValue: any;
  easing?:
    | 'linear'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'bounce'
    | 'elastic';
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
}

/**
 * Orchestration state for tracking playback
 */
export interface OrchestrationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  progress: number;
  activeSteps: string[];
  completedSteps: string[];
  loop: boolean;
}

/**
 * Easing functions for animation interpolation
 */
const easingFunctions = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Interpolate between two values based on progress and type
 */
const interpolateValue = (
  from: any,
  to: any,
  progress: number,
  easing: keyof typeof easingFunctions = 'linear'
): any => {
  const easedProgress = easingFunctions[easing](progress);

  // Handle different value types
  if (typeof from === 'number' && typeof to === 'number') {
    return from + (to - from) * easedProgress;
  }

  if (typeof from === 'string' && typeof to === 'string') {
    // Handle color interpolation
    if (from.startsWith('#') && to.startsWith('#')) {
      const fromRgb = hexToRgb(from);
      const toRgb = hexToRgb(to);

      if (fromRgb && toRgb) {
        const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * easedProgress);
        const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * easedProgress);
        const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * easedProgress);
        return rgbToHex(r, g, b);
      }
    }
  }

  // Handle boolean values
  if (typeof from === 'boolean' && typeof to === 'boolean') {
    return easedProgress > 0.5 ? to : from;
  }

  // Handle object values (like gradients)
  if (
    typeof from === 'object' &&
    typeof to === 'object' &&
    from !== null &&
    to !== null
  ) {
    const result: any = {};

    // Interpolate numeric properties within objects
    for (const key in from) {
      if (
        key in to &&
        typeof from[key] === 'number' &&
        typeof to[key] === 'number'
      ) {
        result[key] = from[key] + (to[key] - from[key]) * easedProgress;
      } else {
        result[key] = easedProgress > 0.5 ? to[key] : from[key];
      }
    }

    return result;
  }

  // Default: switch at midpoint
  return easedProgress > 0.5 ? to : from;
};

/**
 * Helper functions for color conversion
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * Animation orchestrator hook for managing complex multi-layer sequences
 * Single Responsibility: Coordinate and execute animation sequences across multiple layers
 *
 * Features:
 * - Multi-layer animation coordination
 * - Timeline-based step execution
 * - Advanced easing functions
 * - Sequence looping and repetition
 * - Real-time property interpolation
 * - Performance-aware execution
 */
export const useAnimationOrchestrator = () => {
  const animationCoordinator = useAnimationCoordinator();

  // State management
  const [sequences, setSequences] = useState<Map<string, AnimationSequence>>(
    new Map()
  );
  const [orchestrationStates, setOrchestrationStates] = useState<
    Map<string, OrchestrationState>
  >(new Map());

  // Animation tracking
  const animationRefs = useRef<Map<string, number>>(new Map());
  const layerStates = useRef<Map<string, Partial<Layer>>>(new Map());
  const onLayerUpdateCallbacks = useRef<
    Map<string, (layerId: string, updates: Partial<Layer>) => void>
  >(new Map());

  /**
   * Register a layer update callback
   */
  const registerLayerUpdateCallback = useCallback(
    (
      sequenceId: string,
      callback: (layerId: string, updates: Partial<Layer>) => void
    ) => {
      onLayerUpdateCallbacks.current.set(sequenceId, callback);

      return () => {
        onLayerUpdateCallbacks.current.delete(sequenceId);
      };
    },
    []
  );

  /**
   * Get current state of orchestration
   */
  const getOrchestrationState = useCallback(
    (sequenceId: string): OrchestrationState | undefined => {
      return orchestrationStates.get(sequenceId);
    },
    [orchestrationStates]
  );

  /**
   * Load an animation sequence
   */
  const loadSequence = useCallback(
    (sequence: AnimationSequence) => {
      sequences.set(sequence.id, sequence);
      setSequences(new Map(sequences));

      // Initialize orchestration state
      const initialState: OrchestrationState = {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        progress: 0,
        activeSteps: [],
        completedSteps: [],
        loop: sequence.loop || false,
      };

      orchestrationStates.set(sequence.id, initialState);
      setOrchestrationStates(new Map(orchestrationStates));

      // Auto-play if specified
      if (sequence.autoplay) {
        setTimeout(() => playSequence(sequence.id), 100);
      }
    },
    [sequences, orchestrationStates]
  );

  /**
   * Update animation step progress and apply changes to layers
   */
  const updateAnimationStep = useCallback(
    (sequence: AnimationSequence, step: AnimationStep, progress: number) => {
      const layer = sequence.layers.find(l => l.id === step.layerId);
      if (!layer) return;

      // Calculate current value
      const currentValue = interpolateValue(
        step.fromValue,
        step.toValue,
        progress,
        step.easing
      );

      // Create layer update
      const layerUpdate: Partial<Layer> = {
        [step.property]: currentValue,
      };

      // Store current state
      const currentState = layerStates.current.get(step.layerId) || {};
      layerStates.current.set(step.layerId, {
        ...currentState,
        ...layerUpdate,
      });

      // Notify callback
      const callback = onLayerUpdateCallbacks.current.get(sequence.id);
      if (callback) {
        callback(step.layerId, layerUpdate);
      }
    },
    []
  );

  /**
   * Main animation loop for sequence execution
   */
  const animateSequence = useCallback(
    (sequenceId: string) => {
      const sequence = sequences.get(sequenceId);
      const state = orchestrationStates.get(sequenceId);

      if (!sequence || !state || !state.isPlaying) return;

      return (_timestamp: number) => {
        const currentTime = state.currentTime;
        const progress = currentTime / sequence.duration;

        // Check which steps should be active at current time
        const activeSteps: string[] = [];
        const completedSteps: string[] = [];

        sequence.sequences.forEach(step => {
          const stepStartTime = step.startTime + (step.delay || 0);
          const stepEndTime = stepStartTime + step.duration;

          if (currentTime >= stepStartTime && currentTime <= stepEndTime) {
            activeSteps.push(step.id);

            // Calculate step progress
            const stepProgress = Math.min(
              1,
              Math.max(0, (currentTime - stepStartTime) / step.duration)
            );

            // Handle yoyo effect
            let finalProgress = stepProgress;
            if (step.yoyo && step.repeat) {
              const cycle = Math.floor(stepProgress * (step.repeat + 1));
              const cycleProgress = (stepProgress * (step.repeat + 1)) % 1;
              finalProgress =
                cycle % 2 === 0 ? cycleProgress : 1 - cycleProgress;
            }

            updateAnimationStep(sequence, step, finalProgress);
          } else if (currentTime > stepEndTime) {
            completedSteps.push(step.id);
          }
        });

        // Update orchestration state
        const newState: OrchestrationState = {
          ...state,
          currentTime: currentTime + 16.67, // ~60fps increment
          progress,
          activeSteps,
          completedSteps,
        };

        orchestrationStates.set(sequenceId, newState);
        setOrchestrationStates(new Map(orchestrationStates));

        // Check if sequence is complete
        if (currentTime >= sequence.duration) {
          if (state.loop) {
            // Reset for loop
            newState.currentTime = 0;
            newState.progress = 0;
            newState.activeSteps = [];
            newState.completedSteps = [];
          } else {
            // Stop sequence
            pauseSequence(sequenceId);
            return;
          }
        }
      };
    },
    [sequences, orchestrationStates, updateAnimationStep]
  );

  /**
   * Play an animation sequence
   */
  const playSequence = useCallback(
    (sequenceId: string) => {
      const sequence = sequences.get(sequenceId);
      if (!sequence) return;

      const state = orchestrationStates.get(sequenceId);
      if (!state) return;

      // Update state to playing
      const newState: OrchestrationState = {
        ...state,
        isPlaying: true,
        isPaused: false,
      };

      orchestrationStates.set(sequenceId, newState);
      setOrchestrationStates(new Map(orchestrationStates));

      // Register animation with coordinator
      const animCallback = animateSequence(sequenceId);
      if (!animCallback) return;
      const cleanup = animationCoordinator.registerAnimation(
        `sequence-${sequenceId}`,
        animCallback,
        8 // High priority for orchestration
      );

      animationRefs.current.set(sequenceId, cleanup as any);
    },
    [sequences, orchestrationStates, animationCoordinator, animateSequence]
  );

  /**
   * Pause an animation sequence
   */
  const pauseSequence = useCallback(
    (sequenceId: string) => {
      const state = orchestrationStates.get(sequenceId);
      if (!state) return;

      // Update state
      const newState: OrchestrationState = {
        ...state,
        isPlaying: false,
        isPaused: true,
      };

      orchestrationStates.set(sequenceId, newState);
      setOrchestrationStates(new Map(orchestrationStates));

      // Unregister animation
      const cleanup = animationRefs.current.get(sequenceId);
      if (cleanup) {
        animationCoordinator.unregisterAnimation(`sequence-${sequenceId}`);
        animationRefs.current.delete(sequenceId);
      }
    },
    [orchestrationStates, animationCoordinator]
  );

  /**
   * Stop and reset an animation sequence
   */
  const stopSequence = useCallback(
    (sequenceId: string) => {
      pauseSequence(sequenceId);

      const state = orchestrationStates.get(sequenceId);
      if (!state) return;

      // Reset state
      const resetState: OrchestrationState = {
        ...state,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        progress: 0,
        activeSteps: [],
        completedSteps: [],
      };

      orchestrationStates.set(sequenceId, resetState);
      setOrchestrationStates(new Map(orchestrationStates));

      // Clear layer states for this sequence
      const sequence = sequences.get(sequenceId);
      if (sequence) {
        sequence.layers.forEach(layer => {
          layerStates.current.delete(layer.id);
        });
      }
    },
    [pauseSequence, orchestrationStates, sequences]
  );

  /**
   * Seek to specific time in sequence
   */
  const seekSequence = useCallback(
    (sequenceId: string, time: number) => {
      const sequence = sequences.get(sequenceId);
      const state = orchestrationStates.get(sequenceId);

      if (!sequence || !state) return;

      const clampedTime = Math.max(0, Math.min(sequence.duration, time));

      const newState: OrchestrationState = {
        ...state,
        currentTime: clampedTime,
        progress: clampedTime / sequence.duration,
      };

      orchestrationStates.set(sequenceId, newState);
      setOrchestrationStates(new Map(orchestrationStates));

      // Force update all relevant steps at the new time
      sequence.sequences.forEach(step => {
        const stepStartTime = step.startTime + (step.delay || 0);
        const stepEndTime = stepStartTime + step.duration;

        if (clampedTime >= stepStartTime && clampedTime <= stepEndTime) {
          const stepProgress = Math.min(
            1,
            Math.max(0, (clampedTime - stepStartTime) / step.duration)
          );
          updateAnimationStep(sequence, step, stepProgress);
        }
      });
    },
    [sequences, orchestrationStates, updateAnimationStep]
  );

  /**
   * Get all loaded sequences
   */
  const getSequences = useCallback((): AnimationSequence[] => {
    return Array.from(sequences.values());
  }, [sequences]);

  /**
   * Remove a sequence
   */
  const removeSequence = useCallback(
    (sequenceId: string) => {
      stopSequence(sequenceId);
      sequences.delete(sequenceId);
      orchestrationStates.delete(sequenceId);
      onLayerUpdateCallbacks.current.delete(sequenceId);

      setSequences(new Map(sequences));
      setOrchestrationStates(new Map(orchestrationStates));
    },
    [sequences, orchestrationStates, stopSequence]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop all running sequences
      Array.from(sequences.keys()).forEach(sequenceId => {
        stopSequence(sequenceId);
      });
    };
  }, [sequences, stopSequence]);

  return {
    // Core functions
    loadSequence,
    playSequence,
    pauseSequence,
    stopSequence,
    seekSequence,
    removeSequence,

    // State access
    getSequences,
    getOrchestrationState,

    // Layer integration
    registerLayerUpdateCallback,

    // Utilities
    getCurrentStates: () =>
      Array.from(orchestrationStates.entries()).map(([id, state]) => ({
        id,
        ...state,
      })),
    isSequencePlaying: (sequenceId: string) =>
      orchestrationStates.get(sequenceId)?.isPlaying || false,
    getSequenceProgress: (sequenceId: string) =>
      orchestrationStates.get(sequenceId)?.progress || 0,

    // Performance stats
    getPerformanceReport: animationCoordinator.getPerformanceReport,
  };
};

export default useAnimationOrchestrator;
