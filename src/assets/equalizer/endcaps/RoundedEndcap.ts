/**
 * RoundedEndcap - Circular/rounded endcap implementation
 */

import {
  IEndcap,
  EndcapConfig,
  EndcapMetadata,
  EndcapRenderContext,
} from './IEndcap';

export interface RoundedEndcapConfig extends EndcapConfig {
  radius?: number;
  fillStyle?: 'solid' | 'gradient';
}

export class RoundedEndcap extends IEndcap {
  readonly type = 'rounded';
  readonly metadata: EndcapMetadata = {
    name: 'Rounded Endcap',
    description: 'Circular endcap with anti-aliasing and gradient support',
    supportsAnimation: false,
    supportsSVG: true,
  };

  renderTop(context: EndcapRenderContext, config: EndcapConfig): void {
    const roundedConfig = config as RoundedEndcapConfig;
    const { x, y, width } = context;

    if ('tagName' in context.ctx) {
      this.renderSVGEndcap(
        context.ctx as any,
        x,
        y,
        width,
        roundedConfig,
        'top'
      );
    } else {
      this.renderCanvasEndcap(
        context.ctx as CanvasRenderingContext2D,
        x,
        y,
        width,
        roundedConfig,
        'top'
      );
    }
  }

  renderBottom(context: EndcapRenderContext, config: EndcapConfig): void {
    const roundedConfig = config as RoundedEndcapConfig;
    const { x, y, width } = context;

    if ('tagName' in context.ctx) {
      this.renderSVGEndcap(
        context.ctx as any,
        x,
        y,
        width,
        roundedConfig,
        'bottom'
      );
    } else {
      this.renderCanvasEndcap(
        context.ctx as CanvasRenderingContext2D,
        x,
        y,
        width,
        roundedConfig,
        'bottom'
      );
    }
  }

  private renderSVGEndcap(
    svg: SVGElement,
    x: number,
    y: number,
    _width: number,
    config: RoundedEndcapConfig,
    position: 'top' | 'bottom'
  ): void {
    const radius = config.radius || config.size;
    const centerY = position === 'top' ? y - radius : y + radius;

    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    circle.setAttribute('cx', x.toString());
    circle.setAttribute('cy', centerY.toString());
    circle.setAttribute('r', radius.toString());

    // Apply gradient fill if specified
    if (config.fillStyle === 'gradient') {
      const gradientId = `rounded-endcap-gradient-${Math.random().toString(36).substr(2, 9)}`;
      const defs =
        svg.querySelector('defs') ||
        document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      if (!svg.querySelector('defs')) svg.appendChild(defs);

      const radialGradient = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'radialGradient'
      );
      radialGradient.setAttribute('id', gradientId);

      const stop1 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'stop'
      );
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', config.color || '#ffffff');
      stop1.setAttribute('stop-opacity', '1');

      const stop2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'stop'
      );
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', config.color || '#ffffff');
      stop2.setAttribute('stop-opacity', '0.3');

      radialGradient.appendChild(stop1);
      radialGradient.appendChild(stop2);
      defs.appendChild(radialGradient);

      circle.setAttribute('fill', `url(#${gradientId})`);
    } else {
      circle.setAttribute('fill', config.color || '#ffffff');
    }

    // Add border if specified
    if (config.borderColor && config.borderWidth && config.borderWidth > 0) {
      circle.setAttribute('stroke', config.borderColor);
      circle.setAttribute('stroke-width', config.borderWidth.toString());
    }

    // Apply shadow effect if specified
    if (config.shadowColor && config.shadowBlur && config.shadowBlur > 0) {
      circle.style.filter = `drop-shadow(0 0 ${config.shadowBlur}px ${config.shadowColor})`;
    }

    svg.appendChild(circle);
  }

  private renderCanvasEndcap(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _width: number,
    config: RoundedEndcapConfig,
    position: 'top' | 'bottom'
  ): void {
    const radius = config.radius || config.size;
    const centerY = position === 'top' ? y - radius : y + radius;

    ctx.save();

    // Apply shadow effect if specified
    if (config.shadowColor && config.shadowBlur && config.shadowBlur > 0) {
      ctx.shadowColor = config.shadowColor;
      ctx.shadowBlur = config.shadowBlur;
    }

    ctx.beginPath();
    ctx.arc(x, centerY, radius, 0, Math.PI * 2);

    // Apply gradient fill if specified
    if (config.fillStyle === 'gradient') {
      const gradient = ctx.createRadialGradient(
        x,
        centerY,
        0,
        x,
        centerY,
        radius
      );
      gradient.addColorStop(0, config.color || '#ffffff');

      const transparentColor = (config.color || '#ffffff')
        .replace(')', ', 0.3)')
        .replace('rgb', 'rgba');
      gradient.addColorStop(1, transparentColor);

      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = config.color || '#ffffff';
    }

    ctx.fill();

    // Add border if specified
    if (config.borderColor && config.borderWidth && config.borderWidth > 0) {
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = config.borderWidth;
      ctx.stroke();
    }

    ctx.restore();
  }

  getDefaultConfig(): RoundedEndcapConfig {
    return {
      size: 4,
      color: '#ffffff',
      radius: 4,
      fillStyle: 'solid',
    };
  }

  validateConfig(config: EndcapConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    const roundedConfig = config as RoundedEndcapConfig;

    if (config.size <= 0 || config.size > 50) {
      errors.push('size must be between 0.1 and 50');
    }

    if (
      roundedConfig.radius &&
      (roundedConfig.radius <= 0 || roundedConfig.radius > 50)
    ) {
      errors.push('radius must be between 0.1 and 50');
    }

    if (
      roundedConfig.fillStyle &&
      !['solid', 'gradient'].includes(roundedConfig.fillStyle)
    ) {
      errors.push('fillStyle must be either "solid" or "gradient"');
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
