/**
 * AudioProcessor Component - Audio visualization controls and display
 * Extracted from HalModuleBuilder.tsx for better modularity and testing
 */
import React from 'react';
import { useAudio } from '../../hooks/useAudio';

export interface AudioProcessorProps {
  theme: 'frost_light' | 'frost_dark';
  isActive: boolean;
  onToggle: () => void;
  className?: string;
  showStatus?: boolean;
  showControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioProcessor: React.FC<AudioProcessorProps> = ({
  theme,
  isActive,
  onToggle,
  className = '',
  showStatus = true,
  showControls = true,
  size = 'md',
}) => {
  const { error, isLoading } = useAudio();

  const sizeClasses = {
    sm: 'frost-text-sm',
    md: 'frost-text-base',
    lg: 'frost-text-lg',
  };

  const buttonSizeClasses = {
    sm:
      theme === 'frost_light'
        ? 'frostlight-button-action-sm'
        : 'frostdark-button-action-sm',
    md:
      theme === 'frost_light'
        ? 'frostlight-button-action'
        : 'frostdark-button-action',
    lg:
      theme === 'frost_light'
        ? 'frostlight-button-action'
        : 'frostdark-button-action',
  };

  return (
    <div className={`audio-processor ${className} ${sizeClasses[size]}`}>
      {showControls && (
        <div className='audio-controls frost-mb-2'>
          <button
            onClick={onToggle}
            disabled={isLoading}
            className={`
              ${buttonSizeClasses[size]}
              frost-transition
              ${isLoading ? 'frost-opacity-50 frost-cursor-not-allowed' : ''}
            `}
            aria-label={`${isActive ? 'Stop' : 'Start'} audio visualization`}
          >
            {isLoading ? (
              <span className='frost-flex frost-items-center frost-gap-2'>
                <span className='frost-animate-spin frost-w-4 frost-h-4 frost-border-2 frost-border-current frost-border-t-transparent frost-rounded-full'></span>
                {isActive ? 'Stopping...' : 'Starting...'}
              </span>
            ) : (
              <>{isActive ? '⏹️ Stop' : '🎤 Start'} Audio</>
            )}
          </button>
        </div>
      )}

      {showStatus && (
        <div className='audio-status'>
          <div className='frost-flex frost-items-center frost-gap-2 frost-mb-2'>
            <div
              className={`
                frost-w-3 frost-h-3 frost-rounded-full frost-transition
                ${
                  isActive
                    ? 'frost-bg-green-500 frost-animate-pulse'
                    : error
                      ? 'frost-bg-red-500'
                      : 'frost-bg-gray-400'
                }
              `}
              aria-label={`Audio status: ${isActive ? 'active' : error ? 'error' : 'inactive'}`}
            />
            <span
              className={`
                frost-text-sm 
                ${theme === 'frost_light' ? 'frost-text-gray-600' : 'frost-text-gray-300'}
              `}
            >
              {isActive ? 'Listening...' : error ? 'Error' : 'Ready'}
            </span>
          </div>

          {error && (
            <div
              className={`
                frost-p-2 frost-rounded frost-text-sm frost-mb-2
                ${
                  theme === 'frost_light'
                    ? 'frost-bg-red-50 frost-text-red-700 frost-border frost-border-red-200'
                    : 'frost-bg-red-900/20 frost-text-red-300 frost-border frost-border-red-700/50'
                }
              `}
              role='alert'
            >
              <strong>Audio Error:</strong> {error}
              <br />
              <small>Please check microphone permissions and try again.</small>
            </div>
          )}

          {isActive && (
            <div
              className={`
                frost-text-xs 
                ${theme === 'frost_light' ? 'frost-text-gray-500' : 'frost-text-gray-400'}
              `}
            >
              Click HAL to stop listening
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioProcessor;
