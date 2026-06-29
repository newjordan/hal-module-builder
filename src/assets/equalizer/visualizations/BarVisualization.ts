/**
 * BarVisualization - Specialized bar visualization optimized for vertical/horizontal bar rendering
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 * Updated for Story E6.1 - Audio Processing Extraction
 *
 * Refactored to extend BaseVisualization with bar-specific optimizations
 * Supports both radial and linear layouts with enhanced performance
 * Now uses extracted audio processing modules for better separation of concerns
 */

import {
  BaseVisualization,
  FrequencyData,
  RenderContext,
  ValidationResult,
  VisualizationConfig,
  VisualizationMetadata,
} from './BaseVisualization';

import { RadialTransformService } from '../../../services/radial/RadialTransformService';
import { RadialConfig } from '../../../services/radial/types';
import {
  applyExponentialSmoothing,
  updatePeakTracking,
  type PeakTrackingState,
  type SmoothingConfig,
} from '../algorithms/smoothingAlgorithms';

const DEG_TO_RAD = Math.PI / 180;

export interface BarVisualizationConfig extends VisualizationConfig {
  style: 'line' | 'block' | 'vertical';
  layout: 'radial' | 'linear';
  endcapType?: string;
  gradient?: boolean;
  borderWidth?: number;
  borderColor?: string;
  barAlignment?: 'bottom' | 'center' | 'top';
  minHeight?: number;
  cornerRadius?: number;
  radialOrientation?: 'follow-radius' | 'follow-tangent' | 'maintain';
  smoothing?: number;
  peakHold?: boolean;
  peakHoldTime?: number;
  peakDecay?: number;
}

export class BarVisualization extends BaseVisualization {
  readonly type = 'bar';
  readonly metadata: VisualizationMetadata = {
    name: 'Bar Equalizer',
    description:
      'Classic equalizer bars with radial and linear layouts - E6.1 Enhanced',
    author: 'HAL Builder',
    version: '2.1.0', // Updated for E6.1 audio processing extraction
    tags: ['classic', 'bars', 'standard', 'optimized'],
  };

  // E6.1 Audio Processing Modules
  private peakTrackingState: PeakTrackingState;


  constructor(audioProcessor: any) {
    // Keep existing signature for compatibility
    super(audioProcessor);

    this.peakTrackingState = {
      peakValues: [],
      peakTimers: [],
      lastUpdate: Date.now(),
    };
  }

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    if (!context?.ctx || !frequencyData?.bands) {
      return;
    }

    const barConfig = config as BarVisualizationConfig;

    // Initialize tracking arrays if needed
    if (this.previousValues.length !== config.barCount) {
      this.previousValues = new Array(config.barCount).fill(0);
      this.peakValues = new Array(config.barCount).fill(0);
      this.peakTimers = new Array(config.barCount).fill(0);
    }

    // Apply smoothing using E6.1 extracted algorithms
    const smoothedData = applyExponentialSmoothing(
      frequencyData.bands,
      this.previousValues,
      barConfig.responseSpeed || 0.8
    );

    // Update previous values for next frame
    this.previousValues = [...smoothedData];

    // Update peak tracking
    this.updatePeakTracking(smoothedData, barConfig, context);

    // Render using canvas context
    this.renderCanvas(context.ctx, smoothedData, barConfig, context);
  }

  private updatePeakTracking(
    data: number[],
    config: BarVisualizationConfig,
    context: RenderContext
  ): void {
    if (!config.peakHold) return;

    // Use E6.1 extracted peak tracking algorithm
    const smoothingConfig: SmoothingConfig = {
      responseSpeed: config.responseSpeed || 0.8,
      peakHoldTime: config.peakHoldTime || 500,
      peakDecayRate: config.peakDecay || 0.02,
    };

    updatePeakTracking(
      data,
      this.peakTrackingState,
      smoothingConfig,
      context.time
    );

    // Sync with local peak tracking arrays for backward compatibility
    this.peakValues = [...this.peakTrackingState.peakValues];
    this.peakTimers = [...this.peakTrackingState.peakTimers];
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: BarVisualizationConfig,
    context: RenderContext
  ): void {
    ctx.save();

    // Apply global transformations
    ctx.translate(config.offsetX || 0, config.offsetY || 0);

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-bar glow (config.glowIntensity/glowColor) is intentionally not used to avoid double application.

    if (config.layout === 'linear') {
      this.renderLinearBars(ctx, data, config, context);
    } else {
      this.renderRadialBars(ctx, data, config, context);
    }

    ctx.restore();
  }

  private renderLinearBars(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: BarVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const barCount = data.length;
    const totalWidth =
      barCount * (config.barWidth + config.barSpacing) - config.barSpacing;
    const startX = centerX - totalWidth / 2;

    // Batch render for performance
    ctx.beginPath();

    for (let i = 0; i < barCount; i++) {
      const value = data[i] || 0;
      const barHeight = Math.max(
        config.minHeight || 2,
        value * config.maxHeight
      );
      const x = startX + i * (config.barWidth + config.barSpacing);

      let y: number;
      switch (config.barAlignment) {
        case 'center':
          y = centerY - barHeight / 2;
          break;
        case 'top':
          y = centerY - config.maxHeight / 2;
          break;
        default: // 'bottom'
          y = centerY + config.maxHeight / 2 - barHeight;
      }

      const color = this.getColor(i, value, barCount, config);

      // Style-specific rendering for linear bars
      if (config.style === 'line') {
        // Line style - stroke only
        ctx.strokeStyle = color;
        ctx.lineWidth = config.borderWidth || 2;
        ctx.lineCap = 'round';
        if (config.cornerRadius && config.cornerRadius > 0) {
          this.strokeRoundedRect(
            ctx,
            x,
            y,
            config.barWidth,
            barHeight,
            config.cornerRadius
          );
        } else {
          ctx.strokeRect(x, y, config.barWidth, barHeight);
        }
      } else {
        // Block style (default) - filled
        ctx.fillStyle = color;
        if (config.cornerRadius && config.cornerRadius > 0) {
          this.fillRoundedRect(
            ctx,
            x,
            y,
            config.barWidth,
            barHeight,
            config.cornerRadius
          );
        } else {
          ctx.fillRect(x, y, config.barWidth, barHeight);
        }
      }

      // Render peak indicator
      if (config.peakHold && (this.peakValues[i] || 0) > 0) {
        this.renderPeakIndicator(ctx, i, x, config, context);
      }
    }
  }

  private renderPeakIndicator(
    ctx: CanvasRenderingContext2D,
    index: number,
    x: number,
    config: BarVisualizationConfig,
    context: RenderContext
  ): void {
    const peakValue = this.peakValues[index] ?? 0;
    if (peakValue <= 0) {
      return;
    }

    const peakHeight = Math.max(
      config.minHeight ?? 2,
      peakValue * config.maxHeight
    );
    const { centerY } = context;

    let baseY: number;
    switch (config.barAlignment) {
      case 'center':
        baseY = centerY - peakHeight / 2;
        break;
      case 'top':
        baseY = centerY - config.maxHeight / 2;
        break;
      default:
        baseY = centerY + config.maxHeight / 2 - peakHeight;
        break;
    }

    const indicatorHeight = Math.max(2, config.barWidth * 0.2);
    const indicatorY = baseY - indicatorHeight - 2;

    ctx.save();
    ctx.fillStyle = config.glowColor ?? config.secondaryColor ?? '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x, indicatorY, config.barWidth, indicatorHeight);
    ctx.restore();
  }

  private renderRadialBars(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: BarVisualizationConfig,
    context: RenderContext
  ): void {
    const radialConfig = this.buildRadialConfig(config, context);
    const positions = RadialTransformService.batchTransform(data, radialConfig);

    // Optional debug/path rendering for radial layout
    if (config.showRadialPath) {
      ctx.save();
      try {
        const startDeg = config.arcMode ? (config.startAngle ?? 0) : 0;
        const endDeg = config.arcMode ? (config.endAngle ?? 360) : 360;
        const startRad = (startDeg - 90) * DEG_TO_RAD;
        const endRad = (endDeg - 90) * DEG_TO_RAD;

        // Draw inner radius arc path
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.arc(
          context.centerX,
          context.centerY,
          config.innerRadius ?? 140,
          startRad,
          endRad,
          false
        );
        ctx.stroke();

        // Draw small ticks at element base positions
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < positions.length; i++) {
          const p = positions[i];
          if (!p) continue;
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
      } finally {
        ctx.restore();
      }
    }

    for (let i = 0; i < positions.length; i++) {
      const value = data[i] || 0;
      const barHeight = value * config.maxHeight;
      const position = positions[i];
      if (!position) {
        continue;
      }
      const color = this.getColor(i, value, data.length, config);

      let pulseScale = 1;
      if (config.pulseMode === 'subtle') {
        pulseScale = 1 + value * 0.1;
      } else if (config.pulseMode === 'strong') {
        pulseScale = 1 + value * 0.3;
      }

      // Use normal (not midNormal) so bars point straight outward from their base position
      const radialVector = position.normal ?? { x: 0, y: -1 };
      const tangentVector = position.tangent ?? {
        x: -radialVector.y,
        y: radialVector.x,
      };
      // Note: Debug/path rendering moved outside the loop (above) to avoid duplication

      const placement = this.resolveRadialPlacement(config, {
        baseX: position.x,
        baseY: position.y,
        radialVector,
        tangentVector,
      });

      this.renderRadialBar(
        ctx,
        placement.baseX,
        placement.baseY,
        placement.angle,
        barHeight,
        color,
        config,
        pulseScale
      );
    }
  }

  private renderRadialBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    height: number,
    color: string,
    config: BarVisualizationConfig,
    pulseScale: number
  ): void {
    // Make spacing reduce visual thickness in radial mode, but never overpower barWidth
    const baseWidth = config.barWidth || 4;
    const spacing = Math.max(0, config.barSpacing || 0);
    const thickness = Math.max(
      1,
      baseWidth - Math.min(spacing, Math.max(0, baseWidth - 1))
    );
    const scaledHeight = height * pulseScale;

    // Compute alignment-relative offset along the normal axis
    const alignment = (config.barAlignment as any) || 'bottom';
    let offsetStart: number;
    if (alignment === 'center') {
      offsetStart = -scaledHeight / 2;
    } else if (alignment === 'top') {
      offsetStart = -scaledHeight;
    } else {
      offsetStart = 0; // bottom
    }
    if (config.invert && alignment !== 'center') {
      offsetStart = offsetStart === 0 ? -scaledHeight : 0;
    }
    const offsetEnd = offsetStart + scaledHeight;

    const canTransform =
      typeof (ctx as any).translate === 'function' &&
      typeof (ctx as any).rotate === 'function';

    // Style-specific drawing
    if (config.style === 'line') {
      // Draw a line bar along the normal vector
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineWidth = thickness;

      if (canTransform) {
        if ((ctx as any).save) ctx.save();
        (ctx as any).translate?.(x, y);
        (ctx as any).rotate?.(angle);
        ctx.beginPath?.();
        ctx.moveTo?.(0, offsetStart);
        ctx.lineTo?.(0, offsetEnd);
        ctx.stroke?.();
        (ctx as any).restore?.();
      } else {
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);
        // Tangent not needed for a centered line of zero width in path space
        const x1 = x + nx * offsetStart;
        const y1 = y + ny * offsetStart;
        const x2 = x + nx * offsetEnd;
        const y2 = y + ny * offsetEnd;
        ctx.beginPath?.();
        ctx.moveTo?.(x1, y1);
        ctx.lineTo?.(x2, y2);
        ctx.stroke?.();
      }
      return;
    }

    // Default: block style (filled rectangle)
    ctx.fillStyle = color;

    if (canTransform) {
      if ((ctx as any).save) ctx.save();
      (ctx as any).translate?.(x, y);
      (ctx as any).rotate?.(angle);
      const barX = -thickness / 2;
      this.fillRoundedRect(
        ctx,
        barX,
        offsetStart,
        thickness,
        scaledHeight,
        config.cornerRadius || 0
      );
      (ctx as any).restore?.();
    } else {
      // Absolute coordinates fallback using unit normal/tangent vectors
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      const tx = -Math.sin(angle);
      const ty = Math.cos(angle);
      const halfT = thickness / 2;

      const blx = x + tx * -halfT + nx * offsetStart; // bottom-left
      const bly = y + ty * -halfT + ny * offsetStart;
      const brx = x + tx * halfT + nx * offsetStart; // bottom-right
      const bry = y + ty * halfT + ny * offsetStart;
      const trx = x + tx * halfT + nx * offsetEnd; // top-right
      const try_ = y + ty * halfT + ny * offsetEnd;
      const tlx = x + tx * -halfT + nx * offsetEnd; // top-left
      const tly = y + ty * -halfT + ny * offsetEnd;

      ctx.beginPath?.();
      ctx.moveTo?.(blx, bly);
      ctx.lineTo?.(brx, bry);
      ctx.lineTo?.(trx, try_);
      ctx.lineTo?.(tlx, tly);
      ctx.closePath?.();
      ctx.fill?.();
    }
  }

  private buildRadialConfig(
    config: BarVisualizationConfig,

    context: RenderContext
  ): RadialConfig {
    const startAngle = config.arcMode ? (config.startAngle ?? 0) : 0;

    const endAngle = config.arcMode ? (config.endAngle ?? 360) : 360;

    const rawDirection = (config as Record<string, unknown>).direction as
      | RadialConfig['direction']
      | undefined;

    const rawOuterRadius = (config as Record<string, unknown>).outerRadius;

    const radialConfig: RadialConfig = {
      centerX: context.centerX,

      centerY: context.centerY,

      innerRadius: config.innerRadius ?? 140,

      startAngle,

      endAngle,

      arcMode: config.arcMode ?? false,

      invert: config.invert ?? false,
    };

    if (typeof rawOuterRadius === 'number') {
      radialConfig.outerRadius = rawOuterRadius;
    } else {
      radialConfig.outerRadius = (config.innerRadius ?? 140) + config.maxHeight;
    }

    if (rawDirection) {
      radialConfig.direction = rawDirection;
    }

    return radialConfig;
  }

  private resolveRadialPlacement(
    config: BarVisualizationConfig,
    options: {
      baseX: number;
      baseY: number;
      radialVector: { x: number; y: number };
      tangentVector: { x: number; y: number };
    }
  ): { baseX: number; baseY: number; angle: number } {
    const radialVector = this.normalizeVector(options.radialVector);
    const tangentVector = this.normalizeVector(options.tangentVector);
    const orientationMode = config.radialOrientation ?? 'follow-radius';

    let orientationVector: { x: number; y: number };
    switch (orientationMode) {
      case 'follow-tangent':
        orientationVector = tangentVector;
        break;
      case 'maintain':
        orientationVector = { x: 0, y: -1 };
        break;
      case 'follow-radius':
      default:
        orientationVector = radialVector;
        break;
    }

    const normalizedOrientation = this.normalizeVector(orientationVector);
    const barRotation = Number((config as any).barRotation ?? 0);
    const radialRotation = Number((config as any).radialRotation ?? 0);
    const totalRotation = (barRotation + radialRotation) * DEG_TO_RAD;

    const rotated =
      totalRotation !== 0
        ? this.rotateVector(normalizedOrientation, totalRotation)
        : normalizedOrientation;

    const orientationAngle = Math.atan2(rotated.y, rotated.x) - Math.PI / 2;

    return {
      baseX: options.baseX,
      baseY: options.baseY,
      angle: orientationAngle,
    };
  }

  private normalizeVector(vector: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    const length = Math.hypot(vector.x, vector.y);
    if (!Number.isFinite(length) || length === 0) {
      return { x: 0, y: -1 };
    }
    return { x: vector.x / length, y: vector.y / length };
  }

  private rotateVector(
    vector: { x: number; y: number },
    radians: number
  ): { x: number; y: number } {
    const cosR = Math.cos(radians);
    const sinR = Math.sin(radians);
    return {
      x: vector.x * cosR - vector.y * sinR,
      y: vector.x * sinR + vector.y * cosR,
    };
  }

  private fillRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.max(0, radius || 0);
    // Begin a path regardless of rounding support
    if ((ctx as any).beginPath) ctx.beginPath();

    // Fallback path that uses only moveTo/lineTo if arcTo is unavailable
    const canArcTo = typeof (ctx as any).arcTo === 'function' && r > 0;
    if (canArcTo) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
    } else {
      // Simple rectangle path (also used when radius = 0)
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y);
    }

    if ((ctx as any).closePath) ctx.closePath();
    if ((ctx as any).fill) ctx.fill();
  }

  private strokeRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.max(0, radius || 0);
    // Begin a path regardless of rounding support
    if ((ctx as any).beginPath) ctx.beginPath();

    // Fallback path that uses only moveTo/lineTo if arcTo is unavailable
    const canArcTo = typeof (ctx as any).arcTo === 'function' && r > 0;
    if (canArcTo) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
    } else {
      // Simple rectangle path (also used when radius = 0)
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y);
    }

    if ((ctx as any).closePath) ctx.closePath();
    if ((ctx as any).stroke) ctx.stroke();
  }

  getDefaultConfig(): BarVisualizationConfig {
    return {
      barCount: 48,
      barWidth: 8,
      barSpacing: 2,
      maxHeight: 200,
      responseSpeed: 0.8,
      colorMode: 'gradient',
      primaryColor: '#dc2626',
      secondaryColor: '#7f1d1d',
      glowIntensity: 0,
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      innerRadius: 140,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
      invert: false,
      style: 'vertical',
      layout: 'linear',
      barAlignment: 'bottom',
      minHeight: 2,
      cornerRadius: 0,
      smoothing: 0.7,
      peakHold: true,
      peakHoldTime: 500,
      peakDecay: 0.02,
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.barCount <= 0 || config.barCount > 512) {
      errors.push('barCount must be between 1 and 512');
    }

    if (config.barWidth <= 0 || config.barWidth > 50) {
      errors.push('barWidth must be between 0.1 and 50');
    }

    if (config.maxHeight <= 0 || config.maxHeight > 1000) {
      errors.push('maxHeight must be between 1 and 1000');
    }

    if (config.responseSpeed < 0 || config.responseSpeed > 1) {
      errors.push('responseSpeed must be between 0 and 1');
    }

    const barConfig = config as BarVisualizationConfig;
    if (
      barConfig.style &&
      !['line', 'block', 'vertical'].includes(barConfig.style)
    ) {
      errors.push('style must be "line", "block", or "vertical"');
    }

    if (barConfig.layout && !['radial', 'linear'].includes(barConfig.layout)) {
      errors.push('layout must be "radial" or "linear"');
    }

    if (config.barCount > 128) {
      warnings.push('High bar count may impact performance');
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
      ...(warnings.length > 0 && { warnings }),
    };
  }

  getAnimatableProperties(): string[] {
    return [
      'barWidth',
      'maxHeight',
      'rotation',
      'scale',
      'offsetX',
      'offsetY',
      'innerRadius',
      'startAngle',
      'endAngle',
      'glowIntensity',
    ];
  }

  override exportState(): Record<string, any> {
    return {
      previousValues: [...this.previousValues],
      peakValues: [...this.peakValues],
      peakTimers: [...this.peakTimers],
    };
  }

  override importState(state: Record<string, any>): void {
    if (state.previousValues && Array.isArray(state.previousValues)) {
      this.previousValues = [...state.previousValues];
    }
    if (state.peakValues && Array.isArray(state.peakValues)) {
      this.peakValues = [...state.peakValues];
    }
    if (state.peakTimers && Array.isArray(state.peakTimers)) {
      this.peakTimers = [...state.peakTimers];
    }
    if (state.peakTrackingState) {
      this.peakTrackingState = { ...state.peakTrackingState };
    }
  }

  /**
   * E6.1 Enhancement: Cleanup extracted audio processing modules
   */
  override dispose(): void {
    // Reset state
    this.previousValues = [];
    this.peakValues = [];
    this.peakTimers = [];
    this.peakTrackingState = {
      peakValues: [],
      peakTimers: [],
      lastUpdate: Date.now(),
    };
  }
}
