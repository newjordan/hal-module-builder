/**
 * AudioVisualizer Component - Main audio visualization orchestrator
 *
 * Extracted from HalModuleBuilder.tsx to provide modular audio visualization functionality.
 * Orchestrates AudioControls, Equalizer, and FrequencyAnalyzer components with shared state.
 */

import React, { useMemo } from 'react';
import { AudioVisualizerProps } from './AudioVisualizer.types';
import { AudioControls } from './AudioControls';
import { Equalizer } from './Equalizer';
import { FrequencyAnalyzer } from './FrequencyAnalyzer';
import { useAudioContext } from '../../hooks/useAudioContext';

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData: externalAudioData,
  layers,
  onAudioStart,
  onAudioStop,
  onAudioDataUpdate,
}) => {
  // Use the audio context hook for complete audio management
  const {
    audioData: hookAudioData,
    audioContextState,
    isActive,
    startAudio,
    stopAudio,
    toggleAudio,
    isSupported,
    error,
  } = useAudioContext(layers, {
    autoCleanup: true,
    onError: error => {
      console.error('AudioVisualizer error:', error);
    },
    onStateChange: state => {
      console.log('AudioVisualizer state change:', state);
    },
  });

  // Use external audio data if provided, otherwise use hook data
  const audioData = useMemo(() => {
    return externalAudioData && externalAudioData.length > 0
      ? externalAudioData
      : hookAudioData;
  }, [externalAudioData, hookAudioData]);

  // Handle audio start
  const handleAudioStart = async () => {
    try {
      await startAudio();
      onAudioStart?.();
    } catch (error) {
      console.error('Failed to start audio:', error);
    }
  };

  // Handle audio stop
  const handleAudioStop = () => {
    stopAudio();
    onAudioStop?.();
  };

  // Handle audio toggle
  const handleAudioToggle = async () => {
    try {
      await toggleAudio();
      if (isActive) {
        onAudioStop?.();
      } else {
        onAudioStart?.();
      }
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  };

  // Update external callback when audio data changes
  React.useEffect(() => {
    if (onAudioDataUpdate && audioData.length > 0) {
      onAudioDataUpdate(audioData);
    }
  }, [audioData, onAudioDataUpdate]);

  // Find equalizer layers for rendering
  const equalizerLayers = useMemo(() => {
    return layers.filter(
      layer =>
        layer.type === 'equalizer' && layer.equalizerSettings && layer.visible
    );
  }, [layers]);

  // Don't render anything if Web Audio API is not supported
  if (!isSupported) {
    return (
      <div className='audio-visualizer-error frost-card-secondary frost-p-4 frost-m-2'>
        <h3 className='frost-text-error'>❌ Audio Not Supported</h3>
        <p className='frost-text-secondary'>
          Web Audio API is not supported in this browser. Audio visualization
          features are disabled.
        </p>
      </div>
    );
  }

  return (
    <div className='audio-visualizer'>
      {/* Audio Controls */}
      <AudioControls
        audioContextState={audioContextState}
        isActive={isActive}
        onStart={handleAudioStart}
        onStop={handleAudioStop}
        onToggle={handleAudioToggle}
      />

      {/* Error Display */}
      {error && (
        <div className='audio-error frost-card-error frost-p-2 frost-m-2'>
          <span className='frost-text-error'>⚠️ {error}</span>
        </div>
      )}

      {/* Equalizer Components */}
      {equalizerLayers.map(layer => (
        <Equalizer key={layer.id} audioData={audioData} layer={layer} />
      ))}

      {/* Debug Frequency Analyzer (only shown in development) */}
      {process.env.NODE_ENV === 'development' && (
        <FrequencyAnalyzer
          audioData={audioData}
          showDebug={false} // Can be controlled by debug props
          className='debug-frequency-analyzer'
        />
      )}
    </div>
  );
};

export default AudioVisualizer;
