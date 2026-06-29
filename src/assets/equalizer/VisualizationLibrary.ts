/**
 * VisualizationLibrary - Orchestration system with dependency injection
 */

import {
  ErrorHandler,
  OrchestrationResult,
} from './orchestration/ErrorHandler';
import { StateManager } from './orchestration/StateManager';
import { AudioAnalyzer } from './processors/AudioAnalyzer';
import { FrequencyProcessor } from './processors/FrequencyProcessor';
import {
  RenderPerformanceMetrics,
  VisualizationRenderer,
} from './renderers/VisualizationRenderer';
import type {
  IVisualization,
  VisualizationConfig,
} from './visualizations/IVisualization';
import { VisualizationFactory } from './visualizations/VisualizationFactory';

export interface VisualizationLibraryConfig {
  enableErrorRecovery: boolean;
  enableStatePreservation: boolean;
  enableMetrics: boolean;
  fallbackVisualizationType: string;
}

export type { OrchestrationResult };

/**
 * Orchestration system coordinating audio modules and visualization types
 */
const DEBUG_LOGS = false; // Silence orchestration logs in production while stabilizing

export class VisualizationLibrary {
  private static instance: VisualizationLibrary;
  private config: VisualizationLibraryConfig;

  private audioAnalyzer: AudioAnalyzer;
  private frequencyProcessor: FrequencyProcessor;
  private renderer: VisualizationRenderer;
  // Factory is accessed statically, not stored as instance
  private stateManager: StateManager;

  private constructor(
    audioAnalyzer: AudioAnalyzer,
    frequencyProcessor: FrequencyProcessor,
    renderer: VisualizationRenderer,
    factory: any, // Not used - factory is accessed statically
    config: Partial<VisualizationLibraryConfig> = {}
  ) {
    void factory;
    this.audioAnalyzer = audioAnalyzer;
    this.frequencyProcessor = frequencyProcessor;
    this.renderer = renderer;
    // Factory is accessed statically via VisualizationFactory class
    this.stateManager = new StateManager();

    this.config = {
      enableErrorRecovery: config.enableErrorRecovery ?? true,
      enableStatePreservation: config.enableStatePreservation ?? true,
      enableMetrics: config.enableMetrics ?? false,
      fallbackVisualizationType: config.fallbackVisualizationType ?? 'bar',
    };
  }

  static initialize(
    audioAnalyzer: AudioAnalyzer,
    frequencyProcessor: FrequencyProcessor,
    renderer: VisualizationRenderer,
    factory: any, // Not used - factory is accessed statically
    config?: Partial<VisualizationLibraryConfig>
  ): VisualizationLibrary {
    void factory;
    VisualizationLibrary.instance = new VisualizationLibrary(
      audioAnalyzer,
      frequencyProcessor,
      renderer,
      factory,
      config
    );
    return VisualizationLibrary.instance;
  }

  static getInstance(): VisualizationLibrary {
    if (!VisualizationLibrary.instance) {
      throw new Error(
        'VisualizationLibrary not initialized. Call initialize() first.'
      );
    }
    return VisualizationLibrary.instance;
  }

  renderVisualization(
    type: string,
    config: VisualizationConfig
  ): OrchestrationResult {
    if (DEBUG_LOGS) console.log('🎭 renderVisualization type:', type);
    try {
      const needsSwitch = this.stateManager.needsTypeSwitch(type);
      if (DEBUG_LOGS)
        console.log(
          '  - Needs type switch?',
          needsSwitch,
          'Current type:',
          this.stateManager.getCurrentType()
        );

      if (needsSwitch) {
        if (!this.switchVisualization(type, config)) {
          return ErrorHandler.handleError(
            `Failed to switch to visualization: ${type}`,
            type,
            this.config.fallbackVisualizationType,
            this.config.enableErrorRecovery,
            fallbackType => this.tryFallbackRender(fallbackType)
          );
        }
      }

      // Merge incoming config with the visualization type's default config
      const regInfo = VisualizationFactory.getRegistrationInfo(type);
      const mergedConfig = regInfo
        ? { ...regInfo.defaultConfig, ...config }
        : config;

      if (this.stateManager.needsConfigUpdate(mergedConfig)) {
        this.stateManager.updateConfiguration(mergedConfig);
      }

      const currentViz = this.stateManager.getCurrentVisualization();
      if (!currentViz) throw new Error('No current visualization available');

      const performance = this.renderer.render(
        currentViz,
        this.audioAnalyzer,
        this.frequencyProcessor,
        mergedConfig
      );
      return { success: true, performance, visualizationType: type };
    } catch (error) {
      return ErrorHandler.handleError(
        `Rendering failed: ${error}`,
        type,
        this.config.fallbackVisualizationType,
        this.config.enableErrorRecovery,
        fallbackType => this.tryFallbackRender(fallbackType)
      );
    }
  }

  switchVisualization(type: string, config: VisualizationConfig): boolean {
    if (DEBUG_LOGS) {
      console.log('🔄 Switching visualization to:', type);
      console.log(
        '  - Available types:',
        VisualizationFactory.getRegisteredTypes()
      );
    }

    try {
      // Create the new visualization instance without validating config at switch time.
      // We'll apply the config after the instance is set to avoid cross-type validation issues.
      const newVisualization = VisualizationFactory.create(
        type,
        this.audioAnalyzer as any
      );
      if (!newVisualization) {
        console.error(`❌ Failed to create visualization: ${type}`);
        console.error(
          '  - Registered types:',
          VisualizationFactory.getRegisteredTypes()
        );
        console.error('  - AudioAnalyzer available:', !!this.audioAnalyzer);
        console.error('  - Config:', config);
        return false;
      }
      if (DEBUG_LOGS) console.log('  ✅ Created visualization instance:', type);

      // Set new visualization (cast for interface compatibility)
      this.stateManager.setCurrentVisualization(
        newVisualization as unknown as IVisualization,
        type
      );

      return true;
    } catch (error) {
      console.error(`Error switching visualization to ${type}:`, error);
      return false;
    }
  }

  private tryFallbackRender(fallbackType: string): OrchestrationResult | null {
    const fallbackConfig = this.getDefaultConfig(fallbackType);
    if (
      fallbackConfig &&
      this.switchVisualization(fallbackType, fallbackConfig)
    ) {
      const currentViz = this.stateManager.getCurrentVisualization();
      if (currentViz) {
        const performance = this.renderer.render(
          currentViz,
          this.audioAnalyzer,
          this.frequencyProcessor,
          fallbackConfig
        );
        return { success: true, performance, visualizationType: fallbackType };
      }
    }
    return null;
  }

  getAvailableTypes(): string[] {
    return VisualizationFactory.getRegisteredTypes();
  }

  getDefaultConfig(type: string): VisualizationConfig | null {
    const info = VisualizationFactory.getRegistrationInfo(type);
    return info?.defaultConfig || null;
  }

  validateConfig(type: string, config: VisualizationConfig) {
    return VisualizationFactory.validateConfig(type, config);
  }

  getPerformanceMetrics(): RenderPerformanceMetrics {
    return this.renderer.getMetrics();
  }

  updateConfig(newConfig: Partial<VisualizationLibraryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getCurrentType(): string {
    return this.stateManager.getCurrentType();
  }

  /**
   * Inject external audio data into the AudioAnalyzer
   * Allows external audio sources to provide data to the visualization system
   */
  injectAudioData(frequencyData: number[] | Uint8Array): void {
    if (
      this.audioAnalyzer &&
      typeof this.audioAnalyzer.injectAudioData === 'function'
    ) {
      this.audioAnalyzer.injectAudioData(frequencyData);
    }
  }

  /**
   * Stop using external audio data and return to internal audio analysis
   */
  stopExternalAudioData(): void {
    if (
      this.audioAnalyzer &&
      typeof this.audioAnalyzer.stopExternalData === 'function'
    ) {
      this.audioAnalyzer.stopExternalData();
    }
  }

  getSystemStatus(): {
    currentVisualization: string;
    availableTypes: string[];
    performance: any;
    factoryStatus: any;
  } {
    return {
      currentVisualization: this.stateManager.getCurrentType(),
      availableTypes: this.getAvailableTypes(),
      performance: this.getPerformanceMetrics(),
      factoryStatus: VisualizationFactory.getStatus(),
    };
  }

  dispose(): void {
    this.stateManager.dispose();
    this.renderer.dispose();
    this.audioAnalyzer.dispose();
    VisualizationFactory.clear();
  }
}

/**
 * Global singleton instance
 */
export let visualizationLibrary: VisualizationLibrary | null = null;

/**
 * Initialize the global visualization library
 */
export function initializeGlobalLibrary(
  audioAnalyzer: AudioAnalyzer,
  frequencyProcessor: FrequencyProcessor,
  renderer: VisualizationRenderer,
  factory: VisualizationFactory,
  config: Partial<VisualizationLibraryConfig> = {}
): VisualizationLibrary {
  visualizationLibrary = VisualizationLibrary.initialize(
    audioAnalyzer,
    frequencyProcessor,
    renderer,
    factory,
    config
  );
  return visualizationLibrary;
}
