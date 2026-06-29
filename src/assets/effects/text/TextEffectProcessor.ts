/**
 * HAL Text Effect Processor
 * =========================
 *
 * Text-specific effect processor that integrates with existing EffectLibrary.
 * Handles character-level and text-level effect application for radial text.
 *
 * Single Responsibility: Text effect processing and application only.
 * Integrates seamlessly with existing effect pipeline.
 *
 * @version 1.0.0
 * @requires EffectLibrary
 */

import {
  IEffect,
  EffectMetadata,
  EffectParameters,
  EffectContext,
  ParameterDescriptor,
  ValidationResult,
  ComplexityLevel,
  BlendMode,
} from '../IEffect';
import {
  RadialTextCharacter,
  RadialTextEffects,
  FrostTheme,
} from '../../../types/radial-text-types';

/**
 * Context for text effect processing
 * Extends existing EffectContext with text-specific data
 */
export interface TextEffectContext extends Omit<EffectContext, 'audioData'> {
  /** Canvas rendering context */
  canvasCtx: CanvasRenderingContext2D;
  /** Character being processed */
  character: RadialTextCharacter;
  /** All characters in the text */
  allCharacters: RadialTextCharacter[];
  /** MANDATORY frost_glass.css theme - override base type */
  theme: FrostTheme;
  /** Audio data for reactive effects (Float32Array) - override base type */
  audioData?: Float32Array;
  /** Current time for animations */
  timestamp: number;
}

/**
 * Text-specific effect parameters
 * Extends existing EffectParameters with text properties
 */
export interface TextEffectParameters extends EffectParameters {
  /** Text effects configuration */
  effects: RadialTextEffects;
  /** Character index for per-character effects */
  characterIndex?: number;
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Audio reactivity factor (0-1) */
  audioReactivity?: number;
}

/**
 * Result of text effect processing
 */
export interface TextEffectResult {
  /** Whether the effect was applied successfully */
  success: boolean;
  /** Modified character (if character-level effect) */
  character?: RadialTextCharacter;
  /** Canvas state modifications applied */
  canvasModifications: {
    fillStyle?: string;
    strokeStyle?: string;
    globalAlpha?: number;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    filter?: string;
  };
  /** Performance metrics */
  processTime: number;
}

/**
 * Base class for text-specific effects
 * Implements IEffect interface for compatibility with EffectLibrary
 */
export abstract class BaseTextEffect implements IEffect {
  abstract readonly metadata: EffectMetadata;
  abstract readonly defaultParameters: TextEffectParameters;

  /**
   * Process text effect - IEffect interface implementation
   * Adapts IEffect.process to work with text effects
   */
  async process(
    input: HTMLCanvasElement | ImageData,
    _parameters: EffectParameters,
    _context: EffectContext
  ): Promise<HTMLCanvasElement | ImageData> {
    // This is the IEffect interface - we'll implement a wrapper
    // The actual text processing happens in processText method
    return input;
  }

  /**
   * Validate parameters - implement IEffect requirement
   */
  validateParameters(params: EffectParameters): ValidationResult {
    // Convert to text parameters and validate
    const textParams = params as TextEffectParameters;
    const textValidation = this.validateTextParameters(textParams);

    return {
      isValid: textValidation.isValid,
      errors: textValidation.errors,
    };
  }

  /**
   * Get animatable parameters - implement IEffect requirement
   */
  getAnimatableParameters(): string[] {
    return this.getTextParameterDescriptors()
      .filter(desc => desc.type === 'number')
      .map(desc => desc.name);
  }

  /**
   * Check if this effect can be chained with another - implement IEffect requirement
   */
  canChainWith(_effect: IEffect): boolean {
    return true; // Text effects can be chained
  }

  /**
   * Get supported blend modes - implement IEffect requirement
   */
  getSupportedBlendModes(): BlendMode[] {
    return ['normal', 'multiply', 'screen', 'overlay'];
  }

  /**
   * Check if effect supports masking - implement IEffect requirement
   */
  supportsMasking(): boolean {
    return false; // Text effects don't support masking
  }

  /**
   * Check if effect result can be cached - implement IEffect requirement
   */
  canCache(_params: EffectParameters): boolean {
    return false; // Text effects are dynamic
  }

  /**
   * Estimate computational complexity - implement IEffect requirement
   */
  estimateComplexity(
    _params: EffectParameters,
    _context: EffectContext
  ): ComplexityLevel {
    return 'low'; // Text effects are relatively simple
  }

  /**
   * Process text effect on a single character
   * Main text effect processing method
   */
  abstract processText(
    context: TextEffectContext,
    parameters: TextEffectParameters
  ): Promise<TextEffectResult>;

  /**
   * Get parameter descriptors for UI generation
   * Converts text parameters to IEffect format
   */
  getParameterDescriptors(): ParameterDescriptor[] {
    const textDescriptors = this.getTextParameterDescriptors();
    return textDescriptors.map(desc => {
      const result: ParameterDescriptor = {
        key: desc.name,
        displayName: desc.name,
        type: desc.type as ParameterDescriptor['type'],
        defaultValue: desc.default,
        description: desc.description,
      };
      if (desc.min !== undefined) result.min = desc.min;
      if (desc.max !== undefined) result.max = desc.max;
      return result;
    });
  }

  /**
   * Get text-specific parameter descriptors
   * Subclasses override this instead of getParameterDescriptors
   */
  abstract getTextParameterDescriptors(): Array<{
    name: string;
    type: 'number' | 'string' | 'boolean' | 'color';
    default: any;
    min?: number;
    max?: number;
    description: string;
  }>;

  /**
   * Validate parameters before processing
   * Ensures parameters are valid for this effect
   */
  abstract validateTextParameters(parameters: TextEffectParameters): {
    isValid: boolean;
    errors: string[];
  };

  /**
   * Cleanup effect resources
   * Called when effect is removed or component unmounts
   */
  dispose(): void {
    // Base cleanup - subclasses can override
  }

  /**
   * Check if effect supports audio reactivity
   */
  get supportsAudioReactivity(): boolean {
    return false;
  }

  /**
   * Check if effect is character-level or text-level
   */
  get isCharacterLevel(): boolean {
    return true;
  }
}

/**
 * Text Effect Processor
 * Main class for processing text effects using the EffectLibrary system
 */
export class TextEffectProcessor {
  private static instance: TextEffectProcessor | null = null;
  private registeredEffects: Map<string, BaseTextEffect> = new Map();

  private constructor() {
    // Singleton pattern following EffectLibrary design
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TextEffectProcessor {
    if (!TextEffectProcessor.instance) {
      TextEffectProcessor.instance = new TextEffectProcessor();
    }
    return TextEffectProcessor.instance;
  }

  /**
   * Register a text effect with the processor
   */
  registerEffect(effect: BaseTextEffect): boolean {
    try {
      const effectType = effect.metadata.type;

      // Validate effect
      const validation = this.validateEffect(effect);
      if (!validation.isValid) {
        console.error(
          `Cannot register text effect ${effectType}:`,
          validation.errors
        );
        return false;
      }

      // Check for duplicates
      if (this.registeredEffects.has(effectType)) {
        console.warn(`Text effect ${effectType} already registered. Skipping.`);
        return false;
      }

      this.registeredEffects.set(effectType, effect);
      console.log(`Text effect registered: ${effectType}`);
      return true;
    } catch (error) {
      console.error('Failed to register text effect:', error);
      return false;
    }
  }

  /**
   * Process effects for a single character
   * Main processing method for character-level effects
   */
  async processCharacterEffects(
    character: RadialTextCharacter,
    allCharacters: RadialTextCharacter[],
    effects: RadialTextEffects,
    context: {
      canvasCtx: CanvasRenderingContext2D;
      theme: FrostTheme;
      audioData?: Float32Array;
      timestamp: number;
    }
  ): Promise<RadialTextCharacter> {
    const textContext: TextEffectContext = {
      canvasCtx: context.canvasCtx,
      character,
      allCharacters,
      theme: context.theme,
      timestamp: context.timestamp,
      // Base EffectContext properties
      canvas: context.canvasCtx.canvas,
      ctx: context.canvasCtx,
      dimensions: {
        width: context.canvasCtx.canvas.width,
        height: context.canvasCtx.canvas.height,
      },
      time: context.timestamp,
    };
    if (context.audioData !== undefined) {
      textContext.audioData = context.audioData;
    }

    const parameters: TextEffectParameters = {
      effects,
      characterIndex: character.index,
      intensity: 1.0,
      audioReactivity: this.calculateAudioReactivity(
        character,
        context.audioData
      ),
    };

    let processedCharacter = { ...character };

    // Apply glow effect if enabled
    if (effects.glowIntensity > 0) {
      const glowResult = await this.applyGlowEffect(textContext, parameters);
      if (glowResult.success && glowResult.character) {
        processedCharacter = glowResult.character;
      }
    }

    // Apply stroke effect if configured
    if (effects.strokeWidth && effects.strokeWidth > 0) {
      const strokeResult = await this.applyStrokeEffect(
        textContext,
        parameters
      );
      if (strokeResult.success && strokeResult.character) {
        processedCharacter = strokeResult.character;
      }
    }

    // Apply gradient effects based on color mode
    if (
      effects.colorMode === 'gradient' ||
      effects.colorMode === 'radial-gradient'
    ) {
      const gradientResult = await this.applyGradientEffect(
        textContext,
        parameters
      );
      if (gradientResult.success && gradientResult.character) {
        processedCharacter = gradientResult.character;
      }
    }

    // Apply rainbow effect
    if (effects.colorMode === 'rainbow') {
      const rainbowResult = await this.applyRainbowEffect(
        textContext,
        parameters
      );
      if (rainbowResult.success && rainbowResult.character) {
        processedCharacter = rainbowResult.character;
      }
    }

    // Apply audio reactive effects
    if (effects.colorMode === 'reactive' && context.audioData) {
      const reactiveResult = await this.applyAudioReactiveEffect(
        textContext,
        parameters
      );
      if (reactiveResult.success && reactiveResult.character) {
        processedCharacter = reactiveResult.character;
      }
    }

    return processedCharacter;
  }

  /**
   * Apply glow effect to character
   * Creates multi-pass glow for realistic appearance
   */
  private async applyGlowEffect(
    context: TextEffectContext,
    parameters: TextEffectParameters
  ): Promise<TextEffectResult> {
    const startTime = performance.now();
    const { effects } = parameters;
    const { canvasCtx, character } = context;

    try {
      const glowColor = effects.glowColor || effects.primaryColor;
      const intensity = effects.glowIntensity;

      // Apply glow to canvas context
      const originalGlobalAlpha = canvasCtx.globalAlpha;
      const glowPasses = Math.ceil(intensity * 3);

      for (let i = 0; i < glowPasses; i++) {
        canvasCtx.globalAlpha = (intensity / glowPasses) * 0.3;
        canvasCtx.shadowColor = glowColor;
        canvasCtx.shadowBlur = (i + 1) * intensity * 10;
        canvasCtx.shadowOffsetX = 0;
        canvasCtx.shadowOffsetY = 0;
      }

      // Restore original alpha
      canvasCtx.globalAlpha = originalGlobalAlpha;

      return {
        success: true,
        character,
        canvasModifications: {
          shadowColor: glowColor,
          shadowBlur: intensity * 10,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        processTime: performance.now() - startTime,
      };
    } catch (error) {
      console.error('Glow effect processing failed:', error);
      return {
        success: false,
        canvasModifications: {},
        processTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Apply stroke effect to character
   * Adds outline/border around text characters
   */
  private async applyStrokeEffect(
    context: TextEffectContext,
    parameters: TextEffectParameters
  ): Promise<TextEffectResult> {
    const startTime = performance.now();
    const { effects } = parameters;
    const { canvasCtx } = context;

    try {
      const strokeColor = effects.strokeColor || '#000000';
      const strokeWidth = effects.strokeWidth || 1;

      // Apply stroke to canvas context
      canvasCtx.strokeStyle = strokeColor;
      canvasCtx.lineWidth = strokeWidth;
      canvasCtx.lineJoin = 'round';
      canvasCtx.lineCap = 'round';

      return {
        success: true,
        canvasModifications: {
          strokeStyle: strokeColor,
        },
        processTime: performance.now() - startTime,
      };
    } catch (error) {
      console.error('Stroke effect processing failed:', error);
      return {
        success: false,
        canvasModifications: {},
        processTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Apply gradient effect to character
   * Creates linear or radial gradients based on configuration
   */
  private async applyGradientEffect(
    context: TextEffectContext,
    parameters: TextEffectParameters
  ): Promise<TextEffectResult> {
    const startTime = performance.now();
    const { effects } = parameters;
    const { canvasCtx } = context;

    try {
      const primaryColor = effects.primaryColor;
      const secondaryColor = effects.secondaryColor || primaryColor;

      let gradient: CanvasGradient;

      if (effects.colorMode === 'radial-gradient') {
        // Create radial gradient centered on character
        gradient = canvasCtx.createRadialGradient(0, 0, 0, 0, 0, 20);
      } else {
        // Create linear gradient
        gradient = canvasCtx.createLinearGradient(-20, -10, 20, 10);
      }

      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, secondaryColor);

      return {
        success: true,
        canvasModifications: {
          fillStyle: gradient.toString(), // Canvas gradients convert to string
        },
        processTime: performance.now() - startTime,
      };
    } catch (error) {
      console.error('Gradient effect processing failed:', error);
      return {
        success: false,
        canvasModifications: {},
        processTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Apply rainbow effect to character
   * Creates rainbow coloring based on character position
   */
  private async applyRainbowEffect(
    context: TextEffectContext,
    _parameters: TextEffectParameters
  ): Promise<TextEffectResult> {
    const startTime = performance.now();
    const { character, timestamp } = context;

    try {
      // Calculate rainbow hue based on character index and time
      const baseHue = (character.index * 30) % 360;
      const animatedHue = (baseHue + timestamp * 0.1) % 360;
      const rainbowColor = `hsl(${animatedHue}, 70%, 60%)`;

      return {
        success: true,
        character: {
          ...character,
          // Store color in character for later use
        },
        canvasModifications: {
          fillStyle: rainbowColor,
        },
        processTime: performance.now() - startTime,
      };
    } catch (error) {
      console.error('Rainbow effect processing failed:', error);
      return {
        success: false,
        canvasModifications: {},
        processTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Apply audio reactive effect to character
   * Modifies character properties based on audio data
   */
  private async applyAudioReactiveEffect(
    context: TextEffectContext,
    parameters: TextEffectParameters
  ): Promise<TextEffectResult> {
    const startTime = performance.now();
    const { character, audioData } = context;
    const { effects } = parameters;

    try {
      if (!audioData || audioData.length === 0) {
        return {
          success: false,
          canvasModifications: {},
          processTime: performance.now() - startTime,
        };
      }

      // Map character to audio frequency band
      const audioIndex = character.index % audioData.length;
      const audioValue = (audioData[audioIndex] ?? 0) / 255; // Normalize to 0-1
      const intensity = Math.min(audioValue * 2, 1);

      // Create reactive color based on audio intensity
      const baseColor = this.hexToRgb(effects.primaryColor);
      const reactiveColor = `rgba(${baseColor.r + intensity * 100}, ${baseColor.g + intensity * 100}, ${baseColor.b}, ${0.6 + intensity * 0.4})`;

      // Scale character based on audio intensity
      const audioScale = 1 + intensity * 0.3;

      return {
        success: true,
        character: {
          ...character,
          scale: character.scale * audioScale,
          opacity: character.opacity * (0.7 + intensity * 0.3),
        },
        canvasModifications: {
          fillStyle: reactiveColor,
          globalAlpha: character.opacity,
        },
        processTime: performance.now() - startTime,
      };
    } catch (error) {
      console.error('Audio reactive effect processing failed:', error);
      return {
        success: false,
        canvasModifications: {},
        processTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Calculate audio reactivity for a character
   * Maps character to frequency bands for reactive effects
   */
  private calculateAudioReactivity(
    character: RadialTextCharacter,
    audioData?: Float32Array
  ): number {
    if (!audioData || audioData.length === 0) {
      return 0;
    }

    const audioIndex = character.index % audioData.length;
    return (audioData[audioIndex] ?? 0) / 255; // Normalize to 0-1
  }

  /**
   * Convert hex color to RGB components
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1] ?? '0', 16),
          g: parseInt(result[2] ?? '0', 16),
          b: parseInt(result[3] ?? '0', 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Validate text effect before registration
   */
  private validateEffect(effect: BaseTextEffect): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!effect.metadata) {
      errors.push('Effect metadata is required');
    } else {
      if (!effect.metadata.type) {
        errors.push('Effect type is required');
      }
      if (!effect.metadata.displayName) {
        errors.push('Effect display name is required');
      }
    }

    if (typeof effect.process !== 'function') {
      errors.push('Effect must implement process method');
    }

    if (!effect.defaultParameters) {
      errors.push('Effect must provide default parameters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all registered text effects
   */
  getRegisteredEffects(): Map<string, BaseTextEffect> {
    return new Map(this.registeredEffects);
  }

  /**
   * Get specific text effect by type
   */
  getEffect(effectType: string): BaseTextEffect | null {
    return this.registeredEffects.get(effectType) || null;
  }

  /**
   * Clear all registered effects (for testing)
   */
  clear(): void {
    for (const [, effect] of this.registeredEffects) {
      effect.dispose();
    }
    this.registeredEffects.clear();
  }
}
