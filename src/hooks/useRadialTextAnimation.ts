/**
 * HAL Radial Text Animation Hook
 * ==============================
 *
 * React hook for managing radial text animations with timeline integration.
 * Provides seamless integration with existing AnimationEngine and 60fps performance.
 *
 * Single Responsibility: React state management for text animations only.
 *
 * @version 1.0.0
 * @requires RadialTextAnimationService
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  RadialTextAnimationService,
  TextAnimationConfig,
  TextAnimationContext,
} from '../services/radial/RadialTextAnimationService';
import {
  RadialTextCharacter,
  RadialTextAnimationType,
  FrostTheme,
} from '../types/radial-text-types';

/**
 * Configuration for the radial text animation hook
 */
export interface UseRadialTextAnimationConfig {
  /** Animation type to perform */
  animationType: RadialTextAnimationType;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Delay between character animations in milliseconds */
  staggerDelay?: number;
  /** Animation easing function */
  easing?: TextAnimationConfig['easing'];
  /** Whether to loop the animation */
  loop?: boolean;
  /** Whether to auto-start the animation */
  autoStart?: boolean;
  /** MANDATORY frost_glass.css theme */
  theme: FrostTheme;
}

/**
 * Result object from the radial text animation hook
 */
export interface UseRadialTextAnimationResult {
  /** Animated characters with updated properties */
  animatedCharacters: RadialTextCharacter[];
  /** Whether the animation is currently playing */
  isPlaying: boolean;
  /** Whether the animation has completed */
  isComplete: boolean;
  /** Current animation progress (0-1) */
  progress: number;
  /** Start or restart the animation */
  startAnimation: () => void;
  /** Pause the animation */
  pauseAnimation: () => void;
  /** Reset the animation to the beginning */
  resetAnimation: () => void;
  /** Set animation configuration */
  setConfig: (config: Partial<UseRadialTextAnimationConfig>) => void;
}

/**
 * Hook for managing radial text animations
 * Integrates with AnimationEngine for optimal performance
 *
 * @param layerId - Unique identifier for the text layer
 * @param characters - Array of radial text characters to animate
 * @param initialConfig - Initial animation configuration
 * @param audioData - Optional audio data for reactive animations
 * @returns Animation control interface and animated characters
 *
 * @example
 * ```tsx
 * const {
 *   animatedCharacters,
 *   isPlaying,
 *   isComplete,
 *   startAnimation,
 *   resetAnimation
 * } = useRadialTextAnimation(
 *   'status-text-layer',
 *   characters,
 *   {
 *     animationType: 'typewriter',
 *     duration: 2000,
 *     staggerDelay: 100,
 *     theme: 'frost_dark',
 *     autoStart: true
 *   },
 *   audioData
 * );
 * ```
 */
export function useRadialTextAnimation(
  layerId: string,
  characters: RadialTextCharacter[],
  initialConfig: UseRadialTextAnimationConfig,
  audioData?: Float32Array
): UseRadialTextAnimationResult {
  const animationService = RadialTextAnimationService.getInstance();
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const configRef = useRef<UseRadialTextAnimationConfig>(initialConfig);

  // Create animation configuration
  const animationConfig = useMemo<TextAnimationConfig>(
    () => ({
      type: configRef.current.animationType,
      duration: configRef.current.duration ?? 2000,
      staggerDelay: configRef.current.staggerDelay ?? 100,
      reverse: false,
      easing: configRef.current.easing ?? 'ease-out',
      loop: configRef.current.loop ?? false,
    }),
    [
      configRef.current.animationType,
      configRef.current.duration,
      configRef.current.staggerDelay,
      configRef.current.easing,
      configRef.current.loop,
    ]
  );

  // Animation state management
  const [animatedCharacters, setAnimatedCharacters] =
    useState<RadialTextCharacter[]>(characters);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  /**
   * Animation update loop
   */
  const updateAnimation = useCallback(() => {
    if (!isPlayingRef.current) return;

    const currentTime = performance.now();
    const context: TextAnimationContext = {
      currentTime,
      startTime: startTimeRef.current,
      duration: animationConfig.duration,
      staggerDelay: animationConfig.staggerDelay,
      ...(audioData !== undefined ? { audioData } : {}),
      theme: configRef.current.theme,
    };

    // Update animation states and get animated characters
    const updatedCharacters = animationService.updateAnimation(
      layerId,
      characters,
      context,
      animationConfig
    );

    setAnimatedCharacters(updatedCharacters);

    // Check if animation is complete
    const animationComplete = animationService.isAnimationComplete(layerId);
    const totalTime = currentTime - startTimeRef.current;
    const maxDuration =
      animationConfig.duration +
      characters.length * animationConfig.staggerDelay;

    if (animationComplete || totalTime >= maxDuration) {
      setIsComplete(true);
      setProgress(1);

      if (animationConfig.loop && !animationComplete) {
        // Restart animation for looping
        startTimeRef.current = currentTime;
        animationService.resetAnimation(layerId);
        setIsComplete(false);
        setProgress(0);
      } else {
        // Animation finished
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }
    } else {
      // Calculate overall progress
      const overallProgress = Math.min(totalTime / maxDuration, 1);
      setProgress(overallProgress);
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateAnimation);
  }, [layerId, characters, animationConfig, audioData, animationService]);

  /**
   * Start or restart the animation
   */
  const startAnimation = useCallback(() => {
    if (isPlayingRef.current) return;

    startTimeRef.current = performance.now();
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsComplete(false);
    setProgress(0);

    // Initialize animation states
    animationService.initializeAnimation(layerId, characters, animationConfig);

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updateAnimation);
  }, [layerId, characters, animationConfig, animationService, updateAnimation]);

  /**
   * Pause the animation
   */
  const pauseAnimation = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  /**
   * Reset the animation to the beginning
   */
  const resetAnimation = useCallback(() => {
    pauseAnimation();
    animationService.resetAnimation(layerId);
    setAnimatedCharacters(characters);
    setIsComplete(false);
    setProgress(0);
  }, [layerId, characters, animationService, pauseAnimation]);

  /**
   * Update animation configuration
   */
  const setConfig = useCallback(
    (newConfig: Partial<UseRadialTextAnimationConfig>) => {
      configRef.current = { ...configRef.current, ...newConfig };

      // If currently playing, restart with new config
      if (isPlayingRef.current) {
        pauseAnimation();
        setTimeout(() => startAnimation(), 50); // Small delay to ensure clean restart
      }
    },
    [pauseAnimation, startAnimation]
  );

  // Auto-start animation if configured
  useEffect(() => {
    if (initialConfig.autoStart && characters.length > 0) {
      startAnimation();
    }
  }, [initialConfig.autoStart, characters.length, startAnimation]);

  // Update characters when prop changes
  useEffect(() => {
    if (!isPlayingRef.current) {
      setAnimatedCharacters(characters);
    }
  }, [characters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationService.cleanupAnimation(layerId);
    };
  }, [layerId, animationService]);

  // Update config reference
  useEffect(() => {
    configRef.current = initialConfig;
  }, [initialConfig]);

  return {
    animatedCharacters,
    isPlaying,
    isComplete,
    progress,
    startAnimation,
    pauseAnimation,
    resetAnimation,
    setConfig,
  };
}

export default useRadialTextAnimation;
