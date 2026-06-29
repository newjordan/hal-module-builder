/**
 * IVisualization - Legacy compatibility layer for visualization contracts.
 * Re-exports the SRP-friendly BaseVisualization types so newer modules and
 * legacy callers share the same definitions.
 */

import { BaseVisualization } from './BaseVisualization';

export type {
  VisualizationMetadata,
  VisualizationConfig,
  ValidationResult,
  RenderContext,
  FrequencyData,
} from './BaseVisualization';

export interface LayoutHints {
  preferredLayouts: string[];
  minElements: number;
  maxElements: number;
  supportsRotation: boolean;
  supportsScaling: boolean;
}

export type IVisualization = BaseVisualization;
