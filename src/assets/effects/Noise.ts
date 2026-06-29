/**
 * Noise Effect Module
 * New effect for story 1.3d: Effects Asset System
 */

import {
  EffectMetadata,
  EffectParameters,
  EffectContext,
  ParameterDescriptor,
  BaseEffect,
  BlendMode,
  ComplexityLevel,
} from './IEffect';

export interface NoiseParameters extends EffectParameters {
  /** Noise algorithm type */
  type: 'perlin' | 'simplex' | 'random';
  /** Noise scale/frequency */
  scale: number;
  /** Number of octaves for fractal noise */
  octaves: number;
  /** Persistence between octaves */
  persistence: number;
  /** Lacunarity (frequency multiplier) */
  lacunarity: number;
  /** Seed for reproducible noise */
  seed: number;
  /** Color mapping mode */
  colorMode: 'grayscale' | 'colored' | 'transparent';
  /** Base color for colored mode */
  baseColor: string;
  /** Color variation for colored mode */
  colorVariation: number;
  /** Animation speed */
  animationSpeed: number;
  /** Common effect parameters */
  opacity?: number;
  intensity?: number;
  enabled?: boolean;
  blendMode?: BlendMode;
}

/**
 * Noise Effect Implementation
 * Generates various types of procedural noise patterns
 */
export class NoiseEffect extends BaseEffect {
  readonly metadata: EffectMetadata = {
    type: 'noise',
    displayName: 'Noise Generator',
    description:
      'Generates procedural noise patterns including Perlin, Simplex, and random noise',
    version: '1.0.0',
    author: 'HAL Builder',
    category: 'pattern',
    requiredFeatures: ['canvas-2d'],
  };

  readonly defaultParameters: NoiseParameters = {
    type: 'perlin',
    scale: 0.05,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    seed: 1234,
    colorMode: 'grayscale',
    baseColor: '#ffffff',
    colorVariation: 0.5,
    animationSpeed: 1.0,
    opacity: 1,
    intensity: 1,
    enabled: true,
    blendMode: 'normal',
  };

  private noiseCache: Map<string, Float32Array> = new Map();

  async process(
    input: ImageData | HTMLCanvasElement,
    parameters: NoiseParameters,
    context: EffectContext
  ): Promise<HTMLCanvasElement> {
    const { dimensions, time } = context;

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = dimensions.width;
    outputCanvas.height = dimensions.height;
    const outputCtx = outputCanvas.getContext('2d')!;

    // Apply input if provided
    if (input instanceof HTMLCanvasElement) {
      outputCtx.drawImage(input, 0, 0);
    } else if (input instanceof ImageData) {
      outputCtx.putImageData(input, 0, 0);
    }

    // Set rendering properties
    outputCtx.globalCompositeOperation = this.getCompositeOperation(
      parameters.blendMode || 'normal'
    ) as GlobalCompositeOperation;
    outputCtx.globalAlpha =
      (parameters.opacity || 1) * (parameters.intensity || 1);

    // Generate noise
    const noiseData = this.generateNoise(parameters, dimensions, time);

    // Create image data from noise
    const imageData = outputCtx.createImageData(
      dimensions.width,
      dimensions.height
    );
    this.applyNoiseToImageData(noiseData, imageData, parameters);

    // Apply with circular mask for HAL Builder compatibility
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCtx.putImageData(imageData, 0, 0);

    // Create circular mask
    outputCtx.save();
    outputCtx.beginPath();
    const radius = Math.min(dimensions.width, dimensions.height) / 2;
    outputCtx.arc(
      dimensions.width / 2,
      dimensions.height / 2,
      radius,
      0,
      2 * Math.PI
    );
    outputCtx.clip();

    outputCtx.drawImage(tempCanvas, 0, 0);
    outputCtx.restore();

    return outputCanvas;
  }

  getParameterDescriptors(): ParameterDescriptor[] {
    return [
      {
        key: 'type',
        displayName: 'Noise Type',
        type: 'select',
        defaultValue: 'perlin',
        options: [
          { value: 'perlin', label: 'Perlin Noise' },
          { value: 'simplex', label: 'Simplex Noise' },
          { value: 'random', label: 'Random Noise' },
        ],
        description: 'Algorithm for noise generation',
        animatable: false,
      },
      {
        key: 'scale',
        displayName: 'Scale',
        type: 'range',
        defaultValue: 0.05,
        min: 0.001,
        max: 0.5,
        step: 0.001,
        description: 'Noise frequency/scale',
        animatable: true,
      },
      {
        key: 'octaves',
        displayName: 'Octaves',
        type: 'number',
        defaultValue: 4,
        min: 1,
        max: 8,
        step: 1,
        description: 'Number of noise octaves for fractal patterns',
        animatable: false,
      },
      {
        key: 'persistence',
        displayName: 'Persistence',
        type: 'range',
        defaultValue: 0.5,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        description: 'Amplitude reduction between octaves',
        animatable: true,
      },
      {
        key: 'lacunarity',
        displayName: 'Lacunarity',
        type: 'range',
        defaultValue: 2.0,
        min: 1.0,
        max: 4.0,
        step: 0.1,
        description: 'Frequency multiplier between octaves',
        animatable: true,
      },
      {
        key: 'seed',
        displayName: 'Seed',
        type: 'number',
        defaultValue: 1234,
        min: 0,
        max: 999999,
        step: 1,
        description: 'Random seed for reproducible patterns',
        animatable: false,
      },
      {
        key: 'colorMode',
        displayName: 'Color Mode',
        type: 'select',
        defaultValue: 'grayscale',
        options: [
          { value: 'grayscale', label: 'Grayscale' },
          { value: 'colored', label: 'Colored' },
          { value: 'transparent', label: 'Transparent' },
        ],
        description: 'How to apply color to noise values',
        animatable: false,
      },
      {
        key: 'baseColor',
        displayName: 'Base Color',
        type: 'color',
        defaultValue: '#ffffff',
        description: 'Base color for colored noise mode',
        animatable: true,
      },
      {
        key: 'colorVariation',
        displayName: 'Color Variation',
        type: 'range',
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Amount of color variation in colored mode',
        animatable: true,
      },
      {
        key: 'animationSpeed',
        displayName: 'Animation Speed',
        type: 'range',
        defaultValue: 1.0,
        min: 0,
        max: 5.0,
        step: 0.1,
        description: 'Speed of noise animation',
        animatable: true,
      },
      {
        key: 'opacity',
        displayName: 'Opacity',
        type: 'range',
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        description: 'Overall opacity of the noise',
        animatable: true,
      },
      {
        key: 'intensity',
        displayName: 'Intensity',
        type: 'range',
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
        description: 'Noise intensity multiplier',
        animatable: true,
      },
    ];
  }

  override estimateComplexity(
    params: NoiseParameters,
    context: EffectContext
  ): ComplexityLevel {
    const { dimensions } = context;
    const pixelCount = dimensions.width * dimensions.height;
    const octaves = params.octaves || 4;

    // Noise generation is computationally expensive
    if (pixelCount > 200000 || octaves > 6) return 'extreme';
    if (pixelCount > 100000 || octaves > 4) return 'high';
    if (pixelCount > 50000 || octaves > 2) return 'medium';
    return 'low';
  }

  override canCache(params: NoiseParameters): boolean {
    // Can cache if not animated
    return (params.animationSpeed || 0) === 0;
  }

  override getSupportedBlendModes(): BlendMode[] {
    return [
      'normal',
      'multiply',
      'screen',
      'overlay',
      'soft-light',
      'hard-light',
      'difference',
      'exclusion',
    ];
  }

  /**
   * Generate noise data
   */
  private generateNoise(
    params: NoiseParameters,
    dimensions: { width: number; height: number },
    time: number
  ): Float32Array {
    const { width, height } = dimensions;
    const data = new Float32Array(width * height);

    const timeOffset = time * (params.animationSpeed || 0) * 0.001;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;

        let noiseValue = 0;
        let amplitude = 1;
        let frequency = params.scale || 0.05;

        for (let octave = 0; octave < (params.octaves || 4); octave++) {
          const sampleX = x * frequency;
          const sampleY = y * frequency;
          const sampleZ = timeOffset * frequency;

          let octaveValue: number;
          switch (params.type) {
            case 'perlin':
              octaveValue = this.perlinNoise3D(
                sampleX,
                sampleY,
                sampleZ,
                params.seed || 0
              );
              break;
            case 'simplex':
              octaveValue = this.simplexNoise3D(sampleX, sampleY, sampleZ);
              break;
            case 'random':
            default:
              octaveValue = this.randomNoise(
                sampleX,
                sampleY,
                sampleZ,
                params.seed || 0
              );
              break;
          }

          noiseValue += octaveValue * amplitude;
          amplitude *= params.persistence || 0.5;
          frequency *= params.lacunarity || 2.0;
        }

        // Normalize to 0-1 range
        data[index] = (noiseValue + 1) * 0.5;
      }
    }

    return data;
  }

  /**
   * Apply noise data to ImageData with color mapping
   */
  private applyNoiseToImageData(
    noiseData: Float32Array,
    imageData: ImageData,
    params: NoiseParameters
  ): void {
    const data = imageData.data;
    const baseColor = this.hexToRgb(params.baseColor || '#ffffff');

    for (let i = 0; i < noiseData.length; i++) {
      const noiseValue = Math.max(0, Math.min(1, noiseData[i] ?? 0));
      const pixelIndex = i * 4;

      switch (params.colorMode) {
        case 'grayscale': {
          const gray = Math.round(noiseValue * 255);
          data[pixelIndex] = gray; // R
          data[pixelIndex + 1] = gray; // G
          data[pixelIndex + 2] = gray; // B
          data[pixelIndex + 3] = 255; // A
          break;
        }

        case 'colored': {
          const variation = params.colorVariation || 0.5;
          const r = Math.round(
            baseColor.r * (1 - variation + noiseValue * variation)
          );
          const g = Math.round(
            baseColor.g * (1 - variation + noiseValue * variation)
          );
          const b = Math.round(
            baseColor.b * (1 - variation + noiseValue * variation)
          );

          data[pixelIndex] = r;
          data[pixelIndex + 1] = g;
          data[pixelIndex + 2] = b;
          data[pixelIndex + 3] = 255;
          break;
        }

        case 'transparent': {
          data[pixelIndex] = baseColor.r;
          data[pixelIndex + 1] = baseColor.g;
          data[pixelIndex + 2] = baseColor.b;
          data[pixelIndex + 3] = Math.round(noiseValue * 255);
          break;
        }
      }
    }
  }

  /**
   * Simple Perlin noise implementation (3D)
   */
  private perlinNoise3D(x: number, y: number, z: number, seed: number): number {
    // Simple hash-based pseudo-random implementation
    const hash = (n: number) => {
      n = Math.sin(n + seed) * 43758.5453;
      return n - Math.floor(n);
    };

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a: number, b: number, t: number) => a + t * (b - a);

    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = fade(x);
    const v = fade(y);
    const w = fade(z);

    const A = hash(X) + Y;
    const AA = hash(A) + Z;
    const AB = hash(A + 1) + Z;
    const B = hash(X + 1) + Y;
    const BA = hash(B) + Z;
    const BB = hash(B + 1) + Z;

    return lerp(
      w,
      lerp(v, lerp(u, hash(AA), hash(BA)), lerp(u, hash(AB), hash(BB))),
      lerp(
        v,
        lerp(u, hash(AA + 1), hash(BA + 1)),
        lerp(u, hash(AB + 1), hash(BB + 1))
      )
    );
  }

  /**
   * Simplified Simplex noise implementation
   */
  private simplexNoise3D(x: number, y: number, z: number): number {
    // This is a simplified version - full simplex noise is quite complex
    // For now, use a modified Perlin-style approach
    return this.perlinNoise3D(x * 1.73205, y * 1.73205, z * 1.73205, 12345);
  }

  /**
   * Random noise implementation
   */
  private randomNoise(x: number, y: number, z: number, seed: number): number {
    const combined = x * 73.0 + y * 137.0 + z * 241.0 + seed;
    const hash = Math.sin(combined) * 43758.5453;
    return (hash - Math.floor(hash)) * 2 - 1;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1] ?? 'ff', 16),
          g: parseInt(result[2] ?? 'ff', 16),
          b: parseInt(result[3] ?? 'ff', 16),
        }
      : { r: 255, g: 255, b: 255 };
  }

  /**
   * Convert blend mode to canvas composite operation
   */
  private getCompositeOperation(blendMode: BlendMode): string {
    const blendModeMap: Record<BlendMode, string> = {
      normal: 'source-over',
      multiply: 'multiply',
      screen: 'screen',
      overlay: 'overlay',
      'soft-light': 'soft-light',
      'hard-light': 'hard-light',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      darken: 'darken',
      lighten: 'lighten',
      difference: 'difference',
      exclusion: 'exclusion',
      hue: 'hue',
      saturation: 'saturation',
      color: 'color',
      luminosity: 'luminosity',
    };

    return blendModeMap[blendMode] || 'source-over';
  }

  override dispose(): void {
    this.noiseCache.clear();
  }
}

/**
 * Factory function to create noise effect instances
 */
export function createNoiseEffect(): NoiseEffect {
  return new NoiseEffect();
}
