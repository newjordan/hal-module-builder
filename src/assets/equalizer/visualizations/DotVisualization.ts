/**
 * DotVisualization - Specialized dot matrix visualization with grid layout rendering
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 *
 * Optimized for multiple small shape rendering with batch operations
 * Supports grid layouts, spatial partitioning, and instanced rendering patterns
 */

import { RadialTransformService } from '../../../services/radial/RadialTransformService';
import { RadialConfig } from '../../../services/radial/types';
import {
  BaseVisualization,
  FrequencyData,
  RenderContext,
  ValidationResult,
  VisualizationConfig,
  VisualizationMetadata,
} from './BaseVisualization';

export interface DotVisualizationConfig extends VisualizationConfig {
  layout: 'grid' | 'radial' | 'spiral' | 'scatter';
  dotSize: number;
  gridColumns: number;
  gridRows: number;
  dotSpacing: number;
  trailEffect: boolean;
  gravityEffect?: boolean;
  scatterRadius?: number;
  fillMode: 'solid' | 'hollow' | 'gradient';
  shape: 'circle' | 'square' | 'diamond' | 'triangle';
  // Radial-specific properties
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  arcMode?: boolean;
  invert?: boolean;
}

export class DotVisualization extends BaseVisualization {
  readonly type = 'dot';
  readonly metadata: VisualizationMetadata = {
    name: 'Dot Matrix',
    description:
      'Grid-based dot visualization with spatial partitioning optimizations',
    author: 'HAL Builder',
    version: '2.0.0',
    tags: ['dots', 'grid', 'matrix', 'particles'],
  };

  private dotTrails: Array<
    Array<{ x: number; y: number; size: number; color: string }>
  > = [];

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    if (!context?.ctx || !frequencyData?.bands) return;

    const dotConfig = config as DotVisualizationConfig;

    // Apply smoothing using shared utility
    const smoothedData = this.applySmoothing(frequencyData.bands, dotConfig);

    // Initialize trails if needed
    if (
      dotConfig.trailEffect &&
      this.dotTrails.length !== smoothedData.length
    ) {
      this.dotTrails = smoothedData.map(() => []);
    }

    if (context.ctx && 'tagName' in context.ctx) {
      this.renderSVG(context.ctx as any, smoothedData, dotConfig, context);
    } else if (context.ctx) {
      this.renderCanvas(
        context.ctx as CanvasRenderingContext2D,
        smoothedData,
        dotConfig,
        context
      );
    }
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: DotVisualizationConfig,
    context: RenderContext
  ): void {
    ctx.save();

    // Apply global transformations
    ctx.translate(config.offsetX || 0, config.offsetY || 0);
    ctx.rotate(((config.rotation || 0) * Math.PI) / 180);

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-element glow (config.glowIntensity/glowColor) is intentionally not used to avoid double application.

    switch (config.layout) {
      case 'grid':
        this.renderGridDots(ctx, data, config, context);
        break;
      case 'radial':
        this.renderRadialDots(ctx, data, config, context);
        break;
      case 'spiral':
        this.renderSpiralDots(ctx, data, config, context);
        break;
      case 'scatter':
        this.renderScatterDots(ctx, data, config, context);
        break;
      default:
        this.renderGridDots(ctx, data, config, context);
    }

    ctx.restore();
  }

  private renderGridDots(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: DotVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const cols = config.gridColumns || 8;
    const rows = config.gridRows || 6;
    const totalDots = cols * rows;
    const dotSpacing = config.dotSpacing || 15;

    const gridWidth = (cols - 1) * dotSpacing;
    const gridHeight = (rows - 1) * dotSpacing;
    const startX = centerX - gridWidth / 2;
    const startY = centerY - gridHeight / 2;

    // Batch rendering for performance
    ctx.beginPath();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dotIndex = row * cols + col;
        const dataIndex = Math.floor((dotIndex / totalDots) * data.length);
        const value = data[dataIndex] || 0;

        const x = startX + col * dotSpacing;
        const y = startY + row * dotSpacing;

        // Calculate dot size based on frequency value
        let size = config.dotSize * (0.3 + value * 0.7);

        // Apply pulse scaling
        if (config.pulseMode === 'subtle') size *= 1 + value * 0.2;
        else if (config.pulseMode === 'strong') size *= 1 + value * 0.5;

        const color = this.getColor(dotIndex, value, totalDots, config);

        this.renderDot(ctx, x, y, size, color, config);

        // Handle trail effect
        if (config.trailEffect) {
          this.updateDotTrail(dotIndex, { x, y, size, color });
          this.renderDotTrail(ctx, dotIndex, config);
        }
      }
    }
  }

  private renderRadialDots(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: DotVisualizationConfig,
    context: RenderContext
  ): void {
    const radialConfig = this.buildRadialConfig(config, context);
    const positions = RadialTransformService.batchTransform(data, radialConfig);

    for (let i = 0; i < positions.length; i++) {
      const value = data[i] || 0;
      const position = positions[i];
      if (!position) {
        continue;
      }

      const extension = value * (config.maxHeight / 2);
      const finalX = position.x + Math.cos(position.angle) * extension;
      const finalY = position.y + Math.sin(position.angle) * extension;

      let size = config.dotSize * (0.3 + value * 0.7);

      if (config.pulseMode === 'subtle') size *= 1 + value * 0.2;
      else if (config.pulseMode === 'strong') size *= 1 + value * 0.5;

      const color = this.getColor(i, value, positions.length, config);

      this.renderDot(ctx, finalX, finalY, size, color, config);
    }
  }

  private renderSpiralDots(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: DotVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const dataCount = data.length;
    const maxRadius = config.scatterRadius || 150;

    for (let i = 0; i < dataCount; i++) {
      const value = data[i] || 0;
      const t = i / dataCount;
      const angle = t * 6 * Math.PI; // Multiple rotations
      const radius = t * maxRadius;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const size = config.dotSize * (0.3 + value * 0.7);
      const color = this.getColor(i, value, dataCount, config);

      this.renderDot(ctx, x, y, size, color, config);
    }
  }

  private renderScatterDots(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: DotVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const dataCount = data.length;
    const scatterRadius = config.scatterRadius || 120;

    for (let i = 0; i < dataCount; i++) {
      const value = data[i] || 0;

      // Pseudo-random positioning based on index
      const angle = (i * 137.5 * Math.PI) / 180; // Golden angle
      const radius = Math.sqrt(i / dataCount) * scatterRadius;

      const x = centerX + Math.cos(angle) * radius;
      let y = centerY + Math.sin(angle) * radius;

      // Add gravity effect
      if (config.gravityEffect) {
        y += value * 30; // Pull dots down based on frequency
      }

      const size = config.dotSize * (0.3 + value * 0.7);
      const color = this.getColor(i, value, dataCount, config);

      this.renderDot(ctx, x, y, size, color, config);
    }
  }

  private renderDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    config: DotVisualizationConfig
  ): void {
    switch (config.shape) {
      case 'circle':
        this.renderCircleDot(ctx, x, y, size, color, config);
        break;
      case 'square':
        this.renderSquareDot(ctx, x, y, size, color, config);
        break;
      case 'diamond':
        this.renderDiamondDot(ctx, x, y, size, color, config);
        break;
      case 'triangle':
        this.renderTriangleDot(ctx, x, y, size, color, config);
        break;
      default:
        this.renderCircleDot(ctx, x, y, size, color, config);
    }
  }

  private renderCircleDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    config: DotVisualizationConfig
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI);

    if (config.fillMode === 'hollow') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  private renderSquareDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    config: DotVisualizationConfig
  ): void {
    const halfSize = size / 2;

    if (config.fillMode === 'hollow') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - halfSize, y - halfSize, size, size);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x - halfSize, y - halfSize, size, size);
    }
  }

  private renderDiamondDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    config: DotVisualizationConfig
  ): void {
    const halfSize = size / 2;

    ctx.beginPath();
    ctx.moveTo(x, y - halfSize);
    ctx.lineTo(x + halfSize, y);
    ctx.lineTo(x, y + halfSize);
    ctx.lineTo(x - halfSize, y);
    ctx.closePath();

    if (config.fillMode === 'hollow') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  private renderTriangleDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    config: DotVisualizationConfig
  ): void {
    const height = size * 0.866; // equilateral triangle

    ctx.beginPath();
    ctx.moveTo(x, y - height / 2);
    ctx.lineTo(x - size / 2, y + height / 2);
    ctx.lineTo(x + size / 2, y + height / 2);
    ctx.closePath();

    if (config.fillMode === 'hollow') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  private updateDotTrail(
    index: number,
    dot: { x: number; y: number; size: number; color: string }
  ): void {
    if (!this.dotTrails[index]) {
      this.dotTrails[index] = [];
    }

    this.dotTrails[index].push(dot);

    // Limit trail length
    const maxTrailLength = 5;
    if (this.dotTrails[index].length > maxTrailLength) {
      this.dotTrails[index].shift();
    }
  }

  private renderDotTrail(
    ctx: CanvasRenderingContext2D,
    index: number,
    config: DotVisualizationConfig
  ): void {
    const trail = this.dotTrails[index];
    if (!trail || trail.length < 2) return;

    for (let i = 0; i < trail.length - 1; i++) {
      const alpha = ((i + 1) / trail.length) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;

      const dot = trail[i];
      if (dot) {
        this.renderDot(ctx, dot.x, dot.y, dot.size * 0.7, dot.color, config);
      }

      ctx.restore();
    }
  }

  private renderSVG(
    svg: SVGElement,
    data: number[],
    config: DotVisualizationConfig,
    context: RenderContext
  ): void {
    // Clear existing elements
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute(
      'transform',
      `translate(${config.offsetX || 0}, ${config.offsetY || 0}) rotate(${config.rotation || 0})`
    );

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-element SVG drop-shadow is intentionally not used here.

    // Simple grid layout for SVG (optimized for file size)
    // Use same centering logic as Canvas for consistency
    const { centerX, centerY } = context;
    const cols = config.gridColumns || 8;
    const rows = config.gridRows || 6;
    const dotSpacing = config.dotSpacing || 15;

    // Calculate grid bounds (same as Canvas renderGridDots)
    const gridWidth = (cols - 1) * dotSpacing;
    const gridHeight = (rows - 1) * dotSpacing;
    const startX = centerX - gridWidth / 2;
    const startY = centerY - gridHeight / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dotIndex = row * cols + col;
        const dataIndex = Math.floor((dotIndex / (cols * rows)) * data.length);
        const value = data[dataIndex] || 0;

        // Use consistent positioning with Canvas
        const x = startX + col * dotSpacing;
        const y = startY + row * dotSpacing;
        const size = config.dotSize * (0.3 + value * 0.7);
        const color = this.getColor(dotIndex, value, cols * rows, config);

        const circle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        );
        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', (size / 2).toString());
        circle.setAttribute('fill', color);

        g.appendChild(circle);
      }
    }

    svg.appendChild(g);
  }

  getDefaultConfig(): DotVisualizationConfig {
    return {
      barCount: 48,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 100,
      responseSpeed: 0.8,
      colorMode: 'rainbow',
      primaryColor: '#ff6600',
      secondaryColor: '#ff0066',
      // legacy glowIntensity removed (appearance.outerGlow is the single source of truth)
      pulseMode: 'subtle',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      layout: 'grid',
      dotSize: 8,
      gridColumns: 8,
      gridRows: 6,
      dotSpacing: 20,
      trailEffect: false,
      gravityEffect: false,
      scatterRadius: 120,
      fillMode: 'solid',
      shape: 'circle',
      innerRadius: 100,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const dotConfig = config as DotVisualizationConfig;

    // Common base property validation
    if (config.barCount <= 0 || config.barCount > 512) {
      errors.push('barCount must be between 1 and 512');
    }

    if (config.maxHeight <= 0 || config.maxHeight > 1000) {
      errors.push('maxHeight must be between 1 and 1000');
    }

    if (config.responseSpeed < 0 || config.responseSpeed > 1) {
      errors.push('responseSpeed must be between 0 and 1');
    }

    if (
      dotConfig.dotSize !== undefined &&
      (dotConfig.dotSize <= 0 || dotConfig.dotSize > 50)
    ) {
      errors.push('dotSize must be between 1 and 50');
    }

    if (
      dotConfig.gridColumns !== undefined &&
      (dotConfig.gridColumns <= 0 || dotConfig.gridColumns > 20)
    ) {
      errors.push('gridColumns must be between 1 and 20');
    }

    if (
      dotConfig.gridRows !== undefined &&
      (dotConfig.gridRows <= 0 || dotConfig.gridRows > 20)
    ) {
      errors.push('gridRows must be between 1 and 20');
    }

    if (
      dotConfig.layout &&
      !['grid', 'radial', 'spiral', 'scatter'].includes(dotConfig.layout)
    ) {
      errors.push('layout must be "grid", "radial", "spiral", or "scatter"');
    }

    if (
      dotConfig.shape &&
      !['circle', 'square', 'diamond', 'triangle'].includes(dotConfig.shape)
    ) {
      errors.push('shape must be "circle", "square", "diamond", or "triangle"');
    }

    const totalDots = (dotConfig.gridColumns || 8) * (dotConfig.gridRows || 6);
    if (totalDots > 200) {
      warnings.push('High dot count may impact rendering performance');
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
      ...(warnings.length > 0 && { warnings }),
    };
  }

  getAnimatableProperties(): string[] {
    return [
      'dotSize',
      'dotSpacing',
      'rotation',
      'scale',
      'offsetX',
      'offsetY',
      // 'glowIntensity' removed from allowed keys (legacy)
      'scatterRadius',
    ];
  }
  private buildRadialConfig(
    config: DotVisualizationConfig,
    context: RenderContext
  ): RadialConfig {
    return {
      centerX: context.centerX,
      centerY: context.centerY,
      innerRadius: config.innerRadius || 100,
      outerRadius:
        config.outerRadius || (config.innerRadius || 100) + config.maxHeight,
      startAngle: config.startAngle || 0,
      endAngle: config.endAngle || 360,
      arcMode: config.arcMode || false,
      invert: config.invert || false,
      direction: (config as any).direction || 'clockwise',
    };
  }
}
