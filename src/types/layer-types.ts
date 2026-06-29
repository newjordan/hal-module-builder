import type { BlendMode, EffectParameters } from '../assets/effects/IEffect';
import type { VisualizationConfig } from '../assets/equalizer/visualizations/IVisualization';

/**
 * Core layer interface for the HAL Module Builder
 *
 * Represents a single visual element in the project with support for multiple
 * layer types including images, shapes, effects, and audio visualizations.
 * Each layer can be transformed, styled, and animated independently.
 *
 * @interface Layer
 * @example
 * ```typescript
 * const backgroundLayer: Layer = {
 *   id: 'bg_001',
 *   name: 'Background Gradient',
 *   type: 'gradient',
 *   visible: true,
 *   opacity: 0.8,
 *   blendMode: 'normal',
 *   scale: 1.0,
 *   rotation: 0,
 *   offsetX: 0,
 *   offsetY: 0,
 *   gradient: {
 *     type: 'linear',
 *     colors: ['#ff0000', '#0000ff'],
 *     stops: [0, 1],
 *     angle: 45
 *   }
 * };
 * ```
 */

type EqualizerSettings = Partial<
  VisualizationConfig & {
    barStyle?:
      | 'bar'
      | 'line'
      | 'block'
      | 'dot'
      | 'triangle'
      | 'diamond'
      | 'hexagon'
      | 'circle';
    layout?: 'radial' | 'linear';
    barRotation?: number;
    radialRotation?: number;
    frequencyRange?: 'bass' | 'mid' | 'treble' | 'full';
    positionX?: number;
    positionY?: number;
    blockAlignment?: 'bottom' | 'center' | 'top';
    triangleOrientation?: 'up' | 'down' | 'alternating';
    lineWidth?: number;
    dotSize?: number;
    diamondSize?: number;
    hexSize?: number;
    circleRadius?: number;
    pulsingEffect?: boolean;
  }
>;

/**
 * Audio feature types that can drive reactive properties
 */
export type AudioFeature =
  | 'volume' // Overall volume (0-1)
  | 'bass' // Bass frequency level (0-1)
  | 'mid' // Mid frequency level (0-1)
  | 'treble' // Treble frequency level (0-1)
  | 'beat'; // Beat detection (0-1, spikes on beats)

/**
 * Layer properties that can be modulated by audio
 */
export type ReactiveProperty =
  | 'scale' // Uniform scale
  | 'opacity' // Layer opacity
  | 'rotation' // Rotation angle
  | 'glowIntensity' // Glow effect intensity
  | 'offsetX' // Horizontal position
  | 'offsetY' // Vertical position
  | 'strokeWidth' // Stroke/outline thickness
  | 'brightness' // CSS brightness filter (1 = normal)
  | 'hueRotate'; // CSS hue-rotate in degrees

/**
 * Mapping configuration from audio feature to layer property
 */
export interface AudioReactiveMapping {
  /** Audio feature to use as input */
  audioFeature: AudioFeature;
  /** Layer property to modulate */
  targetProperty: ReactiveProperty;
  /** Intensity/amount of modulation (0-1) */
  intensity: number;
  /** Frequency range for frequency-based features */
  frequencyRange?: 'bass' | 'mid' | 'treble' | 'full';
  /** Min value for the property */
  minValue?: number;
  /** Max value for the property */
  maxValue?: number;
  /** Smoothing factor (0-1, higher = smoother) */
  smoothing?: number;
}

export interface LayerShadowStyle {
  enabled: boolean;
  blendMode: BlendMode;
  color: string;
  opacity: number;
  angle: number;
  distance: number;
  spread: number;
  size: number;
  useGlobalLight?: boolean;
}

export interface LayerGlowStyle {
  enabled: boolean;
  blendMode: BlendMode;
  color: string;
  opacity: number;
  spread: number;
  size: number;
  range?: number;
  jitter?: number;
}

export interface LayerColorOverlay {
  enabled: boolean;
  blendMode: BlendMode;
  color: string;
  opacity: number;
}

export interface LayerGradientOverlay {
  enabled: boolean;
  blendMode: BlendMode;
  opacity: number;
  gradient: {
    type: 'linear' | 'radial' | 'conic';
    colors: string[];
    stops: number[];
    angle?: number;
    centerX?: number;
    centerY?: number;
  };
  scale?: number;
  alignWithLayer?: boolean;
  reverse?: boolean;
}

export interface LayerBevelEmboss {
  enabled: boolean;
  style:
    | 'innerBevel'
    | 'outerBevel'
    | 'emboss'
    | 'pillowEmboss'
    | 'strokeEmboss';
  technique: 'smooth' | 'chiselSoft' | 'chiselHard';
  depth: number;
  direction: 'up' | 'down';
  size: number;
  soften: number;
  angle: number;
  altitude: number;
  useGlobalLight?: boolean;
  highlightBlendMode: BlendMode;
  highlightColor: string;
  highlightOpacity: number;
  shadowBlendMode: BlendMode;
  shadowColor: string;
  shadowOpacity: number;
}

export interface Layer {
  /** Unique identifier for the layer */
  id: string;
  /** Human-readable layer name */
  name: string;
  /** Layer type determining available properties and rendering behavior */
  type:
    | 'image'
    | 'equalizer'
    | 'shape'
    | 'audio'
    | 'radialText'
    | 'asset-generator'
    | 'gradient'
    | 'effect';
  // Properties for audio layers
  audioType?: 'input' | 'output' | 'both';
  textToSpeak?: string;
  status?: 'idle' | 'loading' | 'playing' | 'error';
  voiceId?: string;
  error?: string;
  audioMode?: 'tts' | 'sts' | 'stt' | 'visualizer';
  voiceSettings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  // TTS specific settings
  ttsModel?: string;
  outputFormat?: string;
  optimizeStreamingLatency?: number;
  ttsSeed?: number;
  previousContext?: string;
  nextContext?: string;
  // STS specific settings
  stsModel?: string;
  stsSeed?: number;
  removeBackgroundNoise?: boolean;
  // STT specific settings
  transcriptionLanguage?: string;
  transcriptionResult?: string;
  /** Optional source URL for image layers */
  src?: string;
  /** Whether the layer is visible in the final output */
  visible: boolean;
  /** Layer opacity from 0.0 (transparent) to 1.0 (opaque) */
  opacity: number;
  /** CSS blend mode for layer composition */
  blendMode: string;
  /** Uniform scale factor (1.0 = original size) */
  scale: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Horizontal offset in pixels */
  offsetX: number;
  /** Vertical offset in pixels */
  offsetY: number;
  /** Primary color for solid and shape layers */
  color?: string;
  /** Brightness adjustment (-1.0 to 1.0) */
  brightness?: number;
  /** Contrast adjustment (-1.0 to 1.0) */
  contrast?: number;
  /** ID of the group this layer belongs to */
  groupId?: string;
  /** Whether the layer is locked from editing */
  locked?: boolean;

  // Shape system properties
  /** Fill type for shape layers */
  fillType?: 'none' | 'solid' | 'gradient';
  /** Solid fill color for shapes */
  fillColor?: string;
  /** Gradient configuration for shape fills */
  fillGradient?: {
    /** Gradient type (radial, linear, or conic) */
    type: 'radial' | 'linear' | 'conic';
    /** Array of color stops */
    colors: string[];
    /** Position of each color stop (0.0-1.0) */
    stops: number[];
    /** Angle for linear gradients in degrees */
    angle?: number;
    /** Center X position for radial gradients (0.0-1.0) */
    centerX?: number;
    /** Center Y position for radial gradients (0.0-1.0) */
    centerY?: number;
    /** How gradient behaves at edges: pad (default), reflect, or repeat */
    spreadMethod?: 'pad' | 'reflect' | 'repeat';
  };
  /** Stroke type for shape outlines */
  strokeType?: 'none' | 'solid' | 'gradient';
  /** Solid stroke color */
  strokeColor?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Gradient configuration for shape strokes */
  strokeGradient?: {
    /** Gradient type */
    type: 'radial' | 'linear' | 'conic';
    /** Array of color stops */
    colors: string[];
    /** Position of each color stop (0.0-1.0) */
    stops: number[];
    /** Angle for linear gradients in degrees */
    angle?: number;
    /** How gradient behaves at edges: pad (default), reflect, or repeat */
    spreadMethod?: 'pad' | 'reflect' | 'repeat';
  };
  /** CSS dash array pattern for strokes */
  strokeDasharray?: string;
  strokeAlign?: 'inner' | 'outer' | 'center';
  /**
   * @deprecated Legacy layer glow is no longer used by visualizers. Use appearance.outerGlow instead.
   * Kept optional for backward compatibility; ignored by renderers.
   */
  glowIntensity?: number;
  /**
   * @deprecated Legacy layer glow color is ignored by visualizers. Use appearance.outerGlow.color.
   */
  glowColor?: string;
  /** Drop shadow effect configuration */
  dropShadow?: LayerShadowStyle;
  /** Inner shadow effect configuration */
  innerShadow?: LayerShadowStyle;
  /** Outer glow effect configuration */
  outerGlow?: LayerGlowStyle;
  /** Inner glow effect configuration */
  innerGlow?: LayerGlowStyle;
  /** Color overlay effect configuration */
  colorOverlay?: LayerColorOverlay;
  /** Gradient overlay effect configuration */
  gradientOverlay?: LayerGradientOverlay;
  /** Bevel and emboss effect configuration */
  bevelEmboss?: LayerBevelEmboss;
  /** Shared global light settings used when effects opt-in */
  globalLight?: {
    angle: number;
    altitude: number;
  };
  /** Animation type for the layer */
  animation?: 'none' | 'rotate' | 'pulse' | 'custom';
  /** Speed multiplier for animations */
  animationSpeed?: number;
  /** Shape-specific configuration properties */
  shapeSpecific?: Record<string, any>;
  /** Specific shape type for shape layers */
  shapeType?: 'circle' | 'rectangle' | 'triangle' | 'polygon' | 'star';
  /** Legacy gradient configuration for backward compatibility */
  gradient?: {
    /** Gradient type */
    type: 'radial' | 'linear' | 'conic';
    /** Angle for linear gradients in degrees */
    angle?: number;
    /** Array of color stops */
    colors: string[];
    /** Position of each color stop (0.0-1.0) */
    stops: number[];
    /** Center X position for radial gradients (0.0-1.0) */
    centerX?: number;
    /** Center Y position for radial gradients (0.0-1.0) */
    centerY?: number;
  };
  /** Configuration specific to circle layers */
  circleSettings?: {
    /** Circle radius in pixels */
    radius: number;
    /** Stroke thickness in pixels */
    thickness: number;
    /** Fill type for the circle */
    fillType: 'none' | 'solid' | 'gradient';
    /** Stroke type for the circle outline */
    strokeType: 'solid' | 'gradient';
    /** Solid fill color */
    fillColor?: string;
    /** Solid stroke color */
    strokeColor?: string;
    /** Gradient fill configuration */
    fillGradient?: {
      /** Gradient type */
      type: 'radial' | 'linear' | 'conic';
      /** Array of color stops */
      colors: string[];
      /** Position of each color stop (0.0-1.0) */
      stops: number[];
      /** Angle for linear gradients in degrees */
      angle?: number;
    };
    /** Gradient stroke configuration */
    strokeGradient?: {
      /** Array of color stops */
      colors: string[];
      /** Position of each color stop (0.0-1.0) */
      stops: number[];
    };
    /**
     * @deprecated Legacy circleSettings glow is not used by equalizer visualizations.
     * Left intact for shape layers and backward compatibility.
     */
    glowIntensity: number;
    /** Color of the glow effect */
    glowColor?: string;
    /** CSS dash array pattern for strokes */
    dashArray?: string;
    /** Animation type for the circle */
    animation?: 'none' | 'rotate';
    /** Speed multiplier for animations */
    animationSpeed?: number;
  };
  /** Configuration for audio equalizer visualizations */
  equalizerSettings?: EqualizerSettings;
  visualizationType?: string;
  /** Configuration for asset generator layer */
  assetGeneratorSettings?: {
    /** Base layer ID for lens/background generation */
    baseLayerId?: string;
    /** Element layer ID for element generation */
    elementLayerId?: string;
  };

  /** Audio reactivity configuration */
  audioReactive?: {
    /** Enable audio reactivity for this layer */
    enabled: boolean;
    /** Source audio layer ID (if multiple audio layers exist) */
    sourceLayerId?: string;
    /** Audio feature to property mappings */
    mappings: AudioReactiveMapping[];
  };

  /** Non-destructive effects stack */
  effects?: LayerEffect[];

  /** Whether effects are enabled for this layer */
  effectsEnabled?: boolean;
}

/**
 * Layer group for organizing related layers
 *
 * Groups allow users to organize layers into logical collections that can be
 * manipulated together (show/hide, lock/unlock, collapse in UI).
 *
 * @interface LayerGroup
 * @example
 * ```typescript
 * const backgroundGroup: LayerGroup = {
 *   id: 'bg_group_001',
 *   name: 'Background Elements',
 *   layerIds: ['bg_gradient', 'bg_texture', 'bg_particles'],
 *   visible: true,
 *   locked: false,
 *   collapsed: false,
 *   color: '#3B82F6'
 * };
 * ```
 */
export interface LayerGroup {
  /** Unique identifier for the group */
  id: string;
  /** Human-readable group name */
  name: string;
  /** Array of layer IDs belonging to this group */
  layerIds: string[];
  /** Whether all layers in the group are visible */
  visible: boolean;
  /** Whether the group is locked from editing */
  locked: boolean;
  /** Whether the group is collapsed in the UI */
  collapsed?: boolean;
  /** Color for visual identification in the UI */
  color?: string;
}

/**
 * Saved configuration preset for quick layer setup
 *
 * Presets allow users to save and restore complete layer configurations
 * including all layer properties and grouping information.
 *
 * @interface Preset
 * @example
 * ```typescript
 * const visualizerPreset: Preset = {
 *   id: 'preset_viz_001',
 *   name: 'Classic Audio Visualizer',
 *   timestamp: Date.now(),
 *   layers: [equalizerLayer, backgroundLayer],
 *   groups: [audioGroup, backgroundGroup]
 * };
 * ```
 */
export interface Preset {
  /** Unique identifier for the preset */
  id: string;
  /** Human-readable preset name */
  name: string;
  /** Unix timestamp when preset was created */
  timestamp: number;
  /** Array of layers included in this preset */
  layers: Layer[];
  /** Optional layer groups included in this preset */
  groups?: LayerGroup[];
}

/**
 * Template is an alias for Preset - used for template management functionality
 */
export type Template = Preset & {
  /** Optional description for the template */
  description?: string;
  /** Template version for compatibility tracking */
  version?: string;
  /** Creation timestamp as Date or ISO string */
  createdAt?: Date | string;
  /** Last update timestamp as Date or ISO string */
  updatedAt?: Date | string;
  /** Optional metadata for categorization and search */
  metadata?: {
    tags?: string[];
    category?: string;
    complexity?: 'simple' | 'medium' | 'complex';
  };
};

// ============================================================================
// LAYER EFFECTS
// ============================================================================

/**
 * Supported layer effect types
 * These are visual effects applied to entire layers (shadows, glows, strokes)
 */
export type LayerEffectType =
  | 'outer-shadow' // Drop shadow beneath layer
  | 'inner-shadow' // Shadow inside layer bounds
  | 'outer-glow' // Soft glow around layer edges
  | 'inner-glow' // Glow inside layer edges
  | 'stroke' // Outline around layer
  | 'blur'; // Gaussian blur

/**
 * Layer effect instance
 * Represents a single effect applied to a layer
 */
export interface LayerEffect {
  /** Unique identifier */
  id: string;

  /** Effect type */
  type: LayerEffectType;

  /** Whether effect is active */
  enabled: boolean;

  /** Effect order in stack (lower = applied first) */
  order: number;

  /** Effect opacity (0-1) */
  opacity: number;

  /** Blend mode for effect compositing */
  blendMode: BlendMode;

  /** Type-specific parameters */
  parameters: EffectParameters;
}
