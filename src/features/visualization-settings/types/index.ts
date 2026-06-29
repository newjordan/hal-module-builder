/**
 * Type definitions for visualization settings
 * Single Responsibility: Define all types for the visualization settings feature
 */

export type VisualizationType =
  | 'bar'
  | 'dot'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'circle';

export type LayoutType = 'linear' | 'radial' | 'grid';

export type SymmetryMode =
  | 'none'
  | 'mirror'
  | 'rotate'
  | '4-fold'
  | '6-fold'
  | '8-fold'
  | '10-fold'
  | '12-fold';

export type BarLayoutMode = 'single' | 'stacked' | 'grouped';

export type PulseMode = 'none' | 'subtle' | 'strong';

export type ColorMode =
  | 'solid'
  | 'gradient'
  | 'rainbow'
  | 'reactive'
  | 'custom-gradient'
  | 'radial-gradient';

export type RadialOrientation = 'follow-radius' | 'follow-tangent' | 'maintain';

export type BlockAlignment = 'bottom' | 'center' | 'top';

/**
 * Common settings shared by all visualization types
 */
export interface CommonVisualizationSettings {
  // Type
  visualizationType: VisualizationType;

  // Appearance (mapped to/from AppearancePanel)
  blendMode: string;
  opacity: number;
  appearance?: AppearancePanelMapping;

  // Color
  colorMode: ColorMode;
  primaryColor: string;
  secondaryColor?: string;
  glowColor?: string;

  // Symmetry
  symmetry: SymmetryMode;
  barLayout?: BarLayoutMode;

  // Position
  positionX: number;
  positionY: number;
  rotation: number;
  innerRadius: number;
  showRadialPath: boolean;
  enablePartialArc: boolean;
  startAngle?: number;
  endAngle?: number;

  // Audio Integration
  responseSpeed: number;
  pulseMode: PulseMode;

  // Layout
  layout: LayoutType;
}

/**
 * Bar-specific style settings
 */
export interface BarStyleSettings {
  barCount: number;
  barHeight: number; // maxHeight
  barWidth: number;
  barSpacing: number;
  radialOrientation: RadialOrientation;
  invert: boolean;
  cornerRadius?: number;
  barAlignment?: BlockAlignment;
}

/**
 * Dot-specific style settings
 */
export interface DotStyleSettings {
  dotCount: number;
  dotSize: number;
  dotSpacing: number;
  pulsingEffect?: boolean;
}

/**
 * Triangle-specific style settings
 */
export interface TriangleStyleSettings {
  triangleCount: number;
  triangleSize: number;
  triangleSpacing: number;
  triangleOrientation: 'up' | 'down' | 'alternating';
}

/**
 * Diamond-specific style settings
 */
export interface DiamondStyleSettings {
  diamondCount: number;
  diamondSize: number;
  diamondSpacing: number;
}

/**
 * Hexagon-specific style settings
 */
export interface HexagonStyleSettings {
  hexagonCount: number;
  hexSize: number;
  hexSpacing: number;
}

/**
 * Circle-specific style settings
 */
export interface CircleStyleSettings {
  circleCount: number;
  circleRadius: number;
  circleSpacing: number;
}

/**
 * Complete settings for each visualization type
 */
export type BarVisualizationSettings = CommonVisualizationSettings &
  BarStyleSettings;
export type DotVisualizationSettings = CommonVisualizationSettings &
  DotStyleSettings;
export type TriangleVisualizationSettings = CommonVisualizationSettings &
  TriangleStyleSettings;
export type DiamondVisualizationSettings = CommonVisualizationSettings &
  DiamondStyleSettings;
export type HexagonVisualizationSettings = CommonVisualizationSettings &
  HexagonStyleSettings;
export type CircleVisualizationSettings = CommonVisualizationSettings &
  CircleStyleSettings;

/**
 * Union type for all visualization settings
 */
export type VisualizationSettings =
  | BarVisualizationSettings
  | DotVisualizationSettings
  | TriangleVisualizationSettings
  | DiamondVisualizationSettings
  | HexagonVisualizationSettings
  | CircleVisualizationSettings;

/**
 * Props for section components
 */
export interface SectionProps<T = any> {
  settings: T;
  onChange: (updates: Partial<T>) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

/**
 * Appearance panel mapping types
 */
export interface AppearancePanelMapping {
  // Fill
  fillType: 'none' | 'solid' | 'gradient';
  fillColor?: string;
  fillGradient?: any; // Will be properly typed when integrating

  // Stroke
  strokeType: 'none' | 'solid' | 'gradient';
  strokeWidth?: number;
  strokeColor?: string;
  strokeAlign?: 'center' | 'inside' | 'outside';

  // Effects
  dropShadow?: any;
  innerShadow?: any;
  outerGlow?: any;
  innerGlow?: any;
  bevelEmboss?: any;
  globalLight?: any;

  // Blend
  blendMode: string;
  opacity: number;
}
