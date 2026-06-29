import React, { useState, useCallback } from 'react';
import { Layer } from '../types/layer-types';
import { AnimationStudioModule } from '../modules/AnimationStudioModule';

export interface AnimationStudioLauncherProps {
  layers: Layer[];
  onAddLayers?: (layers: Layer[]) => void;
  onUpdateLayer?: (layerId: string, updates: Partial<Layer>) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

export const AnimationStudioLauncher: React.FC<
  AnimationStudioLauncherProps
> = ({ layers, onAddLayers, onUpdateLayer, theme, className = '' }) => {
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isStudioMinimized, setIsStudioMinimized] = useState(false);

  const handleOpenStudio = useCallback(() => {
    setIsStudioOpen(true);
    setIsStudioMinimized(false);
  }, []);

  const handleCloseStudio = useCallback(() => {
    setIsStudioOpen(false);
    setIsStudioMinimized(false);
  }, []);

  const handleMinimizeStudio = useCallback(() => {
    setIsStudioMinimized(!isStudioMinimized);
  }, [isStudioMinimized]);

  const launcherButtonClass = `
    ${className}
    group relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
    ${
      theme === 'frost_light'
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
        : 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl'
    }
    transform hover:scale-105 active:scale-95
  `;

  return (
    <>
      {/* Launcher Button */}
      {!isStudioOpen && (
        <button
          onClick={handleOpenStudio}
          className={launcherButtonClass}
          title='Open Animation Studio'
        >
          <span className='text-lg'>🎬</span>
          <span>Animation Studio</span>

          {/* Glow effect */}
          <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200 blur-xl'></div>

          {/* Shine effect */}
          <div className='absolute inset-0 rounded-lg overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out'></div>
          </div>
        </button>
      )}

      {/* Quick Access Button (when studio is open but minimized) */}
      {isStudioOpen && isStudioMinimized && (
        <button
          onClick={() => setIsStudioMinimized(false)}
          className={`
            fixed bottom-4 left-4 z-40 p-3 rounded-full shadow-lg transition-all duration-300
            ${
              theme === 'frost_light'
                ? 'bg-white/90 backdrop-blur-lg border border-gray-200 text-gray-700 hover:bg-white'
                : 'bg-gray-800/90 backdrop-blur-lg border border-gray-600 text-gray-200 hover:bg-gray-700'
            }
            transform hover:scale-110 active:scale-95
          `}
          title='Restore Animation Studio'
        >
          <span className='text-xl'>🎬</span>
        </button>
      )}

      {/* Animation Studio Module */}
      <AnimationStudioModule
        layers={layers}
        {...(onAddLayers !== undefined ? { onAddLayers } : {})}
        {...(onUpdateLayer !== undefined ? { onUpdateLayer } : {})}
        theme={theme}
        isOpen={isStudioOpen}
        onClose={handleCloseStudio}
        onMinimize={handleMinimizeStudio}
        isMinimized={isStudioMinimized}
      />
    </>
  );
};

export default AnimationStudioLauncher;
