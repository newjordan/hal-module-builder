/**
 * BaseVisualization - Abstract base class providing shared visualization logic and interface contracts
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 *
 * This class replaces the former IVisualization abstract class with enhanced functionality
 * and integrates with E6-1 audio processing modules for better modularity.
 */

import { AudioProcessor } from '../AudioProcessor';

export interface VisualizationMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
  tags?: string[];
}

export interface VisualizationConfig {
  // Common properties
  barCount: number;
  barWidth: number;
  barSpacing: number;
  maxHeight: number;
  responseSpeed: number;

  // Colors
  colorMode:
    | 'solid'
    | 'gradient'
    | 'rainbow'
    | 'reactive'
    | 'custom-gradient'
    | 'radial-gradient';
  primaryColor: string;
  secondaryColor?: string;
  customGradient?: {
    colors: string[];
    stops: number[];
  };
  radialGradientSettings?: {
    fromCenter: boolean;
    colors: string[];
    stops: number[];
  };

  // Effects
  /**
   * @deprecated Legacy glow is no longer used by visualizers. Use Appearance Panel outerGlow via EqualizerEngine.
   * This field is ignored at render time and kept optional for backward compatibility.
   */
  glowIntensity?: number;
  /**
   * @deprecated Legacy glow color is ignored by visualizers. Use Appearance Panel outerGlow.color.
   */
  glowColor?: string;
  pulseMode: 'none' | 'subtle' | 'strong';
  symmetry?:
    | 'none'
    | 'mirror'
    | 'rotate'
    | '4-fold'
    | '6-fold'
    | '8-fold'
    | '12-fold';

  // Transform
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;

  // Layout specific
  innerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  arcMode?: boolean;
  invert?: boolean;
  invertDirection?: boolean;
  radialOrientation?: 'follow-radius' | 'follow-tangent' | 'maintain';
  showRadialPath?: boolean;
  debugMarkers?: Array<{
    id?: string;
    shape?: 'circle' | 'square' | 'triangle';
    position?: number;
    color?: string;
    size?: number;
  }>;

  // Shape specific properties (extensible)
  [key: string]: any;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  time: number;
  theme: 'frost_light' | 'frost_dark';
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface FrequencyData {
  raw: Uint8Array;
  normalized: number[];
  bands: number[];
  peaks: Array<{ index: number; value: number }>;
}

/**
 * BaseVisualization - Abstract base class for all equalizer visualizations
 * Provides shared logic, utilities, and plugin interface contracts
 */
export abstract class BaseVisualization {
  abstract readonly type: string;
  abstract readonly metadata: VisualizationMetadata;

  protected audioProcessor: AudioProcessor;
  protected previousValues: number[] = [];
  protected peakValues: number[] = [];
  protected peakTimers: number[] = [];

  constructor(audioProcessor: AudioProcessor) {
    this.audioProcessor = audioProcessor;
  }

  /**
   * Main rendering method - to be implemented by concrete visualizations
   */
  abstract render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void;

  /**
   * Get default configuration for this visualization type
   */
  abstract getDefaultConfig(): VisualizationConfig;

  /**
   * Validate configuration object
   */
  abstract validateConfig(config: VisualizationConfig): ValidationResult;

  /**
   * Get list of animatable properties for this visualization
   */
  abstract getAnimatableProperties(): string[];

  /**
   * Shared utility: Process raw frequency data into normalized format
   */
  protected processFrequencyData(
    rawData: Uint8Array,
    config: VisualizationConfig
  ): FrequencyData {
    // Normalize to 0-1 range
    const normalized = Array.from(rawData).map(value => value / 255);

    // Map to requested band count
    const bands = this.mapToBands(normalized, config.barCount);

    // Detect peaks
    const peaks = this.detectPeaks(rawData, 100);

    return {
      raw: rawData,
      normalized,
      bands,
      peaks,
    };
  }

  /**
   * Shared utility: Map frequency data to specified number of bands
   */
  protected mapToBands(data: number[], bandCount: number): number[] {
    if (data.length <= bandCount) {
      return [...data, ...new Array(bandCount - data.length).fill(0)];
    }

    const bands = new Array(bandCount).fill(0);
    const bandsPerBin = data.length / bandCount;

    for (let i = 0; i < bandCount; i++) {
      const start = Math.floor(i * bandsPerBin);
      const end = Math.floor((i + 1) * bandsPerBin);

      let sum = 0;
      let count = 0;

      for (let j = start; j < end && j < data.length; j++) {
        sum += data[j] || 0;
        count++;
      }

      bands[i] = count > 0 ? sum / count : 0;
    }

    return bands;
  }

  /**
   * Shared utility: Apply smoothing with configurable response speed
   */
  protected applySmoothing(
    currentData: number[],
    config: VisualizationConfig
  ): number[] {
    if (this.previousValues.length !== currentData.length) {
      this.previousValues = new Array(currentData.length).fill(0);
    }

    const responseSpeed = config.responseSpeed || 0.8;
    const smoothing = 1 - responseSpeed;

    for (let i = 0; i < currentData.length; i++) {
      const current = currentData[i] || 0;
      const previous = this.previousValues[i] || 0;
      this.previousValues[i] = previous * smoothing + current * responseSpeed;
    }

    return [...this.previousValues];
  }

  /**
   * Shared utility: Detect peaks in frequency data
   */
  protected detectPeaks(
    data: Uint8Array,
    threshold: number = 100
  ): Array<{ index: number; value: number }> {
    const peaks: Array<{ index: number; value: number }> = [];

    for (let i = 1; i < data.length - 1; i++) {
      const current = data[i] || 0;
      const prev = data[i - 1] || 0;
      const next = data[i + 1] || 0;

      if (current > prev && current > next && current >= threshold) {
        peaks.push({ index: i, value: current });
      }
    }

    return peaks;
  }

  /**
   * Shared utility: Get color based on configuration
   */
  protected getColor(
    index: number,
    value: number,
    totalCount: number,
    config: VisualizationConfig
  ): string {
    const t = index / (totalCount - 1);
    let color = config.primaryColor;

    switch (config.colorMode) {
      case 'gradient':
        color = this.interpolateColor(
          config.primaryColor,
          config.secondaryColor || config.primaryColor,
          t
        );
        break;

      case 'custom-gradient':
        if (config.customGradient) {
          color = this.getGradientColor(
            t,
            config.customGradient.colors,
            config.customGradient.stops
          );
        }
        break;

      case 'radial-gradient':
        if (config.radialGradientSettings) {
          const gradientT = config.radialGradientSettings.fromCenter
            ? value
            : t;
          color = this.getGradientColor(
            gradientT,
            config.radialGradientSettings.colors,
            config.radialGradientSettings.stops
          );
        }
        break;

      case 'rainbow':
        const hue = t * 360;
        color = `hsl(${hue}, 70%, 50%)`;
        break;

      case 'reactive':
        const intensity = 0.3 + value * 0.7;
        const rgb = this.hexToRgb(config.primaryColor);
        if (rgb) {
          color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity})`;
        }
        break;
    }

    return color;
  }

  /**
   * Normalize frequency data to 0-1 range
   */
  protected normalizeFrequencyData(data: Uint8Array): number[] {
    return Array.from(data).map(v => v / 255);
  }

  /**
   * Measure performance of a rendering operation
   */
  protected measurePerformance<T>(fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    // Store performance metrics for debugging
    if (typeof window !== 'undefined' && (window as any).visualizationMetrics) {
      (window as any).visualizationMetrics.push({
        type: this.constructor.name,
        duration,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  /**
   * Get base default configuration (alias for getDefaultConfig for compatibility)
   */
  protected getBaseDefaultConfig(): VisualizationConfig {
    return this.getDefaultConfig();
  }

  /**
   * Shared utility: Get gradient color at specific position
   */
  protected getGradientColor(
    t: number,
    colors: string[],
    stops: number[]
  ): string {
    if (t <= (stops[0] ?? 0)) return colors[0] ?? '#ffffff';
    if (t >= (stops[stops.length - 1] ?? 1))
      return colors[colors.length - 1] ?? '#ffffff';

    let colorIndex = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= (stops[i] ?? 0) && t <= (stops[i + 1] ?? 1)) {
        colorIndex = i;
        break;
      }
    }

    const currentStop = stops[colorIndex] ?? 0;
    const nextStop = stops[colorIndex + 1] ?? 1;
    const localT =
      nextStop - currentStop > 0
        ? (t - currentStop) / (nextStop - currentStop)
        : 0;

    return this.interpolateColor(
      colors[colorIndex] ?? '#ffffff',
      colors[colorIndex + 1] ?? '#ffffff',
      localT
    );
  }

  /**
   * Shared utility: Interpolate between two colors
   */
  protected interpolateColor(
    color1: string,
    color2: string,
    t: number
  ): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Shared utility: Convert hex color to RGB
   */
  protected hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1] ?? '0', 16),
          g: parseInt(result[2] ?? '0', 16),
          b: parseInt(result[3] ?? '0', 16),
        }
      : null;
  }

  /**
   * Optional: Initialize visualization resources
   */
  initialize?(context: RenderContext): void;

  /**
   * Optional: Cleanup visualization resources
   */
  dispose?(): void;

  /**
   * Optional: Handle configuration changes
   */
  onConfigChange?(
    oldConfig: VisualizationConfig,
    newConfig: VisualizationConfig
  ): void;

  /**
   * Optional: Export internal state for hot-swapping
   */
  exportState?(): Record<string, any>;

  /**
   * Optional: Import internal state for hot-swapping
   */
  importState?(state: Record<string, any>): void;
}
