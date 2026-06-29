/**
 * smoothingAlgorithms - Data smoothing and interpolation algorithms
 * Part of Story E6.1 - Audio Processing Extraction
 *
 * Focused on:
 * - Data smoothing and interpolation algorithms
 * - Exponential and linear smoothing
 * - Peak detection and decay algorithms
 * - Optimized for real-time performance
 * - Memory-efficient implementations
 */

export interface SmoothingConfig {
  responseSpeed: number;
  attackTime?: number;
  releaseTime?: number;
  peakHoldTime?: number;
  peakDecayRate?: number;
}

export interface PeakTrackingState {
  peakValues: number[];
  peakTimers: number[];
  lastUpdate: number;
}

export interface SmoothingState {
  previousValues: number[];
  smoothedValues: number[];
  initialized: boolean;
}

/**
 * Apply exponential smoothing to frequency data
 * Provides smooth transitions while maintaining responsiveness
 */
export function applyExponentialSmoothing(
  currentData: number[] | Uint8Array,
  previousSmoothed: number[],
  responseSpeed: number = 0.8
): number[] {
  if (responseSpeed < 0 || responseSpeed > 1) {
    throw new Error('Response speed must be between 0 and 1');
  }

  const result = new Array(currentData.length);
  const inverseResponse = 1 - responseSpeed;
  const isUint8Array = currentData instanceof Uint8Array;

  const normalizeValue = (value: number, treatAsUint8: boolean): number => {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (treatAsUint8 || value > 1) {
      return value / 255;
    }

    return value;
  };

  for (let i = 0; i < currentData.length; i++) {
    const currentValue = (currentData as any)[i];
    const numericCurrent =
      typeof currentValue === 'number' && Number.isFinite(currentValue)
        ? currentValue
        : 0;
    const normalizedCurrent = normalizeValue(numericCurrent, isUint8Array);

    if (i < previousSmoothed.length) {
      const previousValue = previousSmoothed[i];
      const numericPrevious =
        typeof previousValue === 'number' && Number.isFinite(previousValue)
          ? previousValue
          : 0;
      const normalizedPrevious = normalizeValue(numericPrevious, false);

      result[i] =
        normalizedPrevious * inverseResponse +
        normalizedCurrent * responseSpeed;
    } else {
      result[i] = normalizedCurrent;
    }
  }

  return result;
}

/**
 * Apply linear interpolation smoothing
 * Useful for filling gaps or smoothing sharp transitions
 */
export function applyLinearSmoothing(
  inputData: number[],
  windowSize: number = 3
): number[] {
  if (windowSize < 1) {
    throw new Error('Window size must be at least 1');
  }

  const result = new Array(inputData.length);
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < inputData.length; i++) {
    let sum = 0;
    let count = 0;

    const start = Math.max(0, i - halfWindow);
    const end = Math.min(inputData.length - 1, i + halfWindow);

    for (let j = start; j <= end; j++) {
      if (inputData[j] !== undefined) {
        sum += inputData[j]!;
        count++;
      }
    }

    result[i] = count > 0 ? sum / count : 0;
  }

  return result;
}

/**
 * Apply attack/release smoothing with different speeds for rising and falling values
 */
export function applyAttackReleaseSmoothing(
  currentData: number[],
  previousData: number[],
  attackSpeed: number = 0.9,
  releaseSpeed: number = 0.3
): number[] {
  if (
    attackSpeed < 0 ||
    attackSpeed > 1 ||
    releaseSpeed < 0 ||
    releaseSpeed > 1
  ) {
    throw new Error('Attack and release speeds must be between 0 and 1');
  }

  const result = new Array(currentData.length);

  for (let i = 0; i < currentData.length; i++) {
    const currentValue = currentData[i] || 0;
    // When there is no previous frame for this index, fall back to the current
    // value so the first frame passes through unattenuated instead of smoothing
    // up from zero.
    const previousValue =
      i < previousData.length ? previousData[i] || 0 : currentData[i] || 0;

    if (currentValue > previousValue) {
      // Attack: faster response to increasing values
      result[i] = previousValue + (currentValue - previousValue) * attackSpeed;
    } else {
      // Release: slower response to decreasing values
      result[i] = previousValue + (currentValue - previousValue) * releaseSpeed;
    }
  }

  return result;
}

/**
 * Update peak tracking state with decay
 */
export function updatePeakTracking(
  currentData: number[],
  peakState: PeakTrackingState,
  config: SmoothingConfig,
  currentTime: number = Date.now()
): void {
  const { peakHoldTime = 500, peakDecayRate = 0.02 } = config;

  // Ensure arrays are properly sized
  if (peakState.peakValues.length !== currentData.length) {
    peakState.peakValues = new Array(currentData.length).fill(0);
    peakState.peakTimers = new Array(currentData.length).fill(0);
  }

  for (let i = 0; i < currentData.length; i++) {
    const currentValue = currentData[i] || 0;

    if (currentValue > (peakState.peakValues[i] || 0)) {
      // New peak detected
      peakState.peakValues[i] = currentValue;
      peakState.peakTimers[i] = currentTime + peakHoldTime;
    } else if (currentTime > (peakState.peakTimers[i] || 0)) {
      // Peak hold time expired, apply decay
      peakState.peakValues[i] = Math.max(
        0,
        (peakState.peakValues[i] || 0) - peakDecayRate
      );
    }
  }

  peakState.lastUpdate = currentTime;
}

/**
 * Apply Gaussian smoothing for noise reduction
 */
export function applyGaussianSmoothing(
  inputData: number[],
  sigma: number = 1.0
): number[] {
  if (sigma <= 0) {
    throw new Error('Sigma must be greater than 0');
  }

  const kernelSize = Math.ceil(sigma * 6); // 6 sigma covers 99.7% of distribution
  const kernel = generateGaussianKernel(kernelSize, sigma);

  return applyConvolution(inputData, kernel);
}

/**
 * Generate Gaussian kernel for smoothing
 */
function generateGaussianKernel(size: number, sigma: number): number[] {
  const kernel = new Array(size);
  const center = Math.floor(size / 2);
  let sum = 0;

  // Generate kernel values
  for (let i = 0; i < size; i++) {
    const x = i - center;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }

  // Normalize kernel
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

/**
 * Apply convolution with given kernel
 */
function applyConvolution(inputData: number[], kernel: number[]): number[] {
  const result = new Array(inputData.length);
  const kernelCenter = Math.floor(kernel.length / 2);

  for (let i = 0; i < inputData.length; i++) {
    let sum = 0;
    let weightSum = 0;

    for (let j = 0; j < kernel.length; j++) {
      const inputIndex = i - kernelCenter + j;

      if (inputIndex >= 0 && inputIndex < inputData.length) {
        sum += (inputData[inputIndex] || 0) * (kernel[j] || 0);
        weightSum += kernel[j] || 0;
      }
    }

    result[i] = weightSum > 0 ? sum / weightSum : 0;
  }

  return result;
}

/**
 * Apply median filtering for spike removal
 */
export function applyMedianFilter(
  inputData: number[],
  windowSize: number = 3
): number[] {
  if (windowSize < 1) {
    throw new Error('Window size must be at least 1');
  }

  const result = new Array(inputData.length);
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < inputData.length; i++) {
    const window: number[] = [];

    const start = Math.max(0, i - halfWindow);
    const end = Math.min(inputData.length - 1, i + halfWindow);

    for (let j = start; j <= end; j++) {
      if (inputData[j] !== undefined) {
        window.push(inputData[j]!);
      }
    }

    if (window.length > 0) {
      window.sort((a, b) => a - b);
      const medianIndex = Math.floor(window.length / 2);
      result[i] = window[medianIndex];
    } else {
      result[i] = 0;
    }
  }

  return result;
}

/**
 * Initialize smoothing state for a given data size
 */
export function initializeSmoothingState(dataSize: number): SmoothingState {
  return {
    previousValues: new Array(dataSize).fill(0),
    smoothedValues: new Array(dataSize).fill(0),
    initialized: false,
  };
}

/**
 * Initialize peak tracking state for a given data size
 */
export function initializePeakTrackingState(
  dataSize: number
): PeakTrackingState {
  return {
    peakValues: new Array(dataSize).fill(0),
    peakTimers: new Array(dataSize).fill(0),
    lastUpdate: Date.now(),
  };
}

/**
 * Calculate dynamic response speed based on signal characteristics
 */
export function calculateDynamicResponseSpeed(
  currentData: number[],
  previousData: number[],
  baseResponseSpeed: number = 0.8,
  sensitivity: number = 0.5
): number {
  if (currentData.length === 0 || previousData.length === 0) {
    return baseResponseSpeed;
  }

  // Calculate average change in signal
  let totalChange = 0;
  let count = 0;

  for (let i = 0; i < Math.min(currentData.length, previousData.length); i++) {
    const change = Math.abs((currentData[i] || 0) - (previousData[i] || 0));
    totalChange += change;
    count++;
  }

  const averageChange = count > 0 ? totalChange / count : 0;

  // Increase response speed for rapid changes
  const dynamicFactor = 1 + averageChange * sensitivity;

  return Math.min(1, baseResponseSpeed * dynamicFactor);
}
