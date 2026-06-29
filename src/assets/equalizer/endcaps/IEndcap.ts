/**
 * IEndcap - Base interface for bar endcap systems
 */

export interface EndcapConfig {
  size: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;

  // Endcap specific properties
  [key: string]: any;
}

export interface EndcapMetadata {
  name: string;
  description: string;
  supportsAnimation: boolean;
  supportsSVG: boolean;
}

export interface EndcapRenderContext {
  ctx: CanvasRenderingContext2D | SVGElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  theme: 'frost_light' | 'frost_dark';
}

export abstract class IEndcap {
  abstract readonly type: string;
  abstract readonly metadata: EndcapMetadata;

  /**
   * Render endcap at the top of a bar
   */
  abstract renderTop(context: EndcapRenderContext, config: EndcapConfig): void;

  /**
   * Render endcap at the bottom of a bar
   */
  abstract renderBottom(
    context: EndcapRenderContext,
    config: EndcapConfig
  ): void;

  /**
   * Get default configuration
   */
  abstract getDefaultConfig(): EndcapConfig;

  /**
   * Validate configuration
   */
  abstract validateConfig(config: EndcapConfig): {
    valid: boolean;
    errors?: string[];
  };

  /**
   * Check if endcap supports animation
   */
  supportsAnimation(): boolean {
    return this.metadata.supportsAnimation;
  }

  /**
   * Get available animation states (if supported)
   */
  getAnimationStates?(): string[];

  /**
   * Set animation state (if supported)
   */
  setAnimationState?(state: string): void;

  /**
   * Initialize resources
   */
  initialize?(context: EndcapRenderContext): void;

  /**
   * Clean up resources
   */
  dispose?(): void;
}
