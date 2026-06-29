/**
 * VisualizationFactory - Plugin registration and factory system for visualizations
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 *
 * Provides dynamic visualization type discovery, registration, and creation
 * Enables hot-swapping and extensibility for new visualization types
 */

import { AudioProcessor } from '../AudioProcessor';
import {
  BaseVisualization,
  VisualizationMetadata,
  VisualizationConfig,
  ValidationResult,
} from './BaseVisualization';

// Import all visualization types
import { BarVisualization } from './BarVisualization';
import { CircleVisualization } from './CircleVisualization';
import { DotVisualization } from './DotVisualization';
import { TriangleVisualization } from './TriangleVisualization';
import { DiamondVisualization } from './DiamondVisualization';
import { HexagonVisualization } from './HexagonVisualization';

export interface VisualizationType {
  new (audioProcessor: AudioProcessor): BaseVisualization;
  prototype: BaseVisualization;
}

export interface RegistrationInfo {
  type: string;
  class: VisualizationType;
  metadata: VisualizationMetadata;
  defaultConfig: VisualizationConfig;
  registeredAt: Date;
}

export interface VisualizationFactoryConfig {
  enableHotSwap: boolean;
  enableMetrics: boolean;
  maxInstances: number;
  defaultAudioProcessor?: AudioProcessor;
}

/**
 * VisualizationFactory - Central factory and registration system
 */
export class VisualizationFactory {
  private static registrations = new Map<string, RegistrationInfo>();
  private static instances = new Map<string, BaseVisualization>();
  private static config: VisualizationFactoryConfig = {
    enableHotSwap: true,
    enableMetrics: false,
    maxInstances: 10,
  };
  private static creationMetrics = new Map<string, number>();
  private static isInitialized = false;

  /**
   * Register a visualization type with the factory
   */
  static register(
    type: string,
    visualizationClass: VisualizationType,
    force: boolean = false
  ): boolean {
    if (this.registrations.has(type) && !force) {
      console.warn(`Visualization type '${type}' is already registered`);
      return false;
    }

    try {
      // Create temporary instance to extract metadata and default config
      const tempAudioProcessor =
        this.config.defaultAudioProcessor || new AudioProcessor();
      const tempInstance = new visualizationClass(tempAudioProcessor);

      const registrationInfo: RegistrationInfo = {
        type,
        class: visualizationClass,
        metadata: tempInstance.metadata,
        defaultConfig: tempInstance.getDefaultConfig(),
        registeredAt: new Date(),
      };

      this.registrations.set(type, registrationInfo);

      if (this.config.enableMetrics) {
        this.creationMetrics.set(type, 0);
      }

      console.log(`✅ Registered visualization type: ${type}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to register visualization type '${type}':`,
        error
      );
      return false;
    }
  }

  /**
   * Unregister a visualization type
   */
  static unregister(type: string): boolean {
    if (!this.registrations.has(type)) {
      console.warn(`Visualization type '${type}' is not registered`);
      return false;
    }

    // Clean up any existing instances
    this.destroyInstance(type);

    this.registrations.delete(type);
    this.creationMetrics.delete(type);

    console.log(`🗑️ Unregistered visualization type: ${type}`);
    return true;
  }

  /**
   * Create a new visualization instance
   */
  static create(
    type: string,
    audioProcessor: AudioProcessor,
    config?: Partial<VisualizationConfig>
  ): BaseVisualization | null {
    console.log(`🏭 VisualizationFactory.create called for type: ${type}`);
    console.log(
      `  Available registrations:`,
      Array.from(this.registrations.keys())
    );

    const registration = this.registrations.get(type);

    if (!registration) {
      console.error(`❌ Unknown visualization type: ${type}`);
      console.error(`  Available types:`, this.getRegisteredTypes());
      return null;
    }

    console.log(`  Found registration for ${type}:`, registration.class.name);

    try {
      const instance = new registration.class(audioProcessor);
      console.log(`  ✅ Created instance of ${registration.class.name}`);

      // Validate configuration if provided
      if (config) {
        const mergedConfig = { ...registration.defaultConfig, ...config };
        const validation = instance.validateConfig(mergedConfig);

        if (!validation.valid) {
          console.error(
            `❌ Configuration validation failed for ${type}:`,
            validation.errors
          );
          return null;
        }
        console.log(`  ✅ Configuration validated for ${type}`);
      }

      // Update metrics
      if (this.config.enableMetrics) {
        const currentCount = this.creationMetrics.get(type) || 0;
        this.creationMetrics.set(type, currentCount + 1);
      }

      console.log(`🎨 Successfully created visualization instance: ${type}`);
      return instance;
    } catch (error) {
      console.error(
        `❌ Failed to create visualization instance '${type}':`,
        error
      );
      console.error(
        `  Error details:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      console.error(
        `  Stack trace:`,
        error instanceof Error ? error.stack : 'No stack trace'
      );
      return null;
    }
  }

  /**
   * Create or get cached instance (singleton pattern)
   */
  static getInstance(
    type: string,
    audioProcessor: AudioProcessor,
    config?: Partial<VisualizationConfig>
  ): BaseVisualization | null {
    // Check if we already have an instance
    if (this.instances.has(type)) {
      return this.instances.get(type)!;
    }

    // Check instance limit
    if (this.instances.size >= this.config.maxInstances) {
      console.warn(
        `Maximum instances limit (${this.config.maxInstances}) reached`
      );
      return null;
    }

    const instance = this.create(type, audioProcessor, config);
    if (instance) {
      this.instances.set(type, instance);
    }

    return instance;
  }

  /**
   * Destroy a cached instance
   */
  static destroyInstance(type: string): boolean {
    const instance = this.instances.get(type);
    if (instance) {
      if (instance.dispose) {
        instance.dispose();
      }
      this.instances.delete(type);
      console.log(`🗑️ Destroyed visualization instance: ${type}`);
      return true;
    }
    return false;
  }

  /**
   * Get all registered visualization types
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get registration info for a specific type
   */
  static getRegistrationInfo(type: string): RegistrationInfo | null {
    return this.registrations.get(type) || null;
  }

  /**
   * Get all registration information
   */
  static getAllRegistrations(): RegistrationInfo[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Validate configuration for a specific visualization type
   */
  static validateConfig(
    type: string,
    config: VisualizationConfig
  ): ValidationResult {
    const registration = this.registrations.get(type);

    if (!registration) {
      return {
        valid: false,
        errors: [`Unknown visualization type: ${type}`],
      };
    }

    try {
      // Create temporary instance for validation
      const tempAudioProcessor =
        this.config.defaultAudioProcessor || new AudioProcessor();
      const tempInstance = new registration.class(tempAudioProcessor);

      return tempInstance.validateConfig(config);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown validation error';
      return {
        valid: false,
        errors: [`Validation failed: ${message}`],
      };
    }
  }

  /**
   * Hot-swap a visualization implementation with optional state preservation
   */
  static hotSwap(
    type: string,
    newClass: VisualizationType,
    preserveState: boolean = true
  ): boolean {
    if (!this.config.enableHotSwap) {
      console.warn('Hot-swapping is disabled');
      return false;
    }

    let preservedState: Record<string, any> | null = null;
    let preservedAudioProcessor: AudioProcessor | null = null;

    // Export state from existing instance if present
    if (preserveState && this.instances.has(type)) {
      const existingInstance = this.instances.get(type)!;

      // Export state if the method exists
      if (existingInstance.exportState) {
        preservedState = existingInstance.exportState();
        console.log(`📦 Exported state for hot-swap: ${type}`);
      }

      // Preserve audio processor reference
      preservedAudioProcessor = (existingInstance as any).audioProcessor;
    }

    // Destroy the old instance
    this.destroyInstance(type);

    // Register the new class
    const registered = this.register(type, newClass, true);

    if (!registered) {
      console.error(`❌ Failed to register new class during hot-swap: ${type}`);
      return false;
    }

    // Recreate instance with preserved state if requested
    if (preserveState && preservedAudioProcessor) {
      const newInstance = this.getInstance(type, preservedAudioProcessor);

      if (newInstance && preservedState && newInstance.importState) {
        newInstance.importState(preservedState);
        console.log(`📥 Imported state after hot-swap: ${type}`);
      }
    }

    console.log(
      `🔄 Hot-swapped visualization: ${type} (state preserved: ${preserveState})`
    );
    return true;
  }

  /**
   * Configure the factory
   */
  static configure(config: Partial<VisualizationFactoryConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 VisualizationFactory configured:', this.config);
  }

  /**
   * Get creation metrics
   */
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.creationMetrics);
  }

  /**
   * Clear all registrations and instances
   */
  static clear(): void {
    // Dispose all instances
    this.instances.forEach(instance => {
      if (instance.dispose) {
        instance.dispose();
      }
    });

    this.instances.clear();
    this.registrations.clear();
    this.creationMetrics.clear();
    this.isInitialized = false;

    console.log('🧹 VisualizationFactory cleared');
  }

  /**
   * Initialize factory with default visualizations
   */
  static initialize(audioProcessor?: AudioProcessor): void {
    if (this.isInitialized) {
      console.log('ℹ️ VisualizationFactory already initialized, skipping');
      return;
    }

    if (audioProcessor) {
      this.config.defaultAudioProcessor = audioProcessor;
    }

    // Register all core visualization types (matching UI options)
    this.register('bar', BarVisualization);
    this.register('line', BarVisualization); // BAR handles line mode via style config
    this.register('block', BarVisualization); // BAR handles block mode via style config
    this.register('circle', CircleVisualization);
    this.register('dot', DotVisualization);
    this.register('triangle', TriangleVisualization);
    this.register('diamond', DiamondVisualization);
    this.register('hexagon', HexagonVisualization);

    this.isInitialized = true;
    console.log('🚀 VisualizationFactory initialized with core visualizations');
  }

  /**
   * Get factory status
   */
  static getStatus(): {
    registeredTypes: number;
    activeInstances: number;
    totalCreated: number;
    config: VisualizationFactoryConfig;
  } {
    const totalCreated = Array.from(this.creationMetrics.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      registeredTypes: this.registrations.size,
      activeInstances: this.instances.size,
      totalCreated,
      config: this.config,
    };
  }
}
