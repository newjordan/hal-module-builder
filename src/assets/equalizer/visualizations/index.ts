/**
 * Visualization System - Module exports and registration
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 *
 * Central export point for all visualization types and factory system
 * Handles automatic registration and provides convenient access to all visualization functionality
 */

// Core base classes and interfaces
export {
  BaseVisualization,
  type VisualizationMetadata,
  type VisualizationConfig,
  type ValidationResult,
  type RenderContext,
  type FrequencyData,
} from './BaseVisualization';

// Factory and registration system
export {
  VisualizationFactory,
  type VisualizationType,
  type RegistrationInfo,
  type VisualizationFactoryConfig,
} from './VisualizationFactory';

// All visualization implementations
export {
  BarVisualization,
  type BarVisualizationConfig,
} from './BarVisualization';
export {
  DotVisualization,
  type DotVisualizationConfig,
} from './DotVisualization';
export {
  TriangleVisualization,
  type TriangleVisualizationConfig,
} from './TriangleVisualization';
export {
  DiamondVisualization,
  type DiamondVisualizationConfig,
} from './DiamondVisualization';
export {
  HexagonVisualization,
  type HexagonVisualizationConfig,
} from './HexagonVisualization';
export {
  CircleVisualization,
  type CircleVisualizationConfig,
} from './CircleVisualization';

// Import for auto-registration
import { AudioProcessor } from '../AudioProcessor';
import { VisualizationFactory } from './VisualizationFactory';
import { BarVisualization } from './BarVisualization';
import { DotVisualization } from './DotVisualization';
import { TriangleVisualization } from './TriangleVisualization';
import { DiamondVisualization } from './DiamondVisualization';
import { HexagonVisualization } from './HexagonVisualization';
import { CircleVisualization } from './CircleVisualization';

/**
 * Initialize the visualization system with all core visualizations
 * This function should be called once during application startup
 */
export function initializeVisualizationSystem(
  audioProcessor?: AudioProcessor
): void {
  console.log('🎨 Initializing Visualization System...');

  // Configure factory
  const config: any = {
    enableHotSwap: true,
    enableMetrics: true,
    maxInstances: 10,
  };
  if (audioProcessor) {
    config.defaultAudioProcessor = audioProcessor;
  }
  VisualizationFactory.configure(config);

  // Register all visualization types - BAR handles all rectangular rendering modes
  VisualizationFactory.register('bar', BarVisualization);
  VisualizationFactory.register('line', BarVisualization); // BAR handles line mode via style config
  VisualizationFactory.register('block', BarVisualization); // BAR handles block mode via style config
  VisualizationFactory.register('dot', DotVisualization);
  VisualizationFactory.register('triangle', TriangleVisualization);
  VisualizationFactory.register('diamond', DiamondVisualization);
  VisualizationFactory.register('hexagon', HexagonVisualization);
  VisualizationFactory.register('circle', CircleVisualization);

  // Log initialization status
  const status = VisualizationFactory.getStatus();
  console.log(`✅ Visualization System initialized:`, {
    registeredTypes: status.registeredTypes,
    availableTypes: VisualizationFactory.getRegisteredTypes(),
  });
}

/**
 * Get all available visualization types with their metadata
 */
type VisualizationSummary = {
  type: string;
  name: string;
  description: string;
  author?: string;
  version?: string;
  tags?: string[];
};

export function getAvailableVisualizations(): VisualizationSummary[] {
  return VisualizationFactory.getAllRegistrations().map(reg => {
    const summary: VisualizationSummary = {
      type: reg.type,
      name: reg.metadata.name,
      description: reg.metadata.description,
    };

    if (reg.metadata.author !== undefined) {
      summary.author = reg.metadata.author;
    }
    if (reg.metadata.version !== undefined) {
      summary.version = reg.metadata.version;
    }
    if (reg.metadata.tags && reg.metadata.tags.length > 0) {
      summary.tags = reg.metadata.tags;
    }

    return summary;
  });
}

/**
 * Create a visualization instance with type safety and validation
 */
export function createVisualization(
  type: string,
  audioProcessor: AudioProcessor,
  config?: any
): import('./BaseVisualization').BaseVisualization | null {
  const visualization = VisualizationFactory.create(
    type,
    audioProcessor,
    config
  );

  if (!visualization) {
    console.error(`Failed to create visualization of type: ${type}`);
    return null;
  }

  return visualization;
}

/**
 * Get or create a singleton visualization instance
 */
export function getVisualizationInstance(
  type: string,
  audioProcessor: AudioProcessor,
  config?: any
): import('./BaseVisualization').BaseVisualization | null {
  return VisualizationFactory.getInstance(type, audioProcessor, config);
}

/**
 * Validate configuration for a specific visualization type
 */
export function validateVisualizationConfig(
  type: string,
  config: any
): import('./BaseVisualization').ValidationResult {
  return VisualizationFactory.validateConfig(type, config);
}

/**
 * Get default configuration for a visualization type
 */
export function getDefaultConfig(type: string): any | null {
  const registration = VisualizationFactory.getRegistrationInfo(type);
  return registration ? registration.defaultConfig : null;
}

/**
 * Register a custom visualization type
 * Useful for plugins and custom visualizations
 */
export function registerCustomVisualization(
  type: string,
  visualizationClass: any,
  force: boolean = false
): boolean {
  return VisualizationFactory.register(type, visualizationClass, force);
}

/**
 * Hot-swap a visualization implementation
 * Useful for development and live updates
 */
export function hotSwapVisualization(
  type: string,
  newClass: any,
  preserveInstances: boolean = false
): boolean {
  return VisualizationFactory.hotSwap(type, newClass, preserveInstances);
}

/**
 * Get visualization system metrics and status
 */
export function getVisualizationSystemStatus(): {
  registeredTypes: number;
  activeInstances: number;
  totalCreated: number;
  availableTypes: string[];
  metrics: Record<string, number>;
} {
  const status = VisualizationFactory.getStatus();
  const metrics = VisualizationFactory.getMetrics();
  const availableTypes = VisualizationFactory.getRegisteredTypes();

  return {
    ...status,
    availableTypes,
    metrics,
  };
}

/**
 * Cleanup visualization system
 * Should be called during application shutdown
 */
export function cleanupVisualizationSystem(): void {
  console.log('🧹 Cleaning up Visualization System...');
  VisualizationFactory.clear();
  console.log('✅ Visualization System cleanup complete');
}

// Type unions for convenience
export type AllVisualizationTypes =
  | 'bar'
  | 'line' // handled by BAR with style config
  | 'block' // handled by BAR with style config
  | 'dot'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'circle';

export type AllVisualizationConfigs =
  | import('./BarVisualization').BarVisualizationConfig
  | import('./DotVisualization').DotVisualizationConfig
  | import('./TriangleVisualization').TriangleVisualizationConfig
  | import('./DiamondVisualization').DiamondVisualizationConfig
  | import('./HexagonVisualization').HexagonVisualizationConfig
  | import('./CircleVisualization').CircleVisualizationConfig;

// Re-export commonly used types for convenience
export type { AudioProcessor } from '../AudioProcessor';
