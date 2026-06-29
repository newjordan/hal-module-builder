/**
 * RenderService - Canvas rendering operations for HAL Builder
 * Handles layer composition, gradient generation, and performance monitoring
 */
import { Layer } from '../types/layer-types';
import type { SymmetryMode } from '../config/equalizerSymmetry';
import {
  applySymmetryTransform,
  getCurrentSymmetryPlan,
} from '../utils/equalizerSymmetry';
import type { RadialSymmetryPlan } from '../utils/equalizerSymmetry';

export interface RenderMetrics {
  renderTime: number;
  layerCount: number;
  lastRender: number;
}

export interface GradientStop {
  color: string;
  position: number;
}

export class RenderService {
  // private metricsCallback?: (metrics: RenderMetrics) => void;
  private lastRenderTime = 0;
  private lastSymmetryPlan: RadialSymmetryPlan | null = null;

  constructor() {}

  /**
   * Set callback for render metrics
   */
  setMetricsCallback(_callback: (metrics: RenderMetrics) => void): void {
    // this.metricsCallback = callback;
  }

  /**
   * Get interpolated color between gradient stops
   * @param t - Position along gradient (0-1)
   * @param colors - Array of color strings
   * @param stops - Array of stop positions (0-1)
   * @returns RGB color string
   */
  getGradientColor(t: number, colors: string[], stops: number[]): string {
    if (stops.length === 0 || colors.length === 0) return '#000000';
    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];
    const firstColor = colors[0];
    const lastColor = colors[colors.length - 1];

    if (firstStop !== undefined && firstColor !== undefined && t <= firstStop)
      return firstColor;
    if (lastStop !== undefined && lastColor !== undefined && t >= lastStop)
      return lastColor;

    // Find the correct segment
    let colorIndex = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];
      if (
        currentStop !== undefined &&
        nextStop !== undefined &&
        t >= currentStop &&
        t <= nextStop
      ) {
        colorIndex = i;
        break;
      }
    }

    // Calculate local position within segment
    const currentStop = stops[colorIndex];
    const nextStop = stops[colorIndex + 1];
    const localT =
      currentStop !== undefined &&
      nextStop !== undefined &&
      nextStop - currentStop > 0
        ? (t - currentStop) / (nextStop - currentStop)
        : 0;

    const currentColor = colors[colorIndex];
    const nextColor = colors[colorIndex + 1];

    if (currentColor === undefined || nextColor === undefined) {
      return currentColor || nextColor || '#000000';
    }

    return this.interpolateColors(currentColor, nextColor, localT);
  }

  /**
   * Interpolate between two colors
   * @param color1 - Start color (hex string)
   * @param color2 - End color (hex string)
   * @param t - Interpolation factor (0-1)
   * @returns RGB color string
   */
  private interpolateColors(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    if (!c1 || !c2) {
      return color1; // Fallback to first color if parsing fails
    }

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Convert hex color to RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16),
        }
      : null;
  }

  /**
   * Generate CSS gradient string from layer gradient settings
   */
  generateGradientString(layer: Layer): string {
    if (!layer.gradient) return '';

    const { type, colors, stops, centerX, centerY, angle } = layer.gradient;

    const colorStops = colors
      .map(
        (color, i) => `${color} ${(stops[i] ?? i / (colors.length - 1)) * 100}%`
      )
      .join(', ');

    switch (type) {
      case 'radial':
        const cx = centerX || 50;
        const cy = centerY || 50;
        return `radial-gradient(circle at ${cx}% ${cy}%, ${colorStops})`;

      case 'linear':
        const gradientAngle = angle || 0;
        return `linear-gradient(${gradientAngle}deg, ${colorStops})`;

      case 'conic':
        const conicStops = colors
          .map(
            (color, i) =>
              `${color} ${(stops[i] ?? i / (colors.length - 1)) * 360}deg`
          )
          .join(', ');
        return `conic-gradient(from 0deg at 50% 50%, ${conicStops})`;

      default:
        return '';
    }
  }

  /**
   * Generate SVG gradient definitions for complex shapes
   */
  generateSVGGradient(
    id: string,
    colors: string[],
    stops: number[],
    type: 'linear' | 'radial' = 'linear',
    angle?: number
  ): string {
    const stopElements = colors
      .map(
        (color, i) =>
          `<stop offset="${(stops[i] ?? i / (colors.length - 1)) * 100}%" stop-color="${color}" />`
      )
      .join('');

    if (type === 'radial') {
      return `
        <radialGradient id="${id}">
          ${stopElements}
        </radialGradient>
      `;
    } else {
      const transform = angle
        ? `gradientTransform="rotate(${angle} 0.5 0.5)"`
        : '';
      return `
        <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%" ${transform}>
          ${stopElements}
        </linearGradient>
      `;
    }
  }

  /**
   * Calculate transform string for layer positioning
   */
  generateTransform(layer: Layer, additionalRotation: number = 0): string {
    const finalRotation = layer.rotation + additionalRotation;
    return `
      translate(-50%, -50%) 
      translate(${layer.offsetX}px, ${layer.offsetY}px)
      scale(${layer.scale}) 
      rotate(${finalRotation}deg)
    `.trim();
  }

  /**
   * Apply image filters based on layer settings
   */
  generateImageFilter(layer: Layer): string {
    const filters: string[] = [];

    if (layer.brightness !== undefined && layer.brightness !== 1) {
      filters.push(`brightness(${layer.brightness})`);
    }

    if (layer.contrast !== undefined && layer.contrast !== 1) {
      filters.push(`contrast(${layer.contrast})`);
    }

    return filters.length > 0 ? filters.join(' ') : '';
  }

  /**
   * Generate drop shadow filter for glow effects
   */
  generateGlowFilter(intensity: number, color: string): string {
    if (intensity <= 0) return '';
    return `drop-shadow(0 0 ${intensity * 20}px ${color})`;
  }

  /**
   * Calculate audio visualization data for different frequency ranges
   */
  processAudioData(
    audioData: number[],
    frequencyRange: 'bass' | 'mid' | 'treble' | 'full' = 'full'
  ): number[] {
    let filteredData = [...audioData];

    switch (frequencyRange) {
      case 'bass':
        filteredData = audioData.slice(0, Math.floor(audioData.length * 0.3));
        break;
      case 'mid':
        filteredData = audioData.slice(
          Math.floor(audioData.length * 0.3),
          Math.floor(audioData.length * 0.7)
        );
        break;
      case 'treble':
        filteredData = audioData.slice(Math.floor(audioData.length * 0.7));
        break;
      case 'full':
      default:
        // Use full range
        break;
    }

    return filteredData;
  }

  /**
   * Resample audio data to match desired bar count
   */
  resampleAudioData(audioData: number[], targetCount: number): number[] {
    const resampledData: number[] = [];

    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor((i / targetCount) * audioData.length);
      resampledData.push(audioData[index] || 0);
    }

    return resampledData;
  }

  /**
   * Apply symmetry to audio data for visual effects
   */
  applyAudioSymmetry(
    audioData: number[],
    symmetry: SymmetryMode | string,
    barCount: number,
    arcSettings?: { startAngle?: number; endAngle?: number; arcMode?: boolean }
  ): number[] {
    if (!Array.isArray(audioData) || audioData.length === 0) {
      this.lastSymmetryPlan = null;
      return [];
    }

    const effectiveLength = Math.max(
      1,
      Math.floor(barCount) || audioData.length
    );
    const trimmed =
      audioData.length === effectiveLength
        ? [...audioData]
        : audioData.slice(0, effectiveLength);

    let arcClampDegrees: number | undefined;
    if (arcSettings?.arcMode) {
      const startAngle = arcSettings.startAngle ?? 0;
      const endAngle = arcSettings.endAngle ?? 360;
      const arcSpan = Math.abs(endAngle - startAngle);
      if (symmetry === 'mirror') {
        arcClampDegrees = arcSpan / 2;
      } else {
        arcClampDegrees = arcSpan;
      }
    }

    const transformed = applySymmetryTransform(
      trimmed,
      symmetry as SymmetryMode,
      arcClampDegrees
    );
    this.lastSymmetryPlan = getCurrentSymmetryPlan();

    return transformed;
  }
  /**
   * Start render timing
   */
  // private startRenderTimer(): number {
  //   return performance.now();
  // }

  /**
   * End render timing and report metrics
   */
  // private endRenderTimer(startTime: number, layerCount: number): void {
  //   const endTime = performance.now();
  //   const renderTime = endTime - startTime;
  //   this.lastRenderTime = renderTime;
  //
  //   if (this.metricsCallback) {
  //     this.metricsCallback({
  //       renderTime,
  //       layerCount,
  //       lastRender: Date.now()
  //     });
  //   }
  // }

  /**
   * Get last render metrics
   */
  getLastRenderTime(): number {
    return this.lastRenderTime;
  }

  getLastSymmetryPlan(): RadialSymmetryPlan | null {
    if (!this.lastSymmetryPlan) {
      return null;
    }

    return {
      ...this.lastSymmetryPlan,
      segmentLengths: [...this.lastSymmetryPlan.segmentLengths],
    };
  }

  /**
   * Validate layer rendering capability
   */
  canRenderLayer(layer: Layer): { canRender: boolean; reason?: string } {
    if (!layer.visible) {
      return { canRender: false, reason: 'Layer is not visible' };
    }

    if (layer.opacity <= 0) {
      return { canRender: false, reason: 'Layer opacity is zero' };
    }

    if (layer.type === 'image' && !layer.src) {
      return { canRender: false, reason: 'Image layer missing source' };
    }

    if (
      layer.type === 'shape' &&
      layer.fillType === 'gradient' &&
      !layer.gradient
    ) {
      return {
        canRender: false,
        reason: 'Gradient layer missing gradient definition',
      };
    }

    if (layer.type === 'radialText' && !(layer as any).radialTextConfig) {
      return {
        canRender: false,
        reason: 'Radial text layer missing configuration',
      };
    }

    if (layer.type === 'radialText' && !(layer as any).radialTextConfig?.text) {
      return {
        canRender: false,
        reason: 'Radial text layer missing text content',
      };
    }

    return { canRender: true };
  }

  /**
   * Optimize layer order for better performance
   */
  optimizeLayerOrder(layers: Layer[]): Layer[] {
    // Sort layers for optimal rendering:
    // 1. Solid colors first (fastest)
    // 2. Images
    // 3. Gradients
    // 4. Effects last (most expensive)
    const typeOrder: Record<string, number> = {
      solid: 1,
      image: 2,
      gradient: 3,
      circle: 4,
      effect: 5,
      equalizer: 5,
    };

    return [...layers].sort((a, b) => {
      const aOrder = typeOrder[a.type] || 999;
      const bOrder = typeOrder[b.type] || 999;
      return aOrder - bOrder;
    });
  }
}

/**
 * Singleton render service instance
 */
let renderServiceInstance: RenderService | null = null;

export const getRenderService = (): RenderService => {
  if (!renderServiceInstance) {
    renderServiceInstance = new RenderService();
  }
  return renderServiceInstance;
};

export const disposeRenderService = (): void => {
  renderServiceInstance = null;
};
