/**
 * HAL Radial Text Timeline Hook
 * =============================
 *
 * React hook for advanced timeline-based text animations.
 * Provides keyframe editing and precise animation control.
 *
 * Single Responsibility: React state management for timeline animations only.
 *
 * @version 1.0.0
 * @requires RadialTextTimelineService
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  RadialTextTimelineService,
  RadialTextTimeline,
  AnimationKeyframe,
  TimelineEvent,
  TimelinePlaybackState,
} from '../services/radial/RadialTextTimelineService';
import { RadialTextCharacter, FrostTheme } from '../types/radial-text-types';

/**
 * Configuration for timeline hook
 */
export interface UseRadialTextTimelineConfig {
  /** Timeline name for UI display */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Whether timeline should loop */
  loop?: boolean;
  /** MANDATORY frost_glass.css theme */
  theme: FrostTheme;
  /** Auto-start the timeline */
  autoStart?: boolean;
  /** Playback speed (1.0 = normal) */
  speed?: number;
}

/**
 * Timeline hook result
 */
export interface UseRadialTextTimelineResult {
  /** Timeline object */
  timeline: RadialTextTimeline | null;
  /** Current animated characters */
  animatedCharacters: RadialTextCharacter[];
  /** Current playback state */
  playbackState: TimelinePlaybackState | null;
  /** Whether timeline is playing */
  isPlaying: boolean;
  /** Whether timeline is complete */
  isComplete: boolean;
  /** Current time position (0-1) */
  progress: number;
  /** Start timeline playback */
  play: () => void;
  /** Pause timeline playback */
  pause: () => void;
  /** Resume timeline playback */
  resume: () => void;
  /** Stop and reset timeline */
  stop: () => void;
  /** Add keyframe to character track */
  addKeyframe: (characterIndex: number, keyframe: AnimationKeyframe) => void;
  /** Remove keyframe from character track */
  removeKeyframe: (characterIndex: number, time: number) => void;
  /** Update timeline configuration */
  updateConfig: (config: Partial<UseRadialTextTimelineConfig>) => void;
}

/**
 * Hook for advanced timeline-based radial text animations
 *
 * @param timelineId - Unique identifier for the timeline
 * @param characters - Array of radial text characters
 * @param config - Timeline configuration
 * @returns Timeline control interface and animated characters
 *
 * @example
 * ```tsx
 * const {
 *   timeline,
 *   animatedCharacters,
 *   isPlaying,
 *   play,
 *   pause,
 *   addKeyframe
 * } = useRadialTextTimeline(
 *   'status-text-timeline',
 *   characters,
 *   {
 *     name: 'Status Text Animation',
 *     duration: 3000,
 *     theme: 'frost_dark',
 *     autoStart: true,
 *     loop: true
 *   }
 * );
 *
 * // Add custom keyframe
 * addKeyframe(0, {
 *   time: 0.5,
 *   opacity: 0.8,
 *   scale: 1.2,
 *   easing: 'bounce'
 * });
 * ```
 */
export function useRadialTextTimeline(
  timelineId: string,
  characters: RadialTextCharacter[],
  config: UseRadialTextTimelineConfig
): UseRadialTextTimelineResult {
  const timelineService = RadialTextTimelineService.getInstance();
  const animationFrameRef = useRef<number>();
  const configRef = useRef<UseRadialTextTimelineConfig>(config);

  // State management
  const [timeline, setTimeline] = useState<RadialTextTimeline | null>(null);
  const [animatedCharacters, setAnimatedCharacters] = useState<RadialTextCharacter[]>(characters);
  const [playbackState, setPlaybackState] = useState<TimelinePlaybackState | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  /**
   * Initialize timeline when characters change
   */
  useEffect(() => {
    if (characters.length > 0) {
      const newTimeline = timelineService.createTimeline(
        timelineId,
        config.name,
        characters,
        config.duration,
        config.theme
      );
      newTimeline.loop = config.loop || false;
      setTimeline(newTimeline);
    }
  }, [timelineId, characters, config.name, config.duration, config.theme, config.loop]);

  /**
   * Animation update loop
   */
  const updateAnimation = useCallback(() => {
    if (!timeline) return;

    const state = timelineService.getPlaybackState(timelineId);
    if (!state || !state.isPlaying) {
      setIsPlaying(false);
      return;
    }

    // Update timeline and get animated characters
    const updatedCharacters = timelineService.updateTimeline(timelineId, characters);
    setAnimatedCharacters(updatedCharacters);

    // Update state
    const updatedState = timelineService.getPlaybackState(timelineId);
    if (updatedState) {
      setPlaybackState(updatedState);
      setIsPlaying(updatedState.isPlaying);
      setIsComplete(updatedState.isComplete);
      setProgress(Math.min(updatedState.currentTime / timeline.duration, 1));

      if (updatedState.isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateAnimation);
      }
    }
  }, [timeline, timelineId, characters]);

  /**
   * Play timeline
   */
  const play = useCallback(() => {
    if (!timeline) return;

    const success = timelineService.startTimeline(timelineId, config.speed || 1);
    if (success) {
      setIsPlaying(true);
      setIsComplete(false);
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    }
  }, [timeline, timelineId, config.speed, updateAnimation]);

  /**
   * Pause timeline
   */
  const pause = useCallback(() => {
    timelineService.pauseTimeline(timelineId);
    setIsPlaying(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [timelineId]);

  /**
   * Resume timeline
   */
  const resume = useCallback(() => {
    if (!timeline) return;

    const success = timelineService.resumeTimeline(timelineId);
    if (success) {
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    }
  }, [timeline, timelineId, updateAnimation]);

  /**
   * Stop and reset timeline
   */
  const stop = useCallback(() => {
    timelineService.stopTimeline(timelineId);
    setIsPlaying(false);
    setIsComplete(false);
    setProgress(0);
    setAnimatedCharacters(characters);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [timelineId, characters]);

  /**
   * Add keyframe to character track
   */
  const addKeyframe = useCallback((characterIndex: number, keyframe: AnimationKeyframe) => {
    timelineService.addKeyframe(timelineId, characterIndex, keyframe);
  }, [timelineId]);

  /**
   * Remove keyframe from character track
   */
  const removeKeyframe = useCallback((characterIndex: number, time: number) => {
    timelineService.removeKeyframe(timelineId, characterIndex, time);
  }, [timelineId]);

  /**
   * Update timeline configuration
   */
  const updateConfig = useCallback((newConfig: Partial<UseRadialTextTimelineConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };

    if (!timeline) return;

    // Update timeline properties
    if (newConfig.name) timeline.name = newConfig.name;
    if (newConfig.duration) timeline.duration = newConfig.duration;
    if (newConfig.loop !== undefined) timeline.loop = newConfig.loop;
    if (newConfig.theme) timeline.theme = newConfig.theme;

    setTimeline({ ...timeline });
  }, [timeline]);

  /**
   * Handle timeline events
   */
  useEffect(() => {
    if (!timeline) return;

    const handleTimelineEvent = (event: TimelineEvent) => {
      switch (event.type) {
        case 'complete':
          setIsComplete(true);
          setIsPlaying(false);
          setProgress(1);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          break;

        case 'loop':
          setProgress(0);
          setIsComplete(false);
          break;

        case 'start':
          setIsComplete(false);
          setProgress(0);
          break;
      }
    };

    timelineService.addEventListener(timelineId, handleTimelineEvent);

    return () => {
      timelineService.removeEventListener(timelineId, handleTimelineEvent);
    };
  }, [timeline, timelineId]);

  /**
   * Auto-start if configured
   */
  useEffect(() => {
    if (config.autoStart && timeline && characters.length > 0) {
      play();
    }
  }, [config.autoStart, timeline, characters.length, play]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      timelineService.stopTimeline(timelineId);
    };
  }, [timelineId]);

  /**
   * Update config reference
   */
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /**
   * Update characters when prop changes and not animating
   */
  useEffect(() => {
    if (!isPlaying) {
      setAnimatedCharacters(characters);
    }
  }, [characters, isPlaying]);

  return {
    timeline,
    animatedCharacters,
    playbackState,
    isPlaying,
    isComplete,
    progress,
    play,
    pause,
    resume,
    stop,
    addKeyframe,
    removeKeyframe,
    updateConfig,
  };
}

export default useRadialTextTimeline;