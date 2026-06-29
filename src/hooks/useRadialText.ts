/**
 * useRadialText Hook
 * ==================
 *
 * React hook for radial text functionality following existing hook patterns.
 * Integrates with RadialTextService and provides optimized state management.
 *
 * Single Responsibility: Text hook logic and configuration management only.
 *
 * @version 1.0.0
 * @requires RadialTextService
 */

import { useCallback, useMemo, useRef } from 'react';
import { RadialTextService } from '../services/radial/RadialTextService';
import {
  RadialTextConfig,
  RadialTextCharacter,
  RadialTextValidation,
  RadialTextMetrics,
  FrostTheme,
} from '../types/radial-text-types';

/**
 * Hook configuration arguments
 */
export interface UseRadialTextArgs {
  /** Core radial text configuration */
  config: RadialTextConfig;
  /** Center point for positioning */
  center: { x: number; y: number };
  /** MANDATORY frost_glass.css theme */
  theme: FrostTheme;
  /** Enable performance optimizations */
  enableOptimizations?: boolean;
  /** Cache character layout between renders */
  enableCaching?: boolean;
}

/**
 * Hook return value with all radial text functionality
 */
export interface UseRadialTextResult {
  /** Calculated character layout */
  characters: RadialTextCharacter[];
  /** Configuration validation result */
  validation: RadialTextValidation;
  /** Performance metrics */
  metrics: RadialTextMetrics;
  /** Whether text was truncated */
  wasTruncated: boolean;
  /** Used arc length in pixels */
  usedArcLength: number;

  // === METHODS ===
  /** Recalculate layout with new configuration */
  updateLayout: (newConfig: Partial<RadialTextConfig>) => void;
  /** Update single character */
  updateCharacter: (
    index: number,
    updates: Partial<RadialTextCharacter>
  ) => void;
  /** Get character at specific index */
  getCharacter: (index: number) => RadialTextCharacter | null;
  /** Calculate optimal font size for current configuration */
  calculateOptimalSize: () => number;
  /** Validate current configuration */
  validateConfig: () => RadialTextValidation;

  // === UTILITIES ===
  /** Check if layout is ready for rendering */
  isReady: boolean;
  /** Check if configuration is valid */
  isValid: boolean;
  /** Configuration with center point applied */
  resolvedConfig: RadialTextConfig;
}

/**
 * Internal hook state for caching and optimization
 */
interface UseRadialTextState {
  /** Cached character layout */
  cachedLayout: {
    characters: RadialTextCharacter[];
    usedArcLength: number;
    wasTruncated: boolean;
    metrics: RadialTextMetrics;
  } | null;
  /** Configuration hash for cache invalidation */
  configHash: string;
  /** Last validation result */
  lastValidation: RadialTextValidation;
}

/**
 * Generate configuration hash for caching
 */
const generateConfigHash = (
  config: RadialTextConfig,
  center: { x: number; y: number }
): string => {
  return JSON.stringify({
    text: config.text,
    theme: config.theme,
    centerX: center.x,
    centerY: center.y,
    innerRadius: config.innerRadius,
    startAngle: config.startAngle,
    endAngle: config.endAngle,
    fontSize: config.fontSize,
    textFlow: config.textFlow,
    autoSize: config.autoSize,
    // Include other relevant config properties for cache validation
  });
};

/**
 * Create resolved configuration with center point applied
 */
const createResolvedConfig = (
  config: RadialTextConfig,
  center: { x: number; y: number },
  theme: FrostTheme
): RadialTextConfig => ({
  ...config,
  theme, // Ensure theme is always applied
  centerX: center.x,
  centerY: center.y,
});

/**
 * useRadialText Hook
 *
 * Provides complete radial text functionality following existing hook patterns.
 * Includes caching, validation, and performance optimizations.
 *
 * @example
 * ```tsx
 * const {
 *   characters,
 *   validation,
 *   isReady,
 *   updateLayout
 * } = useRadialText({
 *   config: textConfig,
 *   center: { x: 200, y: 200 },
 *   theme: 'frost_dark',
 *   enableCaching: true
 * });
 *
 * // Use in render
 * if (isReady && validation.isValid) {
 *   return <RadialTextRenderer characters={characters} />;
 * }
 * ```
 */
export const useRadialText = ({
  config,
  center,
  theme,
  enableOptimizations = true,
  enableCaching = true,
}: UseRadialTextArgs): UseRadialTextResult => {
  // enableOptimizations reserved for future use
  void enableOptimizations;
  // Internal state for caching and optimization
  const stateRef = useRef<UseRadialTextState>({
    cachedLayout: null,
    configHash: '',
    lastValidation: { isValid: false, errors: [], warnings: [] },
  });
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // Create resolved configuration with center point applied
  const resolvedConfig = useMemo(
    () => createResolvedConfig(config, center, theme),
    [config, center, theme]
  );

  // Generate configuration hash for cache validation
  const configHash = useMemo(
    () => generateConfigHash(config, center),
    [config, center]
  );

  // Validate configuration
  const validation = useMemo(() => {
    return RadialTextService.validateConfig(resolvedConfig);
  }, [resolvedConfig]);

  // Calculate character layout with caching
  const cacheBypassNonce = enableCaching ? 0 : renderCountRef.current;
  const layoutResult = useMemo(() => {
    const state = stateRef.current;

    // Return cached layout if configuration hasn't changed
    if (
      enableCaching &&
      state.cachedLayout &&
      state.configHash === configHash &&
      validation.isValid
    ) {
      return state.cachedLayout;
    }

    // Calculate new layout
    if (validation.isValid) {
      const layout = RadialTextService.calculateTextLayout(resolvedConfig);

      // Cache the result
      const cachedLayout = {
        characters: layout.characters,
        usedArcLength: layout.usedArcLength,
        wasTruncated: layout.wasTruncated,
        metrics: layout.metrics,
      };

      // Update cache state
      state.cachedLayout = cachedLayout;
      state.configHash = configHash;
      state.lastValidation = validation;

      return cachedLayout;
    }

    // Return empty layout for invalid configuration
    return {
      characters: [],
      usedArcLength: 0,
      wasTruncated: false,
      metrics: {
        characterCount: 0,
        layoutTime: 0,
        renderTime: 0,
        frameTime: 0,
        memoryUsage: 0,
        performanceOk: true,
      },
    };
  }, [resolvedConfig, configHash, validation.isValid, enableCaching, cacheBypassNonce]);

  // Update layout with new configuration
  const updateLayout = useCallback(
    (newConfig: Partial<RadialTextConfig>) => {
      const mergedConfig = { ...resolvedConfig, ...newConfig };
      const newLayout = RadialTextService.calculateTextLayout(mergedConfig);

      // Update cache
      if (enableCaching) {
        const state = stateRef.current;
        state.cachedLayout = {
          characters: newLayout.characters,
          usedArcLength: newLayout.usedArcLength,
          wasTruncated: newLayout.wasTruncated,
          metrics: newLayout.metrics,
        };
        state.configHash = generateConfigHash(mergedConfig, center);
      }
    },
    [resolvedConfig, center, enableCaching]
  );

  // Update single character
  const updateCharacter = useCallback(
    (index: number, updates: Partial<RadialTextCharacter>) => {
      const state = stateRef.current;
      if (
        !state.cachedLayout ||
        index < 0 ||
        index >= state.cachedLayout.characters.length
      ) {
        return;
      }

      // Update character in cached layout
      const updatedCharacters = [...state.cachedLayout.characters];
      updatedCharacters[index] = {
        ...updatedCharacters[index]!,
        ...updates,
      } as RadialTextCharacter;

      state.cachedLayout = {
        ...state.cachedLayout,
        characters: updatedCharacters,
      };
    },
    []
  );

  // Get character at specific index
  const getCharacter = useCallback(
    (index: number): RadialTextCharacter | null => {
      if (index < 0 || index >= layoutResult.characters.length) {
        return null;
      }
      return layoutResult.characters[index] ?? null;
    },
    [layoutResult.characters]
  );

  // Calculate optimal font size for current configuration
  const calculateOptimalSize = useCallback((): number => {
    if (!validation.isValid) return config.fontSize || 16;

    // Use RadialTextService's auto-sizing logic
    const autoSizeConfig = { ...resolvedConfig, autoSize: true };
    RadialTextService.calculateTextLayout(autoSizeConfig);

    // Extract calculated font size from the layout process
    // For now, we'll return a reasonable estimate based on available space
    const availableArcLength = Math.PI * 2 * resolvedConfig.innerRadius;
    const characterCount = config.text.length;
    const availableSpacePerChar = availableArcLength / characterCount;

    return Math.max(8, Math.min(24, availableSpacePerChar * 0.6));
  }, [validation.isValid, config.fontSize, config.text.length, resolvedConfig]);

  // Validate current configuration
  const validateConfig = useCallback((): RadialTextValidation => {
    return RadialTextService.validateConfig(resolvedConfig);
  }, [resolvedConfig]);

  // Utility properties
  const isReady = useMemo(() => {
    return validation.isValid && layoutResult.characters.length > 0;
  }, [validation.isValid, layoutResult.characters.length]);

  const isValid = validation.isValid;

  return {
    // === DATA ===
    characters: layoutResult.characters,
    validation,
    metrics: layoutResult.metrics,
    wasTruncated: layoutResult.wasTruncated,
    usedArcLength: layoutResult.usedArcLength,

    // === METHODS ===
    updateLayout,
    updateCharacter,
    getCharacter,
    calculateOptimalSize,
    validateConfig,

    // === UTILITIES ===
    isReady,
    isValid,
    resolvedConfig,
  };
};

/**
 * Simplified hook for basic radial text without advanced features
 * Follows the same patterns but with minimal configuration
 */
export const useSimpleRadialText = (
  text: string,
  center: { x: number; y: number },
  radius: number,
  theme: FrostTheme = 'frost_light'
): Pick<UseRadialTextResult, 'characters' | 'isReady' | 'validation'> => {
  const config: RadialTextConfig = {
    theme,
    text,
    centerX: center.x,
    centerY: center.y,
    innerRadius: radius,
    startAngle: 0,
    endAngle: 360,
    fontSize: 16,
    textFlow: 'follow-arc',
    autoSize: true,
  };

  const result = useRadialText({
    config,
    center,
    theme,
    enableCaching: false, // Simplified version doesn't need caching
  });

  return {
    characters: result.characters,
    isReady: result.isReady,
    validation: result.validation,
  };
};

/**
 * Hook for preset radial text configurations
 * Provides quick access to common text layouts
 */
export const useRadialTextPreset = (
  presetName: 'hal-classic' | 'status-ring' | 'message-arc' | 'full-circle',
  center: { x: number; y: number },
  theme: FrostTheme = 'frost_light',
  radius: number = 120,
  customText?: string
): UseRadialTextResult => {
  const config = useMemo(() => {
    const preset = RadialTextService.createPreset(
      presetName,
      center.x,
      center.y,
      radius,
      theme
    );

    // Override text if provided
    if (customText) {
      preset.text = customText;
    }

    return preset;
  }, [presetName, center.x, center.y, radius, theme, customText]);

  return useRadialText({
    config,
    center,
    theme,
    enableCaching: true,
    enableOptimizations: true,
  });
};

export default useRadialText;
