/**
 * AudioAnalyzer - FFT analysis and audio input handling extracted from AudioProcessor
 * Part of Story E6.1 - Audio Processing Extraction
 *
 * Focused on:
 * - Web Audio API integration and configuration
 * - FFT analysis pipeline with configurable parameters
 * - Audio input validation and error handling
 * - Optimized for real-time processing (<16ms per frame)
 * - Proper cleanup and resource management
 */

// import { AudioDataPool } from '../utils/audioUtils';

export interface AudioAnalyzerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  sampleRate?: number;
}

export interface AudioInputConfig {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface FFTAnalysisResult {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  sampleRate: number;
  binCount: number;
  nyquistFrequency: number;
}

/**
 * AudioAnalyzer handles Web Audio API integration and FFT analysis
 * Extracted from monolithic AudioProcessor for better separation of concerns
 */
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isInitialized: boolean = false;

  private config: Required<AudioAnalyzerConfig>;
  private externalFrequencyData: Uint8Array | null = null;
  private externalTimeDomainData: Uint8Array | null = null;
  private useExternalData: boolean = false;

  constructor(config: AudioAnalyzerConfig = {}) {
    this.config = {
      fftSize: config.fftSize || 2048,
      smoothingTimeConstant: config.smoothingTimeConstant || 0.8,
      minDecibels: config.minDecibels || -100,
      maxDecibels: config.maxDecibels || -30,
      sampleRate: config.sampleRate || 44100,
    };

    this.validateConfig();
  }

  /**
   * Initialize Web Audio API context and analyser node
   * Optimized for real-time performance
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create AudioContext with optimal settings
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive', // Minimize latency for real-time processing
      });

      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create and configure analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
      this.analyser.minDecibels = this.config.minDecibels;
      this.analyser.maxDecibels = this.config.maxDecibels;

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize AudioAnalyzer: ${error}`);
    }
  }

  /**
   * Connect to microphone input with error handling and validation
   */
  async connectMicrophone(inputConfig: AudioInputConfig = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const constraints = {
        audio: {
          echoCancellation: inputConfig.echoCancellation ?? false,
          noiseSuppression: inputConfig.noiseSuppression ?? false,
          autoGainControl: inputConfig.autoGainControl ?? false,
          channelCount: 1, // Mono for performance
        },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!this.audioContext || !this.analyser) {
        throw new Error('AudioContext not initialized');
      }

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone access denied by user');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone device found');
        }
      }
      throw new Error(`Failed to connect microphone: ${error}`);
    }
  }

  /**
   * Connect external audio source with validation
   */
  connectAudioSource(source: AudioNode): void {
    if (!this.analyser) {
      throw new Error('AudioAnalyzer not initialized');
    }

    if (!source || typeof source.connect !== 'function') {
      throw new Error('Invalid audio source provided');
    }

    try {
      source.connect(this.analyser);
    } catch (error) {
      throw new Error(`Failed to connect audio source: ${error}`);
    }
  }

  /**
   * Inject external audio data for analysis
   * Allows the analyzer to work with data from external audio sources
   */
  injectAudioData(frequencyData: number[] | Uint8Array): void {
    // Convert to Uint8Array and normalize to 0-255 range
    const normalizedData = new Uint8Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i] ?? 0;
      normalizedData[i] = Math.round(Math.max(0, Math.min(1, value)) * 255);
    }

    this.externalFrequencyData = normalizedData;
    this.useExternalData = true;

    // Create dummy time domain data (not used by most visualizations)
    this.externalTimeDomainData = new Uint8Array(normalizedData.length);
    for (let i = 0; i < normalizedData.length; i++) {
      this.externalTimeDomainData[i] = 128; // Centered waveform
    }
  }

  /**
   * Stop using external data and return to internal audio analysis
   */
  stopExternalData(): void {
    this.useExternalData = false;
    this.externalFrequencyData = null;
    this.externalTimeDomainData = null;
  }

  /**
   * Perform FFT analysis and return comprehensive results
   * Optimized for <16ms per frame performance requirement
   * Now supports external data injection
   */
  analyzeAudio(): FFTAnalysisResult | null {
    // Use external data if available
    if (
      this.useExternalData &&
      this.externalFrequencyData &&
      this.externalTimeDomainData
    ) {
      return {
        frequencyData: this.externalFrequencyData,
        timeDomainData: this.externalTimeDomainData,
        sampleRate: 44100, // Default sample rate for external data
        binCount: this.externalFrequencyData.length,
        nyquistFrequency: 44100 / 2,
      };
    }

    // Fall back to internal audio analysis
    if (!this.analyser || !this.audioContext) {
      return null;
    }

    const binCount = this.analyser.frequencyBinCount;

    // Create fresh buffers to avoid type conflicts with pool
    const frequencyData = new Uint8Array(binCount);
    const timeDomainData = new Uint8Array(this.config.fftSize);

    // Perform FFT analysis directly into clean buffers
    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);

    return {
      frequencyData,
      timeDomainData,
      sampleRate: this.audioContext.sampleRate,
      binCount: binCount,
      nyquistFrequency: this.audioContext.sampleRate / 2,
    };
  }

  /**
   * Get frequency data with range validation
   */
  getFrequencyData(): Uint8Array {
    const result = this.analyzeAudio();
    return result ? result.frequencyData : new Uint8Array(0);
  }

  /**
   * Get time domain (waveform) data
   */
  getTimeDomainData(): Uint8Array {
    const result = this.analyzeAudio();
    return result ? result.timeDomainData : new Uint8Array(0);
  }

  /**
   * Update FFT size with validation
   */
  setFFTSize(size: number): void {
    if (!this.isPowerOfTwo(size) || size < 32 || size > 32768) {
      throw new Error('FFT size must be a power of 2 between 32 and 32768');
    }

    this.config.fftSize = size;

    if (this.analyser) {
      this.analyser.fftSize = size;
    }
  }

  /**
   * Update smoothing time constant with validation
   */
  setSmoothingTimeConstant(value: number): void {
    if (value < 0 || value > 1) {
      throw new Error('Smoothing time constant must be between 0 and 1');
    }

    this.config.smoothingTimeConstant = value;

    if (this.analyser) {
      this.analyser.smoothingTimeConstant = value;
    }
  }

  /**
   * Get current audio context state for debugging
   */
  getContextState(): {
    state: string;
    sampleRate: number;
    currentTime: number;
    isInitialized: boolean;
  } {
    return {
      state: this.audioContext?.state || 'not-created',
      sampleRate: this.audioContext?.sampleRate || 0,
      currentTime: this.audioContext?.currentTime || 0,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Validate audio analyzer configuration
   */
  private validateConfig(): void {
    if (!this.isPowerOfTwo(this.config.fftSize)) {
      throw new Error('FFT size must be a power of 2');
    }

    if (
      this.config.smoothingTimeConstant < 0 ||
      this.config.smoothingTimeConstant > 1
    ) {
      throw new Error('Smoothing time constant must be between 0 and 1');
    }

    if (this.config.minDecibels >= this.config.maxDecibels) {
      throw new Error('minDecibels must be less than maxDecibels');
    }
  }

  /**
   * Check if number is power of 2
   */
  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  /**
   * Disconnect audio sources with proper cleanup
   */
  disconnect(): void {
    // Clear external data
    this.stopExternalData();

    if (this.source) {
      try {
        this.source.disconnect();
      } catch (error) {
        console.warn('Error disconnecting audio source:', error);
      }
      this.source = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.warn('Error stopping media track:', error);
        }
      });
      this.stream = null;
    }
  }

  /**
   * Dispose of all resources with comprehensive cleanup
   */
  dispose(): void {
    this.disconnect();

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (error) {
        console.warn('Error disconnecting analyser:', error);
      }
      this.analyser = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
      this.audioContext = null;
    }

    this.isInitialized = false;
  }
}
