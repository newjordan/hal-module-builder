/**
 * ILayout - Base interface for visualization layout systems
 */

export interface Position {
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Path {
  points: Position[];
  length: number;
  closed: boolean;
}

export interface LayoutConfig {
  // Common layout properties
  spacing: number;
  padding: number;
  alignment: 'start' | 'center' | 'end';
  distribution: 'equal' | 'proportional' | 'packed';

  // Layout specific properties
  [key: string]: any;
}

export interface LayoutMetadata {
  name: string;
  description: string;
  supports: {
    rotation: boolean;
    scaling: boolean;
    animation: boolean;
    responsive: boolean;
  };
}

export abstract class ILayout {
  abstract readonly type: string;
  abstract readonly metadata: LayoutMetadata;

  /**
   * Calculate positions for elements
   */
  abstract calculatePositions(
    elementCount: number,
    bounds: Rectangle,
    config: LayoutConfig
  ): Position[];

  /**
   * Get default configuration
   */
  abstract getDefaultConfig(): LayoutConfig;

  /**
   * Validate configuration
   */
  abstract validateConfig(config: LayoutConfig): {
    valid: boolean;
    errors?: string[];
  };

  /**
   * Get animation path for element at index
   */
  getAnimationPath?(index: number, config: LayoutConfig): Path;

  /**
   * Check if layout supports rotation
   */
  supportsRotation(): boolean {
    return this.metadata.supports.rotation;
  }

  /**
   * Check if layout supports scaling
   */
  supportsScaling(): boolean {
    return this.metadata.supports.scaling;
  }

  /**
   * Check if layout supports animation
   */
  supportsAnimation(): boolean {
    return this.metadata.supports.animation;
  }

  /**
   * Check if layout is responsive
   */
  isResponsive(): boolean {
    return this.metadata.supports.responsive;
  }
}
