/**
 * HAL Builder Effects Asset System
 * Story 1.3d: Effects Asset System
 *
 * Main entry point for the effects library
 */

// Core interfaces and types
export * from './IEffect';
export * from './EffectLibrary';

// Core effect implementations
export * from './Gradient';
export * from './Noise';
export * from './Pattern';
export * from './Distortion';

// Compositing system
export * from './compositors/EffectChain';

// Effect library management
import { EffectLibrary } from './EffectLibrary';
import { createGradientEffect } from './Gradient';
import { createNoiseEffect } from './Noise';
import { Pattern } from './Pattern';
import { Distortion } from './Distortion';

// Track initialization to prevent duplicate registrations
let isEffectsLibraryInitialized = false;

/**
 * Initialize the effects library with core effects
 * This function should be called once during application startup
 */
export function initializeEffectsLibrary(): EffectLibrary {
  const library = EffectLibrary.getInstance();

  if (isEffectsLibraryInitialized) {
    console.log(
      'Effects library already initialized, returning existing instance'
    );
    return library;
  }

  // Register core effects
  library.registerEffect(createGradientEffect(), {
    enabled: true,
    registeredBy: 'core',
    description: 'Core gradient effect extracted from HalModuleBuilder',
    tags: ['core', 'color', 'gradient'],
  });

  library.registerEffect(createNoiseEffect(), {
    enabled: true,
    registeredBy: 'core',
    description:
      'Procedural noise generator with Perlin, Simplex, and random algorithms',
    tags: ['core', 'pattern', 'noise', 'procedural'],
  });

  // Register Pattern effect (Story 1.3d - AC 3.4)
  library.registerEffect(new Pattern(), {
    enabled: true,
    registeredBy: 'core',
    description:
      'Creates repeating visual patterns including dots, stripes, and grids',
    tags: ['core', 'pattern', 'visual', 'repeating'],
  });

  // Register Distortion effect (Story 1.3d - AC 3.5)
  library.registerEffect(new Distortion(), {
    enabled: true,
    registeredBy: 'core',
    description:
      'Creates visual distortions including wave, ripple, and twist effects',
    tags: ['core', 'distortion', 'animation', 'transform'],
  });

  isEffectsLibraryInitialized = true;
  console.log('Effects library initialized with core effects');
  console.log('Available effects:', library.getAvailableTypes());

  return library;
}

/**
 * Get the initialized effects library instance
 */
export function getEffectsLibrary(): EffectLibrary {
  return EffectLibrary.getInstance();
}

/**
 * Quick utility to create a gradient layer compatible with existing HalModuleBuilder layer format
 */
export function createGradientLayer(
  name: string,
  type: 'linear' | 'radial' | 'conic' = 'radial',
  colors: string[] = ['#ff0000', '#0000ff', 'transparent'],
  stops: number[] = [0, 0.5, 1]
) {
  return {
    id: `gradient_${Date.now()}`,
    name,
    type: 'gradient' as const,
    visible: true,
    opacity: 1,
    blendMode: 'screen',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    gradient: {
      type,
      colors,
      stops,
      centerX: 50,
      centerY: 50,
      angle: 0,
    },
  };
}

/**
 * Migrate existing layer configuration to effect parameters
 */
export function migrateLayerToEffectParams(layer: any): any {
  if (layer.type === 'gradient' && layer.gradient) {
    return {
      type: layer.gradient.type || 'radial',
      colors: layer.gradient.colors || ['#ff0000', '#0000ff', 'transparent'],
      stops: layer.gradient.stops || [0, 0.5, 1],
      angle: layer.gradient.angle || 0,
      centerX: layer.gradient.centerX || 50,
      centerY: layer.gradient.centerY || 50,
      opacity: layer.opacity || 1,
      intensity: 1,
      enabled: layer.visible !== false,
      blendMode: layer.blendMode || 'normal',
    };
  }

  return null;
}

/**
 * Export library statistics for debugging and monitoring
 */
export function getLibraryInfo() {
  const library = EffectLibrary.getInstance();
  return {
    version: library.getVersion(),
    stats: library.getStats(),
    availableEffects: library.getAvailableTypes(),
    state: library.exportState(),
  };
}
