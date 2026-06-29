/**
 * ErrorHandler - Error handling and fallback mechanisms
 * Extracted from VisualizationLibrary for better modularity
 */

import { VisualizationFactory } from '../visualizations/VisualizationFactory';
import { RenderPerformanceMetrics } from '../renderers/VisualizationRenderer';

export interface OrchestrationResult {
  success: boolean;
  performance: RenderPerformanceMetrics;
  errors?: string[];
  visualizationType: string;
}

export class ErrorHandler {
  /**
   * Handle errors with fallback mechanisms
   */
  static handleError(
    error: string,
    originalType: string,
    fallbackType: string,
    enableErrorRecovery: boolean,
    createFallbackFn: (type: string) => OrchestrationResult | null
  ): OrchestrationResult {
    console.error(error);

    if (enableErrorRecovery) {
      // Try fallback visualization
      if (
        fallbackType !== originalType &&
        VisualizationFactory.getRegistrationInfo(fallbackType)
      ) {
        console.log(`Attempting fallback to: ${fallbackType}`);

        try {
          const fallbackResult = createFallbackFn(fallbackType);
          if (fallbackResult) {
            return {
              ...fallbackResult,
              errors: [
                `Fallback from ${originalType} to ${fallbackType}: ${error}`,
              ],
            };
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    }

    return {
      success: false,
      performance: {
        frameRate: 0,
        renderTime: 0,
        averageRenderTime: 0,
        memoryUsage: 0,
        queueLength: 0,
      },
      visualizationType: originalType,
      errors: [error],
    };
  }
}
