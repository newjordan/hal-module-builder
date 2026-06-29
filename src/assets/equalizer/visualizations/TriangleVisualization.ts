/**
 * TriangleVisualization - Triangle-shaped equalizer bars with pointed peaks
 * Part of Epic E6.2 - Visualization Types with Plugin Architecture
 *
 * Specialized for triangular rendering with various orientations and styles
 * Optimized for path rendering with smooth triangle shapes
 */

import {
  BaseVisualization,
  FrequencyData,
  RenderContext,
  ValidationResult,
  VisualizationConfig,
  VisualizationMetadata,
} from './BaseVisualization';

export interface TriangleVisualizationConfig extends VisualizationConfig {
  triangleSpacing: number;
  triangleOrientation: 'up' | 'down' | 'alternating';
  triangleStyle: 'filled' | 'outline' | 'both';
  baseWidth: number;
  peakSharpness: number; // 0-1, affects triangle point sharpness
  strokeWidth: number;
  strokeColor?: string;
  gradient?: boolean;
  gradientDirection: 'vertical' | 'horizontal' | 'radial';
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  outlineGlow?: boolean;
  alternateColors?: boolean;
}

export class TriangleVisualization extends BaseVisualization {
  readonly type = 'triangle';
  readonly metadata: VisualizationMetadata = {
    name: 'Triangle Peaks',
    description:
      'Sharp triangular peaks with customizable orientation and styling',
    author: 'HAL Builder',
    version: '1.0.0',
    tags: ['triangles', 'peaks', 'geometric', 'sharp'],
  };

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    if (!context?.ctx || !frequencyData?.bands) return;

    const triangleConfig = config as TriangleVisualizationConfig;

    // Initialize tracking arrays if needed
    if (this.previousValues.length !== config.barCount) {
      this.previousValues = new Array(config.barCount).fill(0);
    }

    // Apply smoothing
    const smoothedData = this.applySmoothing(frequencyData.bands, config);

    // Render based on context type
    if (context.ctx && 'tagName' in context.ctx) {
      this.renderSVG(context.ctx as any, smoothedData, triangleConfig, context);
    } else if (context.ctx) {
      this.renderCanvas(
        context.ctx as CanvasRenderingContext2D,
        smoothedData,
        triangleConfig,
        context
      );
    }
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    data: number[],
    config: TriangleVisualizationConfig,
    context: RenderContext
  ): void {
    ctx.save();

    const { centerX, centerY, width } = context;
    const triangleCount = Math.min(data.length, config.barCount);

    // Get the radial transform hook - use it if available regardless of config
    const radialTransform = (config as any).radialTransform;

    // Calculate dimensions
    const availableWidth = width * 0.8;
    const baseWidth =
      config.baseWidth ||
      Math.max(
        4,
        radialTransform
          ? 16
          : (availableWidth - (triangleCount - 1) * config.triangleSpacing) /
              triangleCount
      );
    const totalWidth = radialTransform
      ? 0
      : triangleCount * baseWidth +
        (triangleCount - 1) * config.triangleSpacing;
    const startX = radialTransform ? 0 : centerX - totalWidth / 2;

    // Set up effects
    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-element glow (config.glowIntensity/glowColor) is intentionally not used to avoid double application.

    if (config.shadow) {
      ctx.shadowColor = config.shadowColor || 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = config.shadowBlur || 8;
      ctx.shadowOffsetY = 3;
    }

    // Render triangles
    for (let i = 0; i < triangleCount; i++) {
      const value = Math.max(0, Math.min(1, data[i] || 0));
      const triangleHeight = Math.max(5, value * config.maxHeight);

      let x: number, centerXPos: number, baseY: number, peakY: number;
      let rotation = 0;

      if (radialTransform) {
        // Use radial positioning from the hook - ALWAYS use if available
        const position = radialTransform.transformPosition(i, triangleCount);
        x = position.x - baseWidth / 2;
        centerXPos = position.x;

        // For radial mode, position triangles outward from center
        const vector = radialTransform.getVector(
          position.angle,
          triangleHeight / 2
        );
        baseY = position.y - vector.dy;
        peakY = baseY - triangleHeight; // Always point outward

        // Use the orientation mode from the hook (respects user choice)
        if (radialTransform.getOrientation) {
          rotation = radialTransform.getOrientation(position);
        } else {
          rotation = position.angle + Math.PI / 2; // Fallback to current behavior
        }
      } else {
        // Linear positioning (original logic)
        x = startX + i * (baseWidth + config.triangleSpacing);
        centerXPos = x + baseWidth / 2;

        // Determine orientation
        let orientation = config.triangleOrientation;
        if (orientation === 'alternating') {
          orientation = i % 2 === 0 ? 'up' : 'down';
        }

        baseY =
          orientation === 'up'
            ? centerY + config.maxHeight / 2
            : centerY - config.maxHeight / 2;

        peakY =
          orientation === 'up'
            ? baseY - triangleHeight
            : baseY + triangleHeight;
      }

      // Calculate triangle points with sharpness adjustment
      const sharpnessFactor = 1 - (config.peakSharpness || 0.5);
      const adjustedWidth = baseWidth * (0.5 + sharpnessFactor * 0.5);

      const leftX = centerXPos - adjustedWidth / 2;
      const rightX = centerXPos + adjustedWidth / 2;

      // Get color
      const color =
        config.alternateColors && i % 2 === 1
          ? config.secondaryColor ||
            this.adjustBrightness(config.primaryColor, 30)
          : this.getColor(i, value, triangleCount, config);

      // Create gradient if enabled
      let fillStyle: string | CanvasGradient = color;
      if (config.gradient) {
        let gradient;
        switch (config.gradientDirection) {
          case 'horizontal':
            gradient = ctx.createLinearGradient(leftX, baseY, rightX, baseY);
            break;
          case 'radial':
            gradient = ctx.createRadialGradient(
              centerXPos,
              baseY,
              0,
              centerXPos,
              baseY,
              adjustedWidth / 2
            );
            break;
          case 'vertical':
          default:
            gradient = ctx.createLinearGradient(
              centerXPos,
              baseY,
              centerXPos,
              peakY
            );
            break;
        }

        gradient.addColorStop(0, color);
        gradient.addColorStop(
          1,
          config.secondaryColor || this.adjustBrightness(color, -40)
        );
        fillStyle = gradient;
      }

      // Save context for potential rotation
      ctx.save();

      if (!!radialTransform && rotation !== 0) {
        ctx.translate(centerXPos, baseY);
        ctx.rotate(rotation);
        ctx.translate(-centerXPos, -baseY);
      }

      // Draw triangle
      if (
        config.triangleStyle === 'filled' ||
        config.triangleStyle === 'both'
      ) {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(leftX, baseY);
        ctx.lineTo(rightX, baseY);
        ctx.lineTo(centerXPos, peakY);
        ctx.closePath();
        ctx.fill();
      }

      // Draw outline
      if (
        config.triangleStyle === 'outline' ||
        config.triangleStyle === 'both'
      ) {
        ctx.strokeStyle = config.strokeColor || color;
        ctx.lineWidth = config.strokeWidth || 2;

        if (config.outlineGlow) {
          ctx.shadowColor = config.strokeColor || color;
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.moveTo(leftX, baseY);
        ctx.lineTo(rightX, baseY);
        ctx.lineTo(centerXPos, peakY);
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore(); // Restore context after potential rotation
    }

    ctx.restore();
  }

  private renderSVG(
    svg: SVGElement,
    data: number[],
    config: TriangleVisualizationConfig,
    context: RenderContext
  ): void {
    // Clear existing elements
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const { centerX, centerY, width } = context;
    const triangleCount = Math.min(data.length, config.barCount);

    // Get the radial transform hook - use it if available regardless of config
    const radialTransform = (config as any).radialTransform;

    // Calculate dimensions
    const availableWidth = width * 0.8;
    const baseWidth =
      config.baseWidth ||
      Math.max(
        4,
        radialTransform
          ? 16
          : (availableWidth - (triangleCount - 1) * config.triangleSpacing) /
              triangleCount
      );
    const totalWidth = radialTransform
      ? 0
      : triangleCount * baseWidth +
        (triangleCount - 1) * config.triangleSpacing;
    const startX = radialTransform ? 0 : centerX - totalWidth / 2;

    // Add defs for gradients and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    if (config.shadow || config.outlineGlow) {
      const filter = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'filter'
      );
      filter.setAttribute('id', 'triangleEffects');

      if (config.shadow) {
        const shadow = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'feDropShadow'
        );
        shadow.setAttribute('dx', '0');
        shadow.setAttribute('dy', '3');
        shadow.setAttribute(
          'stdDeviation',
          (config.shadowBlur || 8).toString()
        );
        shadow.setAttribute(
          'flood-color',
          config.shadowColor || 'rgba(0,0,0,0.3)'
        );
        filter.appendChild(shadow);
      }

      if (config.outlineGlow) {
        const glow = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'feGaussianBlur'
        );
        glow.setAttribute('stdDeviation', '3');
        filter.appendChild(glow);
      }

      defs.appendChild(filter);
    }

    svg.appendChild(defs);

    // Render triangles
    for (let i = 0; i < triangleCount; i++) {
      const value = Math.max(0, Math.min(1, data[i] || 0));
      const triangleHeight = Math.max(5, value * config.maxHeight);

      let x: number, centerXPos: number, baseY: number, peakY: number;
      let rotation = 0;

      if (radialTransform) {
        // Use radial positioning from the hook - ALWAYS use if available
        const position = radialTransform.transformPosition(i, triangleCount);
        x = position.x - baseWidth / 2;
        centerXPos = position.x;

        // For radial mode, position triangles outward from center
        const vector = radialTransform.getVector(
          position.angle,
          triangleHeight / 2
        );
        baseY = position.y - vector.dy;
        peakY = baseY - triangleHeight; // Always point outward

        // Use the orientation mode from the hook (respects user choice)
        const orientationAngle = radialTransform.getOrientation
          ? radialTransform.getOrientation(position)
          : position.angle + Math.PI / 2; // Fallback to current behavior

        // Convert rotation to degrees for SVG
        rotation = (orientationAngle * 180) / Math.PI;
      } else {
        // Linear positioning (original logic)
        x = startX + i * (baseWidth + config.triangleSpacing);
        centerXPos = x + baseWidth / 2;

        // Determine orientation
        let orientation = config.triangleOrientation;
        if (orientation === 'alternating') {
          orientation = i % 2 === 0 ? 'up' : 'down';
        }

        baseY =
          orientation === 'up'
            ? centerY + config.maxHeight / 2
            : centerY - config.maxHeight / 2;

        peakY =
          orientation === 'up'
            ? baseY - triangleHeight
            : baseY + triangleHeight;
      }

      // Calculate triangle points
      const sharpnessFactor = 1 - (config.peakSharpness || 0.5);
      const adjustedWidth = baseWidth * (0.5 + sharpnessFactor * 0.5);

      const leftX = centerXPos - adjustedWidth / 2;
      const rightX = centerXPos + adjustedWidth / 2;

      const color =
        config.alternateColors && i % 2 === 1
          ? config.secondaryColor ||
            this.adjustBrightness(config.primaryColor, 30)
          : this.getColor(i, value, triangleCount, config);

      // Create triangle path
      const points = `${leftX},${baseY} ${rightX},${baseY} ${centerXPos},${peakY}`;

      if (
        config.triangleStyle === 'filled' ||
        config.triangleStyle === 'both'
      ) {
        const triangle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'polygon'
        );
        triangle.setAttribute('points', points);
        triangle.setAttribute('fill', color);

        if (!!radialTransform && rotation !== 0) {
          triangle.setAttribute(
            'transform',
            `rotate(${rotation} ${centerXPos} ${baseY})`
          );
        }

        if (config.shadow || config.outlineGlow) {
          triangle.setAttribute('filter', 'url(#triangleEffects)');
        }

        g.appendChild(triangle);
      }

      if (
        config.triangleStyle === 'outline' ||
        config.triangleStyle === 'both'
      ) {
        const outline = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'polygon'
        );
        outline.setAttribute('points', points);
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', config.strokeColor || color);
        outline.setAttribute(
          'stroke-width',
          (config.strokeWidth || 2).toString()
        );

        if (!!radialTransform && rotation !== 0) {
          outline.setAttribute(
            'transform',
            `rotate(${rotation} ${centerXPos} ${baseY})`
          );
        }

        g.appendChild(outline);
      }
    }

    svg.appendChild(g);
  }

  private adjustBrightness(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const r = Math.max(0, Math.min(255, rgb.r + amount));
    const g = Math.max(0, Math.min(255, rgb.g + amount));
    const b = Math.max(0, Math.min(255, rgb.b + amount));

    return `rgb(${r}, ${g}, ${b})`;
  }

  getDefaultConfig(): TriangleVisualizationConfig {
    return {
      barCount: 24,
      barWidth: 8,
      barSpacing: 2,
      maxHeight: 200,
      responseSpeed: 0.8,
      colorMode: 'gradient',
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      // legacy glowIntensity removed (appearance.outerGlow is the single source of truth)
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      triangleSpacing: 4,
      triangleOrientation: 'up',
      triangleStyle: 'filled',
      baseWidth: 16,
      peakSharpness: 0.7,
      strokeWidth: 2,
      gradient: true,
      gradientDirection: 'vertical',
      shadow: false,
      shadowBlur: 8,
      outlineGlow: false,
      alternateColors: false,
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.barCount <= 0 || config.barCount > 128) {
      errors.push('barCount must be between 1 and 128');
    }

    if (config.maxHeight <= 0 || config.maxHeight > 1000) {
      errors.push('maxHeight must be between 1 and 1000');
    }

    const triangleConfig = config as TriangleVisualizationConfig;

    if (triangleConfig.peakSharpness < 0 || triangleConfig.peakSharpness > 1) {
      errors.push('peakSharpness must be between 0 and 1');
    }

    if (triangleConfig.strokeWidth < 0 || triangleConfig.strokeWidth > 20) {
      errors.push('strokeWidth must be between 0 and 20');
    }

    if (triangleConfig.baseWidth <= 0 || triangleConfig.baseWidth > 200) {
      errors.push('baseWidth must be between 0.1 and 200');
    }

    if (
      !['up', 'down', 'alternating'].includes(
        triangleConfig.triangleOrientation
      )
    ) {
      errors.push('triangleOrientation must be "up", "down", or "alternating"');
    }

    if (!['filled', 'outline', 'both'].includes(triangleConfig.triangleStyle)) {
      errors.push('triangleStyle must be "filled", "outline", or "both"');
    }

    if (config.barCount > 64) {
      warnings.push('High triangle count may impact performance');
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
      ...(warnings.length > 0 && { warnings }),
    };
  }

  getAnimatableProperties(): string[] {
    return [
      'baseWidth',
      'maxHeight',
      'rotation',
      'scale',
      'offsetX',
      'offsetY',
      // 'glowIntensity' removed from allowed keys (legacy)
      'peakSharpness',
      'strokeWidth',
      'triangleSpacing',
    ];
  }
}
