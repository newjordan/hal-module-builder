/**
 * Audio hooks for HAL Module Builder
 *
 * Provides React hooks for audio processing lifecycle management,
 * offering clean interfaces to the AudioService with proper state
 * management, error handling, and cleanup.
 *
 * @fileoverview React hooks for audio visualization and processing
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { AudioService, disposeAudioService } from '../services/AudioService';
import { Layer } from '../types/layer-types';

/**
 * Return type for the useAudio hook
 *
 * Provides complete audio state and control methods for components.
 *
 * @interface UseAudioReturn
 */
export interface UseAudioReturn {
  /** Whether audio processing is currently active */
  isActive: boolean;
  /** Current normalized frequency data (0.0-1.0) */
  audioData: number[];
  /** Start audio processing and visualization */
  startAudio: () => Promise<void>;
  /** Stop audio processing and cleanup resources */
  stopAudio: () => void;
  /** Toggle audio processing on/off */
  toggleAudio: () => Promise<void>;
  /** Current error state, if any */
  error: string | null;
  /** Whether audio service is starting up */
  isLoading: boolean;
}

/**
 * Configuration options for the useAudio hook
 *
 * @interface UseAudioOptions
 * @example
 * ```typescript
 * const audioOptions: UseAudioOptions = {
 *   fftSize: 256,
 *   smoothing: 0.8,
 *   onStart: () => console.log('Audio started'),
 *   onError: (error) => showErrorMessage(error.message)
 * };
 * ```
 */
export interface UseAudioOptions {
  /** FFT size for frequency analysis (power of 2, default: 128) */
  fftSize?: number;
  /** Smoothing factor for audio data (0.0-1.0) */
  smoothing?: number;
  /** Callback for audio processing errors */
  onError?: (error: Error) => void;
  /** Callback when audio processing starts */
  onStart?: () => void;
  /** Callback when audio processing stops */
  onStop?: () => void;
}

/**
 * Primary audio processing hook
 *
 * Manages the complete lifecycle of audio processing including microphone
 * access, frequency analysis, and real-time data updates. Provides proper
 * error handling and cleanup for React components.
 *
 * @param options - Configuration options for audio processing
 * @returns Audio state and control methods
 * @example
 * ```typescript
 * const MyAudioComponent = () => {
 *   const {
 *     isActive,
 *     audioData,
 *     startAudio,
 *     stopAudio,
 *     error
 *   } = useAudio({
 *     fftSize: 256,
 *     onError: (err) => console.error('Audio error:', err),
 *     onStart: () => console.log('Audio visualization started')
 *   });
 *
 *   useEffect(() => {
 *     // Auto-start audio when component mounts
 *     startAudio();
 *   }, [startAudio]);
 *
 *   if (error) {
 *     return <div>Error: {error}</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={isActive ? stopAudio : startAudio}>
 *         {isActive ? 'Stop' : 'Start'} Audio
 *       </button>
 *       <AudioVisualizer data={audioData} />
 *     </div>
 *   );
 * };
 * ```
 */
export const useAudio = (options: UseAudioOptions = {}): UseAudioReturn => {
  const [isActive, setIsActive] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(() =>
    new Array((options.fftSize || 128) / 2).fill(0)
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /**
   * Start audio visualization
   */
  const startAudio = useCallback(async (): Promise<void> => {
    if (isActive || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AudioService.startVisualizer((data: number[]) => {
        setAudioData([...data]);
      });
      setIsActive(true);

      // Call onStart callback if provided
      if (optionsRef.current.onStart) {
        optionsRef.current.onStart();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start audio';
      setError(errorMessage);

      // Call onError callback if provided
      if (optionsRef.current.onError && err instanceof Error) {
        optionsRef.current.onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isActive, isLoading]);

  /**
   * Stop audio visualization
   */
  const stopAudio = useCallback((): void => {
    if (!isActive) {
      return;
    }

    AudioService.stopVisualizer();
    setIsActive(false);
    setError(null);

    // Reset audio data to empty array
    const emptyData = new Array((optionsRef.current.fftSize || 128) / 2).fill(
      0
    );
    setAudioData(emptyData);

    // Call onStop callback if provided
    if (optionsRef.current.onStop) {
      optionsRef.current.onStop();
    }
  }, [isActive]);

  /**
   * Toggle audio visualization
   */
  const toggleAudio = useCallback(async (): Promise<void> => {
    if (isActive) {
      stopAudio();
    } else {
      await startAudio();
    }
  }, [isActive, startAudio, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      AudioService.stopVisualizer();
    };
  }, []);

  return {
    isActive,
    audioData,
    startAudio,
    stopAudio,
    toggleAudio,
    error,
    isLoading,
  };
};

/**
 * Advanced audio hook with layer-specific response speeds
 *
 * Extends the basic useAudio hook to provide customized audio data
 * processing based on individual layer equalizer settings. Each layer
 * can have its own response speed for different visualization styles.
 *
 * @param layers - Current layers array for response speed lookup
 * @param options - Audio processing options
 * @returns Enhanced audio state with layer-specific data method
 * @example
 * ```typescript
 * const { audioData, getAudioDataForLayer } = useAudioWithResponseSpeed(
 *   layers,
 *   { fftSize: 256 }
 * );
 *
 * // Get fast-response data for beat detection layer
 * const beatData = getAudioDataForLayer('beat-layer-id');
 *
 * // Get smooth data for ambient background layer
 * const ambientData = getAudioDataForLayer('ambient-layer-id');
 * ```
 */
export const useAudioWithResponseSpeed = (
  _layers: Layer[],
  options: UseAudioOptions = {}
): UseAudioReturn & {
  getAudioDataForLayer: (layerId: string) => number[];
} => {
  const audioHook = useAudio(options);

  /**
   * Get audio data with specific response speed for a layer
   *
   * Note: The current AudioService does not support per-layer response speeds.
   * This returns the shared audioData for all layers. Per-layer smoothing
   * can be implemented in the future by extending AudioService.
   */
  const getAudioDataForLayer = useCallback(
    (_layerId: string): number[] => {
      return audioHook.audioData;
    },
    [audioHook.audioData]
  );

  return {
    ...audioHook,
    getAudioDataForLayer,
  };
};

/**
 * Hook for monitoring audio service status
 */
export const useAudioStatus = () => {
  const [status, setStatus] = useState({
    isActive: false,
    hasAudioContext: false,
    hasAnalyser: false,
    hasStream: false,
  });

  useEffect(() => {
    // AudioService doesn't expose detailed status; provide a basic check
    const interval = setInterval(() => {
      setStatus({
        isActive: false,
        hasAudioContext: false,
        hasAnalyser: false,
        hasStream: false,
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return status;
};

/**
 * Hook for audio context information
 */
export const useAudioContext = () => {
  const [contextInfo, setContextInfo] = useState<{
    sampleRate: number | null;
    frequencyBinCount: number | null;
  }>({
    sampleRate: null,
    frequencyBinCount: null,
  });

  useEffect(() => {
    // AudioService doesn't expose context info directly;
    // this could be extended in the future
    setContextInfo({
      sampleRate: null,
      frequencyBinCount: null,
    });
  }, []);

  return contextInfo;
};

/**
 * Cleanup hook for disposing audio service on app unmount
 */
export const useAudioCleanup = () => {
  useEffect(() => {
    return () => {
      disposeAudioService();
    };
  }, []);
};
