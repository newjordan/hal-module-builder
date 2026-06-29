/**
 * HAL Radial Text Service
 * ======================
 *
 * Core service for radial text positioning, character layout, and text flow calculations.
 * Extends existing RadialTransformService functionality with text-specific features.
 *
 * Single Responsibility: Text positioning and character layout calculations only.
 * Integrates seamlessly with existing radial transform system.
 *
 * @version 1.0.0
 * @requires RadialTransformService
 */

import { RadialTransformService } from './RadialTransformService';
import { RadialConfig, RadialPosition } from './types';
import {
  RadialTextConfig,
  RadialTextCharacter,
  RadialTextFlow,
  RadialTextValidation,
  RadialTextMetrics,
} from '../../types/radial-text-types';

/**
 * Text measurement result for calculating optimal sizing
 */
interface TextMeasurement {
  /** Total text width in pixels */
  totalWidth: number;
  /** Character width in pixels */
  characterWidth: number;
  /** Text height in pixels */
  height: number;
  /** Number of characters that fit in available space */
  fittingCharacters: number;
}

/**
 * Character layout calculation result
 */
interface CharacterLayout {
  /** Array of positioned characters */
  characters: RadialTextCharacter[];
  /** Total arc length used */
  usedArcLength: number;
  /** Whether text was truncated */
  wasTruncated: boolean;
  /** Performance metrics */
  metrics: RadialTextMetrics;
}

/**
 * RadialTextService - Core text positioning and layout calculations
 *
 * Responsibilities:
 * - Text-to-character breakdown
 * - Character positioning along radial paths
 * - Text flow mode implementations
 * - Auto-sizing calculations
 * - Text truncation handling
 */
export class RadialTextService {
  /**
   * Calculate complete text layout for radial positioning
   *
   * @param config - Radial text configuration
   * @returns Complete character layout with positioning data
   */
  static calculateTextLayout(config: RadialTextConfig): CharacterLayout {
    console.log(
      'Initial config in calculateTextLayout:',
      JSON.stringify(config, null, 2)
    );
    const startTime = performance.now();

    try {
      // Validate configuration
      const validation = this.validateConfig(config);
      if (!validation.isValid) {
        throw new Error(
          `Invalid radial text config: ${validation.errors.join(', ')}`
        );
      }

      // Break text into individual characters
      const characters = this.breakTextIntoCharacters(config.text);

      // Handle empty text
      if (characters.length === 0) {
        return this.createEmptyLayout(startTime);
      }

      // Measure text dimensions for auto-sizing
      const measurement = this.measureText(config);

      // Apply auto-sizing if enabled
      const finalConfig = this.applyAutoSizing(config, measurement);

      // Calculate character positions
      const positionedCharacters = this.calculateCharacterPositions(
        characters,
        finalConfig,
        measurement
      );

      // Apply text flow transformations
      const transformedCharacters = this.applyTextFlow(
        positionedCharacters,
        finalConfig
      );

      // Handle text truncation if needed
      const finalCharacters = this.applyTruncation(
        transformedCharacters,
        finalConfig,
        measurement
      );

      const endTime = performance.now();
      const layoutTime = endTime - startTime;

      return {
        characters: finalCharacters,
        usedArcLength: this.calculateUsedArcLength(
          finalCharacters,
          finalConfig
        ),
        wasTruncated: finalCharacters.length < characters.length,
        metrics: this.generateMetrics(finalCharacters, layoutTime),
      };
    } catch (error) {
      console.error('RadialTextService: Layout calculation failed:', error);
      return this.createEmptyLayout(startTime);
    }
  }

  /**
   * Break text string into individual characters with metadata
   * Handles special characters, whitespace, and Unicode properly
   */
  private static breakTextIntoCharacters(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Use Array.from to handle Unicode surrogate pairs correctly
    return Array.from(text);
  }

  /**
   * Measure text dimensions using canvas measurement
   * Provides accurate font metrics for layout calculations
   */
  private static measureText(config: RadialTextConfig): TextMeasurement {
    // Create temporary canvas for text measurement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      // Fallback measurements if canvas not available
      return {
        totalWidth: config.text.length * (config.fontSize || 16) * 0.6,
        characterWidth: (config.fontSize || 16) * 0.6,
        height: config.fontSize || 16,
        fittingCharacters: config.text.length,
      };
    }

    // Set font properties for accurate measurement
    ctx.font = `${config.fontWeight || 'normal'} ${config.fontSize || 16}px ${config.fontFamily || 'inherit'}`;

    // Measure total text width
    const metrics = ctx.measureText(config.text);
    const totalWidth = metrics.width;

    // Estimate character width (average)
    const characterWidth =
      totalWidth / config.text.length || (config.fontSize || 16) * 0.6;

    // Calculate text height (font size + any additional spacing)
    const height = config.fontSize || 16;

    // Calculate available arc length for fitting
    const radialConfig: RadialConfig = {
      centerX: config.centerX,
      centerY: config.centerY,
      innerRadius: config.innerRadius,
      startAngle: config.startAngle,
      endAngle: config.endAngle,
      ...(config.arcMode !== undefined && { arcMode: config.arcMode }),
      ...(config.direction !== undefined && { direction: config.direction }),
    };

    const totalCharacters = this.breakTextIntoCharacters(config.text).length;
    const availableArcLength = this.calculateAvailableArcLength(
      radialConfig,
      totalCharacters
    );
    const spacingPerCharacter = (config.letterSpacing || 0) + characterWidth;
    const fittingCharacters = Math.floor(
      availableArcLength / spacingPerCharacter
    );

    return {
      totalWidth,
      characterWidth,
      height,
      fittingCharacters: Math.min(fittingCharacters, totalCharacters),
    };
  }

  /**
   * Apply auto-sizing to configuration if enabled
   * Calculates optimal font size based on available space
   */
  private static applyAutoSizing(
    config: RadialTextConfig,
    _measurement: TextMeasurement
  ): RadialTextConfig {
    if (!config.autoSize) {
      return config;
    }

    const characters = this.breakTextIntoCharacters(config.text);
    const radialConfig: RadialConfig = {
      centerX: config.centerX,
      centerY: config.centerY,
      innerRadius: config.innerRadius,
      startAngle: config.startAngle,
      endAngle: config.endAngle,
      ...(config.arcMode !== undefined && { arcMode: config.arcMode }),
      ...(config.direction !== undefined && { direction: config.direction }),
    };

    const availableArcLength = this.calculateAvailableArcLength(
      radialConfig,
      characters.length
    );
    const desiredSpacing = availableArcLength / characters.length;
    const optimalFontSize = Math.floor(desiredSpacing * 0.8); // Leave some spacing

    const minFontSize = 8;
    const maxFontSize = config.fontSize ? config.fontSize * 1.5 : 24;
    const finalFontSize = Math.max(
      minFontSize,
      Math.min(optimalFontSize, maxFontSize)
    );

    return {
      ...config,
      fontSize: finalFontSize,
    };
  }

  /**
   * Calculate radial positions for all characters
   * Uses existing RadialTransformService for accurate positioning
   */
  private static calculateCharacterPositions(
    characters: string[],
    config: RadialTextConfig,
    _measurement: TextMeasurement
  ): RadialTextCharacter[] {
    const orientationMode = this.mapTextFlowToOrientation(config.textFlow);
    const radialConfig: RadialConfig = {
      centerX: config.centerX,
      centerY: config.centerY,
      innerRadius: config.innerRadius,
      startAngle: config.startAngle,
      endAngle: config.endAngle,
      ...(config.arcMode !== undefined && { arcMode: config.arcMode }),
      ...(config.direction !== undefined && { direction: config.direction }),
      ...(orientationMode !== undefined && { orientationMode }),
    };

    // Calculate positions using existing RadialTransformService
    const positions = RadialTransformService.batchTransform(
      { length: characters.length },
      radialConfig
    );

    // Convert to RadialTextCharacter objects
    return characters.map((char, index) => {
      const position = positions[index];
      if (!position) {
        return {
          char,
          index,
          position: {
            x: 0,
            y: 0,
            angle: 0,
            angleDegrees: 0,
            radius: 0,
            midAngle: 0,
            midAngleDegrees: 0,
            stepAngleRadians: 0,
            stepAngleDegrees: 0,
            segmentArcLength: 0,
            segmentChordLength: 0,
            normal: { x: 0, y: 0 },
            tangent: { x: 0, y: 0 },
            midNormal: { x: 0, y: 0 },
            midTangent: { x: 0, y: 0 },
            orientationDegrees: 0,
          } as RadialPosition,
          transform: '',
          scale: 1.0,
          rotation: 0,
          opacity: 1.0,
          visible: true,
        };
      }

      return {
        char,
        index,
        position,
        transform: this.generateCharacterTransform(position, config),
        scale: 1.0,
        rotation: position.angle,
        opacity: 1.0,
        visible: true,
      };
    });
  }

  /**
   * Apply text flow transformations to positioned characters
   * Implements different text flow modes: follow-arc, maintain-upright, radial-out
   */
  private static applyTextFlow(
    characters: RadialTextCharacter[],
    config: RadialTextConfig
  ): RadialTextCharacter[] {
    const textFlow = config.textFlow || 'follow-arc';

    return characters.map(character => {
      let rotation = character.rotation;
      let transform = character.transform;

      switch (textFlow) {
        case 'follow-arc':
          // Characters follow the arc direction (default behavior)
          // Already handled by RadialTransformService
          break;

        case 'maintain-upright':
          // Keep characters upright (readable)
          rotation = 0;
          transform = this.generateUprightTransform(character.position);
          break;

        case 'radial-out':
          // Characters point outward from center
          rotation = character.position.angle + Math.PI / 2;
          transform = this.generateRadialOutTransform(
            character.position,
            rotation
          );
          break;
      }

      return {
        ...character,
        rotation,
        transform,
      };
    });
  }

  /**
   * Apply text truncation based on available space and configuration
   * Handles ellipsis, wrapping, and no truncation modes
   */
  private static applyTruncation(
    characters: RadialTextCharacter[],
    config: RadialTextConfig,
    measurement: TextMeasurement
  ): RadialTextCharacter[] {
    const truncationMode = config.textTruncation || 'ellipsis';
    const maxFitting = measurement.fittingCharacters;

    if (characters.length <= maxFitting || truncationMode === 'none') {
      return characters;
    }

    switch (truncationMode) {
      case 'ellipsis':
        // Truncate and add ellipsis
        const truncated = characters.slice(0, Math.max(0, maxFitting - 1));
        if (maxFitting > 0 && truncated.length > 0) {
          // Replace last character with ellipsis
          const lastChar = truncated[truncated.length - 1]!;
          truncated[truncated.length - 1] = {
            ...lastChar,
            char: '…',
          };
        }
        return truncated;

      case 'wrap':
        // For radial text, wrapping would require multiple radial layers
        // For now, we'll truncate at the fitting point
        console.warn(
          'RadialTextService: Wrap mode not yet implemented, falling back to truncation'
        );
        return characters.slice(0, maxFitting);

      default:
        return characters;
    }
  }

  /**
   * Generate CSS transform string for character positioning
   */
  private static generateCharacterTransform(
    position: RadialPosition,
    _config: RadialTextConfig
  ): string {
    const { x, y } = position;
    const rotation = position.orientationDegrees;

    return `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
  }

  /**
   * Generate transform for upright text (maintain-upright mode)
   */
  private static generateUprightTransform(position: RadialPosition): string {
    const { x, y } = position;
    return `translate(${x}px, ${y}px)`;
  }

  /**
   * Generate transform for radial-out text mode
   */
  private static generateRadialOutTransform(
    position: RadialPosition,
    rotation: number
  ): string {
    const { x, y } = position;
    const rotationDegrees = (rotation * 180) / Math.PI;
    return `translate(${x}px, ${y}px) rotate(${rotationDegrees}deg)`;
  }

  /**
   * Map RadialTextFlow to RadialConfig orientationMode
   */
  private static mapTextFlowToOrientation(
    textFlow?: RadialTextFlow
  ): RadialConfig['orientationMode'] {
    switch (textFlow) {
      case 'follow-arc':
        return 'follow-tangent';
      case 'maintain-upright':
        return 'maintain';
      case 'radial-out':
        return 'follow-radius';
      default:
        return 'follow-tangent';
    }
  }

  /**
   * Calculate available arc length for text positioning
   */
  private static calculateAvailableArcLength(
    config: RadialConfig,
    _characterCount: number
  ): number {
    const radius = config.innerRadius;
    const startAngle = (config.startAngle * Math.PI) / 180;
    const endAngle = (config.endAngle * Math.PI) / 180;
    const angleSpan = Math.abs(endAngle - startAngle);

    return radius * angleSpan;
  }

  /**
   * Calculate total arc length used by positioned characters
   */
  private static calculateUsedArcLength(
    characters: RadialTextCharacter[],
    config: RadialTextConfig
  ): number {
    if (characters.length === 0) return 0;

    const radius = config.innerRadius;
    const firstChar = characters[0]!;
    const lastChar = characters[characters.length - 1]!;

    const angleSpan = Math.abs(
      lastChar.position.angle - firstChar.position.angle
    );
    return radius * angleSpan;
  }

  /**
   * Generate performance metrics for the layout calculation
   */
  private static generateMetrics(
    characters: RadialTextCharacter[],
    layoutTime: number
  ): RadialTextMetrics {
    const characterCount = characters.length;
    const estimatedMemory = characterCount * 1024; // Rough estimate

    return {
      characterCount,
      layoutTime,
      renderTime: 0, // Will be set by renderer
      frameTime: 0, // Will be set by animation system
      memoryUsage: estimatedMemory,
      performanceOk: layoutTime < 16.67 && characterCount < 200, // 60fps target, reasonable character limit
    };
  }

  /**
   * Create empty layout result for error cases
   */
  private static createEmptyLayout(startTime: number): CharacterLayout {
    return {
      characters: [],
      usedArcLength: 0,
      wasTruncated: false,
      metrics: {
        characterCount: 0,
        layoutTime: performance.now() - startTime,
        renderTime: 0,
        frameTime: 0,
        memoryUsage: 0,
        performanceOk: true,
      },
    };
  }

  /**
   * Validate radial text configuration
   * Ensures all required properties are present and valid
   */
  static validateConfig(config: RadialTextConfig): RadialTextValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required properties
    if (!config.text) {
      errors.push('Text content is required');
    }

    if (
      typeof config.centerX !== 'number' ||
      !Number.isFinite(config.centerX)
    ) {
      errors.push('centerX must be a finite number');
    }

    if (
      typeof config.centerY !== 'number' ||
      !Number.isFinite(config.centerY)
    ) {
      errors.push('centerY must be a finite number');
    }

    if (typeof config.innerRadius !== 'number' || config.innerRadius <= 0) {
      errors.push('innerRadius must be a positive number');
    }

    if (
      typeof config.startAngle !== 'number' ||
      !Number.isFinite(config.startAngle)
    ) {
      errors.push('startAngle must be a finite number');
    }

    if (
      typeof config.endAngle !== 'number' ||
      !Number.isFinite(config.endAngle)
    ) {
      errors.push('endAngle must be a finite number');
    }

    // MANDATORY frost_glass theme validation
    if (
      !config.theme ||
      (config.theme !== 'frost_light' && config.theme !== 'frost_dark')
    ) {
      errors.push('theme must be "frost_light" or "frost_dark" (MANDATORY)');
    }

    // Optional property validation
    if (
      config.fontSize !== undefined &&
      (typeof config.fontSize !== 'number' || config.fontSize <= 0)
    ) {
      warnings.push('fontSize should be a positive number');
    }

    if (
      config.letterSpacing !== undefined &&
      typeof config.letterSpacing !== 'number'
    ) {
      warnings.push('letterSpacing should be a number');
    }

    // Logical validation
    if (config.startAngle === config.endAngle) {
      warnings.push(
        'startAngle and endAngle are equal - text may not be visible'
      );
    }

    if (config.text && config.text.length > 100) {
      warnings.push('Text is very long - consider performance implications');
    }

    const result: RadialTextValidation = {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
    if (warnings.length > 0) {
      result.suggestions = ['Check configuration warnings'];
    }
    return result;
  }

  /**
   * Create a preset configuration for common use cases
   */
  static createPreset(
    presetName: 'hal-classic' | 'status-ring' | 'message-arc' | 'full-circle',
    centerX: number,
    centerY: number,
    radius: number = 120,
    theme: 'frost_light' | 'frost_dark' = 'frost_light'
  ): RadialTextConfig {
    const baseConfig = {
      theme, // MANDATORY frost_glass theme
      centerX,
      centerY,
      innerRadius: radius,
    };

    switch (presetName) {
      case 'hal-classic':
        return {
          ...baseConfig,
          text: 'HAL SYSTEM STATUS',
          startAngle: 0,
          endAngle: 360,
          fontSize: 16,
          textFlow: 'maintain-upright',
          autoSize: true,
        };

      case 'status-ring':
        return {
          ...baseConfig,
          text: 'SYSTEM ONLINE',
          startAngle: -45,
          endAngle: 45,
          fontSize: 14,
          textFlow: 'follow-arc',
          autoSize: true,
        };

      case 'message-arc':
        return {
          ...baseConfig,
          text: 'MESSAGE',
          startAngle: 180,
          endAngle: 360,
          fontSize: 18,
          textFlow: 'follow-arc',
          autoSize: false,
        };

      case 'full-circle':
        return {
          ...baseConfig,
          text: 'FULL CIRCLE TEXT DEMONSTRATION',
          startAngle: 0,
          endAngle: 360,
          fontSize: 12,
          textFlow: 'follow-arc',
          autoSize: true,
        };

      default:
        return {
          ...baseConfig,
          text: 'DEFAULT TEXT',
          startAngle: 0,
          endAngle: 180,
          fontSize: 16,
          textFlow: 'follow-arc',
          autoSize: true,
        };
    }
  }

  /**
   * Update existing character layout with new configuration
   * Optimized for real-time configuration changes
   */
  static updateLayout(
    existingCharacters: RadialTextCharacter[],
    newConfig: RadialTextConfig
  ): CharacterLayout {
    // If text content changed, recalculate completely
    const existingText = existingCharacters.map(c => c.char).join('');
    if (existingText !== newConfig.text) {
      return this.calculateTextLayout(newConfig);
    }

    // Otherwise, update positions with new configuration
    const startTime = performance.now();

    try {
      const orientationMode = this.mapTextFlowToOrientation(newConfig.textFlow);
      const updatedCharacters = existingCharacters.map((character, index) => {
        const radialConfig: RadialConfig = {
          centerX: newConfig.centerX,
          centerY: newConfig.centerY,
          innerRadius: newConfig.innerRadius,
          startAngle: newConfig.startAngle,
          endAngle: newConfig.endAngle,
          ...(newConfig.arcMode !== undefined && {
            arcMode: newConfig.arcMode,
          }),
          ...(newConfig.direction !== undefined && {
            direction: newConfig.direction,
          }),
          ...(orientationMode !== undefined && { orientationMode }),
        };

        const newPosition = RadialTransformService.calculateRadialPosition(
          index,
          existingCharacters.length,
          radialConfig
        );

        return {
          ...character,
          position: newPosition,
          transform: this.generateCharacterTransform(newPosition, newConfig),
        };
      });

      const endTime = performance.now();
      const layoutTime = endTime - startTime;

      return {
        characters: updatedCharacters,
        usedArcLength: this.calculateUsedArcLength(
          updatedCharacters,
          newConfig
        ),
        wasTruncated: false,
        metrics: this.generateMetrics(updatedCharacters, layoutTime),
      };
    } catch (error) {
      console.error('RadialTextService: Layout update failed:', error);
      return this.createEmptyLayout(startTime);
    }
  }
}
