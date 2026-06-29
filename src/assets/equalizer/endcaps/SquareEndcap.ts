// @ts-nocheck
/**
 * SquareEndcap - Square/rectangular endcap implementation
 */

import {
  IEndcap,
  EndcapConfig,
  EndcapMetadata,
  EndcapRenderContext,
} from './IEndcap';

export interface SquareEndcapConfig extends EndcapConfig {
  cornerRadius?: number;
  aspectRatio?: number;
}

export class SquareEndcap extends IEndcap {
  readonly type = 'square';
  readonly metadata: EndcapMetadata = {
    name: 'Square Endcap',
    description: 'Rectangular endcap with optional rounded corners',
    supportsAnimation: false,
    supportsSVG: true,
  };

  renderTop(context: EndcapRenderContext, config: EndcapConfig): void {
    const squareConfig = config as SquareEndcapConfig;
    const { x, y, width, height } = context;

    if ('tagName' in context.ctx) {
      this.renderSVGEndcap(
        context.ctx as any,
        x,
        y,
        width,
        height,
        squareConfig,
        'top'
      );
    } else {
      this.renderCanvasEndcap(
        context.ctx as CanvasRenderingContext2D,
        x,
        y,
        width,
        height,
        squareConfig,
        'top'
      );
    }
  }

  renderBottom(context: EndcapRenderContext, config: EndcapConfig): void {
    const squareConfig = config as SquareEndcapConfig;
    const { x, y, width, height } = context;

    if ('tagName' in context.ctx) {
      this.renderSVGEndcap(
        context.ctx as any,
        x,
        y,
        width,
        height,
        squareConfig,
        'bottom'
      );
    } else {
      this.renderCanvasEndcap(
        context.ctx as CanvasRenderingContext2D,
        x,
        y,
        width,
        height,
        squareConfig,
        'bottom'
      );
    }
  }

  private renderSVGEndcap(
    svg: SVGElement,
    x: number,
    y: number,
    width: number,
    height: number,
    config: SquareEndcapConfig,
    position: 'top' | 'bottom'
  ): void {
    const aspectRatio = config.aspectRatio || 1;
    const endcapWidth = width;
    const endcapHeight = config.size * aspectRatio;

    const endcapX = x - endcapWidth / 2;
    const endcapY = position === 'top' ? y - endcapHeight : y;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', endcapX.toString());
    rect.setAttribute('y', endcapY.toString());
    rect.setAttribute('width', endcapWidth.toString());
    rect.setAttribute('height', endcapHeight.toString());

    // Apply corner radius if specified
    if (config.cornerRadius && config.cornerRadius > 0) {
      rect.setAttribute('rx', config.cornerRadius.toString());
      rect.setAttribute('ry', config.cornerRadius.toString());
    }

    // Apply styling
    rect.setAttribute('fill', config.color || '#ffffff');

    if (config.borderColor && config.borderWidth && config.borderWidth > 0) {
      rect.setAttribute('stroke', config.borderColor);
      rect.setAttribute('stroke-width', config.borderWidth.toString());
    }

    // Apply shadow effect if specified
    if (config.shadowColor && config.shadowBlur && config.shadowBlur > 0) {
      rect.style.filter = `drop-shadow(0 0 ${config.shadowBlur}px ${config.shadowColor})`;
    }

    svg.appendChild(rect);
  }

  private renderCanvasEndcap(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    config: SquareEndcapConfig,
    position: 'top' | 'bottom'
  ): void {
    const aspectRatio = config.aspectRatio || 1;
    const endcapWidth = width;
    const endcapHeight = config.size * aspectRatio;

    const endcapX = x - endcapWidth / 2;
    const endcapY = position === 'top' ? y - endcapHeight : y;

    ctx.save();

    // Apply shadow effect if specified
    if (config.shadowColor && config.shadowBlur && config.shadowBlur > 0) {
      ctx.shadowColor = config.shadowColor;
      ctx.shadowBlur = config.shadowBlur;
    }

    if (config.cornerRadius && config.cornerRadius > 0) {
      // Draw rounded rectangle
      this.drawRoundedRect(
        ctx,
        endcapX,
        endcapY,
        endcapWidth,
        endcapHeight,
        config.cornerRadius
      );
    } else {
      // Draw regular rectangle
      ctx.beginPath();
      ctx.rect(endcapX, endcapY, endcapWidth, endcapHeight);
    }

    // Fill the endcap
    ctx.fillStyle = config.color || '#ffffff';
    ctx.fill();

    // Add border if specified
    if (config.borderColor && config.borderWidth && config.borderWidth > 0) {
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  getDefaultConfig(): SquareEndcapConfig {
    return {
      size: 4,
      color: '#ffffff',
      cornerRadius: 0,
      aspectRatio: 1,
    };
  }

  validateConfig(config: EndcapConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const squareConfig = config as SquareEndcapConfig;

    if (config.size <= 0 || config.size > 50) {
      errors.push('size must be between 0.1 and 50');
    }

    if (
      squareConfig.cornerRadius &&
      (squareConfig.cornerRadius < 0 || squareConfig.cornerRadius > config.size)
    ) {
      errors.push('cornerRadius must be between 0 and size');
    }

    if (
      squareConfig.aspectRatio &&
      (squareConfig.aspectRatio <= 0 || squareConfig.aspectRatio > 10)
    ) {
      errors.push('aspectRatio must be between 0.1 and 10');
    }

    if (config.borderWidth && config.borderWidth < 0) {
      errors.push('borderWidth must be non-negative');
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
