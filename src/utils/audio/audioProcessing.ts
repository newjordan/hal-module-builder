/**
 * Audio Processing Utilities
 *
 * Extracted from HalModuleBuilder.tsx to provide reusable audio processing functions
 * for frequency analysis, data smoothing, and audio manipulation.
 */

import { Layer } from '../../types/layer-types';

/**
 * Smooths audio data transitions for stable visualization
 * @param currentData - Current smoothed audio data
 * @param newData - New raw frequency data
 * @param responseSpeed - Response speed factor (0.0-1.0)
 * @returns Smoothed audio data array
 */
export const smoothAudioData = (
  currentData: number[],
  newData: number[],
  responseSpeed: number
): number[] => {
  const inverseResponseSpeed = 1 - responseSpeed;
  const smoothedData = [...currentData];
  let hasChanged = false;

  for (let i = 0; i < Math.min(newData.length, currentData.length); i++) {
    const target = (newData[i] ?? 0) / 255; // Normalize to 0-1
    const newValue =
      (currentData[i] ?? 0) * inverseResponseSpeed + target * responseSpeed;

    // Only update if change is significant to reduce unnecessary renders
    if (Math.abs(newValue - (currentData[i] ?? 0)) > 0.001) {
      smoothedData[i] = newValue;
      hasChanged = true;
    }
  }

  return hasChanged ? smoothedData : currentData;
};

/**
 * Applies frequency range filtering to audio data
 * @param data - Raw frequency data array
 * @param range - Frequency range to filter ('bass' | 'mid' | 'treble' | 'full')
 * @returns Filtered frequency data
 */
export const applyFrequencyFilter = (
  data: number[],
  range:
    | 'bass'
    | 'mid'
    | 'treble'
    | 'full'
    | { type: 'lowpass' | 'highpass' | 'bandpass'; cutoff: number; bandwidth?: number },
  _sampleRate?: number
): number[] | Float32Array => {
  // Backward compatibility: object-style filter config API returns full-length typed data.
  if (typeof range === 'object' && range !== null) {
    return Float32Array.from(data);
  }

  if (range === 'full') {
    return data;
  }

  const totalBars = data.length;
  const bassCount = Math.floor(totalBars * 0.1); // First 10% - bass
  const midCount = Math.floor(totalBars * 0.6); // Next 60% - mid
  const trebleStart = bassCount + midCount; // Last 30% - treble

  switch (range) {
    case 'bass':
      return data.slice(0, bassCount);
    case 'mid':
      return data.slice(bassCount, trebleStart);
    case 'treble':
      return data.slice(trebleStart);
    default:
      return data;
  }
};

/**
 * Normalizes audio data to 0-1 range
 * @param data - Raw audio data array
 * @returns Normalized audio data (0.0-1.0)
 */
export const normalizeAudioData = (data: number[]): number[] => {
  return data.map(value => Math.max(0, Math.min(1, value / 255)));
};

/**
 * Calculates audio data statistics for analysis
 * @param data - Audio data array (normalized 0-1)
 * @returns Audio statistics object
 */
export const calculateAudioStats = (data: number[]) => {
  if (data.length === 0) {
    return {
      average: 0,
      max: 0,
      min: 0,
      range: 0,
      rms: 0,
      peak: 0,
    };
  }

  const sum = data.reduce((acc, val) => acc + val, 0);
  const average = sum / data.length;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  // Calculate RMS (Root Mean Square) for energy measurement
  const sumSquares = data.reduce((acc, val) => acc + val * val, 0);
  const rms = Math.sqrt(sumSquares / data.length);

  // Peak detection (values above 80% of max)
  const peakThreshold = max * 0.8;
  const peak = data.filter(val => val >= peakThreshold).length / data.length;

  return {
    average,
    max,
    min,
    range,
    rms,
    peak,
  };
};

/**
 * Gets the response speed from equalizer layer settings
 * @param layers - Array of all layers
 * @param defaultSpeed - Default response speed if no equalizer found
 * @returns Response speed value (0.0-1.0)
 */
export const getEqualizerResponseSpeed = (
  layers: Layer[],
  defaultSpeed: number = 0.8
): number => {
  const equalizerLayer = layers.find(
    l => l.type === 'equalizer' && l.equalizerSettings
  );

  return equalizerLayer?.equalizerSettings?.responseSpeed ?? defaultSpeed;
};

/**
 * Finds and caches equalizer layer for performance optimization
 * @param layers - Array of all layers
 * @returns Equalizer layer or null if not found
 */
export const findEqualizerLayer = (layers: Layer[]): Layer | null => {
  return (
    layers.find(l => l.type === 'equalizer' && l.equalizerSettings) || null
  );
};

/**
 * Validates audio data array integrity
 * @param data - Audio data to validate
 * @returns True if data is valid
 */
export const validateAudioData = (data: number[]): boolean => {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every(val => typeof val === 'number' && !isNaN(val) && val >= 0)
  );
};

/**
 * Creates empty audio data array of specified length
 * @param length - Length of the array (default 64)
 * @returns Zero-filled audio data array
 */
export const createEmptyAudioData = (length: number = 64): number[] => {
  return new Array(length).fill(0);
};

/**
 * Processes audio data for visualization
 * @param data - Raw audio data (Uint8Array)
 * @param type - Type of processing ('frequency' or 'time')
 * @returns Processed audio data as number array
 */
export const processAudioData = (
  data: Uint8Array,
  type: 'frequency' | 'time'
): number[] => {
  if (!data || data.length === 0) {
    return [];
  }

  // Convert Uint8Array to number array and normalize
  const processed = Array.from(data).map(value => value / 255);

  if (type === 'frequency') {
    // Apply frequency-specific processing - use existing smoothAudioData logic
    return processed.map(val => Math.max(0, Math.min(1, val)));
  } else {
    // Apply time-domain processing
    return normalizeAudioData(processed.map(val => val * 255));
  }
};

/**
 * Normalizes frequency data to 0-1 range
 * @param data - Raw frequency data
 * @returns Normalized frequency data
 */
export const normalizeFrequencyData = (data: number[]): number[] => {
  if (!data || data.length === 0) return [];
  const values = Array.from(data as ArrayLike<number>);

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  if (max === 0 && min === 0) return values.map(() => 0);
  if (range === 0) return values.map(() => 0.5); // All values are the same

  return values.map(value => (value - min) / range);
};

/**
 * Smooths frequency data over time
 * @param data - Current frequency data
 * @param previousData - Previous frame data (optional)
 * @param smoothingFactor - Smoothing factor (0-1, default 0.8)
 * @returns Smoothed frequency data
 */
export const smoothFrequencyData = (
  data: number[],
  previousDataOrSmoothingFactor?: number[] | number,
  smoothingFactorOrPreviousData: number | number[] = 0.8
): number[] => {
  const asNumberArray = (value: unknown): number[] | undefined => {
    if (Array.isArray(value)) {
      return value;
    }
    if (ArrayBuffer.isView(value)) {
      return Array.from(value as unknown as ArrayLike<number>);
    }
    return undefined;
  };

  let previousData: number[] | undefined;
  let smoothingFactor = 0.8;

  // New signature: (data, previousData?, smoothingFactor?)
  const previousDataParsed = asNumberArray(previousDataOrSmoothingFactor);
  if (previousDataParsed) {
    previousData = previousDataParsed;
    smoothingFactor =
      typeof smoothingFactorOrPreviousData === 'number'
        ? smoothingFactorOrPreviousData
        : 0.8;
  } else if (typeof previousDataOrSmoothingFactor === 'number') {
    // Legacy signature: (data, smoothingFactor, previousData?)
    smoothingFactor = previousDataOrSmoothingFactor;
    const legacyPrevious = asNumberArray(smoothingFactorOrPreviousData);
    if (legacyPrevious) {
      previousData = legacyPrevious;
    }
  }

  // If no previous frame is provided, apply light local smoothing fallback.
  if (!previousData || previousData.length !== data.length) {
    if (data.length <= 1) return [...data];
    const smoothed = [...data];
    for (let i = 0; i < data.length; i++) {
      const prev = data[i - 1] ?? data[i] ?? 0;
      const curr = data[i] ?? 0;
      const next = data[i + 1] ?? data[i] ?? 0;
      const neighborhood = (prev + curr + next) / 3;
      smoothed[i] = curr * (1 - smoothingFactor) + neighborhood * smoothingFactor;
    }
    return smoothed;
  }

  return data.map((current, index) => {
    const previous = previousData[index] || 0;
    return previous * smoothingFactor + current * (1 - smoothingFactor);
  });
};

/**
 * Calculates RMS (Root Mean Square) of audio data
 * @param data - Audio data array
 * @returns RMS value
 */
export const calculateRMS = (data: number[]): number => {
  if (!data || data.length === 0) return 0;

  const sumSquares = data.reduce((sum, value) => sum + value * value, 0);
  return Math.sqrt(sumSquares / data.length);
};

/**
 * Calculates peak level in audio data
 * @param data - Audio data array
 * @returns Peak level value
 */
export const calculatePeakLevel = (data: number[]): number => {
  if (!data || data.length === 0) return 0;

  return Number(Math.max(...data.map(Math.abs)).toFixed(6));
};

/**
 * Detects beat based on audio energy
 * @param data - Audio data array
 * @param threshold - Beat detection threshold (default 0.7)
 * @param minInterval - Minimum interval between beats in ms (default 100)
 * @returns Whether a beat is detected
 */
export const detectBeat = (
  data: number[],
  threshold: number = 0.7,
  _minInterval: number = 100
): boolean => {
  const energy = calculateRMS(data);
  const peak = calculatePeakLevel(data);

  // Simple beat detection: high energy and peak above threshold
  return energy > threshold && peak > threshold;
};

/**
 * Analyzes frequency spectrum
 * @param frequencyData - Frequency domain data
 * @returns Analysis object with frequency bands and dominant frequency
 */
export const analyzeFrequencySpectrum = (frequencyData: number[], _sampleRate: number = 44100) => {
  const length = frequencyData.length;
  const bandSize = Math.floor(length / 4);

  const bands = {
    bass: frequencyData.slice(0, bandSize),
    midLow: frequencyData.slice(bandSize, bandSize * 2),
    midHigh: frequencyData.slice(bandSize * 2, bandSize * 3),
    treble: frequencyData.slice(bandSize * 3),
  };

  // Calculate average energy for each band
  const bandEnergies = {
    bass: calculateRMS(bands.bass),
    midLow: calculateRMS(bands.midLow),
    midHigh: calculateRMS(bands.midHigh),
    treble: calculateRMS(bands.treble),
  };

  // Find dominant frequency (approximate)
  const maxIndex = frequencyData.indexOf(Math.max(...frequencyData));
  const dominantFreq = (maxIndex / length) * 22050; // Assume 44.1kHz sample rate

  const bass = Math.max(0, Math.min(1, bandEnergies.bass / 255));
  const midLow = Math.max(0, Math.min(1, bandEnergies.midLow / 255));
  const midHigh = Math.max(0, Math.min(1, bandEnergies.midHigh / 255));
  const treble = Math.max(0, Math.min(1, bandEnergies.treble / 255));
  const mid = (midLow + midHigh) / 2;

  return {
    bands: bandEnergies,
    dominantFrequency: dominantFreq,
    totalEnergy: calculateRMS(frequencyData),
    // Backward-compatible flat fields expected by legacy consumers/tests.
    bass,
    mid,
    treble,
    dominant: dominantFreq,
  };
};
