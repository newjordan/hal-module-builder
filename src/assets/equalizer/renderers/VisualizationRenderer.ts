/**
 * VisualizationRenderer - Unified rendering engine for all visualization types
 * Part of Story E6.3 - Rendering Engine & Integration
 *
 * Focused on:
 * - Unified Canvas/WebGL rendering pipeline
 * - Performance-optimized rendering context management
 * - Viewport management and clipping optimizations
 * - Render batching for multiple visualization elements
 */

import { AudioAnalyzer } from '../processors/AudioAnalyzer';
import { FrequencyProcessor } from '../processors/FrequencyProcessor';
import type {
  FrequencyData,
  IVisualization,
  RenderContext,
  VisualizationConfig,
} from '../visualizations/IVisualization';
import { RenderContextOptimizer } from './RenderContextOptimizer';
import { RenderPerformanceTracker } from './RenderPerformanceTracker';

import { applySymmetryTransform } from '../../../utils/equalizerSymmetry';

export interface VisualizationRenderConfig {
  enableWebGL?: boolean;
  adaptiveQuality?: boolean;
  maxFrameRate?: number;
  renderQueueSize?: number;
  enableProfiling?: boolean;
}

export interface RenderPerformanceMetrics {
  frameRate: number;
  renderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  queueLength: number;
}

export interface OptimizedRenderContext {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  time: number;
  theme: string;
  devicePixelRatio: number;
  isOffscreen: boolean;
  clipRegion?: { x: number; y: number; width: number; height: number };
}

/**
 * Unified rendering engine that orchestrates all visualization types
 * with performance optimizations and memory management
 */
export class VisualizationRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas?: OffscreenCanvas;
  private offscreenCtx?: OffscreenCanvasRenderingContext2D;
  private config: Required<VisualizationRenderConfig>;

  private performanceTracker: RenderPerformanceTracker;
  private contextOptimizer: RenderContextOptimizer;
  private isInitialized: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    config: VisualizationRenderConfig = {}
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = context;

    this.config = {
      enableWebGL: config.enableWebGL ?? false,
      adaptiveQuality: config.adaptiveQuality ?? true,
      maxFrameRate: config.maxFrameRate ?? 60,
      renderQueueSize: config.renderQueueSize ?? 3,
      enableProfiling: config.enableProfiling ?? false,
    };

    this.performanceTracker = new RenderPerformanceTracker();
    this.contextOptimizer = new RenderContextOptimizer();
    this.initializeRenderer();
  }

  /**
   * Initialize renderer with optimizations
   */
  private initializeRenderer(): void {
    // Setup offscreen canvas for performance - disabled to fix rendering issues
    // Direct rendering to main canvas ensures visibility
    // Note: Offscreen canvas was causing rendering visibility issues
    // Visualization would render successfully but produce no visible pixels
    // Direct rendering to main canvas ensures proper visibility

    // Configure rendering context for performance
    this.contextOptimizer.optimizeContext(this.ctx);
    if (this.offscreenCtx) {
      this.contextOptimizer.optimizeContext(this.offscreenCtx);
    }

    this.isInitialized = true;
  }

  /**
   * Render visualization with unified pipeline
   */
  render(
    visualization: IVisualization,
    audioAnalyzer: AudioAnalyzer,
    frequencyProcessor: FrequencyProcessor,
    config: VisualizationConfig
  ): RenderPerformanceMetrics {
    if (!this.isInitialized) {
      throw new Error('Renderer not initialized');
    }

    this.performanceTracker.startFrame();

    try {
      // Get audio data
      const audioData = audioAnalyzer.analyzeAudio();
      if (!audioData) {
        return this.performanceTracker.createEmptyMetrics();
      }
      // Process frequency data - Convert Uint8Array to number[] for FrequencyProcessor
      const frequencyArray = Array.from(audioData.frequencyData).map(
        value => value / 255.0
      );
      const frequencyResult = frequencyProcessor.mapFrequencyBands(
        frequencyArray,
        config.barCount,
        'logarithmic'
      );

      // Create optimized render context
      const canvas = this.offscreenCanvas || this.canvas;
      const ctx = this.offscreenCtx || this.ctx;

      const renderContext = this.contextOptimizer.createOptimizedContext(
        canvas,
        ctx,
        config
      );

      // Clear and prepare canvas
      this.contextOptimizer.prepareCanvas(renderContext);

      // Apply adaptive quality if enabled
      if (this.config.adaptiveQuality) {
        this.contextOptimizer.applyAdaptiveQuality(
          renderContext,
          this.config.maxFrameRate,
          this.performanceTracker.getAverageRenderTime()
        );
      }

      // Create compatible context for IVisualization interface
      const compatibleContext: RenderContext = {
        ctx: renderContext.ctx as CanvasRenderingContext2D,
        width: renderContext.width,
        height: renderContext.height,
        centerX: renderContext.centerX,
        centerY: renderContext.centerY,
        time: renderContext.time,
        theme: renderContext.theme as 'frost_light' | 'frost_dark',
      };

      // Apply symmetry at band-level (post-frequency mapping) to avoid scaling artifacts
      const symmetryMode = (config as any).symmetry ?? 'none';
      let bands = frequencyResult.bands;
      if (symmetryMode && symmetryMode !== 'none') {
        let arcClampDegrees: number | undefined = undefined;
        if ((config as any).arcMode) {
          const start = (config as any).startAngle ?? 0;
          const end = (config as any).endAngle ?? 360;
          const span = Math.abs(end - start);
          if (symmetryMode === 'mirror') {
            arcClampDegrees = span / 2;
          }
        }
        const smoothing = (config as any).symmetrySmoothing ?? {
          method: 'monotone',
          strength: 0.3,
          tension: 0.5,
          clamp: true,
        };
        bands = applySymmetryTransform(
          frequencyResult.bands,
          symmetryMode as any,
          arcClampDegrees,
          smoothing
        );
      }

      // Create proper FrequencyData object for visualization
      const frequencyData: FrequencyData = {
        raw: audioData.frequencyData,
        normalized: frequencyArray,
        bands,
        peaks: [], // TODO: Could add peak detection here if needed
      };

      // Render visualization with proper FrequencyData object
      visualization.render(compatibleContext, frequencyData, config);

      // Copy from offscreen if using it
      if (this.offscreenCanvas && this.offscreenCtx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
      }

      return this.performanceTracker.calculateMetrics();
    } catch (error) {
      console.error('Rendering error:', error);
      return this.performanceTracker.createEmptyMetrics();
    }
  }

  /**
   * Update renderer configuration
   */
  updateConfig(newConfig: Partial<VisualizationRenderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): RenderPerformanceMetrics {
    return this.performanceTracker.getMetrics();
  }

  /**
   * Reset performance tracking
   */
  resetMetrics(): void {
    this.performanceTracker.reset();
    this.contextOptimizer.reset();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.contextOptimizer.dispose();
    this.performanceTracker.reset();

    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = 0;
      this.offscreenCanvas.height = 0;
    }
  }
}
