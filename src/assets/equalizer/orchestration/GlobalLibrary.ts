/**
 * GlobalLibrary - Global instance management
 * Extracted from VisualizationLibrary for better modularity
 */

import {
  VisualizationLibrary,
  VisualizationLibraryConfig,
} from '../VisualizationLibrary';
import { AudioAnalyzer } from '../processors/AudioAnalyzer';
import { FrequencyProcessor } from '../processors/FrequencyProcessor';
import { VisualizationRenderer } from '../renderers/VisualizationRenderer';
import { VisualizationFactory } from '../visualizations/VisualizationFactory';

/**
 * Global library instance - will be initialized when system is set up
 * Note: Must call VisualizationLibrary.initialize() before using getInstance()
 */
export let visualizationLibrary: VisualizationLibrary | null = null;

/**
 * Initialize global library instance with dependencies
 */
export function initializeGlobalLibrary(
  audioAnalyzer: AudioAnalyzer,
  frequencyProcessor: FrequencyProcessor,
  renderer: VisualizationRenderer,
  factory: VisualizationFactory,
  config?: Partial<VisualizationLibraryConfig>
): void {
  visualizationLibrary = VisualizationLibrary.initialize(
    audioAnalyzer,
    frequencyProcessor,
    renderer,
    factory,
    config
  );
}
