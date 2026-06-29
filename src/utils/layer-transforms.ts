import { Layer } from '../types/layer-types';

/**
 * Layer transformation utilities extracted from LayerItem.tsx
 * Provides geometric calculations, coordinate transformations, and
 * visual effect computations for layer rendering and manipulation.
 *
 * Performance optimized with memoization for heavy calculations.
 */

// Memoization cache for expensive calculations
const transformCache = new Map<string, string>();
const clipPathCache = new Map<string, string>();
const frequencyBinCache = new Map<
  string,
  { startBin: number; endBin: number; binCount: number }
>();

/**
 * Calculates the 2D transformation matrix for a layer (memoized)
 */
export const calculateTransformMatrix = (layer: Layer): string => {
  const { scale, rotation, offsetX, offsetY } = layer;

  // Create cache key for memoization
  const cacheKey = `${scale}-${rotation}-${offsetX}-${offsetY}`;

  // Check cache first
  if (transformCache.has(cacheKey)) {
    return transformCache.get(cacheKey)!;
  }

  let transform = '';

  // Apply translation first
  if (offsetX !== 0 || offsetY !== 0) {
    transform += `translate(${offsetX}px, ${offsetY}px) `;
  }

  // Apply scaling
  if (scale !== 1) {
    transform += `scale(${scale}) `;
  }

  // Apply rotation
  if (rotation !== 0) {
    transform += `rotate(${rotation}deg) `;
  }

  // Add hardware acceleration hint
  transform += 'translateZ(0)';

  const result = transform.trim();

  // Cache the result
  transformCache.set(cacheKey, result);

  return result;
};

/**
 * Calculates CSS filter string for image adjustments
 */
export const calculateImageFilters = (layer: Layer): string => {
  const filters: string[] = [];

  if (layer.brightness !== undefined && layer.brightness !== 1) {
    filters.push(`brightness(${layer.brightness})`);
  }

  if (layer.contrast !== undefined && layer.contrast !== 1) {
    filters.push(`contrast(${layer.contrast})`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
};

/**
 * Generates CSS gradient string from layer gradient configuration
 */
export const generateGradientString = (gradient: Layer['gradient']): string => {
  if (!gradient || gradient.colors.length < 2) {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Default fallback
  }

  const colorStops = gradient.colors
    .map((color, i) => {
      const stop =
        gradient.stops[i] || i / Math.max(gradient.colors.length - 1, 1);
      if (gradient.type === 'conic') {
        return `${color} ${stop * 360}deg`;
      } else {
        return `${color} ${stop * 100}%`;
      }
    })
    .join(', ');

  switch (gradient.type) {
    case 'radial':
      const centerX = gradient.centerX || 50;
      const centerY = gradient.centerY || 50;
      return `radial-gradient(circle at ${centerX}% ${centerY}%, ${colorStops})`;

    case 'conic':
      return `conic-gradient(from 0deg, ${colorStops})`;

    case 'linear':
    default:
      const angle = gradient.angle || 0;
      return `linear-gradient(${angle}deg, ${colorStops})`;
  }
};

/**
 * Calculates optimal preview size based on layer dimensions
 */
export const calculatePreviewSize = (
  layer: Layer,
  maxSize: number = 40
): { width: number; height: number } => {
  let width = maxSize;
  let height = maxSize;

  // Adjust based on shape-specific dimensions
  if (layer.shapeSpecific) {
    if (layer.shapeType === 'rectangle') {
      const shapeWidth = layer.shapeSpecific.width || 100;
      const shapeHeight = layer.shapeSpecific.height || 60;
      const aspectRatio = shapeWidth / shapeHeight;

      if (aspectRatio > 1) {
        // Wider than tall
        width = maxSize;
        height = maxSize / aspectRatio;
      } else {
        // Taller than wide
        width = maxSize * aspectRatio;
        height = maxSize;
      }
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Calculates bounding box for a layer considering transformations
 */
export const calculateBoundingBox = (
  layer: Layer,
  baseWidth: number,
  baseHeight: number
) => {
  const { scale, rotation, offsetX, offsetY } = layer;

  // Calculate scaled dimensions
  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  // For rotation, calculate the bounding rectangle
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));

  const rotatedWidth = scaledWidth * cos + scaledHeight * sin;
  const rotatedHeight = scaledWidth * sin + scaledHeight * cos;

  return {
    left: offsetX - rotatedWidth / 2,
    top: offsetY - rotatedHeight / 2,
    right: offsetX + rotatedWidth / 2,
    bottom: offsetY + rotatedHeight / 2,
    width: rotatedWidth,
    height: rotatedHeight,
  };
};

/**
 * Interpolates between two values with easing
 */
export const interpolateValue = (
  from: number,
  to: number,
  progress: number,
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' = 'linear'
): number => {
  // Apply easing function
  let easedProgress = progress;

  switch (easing) {
    case 'ease-in':
      easedProgress = progress * progress;
      break;
    case 'ease-out':
      easedProgress = 1 - Math.pow(1 - progress, 2);
      break;
    case 'ease-in-out':
      easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      break;
    case 'linear':
    default:
      easedProgress = progress;
  }

  return from + (to - from) * easedProgress;
};

/**
 * Calculates polar coordinates for circular layouts
 */
export const calculatePolarCoordinates = (
  index: number,
  total: number,
  radius: number,
  startAngle: number = 0,
  endAngle: number = 360
): { x: number; y: number; angle: number } => {
  const angleRange = endAngle - startAngle;
  const angleStep = angleRange / Math.max(total - 1, 1);
  const angle = startAngle + index * angleStep;
  const radians = (angle * Math.PI) / 180;

  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
    angle,
  };
};

/**
 * Calculates frequency bin mapping for audio visualization (memoized)
 */
export const calculateFrequencyBins = (
  frequencyRange: 'bass' | 'mid' | 'treble' | 'full',
  totalBins: number,
  sampleRate: number = 44100
): { startBin: number; endBin: number; binCount: number } => {
  // Create cache key for memoization
  const cacheKey = `${frequencyRange}-${totalBins}-${sampleRate}`;

  // Check cache first
  if (frequencyBinCache.has(cacheKey)) {
    return frequencyBinCache.get(cacheKey)!;
  }

  const nyquist = sampleRate / 2;

  let startFreq: number, endFreq: number;

  switch (frequencyRange) {
    case 'bass':
      startFreq = 20;
      endFreq = 250;
      break;
    case 'mid':
      startFreq = 250;
      endFreq = 4000;
      break;
    case 'treble':
      startFreq = 4000;
      endFreq = 20000;
      break;
    case 'full':
    default:
      startFreq = 20;
      endFreq = 20000;
  }

  const startBin = Math.floor((startFreq / nyquist) * totalBins);
  const endBin = Math.floor((endFreq / nyquist) * totalBins);

  const result = {
    startBin: Math.max(0, startBin),
    endBin: Math.min(totalBins - 1, endBin),
    binCount: Math.max(1, endBin - startBin),
  };

  // Cache the result
  frequencyBinCache.set(cacheKey, result);

  return result;
};

/**
 * Calculates CSS box-shadow for glow effects
 */
export const calculateGlowEffect = (
  glowIntensity: number,
  glowColor: string,
  baseSize: number = 4
): string => {
  if (glowIntensity <= 0) {
    return 'none';
  }

  const size = baseSize * glowIntensity;
  const opacity = glowIntensity * 0.8;

  return `0 0 ${size}px rgba(${hexToRgb(glowColor).join(', ')}, ${opacity})`;
};

/**
 * Converts hex color to RGB components
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);

  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

/**
 * Generates CSS clip-path for shape rendering (memoized)
 */
export const generateShapeClipPath = (layer: Layer): string => {
  if (!layer.shapeSpecific || !layer.shapeType) {
    return 'none';
  }

  // Create cache key for memoization
  const cacheKey = `${layer.shapeType}-${JSON.stringify(layer.shapeSpecific)}`;

  // Check cache first
  if (clipPathCache.has(cacheKey)) {
    return clipPathCache.get(cacheKey)!;
  }

  let result: string;

  switch (layer.shapeType) {
    case 'circle':
      const radius = layer.shapeSpecific.radius || 50;
      result = `circle(${radius}px)`;
      break;

    case 'rectangle':
      // Rectangle uses border-radius instead of clip-path
      result = 'none';
      break;

    case 'triangle':
      result = 'polygon(50% 0%, 0% 100%, 100% 100%)';
      break;

    case 'star':
      const points = layer.shapeSpecific.points || 5;
      const outerRadius = layer.shapeSpecific.outerRadius || 50;
      const innerRadius = layer.shapeSpecific.innerRadius || 25;

      // Generate star polygon points
      const starPoints: string[] = [];
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = 50 + (Math.cos(angle) * radius * 50) / 100;
        const y = 50 + (Math.sin(angle) * radius * 50) / 100;
        starPoints.push(`${x}% ${y}%`);
      }

      result = `polygon(${starPoints.join(', ')})`;
      break;

    case 'polygon':
      const sides = layer.shapeSpecific.sides || 6;
      const polygonRadius = layer.shapeSpecific.radius || 50;

      const polygonPoints: string[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; // Start from top
        const x = 50 + (Math.cos(angle) * polygonRadius * 50) / 100;
        const y = 50 + (Math.sin(angle) * polygonRadius * 50) / 100;
        polygonPoints.push(`${x}% ${y}%`);
      }

      result = `polygon(${polygonPoints.join(', ')})`;
      break;

    default:
      result = 'none';
  }

  // Cache the result
  clipPathCache.set(cacheKey, result);

  return result;
};

/**
 * Calculates animation keyframe values for layer properties
 */
export interface AnimationKeyframe {
  time: number; // 0-1
  opacity?: number;
  scale?: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
}

export const interpolateKeyframes = (
  keyframes: AnimationKeyframe[],
  currentTime: number
): Partial<Layer> => {
  if (keyframes.length === 0) {
    return {};
  }

  if (keyframes.length === 1 || currentTime <= 0) {
    return keyframes[0] || {};
  }

  if (currentTime >= 1) {
    return keyframes[keyframes.length - 1] || {};
  }

  // Find surrounding keyframes
  let fromFrame: AnimationKeyframe | undefined = keyframes[0];
  let toFrame: AnimationKeyframe | undefined = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    const currentKeyframe = keyframes[i];
    const nextKeyframe = keyframes[i + 1];
    if (
      currentKeyframe &&
      nextKeyframe &&
      currentTime >= currentKeyframe.time &&
      currentTime <= nextKeyframe.time
    ) {
      fromFrame = currentKeyframe;
      toFrame = nextKeyframe;
      break;
    }
  }

  // Calculate interpolation progress
  if (!fromFrame || !toFrame) {
    return {};
  }

  const duration = toFrame.time - fromFrame.time;
  const progress =
    duration === 0 ? 0 : (currentTime - fromFrame.time) / duration;

  const result: Partial<Layer> = {};

  // Interpolate each property
  if (fromFrame.opacity !== undefined && toFrame.opacity !== undefined) {
    result.opacity = interpolateValue(
      fromFrame.opacity,
      toFrame.opacity,
      progress
    );
  }

  if (fromFrame.scale !== undefined && toFrame.scale !== undefined) {
    result.scale = interpolateValue(fromFrame.scale, toFrame.scale, progress);
  }

  if (fromFrame.rotation !== undefined && toFrame.rotation !== undefined) {
    result.rotation = interpolateValue(
      fromFrame.rotation,
      toFrame.rotation,
      progress
    );
  }

  if (fromFrame.offsetX !== undefined && toFrame.offsetX !== undefined) {
    result.offsetX = interpolateValue(
      fromFrame.offsetX,
      toFrame.offsetX,
      progress
    );
  }

  if (fromFrame.offsetY !== undefined && toFrame.offsetY !== undefined) {
    result.offsetY = interpolateValue(
      fromFrame.offsetY,
      toFrame.offsetY,
      progress
    );
  }

  return result;
};

/**
 * Clears all memoization caches to prevent memory leaks
 * Should be called periodically or when memory usage is high
 */
export const clearTransformCaches = (): void => {
  transformCache.clear();
  clipPathCache.clear();
  frequencyBinCache.clear();
};

/**
 * Gets cache statistics for performance monitoring
 */
export const getCacheStats = () => {
  return {
    transformCacheSize: transformCache.size,
    clipPathCacheSize: clipPathCache.size,
    frequencyBinCacheSize: frequencyBinCache.size,
    totalCacheEntries:
      transformCache.size + clipPathCache.size + frequencyBinCache.size,
  };
};
