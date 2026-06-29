/**
 * MathUtils - Mathematical operations and calculations
 * Provides optimized math functions for HAL Builder
 */

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation between two values
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * clamp(t, 0, 1);
};

/**
 * Map a value from one range to another
 */
export const mapRange = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number => {
  const t = (value - fromMin) / (fromMax - fromMin);
  return toMin + t * (toMax - toMin);
};

/**
 * Convert degrees to radians
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const radToDeg = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Fast Fourier Transform calculations for audio analysis
 */
export class FFTUtils {
  /**
   * Apply smoothing to audio data array
   */
  static smooth(
    current: number[],
    target: number[],
    smoothingFactor: number = 0.8
  ): number[] {
    return current.map(
      (value, i) =>
        value * (1 - smoothingFactor) + (target[i] || 0) * smoothingFactor
    );
  }

  /**
   * Get frequency bands from FFT data
   */
  static getFrequencyBands(data: number[], bands: number = 8): number[] {
    if (!Array.isArray(data) || data.length === 0 || bands <= 0) {
      return [];
    }

    const bandSize = Math.floor(data.length / bands);
    const result: number[] = [];

    for (let i = 0; i < bands; i++) {
      const start = i * bandSize;
      const end = Math.min(start + bandSize, data.length);
      let sum = 0;

      for (let j = start; j < end; j++) {
        sum += data[j] || 0;
      }

      const count = end - start;
      result.push(count > 0 ? sum / count : 0);
    }

    return result;
  }

  /**
   * Apply frequency range filtering
   */
  static filterFrequencyRange(
    data: number[],
    range: 'bass' | 'mid' | 'treble' | 'full'
  ): number[] {
    switch (range) {
      case 'bass':
        return data.slice(0, Math.floor(data.length * 0.3));
      case 'mid':
        return data.slice(
          Math.floor(data.length * 0.3),
          Math.floor(data.length * 0.7)
        );
      case 'treble':
        return data.slice(Math.floor(data.length * 0.7));
      case 'full':
      default:
        return data;
    }
  }
}

/**
 * Transform utilities for layer positioning
 */
export class TransformUtils {
  /**
   * Calculate 2D transformation matrix
   */
  static getTransformMatrix(
    scale: number,
    rotation: number,
    offsetX: number,
    offsetY: number
  ): string {
    return `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotate(${rotation}deg)`;
  }

  /**
   * Calculate polar coordinates
   */
  static toPolar(x: number, y: number): { r: number; theta: number } {
    const r = Math.sqrt(x * x + y * y);
    const theta = Math.atan2(y, x);
    return { r, theta };
  }

  /**
   * Calculate cartesian coordinates from polar
   */
  static toCartesian(r: number, theta: number): { x: number; y: number } {
    const normalizeZero = (value: number) => (Object.is(value, -0) ? 0 : value);
    const x = normalizeZero(r * Math.cos(theta));
    const y = normalizeZero(r * Math.sin(theta));
    return { x, y };
  }

  /**
   * Calculate points on a circle
   */
  static getCirclePoints(
    centerX: number,
    centerY: number,
    radius: number,
    count: number,
    startAngle: number = 0
  ): Array<{ x: number; y: number; angle: number }> {
    const points: Array<{ x: number; y: number; angle: number }> = [];
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y, angle });
    }

    return points;
  }
}

/**
 * Geometry utilities
 */
export class GeometryUtils {
  /**
   * Calculate distance between two points
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if point is inside circle
   */
  static isPointInCircle(
    px: number,
    py: number,
    cx: number,
    cy: number,
    radius: number
  ): boolean {
    return this.distance(px, py, cx, cy) <= radius;
  }

  /**
   * Calculate angle between two points
   */
  static angleBetweenPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /**
   * Normalize angle to 0-360 degrees
   */
  static normalizeAngle(angle: number): number {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }
}

/**
 * Animation utilities
 */
export class AnimationUtils {
  /**
   * Easing functions
   */
  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  static bounce(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  }

  /**
   * Calculate frame-rate independent movement
   */
  static frameIndependentLerp(
    current: number,
    target: number,
    rate: number,
    deltaTime: number
  ): number {
    return current + (target - current) * (1 - Math.exp(-rate * deltaTime));
  }

  /**
   * Create oscillation value
   */
  static oscillate(
    time: number,
    frequency: number = 1,
    amplitude: number = 1,
    offset: number = 0
  ): number {
    return Math.sin(time * frequency * 2 * Math.PI) * amplitude + offset;
  }
}

/**
 * Performance utilities
 */
export class PerformanceUtils {
  private static performanceMarks: Map<string, number> = new Map();

  /**
   * Start performance measurement
   */
  static startMeasure(name: string): void {
    this.performanceMarks.set(name, performance.now());
  }

  /**
   * End performance measurement and return duration
   */
  static endMeasure(name: string): number {
    const startTime = this.performanceMarks.get(name);
    if (!startTime) {
      console.warn(`Performance measure '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(name);
    return duration;
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = performance.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Calculate moving average
   */
  static movingAverage(values: number[], windowSize: number = 10): number {
    const window = values.slice(-windowSize);
    return window.reduce((sum, val) => sum + val, 0) / window.length;
  }
}

export default {
  clamp,
  lerp,
  mapRange,
  degToRad,
  radToDeg,
  FFTUtils,
  TransformUtils,
  GeometryUtils,
  AnimationUtils,
  PerformanceUtils,
};
