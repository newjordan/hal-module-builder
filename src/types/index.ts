/**
 * Central type definitions for HAL Module Builder
 *
 * This file serves as the main entry point for all TypeScript types used throughout
 * the HAL Module Builder application. It provides comprehensive type safety for
 * layers, templates, audio processing, performance monitoring, and UI components.
 *
 * @fileoverview Core type definitions and re-exports for HAL Module Builder
 */

// Re-export existing types
export * from './layer-types';

// Import the types we need to use in this file
import type { Layer, LayerGroup } from './layer-types';

/**
 * Theme configuration interface for HAL Module Builder
 *
 * Defines the structure for theme objects that control the visual appearance
 * of the application through CSS custom properties.
 *
 * @interface Theme
 * @example
 * ```typescript
 * const lightTheme: Theme = {
 *   id: 'frost_light',
 *   name: 'Frost Light',
 *   cssVars: {
 *     '--frost-surface-primary': '#ffffff',
 *     '--frost-border-subtle': '#e5e7eb'
 *   },
 *   isDark: false
 * };
 * ```
 */
export interface Theme {
  /** Unique identifier for the theme */
  id: string;
  /** Human-readable theme name */
  name: string;
  /** CSS custom properties that define theme colors and styles */
  cssVars: Record<string, string>;
  /** Whether this is a dark theme variant */
  isDark: boolean;
}

/**
 * Available theme names in the HAL Module Builder
 *
 * Restricts theme selection to the two supported Frost Glass themes.
 *
 * @example
 * ```typescript
 * const currentTheme: ThemeName = 'frost_light';
 * // or
 * const darkTheme: ThemeName = 'frost_dark';
 * ```
 */
export type ThemeName = 'frost_light' | 'frost_dark';

/**
 * Template definition for HAL Module Builder projects
 *
 * Templates are complete project configurations that include layers, groups,
 * and metadata. They can be saved, loaded, and shared between users.
 *
 * @interface Template
 * @example
 * ```typescript
 * const myTemplate: Template = {
 *   id: 'template_001',
 *   name: 'Audio Visualizer Base',
 *   description: 'A basic audio visualizer with multiple layers',
 *   layers: [equalizerLayer, backgroundLayer],
 *   metadata: {
 *     version: '1.0.0',
 *     author: 'Designer Name',
 *     tags: ['audio', 'visualizer', 'basic'],
 *     difficulty: 'beginner'
 *   },
 *   createdAt: Date.now(),
 *   updatedAt: Date.now()
 * };
 * ```
 */
export interface Template {
  /** Unique identifier for the template */
  id: string;
  /** Human-readable template name */
  name: string;
  /** Optional description of the template's purpose */
  description?: string;
  /** Base64-encoded thumbnail image for template preview */
  thumbnail?: string;
  /** Array of layers that make up this template */
  layers: Layer[];
  /** Optional layer groups for organization */
  groups?: LayerGroup[];
  /** Template metadata and categorization information */
  metadata: TemplateMetadata;
  /** Unix timestamp when template was created */
  createdAt: number;
  /** Unix timestamp when template was last modified */
  updatedAt: number;
}

/**
 * Metadata associated with templates for categorization and discovery
 *
 * Provides additional information about templates to help with organization,
 * filtering, and user guidance.
 *
 * @interface TemplateMetadata
 * @example
 * ```typescript
 * const metadata: TemplateMetadata = {
 *   version: '2.1.0',
 *   author: 'HAL Design Team',
 *   category: 'Audio Visualization',
 *   tags: ['advanced', 'multi-layer', 'responsive'],
 *   difficulty: 'advanced'
 * };
 * ```
 */
export interface TemplateMetadata {
  /** Semantic version of the template format */
  version: string;
  /** Optional author or creator name */
  author?: string;
  /** Optional category for template organization */
  category?: string;
  /** Tags for searchability and filtering */
  tags: string[];
  /** Skill level required to use or modify this template */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Audio processing configuration for the HAL Module Builder
 *
 * Defines parameters for Web Audio API processing including FFT analysis,
 * buffer management, and frequency analysis settings.
 *
 * @interface AudioConfig
 * @example
 * ```typescript
 * const config: AudioConfig = {
 *   sampleRate: 44100,
 *   bufferSize: 2048,
 *   fftSize: 2048,
 *   smoothingTimeConstant: 0.8,
 *   minDecibels: -90,
 *   maxDecibels: -10
 * };
 * ```
 */
export interface AudioConfig {
  /** Audio sample rate in Hz (typically 44100 or 48000) */
  sampleRate: number;
  /** Buffer size for audio processing (power of 2) */
  bufferSize: number;
  /** FFT size for frequency analysis (power of 2, max 32768) */
  fftSize: number;
  /** Smoothing factor for frequency data (0.0-1.0) */
  smoothingTimeConstant: number;
  /** Minimum decibel value for frequency analysis */
  minDecibels: number;
  /** Maximum decibel value for frequency analysis */
  maxDecibels: number;
}

/**
 * Real-time audio data from Web Audio API analysis
 *
 * Contains processed audio information including frequency and time domain data
 * for visualization and analysis purposes.
 *
 * @interface AudioData
 * @example
 * ```typescript
 * const processAudioData = (data: AudioData) => {
 *   // Access frequency data for visualization
 *   const bass = data.frequencyData.slice(0, 64);
 *   const treble = data.frequencyData.slice(192, 256);
 *
 *   // Use timestamp for synchronization
 *   console.log(`Audio data from ${data.timestamp}`);
 * };
 * ```
 */
export interface AudioData {
  /** Frequency domain data (0-255 values representing amplitude) */
  frequencyData: Uint8Array;
  /** Time domain data (waveform data) */
  timeData: Uint8Array;
  /** Current audio sample rate */
  sampleRate: number;
  /** Timestamp when this data was captured */
  timestamp: number;
}

/**
 * Performance metrics collected during application runtime
 *
 * Tracks key performance indicators to ensure the application maintains
 * 60fps performance with multiple animated layers.
 *
 * @interface PerformanceMetrics
 * @example
 * ```typescript
 * const currentMetrics: PerformanceMetrics = {
 *   fps: 60,
 *   frameTime: 16.67, // milliseconds per frame
 *   renderTime: 12.3,  // rendering time in ms
 *   memoryUsage: 45.2, // MB
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  /** Time taken for each frame in milliseconds */
  frameTime: number;
  /** Time spent rendering in milliseconds */
  renderTime: number;
  /** Current memory usage in megabytes */
  memoryUsage: number;
  /** When these metrics were captured */
  timestamp: number;
}

/**
 * Performance threshold configuration for monitoring
 *
 * Defines acceptable performance limits. Exceeding these thresholds
 * triggers warnings or performance optimization measures.
 *
 * @interface PerformanceThresholds
 * @example
 * ```typescript
 * const thresholds: PerformanceThresholds = {
 *   minFps: 55,        // Warn below 55 FPS
 *   maxFrameTime: 20,  // Warn above 20ms per frame
 *   maxRenderTime: 15, // Warn above 15ms render time
 *   maxMemoryUsage: 100 // Warn above 100MB
 * };
 * ```
 */
export interface PerformanceThresholds {
  /** Minimum acceptable FPS before warnings */
  minFps: number;
  /** Maximum acceptable frame time in milliseconds */
  maxFrameTime: number;
  /** Maximum acceptable render time in milliseconds */
  maxRenderTime: number;
  /** Maximum acceptable memory usage in megabytes */
  maxMemoryUsage: number;
}

/**
 * Error information captured by React Error Boundaries
 *
 * Contains React component stack trace information for debugging
 * component-level errors.
 *
 * @interface ErrorInfo
 */
export interface ErrorInfo {
  /** React component stack trace */
  componentStack: string;
  /** Optional error boundary component name */
  errorBoundary?: string;
}

/**
 * Enhanced error object with additional context for debugging
 *
 * Extends the standard Error object with application-specific
 * information for better error tracking and debugging.
 *
 * @interface AppError
 * @extends Error
 * @example
 * ```typescript
 * const layerError: AppError = {
 *   name: 'LayerProcessingError',
 *   message: 'Failed to update layer properties',
 *   code: 'LAYER_UPDATE_FAILED',
 *   context: {
 *     layerId: 'layer_123',
 *     operation: 'updateOpacity'
 *   },
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface AppError extends Error {
  /** Optional error code for categorization */
  code?: string;
  /** Additional context data for debugging */
  context?: Record<string, unknown>;
  /** When this error occurred */
  timestamp: number;
}

/**
 * Base props interface for all HAL Module Builder components
 *
 * Provides common props that all components should support for
 * consistent styling and testing.
 *
 * @interface BaseComponentProps
 * @example
 * ```typescript
 * interface MyComponentProps extends BaseComponentProps {
 *   title: string;
 *   onUpdate: () => void;
 * }
 *
 * const MyComponent: React.FC<MyComponentProps> = ({
 *   className,
 *   style,
 *   'data-testid': testId,
 *   title,
 *   onUpdate
 * }) => (
 *   <div className={className} style={style} data-testid={testId}>
 *     {title}
 *   </div>
 * );
 * ```
 */
export interface BaseComponentProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional test identifier for automated testing */
  'data-testid'?: string;
}

/**
 * Available animation types for layers and effects
 *
 * Defines the supported animation modes for visual elements.
 *
 * @example
 * ```typescript
 * const layerAnimation: AnimationType = 'rotate';
 * // or
 * const staticLayer: AnimationType = 'none';
 * ```
 */
export type AnimationType = 'none' | 'rotate' | 'pulse' | 'custom';

/**
 * CSS blend modes supported by the layer system
 *
 * These blend modes determine how layers composite with each other,
 * following standard CSS blend mode specifications.
 *
 * @example
 * ```typescript
 * const overlayMode: BlendMode = 'overlay';
 * const multiplyMode: BlendMode = 'multiply';
 * ```
 */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

/**
 * Global application state structure
 *
 * Represents the complete state of the HAL Module Builder application
 * including layers, templates, performance metrics, and user preferences.
 *
 * @interface AppState
 * @example
 * ```typescript
 * const initialState: AppState = {
 *   layers: [],
 *   groups: [],
 *   selectedLayerIds: [],
 *   currentTheme: 'frost_light',
 *   audioEnabled: true,
 *   templates: [],
 *   performance: {
 *     fps: 60,
 *     frameTime: 16.67,
 *     renderTime: 12,
 *     memoryUsage: 45,
 *     timestamp: Date.now()
 *   },
 *   error: null
 * };
 * ```
 */
export interface AppState {
  /** Current layers in the project */
  layers: Layer[];
  /** Layer groups for organization */
  groups: LayerGroup[];
  /** Currently selected layer IDs */
  selectedLayerIds: string[];
  /** Active theme (frost_light or frost_dark) */
  currentTheme: ThemeName;
  /** Whether audio processing is enabled */
  audioEnabled: boolean;
  /** Available templates */
  templates: Template[];
  /** Current performance metrics */
  performance: PerformanceMetrics;
  /** Current error state, if any */
  error: AppError | null;
}

/**
 * Utility type for making all properties of an object optional recursively
 *
 * Useful for partial updates and configuration objects where not all
 * properties need to be specified.
 *
 * @example
 * ```typescript
 * interface Config {
 *   audio: {
 *     sampleRate: number;
 *     bufferSize: number;
 *   };
 *   theme: string;
 * }
 *
 * const partialConfig: DeepPartial<Config> = {
 *   audio: {
 *     sampleRate: 48000
 *     // bufferSize is optional
 *   }
 *   // theme is optional
 * };
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type for making specific keys required in an object
 *
 * Useful when you need to ensure certain properties are always present
 * while keeping others optional.
 *
 * @example
 * ```typescript
 * interface LayerUpdate {
 *   id?: string;
 *   name?: string;
 *   opacity?: number;
 * }
 *
 * // Require id to be present
 * type LayerUpdateWithId = RequiredKeys<LayerUpdate, 'id'>;
 * ```
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for making specific keys optional in an object
 *
 * Useful for creating variants of interfaces where certain properties
 * become optional.
 *
 * @example
 * ```typescript
 * interface FullLayer {
 *   id: string;
 *   name: string;
 *   type: string;
 *   visible: boolean;
 * }
 *
 * // Make 'visible' optional
 * type LayerInput = Optional<FullLayer, 'visible'>;
 * ```
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
