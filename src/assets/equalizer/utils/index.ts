/**
 * Utils module exports
 * Part of Story E6.1 - Audio Processing Extraction
 */

export {
  AudioDataPool,
  linearToDecibels,
  decibelsToLinear,
  arrayLinearToDecibels,
  normalizeAudioLevels,
  validateAudioFormat,
  calculateRMS,
  calculatePeakLevel,
  createPerformanceLogger,
  type PoolStats,
  type DecibelConfig,
} from './audioUtils';
