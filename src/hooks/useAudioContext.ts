/**
 * useAudioContext Hook - Audio context management and audio visualization
 *
 * Extracted from HalModuleBuilder.tsx to provide reusable audio context management,
 * frequency analysis, and audio visualization functionality.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Layer } from '../types/layer-types';
import {
  AudioContextManager,
  AudioContextState,
} from '../utils/audio/webAudioUtils';
import { FrequencyProcessor } from '../utils/audio/frequencyAnalysis';
import {
  getEqualizerResponseSpeed,
  createEmptyAudioData,
  validateAudioData,
} from '../utils/audio/audioProcessing';

/**
 * Hook configuration interface
 */
export interface UseAudioContextConfig {
  /** FFT size for frequency analysis (default 128) */
  fftSize?: number;
  /** Initial response speed (default 0.8) */
  defaultResponseSpeed?: number;
  /** Whether to enable automatic cleanup on unmount */
  autoCleanup?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom state change handler */
  onStateChange?: (state: AudioContextState) => void;
}

/**
 * Hook return interface
 */
export interface UseAudioContextReturn {
  /** Current audio data array */
  audioData: number[];
  /** Current audio context state */
  audioContextState: AudioContextState;
  /** Whether audio visualization is active */
  isActive: boolean;
  /** Start audio visualization */
  startAudio: () => Promise<void>;
  /** Stop audio visualization */
  stopAudio: () => void;
  /** Toggle audio visualization */
  toggleAudio: () => Promise<void>;
  /** Current audio context instance */
  audioContext: AudioContext | null;
  /** Whether Web Audio API is supported */
  isSupported: boolean;
  /** Current error message if any */
  error: string | null;
}

/**
 * Custom hook for managing audio context and audio visualization
 * Extracted from HalModuleBuilder.tsx for reusable audio functionality
 */
export const useAudioContext = (
  layers: Layer[],
  config: UseAudioContextConfig = {}
): UseAudioContextReturn => {
  const {
    fftSize = 128,
    defaultResponseSpeed = 0.8,
    autoCleanup = true,
    onError,
    onStateChange,
  } = config;

  // State
  const [audioData, setAudioData] = useState<number[]>(
    createEmptyAudioData(fftSize / 2)
  );
  const [audioContextState, setAudioContextState] =
    useState<AudioContextState>('suspended');
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const audioManagerRef = useRef<AudioContextManager | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const frequencyProcessorRef = useRef<FrequencyProcessor | null>(null);
  const smoothedDataRef = useRef<number[]>(createEmptyAudioData(fftSize / 2));

  // Check Web Audio API support
  const isSupported = !!(
    window.AudioContext || (window as any).webkitAudioContext
  );

  // Handle state changes
  const handleStateChange = useCallback(
    (state: AudioContextState) => {
      setAudioContextState(state);
      onStateChange?.(state);
    },
    [onStateChange]
  );

  // Handle device changes (restart audio)
  const handleDeviceChange = useCallback(async () => {
    if (isActive) {
      console.warn('Audio device change detected, restarting audio...');
      stopAudio();

      // Attempt to restart after a brief delay
      setTimeout(async () => {
        try {
          await startAudio();
        } catch (error) {
          console.error('Failed to restart audio after device change:', error);
          setError(
            error instanceof Error ? error.message : 'Failed to restart audio'
          );
          onError?.(
            error instanceof Error
              ? error
              : new Error('Failed to restart audio')
          );
        }
      }, 1000);
    }
  }, [isActive]);

  // Start audio visualization
  const startAudio = useCallback(async () => {
    if (!isSupported) {
      const error = new Error('Web Audio API is not supported in this browser');
      setError(error.message);
      onError?.(error);
      return;
    }

    try {
      setError(null);

      // Initialize audio manager
      audioManagerRef.current = new AudioContextManager(
        handleStateChange,
        handleDeviceChange
      );

      const { audioContext, source } =
        await audioManagerRef.current.initialize();

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect audio nodes
      source.connect(analyser);

      // Initialize frequency processor
      frequencyProcessorRef.current = new FrequencyProcessor(fftSize);

      // Start visualization loop
      const visualize = () => {
        if (!analyserRef.current || !frequencyProcessorRef.current) return;

        try {
          // Get response speed from equalizer layer
          const responseSpeed = getEqualizerResponseSpeed(
            layers,
            defaultResponseSpeed
          );

          // Process frame with performance optimization
          const processedData = frequencyProcessorRef.current.processFrame(
            analyserRef.current,
            responseSpeed
          );

          // Update state only if data changed
          if (processedData && validateAudioData(processedData)) {
            smoothedDataRef.current = processedData;
            setAudioData([...processedData]); // Create new array reference for React
          }

          // Continue animation loop
          animationFrameRef.current = requestAnimationFrame(visualize);
        } catch (error) {
          console.error('Error in audio visualization loop:', error);
          stopAudio();
          setError(
            error instanceof Error ? error.message : 'Audio processing error'
          );
          onError?.(
            error instanceof Error ? error : new Error('Audio processing error')
          );
        }
      };

      // Start visualization
      visualize();
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start audio visualization:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start audio';
      setError(errorMessage);
      setAudioContextState('interrupted');
      onError?.(error instanceof Error ? error : new Error(errorMessage));

      // Cleanup on error
      await cleanup();
    }
  }, [
    isSupported,
    fftSize,
    layers,
    defaultResponseSpeed,
    handleStateChange,
    handleDeviceChange,
    onError,
  ]);

  // Cleanup function
  const cleanup = useCallback(async (): Promise<void> => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    // Reset frequency processor
    frequencyProcessorRef.current?.reset();
    frequencyProcessorRef.current = null;

    // Clean up audio manager
    if (audioManagerRef.current) {
      await audioManagerRef.current.cleanup();
      audioManagerRef.current = null;
    }

    // Reset refs
    analyserRef.current = null;

    // Reset state
    smoothedDataRef.current = createEmptyAudioData(fftSize / 2);
    setAudioData(createEmptyAudioData(fftSize / 2));
    setIsActive(false);
    setAudioContextState('suspended');
  }, [fftSize]);

  // Stop audio visualization
  const stopAudio = useCallback(() => {
    cleanup().catch(console.error);
  }, [cleanup]);

  // Toggle audio visualization
  const toggleAudio = useCallback(async () => {
    if (isActive) {
      stopAudio();
    } else {
      await startAudio();
    }
  }, [isActive, startAudio, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    if (autoCleanup) {
      return () => {
        cleanup().catch(console.error);
      };
    }
    return undefined;
  }, [cleanup, autoCleanup]);

  // Get current audio context
  const audioContext = audioManagerRef.current?.getAudioContext() || null;

  return {
    audioData,
    audioContextState,
    isActive,
    startAudio,
    stopAudio,
    toggleAudio,
    audioContext,
    isSupported,
    error,
  };
};

export default useAudioContext;
