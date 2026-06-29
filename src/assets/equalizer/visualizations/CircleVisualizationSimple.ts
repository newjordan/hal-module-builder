/**
 * CircleVisualization - Simplified circular visualization (< 150 lines)
 * Refactored for line count compliance
 */

import {
  BaseVisualization,
  FrequencyData,
  RenderContext as BaseRenderContext,
  VisualizationConfig as BaseVisualizationConfig,
} from './BaseVisualization';
import {
  VisualizationConfig,
  VisualizationMetadata,
  ValidationResult,
  RenderContext,
} from './VisualizationTypes';
import { VisualizationUtils } from './VisualizationUtils';

export interface CircleVisualizationConfig extends VisualizationConfig {
  circleRadius: number;
  ringCount: number;
  fillStyle: 'solid' | 'gradient' | 'outline';
}

export class CircleVisualization extends BaseVisualization {
  readonly type = 'circle';
  readonly metadata: VisualizationMetadata = {
    name: 'Circle Rings',
    description: 'Concentric circle visualization',
  };

  render(
    context: BaseRenderContext,
    frequencyData: FrequencyData,
    config: BaseVisualizationConfig
  ): void {
    const circleConfig = config as unknown as CircleVisualizationConfig;
    const data = frequencyData.normalized;
    const smoothedData = this.applySmoothing(data, config);
    const renderCtx: RenderContext = {
      canvas: document.createElement('canvas'),
      context: context.ctx,
      width: context.width,
      height: context.height,
      centerX: context.centerX,
      centerY: context.centerY,
      theme: context.theme,
      timestamp: context.time,
    };

    this.measurePerformance(() => {
      this.renderCircles(renderCtx, smoothedData, circleConfig);
    });
  }

  private renderCircles(
    context: RenderContext,
    data: number[],
    config: CircleVisualizationConfig
  ): void {
    VisualizationUtils.clearCanvas(
      context.context,
      context.width,
      context.height
    );

    const { centerX, centerY } = context;
    const { circleRadius, ringCount } = config;
    const radiusStep = circleRadius / ringCount;

    for (let i = 0; i < Math.min(ringCount, data.length); i++) {
      const intensity = data[i] || 0;

      if (intensity > 0.1) {
        const radius = radiusStep * (i + 1) * intensity;
        const color = this.getColor(i, intensity, ringCount, config);

        this.drawCircle(
          context.context,
          centerX,
          centerY,
          radius,
          color,
          config.fillStyle
        );
      }
    }
  }

  private drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    fillStyle: string
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (fillStyle === 'outline') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  getDefaultConfig(): CircleVisualizationConfig {
    return {
      barCount: 32,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 200,
      responseSpeed: 0.8,
      colorMode: 'solid',
      primaryColor: '#3b82f6',
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      smoothing: 0.5,
      peakHold: false,
      peakHoldTime: 1000,
      peakDecay: 0.95,
      circleRadius: 100,
      ringCount: 8,
      fillStyle: 'solid',
    };
  }

  getMetadata(): VisualizationMetadata {
    return {
      name: 'Circle Rings',
      description: 'Concentric circle visualization',
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors = VisualizationUtils.validateBaseConfig(config);
    const circleConfig = config as CircleVisualizationConfig;

    if (circleConfig.circleRadius <= 0 || circleConfig.circleRadius > 500) {
      errors.push('circleRadius must be between 1 and 500');
    }

    if (circleConfig.ringCount <= 0 || circleConfig.ringCount > 20) {
      errors.push('ringCount must be between 1 and 20');
    }

    if (!['solid', 'gradient', 'outline'].includes(circleConfig.fillStyle)) {
      errors.push('fillStyle must be "solid", "gradient", or "outline"');
    }

    return VisualizationUtils.buildValidationResult(errors);
  }

  getAnimatableProperties(): string[] {
    return ['circleRadius', 'ringCount', 'rotation'];
  }
}
