/**
 * Visualization-Specific Settings Panels - Layer 3 of the SRP Reactive UI Architecture
 *
 * These components combine setting groups for specific visualization types:
 * - Each panel manages settings for ONE visualization type
 * - Smart context-aware display of relevant settings
 * - Progressive disclosure based on layout/mode selections
 */

export { DotVisualizationSettings } from './DotVisualizationSettings';
export type { DotVisualizationSettingsProps } from './DotVisualizationSettings';

export { BarVisualizationSettings } from './BarVisualizationSettings';
export type { BarVisualizationSettingsProps } from './BarVisualizationSettings';


export { CircleVisualizationSettings } from './CircleVisualizationSettings';
export type { CircleVisualizationSettingsProps } from './CircleVisualizationSettings';

export { TriangleVisualizationSettings } from './TriangleVisualizationSettings';
export type { TriangleVisualizationSettingsProps } from './TriangleVisualizationSettings';

export { DiamondVisualizationSettings } from './DiamondVisualizationSettings';
export type { DiamondVisualizationSettingsProps } from './DiamondVisualizationSettings';

export { HexagonVisualizationSettings } from './HexagonVisualizationSettings';
export type { HexagonVisualizationSettingsProps } from './HexagonVisualizationSettings';

// Note: BlockVisualizationSettings uses BarVisualizationSettings (same interface)
