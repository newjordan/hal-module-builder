/**
 * Frequency Analysis Utilities
 *
 * Extracted from HalModuleBuilder.tsx to provide specialized frequency analysis
 * functions for Web Audio API integration and real-time audio processing.
 */

/**
 * Frequency range definitions for audio analysis
 */
export const FREQUENCY_RANGES = {
  bass: { min: 20, max: 250 }, // Bass frequencies
  lowMid: { min: 250, max: 500 }, // Low-mid frequencies
  mid: { min: 500, max: 2000 }, // Mid frequencies
  highMid: { min: 2000, max: 4000 }, // High-mid frequencies
  treble: { min: 4000, max: 20000 }, // Treble frequencies
} as const;

/**
 * Optimal FFT sizes for different use cases
 */
export const FFT_SIZES = {
  low: 128, // Low resolution, high performance
  medium: 256, // Balanced resolution and performance
  high: 512, // High resolution, lower performance
  ultra: 1024, // Ultra-high resolution, lowest performance
} as const;

/**
 * Creates and configures an AnalyserNode for frequency analysis
 * @param audioContext - Web Audio API AudioContext
 * @param fftSize - FFT size for frequency resolution (default 128)
 * @param smoothingTimeConstant - Smoothing factor (0.0-1.0, default 0.8)
 * @returns Configured AnalyserNode
 */
export const createAnalyser = (
  audioContext: AudioContext,
  fftSize: number = FFT_SIZES.low,
  smoothingTimeConstant: number = 0.8
): AnalyserNode => {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothingTimeConstant;
  return analyser;
};

/**
 * Gets frequency data from AnalyserNode
 * @param analyser - AnalyserNode to read from
 * @returns Uint8Array of frequency data (0-255)
 */
export const getFrequencyData = (analyser: AnalyserNode): Uint8Array => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
};

/**
 * Gets time domain data from AnalyserNode (waveform)
 * @param analyser - AnalyserNode to read from
 * @returns Uint8Array of time domain data (0-255)
 */
export const getTimeDomainData = (analyser: AnalyserNode): Uint8Array => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(dataArray);
  return dataArray;
};

/**
 * Converts frequency bin index to actual frequency in Hz
 * @param binIndex - Frequency bin index
 * @param sampleRate - Audio sample rate (Hz)
 * @param fftSize - FFT size used for analysis
 * @returns Frequency in Hz
 */
export const binIndexToFrequency = (
  binIndex: number,
  sampleRate: number,
  fftSize: number
): number => {
  return (binIndex * sampleRate) / fftSize;
};

/**
 * Converts frequency in Hz to bin index
 * @param frequency - Frequency in Hz
 * @param sampleRate - Audio sample rate (Hz)
 * @param fftSize - FFT size used for analysis
 * @returns Bin index (rounded)
 */
export const frequencyToBinIndex = (
  frequency: number,
  sampleRate: number,
  fftSize: number
): number => {
  return Math.round((frequency * fftSize) / sampleRate);
};

/**
 * Extracts frequency range from frequency data
 * @param frequencyData - Full frequency data array
 * @param range - Frequency range to extract
 * @param sampleRate - Audio sample rate (Hz)
 * @param fftSize - FFT size used for analysis
 * @returns Extracted frequency range data
 */
export const extractFrequencyRange = (
  frequencyData: Uint8Array,
  range: keyof typeof FREQUENCY_RANGES,
  sampleRate: number,
  fftSize: number
): Uint8Array => {
  const { min, max } = FREQUENCY_RANGES[range];
  const minBin = frequencyToBinIndex(min, sampleRate, fftSize);
  const maxBin = frequencyToBinIndex(max, sampleRate, fftSize);

  const startBin = Math.max(0, minBin);
  const endBin = Math.min(frequencyData.length - 1, maxBin);

  return frequencyData.slice(startBin, endBin + 1);
};

/**
 * Calculates dominant frequency from frequency data
 * @param frequencyData - Frequency data array
 * @param sampleRate - Audio sample rate (Hz)
 * @param fftSize - FFT size used for analysis
 * @returns Dominant frequency in Hz
 */
export const getDominantFrequency = (
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): number => {
  let maxValue = 0;
  let maxIndex = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const value = frequencyData[i];
    if (value !== undefined && value > maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }

  return binIndexToFrequency(maxIndex, sampleRate, fftSize);
};

/**
 * Calculates spectral centroid (brightness) of audio
 * @param frequencyData - Frequency data array
 * @param sampleRate - Audio sample rate (Hz)
 * @param fftSize - FFT size used for analysis
 * @returns Spectral centroid in Hz
 */
export const getSpectralCentroid = (
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): number => {
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = binIndexToFrequency(i, sampleRate, fftSize);
    const magnitude = frequencyData[i] ?? 0;

    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  return magnitudeSum === 0 ? 0 : weightedSum / magnitudeSum;
};

/**
 * Detects audio onset/beat based on spectral flux
 * @param previousData - Previous frame frequency data
 * @param currentData - Current frame frequency data
 * @param threshold - Onset detection threshold (default 0.3)
 * @returns True if onset/beat detected
 */
export const detectOnset = (
  previousData: Uint8Array,
  currentData: Uint8Array,
  threshold: number = 0.3
): boolean => {
  if (previousData.length !== currentData.length) {
    return false;
  }

  let spectralFlux = 0;

  for (let i = 0; i < currentData.length; i++) {
    const currentValue = currentData[i] ?? 0;
    const previousValue = previousData[i] ?? 0;
    const diff = (currentValue - previousValue) / 255;
    spectralFlux += Math.max(0, diff); // Only positive changes
  }

  // Normalize by number of bins
  spectralFlux /= currentData.length;

  return spectralFlux > threshold;
};

/**
 * Calculates RMS (Root Mean Square) energy of frequency data
 * @param frequencyData - Frequency data array
 * @returns RMS energy (0.0-1.0)
 */
export const calculateRMSEnergy = (frequencyData: Uint8Array): number => {
  let sumSquares = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const value = frequencyData[i] ?? 0;
    const normalized = value / 255;
    sumSquares += normalized * normalized;
  }

  return Math.sqrt(sumSquares / frequencyData.length);
};

/**
 * Performance optimized frequency data processing
 * Uses pre-allocated arrays and efficient loops for 60fps performance
 */
export class FrequencyProcessor {
  private dataArray: Uint8Array;
  private smoothedData: number[];
  private previousData: Uint8Array;
  private lastFrameTime: number = 0;
  private readonly targetFrameTime: number = 16.67; // 60fps

  constructor(fftSize: number = FFT_SIZES.low) {
    const binCount = fftSize / 2;
    this.dataArray = new Uint8Array(new ArrayBuffer(binCount));
    this.smoothedData = new Array(binCount).fill(0);
    this.previousData = new Uint8Array(new ArrayBuffer(binCount));
  }

  /**
   * Process frequency data with frame rate control
   * @param analyser - AnalyserNode to read from
   * @param responseSpeed - Smoothing response speed (0.0-1.0)
   * @returns Processed audio data or null if frame should be skipped
   */
  processFrame(
    analyser: AnalyserNode,
    responseSpeed: number = 0.8
  ): number[] | null {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    // Skip frame if running too fast (60fps target)
    if (deltaTime < this.targetFrameTime) {
      return null;
    }

    // Get fresh frequency data
    analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>);

    // Smooth the data
    const inverseResponseSpeed = 1 - responseSpeed;
    let hasChanged = false;

    for (let i = 0; i < this.dataArray.length; i++) {
      const rawValue = this.dataArray[i] ?? 0;
      const target = rawValue / 255;
      const currentValue = this.smoothedData[i] ?? 0;
      const newValue =
        currentValue * inverseResponseSpeed + target * responseSpeed;

      if (Math.abs(newValue - currentValue) > 0.001) {
        this.smoothedData[i] = newValue;
        hasChanged = true;
      }
    }

    this.lastFrameTime = currentTime;

    // Return new array reference only if data changed
    return hasChanged ? [...this.smoothedData] : null;
  }

  /**
   * Get current smoothed data without processing
   */
  getCurrentData(): number[] {
    return [...this.smoothedData];
  }

  /**
   * Reset processor state
   */
  reset(): void {
    this.smoothedData.fill(0);
    this.dataArray.fill(0);
    this.previousData.fill(0);
    this.lastFrameTime = 0;
  }
}
