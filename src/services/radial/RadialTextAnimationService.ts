/**
 * HAL Radial Text Animation Service
 * ==================================
 *
 * Professional text animation service for radial text with timeline integration.
 * Handles character-level animations including typewriter, spiral, wave, and fade effects.
 * Integrates with existing AnimationEngine for 60fps performance.
 *
 * Single Responsibility: Text animation calculations and timeline management only.
 *
 * @version 1.0.0
 * @requires AnimationEngine
 */

import {
  RadialTextCharacter,
  RadialTextAnimationType,
  FrostTheme,
} from '../../types/radial-text-types';

/**
 * Animation context for text animations
 * Provides timing and environment data for animation calculations
 */
export interface TextAnimationContext {
  /** Current animation time in milliseconds */
  currentTime: number;
  /** Animation start time in milliseconds */
  startTime: number;
  /** Total animation duration in milliseconds */
  duration: number;
  /** Delay between character animations */
  staggerDelay: number;
  /** Audio data for reactive animations (optional) */
  audioData?: Float32Array;
  /** MANDATORY frost_glass.css theme */
  theme: FrostTheme;
}

/**
 * Animation state for a character
 * Tracks the animation progress and properties for individual characters
 */
export interface CharacterAnimationState {
  /** Character index */
  index: number;
  /** Animation start time for this character */
  startTime: number;
  /** Current animation progress (0-1) */
  progress: number;
  /** Whether this character's animation has started */
  hasStarted: boolean;
  /** Whether this character's animation has completed */
  isComplete: boolean;
  /** Current opacity value */
  opacity: number;
  /** Current scale value */
  scale: number;
  /** Current rotation offset (radians) */
  rotationOffset: number;
  /** Current position offset */
  positionOffset: { x: number; y: number };
}

/**
 * Animation configuration for text sequences
 */
export interface TextAnimationConfig {
  /** Type of animation to perform */
  type: RadialTextAnimationType;
  /** Total duration of the animation sequence */
  duration: number;
  /** Delay between character animations */
  staggerDelay: number;
  /** Enable reverse animation (out effect) */
  reverse: boolean;
  /** Animation easing function */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  /** Loop the animation */
  loop: boolean;
}

/**
 * Radial Text Animation Service
 * Manages character-level animations for radial text with integration to AnimationEngine
 */
export class RadialTextAnimationService {
  private static instance: RadialTextAnimationService | null = null;
  private animationStates: Map<string, Map<number, CharacterAnimationState>> =
    new Map();

  private constructor() {
    // Singleton pattern following existing service design
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RadialTextAnimationService {
    if (!RadialTextAnimationService.instance) {
      RadialTextAnimationService.instance = new RadialTextAnimationService();
    }
    return RadialTextAnimationService.instance;
  }

  /**
   * Initialize animation for a text layer
   * Sets up animation states for all characters
   */
  initializeAnimation(
    layerId: string,
    characters: RadialTextCharacter[],
    config: TextAnimationConfig
  ): void {
    const characterStates = new Map<number, CharacterAnimationState>();

    characters.forEach((character, index) => {
      const characterStartTime = config.staggerDelay * index;

      characterStates.set(character.index, {
        index: character.index,
        startTime: characterStartTime,
        progress: 0,
        hasStarted: false,
        isComplete: false,
        opacity: config.type === 'none' ? 1 : 0, // Start hidden for animations
        scale: 1,
        rotationOffset: 0,
        positionOffset: { x: 0, y: 0 },
      });
    });

    this.animationStates.set(layerId, characterStates);
  }

  /**
   * Update animation states for all characters in a layer
   * Returns updated characters with animation properties applied
   */
  updateAnimation(
    layerId: string,
    characters: RadialTextCharacter[],
    context: TextAnimationContext,
    config: TextAnimationConfig
  ): RadialTextCharacter[] {
    const characterStates = this.animationStates.get(layerId);
    if (!characterStates) {
      return characters; // No animation states initialized
    }

    const animationTime = context.currentTime - context.startTime;

    return characters.map(character => {
      const state = characterStates.get(character.index);
      if (!state) return character;

      // Calculate if this character's animation should start
      const characterAnimationTime = animationTime - state.startTime;

      if (characterAnimationTime >= 0 && !state.hasStarted) {
        state.hasStarted = true;
      }

      if (!state.hasStarted) {
        return { ...character, visible: false, opacity: 0 };
      }

      // Calculate animation progress
      const effectiveDuration = context.duration - state.startTime;
      state.progress = Math.min(characterAnimationTime / effectiveDuration, 1);

      if (state.progress >= 1 && !state.isComplete) {
        state.isComplete = true;
      }

      // Apply animation type-specific effects
      const animatedProperties = this.calculateAnimationProperties(
        character,
        state,
        config,
        context
      );

      // Update state with calculated properties
      state.opacity = animatedProperties.opacity;
      state.scale = animatedProperties.scale;
      state.rotationOffset = animatedProperties.rotationOffset;
      state.positionOffset = animatedProperties.positionOffset;

      // Return updated character
      return {
        ...character,
        opacity: animatedProperties.opacity,
        scale: animatedProperties.scale,
        rotation: character.rotation + animatedProperties.rotationOffset,
        position: {
          ...character.position,
          x: character.position.x + animatedProperties.positionOffset.x,
          y: character.position.y + animatedProperties.positionOffset.y,
        },
        visible: animatedProperties.opacity > 0,
      };
    });
  }

  /**
   * Calculate animation properties based on animation type and progress
   */
  private calculateAnimationProperties(
    character: RadialTextCharacter,
    state: CharacterAnimationState,
    config: TextAnimationConfig,
    context: TextAnimationContext
  ): {
    opacity: number;
    scale: number;
    rotationOffset: number;
    positionOffset: { x: number; y: number };
  } {
    const easedProgress = this.applyEasing(state.progress, config.easing);

    switch (config.type) {
      case 'typewriter':
        return this.calculateTypewriterAnimation(
          character,
          state,
          easedProgress,
          context
        );

      case 'spiral-in':
        return this.calculateSpiralInAnimation(
          character,
          state,
          easedProgress,
          context
        );

      case 'fade-sequential':
        return this.calculateFadeSequentialAnimation(
          character,
          state,
          easedProgress,
          context
        );

      case 'wave':
        return this.calculateWaveAnimation(
          character,
          state,
          easedProgress,
          context
        );

      case 'none':
      default:
        return {
          opacity: 1,
          scale: 1,
          rotationOffset: 0,
          positionOffset: { x: 0, y: 0 },
        };
    }
  }

  /**
   * Typewriter animation - characters appear sequentially with typing effect
   */
  private calculateTypewriterAnimation(
    character: RadialTextCharacter,
    _state: CharacterAnimationState,
    progress: number,
    context: TextAnimationContext
  ): {
    opacity: number;
    scale: number;
    rotationOffset: number;
    positionOffset: { x: number; y: number };
  } {
    // Quick snap-in effect for typewriter
    const opacity = progress > 0.1 ? 1 : 0;
    const scale = progress > 0.1 ? 1 + (1 - progress) * 0.3 : 0.8; // Slight bounce effect

    // Optional audio reactivity for typing speed
    let audioInfluence = 1;
    if (context.audioData && context.audioData.length > 0) {
      const audioIndex = character.index % context.audioData.length;
      audioInfluence = 0.5 + ((context.audioData[audioIndex] ?? 0) / 255) * 0.5;
    }

    return {
      opacity: opacity * audioInfluence,
      scale: scale * audioInfluence,
      rotationOffset: 0,
      positionOffset: { x: 0, y: 0 },
    };
  }

  /**
   * Spiral-in animation - characters spiral inward from outer radius
   */
  private calculateSpiralInAnimation(
    character: RadialTextCharacter,
    _state: CharacterAnimationState,
    progress: number,
    _context: TextAnimationContext
  ): {
    opacity: number;
    scale: number;
    rotationOffset: number;
    positionOffset: { x: number; y: number };
  } {
    const opacity = progress;
    const scale = 0.2 + progress * 0.8;

    // Spiral effect: characters start further out and rotate in
    const spiralRotation = (1 - progress) * Math.PI * 2; // One full rotation
    const spiralDistance = (1 - progress) * 100; // Start 100px further out

    const positionOffset = {
      x: Math.cos(character.position.angle + spiralRotation) * spiralDistance,
      y: Math.sin(character.position.angle + spiralRotation) * spiralDistance,
    };

    return {
      opacity,
      scale,
      rotationOffset: spiralRotation,
      positionOffset,
    };
  }

  /**
   * Fade-sequential animation - characters fade in sequentially
   */
  private calculateFadeSequentialAnimation(
    _character: RadialTextCharacter,
    _state: CharacterAnimationState,
    progress: number,
    _context: TextAnimationContext
  ): {
    opacity: number;
    scale: number;
    rotationOffset: number;
    positionOffset: { x: number; y: number };
  } {
    const opacity = progress;
    const scale = 0.8 + progress * 0.2; // Slight scale-in effect

    return {
      opacity,
      scale,
      rotationOffset: 0,
      positionOffset: { x: 0, y: 0 },
    };
  }

  /**
   * Wave animation - characters animate with wave-like motion
   */
  private calculateWaveAnimation(
    character: RadialTextCharacter,
    _state: CharacterAnimationState,
    progress: number,
    context: TextAnimationContext
  ): {
    opacity: number;
    scale: number;
    rotationOffset: number;
    positionOffset: { x: number; y: number };
  } {
    const opacity = progress;

    // Wave effect based on character position and time
    const waveTime = (context.currentTime - context.startTime) * 0.005;
    const wavePhase = character.index * 0.5 + waveTime;
    const waveAmplitude = progress * 20; // Amplitude grows with progress

    const scale = 1 + Math.sin(wavePhase) * 0.2 * progress;
    const positionOffset = {
      x: Math.cos(wavePhase) * waveAmplitude,
      y: Math.sin(wavePhase) * waveAmplitude,
    };

    return {
      opacity,
      scale,
      rotationOffset: Math.sin(wavePhase) * 0.1,
      positionOffset,
    };
  }

  /**
   * Apply easing function to progress value
   */
  private applyEasing(
    progress: number,
    easing: TextAnimationConfig['easing']
  ): number {
    switch (easing) {
      case 'ease-in':
        return progress * progress;

      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);

      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      case 'bounce':
        if (progress < 1 / 2.75) {
          return 7.5625 * progress * progress;
        } else if (progress < 2 / 2.75) {
          return 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75;
        } else if (progress < 2.5 / 2.75) {
          return 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375;
        } else {
          return 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375;
        }

      case 'linear':
      default:
        return progress;
    }
  }

  /**
   * Check if animation is complete for a layer
   */
  isAnimationComplete(layerId: string): boolean {
    const characterStates = this.animationStates.get(layerId);
    if (!characterStates) return true;

    for (const state of characterStates.values()) {
      if (!state.isComplete) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reset animation for a layer
   */
  resetAnimation(layerId: string): void {
    const characterStates = this.animationStates.get(layerId);
    if (!characterStates) return;

    characterStates.forEach(state => {
      state.progress = 0;
      state.hasStarted = false;
      state.isComplete = false;
      state.opacity = 0;
      state.scale = 1;
      state.rotationOffset = 0;
      state.positionOffset = { x: 0, y: 0 };
    });
  }

  /**
   * Clean up animation states for a layer
   */
  cleanupAnimation(layerId: string): void {
    this.animationStates.delete(layerId);
  }

  /**
   * Get current animation progress for debugging
   */
  getAnimationProgress(layerId: string): {
    totalProgress: number;
    characterProgresses: Array<{ index: number; progress: number }>;
  } {
    const characterStates = this.animationStates.get(layerId);
    if (!characterStates) {
      return { totalProgress: 1, characterProgresses: [] };
    }

    const progresses = Array.from(characterStates.values());
    const totalProgress =
      progresses.reduce((sum, state) => sum + state.progress, 0) /
      progresses.length;

    const characterProgresses = progresses.map(state => ({
      index: state.index,
      progress: state.progress,
    }));

    return { totalProgress, characterProgresses };
  }
}

export default RadialTextAnimationService;
