/**
 * HAL Radial Text Timeline Service
 * ================================
 *
 * Advanced timeline management for character-level animation sequencing.
 * Provides keyframe-based animation with precise timing control.
 *
 * Single Responsibility: Timeline management and keyframe interpolation only.
 *
 * @version 1.0.0
 * @requires RadialTextAnimationService
 */

import { RadialTextCharacter, FrostTheme } from '../../types/radial-text-types';

/**
 * Keyframe definition for character animations
 */
export interface AnimationKeyframe {
  /** Time position in the timeline (0-1) */
  time: number;
  /** Character opacity at this keyframe */
  opacity?: number;
  /** Character scale at this keyframe */
  scale?: number;
  /** Character rotation offset at this keyframe */
  rotationOffset?: number;
  /** Character position offset at this keyframe */
  positionOffset?: { x: number; y: number };
  /** Easing function for interpolation to this keyframe */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

/**
 * Timeline track for a single character
 */
export interface CharacterTimelineTrack {
  /** Character index this track applies to */
  characterIndex: number;
  /** Array of keyframes for this character */
  keyframes: AnimationKeyframe[];
  /** Whether this track is enabled */
  enabled: boolean;
}

/**
 * Complete timeline definition for text animation
 */
export interface RadialTextTimeline {
  /** Unique identifier for this timeline */
  id: string;
  /** Timeline name for UI display */
  name: string;
  /** Total duration in milliseconds */
  duration: number;
  /** Timeline tracks for each character */
  tracks: CharacterTimelineTrack[];
  /** Whether the timeline should loop */
  loop: boolean;
  /** MANDATORY frost_glass.css theme */
  theme: FrostTheme;
}

/**
 * Timeline playback state
 */
export interface TimelinePlaybackState {
  /** Timeline being played */
  timelineId: string;
  /** Current playback time in milliseconds */
  currentTime: number;
  /** Whether timeline is currently playing */
  isPlaying: boolean;
  /** Whether timeline has completed */
  isComplete: boolean;
  /** Playback start time (performance.now()) */
  startTime: number;
  /** Playback speed multiplier */
  speed: number;
}

/**
 * Timeline event for callbacks
 */
export interface TimelineEvent {
  /** Event type */
  type: 'start' | 'pause' | 'resume' | 'complete' | 'loop' | 'keyframe';
  /** Timeline ID */
  timelineId: string;
  /** Current time when event occurred */
  time: number;
  /** Additional event data */
  data?: any;
}

/**
 * Radial Text Timeline Service
 * Manages complex character animation sequences with keyframe precision
 */
export class RadialTextTimelineService {
  private static instance: RadialTextTimelineService | null = null;
  private timelines: Map<string, RadialTextTimeline> = new Map();
  private playbackStates: Map<string, TimelinePlaybackState> = new Map();
  private eventCallbacks: Map<string, ((event: TimelineEvent) => void)[]> =
    new Map();

  private constructor() {
    // Singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RadialTextTimelineService {
    if (!RadialTextTimelineService.instance) {
      RadialTextTimelineService.instance = new RadialTextTimelineService();
    }
    return RadialTextTimelineService.instance;
  }

  /**
   * Create a new timeline
   */
  createTimeline(
    id: string,
    name: string,
    characters: RadialTextCharacter[],
    duration: number,
    theme: FrostTheme
  ): RadialTextTimeline {
    const timeline: RadialTextTimeline = {
      id,
      name,
      duration,
      loop: false,
      theme,
      tracks: characters.map(character => ({
        characterIndex: character.index,
        keyframes: [
          // Default start keyframe
          {
            time: 0,
            opacity: 0,
            scale: 1,
            rotationOffset: 0,
            positionOffset: { x: 0, y: 0 },
            easing: 'ease-out',
          },
          // Default end keyframe
          {
            time: 1,
            opacity: 1,
            scale: 1,
            rotationOffset: 0,
            positionOffset: { x: 0, y: 0 },
            easing: 'ease-out',
          },
        ],
        enabled: true,
      })),
    };

    this.timelines.set(id, timeline);
    return timeline;
  }

  /**
   * Get timeline by ID
   */
  getTimeline(id: string): RadialTextTimeline | null {
    return this.timelines.get(id) || null;
  }

  /**
   * Add keyframe to character track
   */
  addKeyframe(
    timelineId: string,
    characterIndex: number,
    keyframe: AnimationKeyframe
  ): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return false;

    const track = timeline.tracks.find(
      t => t.characterIndex === characterIndex
    );
    if (!track) return false;

    // Insert keyframe at correct time position
    let insertIndex = track.keyframes.length;
    for (let i = 0; i < track.keyframes.length; i++) {
      if (track.keyframes[i]!.time > keyframe.time) {
        insertIndex = i;
        break;
      }
    }

    track.keyframes.splice(insertIndex, 0, keyframe);
    return true;
  }

  /**
   * Remove keyframe from character track
   */
  removeKeyframe(
    timelineId: string,
    characterIndex: number,
    time: number,
    tolerance: number = 0.001
  ): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return false;

    const track = timeline.tracks.find(
      t => t.characterIndex === characterIndex
    );
    if (!track) return false;

    const keyframeIndex = track.keyframes.findIndex(
      k => Math.abs(k.time - time) <= tolerance
    );

    if (keyframeIndex >= 0) {
      track.keyframes.splice(keyframeIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Start timeline playback
   */
  startTimeline(timelineId: string, speed: number = 1): boolean {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) return false;

    const playbackState: TimelinePlaybackState = {
      timelineId,
      currentTime: 0,
      isPlaying: true,
      isComplete: false,
      startTime: performance.now(),
      speed,
    };

    this.playbackStates.set(timelineId, playbackState);
    this.fireEvent({ type: 'start', timelineId, time: 0 });
    return true;
  }

  /**
   * Pause timeline playback
   */
  pauseTimeline(timelineId: string): boolean {
    const state = this.playbackStates.get(timelineId);
    if (!state || !state.isPlaying) return false;

    state.isPlaying = false;
    this.fireEvent({ type: 'pause', timelineId, time: state.currentTime });
    return true;
  }

  /**
   * Resume timeline playback
   */
  resumeTimeline(timelineId: string): boolean {
    const state = this.playbackStates.get(timelineId);
    if (!state || state.isPlaying) return false;

    state.isPlaying = true;
    state.startTime = performance.now() - state.currentTime / state.speed;
    this.fireEvent({ type: 'resume', timelineId, time: state.currentTime });
    return true;
  }

  /**
   * Stop and reset timeline playback
   */
  stopTimeline(timelineId: string): boolean {
    const state = this.playbackStates.get(timelineId);
    if (!state) return false;

    this.playbackStates.delete(timelineId);
    return true;
  }

  /**
   * Update timeline and get current character states
   */
  updateTimeline(
    timelineId: string,
    characters: RadialTextCharacter[]
  ): RadialTextCharacter[] {
    const timeline = this.timelines.get(timelineId);
    const state = this.playbackStates.get(timelineId);

    if (!timeline || !state || !state.isPlaying) {
      return characters;
    }

    // Calculate current time
    const now = performance.now();
    const elapsedTime = (now - state.startTime) * state.speed;
    state.currentTime = elapsedTime;

    // Check if timeline is complete
    if (elapsedTime >= timeline.duration) {
      if (timeline.loop) {
        // Restart timeline
        state.startTime = now;
        state.currentTime = 0;
        this.fireEvent({ type: 'loop', timelineId, time: 0 });
      } else {
        // Complete timeline
        state.isComplete = true;
        state.isPlaying = false;
        this.fireEvent({
          type: 'complete',
          timelineId,
          time: timeline.duration,
        });
        return characters;
      }
    }

    // Calculate normalized time (0-1)
    const normalizedTime = Math.min(elapsedTime / timeline.duration, 1);

    // Apply timeline to characters
    return characters.map(character => {
      const track = timeline.tracks.find(
        t => t.characterIndex === character.index
      );
      if (!track || !track.enabled) {
        return character;
      }

      // Find keyframes to interpolate between
      const currentKeyframe = this.getCurrentKeyframes(track, normalizedTime);
      if (!currentKeyframe) {
        return character;
      }

      const { prev, next, progress } = currentKeyframe;

      // Interpolate properties
      const interpolated = this.interpolateKeyframes(prev, next, progress);

      // Apply to character
      return {
        ...character,
        opacity: interpolated.opacity * character.opacity, // Multiply with base opacity
        scale: interpolated.scale * character.scale, // Multiply with base scale
        rotation: character.rotation + interpolated.rotationOffset,
        position: {
          ...character.position,
          x: character.position.x + interpolated.positionOffset.x,
          y: character.position.y + interpolated.positionOffset.y,
        },
        visible: interpolated.opacity > 0,
      };
    });
  }

  /**
   * Find current keyframes for interpolation
   */
  private getCurrentKeyframes(
    track: CharacterTimelineTrack,
    time: number
  ): {
    prev: AnimationKeyframe;
    next: AnimationKeyframe;
    progress: number;
  } | null {
    const keyframes = track.keyframes;
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) {
      return { prev: keyframes[0]!, next: keyframes[0]!, progress: 0 };
    }

    // Find surrounding keyframes
    let prevIndex = 0;
    let nextIndex = keyframes.length - 1;

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i]!.time <= time && keyframes[i + 1]!.time >= time) {
        prevIndex = i;
        nextIndex = i + 1;
        break;
      }
    }

    const prev = keyframes[prevIndex]!;
    const next = keyframes[nextIndex]!;
    const timeDiff = next.time - prev.time;
    const progress = timeDiff > 0 ? (time - prev.time) / timeDiff : 0;

    return { prev, next, progress };
  }

  /**
   * Interpolate between two keyframes
   */
  private interpolateKeyframes(
    prev: AnimationKeyframe,
    next: AnimationKeyframe,
    progress: number
  ): {
    opacity: number;
    scale: number;
    rotationOffset: number;
    positionOffset: { x: number; y: number };
  } {
    // Apply easing to progress
    const easedProgress = this.applyEasing(progress, next.easing || 'linear');

    return {
      opacity: this.lerp(prev.opacity || 0, next.opacity || 0, easedProgress),
      scale: this.lerp(prev.scale || 1, next.scale || 1, easedProgress),
      rotationOffset: this.lerp(
        prev.rotationOffset || 0,
        next.rotationOffset || 0,
        easedProgress
      ),
      positionOffset: {
        x: this.lerp(
          prev.positionOffset?.x || 0,
          next.positionOffset?.x || 0,
          easedProgress
        ),
        y: this.lerp(
          prev.positionOffset?.y || 0,
          next.positionOffset?.y || 0,
          easedProgress
        ),
      },
    };
  }

  /**
   * Linear interpolation between two values
   */
  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * Apply easing function to progress
   */
  private applyEasing(
    progress: number,
    easing: AnimationKeyframe['easing']
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
   * Add event listener for timeline events
   */
  addEventListener(
    timelineId: string,
    callback: (event: TimelineEvent) => void
  ): void {
    const callbacks = this.eventCallbacks.get(timelineId) || [];
    callbacks.push(callback);
    this.eventCallbacks.set(timelineId, callbacks);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    timelineId: string,
    callback: (event: TimelineEvent) => void
  ): void {
    const callbacks = this.eventCallbacks.get(timelineId) || [];
    const index = callbacks.indexOf(callback);
    if (index >= 0) {
      callbacks.splice(index, 1);
      this.eventCallbacks.set(timelineId, callbacks);
    }
  }

  /**
   * Fire timeline event
   */
  private fireEvent(event: TimelineEvent): void {
    const callbacks = this.eventCallbacks.get(event.timelineId) || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Timeline event callback error:', error);
      }
    });
  }

  /**
   * Get current playback state
   */
  getPlaybackState(timelineId: string): TimelinePlaybackState | null {
    return this.playbackStates.get(timelineId) || null;
  }

  /**
   * List all available timelines
   */
  getAvailableTimelines(): RadialTextTimeline[] {
    return Array.from(this.timelines.values());
  }

  /**
   * Clone timeline for editing
   */
  cloneTimeline(
    sourceId: string,
    newId: string,
    newName?: string
  ): RadialTextTimeline | null {
    const source = this.timelines.get(sourceId);
    if (!source) return null;

    const cloned: RadialTextTimeline = {
      ...source,
      id: newId,
      name: newName || `${source.name} (Copy)`,
      tracks: source.tracks.map(track => ({
        ...track,
        keyframes: track.keyframes.map(k => ({ ...k })),
      })),
    };

    this.timelines.set(newId, cloned);
    return cloned;
  }

  /**
   * Delete timeline
   */
  deleteTimeline(timelineId: string): boolean {
    this.stopTimeline(timelineId);
    this.eventCallbacks.delete(timelineId);
    return this.timelines.delete(timelineId);
  }
}

export default RadialTextTimelineService;
