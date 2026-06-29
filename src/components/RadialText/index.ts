/**
 * HAL Radial Text System - Public API
 * ===================================
 *
 * Exports all public components, hooks, and types for the radial text system.
 * MANDATORY: All components use frost_glass.css styling exclusively.
 *
 * @version 1.0.0
 * @requires frost_glass.css
 */

// === COMPONENTS ===
export { RadialTextRenderer } from './RadialTextRenderer';
export type { RadialTextRendererProps } from '../../types/radial-text-types';

// === HOOKS ===
export {
  useRadialText,
  useSimpleRadialText,
  useRadialTextPreset,
} from '../../hooks/useRadialText';
export type {
  UseRadialTextArgs,
  UseRadialTextResult,
} from '../../hooks/useRadialText';

// === SERVICES ===
export { RadialTextService } from '../../services/radial/RadialTextService';

// === TYPES ===
export type {
  RadialTextConfig,
  RadialTextEffects,
  RadialTextAnimation,
  RadialTextCharacter,
  RadialTextLayer,
  RadialTextSettingsProps,
  RadialTextValidation,
  RadialTextMetrics,
  FrostTheme,
  RadialTextFlow,
  TextTruncationMode,
  RadialTextAnimationType,
  AudioResponseMapping,
  TextGradientDirection,
  TextShadowConfig,
} from '../../types/radial-text-types';

// === CONSTANTS ===
export {
  DEFAULT_RADIAL_TEXT_CONFIG,
  DEFAULT_RADIAL_TEXT_EFFECTS,
  DEFAULT_RADIAL_TEXT_ANIMATION,
} from '../../types/radial-text-types';

// === TYPE GUARDS ===
export {
  isRadialTextLayer,
  isFrostTheme,
} from '../../types/radial-text-types';