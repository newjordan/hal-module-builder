/**
 * TypeScript interfaces for AudioVisualizer components
 *
 * Defines all type interfaces for audio visualization components
 * extracted from HalModuleBuilder.tsx
 */

import { Layer } from '../../types/layer-types';

/**
 * Audio context state type
 */
export type AudioContextState =
  | 'suspended'
  | 'running'
  | 'closed'
  | 'interrupted';

/**
 * Props for the main AudioVisualizer component
 */
export interface AudioVisualizerProps {
  /** Current audio data array from frequency analysis */
  audioData: number[];
  /** Array of all layers to find equalizer layers */
  layers: Layer[];
  /** Callback when audio visualization starts */
  onAudioStart?: () => void;
  /** Callback when audio visualization stops */
  onAudioStop?: () => void;
  /** Callback when audio data updates */
  onAudioDataUpdate?: (data: number[]) => void;
}

/**
 * Props for the Equalizer component
 */
export interface EqualizerProps {
  /** Current audio data for visualization */
  audioData: number[];
  /** Equalizer layer with settings */
  layer: Layer;
  /** Callback when layer properties are updated */
  onLayerUpdate?: (layerId: string, updates: Partial<Layer>) => void;
}

/**
 * Props for the AudioControls component
 */
export interface AudioControlsProps {
  /** Current state of audio context */
  audioContextState: AudioContextState;
  /** Whether audio visualization is currently active */
  isActive: boolean;
  /** Callback to start audio visualization */
  onStart?: () => Promise<void>;
  /** Callback to stop audio visualization */
  onStop?: () => void;
  /** Callback to toggle audio visualization */
  onToggle: () => Promise<void>;
}

/**
 * Props for the FrequencyAnalyzer component
 */
export interface FrequencyAnalyzerProps {
  /** Current audio data from frequency analysis */
  audioData: number[];
  /** Whether to display debug information */
  showDebug?: boolean;
  /** Custom CSS class name */
  className?: string;
}

/**
 * Audio processing utilities interface
 */
export interface AudioProcessingUtils {
  /** Smooth audio data transitions */
  smoothAudioData: (
    currentData: number[],
    newData: number[],
    responseSpeed: number
  ) => number[];
  /** Apply frequency range filtering */
  applyFrequencyFilter: (
    data: number[],
    range: 'bass' | 'mid' | 'treble' | 'full'
  ) => number[];
  /** Normalize audio data to 0-1 range */
  normalizeAudioData: (data: number[]) => number[];
}

/**
 * Web Audio API utilities interface
 */
export interface WebAudioUtils {
  /** Create and configure audio analyser node */
  createAnalyser: (audioContext: AudioContext) => AnalyserNode;
  /** Get microphone stream */
  getMicrophoneStream: () => Promise<MediaStream>;
  /** Handle audio device disconnection */
  handleAudioDeviceChange: (callback: () => void) => void;
}
