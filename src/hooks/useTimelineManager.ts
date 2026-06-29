import { useState, useCallback, useRef, useEffect } from 'react';
import { Layer } from '../types/layer-types';
import { useAnimationCoordinator } from './useAnimationCoordinator';

/**
 * Easing function type for animation keyframes
 */
export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier'
  | 'bounce'
  | 'elastic';

/**
 * Timeline keyframe with timing and value information
 */
export interface TimelineKeyframe {
  id: string;
  time: number; // 0-1 normalized time
  value: any;
  easing: EasingFunction;
  selected?: boolean;
  locked?: boolean;
}

/**
 * Animation track for a specific layer property
 */
export interface TimelineTrack {
  id: string;
  layerId: string;
  property: keyof Layer;
  keyframes: TimelineKeyframe[];
  expanded?: boolean;
  locked?: boolean;
  solo?: boolean;
  muted?: boolean;
  color?: string;
}

/**
 * Main timeline configuration
 */
export interface AnimationTimeline {
  id: string;
  name: string;
  duration: number; // in milliseconds
  currentTime: number;
  tracks: TimelineTrack[];
  playbackState: 'playing' | 'paused' | 'stopped';
  loop: boolean;
  selectedKeyframes: string[];
  zoom: number; // Timeline zoom level (0.1 to 10)
  viewStart: number; // Start time of viewport (for scrolling)
  viewEnd: number; // End time of viewport
}

/**
 * Timeline playback statistics
 */
export interface TimelineStats {
  totalKeyframes: number;
  activeTracks: number;
  fps: number;
  isPlaying: boolean;
  performance: 'good' | 'warning' | 'critical';
}

/**
 * Generate unique ID for timeline elements
 */
const generateId = () =>
  `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Easing function implementations
 */
const easingFunctions = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  'cubic-bezier': (t: number) => t * t * (3 - 2 * t), // Simplified cubic bezier
  bounce: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  elastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },
};

/**
 * Apply easing function to progress value
 */
const applyEasing = (progress: number, easing: EasingFunction): number => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return easingFunctions[easing]?.(clampedProgress) ?? clampedProgress;
};

/**
 * Interpolate between two values
 */
const interpolateValue = (start: any, end: any, progress: number): any => {
  if (typeof start === 'number' && typeof end === 'number') {
    return start + (end - start) * progress;
  }

  if (typeof start === 'string' && typeof end === 'string') {
    // Handle color interpolation for hex colors
    if (start.startsWith('#') && end.startsWith('#')) {
      return interpolateColor(start, end, progress);
    }
    // For non-color strings, return the end value when progress > 0.5
    return progress > 0.5 ? end : start;
  }

  // For complex objects, return end value when progress > 0.5
  return progress > 0.5 ? end : start;
};

/**
 * Interpolate between two hex colors
 */
const interpolateColor = (
  start: string,
  end: string,
  progress: number
): string => {
  const startRGB = hexToRgb(start);
  const endRGB = hexToRgb(end);

  if (!startRGB || !endRGB) return progress > 0.5 ? end : start;

  const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * progress);
  const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * progress);
  const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * progress);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
};

/**
 * Hook for managing After Effects-style timeline interface
 * Single Responsibility: Timeline management, keyframe editing, and playback control
 */
export const useTimelineManager = (
  layers: Layer[],
  initialTimeline?: Partial<AnimationTimeline>
) => {
  // Animation coordinator for performance management
  const animationCoordinator = useAnimationCoordinator({
    maxCPUPercentage: 15,
    maxMemoryMB: 75,
    frameDropThreshold: 3,
    adaptiveQuality: true,
    targetFPS: 60,
    maxSimultaneousAnimations: 10,
  });

  // Timeline state
  const [timeline, setTimeline] = useState<AnimationTimeline>({
    id: generateId(),
    name: 'Animation Timeline',
    duration: 5000, // 5 seconds default
    currentTime: 0,
    tracks: [],
    playbackState: 'stopped',
    loop: false,
    selectedKeyframes: [],
    zoom: 1.0,
    viewStart: 0,
    viewEnd: 5000,
    ...initialTimeline,
  });

  // Performance tracking
  const [stats, setStats] = useState<TimelineStats>({
    totalKeyframes: 0,
    activeTracks: 0,
    fps: 60,
    isPlaying: false,
    performance: 'good',
  });

  const playbackAnimationId = useRef<string>();
  const lastFrameTime = useRef<number>(0);

  /**
   * Calculate timeline statistics
   */
  const calculateStats = useCallback((): TimelineStats => {
    const totalKeyframes = timeline.tracks.reduce(
      (sum, track) => sum + track.keyframes.length,
      0
    );
    const activeTracks = timeline.tracks.filter(track => !track.muted).length;
    const coordStats = animationCoordinator.stats;

    let performance: 'good' | 'warning' | 'critical' = 'good';
    if (coordStats.performanceScore < 50) performance = 'critical';
    else if (coordStats.performanceScore < 75) performance = 'warning';

    return {
      totalKeyframes,
      activeTracks,
      fps: coordStats.currentFPS,
      isPlaying: timeline.playbackState === 'playing',
      performance,
    };
  }, [timeline.tracks, timeline.playbackState, animationCoordinator.stats]);

  /**
   * Update stats periodically
   */
  useEffect(() => {
    const newStats = calculateStats();
    setStats(newStats);
  }, [calculateStats]);

  /**
   * Main animation loop for timeline playback
   */
  const animationLoop = useCallback(
    (timestamp: number) => {
      if (timeline.playbackState !== 'playing') return;

      const deltaTime = timestamp - lastFrameTime.current;
      lastFrameTime.current = timestamp;

      setTimeline(prev => {
        let newTime = prev.currentTime + deltaTime;

        // Handle looping
        if (newTime >= prev.duration) {
          if (prev.loop) {
            newTime = newTime % prev.duration;
          } else {
            newTime = prev.duration;
            return { ...prev, currentTime: newTime, playbackState: 'stopped' };
          }
        }

        return { ...prev, currentTime: newTime };
      });
    },
    [timeline.playbackState, timeline.duration, timeline.loop]
  );

  /**
   * Register animation loop with coordinator
   */
  useEffect(() => {
    if (timeline.playbackState === 'playing') {
      const cleanup = animationCoordinator.registerAnimation(
        'timeline-playback',
        animationLoop,
        8 // High priority
      );

      playbackAnimationId.current = 'timeline-playback';
      lastFrameTime.current = performance.now();

      return cleanup;
    } else if (playbackAnimationId.current) {
      animationCoordinator.unregisterAnimation(playbackAnimationId.current);
      playbackAnimationId.current = undefined;
    }
    return undefined;
  }, [timeline.playbackState, animationLoop, animationCoordinator]);

  // === PLAYBACK CONTROLS ===

  /**
   * Play timeline
   */
  const play = useCallback(() => {
    if (timeline.playbackState === 'playing') return;
    setTimeline(prev => ({ ...prev, playbackState: 'playing' }));
  }, [timeline.playbackState]);

  /**
   * Pause timeline
   */
  const pause = useCallback(() => {
    if (timeline.playbackState !== 'playing') return;
    setTimeline(prev => ({ ...prev, playbackState: 'paused' }));
  }, [timeline.playbackState]);

  /**
   * Stop timeline and reset to beginning
   */
  const stop = useCallback(() => {
    setTimeline(prev => ({
      ...prev,
      playbackState: 'stopped',
      currentTime: 0,
    }));
  }, []);

  /**
   * Seek to specific time
   */
  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(timeline.duration, time));
      setTimeline(prev => ({ ...prev, currentTime: clampedTime }));
    },
    [timeline.duration]
  );

  // === TIMELINE EDITING ===

  /**
   * Add new track for layer property
   */
  const addTrack = useCallback(
    (
      layerId: string,
      property: keyof Layer,
      initialKeyframes?: TimelineKeyframe[]
    ) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) return;

      const newTrack: TimelineTrack = {
        id: generateId(),
        layerId,
        property,
        keyframes: initialKeyframes || [],
        expanded: true,
        color: getTrackColor(property),
      };

      setTimeline(prev => ({
        ...prev,
        tracks: [...prev.tracks, newTrack],
      }));
    },
    [layers]
  );

  /**
   * Remove track
   */
  const removeTrack = useCallback((trackId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== trackId),
    }));
  }, []);

  /**
   * Add keyframe to track
   */
  const addKeyframe = useCallback(
    (
      trackId: string,
      time: number,
      value: any,
      easing: EasingFunction = 'ease-in-out'
    ) => {
      setTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? {
                ...track,
                keyframes: [
                  ...track.keyframes,
                  {
                    id: generateId(),
                    time: time / prev.duration, // Normalize to 0-1
                    value,
                    easing,
                  },
                ].sort((a, b) => a.time - b.time),
              }
            : track
        ),
      }));
    },
    []
  );

  /**
   * Remove keyframe
   */
  const removeKeyframe = useCallback((keyframeId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        keyframes: track.keyframes.filter(kf => kf.id !== keyframeId),
      })),
      selectedKeyframes: prev.selectedKeyframes.filter(id => id !== keyframeId),
    }));
  }, []);

  /**
   * Update keyframe
   */
  const updateKeyframe = useCallback(
    (keyframeId: string, updates: Partial<TimelineKeyframe>) => {
      setTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          keyframes: track.keyframes.map(kf =>
            kf.id === keyframeId ? { ...kf, ...updates } : kf
          ),
        })),
      }));
    },
    []
  );

  /**
   * Select keyframes
   */
  const selectKeyframes = useCallback((keyframeIds: string[]) => {
    setTimeline(prev => ({ ...prev, selectedKeyframes: keyframeIds }));
  }, []);

  /**
   * Toggle track properties
   */
  const toggleTrackMute = useCallback((trackId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      ),
    }));
  }, []);

  const toggleTrackSolo = useCallback((trackId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, solo: !track.solo } : track
      ),
    }));
  }, []);

  const toggleTrackLock = useCallback((trackId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, locked: !track.locked } : track
      ),
    }));
  }, []);

  // === TIMELINE VIEWPORT ===

  /**
   * Set timeline zoom level
   */
  const setZoom = useCallback((zoom: number) => {
    const clampedZoom = Math.max(0.1, Math.min(10, zoom));
    setTimeline(prev => ({ ...prev, zoom: clampedZoom }));
  }, []);

  /**
   * Set viewport range
   */
  const setViewport = useCallback((start: number, end: number) => {
    setTimeline(prev => ({
      ...prev,
      viewStart: Math.max(0, start),
      viewEnd: Math.min(prev.duration, end),
    }));
  }, []);

  // === ANIMATION OUTPUT ===

  /**
   * Get current animated properties for all layers
   */
  const getCurrentAnimatedProperties = useCallback((): Record<
    string,
    Partial<Layer>
  > => {
    const progress = timeline.currentTime / timeline.duration;
    const animatedProps: Record<string, Partial<Layer>> = {};

    timeline.tracks.forEach(track => {
      if (track.muted || track.keyframes.length === 0) return;

      // Skip if solo tracks exist and this isn't solo
      const hasSoloTracks = timeline.tracks.some(t => t.solo);
      if (hasSoloTracks && !track.solo) return;

      const value = getAnimatedValueAtTime(track, progress);
      if (value !== undefined) {
        if (!animatedProps[track.layerId]) {
          animatedProps[track.layerId] = {};
        }
        (animatedProps[track.layerId] as Record<string, any>)[
          track.property as string
        ] = value;
      }
    });

    return animatedProps;
  }, [timeline]);

  /**
   * Get animated value for track at specific progress
   */
  const getAnimatedValueAtTime = useCallback(
    (track: TimelineTrack, progress: number) => {
      const keyframes = track.keyframes.sort((a, b) => a.time - b.time);

      if (keyframes.length === 0) return undefined;
      if (keyframes.length === 1) return keyframes[0]!.value;

      // Find surrounding keyframes
      let currentKf = keyframes[0]!;
      let nextKf = keyframes[keyframes.length - 1]!;

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (
          progress >= keyframes[i]!.time &&
          progress <= keyframes[i + 1]!.time
        ) {
          currentKf = keyframes[i]!;
          nextKf = keyframes[i + 1]!;
          break;
        }
      }

      if (progress <= currentKf.time) return currentKf.value;
      if (progress >= nextKf.time) return nextKf.value;

      // Interpolate between keyframes
      const localProgress =
        (progress - currentKf.time) / (nextKf.time - currentKf.time);
      const easedProgress = applyEasing(localProgress, currentKf.easing);

      return interpolateValue(currentKf.value, nextKf.value, easedProgress);
    },
    []
  );

  // === UTILITIES ===

  /**
   * Get color for track based on property type
   */
  const getTrackColor = (property: keyof Layer): string => {
    const colorMap: Record<string, string> = {
      opacity: '#3b82f6', // blue
      scale: '#10b981', // green
      rotation: '#f59e0b', // amber
      offsetX: '#ef4444', // red
      offsetY: '#ef4444', // red
      color: '#8b5cf6', // purple
      brightness: '#f97316', // orange
      contrast: '#06b6d4', // cyan
    };
    return colorMap[property as string] || '#6b7280'; // gray default
  };

  /**
   * Export timeline data
   */
  const exportTimeline = useCallback(() => {
    return {
      ...timeline,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }, [timeline]);

  /**
   * Import timeline data
   */
  const importTimeline = useCallback((importedTimeline: AnimationTimeline) => {
    setTimeline(importedTimeline);
  }, []);

  return {
    // Core state
    timeline,
    stats,

    // Playback controls
    play,
    pause,
    stop,
    seekTo,

    // Track management
    addTrack,
    removeTrack,
    toggleTrackMute,
    toggleTrackSolo,
    toggleTrackLock,

    // Keyframe management
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    selectKeyframes,

    // Viewport controls
    setZoom,
    setViewport,

    // Animation output
    getCurrentAnimatedProperties,
    getAnimatedValueAtTime,

    // Utilities
    exportTimeline,
    importTimeline,

    // Coordinator access
    animationCoordinator,
  };
};

export default useTimelineManager;
