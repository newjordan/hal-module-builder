import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SYMMETRY_MODE } from '../config/equalizerSymmetry';
import { Layer } from '../types/layer-types';
import {
  calculateFrequencyBins,
  calculatePolarCoordinates,
} from '../utils/layer-transforms';

import type { BarVisualizationConfig } from '../assets/equalizer/visualizations/BarVisualization';
import {
  validateBarCount,
  validateRadius,
  validateResponseSpeed,
} from '../utils/layer-validation';
const DEFAULT_EQUALIZER_SETTINGS: BarVisualizationConfig = {
  barCount: 48,
  barWidth: 8,
  barSpacing: 2,
  maxHeight: 200,
  responseSpeed: 0.8,
  colorMode: 'gradient',
  primaryColor: '#dc2626',
  secondaryColor: '#7f1d1d',

  pulseMode: 'none',
  symmetry: DEFAULT_SYMMETRY_MODE,
  rotation: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  innerRadius: 140,
  startAngle: 0,
  endAngle: 360,
  arcMode: false,
  invert: false,
  radialOrientation: 'follow-radius',
  style: 'vertical',
  layout: 'linear',
  barAlignment: 'bottom',
  minHeight: 2,
  cornerRadius: 0,
  smoothing: 0.7,
  peakHold: true,
  peakHoldTime: 500,
  peakDecay: 0.02,
  barStyle: 'bar',
  frequencyRange: 'full',
};

const sanitizeEqualizerSettings = (
  raw: Layer['equalizerSettings']
): BarVisualizationConfig | null => {
  if (!raw) {
    return null;
  }

  const sanitized: BarVisualizationConfig = { ...DEFAULT_EQUALIZER_SETTINGS };

  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined) {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }

  sanitized.barCount = validateBarCount(raw.barCount, sanitized.barCount);
  sanitized.responseSpeed = validateResponseSpeed(
    raw.responseSpeed,
    sanitized.responseSpeed
  );
  sanitized.innerRadius = validateRadius(
    raw.innerRadius,
    sanitized.innerRadius
  );
  sanitized.maxHeight = validateRadius(raw.maxHeight, sanitized.maxHeight);

  return sanitized;
};

/**
 * Audio processing configuration
 */
export interface AudioConfig {
  /** FFT size for frequency analysis */
  fftSize: number;
  /** Smoothing time constant for frequency data */
  smoothingTimeConstant: number;
  /** Minimum decibels for frequency analysis */
  minDecibels: number;
  /** Maximum decibels for frequency analysis */
  maxDecibels: number;
  /** Sample rate (usually 44100) */
  sampleRate: number;
}

/**
 * Audio visualization data
 */
export interface AudioVisualizationData {
  /** Raw frequency data array */
  frequencyData: Uint8Array;
  /** Processed frequency data for visualization */
  normalizedData: number[];
  /** Average volume level (0-1) */
  averageVolume: number;
  /** Peak volume level (0-1) */
  peakVolume: number;
  /** Dominant frequency in Hz */
  dominantFrequency: number;
  /** Whether audio is actively detected */
  isActive: boolean;
}

/**
 * Equalizer rendering data
 */
export interface EqualizerRenderData {
  /** Array of bar heights for rendering */
  barHeights: number[];
  /** Array of bar colors for rendering */
  barColors: string[];
  /** Array of bar positions for circular layouts */
  barPositions: Array<{ x: number; y: number; angle: number }>;

  symmetryPlan: { mode: string; segmentCount: number };
}

/**
 * Hook return interface
 */
export interface UseLayerAudioReturn {
  /** Audio context and analyzer */
  audioContext: AudioContext | null;
  analyzerNode: AnalyserNode | null;
  /** Current audio visualization data */
  audioData: AudioVisualizationData;
  /** Processed equalizer rendering data */
  equalizerData: EqualizerRenderData;
  /** Audio control functions */
  controls: {
    /** Initialize audio context and microphone */
    initializeAudio: () => Promise<void>;
    /** Disconnect audio and cleanup */
    disconnectAudio: () => void;
    /** Update audio configuration */
    updateConfig: (config: Partial<AudioConfig>) => void;
    /** Get current frequency data */
    getFrequencyData: () => Uint8Array;
    /** Process audio frame (called from animation loop) */
    processAudioFrame: () => void;
  };
  /** Current audio configuration */
  config: AudioConfig;
  /** Audio processing state */
  state: {
    isInitialized: boolean;
    isProcessing: boolean;
    hasPermission: boolean;
    error: string | null;
  };
}

/**
 * Custom hook for audio processing and visualization
 * Extracts audio-related functionality from LayerItem/HalModuleBuilder:
 * - Web Audio API integration
 * - Real-time frequency analysis
 * - Equalizer data processing
 * - Audio-reactive property calculations
 *
 * @param layer - Layer with equalizer settings
 * @returns Audio processing controls and visualization data
 */
export const useLayerAudio = (layer: Layer): UseLayerAudioReturn => {
  // Audio context and nodes
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Audio configuration
  const [config, setConfig] = useState<AudioConfig>({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    sampleRate: 44100,
  });

  // Audio state
  const [state, setState] = useState({
    isInitialized: false,
    isProcessing: false,
    hasPermission: false,
    error: null as string | null,
  });

  // Audio visualization data
  const [audioData, setAudioData] = useState<AudioVisualizationData>({
    frequencyData: new Uint8Array(0),
    normalizedData: [],
    averageVolume: 0,
    peakVolume: 0,
    dominantFrequency: 0,
    isActive: false,
  });

  // Processed equalizer data
  const [equalizerData, setEqualizerData] = useState<EqualizerRenderData>({
    barHeights: [],
    barColors: [],
    barPositions: [],

    symmetryPlan: { mode: DEFAULT_SYMMETRY_MODE, segmentCount: 1 },
  });

  // Get equalizer settings from layer with validation
  const equalizerSettings = useMemo(() => {
    return sanitizeEqualizerSettings(layer.equalizerSettings);
  }, [layer.equalizerSettings]);

  /**
   * Initialize audio context and microphone access
   */
  const initializeAudio = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isInitialized: false }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create audio context
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setAudioContext(context);

      // Create analyzer node
      const analyzer = context.createAnalyser();
      analyzer.fftSize = config.fftSize;
      analyzer.smoothingTimeConstant = config.smoothingTimeConstant;
      analyzer.minDecibels = config.minDecibels;
      analyzer.maxDecibels = config.maxDecibels;
      setAnalyzerNode(analyzer);

      // Connect microphone to analyzer
      const source = context.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      source.connect(analyzer);

      setState(prev => ({
        ...prev,
        isInitialized: true,
        hasPermission: true,
        isProcessing: true,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize audio';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        hasPermission: false,
        isInitialized: false,
      }));
      console.error('Audio initialization failed:', error);
    }
  }, [config]);

  /**
   * Disconnect audio and cleanup resources
   */
  const disconnectAudio = useCallback(() => {
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect source node
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    // Close audio context
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }

    setAnalyzerNode(null);
    setState(prev => ({
      ...prev,
      isInitialized: false,
      isProcessing: false,
    }));
  }, [audioContext]);

  const disconnectAudioRef = useRef(disconnectAudio);
  useEffect(() => {
    disconnectAudioRef.current = disconnectAudio;
  }, [disconnectAudio]);

  /**
   * Update audio configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<AudioConfig>) => {
      setConfig(prev => ({ ...prev, ...newConfig }));

      // Update analyzer node if available
      if (analyzerNode && newConfig) {
        if (newConfig.fftSize) analyzerNode.fftSize = newConfig.fftSize;
        if (newConfig.smoothingTimeConstant !== undefined) {
          analyzerNode.smoothingTimeConstant = newConfig.smoothingTimeConstant;
        }
        if (newConfig.minDecibels !== undefined)
          analyzerNode.minDecibels = newConfig.minDecibels;
        if (newConfig.maxDecibels !== undefined)
          analyzerNode.maxDecibels = newConfig.maxDecibels;
      }
    },
    [analyzerNode]
  );

  /**
   * Get current frequency data from analyzer
   */
  const getFrequencyData = useCallback((): Uint8Array => {
    if (!analyzerNode) {
      return new Uint8Array(0);
    }

    const dataArray = new Uint8Array(analyzerNode.frequencyBinCount);
    analyzerNode.getByteFrequencyData(dataArray);
    return dataArray;
  }, [analyzerNode]);

  /**
   * Process audio frame and update visualization data
   * This should be called from the main animation loop for 60fps updates
   */
  const processAudioFrame = useCallback(() => {
    if (!analyzerNode || !equalizerSettings) {
      return;
    }

    try {
      // Get frequency data
      const frequencyData = getFrequencyData();

      // Calculate frequency bin range based on settings
      const { startBin, endBin } = calculateFrequencyBins(
        equalizerSettings.frequencyRange,
        frequencyData.length,
        config.sampleRate
      );

      // Extract relevant frequency data
      const relevantData = frequencyData.slice(startBin, endBin + 1);

      // Normalize to 0-1 range
      const normalizedData = Array.from(relevantData).map(value => value / 255);

      // Calculate audio metrics
      const sum = normalizedData.reduce((acc, val) => acc + val, 0);
      const averageVolume = sum / normalizedData.length;
      const peakVolume = Math.max(...normalizedData);

      // Find dominant frequency
      const maxIndex = normalizedData.indexOf(peakVolume);
      const dominantFrequency =
        ((startBin + maxIndex) / frequencyData.length) *
        (config.sampleRate / 2);

      // Check if audio is active (above threshold)
      const isActive = averageVolume > 0.01; // 1% threshold

      // Update audio data
      setAudioData({
        frequencyData,
        normalizedData: normalizedData,
        averageVolume,
        peakVolume,
        dominantFrequency,
        isActive,
      });

      // Process equalizer rendering data
      processEqualizerData(
        normalizedData,
        equalizerSettings,
        averageVolume,
        peakVolume
      );
    } catch (error) {
      console.error('Audio processing error:', error);
    }
  }, [analyzerNode, equalizerSettings, config.sampleRate, getFrequencyData]);

  /**
   * Process equalizer-specific rendering data
   */
  const processEqualizerData = useCallback(
    (
      normalizedData: number[],
      settings: BarVisualizationConfig,
      averageVolume: number,
      _peakVolume: number
    ) => {
      const barCount = Math.min(settings.barCount, normalizedData.length);

      // Interpolate data to match bar count
      const barHeights = [];
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * normalizedData.length);
        const height = normalizedData[dataIndex] || 0;

        // Apply response speed smoothing (simple exponential smoothing)
        const previousHeight = equalizerData.barHeights[i] || 0;
        const smoothedHeight =
          previousHeight + (height - previousHeight) * settings.responseSpeed;

        // Apply max height scaling
        barHeights.push(
          Math.min(smoothedHeight * settings.maxHeight, settings.maxHeight)
        );
      }

      // Calculate bar positions for circular layouts
      const barPositions = [];
      for (let i = 0; i < barCount; i++) {
        if (settings.arcMode) {
          // Arc layout
          const position = calculatePolarCoordinates(
            i,
            barCount,
            settings.innerRadius ?? 140,
            settings.startAngle ?? 0,
            settings.endAngle ?? 360
          );
          barPositions.push({
            x: ((settings as any).positionX ?? 0) * 100 + position.x,
            y: ((settings as any).positionY ?? 0) * 100 + position.y,
            angle: position.angle,
          });
        } else {
          // Linear layout
          const spacing = settings.barWidth + settings.barSpacing;
          barPositions.push({
            x: i * spacing,
            y: 0,
            angle: settings.barRotation,
          });
        }
      }

      // Calculate bar colors based on color mode
      const barColors = calculateBarColors(barHeights, settings, averageVolume);

      const symmetryPlan = {
        mode: settings.symmetry || DEFAULT_SYMMETRY_MODE,
        segmentCount:
          settings.symmetry === 'mirror'
            ? 2
            : settings.symmetry?.match(/(\d+)-fold/)
              ? parseInt(settings.symmetry.match(/(\d+)-fold/)![1]!, 10)
              : 1,
      };

      setEqualizerData({
        barHeights,
        barColors,
        barPositions,

        symmetryPlan,
      });
    },
    [equalizerData.barHeights]
  );

  /**
   * Calculate bar colors based on color mode
   */
  const calculateBarColors = useCallback(
    (
      barHeights: number[],
      settings: BarVisualizationConfig,
      averageVolume: number
    ): string[] => {
      return barHeights.map((height, index) => {
        switch (settings.colorMode) {
          case 'solid':
            return settings.primaryColor;

          case 'gradient':
            // Interpolate between primary and secondary colors
            const ratio = height / settings.maxHeight;
            return interpolateColor(
              settings.primaryColor,
              settings.secondaryColor ?? settings.primaryColor,
              ratio
            );

          case 'rainbow':
            // Map index to hue
            const hue = (index / barHeights.length) * 360;
            return `hsl(${hue}, 70%, 60%)`;

          case 'reactive':
            // Change color based on volume
            const intensity = Math.min(averageVolume * 2, 1);
            return interpolateColor('#0066cc', '#ff3366', intensity);

          case 'custom-gradient':
            if (
              settings.customGradient &&
              settings.customGradient.colors.length > 0
            ) {
              const ratio = height / settings.maxHeight;
              return interpolateGradient(
                settings.customGradient.colors,
                settings.customGradient.stops,
                ratio
              );
            }
            return settings.primaryColor;

          case 'radial-gradient':
            if (
              settings.radialGradientSettings &&
              settings.radialGradientSettings.colors.length > 0
            ) {
              const ratio = height / settings.maxHeight;
              return interpolateGradient(
                settings.radialGradientSettings.colors,
                settings.radialGradientSettings.stops,
                ratio
              );
            }
            return settings.primaryColor;

          default:
            return settings.primaryColor;
        }
      });
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectAudioRef.current();
    };
  }, []);

  const controls = {
    initializeAudio,
    disconnectAudio,
    updateConfig,
    getFrequencyData,
    processAudioFrame,
  };

  return {
    audioContext,
    analyzerNode,
    audioData,
    equalizerData,
    controls,
    config,
    state,
  };
};

/**
 * Utility function to interpolate between two colors
 */
const interpolateColor = (
  color1: string,
  color2: string,
  ratio: number
): string => {
  // Simple RGB interpolation
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Utility function to interpolate within a gradient
 */
const interpolateGradient = (
  colors: string[],
  stops: number[],
  ratio: number
): string => {
  if (colors.length === 0) return '#ffffff';
  if (colors.length === 1) return colors[0] || '#ffffff';

  // Find the two colors to interpolate between
  for (let i = 0; i < stops.length - 1; i++) {
    const startStop = stops[i];
    const endStop = stops[i + 1];

    if (
      startStop !== undefined &&
      endStop !== undefined &&
      ratio >= startStop &&
      ratio <= endStop
    ) {
      const segmentRatio = (ratio - startStop) / (endStop - startStop);
      const color1 = colors[i] || '#ffffff';
      const color2 = colors[i + 1] || '#ffffff';
      return interpolateColor(color1, color2, segmentRatio);
    }
  }

  // If ratio is outside bounds, return closest color
  const firstStop = stops[0];
  return firstStop !== undefined && ratio <= firstStop
    ? colors[0] || '#ffffff'
    : colors[colors.length - 1] || '#ffffff';
};

export default useLayerAudio;
