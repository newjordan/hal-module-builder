/**
 * HexagonVisualization - Hexagonal grid-based equalizer visualization
 */

import {
  BaseVisualization,
  FrequencyData,
  RenderContext,
  ValidationResult,
  VisualizationConfig,
  VisualizationMetadata,
} from './BaseVisualization';

export interface HexagonVisualizationConfig extends VisualizationConfig {
  hexSize: number;
  honeycombPattern: boolean;
  gridSpacing: number;
  hexRotation: number;
}

export class HexagonVisualization extends BaseVisualization {
  readonly type = 'hexagon';
  readonly metadata: VisualizationMetadata = {
    name: 'Hexagon Grid',
    description:
      'Hexagonal visualization with honeycomb patterns and grid layouts',
    author: 'HAL Builder',
    version: '1.0.0',
    tags: ['geometric', 'hexagon', 'grid', 'honeycomb'],
  };

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    if (!context?.ctx || !frequencyData?.bands) return;
    const hexConfig = config as HexagonVisualizationConfig;

    // Initialize tracking arrays if needed
    if (this.previousValues.length !== config.barCount) {
      this.previousValues = new Array(config.barCount).fill(0);
    }

    // Apply smoothing
    const smoothedData = this.applySmoothing(frequencyData.bands, config);

    if ('tagName' in context.ctx) {
      this.renderSVG(
        context.ctx as unknown as SVGElement,
        smoothedData,
        hexConfig,
        context
      );
      return;
    }

    // Render as canvas
    this.renderCanvas(
      context.ctx as CanvasRenderingContext2D,
      smoothedData,
      hexConfig,
      context
    );
  }

  private renderSVG(
    svg: SVGElement,
    frequencyData: number[],
    config: HexagonVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const hexCount = Math.min(config.barCount, frequencyData.length);

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute(
      'transform',
      `translate(${config.offsetX || 0}, ${config.offsetY || 0})`
    );

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-element SVG drop-shadow is intentionally not used here.

    for (let i = 0; i < hexCount; i++) {
      const value = frequencyData[i] || 0;
      const angle =
        (config.startAngle || 0) +
        (i / hexCount) * ((config.endAngle || 360) - (config.startAngle || 0));
      const angleRad = (angle * Math.PI) / 180 - Math.PI / 2;

      const baseRadius = config.innerRadius || 140;
      const radius = baseRadius + value * config.maxHeight;

      const x = centerX + Math.cos(angleRad) * radius;
      const y = centerY + Math.sin(angleRad) * radius;

      const color = this.getColor(i, value, hexCount, config);

      // Apply pulse scaling
      let pulseScale = 1;
      if (config.pulseMode === 'subtle') pulseScale = 1 + value * 0.1;
      else if (config.pulseMode === 'strong') pulseScale = 1 + value * 0.3;

      const hexSize = (config.hexSize || config.barWidth * 2) * pulseScale;

      // Create hexagon points
      const points = this.getHexagonPoints(
        x,
        y,
        hexSize,
        config.hexRotation || 0
      );
      const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

      const hexagon = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'polygon'
      );
      hexagon.setAttribute('points', pointsStr);
      hexagon.setAttribute('fill', color);
      hexagon.setAttribute('stroke', color);
      hexagon.setAttribute('stroke-width', '1');

      g.appendChild(hexagon);

      // Add honeycomb pattern if enabled
      if (config.honeycombPattern && value > 0.3) {
        // Create surrounding hexagons for honeycomb effect
        // For proper hexagon packing, center-to-center distance is 2 * hexSize (flat-topped)
        // or sqrt(3) * hexSize (pointy-topped, 30° rotated)
        // Since hexRotation can vary, use 2 * hexSize as the standard packing distance
        const honeycombRadius = hexSize * 2;
        const surroundingCount = 6;
        // Account for hexRotation: offset the honeycomb angles by the same rotation
        const hexRotationRad = ((config.hexRotation || 0) * Math.PI) / 180;

        for (let h = 0; h < surroundingCount; h++) {
          // 60° increments, offset by hexRotation for proper alignment
          const honeycombAngle = (h * 60 * Math.PI) / 180 + hexRotationRad;
          const honeycombX = x + Math.cos(honeycombAngle) * honeycombRadius;
          const honeycombY = y + Math.sin(honeycombAngle) * honeycombRadius;

          const honeycombPoints = this.getHexagonPoints(
            honeycombX,
            honeycombY,
            hexSize * 0.7,
            config.hexRotation || 0
          );
          const honeycombPointsStr = honeycombPoints
            .map(p => `${p.x},${p.y}`)
            .join(' ');

          const honeycombHex = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'polygon'
          );
          honeycombHex.setAttribute('points', honeycombPointsStr);
          honeycombHex.setAttribute('fill', 'none');
          honeycombHex.setAttribute('stroke', color);
          honeycombHex.setAttribute('stroke-width', '1');
          honeycombHex.setAttribute('opacity', '0.5');

          g.appendChild(honeycombHex);
        }
      }
    }

    svg.appendChild(g);
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    frequencyData: number[],
    config: HexagonVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY } = context;
    const hexCount = Math.min(config.barCount, frequencyData.length);

    ctx.save();
    ctx.translate(config.offsetX || 0, config.offsetY || 0);

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-element glow (config.glowIntensity/glowColor) is intentionally not used to avoid double application.

    for (let i = 0; i < hexCount; i++) {
      const value = frequencyData[i] || 0;
      const angle =
        (config.startAngle || 0) +
        (i / hexCount) * ((config.endAngle || 360) - (config.startAngle || 0));
      const angleRad = (angle * Math.PI) / 180 - Math.PI / 2;

      const baseRadius = config.innerRadius || 140;
      const radius = baseRadius + value * config.maxHeight;

      const x = centerX + Math.cos(angleRad) * radius;
      const y = centerY + Math.sin(angleRad) * radius;

      const color = this.getColor(i, value, hexCount, config);

      // Apply pulse scaling
      let pulseScale = 1;
      if (config.pulseMode === 'subtle') pulseScale = 1 + value * 0.1;
      else if (config.pulseMode === 'strong') pulseScale = 1 + value * 0.3;

      const hexSize = (config.hexSize || config.barWidth * 2) * pulseScale;

      // Draw main hexagon
      this.drawHexagon(
        ctx,
        x,
        y,
        hexSize,
        config.hexRotation || 0,
        color,
        true
      );

      // Add honeycomb pattern if enabled
      if (config.honeycombPattern && value > 0.3) {
        ctx.globalAlpha = 0.5;
        // For proper hexagon packing, use 2 * hexSize as center-to-center distance
        const honeycombRadius = hexSize * 2;
        const surroundingCount = 6;
        // Account for hexRotation: offset the honeycomb angles by the same rotation
        const hexRotationRad = ((config.hexRotation || 0) * Math.PI) / 180;

        for (let h = 0; h < surroundingCount; h++) {
          // 60° increments, offset by hexRotation for proper alignment
          const honeycombAngle = (h * 60 * Math.PI) / 180 + hexRotationRad;
          const honeycombX = x + Math.cos(honeycombAngle) * honeycombRadius;
          const honeycombY = y + Math.sin(honeycombAngle) * honeycombRadius;

          this.drawHexagon(
            ctx,
            honeycombX,
            honeycombY,
            hexSize * 0.7,
            config.hexRotation || 0,
            color,
            false
          );
        }

        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  private getHexagonPoints(
    centerX: number,
    centerY: number,
    size: number,
    rotation: number = 0
  ): Array<{ x: number; y: number }> {
    const points = [];
    const rotationRad = (rotation * Math.PI) / 180;

    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180 + rotationRad;
      const x = centerX + Math.cos(angle) * size;
      const y = centerY + Math.sin(angle) * size;
      points.push({ x, y });
    }

    return points;
  }

  private drawHexagon(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    rotation: number,
    color: string,
    filled: boolean
  ): void {
    const points = this.getHexagonPoints(centerX, centerY, size, rotation);

    ctx.beginPath();
    if (points.length === 0) return;
    ctx.moveTo(points[0]!.x, points[0]!.y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i]!.x, points[i]!.y);
    }

    ctx.closePath();

    if (filled) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  getDefaultConfig(): HexagonVisualizationConfig {
    return {
      barCount: 24,
      barWidth: 3,
      barSpacing: 2,
      maxHeight: 30,
      responseSpeed: 0.8,
      colorMode: 'custom-gradient',
      primaryColor: '#ff9500',
      secondaryColor: '#ffb143',
      customGradient: {
        colors: ['#ff9500', '#ffb143', '#ffc971', '#ffe135'],
        stops: [0, 0.33, 0.66, 1],
      },
      // legacy glowIntensity removed (appearance.outerGlow is the single source of truth)
      pulseMode: 'subtle',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      innerRadius: 130,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
      invert: false,
      hexSize: 12,
      honeycombPattern: false,
      gridSpacing: 2,
      hexRotation: 0,
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const hexConfig = config as HexagonVisualizationConfig;

    if (
      hexConfig.hexSize &&
      (hexConfig.hexSize <= 0 || hexConfig.hexSize > 50)
    ) {
      errors.push('hexSize must be between 0.1 and 50');
    }

    if (
      hexConfig.gridSpacing &&
      (hexConfig.gridSpacing < 0 || hexConfig.gridSpacing > 20)
    ) {
      errors.push('gridSpacing must be between 0 and 20');
    }

    if (
      hexConfig.hexRotation &&
      (hexConfig.hexRotation < -180 || hexConfig.hexRotation > 180)
    ) {
      warnings.push(
        'hexRotation should be between -180 and 180 degrees for optimal appearance'
      );
    }

    if (hexConfig.honeycombPattern && config.barCount > 32) {
      warnings.push(
        'Honeycomb pattern with high hexagon count may impact performance'
      );
    }

    const result = {
      valid: errors.length === 0,
    } as { valid: boolean; errors?: string[]; warnings?: string[] };

    if (errors.length > 0) {
      result.errors = errors;
    }
    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }

  getAnimatableProperties(): string[] {
    return [
      'hexSize',
      'hexRotation',
      'gridSpacing',
      'rotation',
      'scale',
      'offsetX',
      'offsetY',
      'innerRadius',
      'startAngle',
      'endAngle',
      // 'glowIntensity' removed from allowed keys (legacy)
    ];
  }

  supportsLayout(layout: any): boolean {
    return ['radial', 'grid', 'linear'].includes(layout.type);
  }

  getLayoutHints(): any {
    return {
      preferredLayouts: ['grid', 'radial'],
      minElements: 6,
      maxElements: 64,
      supportsRotation: true,
      supportsScaling: true,
    };
  }
}
