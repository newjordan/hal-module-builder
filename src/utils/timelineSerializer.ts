import {
  AnimationTimeline,
  TimelineTrack,
  TimelineKeyframe,
  EasingFunction,
} from '../hooks/useTimelineManager';
import {
  AnimationSequence,
  AnimationStep,
} from '../hooks/useAnimationOrchestrator';
import { Layer } from '../types/layer-types';

/**
 * Serializable timeline format for export/import
 */
export interface SerializableTimeline {
  version: string;
  metadata: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    duration: number;
    frameRate: number;
    author?: string;
    tags?: string[];
  };
  timeline: {
    id: string;
    name: string;
    duration: number;
    tracks: SerializableTrack[];
    settings: {
      zoom: number;
      viewStart: number;
      viewEnd: number;
      loop: boolean;
    };
  };
  layers: SerializableLayer[];
  sequences?: SerializableSequence[];
}

/**
 * Serializable track format
 */
export interface SerializableTrack {
  id: string;
  layerId: string;
  property: string;
  keyframes: SerializableKeyframe[];
  settings: {
    muted: boolean;
    solo: boolean;
    locked: boolean;
    color?: string;
  };
}

/**
 * Serializable keyframe format
 */
export interface SerializableKeyframe {
  id: string;
  time: number;
  value: any;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';
  easingParams?: number[]; // For custom bezier curves
}

/**
 * Serializable layer format (minimal for animation data)
 */
export interface SerializableLayer {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

/**
 * Serializable sequence format
 */
export interface SerializableSequence {
  id: string;
  name: string;
  description?: string;
  duration: number;
  steps: SerializableAnimationStep[];
  settings: {
    loop: boolean;
    autoplay: boolean;
  };
}

/**
 * Serializable animation step
 */
export interface SerializableAnimationStep {
  id: string;
  layerId: string;
  startTime: number;
  duration: number;
  property: string;
  fromValue: any;
  toValue: any;
  easing: string;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
}

/**
 * Timeline serializer class for handling export/import operations
 */
export class TimelineSerializer {
  private static readonly VERSION = '1.0.0';
  private static readonly SUPPORTED_VERSIONS = ['1.0.0'];

  /**
   * Export timeline to serializable format
   */
  static exportTimeline(
    timeline: AnimationTimeline,
    layers: Layer[],
    sequences?: AnimationSequence[],
    metadata?: Partial<SerializableTimeline['metadata']>
  ): SerializableTimeline {
    const now = new Date().toISOString();

    const metadataObj: SerializableTimeline['metadata'] = {
      name: timeline.name,
      createdAt: metadata?.createdAt || now,
      updatedAt: now,
      duration: timeline.duration,
      frameRate: 60,
    };
    if (metadata?.description !== undefined)
      metadataObj.description = metadata.description;
    if (metadata?.author !== undefined) metadataObj.author = metadata.author;
    if (metadata?.tags !== undefined) metadataObj.tags = metadata.tags;
    else metadataObj.tags = [];

    const serializable: SerializableTimeline = {
      version: this.VERSION,
      metadata: metadataObj,
      timeline: {
        id: timeline.id,
        name: timeline.name,
        duration: timeline.duration,
        tracks: timeline.tracks.map(track => this.serializeTrack(track)),
        settings: {
          zoom: timeline.zoom,
          viewStart: timeline.viewStart,
          viewEnd: timeline.viewEnd,
          loop: timeline.loop,
        },
      },
      layers: layers.map(layer => this.serializeLayer(layer)),
    };
    if (sequences !== undefined) {
      serializable.sequences = sequences.map(seq =>
        this.serializeSequence(seq)
      );
    }

    return serializable;
  }

  /**
   * Import timeline from serializable format
   */
  static importTimeline(data: SerializableTimeline): {
    timeline: AnimationTimeline;
    layers: Partial<Layer>[];
    sequences?: AnimationSequence[];
  } {
    // Version validation
    if (!this.SUPPORTED_VERSIONS.includes(data.version)) {
      throw new Error(`Unsupported timeline version: ${data.version}`);
    }

    // Deserialize timeline
    const timeline: AnimationTimeline = {
      id: data.timeline.id,
      name: data.timeline.name,
      duration: data.timeline.duration,
      currentTime: 0,
      tracks: data.timeline.tracks.map(track => this.deserializeTrack(track)),
      playbackState: 'stopped',
      loop: data.timeline.settings.loop,
      selectedKeyframes: [],
      zoom: data.timeline.settings.zoom,
      viewStart: data.timeline.settings.viewStart,
      viewEnd: data.timeline.settings.viewEnd,
    };

    // Deserialize layers
    const layers = data.layers.map(layer => this.deserializeLayer(layer));

    // Deserialize sequences (optional)
    const sequences = data.sequences?.map(seq => this.deserializeSequence(seq));

    const result: {
      timeline: AnimationTimeline;
      layers: Partial<Layer>[];
      sequences?: AnimationSequence[];
    } = { timeline, layers };
    if (sequences !== undefined) {
      result.sequences = sequences;
    }
    return result;
  }

  /**
   * Export timeline to JSON string
   */
  static exportToJSON(
    timeline: AnimationTimeline,
    layers: Layer[],
    sequences?: AnimationSequence[],
    metadata?: Partial<SerializableTimeline['metadata']>
  ): string {
    const serializable = this.exportTimeline(
      timeline,
      layers,
      sequences,
      metadata
    );
    return JSON.stringify(serializable, null, 2);
  }

  /**
   * Import timeline from JSON string
   */
  static importFromJSON(jsonString: string): {
    timeline: AnimationTimeline;
    layers: Partial<Layer>[];
    sequences?: AnimationSequence[];
  } {
    try {
      const data = JSON.parse(jsonString) as SerializableTimeline;
      return this.importTimeline(data);
    } catch (error) {
      throw new Error(`Invalid timeline JSON: ${error}`);
    }
  }

  /**
   * Export timeline to file download
   */
  static exportToFile(
    timeline: AnimationTimeline,
    layers: Layer[],
    sequences?: AnimationSequence[],
    metadata?: Partial<SerializableTimeline['metadata']>,
    filename?: string
  ): void {
    const json = this.exportToJSON(timeline, layers, sequences, metadata);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download =
      filename || `${timeline.name.replace(/\s+/g, '_')}_timeline.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import timeline from file
   */
  static importFromFile(file: File): Promise<{
    timeline: AnimationTimeline;
    layers: Partial<Layer>[];
    sequences?: AnimationSequence[];
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const result = this.importFromJSON(content);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Serialize track to portable format
   */
  private static serializeTrack(track: TimelineTrack): SerializableTrack {
    return {
      id: track.id,
      layerId: track.layerId,
      property: track.property,
      keyframes: track.keyframes.map(kf => this.serializeKeyframe(kf)),
      settings: {
        muted: track.muted ?? false,
        solo: track.solo ?? false,
        locked: track.locked ?? false,
        ...(track.color !== undefined && { color: track.color }),
      },
    };
  }

  /**
   * Deserialize track from portable format
   */
  private static deserializeTrack(data: SerializableTrack): TimelineTrack {
    const result: TimelineTrack = {
      id: data.id,
      layerId: data.layerId,
      property: data.property as keyof Layer,
      keyframes: data.keyframes.map(kf => this.deserializeKeyframe(kf)),
      muted: data.settings.muted ?? false,
      solo: data.settings.solo ?? false,
      locked: data.settings.locked ?? false,
    };
    if (data.settings.color !== undefined) {
      result.color = data.settings.color;
    }
    return result;
  }

  /**
   * Serialize keyframe to portable format
   */
  private static serializeKeyframe(
    keyframe: TimelineKeyframe
  ): SerializableKeyframe {
    const easingMap: Record<string, SerializableKeyframe['easing']> = {
      'cubic-bezier': 'bezier',
    };
    return {
      id: keyframe.id,
      time: keyframe.time,
      value: this.serializeValue(keyframe.value),
      easing:
        easingMap[keyframe.easing] ??
        (keyframe.easing as SerializableKeyframe['easing']),
    };
  }

  /**
   * Deserialize keyframe from portable format
   */
  private static deserializeKeyframe(
    data: SerializableKeyframe
  ): TimelineKeyframe {
    const easingMap: Record<string, EasingFunction> = {
      bezier: 'cubic-bezier',
    };
    return {
      id: data.id,
      time: data.time,
      value: this.deserializeValue(data.value),
      easing: easingMap[data.easing] ?? (data.easing as EasingFunction),
    };
  }

  /**
   * Serialize layer to minimal format for animation data
   */
  private static serializeLayer(layer: Layer): SerializableLayer {
    return {
      id: layer.id,
      name: layer.name,
      type: layer.type,
      properties: this.extractAnimatableProperties(layer),
    };
  }

  /**
   * Deserialize layer from minimal format
   */
  private static deserializeLayer(data: SerializableLayer): Partial<Layer> {
    return {
      id: data.id,
      name: data.name,
      type: data.type as any,
      ...data.properties,
    };
  }

  /**
   * Serialize sequence to portable format
   */
  private static serializeSequence(
    sequence: AnimationSequence
  ): SerializableSequence {
    const result: SerializableSequence = {
      id: sequence.id,
      name: sequence.name,
      duration: sequence.duration,
      steps: sequence.sequences.map(step => this.serializeAnimationStep(step)),
      settings: {
        loop: sequence.loop || false,
        autoplay: sequence.autoplay || false,
      },
    };
    if (sequence.description !== undefined) {
      result.description = sequence.description;
    }
    return result;
  }

  /**
   * Deserialize sequence from portable format
   */
  private static deserializeSequence(
    data: SerializableSequence
  ): AnimationSequence {
    const result: AnimationSequence = {
      id: data.id,
      name: data.name,
      duration: data.duration,
      layers: [], // Will need to be populated externally
      sequences: data.steps.map(step => this.deserializeAnimationStep(step)),
      loop: data.settings.loop,
      autoplay: data.settings.autoplay,
    };
    if (data.description !== undefined) {
      result.description = data.description;
    }
    return result;
  }

  /**
   * Serialize animation step to portable format
   */
  private static serializeAnimationStep(
    step: AnimationStep
  ): SerializableAnimationStep {
    const result: SerializableAnimationStep = {
      id: step.id,
      layerId: step.layerId,
      startTime: step.startTime,
      duration: step.duration,
      property: step.property as string,
      fromValue: this.serializeValue(step.fromValue),
      toValue: this.serializeValue(step.toValue),
      easing: step.easing || 'linear',
    };
    if (step.delay !== undefined) result.delay = step.delay;
    if (step.repeat !== undefined) result.repeat = step.repeat;
    if (step.yoyo !== undefined) result.yoyo = step.yoyo;
    return result;
  }

  /**
   * Deserialize animation step from portable format
   */
  private static deserializeAnimationStep(
    data: SerializableAnimationStep
  ): AnimationStep {
    const result: AnimationStep = {
      id: data.id,
      layerId: data.layerId,
      startTime: data.startTime,
      duration: data.duration,
      property: data.property as keyof Layer,
      fromValue: this.deserializeValue(data.fromValue),
      toValue: this.deserializeValue(data.toValue),
    };
    if (data.easing)
      result.easing = data.easing as
        | 'linear'
        | 'ease-in'
        | 'ease-out'
        | 'ease-in-out'
        | 'bounce'
        | 'elastic';
    if (data.delay !== undefined) result.delay = data.delay;
    if (data.repeat !== undefined) result.repeat = data.repeat;
    if (data.yoyo !== undefined) result.yoyo = data.yoyo;
    return result;
  }

  /**
   * Serialize complex values (colors, gradients, etc.)
   */
  private static serializeValue(value: any): any {
    // Handle different value types for safe serialization
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'object') {
      // Handle Date objects
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }

      // Handle RegExp
      if (value instanceof RegExp) {
        return { __type: 'RegExp', source: value.source, flags: value.flags };
      }

      // Handle functions (convert to string - limited usefulness)
      if (typeof value === 'function') {
        return { __type: 'Function', source: value.toString() };
      }

      // Recursively serialize objects
      const serialized: any = {};
      for (const [key, val] of Object.entries(value)) {
        serialized[key] = this.serializeValue(val);
      }
      return serialized;
    }

    return value;
  }

  /**
   * Deserialize complex values
   */
  private static deserializeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'object' && value.__type) {
      switch (value.__type) {
        case 'Date':
          return new Date(value.value);
        case 'RegExp':
          return new RegExp(value.source, value.flags);
        case 'Function':
          // Functions can't be safely deserialized - return a no-op
          console.warn(
            'Function deserialization is not safe - returning no-op function'
          );
          return () => {};
        default:
          return value;
      }
    }

    if (typeof value === 'object') {
      const deserialized: any = {};
      for (const [key, val] of Object.entries(value)) {
        deserialized[key] = this.deserializeValue(val);
      }
      return deserialized;
    }

    return value;
  }

  /**
   * Extract only animatable properties from layer
   */
  private static extractAnimatableProperties(
    layer: Layer
  ): Record<string, any> {
    const animatableProps = [
      'visible',
      'opacity',
      'scale',
      'rotation',
      'offsetX',
      'offsetY',
      'color',
      'brightness',
      'contrast',
      'glowIntensity',
      'glowColor',
    ];

    const extracted: Record<string, any> = {};
    animatableProps.forEach(prop => {
      if (prop in layer) {
        extracted[prop] = (layer as any)[prop];
      }
    });

    return extracted;
  }

  /**
   * Validate timeline data structure
   */
  static validateTimelineData(data: any): data is SerializableTimeline {
    try {
      return (
        data &&
        typeof data === 'object' &&
        typeof data.version === 'string' &&
        this.SUPPORTED_VERSIONS.includes(data.version) &&
        data.metadata &&
        typeof data.metadata === 'object' &&
        data.timeline &&
        typeof data.timeline === 'object' &&
        Array.isArray(data.layers) &&
        (!data.sequences || Array.isArray(data.sequences))
      );
    } catch {
      return false;
    }
  }

  /**
   * Create empty timeline template
   */
  static createEmptyTimeline(
    name: string = 'New Timeline'
  ): SerializableTimeline {
    const now = new Date().toISOString();

    return {
      version: this.VERSION,
      metadata: {
        name,
        createdAt: now,
        updatedAt: now,
        duration: 5000,
        frameRate: 60,
      },
      timeline: {
        id: `timeline_${Date.now()}`,
        name,
        duration: 5000,
        tracks: [],
        settings: {
          zoom: 1,
          viewStart: 0,
          viewEnd: 5000,
          loop: false,
        },
      },
      layers: [],
      sequences: [],
    };
  }
}

export default TimelineSerializer;
