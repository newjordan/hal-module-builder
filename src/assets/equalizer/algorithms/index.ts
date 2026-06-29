/**
 * Algorithms module exports
 * Part of Story E6.1 - Audio Processing Extraction
 */

export {
  generateWindow,
  applyWindow,
  calculateOptimalFFTSize,
  isPowerOfTwo,
  calculateFrequencyResolution,
  zeroPad,
  applyPreEmphasis,
  calculateOverlapParams,
  complexToMagnitude,
  magnitudeToDecibels,
  getRecommendedWindow,
  type WindowType,
  type FFTConfig,
  type WindowFunction,
} from './fftAlgorithms';

export {
  applyExponentialSmoothing,
  applyLinearSmoothing,
  applyAttackReleaseSmoothing,
  updatePeakTracking,
  applyGaussianSmoothing,
  applyMedianFilter,
  initializeSmoothingState,
  initializePeakTrackingState,
  calculateDynamicResponseSpeed,
  type SmoothingConfig,
  type PeakTrackingState,
  type SmoothingState,
} from './smoothingAlgorithms';
