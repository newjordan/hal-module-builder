/**
 * CircleVisualization - Specialized circular visualization with polar coordinate rendering
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 *
 * Optimized for circular/radial visualization patterns with polar transformations
 * Includes pulsing effects, concentric rings, and configurable fill styles
 */

import {
  BaseVisualization,
  FrequencyData,
  RenderContext,
  ValidationResult,
  VisualizationConfig,
  VisualizationMetadata,
} from './BaseVisualization';

export interface CircleVisualizationConfig extends VisualizationConfig {
  circleRadius: number;
  pulsingEffect: boolean;
  concentricRings: boolean;
  ringCount: number;
  fillStyle: 'solid' | 'gradient' | 'outline';
  radiusMultiplier?: number;
  angleOffset?: number;
  maxRadius?: number;
  minRadius?: number;
  strokeWidth?: number;
  // Arc mode support (consistent with other visualizations)
  startAngle?: number;
  endAngle?: number;
  arcMode?: boolean;
}

export class CircleVisualization extends BaseVisualization {
  readonly type = 'circle';
  readonly metadata: VisualizationMetadata = {
    name: 'Radial Circles',
    description:
      'Circular visualization with polar coordinates and pulsing effects',
    author: 'HAL Builder',
    version: '2.0.0',
    tags: ['radial', 'circles', 'polar', 'pulsing'],
  };

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    if (!context?.ctx || !frequencyData?.bands) return;

    const circleConfig = config as CircleVisualizationConfig;

    // Apply smoothing using shared utility
    const smoothedData = this.applySmoothing(frequencyData.bands, circleConfig);

    if (context.ctx && 'tagName' in context.ctx) {
      this.renderSVG(context.ctx as any, smoothedData, circleConfig, context);
    } else if (context.ctx) {
      this.renderCanvas(
        context.ctx as CanvasRenderingContext2D,
        smoothedData,
        circleConfig,
        context
      );
    }
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: CircleVisualizationConfig,
    context: RenderContext
  ): void {
    ctx.save();

    // Apply global transformations
    ctx.translate(config.offsetX || 0, config.offsetY || 0);
    ctx.rotate(((config.rotation || 0) * Math.PI) / 180);

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-element glow (config.glowIntensity/glowColor) is intentionally not used to avoid double application.

    if (config.concentricRings) {
      this.renderConcentricRings(ctx, data, config, context);
    } else {
      this.renderRadialCircles(ctx, data, config, context);
    }

    ctx.restore();
  }

  private renderRadialCircles(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: CircleVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const dataCount = data.length;
    const baseRadius = config.circleRadius || 100;
    const angleOffset = ((config.angleOffset || 0) * Math.PI) / 180;

    // Support arc mode like other visualizations
    const startAngle = config.arcMode ? (config.startAngle ?? 0) : 0;
    const endAngle = config.arcMode ? (config.endAngle ?? 360) : 360;
    const arcSpan = (endAngle - startAngle) * (Math.PI / 180);
    const isPartialArc =
      config.arcMode && Math.abs(endAngle - startAngle) < 360;

    // For partial arcs, center elements within the arc for better visual symmetry
    const divisions = dataCount;
    const angleStep = arcSpan / divisions;
    const arcCenteringOffset = isPartialArc ? angleStep / 2 : 0;
    const startRad = startAngle * (Math.PI / 180) + angleOffset;

    for (let i = 0; i < dataCount; i++) {
      const value = data[i] || 0;
      const angle = startRad + arcCenteringOffset + i * angleStep;

      // Calculate radius with pulsing effect
      let radius = config.minRadius || 5;
      if (config.pulsingEffect) {
        radius += value * (config.maxRadius || baseRadius);
      } else {
        radius = baseRadius * (0.3 + value * 0.7);
      }

      // Apply pulse scaling
      let pulseScale = 1;
      if (config.pulseMode === 'subtle') pulseScale = 1 + value * 0.2;
      else if (config.pulseMode === 'strong') pulseScale = 1 + value * 0.5;

      radius *= pulseScale;

      // Calculate position using polar coordinates
      const x = centerX + Math.cos(angle) * baseRadius;
      const y = centerY + Math.sin(angle) * baseRadius;

      const color = this.getColor(i, value, dataCount, config);

      this.renderCircle(ctx, x, y, radius, color, config);
    }
  }

  private renderConcentricRings(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: CircleVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const ringCount = Math.min(config.ringCount || 5, data.length);
    const maxRadius = config.maxRadius || 200;
    const minRadius = config.minRadius || 20;
    const radiusStep = (maxRadius - minRadius) / ringCount;

    for (let ring = 0; ring < ringCount; ring++) {
      const value = data[ring] || 0;
      const baseRadius = minRadius + ring * radiusStep;

      // Calculate dynamic radius
      let radius = baseRadius;
      if (config.pulsingEffect) {
        radius += value * radiusStep * 0.5;
      }

      // Apply pulse scaling
      let pulseScale = 1;
      if (config.pulseMode === 'subtle') pulseScale = 1 + value * 0.1;
      else if (config.pulseMode === 'strong') pulseScale = 1 + value * 0.3;

      radius *= pulseScale;

      const color = this.getColor(ring, value, ringCount, config);

      this.renderRing(ctx, centerX, centerY, radius, color, config);
    }
  }

  private renderCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    config: CircleVisualizationConfig
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);

    switch (config.fillStyle) {
      case 'solid':
        ctx.fillStyle = color;
        ctx.fill();
        break;

      case 'gradient':
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
        break;

      case 'outline':
        ctx.strokeStyle = color;
        ctx.lineWidth = config.strokeWidth || 2;
        ctx.stroke();
        break;
    }
  }

  private renderRing(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    color: string,
    config: CircleVisualizationConfig
  ): void {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

    switch (config.fillStyle) {
      case 'solid':
        ctx.fillStyle = color;
        ctx.fill();
        break;

      case 'gradient':
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.8, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
        break;

      case 'outline':
        ctx.strokeStyle = color;
        ctx.lineWidth = config.strokeWidth || 3;
        ctx.stroke();
        break;
    }
  }

  private renderSVG(
    svg: SVGElement,
    data: number[],
    config: CircleVisualizationConfig,
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

    if (config.concentricRings) {
      this.renderConcentricRingsSVG(g, data, config, context);
    } else {
      this.renderRadialCirclesSVG(g, data, config, context);
    }

    svg.appendChild(g);
  }

  private renderRadialCirclesSVG(
    g: SVGElement,
    data: number[],
    config: CircleVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const dataCount = data.length;
    const baseRadius = config.circleRadius || 100;
    const angleOffset = ((config.angleOffset || 0) * Math.PI) / 180;

    // Support arc mode like other visualizations (consistent with Canvas)
    const startAngle = config.arcMode ? (config.startAngle ?? 0) : 0;
    const endAngle = config.arcMode ? (config.endAngle ?? 360) : 360;
    const arcSpan = (endAngle - startAngle) * (Math.PI / 180);
    const isPartialArc =
      config.arcMode && Math.abs(endAngle - startAngle) < 360;

    const divisions = dataCount;
    const angleStep = arcSpan / divisions;
    const arcCenteringOffset = isPartialArc ? angleStep / 2 : 0;
    const startRad = startAngle * (Math.PI / 180) + angleOffset;

    for (let i = 0; i < dataCount; i++) {
      const value = data[i] || 0;
      const angle = startRad + arcCenteringOffset + i * angleStep;

      let radius = config.minRadius || 5;
      if (config.pulsingEffect) {
        radius += value * (config.maxRadius || baseRadius);
      } else {
        radius = baseRadius * (0.3 + value * 0.7);
      }

      const x = centerX + Math.cos(angle) * baseRadius;
      const y = centerY + Math.sin(angle) * baseRadius;
      const color = this.getColor(i, value, dataCount, config);

      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', radius.toString());

      if (config.fillStyle === 'outline') {
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', color);
        circle.setAttribute(
          'stroke-width',
          (config.strokeWidth || 2).toString()
        );
      } else {
        circle.setAttribute('fill', color);
      }

      g.appendChild(circle);
    }
  }

  private renderConcentricRingsSVG(
    g: SVGElement,
    data: number[],
    config: CircleVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const ringCount = Math.min(config.ringCount || 5, data.length);
    const maxRadius = config.maxRadius || 200;
    const minRadius = config.minRadius || 20;
    const radiusStep = (maxRadius - minRadius) / ringCount;

    for (let ring = 0; ring < ringCount; ring++) {
      const value = data[ring] || 0;
      let radius = minRadius + ring * radiusStep;

      if (config.pulsingEffect) {
        radius += value * radiusStep * 0.5;
      }

      const color = this.getColor(ring, value, ringCount, config);
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute('cx', centerX.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', radius.toString());

      if (config.fillStyle === 'outline') {
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', color);
        circle.setAttribute(
          'stroke-width',
          (config.strokeWidth || 3).toString()
        );
      } else {
        circle.setAttribute('fill', color);
        circle.setAttribute('fill-opacity', '0.7');
      }

      g.appendChild(circle);
    }
  }

  getDefaultConfig(): CircleVisualizationConfig {
    return {
      barCount: 32,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 150,
      responseSpeed: 0.8,
      colorMode: 'rainbow',
      primaryColor: '#00ff88',
      secondaryColor: '#0088ff',
      // legacy glowIntensity removed (appearance.outerGlow is the single source of truth)
      pulseMode: 'subtle',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      circleRadius: 100,
      pulsingEffect: true,
      concentricRings: false,
      ringCount: 5,
      fillStyle: 'solid',
      radiusMultiplier: 1,
      angleOffset: 0,
      maxRadius: 150,
      minRadius: 5,
      strokeWidth: 2,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const circleConfig = config as CircleVisualizationConfig;

    // Common base property validation
    if (config.barCount <= 0 || config.barCount > 256) {
      errors.push('barCount must be between 1 and 256');
    }

    if (config.maxHeight <= 0 || config.maxHeight > 1000) {
      errors.push('maxHeight must be between 1 and 1000');
    }

    if (config.responseSpeed < 0 || config.responseSpeed > 1) {
      errors.push('responseSpeed must be between 0 and 1');
    }

    // Circle-specific validation
    if (circleConfig.circleRadius <= 0 || circleConfig.circleRadius > 500) {
      errors.push('circleRadius must be between 1 and 500');
    }

    if (
      circleConfig.ringCount &&
      (circleConfig.ringCount <= 0 || circleConfig.ringCount > 20)
    ) {
      errors.push('ringCount must be between 1 and 20');
    }

    if (
      circleConfig.fillStyle &&
      !['solid', 'gradient', 'outline'].includes(circleConfig.fillStyle)
    ) {
      errors.push('fillStyle must be "solid", "gradient", or "outline"');
    }

    if (config.barCount > 64) {
      warnings.push('High circle count may impact performance');
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
      ...(warnings.length > 0 && { warnings }),
    };
  }

  getAnimatableProperties(): string[] {
    return [
      'circleRadius',
      'maxRadius',
      'minRadius',
      'rotation',
      'scale',
      'offsetX',
      'offsetY',
      // 'glowIntensity' removed from allowed keys (legacy)
      'angleOffset',
    ];
  }
}
