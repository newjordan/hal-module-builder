/**
 * LineVisualization - Simplified line/waveform visualization (< 150 lines)
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

export interface LineVisualizationConfig extends VisualizationConfig {
  lineThickness: number;
  amplitude: number;
  waveformStyle: 'continuous' | 'segmented';
}

export class LineVisualization extends BaseVisualization {
  readonly type = 'line';
  readonly metadata: VisualizationMetadata = {
    name: 'Waveform',
    description: 'Line-based waveform visualization',
  };

  render(
    context: BaseRenderContext,
    frequencyData: FrequencyData,
    config: BaseVisualizationConfig
  ): void {
    const lineConfig = config as unknown as LineVisualizationConfig;
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
      this.renderWaveform(renderCtx, smoothedData, lineConfig);
    });
  }

  private renderWaveform(
    context: RenderContext,
    data: number[],
    config: LineVisualizationConfig
  ): void {
    VisualizationUtils.clearCanvas(
      context.context,
      context.width,
      context.height
    );

    const ctx = context.context;
    const { width, centerY } = context;
    const { lineThickness, amplitude, waveformStyle } = config;

    ctx.lineWidth = lineThickness;
    ctx.beginPath();

    const stepX = width / data.length;

    for (let i = 0; i < data.length; i++) {
      const x = i * stepX;
      const value = data[i] ?? 0;
      const y = centerY - value * amplitude;
      const color = this.getColor(i, value, data.length, config);

      if (waveformStyle === 'segmented') {
        this.drawSegment(ctx, x, centerY, y, color);
      } else {
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }

    if (waveformStyle === 'continuous') {
      ctx.strokeStyle = config.primaryColor;
      ctx.stroke();
    }
  }

  private drawSegment(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    y: number,
    color: string
  ): void {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  getDefaultConfig(): LineVisualizationConfig {
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
      lineThickness: 2,
      amplitude: 100,
      waveformStyle: 'continuous',
    };
  }

  getMetadata(): VisualizationMetadata {
    return {
      name: 'Waveform',
      description: 'Line-based waveform visualization',
    };
  }

  validateConfig(config: VisualizationConfig): ValidationResult {
    const errors = VisualizationUtils.validateBaseConfig(config);
    const lineConfig = config as LineVisualizationConfig;

    if (lineConfig.lineThickness <= 0 || lineConfig.lineThickness > 20) {
      errors.push('lineThickness must be between 0.1 and 20');
    }

    if (lineConfig.amplitude <= 0 || lineConfig.amplitude > 500) {
      errors.push('amplitude must be between 1 and 500');
    }

    if (!['continuous', 'segmented'].includes(lineConfig.waveformStyle)) {
      errors.push('waveformStyle must be "continuous" or "segmented"');
    }

    return VisualizationUtils.buildValidationResult(errors);
  }

  getAnimatableProperties(): string[] {
    return ['lineThickness', 'amplitude', 'rotation'];
  }
}
