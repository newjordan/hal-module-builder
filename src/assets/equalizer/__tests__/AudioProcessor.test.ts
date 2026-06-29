import { AudioProcessor, AudioProcessorConfig } from '../AudioProcessor';

describe('AudioProcessor', () => {
  let audioProcessor: AudioProcessor;
  let mockAnalyser: any;
  let mockAudioContext: any;

  beforeEach(async () => {
    // Create mock audio context
    mockAnalyser = {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(array => {
        // Fill with mock frequency data
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 255);
        }
      }),
      getByteTimeDomainData: jest.fn(array => {
        // Fill with mock waveform data
        for (let i = 0; i < array.length; i++) {
          array[i] = 128 + Math.floor(Math.random() * 64 - 32);
        }
      }),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    mockAudioContext = {
      createAnalyser: jest.fn(() => mockAnalyser),
      createMediaStreamSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
      close: jest.fn(),
    };

    // @ts-ignore
    global.AudioContext = jest.fn(() => mockAudioContext);

    audioProcessor = new AudioProcessor();
    // Initialize the processor to set up the analyser
    await audioProcessor.initialize();
  });

  afterEach(() => {
    audioProcessor.disconnect();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      expect(audioProcessor).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const config: AudioProcessorConfig = {
        fftSize: 4096,
        smoothingTimeConstant: 0.9,
        minDecibels: -100,
        maxDecibels: -10,
      };

      const customProcessor = new AudioProcessor(config);
      expect(customProcessor).toBeDefined();
    });
  });

  describe('Audio Analysis', () => {
    it('should get frequency data', () => {
      const data = audioProcessor.getFrequencyData();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should get waveform data', () => {
      const data = audioProcessor.getWaveformData();
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should calculate average frequency', () => {
      const average = audioProcessor.getAverageFrequency();
      expect(typeof average).toBe('number');
      expect(average).toBeGreaterThanOrEqual(0);
      expect(average).toBeLessThanOrEqual(255);
    });

    it('should detect bass frequencies', () => {
      const bass = audioProcessor.getBassLevel();
      expect(typeof bass).toBe('number');
      expect(bass).toBeGreaterThanOrEqual(0);
      expect(bass).toBeLessThanOrEqual(255);
    });

    it('should detect mid frequencies', () => {
      const mid = audioProcessor.getMidLevel();
      expect(typeof mid).toBe('number');
      expect(mid).toBeGreaterThanOrEqual(0);
      expect(mid).toBeLessThanOrEqual(255);
    });

    it('should detect treble frequencies', () => {
      const treble = audioProcessor.getTrebleLevel();
      expect(typeof treble).toBe('number');
      expect(treble).toBeGreaterThanOrEqual(0);
      expect(treble).toBeLessThanOrEqual(255);
    });
  });

  describe('Frequency Bands', () => {
    it('should get frequency bands', () => {
      const bands = audioProcessor.getFrequencyBands(8);
      expect(bands).toBeInstanceOf(Array);
      expect(bands.length).toBe(8);
      bands.forEach(band => {
        expect(typeof band).toBe('number');
        expect(band).toBeGreaterThanOrEqual(0);
        expect(band).toBeLessThanOrEqual(255);
      });
    });

    it('should handle different band counts', () => {
      const bands16 = audioProcessor.getFrequencyBands(16);
      expect(bands16.length).toBe(16);

      const bands32 = audioProcessor.getFrequencyBands(32);
      expect(bands32.length).toBe(32);

      const bands64 = audioProcessor.getFrequencyBands(64);
      expect(bands64.length).toBe(64);
    });
  });

  describe('Peak Detection', () => {
    it('should detect peaks in frequency data', () => {
      const peaks = audioProcessor.detectPeaks();
      expect(peaks).toBeInstanceOf(Array);
      peaks.forEach(peak => {
        expect(peak).toHaveProperty('index');
        expect(peak).toHaveProperty('value');
        expect(typeof peak.index).toBe('number');
        expect(typeof peak.value).toBe('number');
      });
    });

    it('should apply threshold to peak detection', () => {
      const highThresholdPeaks = audioProcessor.detectPeaks(200);
      const lowThresholdPeaks = audioProcessor.detectPeaks(50);

      // High threshold should have fewer or equal peaks
      expect(highThresholdPeaks.length).toBeLessThanOrEqual(
        lowThresholdPeaks.length
      );
    });
  });

  describe('Smoothing', () => {
    it('should apply smoothing to frequency data', () => {
      const raw = audioProcessor.getFrequencyData();
      const smoothed = audioProcessor.getSmoothedFrequencyData(0.9);

      expect(smoothed).toBeInstanceOf(Uint8Array);
      expect(smoothed.length).toBe(raw.length);
    });
  });

  describe('Cleanup', () => {
    it('should properly disconnect audio nodes', () => {
      audioProcessor.disconnect();
      expect(mockAnalyser.disconnect).toHaveBeenCalled();
    });

    it('should handle multiple disconnections gracefully', () => {
      audioProcessor.disconnect();
      audioProcessor.disconnect(); // Should not throw
      expect(mockAnalyser.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
