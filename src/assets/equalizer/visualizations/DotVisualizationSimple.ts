/**
 * DotVisualization - Simplified dot matrix visualization (< 100 lines)
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

export interface DotVisualizationConfig extends VisualizationConfig {
  dotSize: number;
  gridColumns: number;
  gridRows: number;
  shape: 'circle' | 'square';
}

export class DotVisualization extends BaseVisualization {
  readonly type = 'dot';
  readonly metadata: VisualizationMetadata = {
    name: 'Dot Matrix',
    description: 'Grid-based dot visualization',
  };

  render(
    context: BaseRenderContext,
    frequencyData: FrequencyData,
    config: BaseVisualizationConfig
  ): void {
    const dotConfig = config as unknown as DotVisualizationConfig;
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
      this.renderDots(renderCtx, smoothedData, dotConfig);
    });
  }

  private renderDots(
    context: RenderContext,
    data: number[],
    config: DotVisualizationConfig
  ): void {
    VisualizationUtils.clearCanvas(
      context.context,
      context.width,
      context.height
    );

    const { gridColumns, gridRows, dotSize } = config;
    const cellWidth = context.width / gridColumns;
    const cellHeight = context.height / gridRows;

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridColumns; col++) {
        const dataIndex = (row * gridColumns + col) % data.length;
        const intensity = data[dataIndex] || 0;

        if (intensity > 0.1) {
          const x = col * cellWidth + cellWidth / 2;
          const y = row * cellHeight + cellHeight / 2;
          const size = dotSize * intensity;
          const color = this.getColor(
            dataIndex,
            intensity,
            data.length,
            config
          );

          this.drawDot(context.context, x, y, size, color, config.shape);
        }
      }
    }
  }

  private drawDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    shape: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();

    if (shape === 'circle') {
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(x - size / 2, y - size / 2, size, size);
    }

    ctx.fill();
  }

  getDefaultConfig(): DotVisualizationConfig {
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
      dotSize: 8,
      gridColumns: 8,
      gridRows: 6,
      shape: 'circle',
    };
  }

  getMetadata(): VisualizationMetadata {
    return { name: 'Dot Matrix', description: 'Grid-based dot visualization' };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors = VisualizationUtils.validateBaseConfig(config);
    const dotConfig = config as DotVisualizationConfig;

    if (dotConfig.dotSize <= 0 || dotConfig.dotSize > 50) {
      errors.push('dotSize must be between 1 and 50');
    }

    return VisualizationUtils.buildValidationResult(errors);
  }

  getAnimatableProperties(): string[] {
    return ['dotSize', 'gridColumns', 'gridRows'];
  }
}
