/**
 * LineVisualization - Specialized line/waveform visualization with smooth curve interpolation
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 *
 * Optimized for path rendering and stroke operations with smooth curve algorithms
 * Supports multiple line styles, interpolation methods, and performance optimizations
 */

import {
  BaseVisualization,
  FrequencyData,
  RenderContext,
  ValidationResult,
  VisualizationConfig,
  VisualizationMetadata,
} from './BaseVisualization';

export interface LineVisualizationConfig extends VisualizationConfig {
  lineThickness: number;
  smoothing: boolean;
  multiLine: boolean;
  waveformStyle: 'continuous' | 'segmented' | 'spline';
  interpolation: 'linear' | 'quadratic' | 'cubic';
  amplitude: number;
  baselineOffset: number;
  mirrorMode?: boolean;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  dashPattern?: number[];
}

export class LineVisualization extends BaseVisualization {
  readonly type = 'line';
  readonly metadata: VisualizationMetadata = {
    name: 'Line Waveform',
    description: 'Smooth line visualization with advanced curve interpolation',
    author: 'HAL Builder',
    version: '2.0.0',
    tags: ['waveform', 'line', 'smooth', 'interpolation'],
  };

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    if (!context?.ctx || !frequencyData?.bands) return;

    const lineConfig = config as LineVisualizationConfig;

    // Apply smoothing using shared utility
    const smoothedData = this.applySmoothing(frequencyData.bands, lineConfig);

    if (context.ctx && 'tagName' in context.ctx) {
      this.renderSVG(context.ctx as any, smoothedData, lineConfig, context);
    } else if (context.ctx) {
      this.renderCanvas(
        context.ctx as CanvasRenderingContext2D,
        smoothedData,
        lineConfig,
        context
      );
    }
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: LineVisualizationConfig,
    context: RenderContext
  ): void {
    ctx.save();

    // Apply global transformations
    ctx.translate(config.offsetX || 0, config.offsetY || 0);
    ctx.rotate(((config.rotation || 0) * Math.PI) / 180);

    // Set up line styling
    ctx.lineWidth = config.lineThickness || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-line glow (config.glowIntensity/glowColor) is intentionally not used to avoid double application.

    // Set stroke style
    if (config.strokeStyle === 'dashed' && config.dashPattern) {
      ctx.setLineDash(config.dashPattern);
    } else if (config.strokeStyle === 'dotted') {
      ctx.setLineDash([config.lineThickness, config.lineThickness * 2]);
    }

    if (config.multiLine) {
      this.renderMultipleLines(ctx, data, config, context);
    } else {
      this.renderSingleLine(ctx, data, config, context);
    }

    ctx.restore();
  }

  private renderSingleLine(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: LineVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY, width } = context;
    const dataCount = data.length;
    const stepX = width / Math.max(1, dataCount - 1);
    const amplitude = config.amplitude || config.maxHeight;
    const baseline = centerY + (config.baselineOffset || 0);

    // Generate path points
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < dataCount; i++) {
      const value = data[i] || 0;
      const x = i * stepX - width / 2 + centerX;
      const y = baseline - value * amplitude;
      points.push({ x, y });
    }

    // Set color
    const color = this.getColor(0, 0.5, 1, config);
    ctx.strokeStyle = color;

    // Render based on style and interpolation
    switch (config.waveformStyle) {
      case 'continuous':
        this.renderContinuousLine(ctx, points, config);
        break;

      case 'segmented':
        this.renderSegmentedLine(ctx, points, config);
        break;

      case 'spline':
        this.renderSplineLine(ctx, points, config);
        break;

      default:
        this.renderContinuousLine(ctx, points, config);
    }

    // Render mirror mode if enabled
    if (config.mirrorMode) {
      this.renderMirroredLine(ctx, points, config, baseline);
    }
  }

  private renderContinuousLine(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    config: LineVisualizationConfig
  ): void {
    if (points.length < 2) return;

    const firstPoint = points[0];
    if (!firstPoint) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);

    switch (config.interpolation) {
      case 'linear':
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          if (!point) {
            continue;
          }
          ctx.lineTo(point.x, point.y);
        }
        break;

      case 'quadratic':
        this.renderQuadraticCurve(ctx, points);
        break;

      case 'cubic':
        this.renderCubicCurve(ctx, points);
        break;

      default:
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          if (!point) {
            continue;
          }
          ctx.lineTo(point.x, point.y);
        }
    }

    ctx.stroke();
  }

  private renderQuadraticCurve(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>
  ): void {
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      if (!current || !next) {
        continue;
      }
      const controlX = current.x + (next.x - current.x) * 0.5;
      const controlY = current.y;

      ctx.quadraticCurveTo(controlX, controlY, next.x, next.y);
    }
  }

  private renderCubicCurve(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>
  ): void {
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      if (!current || !next) {
        continue;
      }
      const prev = points[i - 1] ?? current;

      const cp1x = current.x + (next.x - prev.x) * 0.2;
      const cp1y = current.y;
      const cp2x = next.x - (next.x - current.x) * 0.2;
      const cp2y = next.y;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
    }
  }

  private renderSegmentedLine(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    config: LineVisualizationConfig
  ): void {
    const segmentLength = Math.max(2, Math.floor(points.length / 10));

    for (let i = 0; i < points.length - 1; i += segmentLength) {
      const segmentEnd = Math.min(i + segmentLength, points.length - 1);
      const segmentPoints = points.slice(i, segmentEnd + 1);

      if (segmentPoints.length >= 2) {
        const intensity =
          segmentPoints.reduce(
            (sum, _point, idx) => sum + (points[i + idx]?.y || 0),
            0
          ) / segmentPoints.length;

        const normalizedIntensity = Math.abs(intensity) / config.maxHeight;
        const color = this.getColor(
          i,
          normalizedIntensity,
          points.length,
          config
        );
        ctx.strokeStyle = color;

        this.renderContinuousLine(ctx, segmentPoints, config);
      }
    }
  }

  private renderSplineLine(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    config: LineVisualizationConfig
  ): void {
    if (points.length < 3) {
      this.renderContinuousLine(ctx, points, config);
      return;
    }

    const firstPoint = points[0];
    if (!firstPoint) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);

    // Cardinal spline implementation
    const tension = 0.5;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      if (!p0 || !p1 || !p2 || !p3) {
        continue;
      }

      const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
      const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
      const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
      const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.stroke();
  }

  private renderMirroredLine(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    config: LineVisualizationConfig,
    baseline: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.6;

    // Create mirrored points
    const mirroredPoints = points.map(point => ({
      x: point.x,
      y: baseline + (baseline - point.y),
    }));

    this.renderContinuousLine(ctx, mirroredPoints, config);
    ctx.restore();
  }

  private renderMultipleLines(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: LineVisualizationConfig,
    context: RenderContext
  ): void {
    const lineCount = Math.min(5, Math.floor(data.length / 10));
    const { centerY } = context;
    const lineSpacing = config.maxHeight / lineCount;

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      const startIdx = lineIndex * Math.floor(data.length / lineCount);
      const endIdx = Math.min(
        startIdx + Math.floor(data.length / lineCount),
        data.length
      );
      const lineData = data.slice(startIdx, endIdx);

      const lineBaseline = centerY + (lineIndex - lineCount / 2) * lineSpacing;
      const lineAmplitude = (config.amplitude || config.maxHeight) / lineCount;

      // Create line-specific config
      const lineConfig = {
        ...config,
        amplitude: lineAmplitude,
        baselineOffset: lineBaseline - centerY,
      };

      const color = this.getColor(lineIndex, 0.5, lineCount, config);
      ctx.strokeStyle = color;

      this.renderSingleLine(ctx, lineData, lineConfig, context);
    }
  }

  private renderSVG(
    svg: SVGElement,
    data: number[],
    config: LineVisualizationConfig,
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

    const path = this.generateSVGPath(data, config, context);
    const pathElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );

    pathElement.setAttribute('d', path);
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke', this.getColor(0, 0.5, 1, config));
    pathElement.setAttribute(
      'stroke-width',
      (config.lineThickness || 2).toString()
    );
    pathElement.setAttribute('stroke-linecap', 'round');
    pathElement.setAttribute('stroke-linejoin', 'round');

    if (config.strokeStyle === 'dashed' && config.dashPattern) {
      pathElement.setAttribute(
        'stroke-dasharray',
        config.dashPattern.join(' ')
      );
    }

    g.appendChild(pathElement);
    svg.appendChild(g);
  }

  private generateSVGPath(
    data: number[],
    config: LineVisualizationConfig,
    context: RenderContext
  ): string {
    const { centerX, centerY, width } = context;
    const dataCount = data.length;
    const stepX = width / Math.max(1, dataCount - 1);
    const amplitude = config.amplitude || config.maxHeight;
    const baseline = centerY + (config.baselineOffset || 0);

    if (dataCount === 0) return '';

    let path = '';

    for (let i = 0; i < dataCount; i++) {
      const value = data[i] || 0;
      const x = i * stepX - width / 2 + centerX;
      const y = baseline - value * amplitude;

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        switch (config.interpolation) {
          case 'quadratic':
            if (i < dataCount - 1) {
              const nextX = (i + 1) * stepX - width / 2 + centerX;
              const nextValue = data[i + 1] ?? 0;
              const controlX = x + (nextX - x) * 0.5;
              path += ` Q ${controlX} ${y} ${nextX} ${baseline - nextValue * amplitude}`;
              i++; // Skip next point as it's already included
            } else {
              path += ` L ${x} ${y}`;
            }
            break;

          default:
            path += ` L ${x} ${y}`;
        }
      }
    }

    return path;
  }

  getDefaultConfig(): LineVisualizationConfig {
    return {
      barCount: 64,
      barWidth: 2,
      barSpacing: 1,
      maxHeight: 150,
      responseSpeed: 0.8,
      colorMode: 'gradient',
      primaryColor: '#00aaff',
      secondaryColor: '#0044aa',
      // legacy glowIntensity removed (appearance.outerGlow is the single source of truth)
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      lineThickness: 3,
      smoothing: true,
      multiLine: false,
      waveformStyle: 'continuous',
      interpolation: 'cubic',
      amplitude: 150,
      baselineOffset: 0,
      mirrorMode: false,
      strokeStyle: 'solid',
      dashPattern: [5, 5],
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lineConfig = config as LineVisualizationConfig;

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

    if (lineConfig.lineThickness <= 0 || lineConfig.lineThickness > 20) {
      errors.push('lineThickness must be between 0.1 and 20');
    }

    if (
      lineConfig.amplitude &&
      (lineConfig.amplitude <= 0 || lineConfig.amplitude > 500)
    ) {
      errors.push('amplitude must be between 1 and 500');
    }

    if (
      lineConfig.waveformStyle &&
      !['continuous', 'segmented', 'spline'].includes(lineConfig.waveformStyle)
    ) {
      errors.push(
        'waveformStyle must be "continuous", "segmented", or "spline"'
      );
    }

    if (
      lineConfig.interpolation &&
      !['linear', 'quadratic', 'cubic'].includes(lineConfig.interpolation)
    ) {
      errors.push('interpolation must be "linear", "quadratic", or "cubic"');
    }

    if (config.barCount > 256) {
      warnings.push('High point count may impact line rendering performance');
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
      ...(warnings.length > 0 && { warnings }),
    };
  }

  getAnimatableProperties(): string[] {
    return [
      'lineThickness',
      'amplitude',
      'rotation',
      'scale',
      'offsetX',
      'offsetY',
      // 'glowIntensity' removed from allowed keys (legacy)
      'baselineOffset',
    ];
  }
}
