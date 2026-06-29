// @ts-nocheck
/**
 * PointedEndcap - Triangle/pointed endcap implementation
 */

import {
  IEndcap,
  EndcapConfig,
  EndcapMetadata,
  EndcapRenderContext,
} from './IEndcap';

export interface PointedEndcapConfig extends EndcapConfig {
  angle?: number;
  sharpness?: 'sharp' | 'soft';
  asymmetric?: boolean;
}

export class PointedEndcap extends IEndcap {
  readonly type = 'pointed';
  readonly metadata: EndcapMetadata = {
    name: 'Pointed Endcap',
    description: 'Triangular pointed endcap with angle control',
    supportsAnimation: false,
    supportsSVG: true,
  };

  renderTop(context: EndcapRenderContext, config: EndcapConfig): void {
    const pointedConfig = config as PointedEndcapConfig;
    this.renderEndcap(context, pointedConfig, 'top');
  }

  renderBottom(context: EndcapRenderContext, config: EndcapConfig): void {
    const pointedConfig = config as PointedEndcapConfig;
    this.renderEndcap(context, pointedConfig, 'bottom');
  }

  private renderEndcap(
    context: EndcapRenderContext,
    config: PointedEndcapConfig,
    position: 'top' | 'bottom'
  ): void {
    const { x, y, width } = context;
    const _angle = config.angle || 60;
    const height = config.size;

    // Calculate triangle points
    const tipY = position === 'top' ? y - height : y + height;
    const baseY = y;
    const halfWidth = width / 2;

    const points = [
      { x: x, y: tipY }, // Tip
      { x: x - halfWidth, y: baseY }, // Base left
      { x: x + halfWidth, y: baseY }, // Base right
    ];

    if ('tagName' in context.ctx) {
      this.renderSVGTriangle(context.ctx as any, points, config);
    } else {
      this.renderCanvasTriangle(
        context.ctx as CanvasRenderingContext2D,
        points,
        config
      );
    }
  }

  private renderSVGTriangle(
    svg: SVGElement,
    points: Array<{ x: number; y: number }>,
    config: PointedEndcapConfig
  ): void {
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

    const polygon = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polygon'
    );
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', config.color || '#ffffff');

    if (config.borderColor && config.borderWidth && config.borderWidth > 0) {
      polygon.setAttribute('stroke', config.borderColor);
      polygon.setAttribute('stroke-width', config.borderWidth.toString());
    }

    if (config.sharpness === 'soft') {
      polygon.setAttribute('stroke-linejoin', 'round');
    }

    svg.appendChild(polygon);
  }

  private renderCanvasTriangle(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    config: PointedEndcapConfig
  ): void {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(points[2].x, points[2].y);
    ctx.closePath();

    if (config.sharpness === 'soft') {
      ctx.lineJoin = 'round';
    }

    ctx.fillStyle = config.color || '#ffffff';
    ctx.fill();

    if (config.borderColor && config.borderWidth && config.borderWidth > 0) {
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth;
      ctx.stroke();
    }

    ctx.restore();
  }

  getDefaultConfig(): PointedEndcapConfig {
    return {
      size: 6,
      color: '#ffffff',
      angle: 60,
      sharpness: 'sharp',
      asymmetric: false,
    };
  }

  validateConfig(config: EndcapConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const pointedConfig = config as PointedEndcapConfig;

    if (config.size <= 0 || config.size > 50) {
      errors.push('size must be between 0.1 and 50');
    }

    if (
      pointedConfig.angle &&
      (pointedConfig.angle <= 0 || pointedConfig.angle > 180)
    ) {
      errors.push('angle must be between 1 and 180 degrees');
    }

    if (
      pointedConfig.sharpness &&
      !['sharp', 'soft'].includes(pointedConfig.sharpness)
    ) {
      errors.push('sharpness must be either "sharp" or "soft"');
    }

    const result = {
      valid: errors.length === 0,
    } as { valid: boolean; errors?: string[] };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }
}
