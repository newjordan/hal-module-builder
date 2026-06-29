/**
 * Equalizer Module - Complete integrated audio visualization system
 * Part of Epic E6 completion - Integrates all decomposed modules
 *
 * Architecture Overview:
 * - E6-1 Audio Processing: AudioAnalyzer, FrequencyProcessor
 * - E6-2 Visualization Types: Plugin architecture with factory system
 * - E6-3 Rendering Engine: Unified rendering with performance optimization
 */

// === E6-1 Audio Processing Modules ===
export { AudioAnalyzer } from './processors/AudioAnalyzer';
export type {
  AudioAnalyzerConfig,
  AudioInputConfig,
  FFTAnalysisResult,
} from './processors/AudioAnalyzer';

export { FrequencyProcessor } from './processors/FrequencyProcessor';
export type {
  FrequencyBandResult,
  FrequencyProcessorConfig,
  FrequencyRange,
} from './processors/FrequencyProcessor';

// === E6-2 Visualization Types & Plugin Architecture ===
export { VisualizationFactory } from './visualizations/VisualizationFactory';
export type {
  RegistrationInfo,
  VisualizationFactoryConfig,
  VisualizationType,
} from './visualizations/VisualizationFactory';

export { BarVisualization } from './visualizations/BarVisualization';
export { BaseVisualization } from './visualizations/BaseVisualization';
export { CircleVisualization } from './visualizations/CircleVisualization';
export { DotVisualization } from './visualizations/DotVisualization';
export { LineVisualization } from './visualizations/LineVisualization';

// === E6-3 Rendering Engine & Integration ===
export { VisualizationRenderer } from './renderers/VisualizationRenderer';
export type {
  OptimizedRenderContext,
  RenderPerformanceMetrics,
  VisualizationRenderConfig,
} from './renderers/VisualizationRenderer';

export { ScalingAlgorithms } from './algorithms/scalingAlgorithms';
export type {
  NormalizationConfig,
  ScalingConfig,
  ScalingResult,
} from './algorithms/scalingAlgorithms';

export { RenderUtils } from './utils/renderUtils';
export type {
  ColorStop,
  GradientConfig,
  RenderProfileResult,
  TransformMatrix,
} from './utils/renderUtils';

// === Orchestration System ===
export {
  initializeGlobalLibrary,
  VisualizationLibrary,
  visualizationLibrary,
} from './VisualizationLibrary';
export type {
  OrchestrationResult,
  VisualizationLibraryConfig,
} from './VisualizationLibrary';

// Import classes for function implementations
import type { VisualizationLibraryConfig } from './VisualizationLibrary';
import { VisualizationLibrary } from './VisualizationLibrary';
import { AudioAnalyzer } from './processors/AudioAnalyzer';
import { FrequencyProcessor } from './processors/FrequencyProcessor';
import { registerAllVisualizations } from './registerVisualizations';
import { VisualizationRenderer } from './renderers/VisualizationRenderer';
import { VisualizationFactory } from './visualizations/VisualizationFactory';

// === Core Interfaces (Backward Compatibility) ===
export type {
  IVisualization,
  LayoutHints,
  RenderContext,
  ValidationResult,
  VisualizationConfig,
  VisualizationMetadata,
} from './visualizations/IVisualization';

// Layout system
export { ILayout } from './layouts/ILayout';
export type {
  LayoutConfig,
  LayoutMetadata,
  Path,
  Position,
  Rectangle,
} from './layouts/ILayout';

// Endcap system
export { IEndcap } from './endcaps/IEndcap';
export type {
  EndcapConfig,
  EndcapMetadata,
  EndcapRenderContext,
} from './endcaps/IEndcap';

// === Legacy Support ===
export { AudioProcessor } from './AudioProcessor';
export type {
  AudioProcessorConfig,
  BeatInfo,
  FrequencyBand,
} from './AudioProcessor';

// Auto-register all visualizations
export { registerAllVisualizations } from './registerVisualizations';

/**
 * Initialize the complete integrated equalizer system
 * Creates all E6-1, E6-2, and E6-3 modules and wires them together
 */
export function initializeIntegratedEqualizer(
  canvas: HTMLCanvasElement,
  config: Partial<
    VisualizationLibraryConfig & { skipRegistration?: boolean }
  > = {}
): VisualizationLibrary {
  // Initialize E6-1 Audio Processing modules
  const audioAnalyzer = new AudioAnalyzer({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30,
  });

  const frequencyProcessor = new FrequencyProcessor({
    sampleRate: 44100,
    binCount: 1024,
  });

  // Initialize E6-3 Rendering Engine
  const renderer = new VisualizationRenderer(canvas, {
    enableWebGL: false,
    adaptiveQuality: true,
    maxFrameRate: 60,
    enableProfiling: false,
  });

  // Initialize E6-2 Plugin Architecture - Ensure proper registration
  if (!config.skipRegistration) {
    // Make sure visualizations are registered before library initialization
    registerAllVisualizations();
  }

  // Create integrated orchestration system
  // Note: VisualizationFactory is used as a static class, not an instance
  const library = VisualizationLibrary.initialize(
    audioAnalyzer,
    frequencyProcessor,
    renderer,
    VisualizationFactory as any, // Pass the class itself
    config
  );

  console.log('🚀 Integrated Equalizer System initialized with all E6 modules');
  console.log(
    '📊 Registered visualization types:',
    VisualizationFactory.getRegisteredTypes()
  );
  return library;
}

/**
 * Legacy initialization function for backward compatibility
 * Note: Visualizations are auto-registered on module load
 */
export function initializeEqualizer(): void {
  registerAllVisualizations();
  console.log('Legacy equalizer system initialized');
}

// Import VisualizationConfig for utility functions
import { VisualizationConfig } from './visualizations/IVisualization';

/**
 * Utility functions
 */
export const EqualizerUtils = {
  /**
   * Create default equalizer configuration
   */
  createDefaultConfig(): VisualizationConfig {
    return {
      barCount: 48,
      barWidth: 2,
      barSpacing: 1,
      maxHeight: 40,
      responseSpeed: 0.8,
      colorMode: 'gradient',
      primaryColor: '#dc2626',
      secondaryColor: '#7f1d1d',
      // legacy glowIntensity removed (appearance.outerGlow is the single source of truth)
      pulseMode: 'none',
      symmetry: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      innerRadius: 140,
      startAngle: 0,
      endAngle: 360,
      arcMode: true,
      radialOrientation: 'follow-radius',
      showRadialPath: false,
      debugMarkers: [
        { id: 'marker-1', shape: 'circle', position: 0, color: '#ffffff' },
        { id: 'marker-2', shape: 'square', position: 0.33, color: '#00ffff' },
        { id: 'marker-3', shape: 'triangle', position: 0.66, color: '#ff00ff' },
      ],
      invertDirection: false,
      invert: false,
      // Ensure bar visualization renders in radial layout by default
      layout: 'radial',
      style: 'line',
    };
  },

  /**
   * Normalize a partial configuration into the canonical visualization config shape
   */
  normalizeConfig(
    settings: Partial<VisualizationConfig> | null | undefined
  ): VisualizationConfig {
    const normalized: any = { ...this.createDefaultConfig() };

    if (!settings || typeof settings !== 'object') {
      return normalized;
    }

    const directKeys: Array<
      | keyof VisualizationConfig
      | 'layout'
      | 'style'
      | 'barAlignment'
      | 'cornerRadius'
      | 'lineThickness'
      | 'invert'
      | 'invertDirection'
    > = [
      'barCount',
      'barWidth',
      'barSpacing',
      'maxHeight',
      'responseSpeed',
      'colorMode',
      'primaryColor',
      'secondaryColor',
      'customGradient',
      'radialGradientSettings',
      // legacy glow removed from normalized keys
      // 'glowIntensity',
      // 'glowColor',
      'pulseMode',
      'symmetry',
      'rotation',
      'scale',
      'offsetX',
      'offsetY',
      'innerRadius',
      'startAngle',
      'endAngle',
      'arcMode',
      'radialOrientation',
      'showRadialPath',
      'debugMarkers',
      'layout',
      'style',
      'barAlignment',
      'cornerRadius',
      'lineThickness',
      'invert',
      'invertDirection',
    ];

    for (const key of directKeys) {
      const value = (settings as any)[key];
      if (value !== undefined) {
        normalized[key] = value;
      }
    }

    if ((settings as any).barHeight !== undefined) {
      // Treat barHeight as the authoritative alias for maxHeight
      normalized.maxHeight = (settings as any).barHeight;
    }

    if (
      (settings as any).barRotation !== undefined &&
      (settings as any).rotation === undefined
    ) {
      normalized.rotation = (settings as any).barRotation;
    }

    if (
      (settings as any).lineWidth !== undefined &&
      (settings as any).lineThickness === undefined
    ) {
      normalized.lineThickness = (settings as any).lineWidth;
    }

    // Prefer explicit 'invert' from UI; fall back to 'invertDirection' for legacy/state sync safety
    const invertCandidate =
      typeof (settings as any).invert === 'boolean'
        ? Boolean((settings as any).invert)
        : typeof (settings as any).invertDirection === 'boolean'
          ? (settings as any).invertDirection
          : undefined;

    if (typeof invertCandidate === 'boolean') {
      normalized.invert = invertCandidate;
      normalized.invertDirection = invertCandidate;
    }

    if (
      (settings as any).scale === undefined &&
      normalized.scale === undefined
    ) {
      normalized.scale = 1;
    }

    return normalized as VisualizationConfig;
  },

  /**
   * Map legacy barStyle values to the new visualization type identifiers
   */
  getVisualizationTypeFromBarStyle(
    barStyle: string | null | undefined
  ): string {
    const normalized = String(barStyle || '').toLowerCase();
    switch (normalized) {
      case 'line':
        return 'line';
      case 'dot':
        return 'dot';
      case 'triangle':
        return 'triangle';
      case 'diamond':
        return 'diamond';
      case 'hexagon':
        return 'hexagon';
      case 'circle':
        return 'circle';
      case 'bar':
        return 'bar';
      case 'block':
        return 'block';
      default:
        return 'block';
    }
  },
};
