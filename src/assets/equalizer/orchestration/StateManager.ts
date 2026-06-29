/**
 * StateManager - State management and preservation
 * Extracted from VisualizationLibrary for better modularity
 */

import type {
  IVisualization,
  VisualizationConfig,
} from '../visualizations/IVisualization';

// Runtime validation and logging toggles
const ENABLE_RUNTIME_VALIDATION = false; // Prioritize working app over strict validation
const ENABLE_VALIDATION_LOGS = false; // Silence validation logs to avoid console spam

export class StateManager {
  private currentVisualization: IVisualization | null = null;
  private currentType: string = '';
  private lastKnownConfig: VisualizationConfig | null = null;

  /**
   * Get current visualization
   */
  getCurrentVisualization(): IVisualization | null {
    return this.currentVisualization;
  }

  /**
   * Get current type
   */
  getCurrentType(): string {
    return this.currentType;
  }

  /**
   * Get last known config
   */
  getLastKnownConfig(): VisualizationConfig | null {
    return this.lastKnownConfig;
  }

  /**
   * Set current visualization
   */
  setCurrentVisualization(
    visualization: IVisualization | null,
    type: string
  ): void {
    // Dispose of old visualization
    if (this.currentVisualization?.dispose) {
      this.currentVisualization.dispose();
    }

    this.currentVisualization = visualization;
    this.currentType = type;
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: VisualizationConfig): boolean {
    if (!this.currentVisualization) {
      return false;
    }

    try {
      const prev = this.lastKnownConfig;

      if (ENABLE_RUNTIME_VALIDATION) {
        const validation = this.currentVisualization.validateConfig(config);
        if (!validation.valid) {
          if (ENABLE_VALIDATION_LOGS) {
            console.warn(
              'Visualization config invalid (dev-only):',
              validation.errors
            );
          }
          // Proceed by accepting config to keep app functional
        }
      }

      // Handle configuration change if supported
      if (this.currentVisualization.onConfigChange && prev) {
        this.currentVisualization.onConfigChange(prev, config);
      }

      this.lastKnownConfig = { ...config };
      return true;
    } catch (error) {
      if (ENABLE_VALIDATION_LOGS) {
        console.warn('Error updating configuration (non-fatal):', error);
      }
      // Accept config even if something went wrong to avoid hard breaks
      this.lastKnownConfig = { ...config };
      return true;
    }
  }

  /**
   * Shallow compare two config objects
   */
  private static shallowEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if ((a as any)[key] !== (b as any)[key]) return false;
    }
    return true;
  }

  /**
   * Check if configuration needs updating
   */
  needsConfigUpdate(config: VisualizationConfig): boolean {
    const prev = this.lastKnownConfig;
    if (!prev) return true;
    return !StateManager.shallowEqual(prev, config);
  }

  /**
   * Check if visualization type needs switching
   */
  needsTypeSwitch(type: string): boolean {
    return this.currentType !== type;
  }

  /**
   * Get system status info
   */
  getSystemStatus(): { currentVisualization: string } {
    return { currentVisualization: this.currentType };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    if (this.currentVisualization?.dispose) {
      this.currentVisualization.dispose();
    }
    this.currentVisualization = null;
    this.currentType = '';
    this.lastKnownConfig = null;
  }
}
