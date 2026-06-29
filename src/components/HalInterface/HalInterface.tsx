import React from 'react';
import { Layer } from '../../types/layer-types';
import { HalComposite } from '../HalComposite';

interface HalInterfaceProps {
  layers: Layer[];
  isActive: boolean;
  audioData: any;
  onHalClick: () => void;
  theme: 'frost_light' | 'frost_dark';
  debugOverlay: boolean;
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  setDebugOverlay: (show: boolean) => void;
  onThemeToggle: () => void;
  onAddLayers?: (layers: Layer[]) => void;
  onUpdateLayer?: (layerId: string, updates: Partial<Layer>) => void;
}

export const HalInterface: React.FC<HalInterfaceProps> = ({
  layers,
  isActive,
  audioData,
  onHalClick,
  theme,
  debugOverlay,
  showControls,
  setShowControls,
  setDebugOverlay,
  onThemeToggle,
  onAddLayers: _onAddLayers,
  onUpdateLayer: _onUpdateLayer,
}) => {
  const size = 400;

  return (
    <div className='main-canvas'>
      <div className='hal-center-container'>
        <h1 className='hal-title frost-text-primary'>
          HAL 9000 LAYER COMPOSER
        </h1>

        <HalComposite
          size={size}
          isActive={isActive}
          audioData={audioData}
          layers={layers}
          onClick={onHalClick}
          theme={theme}
          debugOverlay={debugOverlay}
        />

        <p className='hal-subtitle frost-text-secondary'>
          Click HAL to {isActive ? 'stop' : 'start'} listening
        </p>
      </div>

      {/* Toggle Controls + Debug Overlay Buttons */}
      <div className='frost-flex frost-gap-2'>
        <button
          onClick={() => setShowControls(!showControls)}
          className={`frost-btn frost-btn-outline ${
            showControls ? 'frost-btn-primary' : ''
          }`}
          title='Toggle layer controls panel'
        >
          {showControls ? '🎛️ Hide' : '🎛️ Show'} Controls
        </button>

        <button
          onClick={() => setDebugOverlay(!debugOverlay)}
          className={`frost-btn frost-btn-outline ${
            debugOverlay ? 'frost-btn-accent' : ''
          }`}
          title='Toggle debug overlay for all layers'
        >
          {debugOverlay ? '🔍 Hide' : '🔍 Show'} Debug
        </button>

        <button
          onClick={onThemeToggle}
          className='frost-btn frost-btn-outline frost-btn-secondary'
          title='Switch between light and dark theme'
        >
          {theme === 'frost_light' ? '🌙' : '☀️'} Theme
        </button>
      </div>
    </div>
  );
};
