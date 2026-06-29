/**
 * AudioControls Component - Audio visualization controls
 *
 * Extracted from HalModuleBuilder.tsx to provide modular audio control functionality.
 * Manages the start/stop/toggle of audio visualization and displays current state.
 */

import React from 'react';
import { AudioControlsProps } from './AudioVisualizer.types';

export const AudioControls: React.FC<AudioControlsProps> = ({
  audioContextState,
  isActive,
  onStart,
  onStop,
  onToggle,
}) => {
  // Get current theme classes
  const theme = document.documentElement.classList.contains('frost_dark')
    ? 'frost_dark'
    : 'frost_light';

  const themeClasses = {
    buttonAction:
      theme === 'frost_dark'
        ? 'frostdark-button-action'
        : 'frostlight-button-action',
    textSecondary:
      theme === 'frost_dark' ? 'frost-text-secondary' : 'frost-text-secondary',
  };

  // Status indicator based on audio context state
  const getStatusIndicator = () => {
    switch (audioContextState) {
      case 'running':
        return '🟢';
      case 'suspended':
        return '🟡';
      case 'interrupted':
        return '🔴';
      case 'closed':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const getStatusText = () => {
    if (isActive) {
      return audioContextState === 'running' ? 'Listening' : 'Audio Active';
    }
    return 'Audio Inactive';
  };

  return (
    <div className='audio-controls frost-flex frost-gap-2 frost-items-center'>
      {/* Main Toggle Button */}
      <button
        onClick={onToggle}
        className={themeClasses.buttonAction}
        aria-label={
          isActive ? 'Stop audio visualization' : 'Start audio visualization'
        }
      >
        {isActive ? '⏹️ Stop' : '▶️ Start'} Audio
      </button>

      {isActive && onStop && (
        <button
          onClick={onStop}
          className={themeClasses.buttonAction}
          aria-label='Stop audio visualization immediately'
        >
          Stop
        </button>
      )}

      {/* Reconnect Button (shown on interruption) */}
      {audioContextState === 'interrupted' && (
        <button
          onClick={() => onStart && onStart()}
          className={themeClasses.buttonAction}
          aria-label='Reconnect audio context'
          title='Attempt to reconnect microphone/audio'
        >
          🔄 Reconnect
        </button>
      )}

      {/* Status Indicator */}
      <div
        className={`audio-status frost-flex frost-items-center frost-gap-1 ${themeClasses.textSecondary}`}
      >
        <span
          className='status-indicator'
          title={`Audio Context: ${audioContextState}`}
        >
          {getStatusIndicator()}
        </span>
        <span className='status-text'>{getStatusText()}</span>
      </div>

      {/* Debug: log state */}
      <button
        onClick={() =>
          console.log('[AudioControls Debug]', { audioContextState, isActive })
        }
        className={themeClasses.buttonAction}
        aria-label='Log audio state'
        title='Log audio state'
      >
        🧪 Debug
      </button>

      {/* Additional control buttons removed to prevent duplication with main toggle button */}

      {/* Error state indicator */}
      {audioContextState === 'interrupted' && (
        <div className='audio-error frost-text-error'>
          ⚠️ Audio Error - Check microphone permissions
        </div>
      )}
    </div>
  );
};

export default AudioControls;
