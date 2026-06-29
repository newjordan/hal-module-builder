/**
 * Core effect interface for HAL Builder Effects Asset System
 *
 * This module defines the complete interface and type system for visual effects
 * in the HAL Module Builder. Effects can be applied to layers, chained together,
 * and animated in real-time while maintaining 60fps performance.
 *
 * @fileoverview Comprehensive effect system interfaces and types
 * @version 1.0.0
 */

/**
 * Metadata describing an effect implementation
 *
 * Contains all descriptive information about an effect including its
 * capabilities, requirements, and categorization for UI organization.
 *
 * @interface EffectMetadata
 * @example
 * ```typescript
 * const blurMetadata: EffectMetadata = {
 *   type: 'gaussian-blur',
 *   displayName: 'Gaussian Blur',
 *   description: 'Applies smooth blur effect with adjustable radius',
 *   version: '2.1.0',
 *   author: 'HAL Effects Team',
 *   category: 'filter',
 *   requiredFeatures: ['webgl2']
 * };
 * ```
 */
export interface EffectMetadata {
  /** Unique effect type identifier (kebab-case recommended) */
  type: string;
  /** Human-readable display name for UI */
  displayName: string;
  /** Detailed description for documentation and tooltips */
  description: string;
  /** Semantic version for compatibility tracking */
  version: string;
  /** Optional author or creator information */
  author?: string;
  /** Category for UI organization and filtering */
  category: 'color' | 'pattern' | 'distortion' | 'composition' | 'filter';
  /** Required browser features or capabilities */
  requiredFeatures?: string[];
}

/**
 * Parameters that can be applied to effects
 *
 * Defines the complete set of parameters that can control effect behavior,
 * including common parameters shared across all effects and extensibility
 * for effect-specific parameters.
 *
 * @interface EffectParameters
 * @example
 * ```typescript
 * const blurParams: EffectParameters = {
 *   opacity: 0.8,
 *   intensity: 1.0,
 *   enabled: true,
 *   blendMode: 'multiply',
 *   radius: 10,        // Effect-specific parameter
 *   quality: 'high'    // Effect-specific parameter
 * };
 * ```
 */
export interface EffectParameters {
  /** Effect opacity (0.0-1.0) */
  opacity?: number;
  /** Effect intensity multiplier (0.0-∞) */
  intensity?: number;
  /** Whether the effect is enabled */
  enabled?: boolean;
  /** Blend mode for compositing */
  blendMode?: BlendMode;

  /** Effect-specific parameters (extensible) */
  [key: string]: any;
}

/**
 * Descriptor for effect parameters in the UI
 *
 * Defines how effect parameters should be displayed and edited in the
 * property panel, including input types, validation, and animation support.
 *
 * @interface ParameterDescriptor
 * @example
 * ```typescript
 * const radiusDescriptor: ParameterDescriptor = {
 *   key: 'radius',
 *   displayName: 'Blur Radius',
 *   type: 'range',
 *   defaultValue: 5,
 *   min: 0,
 *   max: 50,
 *   step: 0.1,
 *   description: 'Controls the blur radius in pixels',
 *   animatable: true
 * };
 * ```
 */
export interface ParameterDescriptor {
  /** Parameter key in the EffectParameters object */
  key: string;
  /** Human-readable display name for UI */
  displayName: string;
  /** Input type for the parameter editor */
  type: 'number' | 'string' | 'boolean' | 'color' | 'select' | 'range';
  /** Default value when creating new effects */
  defaultValue: any;
  /** Minimum value for numeric parameters */
  min?: number;
  /** Maximum value for numeric parameters */
  max?: number;
  /** Step increment for range inputs */
  step?: number;
  /** Available options for select inputs */
  options?: Array<{ value: any; label: string }>;
  /** Help text or description for tooltips */
  description?: string;
  /** Whether this parameter supports animation */
  animatable?: boolean;
}

export interface ValidationResult {
  /** Whether parameters are valid */
  isValid: boolean;
  /** Validation errors if any */
  errors: string[];
  /** Warnings (non-blocking) */
  warnings?: string[];
}

export interface EffectContext {
  /** Canvas element for rendering */
  canvas: HTMLCanvasElement;
  /** Rendering context (2D or WebGL) */
  ctx: CanvasRenderingContext2D | WebGLRenderingContext;
  /** Canvas dimensions */
  dimensions: { width: number; height: number };
  /** Animation time (for animated effects) */
  time: number;
  /** Frame delta for smooth animations */
  deltaTime?: number;
  /** Reference to parent chain if part of a chain */
  chain?: EffectChain;
  /** Audio data for reactive effects */
  audioData?: number[];
  /** Theme information for consistent styling */
  theme?: 'frost_light' | 'frost_dark';
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type ComplexityLevel = 'low' | 'medium' | 'high' | 'extreme';

export interface Mask {
  /** Mask type */
  type: 'shape' | 'gradient' | 'image';
  /** Mask configuration */
  config: any;
  /** Whether to invert the mask */
  invert?: boolean;
}

/**
 * Main effect interface that all effects must implement
 *
 * Defines the complete contract for effect implementations in the HAL Module Builder.
 * Effects must provide processing capabilities, parameter management, validation,
 * and integration with the animation and chaining systems.
 *
 * @interface IEffect
 * @example
 * ```typescript
 * class GaussianBlurEffect implements IEffect {
 *   readonly metadata: EffectMetadata = {
 *     type: 'gaussian-blur',
 *     displayName: 'Gaussian Blur',
 *     description: 'Smooth blur effect',
 *     version: '1.0.0',
 *     category: 'filter'
 *   };
 *
 *   readonly defaultParameters: EffectParameters = {
 *     radius: 5,
 *     quality: 'medium'
 *   };
 *
 *   async process(input, params, context) {
 *     // Effect implementation
 *     return processedOutput;
 *   }
 *
 *   // ... other required methods
 * }
 * ```
 */
export interface IEffect {
  /** Effect metadata and description */
  readonly metadata: EffectMetadata;

  /** Default parameters for new effect instances */
  readonly defaultParameters: EffectParameters;

  /**
   * Process input through this effect
   *
   * The core method that applies the effect to input data. Should be optimized
   * for performance and support both ImageData and Canvas inputs.
   *
   * @param input - Input image data or canvas element
   * @param parameters - Effect parameters controlling the processing
   * @param context - Rendering context with canvas, timing, and environment info
   * @returns Promise resolving to processed output
   * @example
   * ```typescript
   * const result = await effect.process(inputCanvas, {
   *   intensity: 0.8,
   *   radius: 10
   * }, {
   *   canvas: outputCanvas,
   *   ctx: outputCanvas.getContext('2d'),
   *   dimensions: { width: 800, height: 600 },
   *   time: performance.now()
   * });
   * ```
   */
  process(
    input: ImageData | HTMLCanvasElement,
    parameters: EffectParameters,
    context: EffectContext
  ): Promise<ImageData | HTMLCanvasElement>;

  /**
   * Validate effect parameters
   * @param params - Parameters to validate
   * @returns Validation result
   */
  validateParameters(params: EffectParameters): ValidationResult;

  /**
   * Get parameter descriptors for UI generation
   * @returns Array of parameter descriptors
   */
  getParameterDescriptors(): ParameterDescriptor[];

  /**
   * Get list of animatable parameters
   * @returns Array of parameter keys that can be animated
   */
  getAnimatableParameters(): string[];

  /**
   * Check if this effect can be chained with another
   * @param effect - Other effect to check compatibility
   * @returns Whether chaining is supported
   */
  canChainWith(effect: IEffect): boolean;

  /**
   * Get supported blend modes for this effect
   * @returns Array of supported blend modes
   */
  getSupportedBlendModes(): BlendMode[];

  /**
   * Check if effect supports masking
   * @returns Whether masking is supported
   */
  supportsMasking(): boolean;

  /**
   * Check if effect result can be cached with given parameters
   * @param params - Effect parameters
   * @returns Whether result can be cached
   */
  canCache(params: EffectParameters): boolean;

  /**
   * Estimate computational complexity for optimization
   * @param params - Effect parameters
   * @param context - Rendering context
   * @returns Complexity estimate
   */
  estimateComplexity(
    params: EffectParameters,
    context: EffectContext
  ): ComplexityLevel;

  /**
   * Cleanup resources when effect is destroyed
   */
  dispose(): void;
}

/**
 * Effect chain interface for processing multiple effects
 */
export interface EffectChain {
  /** Chain identifier */
  id: string;

  /** Effects in processing order */
  effects: Array<{
    effect: IEffect;
    parameters: EffectParameters;
    blendMode: BlendMode;
    opacity: number;
    mask?: Mask;
    enabled: boolean;
  }>;

  /**
   * Process input through entire chain
   * @param input - Input image data
   * @param context - Rendering context
   * @returns Final processed output
   */
  process(
    input: ImageData | HTMLCanvasElement,
    context: EffectContext
  ): Promise<ImageData | HTMLCanvasElement>;

  /**
   * Add effect to chain at specified position
   * @param effect - Effect to add
   * @param position - Position in chain (default: end)
   */
  addEffect(effect: IEffect, position?: number): void;

  /**
   * Remove effect from chain
   * @param effectId - Effect to remove
   */
  removeEffect(effectId: string): void;

  /**
   * Reorder effects in chain
   * @param fromIndex - Current position
   * @param toIndex - New position
   */
  reorderEffects(fromIndex: number, toIndex: number): void;

  /**
   * Get total estimated complexity
   * @param context - Rendering context
   * @returns Combined complexity estimate
   */
  getComplexity(context: EffectContext): ComplexityLevel;

  /**
   * Cleanup all resources
   */
  dispose(): void;
}

/**
 * Base abstract class for effects (optional helper)
 */
export abstract class BaseEffect implements IEffect {
  abstract readonly metadata: EffectMetadata;
  abstract readonly defaultParameters: EffectParameters;

  abstract process(
    input: ImageData | HTMLCanvasElement,
    parameters: EffectParameters,
    context: EffectContext
  ): Promise<ImageData | HTMLCanvasElement>;

  abstract getParameterDescriptors(): ParameterDescriptor[];

  validateParameters(params: EffectParameters): ValidationResult {
    const descriptors = this.getParameterDescriptors();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const descriptor of descriptors) {
      const value = params[descriptor.key];

      if (value === undefined || value === null) {
        if (descriptor.defaultValue === undefined) {
          errors.push(`Missing required parameter: ${descriptor.key}`);
        }
        continue;
      }

      // Type validation
      switch (descriptor.type) {
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`Parameter ${descriptor.key} must be a number`);
            break;
          }
          if (descriptor.min !== undefined && value < descriptor.min) {
            errors.push(
              `Parameter ${descriptor.key} must be >= ${descriptor.min}`
            );
          }
          if (descriptor.max !== undefined && value > descriptor.max) {
            errors.push(
              `Parameter ${descriptor.key} must be <= ${descriptor.max}`
            );
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter ${descriptor.key} must be a boolean`);
          }
          break;

        case 'string':
        case 'color':
          if (typeof value !== 'string') {
            errors.push(`Parameter ${descriptor.key} must be a string`);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getAnimatableParameters(): string[] {
    return this.getParameterDescriptors()
      .filter(desc => desc.animatable === true)
      .map(desc => desc.key);
  }

  canChainWith(_effect: IEffect): boolean {
    return true; // Most effects can be chained by default
  }

  getSupportedBlendModes(): BlendMode[] {
    return ['normal', 'multiply', 'screen', 'overlay']; // Common blend modes
  }

  supportsMasking(): boolean {
    return false; // Override in subclasses that support masking
  }

  canCache(_params: EffectParameters): boolean {
    return true; // Most static effects can be cached
  }

  estimateComplexity(
    _params: EffectParameters,
    _context: EffectContext
  ): ComplexityLevel {
    return 'medium'; // Default complexity
  }

  dispose(): void {
    // Override in subclasses that need cleanup
  }
}
