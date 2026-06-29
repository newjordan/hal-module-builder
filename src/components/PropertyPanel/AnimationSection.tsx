import React, { useState, useCallback } from 'react';
import { Layer } from '../../types/layer-types';
import { AnimationStudio } from '../AnimationStudio/AnimationStudio';

export interface AnimationSectionProps {
  layer: Layer;
  theme: 'frost_light' | 'frost_dark';
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onAddLayers: (layers: Layer[]) => void;
  className?: string;
}

/**
 * AnimationSection Component
 * Adds animation capabilities to the property panel
 * Integrates with existing layer editing workflow
 */
export const AnimationSection: React.FC<AnimationSectionProps> = ({
  layer,
  theme,
  onUpdateLayer,
  onAddLayers,
  className = '',
}) => {
  const [showAnimationStudio, setShowAnimationStudio] = useState(false);

  // Theme-aware classes
  const sectionClass = `
    animation-section frost-space-y-3
    ${className}
  `;

  const headerClass = `
    frost-flex frost-items-center frost-justify-between
  `;

  const titleClass = `
    frost-text-sm frost-font-medium frost-flex frost-items-center frost-space-x-2
    ${theme === 'frost_light' ? 'frost-text-gray-700' : 'frost-text-gray-300'}
  `;

  const toggleButtonClass = `
    frost-px-3 frost-py-1 frost-rounded-lg frost-text-xs
    frost-transition-all frost-duration-200
    ${
      theme === 'frost_light'
        ? showAnimationStudio
          ? 'frostlight-button-action'
          : 'frost-text-teal-600 hover:frost-bg-teal-50 frost-border frost-border-teal-200'
        : showAnimationStudio
          ? 'frostdark-button-action'
          : 'frost-text-teal-400 hover:frost-bg-teal-900/20 frost-border frost-border-teal-700'
    }
  `;

  const statusClass = `
    frost-text-xs frost-px-2 frost-py-1 frost-rounded-full
    ${
      layer.animation && layer.animation !== 'none'
        ? theme === 'frost_light'
          ? 'frost-bg-green-100 frost-text-green-700'
          : 'frost-bg-green-900/30 frost-text-green-300'
        : theme === 'frost_light'
          ? 'frost-bg-gray-100 frost-text-gray-600'
          : 'frost-bg-gray-800 frost-text-gray-400'
    }
  `;

  const currentAnimationClass = `
    frost-text-xs frost-p-3 frost-rounded-lg frost-border
    ${
      theme === 'frost_light'
        ? 'frost-bg-teal-50 frost-border-teal-200 frost-text-teal-700'
        : 'frost-bg-teal-900/20 frost-border-teal-700 frost-text-teal-300'
    }
  `;

  // Handle adding generated animation layers
  const handleAnimationGenerated = useCallback(
    (newLayers: Layer[]) => {
      // Add the generated layers to the scene
      onAddLayers(newLayers);

      // Optionally close the studio after generation
      // setShowAnimationStudio(false);
    },
    [onAddLayers]
  );

  // Quick animation presets
  const quickPresets = [
    { name: 'Pulse', value: 'pulse', icon: '💓' },
    { name: 'Rotate', value: 'rotate', icon: '🔄' },
    { name: 'None', value: 'none', icon: '⏹️' },
  ];

  const applyQuickPreset = (animationType: string) => {
    onUpdateLayer(layer.id, {
      animation: animationType as any,
      animationSpeed: 1,
    });
  };

  return (
    <div className={sectionClass}>
      {/* Section Header */}
      <div className={headerClass}>
        <div className={titleClass}>
          <span>✨</span>
          <span>Animation</span>
          <div className={statusClass}>
            {layer.animation && layer.animation !== 'none'
              ? 'Active'
              : 'Inactive'}
          </div>
        </div>

        <button
          onClick={() => setShowAnimationStudio(!showAnimationStudio)}
          className={toggleButtonClass}
          title='Open Animation Studio'
        >
          {showAnimationStudio ? '✕ Close Studio' : '🎬 Open Studio'}
        </button>
      </div>

      {/* Current Animation Status */}
      {layer.animation && layer.animation !== 'none' && (
        <div className={currentAnimationClass}>
          <div className='frost-flex frost-items-center frost-justify-between frost-text-xs'>
            <span className='frost-font-medium'>Current Animation:</span>
            <span className='frost-capitalize'>{layer.animation}</span>
          </div>
          {layer.animationSpeed && (
            <div className='frost-text-xs frost-opacity-75 frost-mt-1'>
              Speed: {layer.animationSpeed}x
            </div>
          )}
        </div>
      )}

      {/* Quick Presets */}
      <div className='frost-space-y-2'>
        <div className='frost-text-xs frost-font-medium frost-opacity-75'>
          Quick Presets:
        </div>
        <div className='frost-flex frost-space-x-2'>
          {quickPresets.map(preset => (
            <button
              key={preset.value}
              onClick={() => applyQuickPreset(preset.value)}
              className={`
                frost-flex-1 frost-px-2 frost-py-2 frost-text-xs frost-rounded-lg
                frost-transition-all frost-duration-200 frost-border
                ${
                  layer.animation === preset.value
                    ? theme === 'frost_light'
                      ? 'frostlight-button-action'
                      : 'frostdark-button-action'
                    : theme === 'frost_light'
                      ? 'frost-text-gray-600 hover:frost-text-gray-800 hover:frost-bg-gray-100 frost-border-gray-200'
                      : 'frost-text-gray-400 hover:frost-text-gray-200 hover:frost-bg-gray-800 frost-border-gray-700'
                }
              `}
              title={`Apply ${preset.name} animation`}
            >
              <div className='frost-flex frost-flex-col frost-items-center frost-space-y-1'>
                <span className='frost-text-sm'>{preset.icon}</span>
                <span>{preset.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Animation Studio Modal */}
      {showAnimationStudio && (
        <div className='frost-fixed frost-inset-0 frost-bg-black/50 frost-backdrop-blur-sm frost-z-50 frost-flex frost-items-center frost-justify-center frost-p-4'>
          <div className='frost-max-w-4xl frost-w-full frost-max-h-[90vh] frost-overflow-hidden'>
            <AnimationStudio
              layers={[layer]}
              onLayerUpdate={onUpdateLayer}
              onAddLayers={handleAnimationGenerated}
              theme={theme}
              isOpen={showAnimationStudio}
              onClose={() => setShowAnimationStudio(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationSection;
