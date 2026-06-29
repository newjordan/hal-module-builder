/**
 * Default values for visualization settings
 * Single Responsibility: Provide default values for all settings
 */

import type {
  BarStyleSettings,
  BarVisualizationSettings,
  CircleStyleSettings,
  CircleVisualizationSettings,
  CommonVisualizationSettings,
  DiamondStyleSettings,
  DiamondVisualizationSettings,
  DotStyleSettings,
  DotVisualizationSettings,
  HexagonStyleSettings,
  HexagonVisualizationSettings,
  TriangleStyleSettings,
  TriangleVisualizationSettings,
} from '../types';

/**
 * Default common settings shared by all visualizations
 */
export const DEFAULT_COMMON_SETTINGS: CommonVisualizationSettings = {
  visualizationType: 'bar',
  blendMode: 'normal',
  opacity: 1,
  colorMode: 'gradient',
  primaryColor: '#dc2626',
  secondaryColor: '#7f1d1d',
  glowColor: '#dc2626',
  symmetry: 'none',
  barLayout: 'single',
  positionX: 50,
  positionY: 50,
  rotation: 0,
  innerRadius: 140,
  showRadialPath: false,
  enablePartialArc: false,
  startAngle: 0,
  endAngle: 360,
  responseSpeed: 0.8,
  pulseMode: 'none',
  layout: 'radial',
};

/**
 * Default bar style settings
 */
export const DEFAULT_BAR_STYLE: BarStyleSettings = {
  barCount: 48,
  barHeight: 200,
  barWidth: 8,
  barSpacing: 2,
  radialOrientation: 'follow-radius',
  invert: false,
  cornerRadius: 0,
  barAlignment: 'bottom',
};

/**
 * Default dot style settings
 */
export const DEFAULT_DOT_STYLE: DotStyleSettings = {
  dotCount: 48,
  dotSize: 6,
  dotSpacing: 4,
  pulsingEffect: false,
};

/**
 * Default triangle style settings
 */
export const DEFAULT_TRIANGLE_STYLE: TriangleStyleSettings = {
  triangleCount: 48,
  triangleSize: 10,
  triangleSpacing: 4,
  triangleOrientation: 'up',
};

/**
 * Default diamond style settings
 */
export const DEFAULT_DIAMOND_STYLE: DiamondStyleSettings = {
  diamondCount: 48,
  diamondSize: 8,
  diamondSpacing: 4,
};

/**
 * Default hexagon style settings
 */
export const DEFAULT_HEXAGON_STYLE: HexagonStyleSettings = {
  hexagonCount: 48,
  hexSize: 8,
  hexSpacing: 4,
};

/**
 * Default circle style settings
 */
export const DEFAULT_CIRCLE_STYLE: CircleStyleSettings = {
  circleCount: 48,
  circleRadius: 6,
  circleSpacing: 4,
};

/**
 * Complete default settings for each visualization type
 */
export const DEFAULT_BAR_SETTINGS: BarVisualizationSettings = {
  ...DEFAULT_COMMON_SETTINGS,
  ...DEFAULT_BAR_STYLE,
  visualizationType: 'bar',
};

export const DEFAULT_DOT_SETTINGS: DotVisualizationSettings = {
  ...DEFAULT_COMMON_SETTINGS,
  ...DEFAULT_DOT_STYLE,
  visualizationType: 'dot',
};

export const DEFAULT_TRIANGLE_SETTINGS: TriangleVisualizationSettings = {
  ...DEFAULT_COMMON_SETTINGS,
  ...DEFAULT_TRIANGLE_STYLE,
  visualizationType: 'triangle',
};

export const DEFAULT_DIAMOND_SETTINGS: DiamondVisualizationSettings = {
  ...DEFAULT_COMMON_SETTINGS,
  ...DEFAULT_DIAMOND_STYLE,
  visualizationType: 'diamond',
};

export const DEFAULT_HEXAGON_SETTINGS: HexagonVisualizationSettings = {
  ...DEFAULT_COMMON_SETTINGS,
  ...DEFAULT_HEXAGON_STYLE,
  visualizationType: 'hexagon',
};

export const DEFAULT_CIRCLE_SETTINGS: CircleVisualizationSettings = {
  ...DEFAULT_COMMON_SETTINGS,
  ...DEFAULT_CIRCLE_STYLE,
  visualizationType: 'circle',
};

/**
 * Get default settings for a specific visualization type
 */
export function getDefaultSettings(type: string) {
  switch (type) {
    case 'bar':
      return DEFAULT_BAR_SETTINGS;
    case 'dot':
      return DEFAULT_DOT_SETTINGS;
    case 'triangle':
      return DEFAULT_TRIANGLE_SETTINGS;
    case 'diamond':
      return DEFAULT_DIAMOND_SETTINGS;
    case 'hexagon':
      return DEFAULT_HEXAGON_SETTINGS;
    case 'circle':
      return DEFAULT_CIRCLE_SETTINGS;
    default:
      return DEFAULT_BAR_SETTINGS;
  }
}

