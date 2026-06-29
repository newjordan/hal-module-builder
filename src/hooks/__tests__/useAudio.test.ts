/**
 * useAudio Hook Tests
 * Tests for audio processing lifecycle management
 */
import { renderHook, act } from '@testing-library/react';
import { useAudio } from '../useAudio';

// Mock AudioService
const mockAudioServiceInstance = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockReturnValue(undefined),
  getAudioData: jest.fn().mockReturnValue(new Array(64).fill(0.5)),
  setDataCallback: jest.fn(),
  getStatus: jest.fn().mockReturnValue({
    isActive: false,
    hasAudioContext: false,
    hasAnalyser: false,
    hasStream: false,
  }),
  getSampleRate: jest.fn().mockReturnValue(44100),
  getFrequencyBinCount: jest.fn().mockReturnValue(64),
  getMemoryStats: jest.fn().mockReturnValue({
    isActive: false,
    uptime: 0,
    totalAllocations: 0,
    audioContextState: null,
    hasLeaks: false,
  }),
  dispose: jest.fn(),
};

jest.mock('../../services/AudioService', () => ({
  AudioService: jest.fn().mockImplementation(() => mockAudioServiceInstance),
  getAudioService: jest.fn(() => mockAudioServiceInstance),
  disposeAudioService: jest.fn(),
}));

describe('useAudio Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize audio service', async () => {
      const { result } = renderHook(() => useAudio());

      expect(result.current.isActive).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.audioData).toEqual(new Array(64).fill(0));
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Microphone access denied');

      // Mock start method to throw error
      mockAudioServiceInstance.start.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.startAudio();
      });

      expect(result.current.error).toBe(mockError.message);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Audio Processing', () => {
    it('should start and stop audio processing', async () => {
      const { result } = renderHook(() => useAudio());

      // Start audio
      await act(async () => {
        await result.current.startAudio();
      });

      expect(result.current.isActive).toBe(true);

      // Stop audio
      act(() => {
        result.current.stopAudio();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should get audio data', () => {
      const { result } = renderHook(() => useAudio());

      // Audio data should be initialized as empty array
      expect(result.current.audioData).toEqual(new Array(64).fill(0));
    });
  });

  describe('Configuration', () => {
    it('should accept FFT size option', () => {
      const { result } = renderHook(() => useAudio({ fftSize: 2048 }));

      expect(result.current.error).toBeNull();
      expect(result.current.isActive).toBe(false);
    });

    it('should accept smoothing option', () => {
      const { result } = renderHook(() => useAudio({ smoothing: 0.8 }));

      expect(result.current.error).toBeNull();
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useAudio());

      await act(async () => {
        await result.current.startAudio();
      });

      expect(result.current.isActive).toBe(true);

      // Unmount should trigger cleanup
      unmount();

      // Verify stop was called on the audio service
      expect(mockAudioServiceInstance.stop).toHaveBeenCalled();
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle audio processing', async () => {
      const { result } = renderHook(() => useAudio());

      // Initially inactive
      expect(result.current.isActive).toBe(false);

      // Toggle to start
      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(result.current.isActive).toBe(true);

      // Toggle to stop
      await act(async () => {
        await result.current.toggleAudio();
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should call error callback when provided', async () => {
      const mockOnError = jest.fn();
      const mockError = new Error('Test error');

      mockAudioServiceInstance.start.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() =>
        useAudio({
          onError: mockOnError,
        })
      );

      await act(async () => {
        await result.current.startAudio();
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });
});
