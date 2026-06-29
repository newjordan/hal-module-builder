/**
 * Type definitions for visualization system
 * Extracted from BaseVisualization to reduce file size
 */

export interface VisualizationMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
  tags?: string[];
}

export interface VisualizationConfig {
  // Common properties
  barCount: number;
  barWidth: number;
  barSpacing: number;
  maxHeight: number;
  responseSpeed: number;

  // Colors
  colorMode:
    | 'solid'
    | 'gradient'
    | 'rainbow'
    | 'reactive'
    | 'custom-gradient'
    | 'radial-gradient';
  primaryColor: string;
  secondaryColor?: string;
  customGradient?: {
    colors: string[];
    stops: number[];
  };
  radialGradientSettings?: {
    fromCenter: boolean;
    colors: string[];
    stops: number[];
  };

  // Effects
  /**
   * @deprecated Legacy glow is no longer used by visualizers. Use Appearance Panel outerGlow via EqualizerEngine.
   * This field is ignored at render time and kept optional for backward compatibility.
   */
  glowIntensity?: number;
  /**
   * @deprecated Legacy glow color is ignored by visualizers. Use Appearance Panel outerGlow.color.
   */
  glowColor?: string;
  pulseMode: 'none' | 'subtle' | 'strong';
  symmetry?:
    | 'none'
    | 'mirror'
    | 'rotate'
    | '4-fold'
    | '6-fold'
    | '8-fold'
    | '12-fold';

  // Animation
  smoothing: number;
  peakHold: boolean;
  peakHoldTime: number;
  peakDecay: number;

  // Transform
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  theme: 'frost_light' | 'frost_dark';
  timestamp: number;
}

export interface VisualizationState {
  config: VisualizationConfig;
  metadata: VisualizationMetadata;
  animationState: Record<string, any>;
  lastRenderTime: number;
  frameCount: number;
}

export interface AnimationProperty {
  name: string;
  type: 'number' | 'color' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  description: string;
}

export interface Performance {
  lastRenderTime: number;
  averageRenderTime: number;
  frameCount: number;
  droppedFrames: number;
}
