/**
 * HAL Text Effects - Public API
 * =============================
 *
 * Exports all text effects and processors for the radial text system.
 * Integrates with existing EffectLibrary while maintaining frost_glass.css compliance.
 *
 * @version 1.0.0
 * @requires EffectLibrary
 */

// === PROCESSORS ===
export {
  TextEffectProcessor,
  BaseTextEffect,
} from './TextEffectProcessor';

export type {
  TextEffectContext,
  TextEffectParameters,
  TextEffectResult,
} from './TextEffectProcessor';

// === EFFECTS ===
export { TextGlowEffect } from './TextGlowEffect';
export type { TextGlowParameters } from './TextGlowEffect';

export { TextGradientEffect } from './TextGradientEffect';
export type { TextGradientParameters, GradientDirection } from './TextGradientEffect';

export { TextStrokeEffect } from './TextStrokeEffect';
export type { TextStrokeParameters, StrokeStyle, StrokeJoin } from './TextStrokeEffect';

// === INITIALIZATION UTILITY ===
/**
 * Initialize all text effects with the TextEffectProcessor
 * Call this during application startup to register all effects
 *
 * @example
 * ```tsx
 * import { initializeTextEffects } from './assets/effects/text';
 *
 * // During app initialization
 * initializeTextEffects();
 * ```
 */
export function initializeTextEffects(): void {
  const processor = getTextEffectProcessor();

  // Import effect classes
  const { TextGlowEffect } = require('./TextGlowEffect');
  const { TextGradientEffect } = require('./TextGradientEffect');
  const { TextStrokeEffect } = require('./TextStrokeEffect');

  // Register all text effects
  const glowEffect = new TextGlowEffect();
  const gradientEffect = new TextGradientEffect();
  const strokeEffect = new TextStrokeEffect();

  processor.registerEffect(glowEffect);
  processor.registerEffect(gradientEffect);
  processor.registerEffect(strokeEffect);

  console.log('Text effects initialized successfully');
}

/**
 * Get text effect processor instance
 * Convenience method for accessing the processor
 */
export function getTextEffectProcessor() {
  const { TextEffectProcessor } = require('./TextEffectProcessor');
  return TextEffectProcessor.getInstance();
}