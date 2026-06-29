/**
 * AudioAnalyzer Unit Tests
 * Part of Story E6.1 - Audio Processing Extraction
 */

import {
  AudioAnalyzer,
  type AudioAnalyzerConfig,
  type AudioInputConfig,
} from '../AudioAnalyzer';
import { AudioDataPool } from '../../utils/audioUtils';

// Mock AudioContext and related APIs
class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;

  createAnalyser() {
    return new MockAnalyserNode();
  }

  createMediaStreamSource() {
    return new MockMediaStreamAudioSourceNode();
  }

  async resume() {
    return Promise.resolve();
  }

  async close() {
    return Promise.resolve();
  }
}

class MockAnalyserNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0.8;
  minDecibels = -100;
  maxDecibels = -30;

  getByteFrequencyData(array: Uint8Array) {
    // Mock frequency data with some test values
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 255);
    }
  }

  getByteTimeDomainData(array: Uint8Array) {
    // Mock time domain data
    for (let i = 0; i < array.length; i++) {
      array[i] = 128 + Math.floor(Math.sin(i * 0.1) * 50);
    }
  }

  disconnect() {}
}

class MockMediaStreamAudioSourceNode {
  connect() {}
  disconnect() {}
}

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock AudioContext
(global as any).AudioContext = MockAudioContext;

describe('AudioAnalyzer', () => {
  let analyzer: AudioAnalyzer;
  let mockDataPool: jest.Mocked<AudioDataPool>;

  beforeEach(() => {
    mockDataPool = {
      acquireFrequencyBuffer: jest.fn().mockReturnValue(new Uint8Array(1024)),
      releaseFrequencyBuffer: jest.fn(),
      acquireTimeBuffer: jest.fn().mockReturnValue(new Uint8Array(2048)),
      releaseTimeBuffer: jest.fn(),
      acquireFloatBuffer: jest.fn().mockReturnValue(new Float32Array(1024)),
      releaseFloatBuffer: jest.fn(),
      getPoolStats: jest.fn(),
      cleanup: jest.fn(),
    };

    analyzer = new AudioAnalyzer({}, mockDataPool);
  });

  afterEach(() => {
    analyzer.dispose();
    jest.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    test('should create analyzer with default config', () => {
      const defaultAnalyzer = new AudioAnalyzer();
      expect(defaultAnalyzer).toBeInstanceOf(AudioAnalyzer);
    });

    test('should accept custom configuration', () => {
      const config: AudioAnalyzerConfig = {
        fftSize: 1024,
        smoothingTimeConstant: 0.5,
        minDecibels: -90,
        maxDecibels: -20,
        sampleRate: 48000,
      };

      const customAnalyzer = new AudioAnalyzer(config);
      expect(customAnalyzer).toBeInstanceOf(AudioAnalyzer);
    });

    test('should validate configuration on construction', () => {
      expect(() => new AudioAnalyzer({ fftSize: 100 })).toThrow(
        'FFT size must be a power of 2'
      );
      expect(() => new AudioAnalyzer({ smoothingTimeConstant: 2 })).toThrow(
        'Smoothing time constant must be between 0 and 1'
      );
      expect(
        () => new AudioAnalyzer({ minDecibels: -10, maxDecibels: -20 })
      ).toThrow('minDecibels must be less than maxDecibels');
    });
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await analyzer.initialize();

      const state = analyzer.getContextState();
      expect(state.isInitialized).toBe(true);
      expect(state.sampleRate).toBe(44100);
      expect(state.state).toBe('running');
    });

    test('should not reinitialize if already initialized', async () => {
      await analyzer.initialize();
      await analyzer.initialize(); // Second call should be no-op

      expect(analyzer.getContextState().isInitialized).toBe(true);
    });

    test('should handle initialization errors', async () => {
      // Mock AudioContext constructor to throw
      (global as any).AudioContext = jest.fn().mockImplementation(() => {
        throw new Error('AudioContext creation failed');
      });

      await expect(analyzer.initialize()).rejects.toThrow(
        'Failed to initialize AudioAnalyzer'
      );
    });
  });

  describe('Microphone Connection', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    test('should connect to microphone successfully', async () => {
      const mockStream = { getTracks: () => [] };
      mockGetUserMedia.mockResolvedValue(mockStream);

      await analyzer.connectMicrophone();

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
    });

    test('should accept custom input configuration', async () => {
      const mockStream = { getTracks: () => [] };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const inputConfig: AudioInputConfig = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      await analyzer.connectMicrophone(inputConfig);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    });

    test('should handle permission denied error', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      await expect(analyzer.connectMicrophone()).rejects.toThrow(
        'Microphone access denied by user'
      );
    });

    test('should handle no microphone found error', async () => {
      const deviceError = new Error('No device found');
      deviceError.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(deviceError);

      await expect(analyzer.connectMicrophone()).rejects.toThrow(
        'No microphone device found'
      );
    });
  });

  describe('Audio Source Connection', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    test('should connect external audio source', () => {
      const mockSource = { connect: jest.fn() };

      analyzer.connectAudioSource(mockSource as any);

      expect(mockSource.connect).toHaveBeenCalled();
    });

    test('should validate audio source', () => {
      expect(() => analyzer.connectAudioSource(null as any)).toThrow(
        'Invalid audio source provided'
      );
      expect(() => analyzer.connectAudioSource({} as any)).toThrow(
        'Invalid audio source provided'
      );
    });

    test('should throw if not initialized', () => {
      const uninitializedAnalyzer = new AudioAnalyzer();
      const mockSource = { connect: jest.fn() };

      expect(() =>
        uninitializedAnalyzer.connectAudioSource(mockSource as any)
      ).toThrow('AudioAnalyzer not initialized');
    });
  });

  describe('Audio Analysis', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    test('should perform FFT analysis', () => {
      const result = analyzer.analyzeAudio();

      expect(result).toBeTruthy();
      expect(result!.frequencyData).toBeInstanceOf(Uint8Array);
      expect(result!.timeDomainData).toBeInstanceOf(Uint8Array);
      expect(result!.sampleRate).toBe(44100);
      expect(result!.binCount).toBe(1024);
      expect(result!.nyquistFrequency).toBe(22050);
    });

    test('should return null when not initialized', () => {
      const uninitializedAnalyzer = new AudioAnalyzer();
      const result = uninitializedAnalyzer.analyzeAudio();

      expect(result).toBeNull();
    });

    test('should use data pool efficiently', () => {
      analyzer.analyzeAudio();

      expect(mockDataPool.acquireFrequencyBuffer).toHaveBeenCalledWith(1024);
      expect(mockDataPool.acquireTimeBuffer).toHaveBeenCalledWith(2048);
      expect(mockDataPool.releaseFrequencyBuffer).toHaveBeenCalled();
      expect(mockDataPool.releaseTimeBuffer).toHaveBeenCalled();
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(async () => {
      await analyzer.initialize();
    });

    test('should update FFT size', () => {
      analyzer.setFFTSize(4096);
      // Should not throw
    });

    test('should validate FFT size', () => {
      expect(() => analyzer.setFFTSize(100)).toThrow(
        'FFT size must be a power of 2 between 32 and 32768'
      );
      expect(() => analyzer.setFFTSize(65536)).toThrow(
        'FFT size must be a power of 2 between 32 and 32768'
      );
    });

    test('should update smoothing time constant', () => {
      analyzer.setSmoothingTimeConstant(0.5);
      // Should not throw
    });

    test('should validate smoothing time constant', () => {
      expect(() => analyzer.setSmoothingTimeConstant(-0.1)).toThrow(
        'Smoothing time constant must be between 0 and 1'
      );
      expect(() => analyzer.setSmoothingTimeConstant(1.5)).toThrow(
        'Smoothing time constant must be between 0 and 1'
      );
    });
  });

  describe('Cleanup and Disposal', () => {
    test('should disconnect properly', () => {
      analyzer.disconnect();
      // Should not throw
    });

    test('should dispose all resources', () => {
      analyzer.dispose();

      const state = analyzer.getContextState();
      expect(state.isInitialized).toBe(false);
    });

    test('should handle multiple dispose calls', () => {
      analyzer.dispose();
      analyzer.dispose(); // Should not throw
    });
  });

  describe('Context State', () => {
    test('should provide context state when not initialized', () => {
      const state = analyzer.getContextState();

      expect(state.state).toBe('not-created');
      expect(state.sampleRate).toBe(0);
      expect(state.currentTime).toBe(0);
      expect(state.isInitialized).toBe(false);
    });

    test('should provide context state when initialized', async () => {
      await analyzer.initialize();
      const state = analyzer.getContextState();

      expect(state.state).toBe('running');
      expect(state.sampleRate).toBe(44100);
      expect(state.isInitialized).toBe(true);
    });
  });
});
