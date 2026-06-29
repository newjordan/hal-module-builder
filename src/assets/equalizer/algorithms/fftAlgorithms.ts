/**
 * fftAlgorithms - Pure FFT computation functions extracted from AudioProcessor
 * Part of Story E6.1 - Audio Processing Extraction
 *
 * Focused on:
 * - Pure FFT computation functions
 * - Windowing functions (Hamming, Blackman, Hanning, etc.)
 * - FFT size optimization algorithms
 * - Frequency resolution calculations
 * - Performance-optimized mathematical operations
 */

export type WindowType =
  | 'none'
  | 'hanning'
  | 'hamming'
  | 'blackman'
  | 'blackman-harris'
  | 'bartlett';

export interface FFTConfig {
  windowType: WindowType;
  overlapRatio: number;
  zeroPadding: boolean;
}

export interface WindowFunction {
  type: WindowType;
  coefficients: number[];
  gain: number;
  coherentGain: number;
}

/**
 * Generate windowing function coefficients
 * Reduces spectral leakage for better FFT accuracy
 */
export function generateWindow(
  size: number,
  type: WindowType = 'hanning'
): WindowFunction {
  const coefficients = new Array(size);
  let gain = 0;
  let coherentGain = 0;

  switch (type) {
    case 'none':
      for (let i = 0; i < size; i++) {
        coefficients[i] = 1.0;
      }
      gain = 1.0;
      coherentGain = 1.0;
      break;

    case 'hanning':
      for (let i = 0; i < size; i++) {
        coefficients[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
        gain += coefficients[i];
      }
      coherentGain = 0.5;
      break;

    case 'hamming':
      for (let i = 0; i < size; i++) {
        coefficients[i] =
          0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
        gain += coefficients[i];
      }
      coherentGain = 0.54;
      break;

    case 'blackman':
      for (let i = 0; i < size; i++) {
        coefficients[i] =
          0.42 -
          0.5 * Math.cos((2 * Math.PI * i) / (size - 1)) +
          0.08 * Math.cos((4 * Math.PI * i) / (size - 1));
        gain += coefficients[i];
      }
      coherentGain = 0.42;
      break;

    case 'blackman-harris':
      for (let i = 0; i < size; i++) {
        const t = i / (size - 1);
        coefficients[i] =
          0.35875 -
          0.48829 * Math.cos(2 * Math.PI * t) +
          0.14128 * Math.cos(4 * Math.PI * t) -
          0.01168 * Math.cos(6 * Math.PI * t);
        gain += coefficients[i];
      }
      coherentGain = 0.35875;
      break;

    case 'bartlett':
      for (let i = 0; i < size; i++) {
        coefficients[i] = 1 - Math.abs((2 * i - size + 1) / size);
        gain += coefficients[i];
      }
      coherentGain = 0.5;
      break;

    default:
      throw new Error(`Unsupported window type: ${type}`);
  }

  // Normalize gain
  gain = gain / size;

  return {
    type,
    coefficients,
    gain,
    coherentGain,
  };
}

/**
 * Apply windowing function to input data
 * Optimized for real-time performance
 */
export function applyWindow(
  inputData: number[] | Float32Array,
  windowFunction: WindowFunction
): Float32Array {
  const size = Math.min(inputData.length, windowFunction.coefficients.length);
  const result = new Float32Array(size);

  for (let i = 0; i < size; i++) {
    result[i] = (inputData[i] || 0) * (windowFunction.coefficients[i] || 0);
  }

  return result;
}

/**
 * Calculate optimal FFT size for given input size
 * Returns next power of 2 that's >= input size
 */
export function calculateOptimalFFTSize(
  inputSize: number,
  maxSize: number = 32768
): number {
  if (inputSize <= 0) {
    throw new Error('Input size must be greater than 0');
  }

  let fftSize = 32; // Minimum FFT size
  while (fftSize < inputSize && fftSize < maxSize) {
    fftSize *= 2;
  }

  return Math.min(fftSize, maxSize);
}

/**
 * Validate if size is power of 2 (required for efficient FFT)
 */
export function isPowerOfTwo(size: number): boolean {
  return size > 0 && (size & (size - 1)) === 0;
}

/**
 * Calculate frequency resolution for given FFT parameters
 */
export function calculateFrequencyResolution(
  sampleRate: number,
  fftSize: number
): {
  resolution: number;
  nyquistFrequency: number;
  binCount: number;
  frequencyPerBin: number;
} {
  if (sampleRate <= 0 || fftSize <= 0) {
    throw new Error('Sample rate and FFT size must be greater than 0');
  }

  const nyquistFrequency = sampleRate / 2;
  const binCount = fftSize / 2;
  const frequencyPerBin = nyquistFrequency / binCount;

  return {
    resolution: frequencyPerBin,
    nyquistFrequency,
    binCount,
    frequencyPerBin,
  };
}

/**
 * Zero-pad input data to specified size
 * Improves frequency resolution through interpolation
 */
export function zeroPad(
  inputData: number[] | Float32Array,
  targetSize: number
): Float32Array {
  if (targetSize < inputData.length) {
    throw new Error('Target size must be >= input data length');
  }

  const result = new Float32Array(targetSize);

  // Copy input data
  for (let i = 0; i < inputData.length; i++) {
    result[i] = inputData[i] || 0;
  }

  // Remaining elements are already zero (Float32Array default)
  return result;
}

/**
 * Pre-emphasis filter to balance spectral content
 * Useful for speech and music analysis
 */
export function applyPreEmphasis(
  inputData: number[] | Float32Array,
  coefficient: number = 0.97
): Float32Array {
  if (coefficient < 0 || coefficient > 1) {
    throw new Error('Pre-emphasis coefficient must be between 0 and 1');
  }

  const result = new Float32Array(inputData.length);

  if (inputData.length === 0) {
    return result;
  }

  result[0] = inputData[0] || 0;

  for (let i = 1; i < inputData.length; i++) {
    result[i] = (inputData[i] || 0) - coefficient * (inputData[i - 1] || 0);
  }

  return result;
}

/**
 * Calculate overlap-add parameters for sliding window FFT
 */
export function calculateOverlapParams(
  windowSize: number,
  overlapRatio: number = 0.5
): {
  hopSize: number;
  overlapSize: number;
  windowsNeeded: number;
} {
  if (overlapRatio < 0 || overlapRatio >= 1) {
    throw new Error('Overlap ratio must be between 0 and 1');
  }

  const hopSize = Math.floor(windowSize * (1 - overlapRatio));
  const overlapSize = windowSize - hopSize;
  const windowsNeeded = Math.ceil(windowSize / hopSize);

  return {
    hopSize,
    overlapSize,
    windowsNeeded,
  };
}

/**
 * Convert complex FFT output to magnitude spectrum
 * Handles both real and complex components
 */
export function complexToMagnitude(
  realPart: Float32Array,
  imagPart: Float32Array
): Float32Array {
  if (realPart.length !== imagPart.length) {
    throw new Error('Real and imaginary parts must have same length');
  }

  const magnitude = new Float32Array(realPart.length);

  for (let i = 0; i < realPart.length; i++) {
    const real = realPart[i] || 0;
    const imag = imagPart[i] || 0;
    magnitude[i] = Math.sqrt(real * real + imag * imag);
  }

  return magnitude;
}

/**
 * Convert magnitude spectrum to decibel scale
 * With optional reference level
 */
export function magnitudeToDecibels(
  magnitude: Float32Array,
  referenceLevel: number = 1.0,
  minDB: number = -120
): Float32Array {
  const result = new Float32Array(magnitude.length);
  const refSquared = referenceLevel * referenceLevel;

  for (let i = 0; i < magnitude.length; i++) {
    const mag = magnitude[i] || 0;
    const magSquared = mag * mag;

    if (magSquared > 0) {
      result[i] = Math.max(minDB, 10 * Math.log10(magSquared / refSquared));
    } else {
      result[i] = minDB;
    }
  }

  return result;
}

/**
 * Utility to get recommended window types for different use cases
 */
export function getRecommendedWindow(
  useCase: 'music' | 'speech' | 'measurement' | 'general'
): WindowType {
  switch (useCase) {
    case 'music':
      return 'blackman-harris'; // Better frequency resolution
    case 'speech':
      return 'hamming'; // Good balance for speech analysis
    case 'measurement':
      return 'hanning'; // Industry standard for measurements
    case 'general':
    default:
      return 'hanning'; // Good general purpose window
  }
}
