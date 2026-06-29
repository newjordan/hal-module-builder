/**
 * AudioProcessor - Core audio processing module for equalizer visualizations
 * Handles FFT analysis, frequency band mapping, and audio level normalization
 */

export interface AudioProcessorConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  frequencyRange?: 'bass' | 'mid' | 'treble' | 'full';
}

export interface BeatInfo {
  isBeat: boolean;
  intensity: number;
  tempo: number;
  timestamp: number;
}

export interface FrequencyBand {
  min: number;
  max: number;
  label: string;
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isDisconnected: boolean = false;

  private fftSize: number = 128;
  private smoothingTimeConstant: number = 0.8;
  private frequencyData: Uint8Array;
  private timeDomainData: Uint8Array;
  private smoothedData: number[] = [];

  // Per-frame cache: fetch FFT data once, reuse for all band queries
  private _frameId: number = 0;
  private _cachedFrameId: number = -1;

  // Noise gate: values below this (0-255 scale) are zeroed to kill ambient noise
  private noiseFloor: number = 8; // ~3% of 255

  // Beat detection
  private beatHistory: number[] = [];
  private beatThreshold: number = 1.3;
  private lastBeatTime: number = 0;
  private beatInterval: number = 0;

  // Frequency bands
  private static readonly FREQUENCY_BANDS: Record<string, FrequencyBand> = {
    bass: { min: 20, max: 250, label: 'Bass' },
    mid: { min: 250, max: 2000, label: 'Mid' },
    treble: { min: 2000, max: 20000, label: 'Treble' },
    full: { min: 20, max: 20000, label: 'Full Range' },
  };

  constructor(config?: AudioProcessorConfig) {
    if (config) {
      this.fftSize = config.fftSize || this.fftSize;
      this.smoothingTimeConstant =
        config.smoothingTimeConstant || this.smoothingTimeConstant;
    }

    this.frequencyData = new Uint8Array(this.fftSize / 2);
    this.timeDomainData = new Uint8Array(this.fftSize);
  }

  /**
   * Initialize audio context and analyser
   */
  async initialize(): Promise<void> {
    if (this.audioContext) {
      return; // Already initialized
    }

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

    // Update data arrays for new FFT size
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.fftSize);
    this.smoothedData = new Array(this.analyser.frequencyBinCount).fill(0);
  }

  /**
   * Connect to microphone input
   */
  async connectMicrophone(): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      await this.initialize();
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      if (this.audioContext && this.analyser) {
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.source.connect(this.analyser);
      }
    } catch (error) {
      console.error('Failed to connect microphone:', error);
      throw error;
    }
  }

  /**
   * Connect to an audio source node
   */
  connectSource(source: AudioNode): void {
    if (!this.analyser) {
      throw new Error('AudioProcessor not initialized');
    }
    source.connect(this.analyser);
  }

  /**
   * Call once per animation frame to advance the frame counter.
   * This ensures getFrequencyData fetches from the AnalyserNode at most once
   * per frame, giving consistent band values within a single render.
   */
  newFrame(): void {
    this._frameId++;
  }

  /**
   * Set the noise floor (0-255). Frequency values at or below this are zeroed.
   * This prevents ambient mic noise from driving visual properties.
   */
  setNoiseFloor(value: number): void {
    this.noiseFloor = Math.max(0, Math.min(255, value));
  }

  /** Fetch FFT data at most once per frame, apply noise gate */
  private _ensureFrameData(): void {
    if (!this.analyser) return;
    if (this._cachedFrameId === this._frameId) return;
    this._cachedFrameId = this._frameId;

    this.analyser.getByteFrequencyData(this.frequencyData as any);

    // Apply noise gate: zero out bins below the noise floor
    const floor = this.noiseFloor;
    if (floor > 0) {
      for (let i = 0; i < this.frequencyData.length; i++) {
        if ((this.frequencyData[i] ?? 0) <= floor) {
          this.frequencyData[i] = 0;
        }
      }
    }
  }

  /**
   * Get frequency data with optional range filtering
   */
  getFrequencyData(range?: 'bass' | 'mid' | 'treble' | 'full'): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }

    this._ensureFrameData();

    if (!range || range === 'full') {
      return this.frequencyData;
    }

    const band = AudioProcessor.FREQUENCY_BANDS[range];
    if (!band) {
      return this.frequencyData;
    }
    const nyquist = this.audioContext!.sampleRate / 2;
    const binHz = nyquist / this.frequencyData.length;

    const startBin = Math.floor(band.min / binHz);
    const endBin = Math.ceil(band.max / binHz);

    return this.frequencyData.slice(startBin, endBin);
  }

  /**
   * Get smoothed frequency data with response speed control
   */
  getSmoothedFrequencyData(responseSpeed: number = 0.8): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }

    this._ensureFrameData();
    const inverseResponse = 1 - responseSpeed;

    for (let i = 0; i < this.frequencyData.length; i++) {
      const freqValue = this.frequencyData[i];
      if (freqValue !== undefined && this.smoothedData[i] !== undefined) {
        const normalized = freqValue / 255;
        const currentValue = this.smoothedData[i]!;
        this.smoothedData[i] =
          currentValue * inverseResponse + normalized * responseSpeed;
      }
    }

    // Convert to Uint8Array for test compatibility
    const result = new Uint8Array(this.smoothedData.length);
    for (let i = 0; i < this.smoothedData.length; i++) {
      result[i] = Math.round((this.smoothedData[i] ?? 0) * 255);
    }

    return result;
  }

  /**
   * Get smoothed frequency data as normalized numbers (0-1)
   */
  getSmoothedFrequencyDataNormalized(responseSpeed: number = 0.8): number[] {
    if (!this.analyser) {
      return [];
    }

    this._ensureFrameData();
    const inverseResponse = 1 - responseSpeed;

    for (let i = 0; i < this.frequencyData.length; i++) {
      const freqValue = this.frequencyData[i];
      if (freqValue !== undefined && this.smoothedData[i] !== undefined) {
        const normalized = freqValue / 255;
        const currentValue = this.smoothedData[i]!;
        this.smoothedData[i] =
          currentValue * inverseResponse + normalized * responseSpeed;
      }
    }

    return this.smoothedData;
  }

  /**
   * Get time domain (waveform) data
   */
  getTimeDomainData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }

    this.analyser.getByteTimeDomainData(this.timeDomainData as any);
    return this.timeDomainData;
  }

  /**
   * Get waveform data (alias for getTimeDomainData)
   */
  getWaveformData(): Uint8Array {
    return this.getTimeDomainData();
  }

  /**
   * Calculate average frequency level across all bands
   */
  getAverageFrequency(): number {
    const freqData = this.getFrequencyData();
    if (freqData.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < freqData.length; i++) {
      sum += freqData[i] ?? 0;
    }
    return sum / freqData.length;
  }

  /**
   * Get bass frequency level (20-250 Hz)
   */
  getBassLevel(): number {
    const bassData = this.getFrequencyData('bass');
    if (bassData.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < bassData.length; i++) {
      sum += bassData[i] ?? 0;
    }
    return sum / bassData.length;
  }

  /**
   * Get mid frequency level (250-2000 Hz)
   */
  getMidLevel(): number {
    const midData = this.getFrequencyData('mid');
    if (midData.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < midData.length; i++) {
      sum += midData[i] ?? 0;
    }
    return sum / midData.length;
  }

  /**
   * Get treble frequency level (2000-20000 Hz)
   */
  getTrebleLevel(): number {
    const trebleData = this.getFrequencyData('treble');
    if (trebleData.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < trebleData.length; i++) {
      sum += trebleData[i] ?? 0;
    }
    return sum / trebleData.length;
  }

  /**
   * Get frequency data mapped to specified number of bands
   */
  getFrequencyBands(bandCount: number): number[] {
    return this.mapFrequencyBands(bandCount, 'logarithmic', 'full');
  }

  /**
   * Detect peaks in frequency data
   */
  detectPeaks(
    threshold: number = 100
  ): Array<{ index: number; value: number }> {
    const freqData = this.getFrequencyData();
    const peaks: Array<{ index: number; value: number }> = [];

    if (freqData.length === 0) return peaks;

    for (let i = 1; i < freqData.length - 1; i++) {
      const current = freqData[i] ?? 0;
      const prev = freqData[i - 1] ?? 0;
      const next = freqData[i + 1] ?? 0;

      // Peak detection: current value is higher than neighbors and above threshold
      if (current > prev && current > next && current >= threshold) {
        peaks.push({ index: i, value: current });
      }
    }

    return peaks;
  }

  /**
   * Map frequency data to specified number of bands with logarithmic or linear scaling
   */
  mapFrequencyBands(
    targetBandCount: number,
    scaling: 'linear' | 'logarithmic' = 'logarithmic',
    range?: 'bass' | 'mid' | 'treble' | 'full'
  ): number[] {
    const freqData = this.getSmoothedFrequencyDataNormalized();

    if (freqData.length === 0) {
      return new Array(targetBandCount).fill(0);
    }

    let startIdx = 0;
    let endIdx = freqData.length;

    if (range && range !== 'full') {
      const band = AudioProcessor.FREQUENCY_BANDS[range];
      if (!band) {
        return new Array(targetBandCount).fill(0);
      }
      const nyquist = this.audioContext!.sampleRate / 2;
      const binHz = nyquist / freqData.length;
      startIdx = Math.floor(band.min / binHz);
      endIdx = Math.ceil(band.max / binHz);
    }

    const sourceData = freqData.slice(startIdx, endIdx);
    const bands = new Array(targetBandCount).fill(0);

    if (scaling === 'logarithmic') {
      // Logarithmic scaling for better perceptual distribution
      const logMin = Math.log(1);
      const logMax = Math.log(sourceData.length);

      for (let i = 0; i < targetBandCount; i++) {
        const logStart = logMin + (i / targetBandCount) * (logMax - logMin);
        const logEnd = logMin + ((i + 1) / targetBandCount) * (logMax - logMin);

        const start = Math.floor(Math.exp(logStart)) - 1;
        const end = Math.ceil(Math.exp(logEnd)) - 1;

        let sum = 0;
        let count = 0;

        for (let j = start; j <= end && j < sourceData.length; j++) {
          if (sourceData[j] !== undefined) {
            sum += sourceData[j]!;
            count++;
          }
        }

        bands[i] = count > 0 ? sum / count : 0;
      }
    } else {
      // Linear scaling
      const bandsPerBin = sourceData.length / targetBandCount;

      for (let i = 0; i < targetBandCount; i++) {
        const start = Math.floor(i * bandsPerBin);
        const end = Math.floor((i + 1) * bandsPerBin);

        let sum = 0;
        let count = 0;

        for (let j = start; j < end && j < sourceData.length; j++) {
          if (sourceData[j] !== undefined) {
            sum += sourceData[j]!;
            count++;
          }
        }

        bands[i] = count > 0 ? sum / count : 0;
      }
    }

    return bands;
  }

  /**
   * Detect beats in the audio signal
   */
  getBeatInfo(): BeatInfo {
    const freqData = this.getFrequencyData('bass');

    if (freqData.length === 0) {
      return {
        isBeat: false,
        intensity: 0,
        tempo: 0,
        timestamp: Date.now(),
      };
    }

    // Calculate average energy in bass frequencies
    let sum = 0;
    for (let i = 0; i < Math.min(8, freqData.length); i++) {
      sum += (freqData[i] ?? 0) / 255;
    }
    const currentEnergy = sum / Math.min(8, freqData.length);

    // Update history
    this.beatHistory.push(currentEnergy);
    if (this.beatHistory.length > 44) {
      // ~1 second at 44fps
      this.beatHistory.shift();
    }

    // Calculate average energy
    const avgEnergy =
      this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;

    // Detect beat
    const isBeat = currentEnergy > avgEnergy * this.beatThreshold;

    // Calculate tempo
    const now = Date.now();
    if (isBeat && now - this.lastBeatTime > 150) {
      // Minimum 150ms between beats
      if (this.lastBeatTime > 0) {
        this.beatInterval = now - this.lastBeatTime;
      }
      this.lastBeatTime = now;
    }

    const tempo = this.beatInterval > 0 ? 60000 / this.beatInterval : 0;

    return {
      isBeat,
      intensity: currentEnergy,
      tempo: Math.round(tempo),
      timestamp: now,
    };
  }

  /**
   * Apply windowing function to reduce spectral leakage
   */
  applyWindow(
    data: number[],
    windowType: 'hanning' | 'hamming' | 'blackman' = 'hanning'
  ): number[] {
    const N = data.length;
    const windowed = new Array(N);

    for (let i = 0; i < N; i++) {
      let window = 1;

      switch (windowType) {
        case 'hanning':
          window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
          break;
        case 'hamming':
          window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
          break;
        case 'blackman':
          window =
            0.42 -
            0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) +
            0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
          break;
      }

      windowed[i] = (data[i] ?? 0) * window;
    }

    return windowed;
  }

  /**
   * Normalize audio levels
   */
  normalizeAudioLevels(data: number[], targetMax: number = 1): number[] {
    const max = Math.max(...data);
    if (max === 0) return data;

    const scale = targetMax / max;
    return data.map(v => v * scale);
  }

  /**
   * Set FFT size (must be power of 2)
   */
  setFFTSize(size: number): void {
    if (!this.analyser) {
      this.fftSize = size;
      return;
    }

    if (size < 32 || size > 32768 || (size & (size - 1)) !== 0) {
      throw new Error('FFT size must be a power of 2 between 32 and 32768');
    }

    this.fftSize = size;
    this.analyser.fftSize = size;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(size);
    this.smoothedData = new Array(this.analyser.frequencyBinCount).fill(0);
  }

  /**
   * Set smoothing time constant
   */
  setSmoothingTimeConstant(value: number): void {
    if (value < 0 || value > 1) {
      throw new Error('Smoothing time constant must be between 0 and 1');
    }

    this.smoothingTimeConstant = value;
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = value;
    }
  }

  /**
   * Initialize with an existing AudioContext (for shared-context scenarios like dual audio)
   * Creates a new AnalyserNode on the provided context without creating a mic source.
   */
  initializeWithContext(ctx: AudioContext): void {
    if (this.audioContext) return;

    this.audioContext = ctx;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.fftSize);
    this.smoothedData = new Array(this.analyser.frequencyBinCount).fill(0);
  }

  /**
   * Get the analyser node (for connecting external sources)
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.isDisconnected) {
      return; // Already disconnected, don't call again
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.isDisconnected = true;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.disconnect();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.smoothedData = [];
    this.beatHistory = [];
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioProcessorConfig {
    const config: AudioProcessorConfig = {
      fftSize: this.fftSize,
      smoothingTimeConstant: this.smoothingTimeConstant,
    };

    if (this.analyser?.minDecibels !== undefined) {
      config.minDecibels = this.analyser.minDecibels;
    }

    if (this.analyser?.maxDecibels !== undefined) {
      config.maxDecibels = this.analyser.maxDecibels;
    }

    return config;
  }
}
