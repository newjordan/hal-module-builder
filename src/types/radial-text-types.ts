/**
 * HAL Radial Text System - Type Definitions
 * ========================================
 *
 * Complete type definitions for the radial text visualization system.
 * All UI-related interfaces MANDATORY include frost_glass.css theme support.
 *
 * @version 1.0.0
 * @requires frost_glass.css
 */

import { RadialConfig, RadialPosition } from '../services/radial/types';
import { Layer } from './layer-types';

/**
 * Mandatory frost_glass.css theme type
 * STRICT REQUIREMENT: All UI components must use this theme system
 */
export type FrostTheme = 'frost_light' | 'frost_dark';

/**
 * Text flow modes for radial text positioning
 */
export type RadialTextFlow = 'follow-arc' | 'maintain-upright' | 'radial-out';

/**
 * Text truncation behavior when text exceeds available space
 */
export type TextTruncationMode = 'ellipsis' | 'wrap' | 'none';

/**
 * Text animation types for radial text sequences
 */
export type RadialTextAnimationType =
  | 'typewriter'
  | 'spiral-in'
  | 'fade-sequential'
  | 'wave'
  | 'none';

/**
 * Audio response mapping modes for reactive text
 */
export type AudioResponseMapping = 'color' | 'size' | 'position' | 'rotation';

/**
 * Gradient direction options for text effects
 */
export type TextGradientDirection = 'radial' | 'linear' | 'follow-text';

/**
 * Text shadow configuration for enhanced visual effects
 */
export interface TextShadowConfig {
  /** Shadow offset X in pixels */
  offsetX: number;
  /** Shadow offset Y in pixels */
  offsetY: number;
  /** Shadow blur radius in pixels */
  blur: number;
  /** Shadow color (CSS color string) */
  color: string;
}

/**
 * Core configuration for radial text positioning and typography
 * Extends existing RadialConfig with text-specific properties
 *
 * @example
 * ```tsx
 * const config: RadialTextConfig = {
 *   theme: 'frost_dark', // MANDATORY
 *   text: 'HAL SYSTEM STATUS',
 *   centerX: 200,
 *   centerY: 200,
 *   innerRadius: 120,
 *   startAngle: 0,
 *   endAngle: 360,
 *   fontSize: 16,
 *   textFlow: 'follow-arc'
 * };
 * ```
 */
export interface RadialTextConfig extends RadialConfig {
  // === MANDATORY FROST_GLASS CSS THEME ===
  /**
   * MANDATORY: frost_glass.css theme - REQUIRED for all UI components
   * @required
   */
  theme: FrostTheme;

  // === TEXT CONTENT ===
  /** The text content to render radially */
  text: string;

  // === TYPOGRAPHY ===
  /** Font size in pixels (default: 16) */
  fontSize?: number;
  /** Font family (default: system font) */
  fontFamily?: string;
  /** Font weight (default: 'normal') */
  fontWeight?: 'normal' | 'bold' | 'lighter' | number;
  /** Letter spacing in pixels (default: 0) */
  letterSpacing?: number;
  /** Word spacing in pixels (default: 0) */
  wordSpacing?: number;
  /** Text alignment within each character position */
  textAlign?: 'start' | 'center' | 'end';

  // === RADIAL BEHAVIOR ===
  /** How text should flow along the radial path */
  textFlow?: RadialTextFlow;
  /** Auto-calculate font size based on available space */
  autoSize?: boolean;
  /** Maximum width for text before truncation/wrapping */
  maxTextWidth?: number;
  /** Text truncation behavior when exceeding space */
  textTruncation?: TextTruncationMode;
}

/**
 * Visual effects configuration for radial text
 * Integrates with existing effect system while maintaining frost_glass.css compliance
 *
 * @example
 * ```tsx
 * const effects: RadialTextEffects = {
 *   theme: 'frost_light', // MANDATORY
 *   colorMode: 'gradient',
 *   primaryColor: '#3b82f6',
 *   glowIntensity: 1.2,
 *   strokeWidth: 2
 * };
 * ```
 */
export interface RadialTextEffects {
  // === MANDATORY FROST_GLASS CSS THEME ===
  /**
   * MANDATORY: frost_glass.css theme - REQUIRED for all UI components
   * @required
   */
  theme: FrostTheme;

  // === EXISTING EFFECT INTEGRATION ===
  /** Color mode from existing ColorSettings */
  colorMode:
    | 'solid'
    | 'gradient'
    | 'rainbow'
    | 'reactive'
    | 'custom-gradient'
    | 'radial-gradient';
  /** Primary text color */
  primaryColor: string;
  /** Secondary color for gradients (optional) */
  secondaryColor?: string;
  /** Glow color (defaults to primaryColor) */
  glowColor?: string;
  /** Glow intensity (0-2, default: 0) */
  glowIntensity: number;
  /** Blur amount in pixels (optional) */
  blur?: number;

  // === TEXT-SPECIFIC EFFECTS ===
  /** Text stroke/outline color */
  strokeColor?: string;
  /** Text stroke width in pixels */
  strokeWidth?: number;
  /** Text shadow configuration */
  textShadow?: TextShadowConfig;
  /** Gradient direction for text gradients */
  gradientDirection?: TextGradientDirection;
}

/**
 * Appearance overrides derived from the standard layer appearance controls
 */
export type RadialTextAppearance = Pick<
  Layer,
  | 'fillType'
  | 'fillColor'
  | 'fillGradient'
  | 'strokeType'
  | 'strokeColor'
  | 'strokeWidth'
  | 'strokeGradient'
  | 'color'
  | 'outerGlow'
  | 'innerGlow'
  | 'gradientOverlay'
>;

/**
 * Animation configuration for radial text sequences
 * Extends existing animation system with text-specific behaviors
 *
 * @example
 * ```tsx
 * const animation: RadialTextAnimation = {
 *   theme: 'frost_dark', // MANDATORY
 *   textAnimationType: 'spiral-in',
 *   responseSpeed: 1.2,
 *   audioReactive: true,
 *   audioResponseMapping: 'color'
 * };
 * ```
 */
export interface RadialTextAnimation {
  // === MANDATORY FROST_GLASS CSS THEME ===
  /**
   * MANDATORY: frost_glass.css theme - REQUIRED for all UI components
   * @required
   */
  theme: FrostTheme;

  // === EXISTING ANIMATION INTEGRATION ===
  /** Animation response speed (0.1-3) */
  responseSpeed: number;
  /** Smoothing factor for animations (0-1, optional) */
  smoothing?: number;
  /** Pulse mode from existing AnimationSettings */
  pulseMode: 'none' | 'subtle' | 'strong';

  // === TEXT-SPECIFIC ANIMATIONS ===
  /** Type of text animation to perform */
  textAnimationType: RadialTextAnimationType;
  /** Animation duration in milliseconds (optional) */
  animationDuration?: number;
  /** Delay between character animations in milliseconds */
  staggerDelay?: number;

  // === AUDIO REACTIVITY ===
  /** Enable audio-reactive text behavior */
  audioReactive?: boolean;
  /** How audio data should affect text properties */
  audioResponseMapping?: AudioResponseMapping;
}

/**
 * Individual character data for positioned radial text
 * Contains all necessary information for rendering a single character
 */
export interface RadialTextCharacter {
  /** The character to render */
  char: string;
  /** Character index in the original text */
  index: number;
  /** Radial position data from RadialTransformService */
  position: RadialPosition;
  /** CSS transform string for positioning */
  transform: string;
  /** Character scale factor */
  scale: number;
  /** Character rotation in radians */
  rotation: number;
  /** Character opacity (0-1) */
  opacity: number;
  /** Whether this character is currently visible */
  visible: boolean;
}

/**
 * Complete radial text layer configuration
 * Extends existing Layer interface with radial text capabilities
 *
 * @example
 * ```tsx
 * const textLayer: RadialTextLayer = {
 *   id: 'text-layer-1',
 *   type: 'radialText',
 *   name: 'System Status Text',
 *   visible: true,
 *   opacity: 1.0,
 *   offsetX: 0,
 *   offsetY: 0,
 *   scale: 1.0,
 *   rotation: 0,
 *   blendMode: 'normal',
 *   theme: 'frost_light', // MANDATORY
 *   radialTextConfig: {
 *     theme: 'frost_light', // MANDATORY
 *     text: 'SYSTEM STATUS',
 *     centerX: 200,
 *     centerY: 200,
 *     innerRadius: 140
 *   },
 *   radialTextEffects: {
 *     theme: 'frost_light', // MANDATORY
 *     colorMode: 'gradient',
 *     primaryColor: '#3b82f6',
 *     glowIntensity: 1.0
 *   },
 *   radialTextAnimation: {
 *     theme: 'frost_light', // MANDATORY
 *     textAnimationType: 'typewriter',
 *     responseSpeed: 1.0,
 *     pulseMode: 'subtle'
 *   }
 * };
 * ```
 */
export interface RadialTextLayer extends Omit<Layer, 'type' | 'animation'> {
  // === MANDATORY FROST_GLASS CSS THEME ===
  /**
   * MANDATORY: frost_glass.css theme - REQUIRED for all UI components
   * @required
   */
  theme: FrostTheme;

  // === LAYER IDENTIFICATION ===
  /** Layer type identifier */
  type: 'radialText';

  // === RADIAL TEXT CONFIGURATION ===
  /** Core radial text configuration */
  radialTextConfig: RadialTextConfig;
  /** Visual effects configuration */
  radialTextEffects?: RadialTextEffects;
  /** Animation configuration */
  radialTextAnimation?: RadialTextAnimation;

  // === RUNTIME DATA ===
  /** Pre-calculated character data (computed at runtime) */
  characters?: RadialTextCharacter[];
  /** Whether text is currently animating */
  isAnimating?: boolean;
  /** Current animation progress (0-1) */
  animationProgress?: number;
}

/**
 * Props for RadialTextRenderer component
 * MANDATORY frost_glass.css theme compliance
 */
export interface RadialTextRendererProps {
  // === MANDATORY FROST_GLASS CSS THEME ===
  /**
   * MANDATORY: frost_glass.css theme - REQUIRED for all UI components
   * @required
   */
  theme: FrostTheme;

  // === CONFIGURATION ===
  /** Radial text configuration */
  config: RadialTextConfig;
  /** Visual effects (optional) */
  effects?: RadialTextEffects;
  /** Animation settings (optional) */
  animation?: RadialTextAnimation;

  // === RUNTIME DATA ===
  /** Audio data for reactivity (optional) */
  audioData?: Float32Array;
  /** Whether rendering is active */
  isActive?: boolean;
  /** Canvas size in pixels */
  size?: number;

  // === EVENT HANDLERS ===
  /** Click handler (optional) */
  onClick?: () => void;
  /** Animation complete callback (optional) */
  onAnimationComplete?: () => void;

  // === STYLING ===
  /** Additional CSS classes (must be frost_glass.css classes) */
  className?: string;
  /** Additional styles (discouraged - use frost_glass.css) */
  style?: React.CSSProperties;
  /** Appearance overrides from layer-level styling */
  appearance?: RadialTextAppearance;
}

/**
 * Props for RadialTextSettings component (Property Panel)
 * MANDATORY frost_glass.css theme compliance
 */
export interface RadialTextSettingsProps {
  // === MANDATORY FROST_GLASS CSS THEME ===
  /**
   * MANDATORY: frost_glass.css theme - REQUIRED for all UI components
   * @required
   */
  theme: FrostTheme;

  // === CONFIGURATION ===
  /** Current radial text configuration */
  config: RadialTextConfig;
  /** Current effects configuration */
  effects?: RadialTextEffects;
  /** Current animation configuration */
  animation?: RadialTextAnimation;

  // === EVENT HANDLERS ===
  /** Configuration change handler */
  onConfigChange: (config: RadialTextConfig) => void;
  /** Effects change handler */
  onEffectsChange?: (effects: RadialTextEffects) => void;
  /** Animation change handler */
  onAnimationChange?: (animation: RadialTextAnimation) => void;

  // === UI OPTIONS ===
  /** Show advanced settings */
  showAdvanced?: boolean;
  /** Show preset configurations */
  showPresets?: boolean;
  /** Enable real-time preview */
  enablePreview?: boolean;

  // === STYLING (FROST_GLASS CSS ONLY) ===
  /** Additional frost_glass.css classes */
  className?: string;
}

/**
 * Validation result for radial text configurations
 */
export interface RadialTextValidation {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Suggested fixes */
  suggestions?: string[];
}

/**
 * Performance metrics for radial text rendering
 */
export interface RadialTextMetrics {
  /** Number of characters rendered */
  characterCount: number;
  /** Text layout calculation time (ms) */
  layoutTime: number;
  /** Text rendering time (ms) */
  renderTime: number;
  /** Animation frame time (ms) */
  frameTime: number;
  /** Memory usage (bytes, approximate) */
  memoryUsage: number;
  /** Whether performance targets are met */
  performanceOk: boolean;
}

// === TYPE GUARDS ===

/**
 * Type guard to check if a layer is a RadialTextLayer
 */
export function isRadialTextLayer(layer: Layer): layer is RadialTextLayer {
  return layer.type === 'radialText';
}

/**
 * Type guard to check if theme is valid frost_glass theme
 */
export function isFrostTheme(theme: unknown): theme is FrostTheme {
  return theme === 'frost_light' || theme === 'frost_dark';
}

// === DEFAULT CONFIGURATIONS ===

/**
 * Default radial text configuration
 * MANDATORY frost_glass.css theme included
 */
export const DEFAULT_RADIAL_TEXT_CONFIG: RadialTextConfig = {
  // MANDATORY frost_glass theme
  theme: 'frost_light',

  // Text content
  text: 'HAL TEXT',

  // Radial positioning (from RadialConfig)
  centerX: 200,
  centerY: 200,
  innerRadius: 120,
  startAngle: 0,
  endAngle: 360,
  arcMode: false,
  direction: 'clockwise',

  // Typography
  fontSize: 16,
  fontFamily: 'inherit',
  fontWeight: 'normal',
  letterSpacing: 0,
  wordSpacing: 0,
  textAlign: 'center',

  // Radial behavior
  textFlow: 'follow-arc',
  autoSize: true,
  textTruncation: 'ellipsis',
};

/**
 * Default radial text effects configuration
 * MANDATORY frost_glass.css theme included
 */
export const DEFAULT_RADIAL_TEXT_EFFECTS: RadialTextEffects = {
  // MANDATORY frost_glass theme
  theme: 'frost_light',

  // Basic effects
  colorMode: 'solid',
  primaryColor: '#3b82f6',
  glowIntensity: 0,

  // Text-specific effects
  strokeWidth: 0,
  gradientDirection: 'linear',
};

/**
 * Default radial text animation configuration
 * MANDATORY frost_glass.css theme included
 */
export const DEFAULT_RADIAL_TEXT_ANIMATION: RadialTextAnimation = {
  // MANDATORY frost_glass theme
  theme: 'frost_light',

  // Animation settings
  responseSpeed: 1.0,
  smoothing: 0.2,
  pulseMode: 'none',

  // Text animation
  textAnimationType: 'none',
  staggerDelay: 50,

  // Audio reactivity
  audioReactive: false,
};
