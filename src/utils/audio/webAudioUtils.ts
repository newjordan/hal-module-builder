/**
 * Web Audio API Utilities
 *
 * Extracted from HalModuleBuilder.tsx to provide reusable Web Audio API functions
 * for microphone access, audio context management, and device handling.
 */

/**
 * Audio context state type
 */
export type AudioContextState =
  | 'suspended'
  | 'running'
  | 'closed'
  | 'interrupted';

/**
 * Audio device change callback type
 */
export type AudioDeviceChangeCallback = () => void;

/**
 * Gets user media stream with microphone access
 * @returns Promise resolving to MediaStream
 * @throws Error if microphone access is denied or unavailable
 */
export const getMicrophoneStream = async (): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Provide more specific error messages
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error(
            'Microphone access denied. Please allow microphone permissions.'
          );
        case 'NotFoundError':
          throw new Error('No microphone found. Please connect a microphone.');
        case 'NotReadableError':
          throw new Error(
            'Microphone is already in use by another application.'
          );
        case 'OverconstrainedError':
          throw new Error('Microphone constraints could not be satisfied.');
        default:
          throw new Error(`Failed to access microphone: ${error.message}`);
      }
    }
    throw new Error('Unknown error occurred while accessing microphone.');
  }
};

/**
 * Creates and configures an AudioContext with proper error handling
 * @returns Promise resolving to AudioContext
 * @throws Error if AudioContext creation fails
 */
export const createAudioContext = async (): Promise<AudioContext> => {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Handle Chrome's autoplay policy - ensure context is resumed
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    return audioContext;
  } catch (error) {
    throw new Error(
      `Failed to create audio context: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Safely closes an AudioContext
 * @param audioContext - AudioContext to close
 */
export const closeAudioContext = async (
  audioContext: AudioContext | null
): Promise<void> => {
  if (!audioContext) return;

  try {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  } catch (error) {
    console.warn('Failed to close audio context:', error);
  }
};

/**
 * Stops all tracks in a MediaStream
 * @param stream - MediaStream to stop
 */
export const stopMediaStream = (stream: MediaStream | null): void => {
  if (!stream) return;

  stream.getTracks().forEach(track => {
    try {
      track.stop();
    } catch (error) {
      console.warn('Failed to stop media track:', error);
    }
  });
};

/**
 * Handles audio context state changes for tab visibility
 * @param audioContext - AudioContext to manage
 * @param onStateChange - Callback for state changes
 * @returns Cleanup function to remove event listeners
 */
export const handleAudioContextVisibility = (
  audioContext: AudioContext,
  onStateChange?: (state: AudioContextState) => void
): (() => void) => {
  const handleVisibilityChange = async () => {
    if (!audioContext) return;

    try {
      if (document.hidden) {
        // Tab became hidden - suspend audio context to save resources
        if (audioContext.state === 'running') {
          await audioContext.suspend();
          onStateChange?.('suspended');
        }
      } else {
        // Tab became visible - resume audio context if it was suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          onStateChange?.('running');
        }
      }
    } catch (error) {
      console.warn('Failed to handle audio context visibility change:', error);
      onStateChange?.('interrupted');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Sets up audio device change detection
 * @param callback - Function to call when audio devices change
 * @returns Cleanup function to remove event listeners
 */
export const handleAudioDeviceChange = (
  callback: AudioDeviceChangeCallback
): (() => void) => {
  const handleDeviceChange = () => {
    console.warn('Audio device change detected');
    callback();
  };

  // Listen for device changes
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
  }

  // Return cleanup function
  return () => {
    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange
      );
    }
  };
};

/**
 * Checks if Web Audio API is supported
 * @returns True if Web Audio API is supported
 */
export const isWebAudioSupported = (): boolean => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};

/**
 * Checks if getUserMedia is supported
 * @returns True if getUserMedia is supported
 */
export const isGetUserMediaSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Gets available audio input devices
 * @returns Promise resolving to array of audio input devices
 */
export const getAudioInputDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  } catch (error) {
    console.warn('Failed to enumerate audio devices:', error);
    return [];
  }
};

/**
 * Creates a media stream source from a stream
 * @param audioContext - AudioContext to use
 * @param stream - MediaStream to create source from
 * @returns MediaStreamAudioSourceNode
 */
export const createMediaStreamSource = (
  audioContext: AudioContext,
  stream: MediaStream
): MediaStreamAudioSourceNode => {
  return audioContext.createMediaStreamSource(stream);
};

/**
 * Audio context management class for centralized control
 */
export class AudioContextManager {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private visibilityCleanup: (() => void) | null = null;
  private deviceChangeCleanup: (() => void) | null = null;

  constructor(
    private onStateChange?: (state: AudioContextState) => void,
    private onDeviceChange?: AudioDeviceChangeCallback
  ) {}

  /**
   * Initialize audio context and microphone
   */
  async initialize(): Promise<{
    audioContext: AudioContext;
    stream: MediaStream;
    source: MediaStreamAudioSourceNode;
  }> {
    // Clean up any existing resources
    await this.cleanup();

    try {
      // Create audio context
      this.audioContext = await createAudioContext();

      // Get microphone stream
      this.stream = await getMicrophoneStream();

      // Create source node
      this.source = createMediaStreamSource(this.audioContext, this.stream);

      // Set up visibility handling
      this.visibilityCleanup = handleAudioContextVisibility(
        this.audioContext,
        this.onStateChange
      );

      // Set up device change handling
      if (this.onDeviceChange) {
        this.deviceChangeCleanup = handleAudioDeviceChange(this.onDeviceChange);
      }

      // Report initial state
      this.onStateChange?.(this.audioContext.state as AudioContextState);

      return {
        audioContext: this.audioContext,
        stream: this.stream,
        source: this.source,
      };
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Clean up all audio resources
   */
  async cleanup(): Promise<void> {
    // Clean up event listeners
    this.visibilityCleanup?.();
    this.deviceChangeCleanup?.();

    // Stop media stream
    stopMediaStream(this.stream);
    this.stream = null;
    this.source = null;

    // Close audio context
    await closeAudioContext(this.audioContext);
    this.audioContext = null;
  }

  /**
   * Get current audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get current media stream
   */
  getMediaStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get current source node
   */
  getSourceNode(): MediaStreamAudioSourceNode | null {
    return this.source;
  }
}
