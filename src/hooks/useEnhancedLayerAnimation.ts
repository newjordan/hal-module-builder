import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Layer } from '../types/layer-types';
import { useAnimationCoordinator } from './useAnimationCoordinator';
import {
  useTimelineManager,
  AnimationTimeline,
  TimelineKeyframe,
} from './useTimelineManager';
import {
  useAnimationOrchestrator,
  AnimationSequence,
} from './useAnimationOrchestrator';
import {
  interpolateKeyframes,
  AnimationKeyframe,
} from '../utils/layer-transforms';

/**
 * Enhanced animation configuration that supports both legacy and timeline modes
 */
export interface EnhancedAnimationConfig {
  /** Animation mode - legacy for backwards compatibility, timeline for new system */
  mode: 'legacy' | 'timeline' | 'sequence';
  /** Legacy animation config (backwards compatible) */
  legacy?: {
    duration: number;
    keyframes: AnimationKeyframe[];
    loop: 'none' | 'loop' | 'bounce';
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    autoStart?: boolean;
  };
  /** Timeline config for After Effects-style editing */
  timeline?: AnimationTimeline;
  /** Sequence config for orchestrated multi-layer animations */
  sequence?: AnimationSequence;
}

/**
 * Enhanced animation state with timeline integration
 */
export interface EnhancedAnimationState {
  mode: 'legacy' | 'timeline' | 'sequence';
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  /** Timeline-specific state */
  timelineState?: {
    activeKeyframes: TimelineKeyframe[];
    activeTracks: string[];
    zoom: number;
    viewStart: number;
    viewEnd: number;
  };
  /** Sequence-specific state */
  sequenceState?: {
    activeSteps: string[];
    completedSteps: string[];
    orchestrationId?: string;
  };
}

/**
 * Enhanced animation controls with timeline features
 */
export interface EnhancedAnimationControls {
  // Basic controls (legacy compatible)
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;

  // Timeline controls
  addKeyframe: (property: keyof Layer, time: number, value: any) => void;
  removeKeyframe: (keyframeId: string) => void;
  updateKeyframe: (
    keyframeId: string,
    updates: Partial<TimelineKeyframe>
  ) => void;
  setZoom: (zoom: number) => void;
  setViewRange: (start: number, end: number) => void;

  // Sequence controls
  loadSequence: (sequence: AnimationSequence) => void;

  // State access
  getCurrentProperties: () => Partial<Layer>;
  getState: () => EnhancedAnimationState;

  // Mode switching
  switchMode: (mode: 'legacy' | 'timeline' | 'sequence', config?: any) => void;
}

/**
 * Enhanced hook return interface
 */
export interface UseEnhancedLayerAnimationReturn {
  controls: EnhancedAnimationControls;
  animatedProperties: Partial<Layer>;
  animationState: EnhancedAnimationState;
  updateConfig: (config: Partial<EnhancedAnimationConfig>) => void;

  // Direct access to subsystems
  timelineManager?: ReturnType<typeof useTimelineManager>;
  orchestrator?: ReturnType<typeof useAnimationOrchestrator>;
}

/**
 * Enhanced layer animation hook that integrates legacy animations with timeline and sequence systems
 *
 * Features:
 * - Backwards compatibility with existing useLayerAnimation
 * - Timeline-based keyframe editing (After Effects style)
 * - Multi-layer sequence orchestration
 * - Performance optimization through animation coordinator
 * - Seamless mode switching
 */
export const useEnhancedLayerAnimation = (
  layer: Layer,
  config: EnhancedAnimationConfig
): UseEnhancedLayerAnimationReturn => {
  const animationCoordinator = useAnimationCoordinator();

  // Core state
  const [animationConfig, setAnimationConfig] =
    useState<EnhancedAnimationConfig>(config);
  const [animatedProperties, setAnimatedProperties] = useState<Partial<Layer>>(
    {}
  );
  const [currentMode, setCurrentMode] = useState(config.mode);

  // Animation references
  const animationId = useRef(`layer-${layer.id}-${Date.now()}`);
  const animationCleanup = useRef<(() => void) | null>(null);

  // Legacy animation state
  const [legacyState, setLegacyState] = useState({
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    startTime: null as number | null,
    loopCount: 0,
  });

  // Timeline integration
  const timelineManager = useMemo(() => {
    if (currentMode === 'timeline' && animationConfig.timeline) {
      return useTimelineManager([layer], animationConfig.timeline);
    }
    return null;
  }, [currentMode, animationConfig.timeline, layer]);

  // Orchestrator integration
  const orchestrator = useMemo(() => {
    if (currentMode === 'sequence') {
      return useAnimationOrchestrator();
    }
    return null;
  }, [currentMode]);

  /**
   * Calculate current animation state based on mode
   */
  const getCurrentAnimationState = useCallback((): EnhancedAnimationState => {
    switch (currentMode) {
      case 'timeline':
        if (timelineManager) {
          const timeline = timelineManager.timeline;
          const activeKeyframes = timeline.tracks.flatMap(
            (track: { keyframes: TimelineKeyframe[] }) =>
              track.keyframes.filter(
                (kf: TimelineKeyframe) =>
                  Math.abs(kf.time - timeline.currentTime) < 100 // 100ms tolerance
              )
          );

          return {
            mode: 'timeline',
            isPlaying: timeline.playbackState === 'playing',
            progress: timeline.currentTime / timeline.duration,
            currentTime: timeline.currentTime,
            duration: timeline.duration,
            timelineState: {
              activeKeyframes,
              activeTracks: timeline.tracks
                .filter((track: { muted?: boolean }) => !track.muted)
                .map((track: { id: string }) => track.id),
              zoom: timeline.zoom,
              viewStart: timeline.viewStart,
              viewEnd: timeline.viewEnd,
            },
          };
        }
        break;

      case 'sequence':
        if (orchestrator && animationConfig.sequence) {
          const orchState = orchestrator.getOrchestrationState(
            animationConfig.sequence.id
          );
          if (orchState) {
            return {
              mode: 'sequence',
              isPlaying: orchState.isPlaying,
              progress: orchState.progress,
              currentTime: orchState.currentTime,
              duration: animationConfig.sequence.duration,
              sequenceState: {
                activeSteps: orchState.activeSteps,
                completedSteps: orchState.completedSteps,
                orchestrationId: animationConfig.sequence.id,
              },
            };
          }
        }
        break;

      case 'legacy':
      default:
        return {
          mode: 'legacy',
          isPlaying: legacyState.isPlaying,
          progress: legacyState.progress,
          currentTime: legacyState.currentTime,
          duration: animationConfig.legacy?.duration || 0,
        };
    }

    // Fallback state
    return {
      mode: currentMode,
      isPlaying: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
    };
  }, [
    currentMode,
    timelineManager,
    orchestrator,
    animationConfig,
    legacyState,
  ]);

  /**
   * Update animated properties based on current mode and state
   */
  const updateAnimatedProperties = useCallback(() => {
    let newProperties: Partial<Layer> = {};

    switch (currentMode) {
      case 'timeline':
        if (timelineManager) {
          const output = timelineManager.getCurrentAnimatedProperties();
          newProperties = output[layer.id] || {};
        }
        break;

      case 'sequence':
        // Properties are updated through orchestrator callbacks
        // Keep current properties as they're managed externally
        return;

      case 'legacy':
      default:
        if (
          animationConfig.legacy &&
          animationConfig.legacy.keyframes.length > 0
        ) {
          newProperties = interpolateKeyframes(
            animationConfig.legacy.keyframes,
            legacyState.progress
          );
        }
        break;
    }

    setAnimatedProperties(newProperties);
  }, [currentMode, timelineManager, animationConfig, legacyState.progress]);

  /**
   * Legacy animation frame update
   */
  const updateLegacyAnimation = useCallback(
    (timestamp: number) => {
      if (!animationConfig.legacy) return;

      setLegacyState(prevState => {
        if (!prevState.isPlaying || !prevState.startTime) return prevState;

        const elapsed = timestamp - prevState.startTime;
        let progress = elapsed / animationConfig.legacy!.duration;
        let newLoopCount = prevState.loopCount;

        // Handle loop modes
        if (progress >= 1) {
          switch (animationConfig.legacy!.loop) {
            case 'loop':
              progress = progress % 1;
              newLoopCount = Math.floor(
                elapsed / animationConfig.legacy!.duration
              );
              break;
            case 'bounce':
              const cycle = Math.floor(progress);
              progress = progress % 1;
              if (cycle % 2 === 1) {
                progress = 1 - progress;
              }
              newLoopCount = Math.floor(
                elapsed / (animationConfig.legacy!.duration * 2)
              );
              break;
            case 'none':
            default:
              progress = 1;
              return {
                ...prevState,
                isPlaying: false,
                progress,
                currentTime: animationConfig.legacy!.duration,
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
    },
    [animationConfig.legacy]
  );

  /**
   * Start animation based on current mode
   */
  const play = useCallback(() => {
    switch (currentMode) {
      case 'timeline':
        timelineManager?.play();
        break;

      case 'sequence':
        if (orchestrator && animationConfig.sequence) {
          orchestrator.playSequence(animationConfig.sequence.id);
        }
        break;

      case 'legacy':
      default:
        const now = performance.now();
        setLegacyState(prevState => ({
          ...prevState,
          isPlaying: true,
          startTime: prevState.startTime ? now - prevState.currentTime : now,
        }));

        // Register with coordinator
        if (animationCleanup.current) {
          animationCleanup.current();
        }
        animationCleanup.current = animationCoordinator.registerAnimation(
          animationId.current,
          updateLegacyAnimation,
          5 // Medium priority
        );
        break;
    }
  }, [
    currentMode,
    timelineManager,
    orchestrator,
    animationConfig,
    animationCoordinator,
    updateLegacyAnimation,
  ]);

  /**
   * Pause animation
   */
  const pause = useCallback(() => {
    switch (currentMode) {
      case 'timeline':
        timelineManager?.pause();
        break;

      case 'sequence':
        if (orchestrator && animationConfig.sequence) {
          orchestrator.pauseSequence(animationConfig.sequence.id);
        }
        break;

      case 'legacy':
      default:
        setLegacyState(prevState => ({
          ...prevState,
          isPlaying: false,
        }));

        if (animationCleanup.current) {
          animationCleanup.current();
          animationCleanup.current = null;
        }
        break;
    }
  }, [currentMode, timelineManager, orchestrator, animationConfig]);

  /**
   * Stop animation and reset
   */
  const stop = useCallback(() => {
    switch (currentMode) {
      case 'timeline':
        timelineManager?.stop();
        break;

      case 'sequence':
        if (orchestrator && animationConfig.sequence) {
          orchestrator.stopSequence(animationConfig.sequence.id);
        }
        break;

      case 'legacy':
      default:
        setLegacyState({
          isPlaying: false,
          progress: 0,
          currentTime: 0,
          startTime: null,
          loopCount: 0,
        });

        if (animationCleanup.current) {
          animationCleanup.current();
          animationCleanup.current = null;
        }
        break;
    }
  }, [currentMode, timelineManager, orchestrator, animationConfig]);

  /**
   * Seek to specific time
   */
  const seek = useCallback(
    (time: number) => {
      switch (currentMode) {
        case 'timeline':
          timelineManager?.seekTo(time);
          break;

        case 'sequence':
          if (orchestrator && animationConfig.sequence) {
            orchestrator.seekSequence(animationConfig.sequence.id, time);
          }
          break;

        case 'legacy':
        default:
          if (animationConfig.legacy) {
            const progress = Math.max(
              0,
              Math.min(1, time / animationConfig.legacy.duration)
            );
            setLegacyState(prevState => ({
              ...prevState,
              progress,
              currentTime: time,
              startTime: prevState.isPlaying ? performance.now() - time : null,
            }));
          }
          break;
      }
    },
    [currentMode, timelineManager, orchestrator, animationConfig]
  );

  /**
   * Switch animation mode
   */
  const switchMode = useCallback(
    (mode: 'legacy' | 'timeline' | 'sequence', newConfig?: any) => {
      // Stop current animation
      stop();

      // Update mode and config
      setCurrentMode(mode);
      setAnimationConfig(prev => ({
        ...prev,
        mode,
        ...(newConfig && { [mode]: newConfig }),
      }));

      // Reset properties
      setAnimatedProperties({});
    },
    [stop]
  );

  /**
   * Timeline-specific controls
   */
  const addKeyframe = useCallback(
    (property: keyof Layer, time: number, value: any) => {
      if (timelineManager) {
        // Find or create track for this property
        const track = timelineManager.timeline.tracks.find(
          (t: { layerId: string; property: keyof Layer }) =>
            t.layerId === layer.id && t.property === property
        );
        if (track) {
          timelineManager.addKeyframe(track.id, time, value);
        } else {
          // Create track first, then add keyframe
          timelineManager.addTrack(layer.id, property);
          const newTrack = timelineManager.timeline.tracks.find(
            (t: { layerId: string; property: keyof Layer }) =>
              t.layerId === layer.id && t.property === property
          );
          if (newTrack) {
            timelineManager.addKeyframe(newTrack.id, time, value);
          }
        }
      }
    },
    [timelineManager, layer.id]
  );

  const removeKeyframe = useCallback(
    (keyframeId: string) => {
      if (timelineManager) {
        timelineManager.removeKeyframe(keyframeId);
      }
    },
    [timelineManager]
  );

  const updateKeyframe = useCallback(
    (keyframeId: string, updates: Partial<TimelineKeyframe>) => {
      if (timelineManager) {
        timelineManager.updateKeyframe(keyframeId, updates);
      }
    },
    [timelineManager]
  );

  const setZoom = useCallback(
    (zoom: number) => {
      timelineManager?.setZoom(zoom);
    },
    [timelineManager]
  );

  const setViewRange = useCallback(
    (start: number, end: number) => {
      timelineManager?.setViewport(start, end);
    },
    [timelineManager]
  );

  /**
   * Load sequence for orchestration
   */
  const loadSequence = useCallback(
    (sequence: AnimationSequence) => {
      if (orchestrator) {
        orchestrator.loadSequence(sequence);

        // Register callback for layer updates
        orchestrator.registerLayerUpdateCallback(
          sequence.id,
          (layerId, updates) => {
            if (layerId === layer.id) {
              setAnimatedProperties(prev => ({ ...prev, ...updates }));
            }
          }
        );
      }
    },
    [orchestrator, layer.id]
  );

  // Update animated properties when state changes
  useEffect(() => {
    updateAnimatedProperties();
  }, [updateAnimatedProperties]);

  // Auto-start legacy animations
  useEffect(() => {
    if (
      currentMode === 'legacy' &&
      animationConfig.legacy?.autoStart &&
      !legacyState.isPlaying &&
      legacyState.currentTime === 0
    ) {
      play();
    }
  }, [
    currentMode,
    animationConfig.legacy?.autoStart,
    legacyState.isPlaying,
    legacyState.currentTime,
    play,
  ]);

  // Load sequence on mode switch
  useEffect(() => {
    if (currentMode === 'sequence' && animationConfig.sequence) {
      loadSequence(animationConfig.sequence);
    }
  }, [currentMode, animationConfig.sequence, loadSequence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationCleanup.current) {
        animationCleanup.current();
      }

      if (orchestrator && animationConfig.sequence) {
        orchestrator.removeSequence(animationConfig.sequence.id);
      }
    };
  }, [orchestrator, animationConfig.sequence]);

  const controls: EnhancedAnimationControls = {
    play,
    pause,
    stop,
    seek,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    setZoom,
    setViewRange,
    loadSequence,
    getCurrentProperties: () => animatedProperties,
    getState: getCurrentAnimationState,
    switchMode,
  };

  const result: UseEnhancedLayerAnimationReturn = {
    controls,
    animatedProperties,
    animationState: getCurrentAnimationState(),
    updateConfig: (newConfig: Partial<EnhancedAnimationConfig>) => {
      setAnimationConfig(prev => ({ ...prev, ...newConfig }));
    },
  };
  if (timelineManager) result.timelineManager = timelineManager;
  if (orchestrator) result.orchestrator = orchestrator;
  return result;
};

export default useEnhancedLayerAnimation;
