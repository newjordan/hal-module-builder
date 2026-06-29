/**
 * DiamondVisualization - Diamond-shaped equalizer visualization
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

export interface DiamondVisualizationConfig extends VisualizationConfig {
  diamondSize: number;
  aspectRatio: number;
  rotationSpeed: number;
  clustering: boolean;
  nested: boolean;
  radialSizingMode?: 'flat' | 'depth';
}

export class DiamondVisualization extends BaseVisualization {
  readonly type = 'diamond';
  readonly metadata: VisualizationMetadata = {
    name: 'Diamond Shapes',
    description:
      'Diamond-shaped visualization with rotation and clustering effects',
    author: 'HAL Builder',
    version: '1.0.0',
    tags: ['geometric', 'diamonds', 'rotating'],
  };

  render(
    context: RenderContext,
    frequencyData: FrequencyData,
    config: VisualizationConfig
  ): void {
    if (!context?.ctx || !frequencyData?.bands) return;
    const diamondConfig = config as DiamondVisualizationConfig;

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
        diamondConfig,
        context
      );
      return;
    }

    // Render as canvas
    this.renderCanvas(
      context.ctx as CanvasRenderingContext2D,
      smoothedData,
      diamondConfig,
      context
    );
  }

  private renderSVG(
    svg: SVGElement,
    frequencyData: number[],
    config: DiamondVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY, time } = context;
    const diamondCount = Math.min(config.barCount, frequencyData.length);

    // Create radial configuration
    const radialConfig: RadialConfig = {
      centerX,
      centerY,
      innerRadius: config.innerRadius || 140,
      outerRadius: (config.innerRadius || 140) + config.maxHeight,
      startAngle: config.startAngle || 0,
      endAngle: config.endAngle || 360,
      arcMode: config.arcMode || false,
      invert: config.invert || false,
    };

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

    for (let i = 0; i < diamondCount; i++) {
      const value = frequencyData[i] || 0;

      // Use RadialTransformService for positioning
      const position = RadialTransformService.calculateRadialPosition(
        i,
        diamondCount,
        radialConfig
      );

      // Calculate actual radius with audio response
      const radius = radialConfig.innerRadius + value * config.maxHeight;

      // Apply the radius to the position
      const x = radialConfig.centerX + Math.cos(position.angle) * radius;
      const y = radialConfig.centerY + Math.sin(position.angle) * radius;

      const color = this.getColor(i, value, diamondCount, config);

      // Apply pulse scaling
      let pulseScale = 1;
      if (config.pulseMode === 'subtle') pulseScale = 1 + value * 0.1;
      else if (config.pulseMode === 'strong') pulseScale = 1 + value * 0.3;

      // Adjust diamond size based on radialSizingMode
      let baseDiamondSize = config.diamondSize || config.barWidth * 2;
      if (config.radialSizingMode === 'flat' && config.arcMode) {
        // In flat mode with arc, maintain consistent visual size along the arc
        const arcLength = position.segmentArcLength || 1;
        baseDiamondSize =
          baseDiamondSize * (arcLength / (2 * Math.PI * radius)) * radius;
      }

      const diamondSize = baseDiamondSize * pulseScale;
      const aspectRatio = config.aspectRatio || 1;
      const width = diamondSize;
      const height = diamondSize * aspectRatio;

      // Calculate rotation using radial orientation
      const baseRotation = config.rotation || 0;
      const timeRotation = (config.rotationSpeed || 0) * time * 0.1;
      const valueRotation = value * 45;
      // Use the tangent angle from radial position for proper orientation
      const radialRotation =
        (Math.atan2(position.tangent.y, position.tangent.x) * 180) / Math.PI;
      const totalRotation =
        radialRotation + baseRotation + timeRotation + valueRotation;

      // Create diamond points
      const points = [
        { x: x, y: y - height / 2 }, // Top
        { x: x + width / 2, y: y }, // Right
        { x: x, y: y + height / 2 }, // Bottom
        { x: x - width / 2, y: y }, // Left
      ];

      const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

      const diamond = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'polygon'
      );
      diamond.setAttribute('points', pointsStr);
      diamond.setAttribute('fill', color);
      diamond.setAttribute('stroke', color);
      diamond.setAttribute('stroke-width', '1');

      if (totalRotation !== 0) {
        diamond.setAttribute('transform', `rotate(${totalRotation} ${x} ${y})`);
      }

      g.appendChild(diamond);

      // Add nested diamonds if enabled
      if (config.nested && value > 0.3) {
        const nestedCount = Math.floor(value * 3) + 1;
        for (let n = 1; n < nestedCount; n++) {
          const nestedSize = diamondSize * (1 - n * 0.3);
          const nestedHeight = nestedSize * aspectRatio;

          const nestedPoints = [
            { x: x, y: y - nestedHeight / 2 },
            { x: x + nestedSize / 2, y: y },
            { x: x, y: y + nestedHeight / 2 },
            { x: x - nestedSize / 2, y: y },
          ];

          const nestedPointsStr = nestedPoints
            .map(p => `${p.x},${p.y}`)
            .join(' ');

          const nestedDiamond = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'polygon'
          );
          nestedDiamond.setAttribute('points', nestedPointsStr);
          nestedDiamond.setAttribute('fill', 'none');
          nestedDiamond.setAttribute('stroke', color);
          nestedDiamond.setAttribute('stroke-width', '2');
          nestedDiamond.setAttribute('opacity', (1 - n * 0.3).toString());

          if (totalRotation !== 0) {
            nestedDiamond.setAttribute(
              'transform',
              `rotate(${totalRotation + n * 15} ${x} ${y})`
            );
          }

          g.appendChild(nestedDiamond);
        }
      }

      // Add clustering effect if enabled
      if (config.clustering && value > 0.4) {
        const clusterCount = Math.floor(value * 2) + 1;
        for (let c = 1; c <= clusterCount; c++) {
          const clusterAngle = position.angle + (Math.random() - 0.5) * 0.5;
          const clusterRadius = radius + (Math.random() - 0.5) * 30;
          const clusterX = centerX + Math.cos(clusterAngle) * clusterRadius;
          const clusterY = centerY + Math.sin(clusterAngle) * clusterRadius;

          const clusterSize = diamondSize * 0.6;
          const clusterHeight = clusterSize * aspectRatio;

          const clusterPoints = [
            { x: clusterX, y: clusterY - clusterHeight / 2 },
            { x: clusterX + clusterSize / 2, y: clusterY },
            { x: clusterX, y: clusterY + clusterHeight / 2 },
            { x: clusterX - clusterSize / 2, y: clusterY },
          ];

          const clusterPointsStr = clusterPoints
            .map(p => `${p.x},${p.y}`)
            .join(' ');

          const clusterDiamond = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'polygon'
          );
          clusterDiamond.setAttribute('points', clusterPointsStr);
          clusterDiamond.setAttribute('fill', color);
          clusterDiamond.setAttribute('opacity', '0.6');

          g.appendChild(clusterDiamond);
        }
      }
    }

    svg.appendChild(g);
  }

  private renderCanvas(
    ctx: CanvasRenderingContext2D,
    frequencyData: number[],
    config: DiamondVisualizationConfig,
    context: RenderContext
  ): void {
    const { centerX, centerY, time } = context;
    const diamondCount = Math.min(config.barCount, frequencyData.length);

    // Create radial configuration
    const radialConfig: RadialConfig = {
      centerX,
      centerY,
      innerRadius: config.innerRadius || 140,
      outerRadius: (config.innerRadius || 140) + config.maxHeight,
      startAngle: config.startAngle || 0,
      endAngle: config.endAngle || 360,
      arcMode: config.arcMode || false,
      invert: config.invert || false,
    };

    ctx.save();
    ctx.translate(config.offsetX || 0, config.offsetY || 0);

    // Glow is applied at the container level via AppearancePanel -> EqualizerEngine (cssFilter)
    // Legacy per-element glow (config.glowIntensity/glowColor) is intentionally not used to avoid double application.

    for (let i = 0; i < diamondCount; i++) {
      const value = frequencyData[i] || 0;

      // Use RadialTransformService for positioning
      const position = RadialTransformService.calculateRadialPosition(
        i,
        diamondCount,
        radialConfig
      );

      // Calculate actual radius with audio response
      const radius = radialConfig.innerRadius + value * config.maxHeight;

      // Apply the radius to the position
      const x = radialConfig.centerX + Math.cos(position.angle) * radius;
      const y = radialConfig.centerY + Math.sin(position.angle) * radius;

      const color = this.getColor(i, value, diamondCount, config);

      // Apply pulse scaling
      let pulseScale = 1;
      if (config.pulseMode === 'subtle') pulseScale = 1 + value * 0.1;
      else if (config.pulseMode === 'strong') pulseScale = 1 + value * 0.3;

      // Adjust diamond size based on radialSizingMode
      let baseDiamondSize = config.diamondSize || config.barWidth * 2;
      if (config.radialSizingMode === 'flat' && config.arcMode) {
        // In flat mode with arc, maintain consistent visual size along the arc
        const arcLength = position.segmentArcLength || 1;
        baseDiamondSize =
          baseDiamondSize * (arcLength / (2 * Math.PI * radius)) * radius;
      }

      const diamondSize = baseDiamondSize * pulseScale;
      const aspectRatio = config.aspectRatio || 1;
      const width = diamondSize;
      const height = diamondSize * aspectRatio;

      // Calculate rotation using radial orientation
      const baseRotation = config.rotation || 0;
      const timeRotation = (config.rotationSpeed || 0) * time * 0.1;
      const valueRotation = value * 45;
      // Use the tangent angle from radial position for proper orientation
      const radialRotation = Math.atan2(position.tangent.y, position.tangent.x);
      const totalRotation =
        radialRotation +
        ((baseRotation + timeRotation + valueRotation) * Math.PI) / 180;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(totalRotation);

      // Draw main diamond
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(0, -height / 2); // Top
      ctx.lineTo(width / 2, 0); // Right
      ctx.lineTo(0, height / 2); // Bottom
      ctx.lineTo(-width / 2, 0); // Left
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw nested diamonds if enabled
      if (config.nested && value > 0.3) {
        const nestedCount = Math.floor(value * 3) + 1;
        for (let n = 1; n < nestedCount; n++) {
          const nestedSize = diamondSize * (1 - n * 0.3);
          const nestedHeight = nestedSize * aspectRatio;

          ctx.save();
          ctx.rotate((n * 15 * Math.PI) / 180);

          ctx.globalAlpha = 1 - n * 0.3;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.moveTo(0, -nestedHeight / 2);
          ctx.lineTo(nestedSize / 2, 0);
          ctx.lineTo(0, nestedHeight / 2);
          ctx.lineTo(-nestedSize / 2, 0);
          ctx.closePath();
          ctx.stroke();

          ctx.restore();
        }
      }

      ctx.restore();

      // Draw clustering effect if enabled
      if (config.clustering && value > 0.4) {
        ctx.globalAlpha = 0.6;
        const clusterCount = Math.floor(value * 2) + 1;

        for (let c = 1; c <= clusterCount; c++) {
          const clusterAngle = position.angle + (Math.random() - 0.5) * 0.5;
          const clusterRadius = radius + (Math.random() - 0.5) * 30;
          const clusterX = centerX + Math.cos(clusterAngle) * clusterRadius;
          const clusterY = centerY + Math.sin(clusterAngle) * clusterRadius;

          const clusterSize = diamondSize * 0.6;
          const clusterHeight = clusterSize * aspectRatio;

          ctx.save();
          ctx.translate(clusterX, clusterY);

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(0, -clusterHeight / 2);
          ctx.lineTo(clusterSize / 2, 0);
          ctx.lineTo(0, clusterHeight / 2);
          ctx.lineTo(-clusterSize / 2, 0);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }

        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  getDefaultConfig(): DiamondVisualizationConfig {
    return {
      barCount: 32,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 35,
      responseSpeed: 0.8,
      colorMode: 'rainbow',
      primaryColor: '#ff6b35',
      secondaryColor: '#f7931e',
      // legacy glowIntensity removed (appearance.outerGlow is the single source of truth)
      pulseMode: 'subtle',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      innerRadius: 120,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
      invert: false,
      diamondSize: 8,
      aspectRatio: 1.2,
      rotationSpeed: 1,
      clustering: false,
      nested: true,
      radialSizingMode: 'flat',
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const diamondConfig = config as DiamondVisualizationConfig;

    if (
      diamondConfig.diamondSize &&
      (diamondConfig.diamondSize <= 0 || diamondConfig.diamondSize > 50)
    ) {
      errors.push('diamondSize must be between 0.1 and 50');
    }

    if (
      diamondConfig.aspectRatio &&
      (diamondConfig.aspectRatio <= 0 || diamondConfig.aspectRatio > 5)
    ) {
      errors.push('aspectRatio must be between 0.1 and 5');
    }

    if (
      diamondConfig.rotationSpeed &&
      Math.abs(diamondConfig.rotationSpeed) > 10
    ) {
      warnings.push('High rotation speed may cause visual discomfort');
    }

    if (
      diamondConfig.clustering &&
      diamondConfig.nested &&
      config.barCount > 64
    ) {
      warnings.push(
        'Clustering with nested diamonds and high count may impact performance'
      );
    }

    if (
      diamondConfig.radialSizingMode &&
      !['flat', 'depth'].includes(diamondConfig.radialSizingMode)
    ) {
      errors.push('radialSizingMode must be "flat" or "depth"');
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
      'diamondSize',
      'aspectRatio',
      'rotationSpeed',
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
    return ['radial', 'grid', 'spiral'].includes(layout.type);
  }

  getLayoutHints(): any {
    return {
      preferredLayouts: ['radial', 'grid'],
      minElements: 8,
      maxElements: 128,
      supportsRotation: true,
      supportsScaling: true,
    };
  }
}
