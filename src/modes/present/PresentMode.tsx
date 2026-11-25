import { useState, useEffect, useCallback } from 'react';
import { HalComposite } from '../../components/HalComposite/HalComposite';
import { Layer } from '../../types/layer-types';
import { useMode } from '../ModeContext';
import { useAudioContext } from '../../hooks/useAudioContext';
import { presentAudioHint } from '../../utils/audio/audioCapability';

interface PresentModeProps {
  layers: Layer[];
  theme?: 'frost_light' | 'frost_dark';
  onDoubleClick?: () => void;
}

export function PresentMode({
  layers,
  theme = 'frost_dark',
  onDoubleClick,
}: PresentModeProps) {
  const { setMode } = useMode();
  const [size, setSize] = useState(400);

  // Real microphone audio — same pipeline as Design mode.
  // Missing Web Audio or a microphone leaves the design on screen.
  const { audioData, isActive, toggleAudio, isSupported, unavailableReason } =
    useAudioContext(layers, {
      fftSize: 128,
    });
  const hint = presentAudioHint(isSupported, isActive, unavailableReason);

  // Calculate optimal size based on viewport
  useEffect(() => {
    const updateSize = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      // Use 60% of the smaller dimension, capped at 600px
      setSize(Math.min(Math.floor(minDimension * 0.6), 600));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleClick = useCallback(() => {
    if (!isSupported) return;
    void toggleAudio();
  }, [isSupported, toggleAudio]);

  const handleDoubleClick = useCallback(() => {
    if (onDoubleClick) {
      onDoubleClick();
    } else {
      // Default: switch to design mode
      setMode('design');
    }
  }, [onDoubleClick, setMode]);

  return (
    <div
      className='present-mode'
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          theme === 'frost_dark'
            ? 'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)'
            : 'radial-gradient(ellipse at center, #f0f0f5 0%, #d0d0e0 100%)',
        overflow: 'hidden',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Subtle ambient glow when active */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            width: size * 2,
            height: size * 2,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255, 80, 30, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
      )}

      {/* The HAL composite */}
      <div
        style={{
          position: 'relative',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: isActive
            ? '0 0 60px rgba(255, 60, 20, 0.25), 0 0 120px rgba(255, 60, 20, 0.08)'
            : '0 10px 40px rgba(0, 0, 0, 0.3)',
          transition: 'box-shadow 0.5s ease',
        }}
      >
        <HalComposite
          size={size}
          isActive={isActive}
          audioData={audioData}
          layers={layers}
          onClick={handleClick}
          theme={theme}
          debugOverlay={false}
        />
      </div>

      {/* Minimal hint text */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          color:
            theme === 'frost_dark'
              ? 'rgba(255, 255, 255, 0.3)'
              : 'rgba(0, 0, 0, 0.3)',
          fontSize: '12px',
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: hint ? 1 : 0,
          transition: 'opacity 0.3s ease',
          maxWidth: 420,
          lineHeight: 1.4,
        }}
        role='status'
      >
        {hint}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
