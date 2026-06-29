import React, { useCallback, useMemo, useState } from 'react';
import { Layer } from '../../types/layer-types';
import { AnimationPromptInput } from './AnimationPromptInput';
import { TimelineManager } from './TimelineManager';
import { TimelineView } from './TimelineView';
import './timeline.css';

import {
  AnimationSequence,
  useAnimationOrchestrator,
} from '../../hooks/useAnimationOrchestrator';
import { AnimationTimeline } from '../../hooks/useTimelineManager';

export interface AnimationStudioProps {
  layers: Layer[];
  onLayerUpdate?: (layerId: string, updates: Partial<Layer>) => void;
  onAddLayers: (layers: Layer[]) => void;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AnimationStudio: React.FC<AnimationStudioProps> = ({
  layers,
  onLayerUpdate: _onLayerUpdate,
  onAddLayers,
  theme,
  className = '',
  isOpen = true,
  onClose,
}) => {
  const [activeView, setActiveView] = useState<
    'prompt' | 'timeline' | 'manager'
  >('prompt');

  // Create default timeline
  const defaultTimeline: AnimationTimeline = useMemo(
    () => ({
      id: `timeline_${Date.now()}`,
      name: 'Main Timeline',
      duration: 5000,
      currentTime: 0,
      tracks: [],
      playbackState: 'stopped',
      loop: false,
      selectedKeyframes: [],
      zoom: 1,
      viewStart: 0,
      viewEnd: 5000,
    }),
    []
  );

  // Timeline state management
  const [currentTimeline, setCurrentTimeline] =
    useState<AnimationTimeline>(defaultTimeline);
  const [sequences, setSequences] = useState<AnimationSequence[]>([]);

  // Hooks for animation systems
  const orchestrator = useAnimationOrchestrator();

  const handleTimelineImport = useCallback(
    (
      timeline: AnimationTimeline,
      importedLayers: Partial<Layer>[],
      importedSequences?: AnimationSequence[]
    ) => {
      setCurrentTimeline(timeline);

      if (importedSequences) {
        setSequences(importedSequences);
        // Load sequences into orchestrator
        importedSequences.forEach(seq => {
          orchestrator.loadSequence(seq);
        });
      }

      // Add imported layers if callback is available
      if (onAddLayers && importedLayers.length > 0) {
        const fullLayers = importedLayers.map(layer => ({
          ...layer,
          // Ensure required properties
          id: layer.id || `imported_${Date.now()}_${Math.random()}`,
          name: layer.name || 'Imported Layer',
          type: layer.type || 'shape',
          visible: layer.visible ?? true,
          opacity: layer.opacity ?? 1,
          blendMode: layer.blendMode || 'normal',
          scale: layer.scale ?? 1,
          rotation: layer.rotation ?? 0,
          offsetX: layer.offsetX ?? 0,
          offsetY: layer.offsetY ?? 0,
        })) as Layer[];

        onAddLayers(fullLayers);
      }
    },
    [onAddLayers, orchestrator]
  );

  // Theme-aware class names using frost glass system
  const containerClass = `
    animation-studio timeline-card frost-flex frost-flex-col
    ${className}
  `;

  const headerClass = `
    timeline-header frost-flex frost-items-center frost-justify-between frost-p-4
  `;

  const titleClass = `
    frost-text-lg frost-font-semibold frost-flex frost-items-center frost-space-x-2 timeline-text-primary
  `;

  const closeButtonClass = `
    timeline-button timeline-button--ghost frost-p-2 frost-rounded-lg frost-transition-all frost-duration-200
  `;

  const contentClass = `
    frost-flex-1 frost-overflow-hidden frost-p-6
  `;

  const statsClass = `
    frost-flex frost-items-center frost-space-x-4 frost-text-sm timeline-text-muted
  `;

  const statItemClass = `
    frost-flex frost-items-center frost-space-x-1
  `;

  if (!isOpen) return null;

  return (
    <div
      className={containerClass}
      style={{ minHeight: '500px', maxHeight: '80vh' }}
    >
      {/* Studio Header */}
      <div className={headerClass}>
        <div className={titleClass}>
          <span className='frost-text-2xl'>✨</span>
          <span>Animation Studio</span>
          <span className='frost-text-xs frost-px-2 frost-py-1 frost-rounded-full frost-bg-teal-500/20 frost-text-teal-600'>
            BETA
          </span>
        </div>

        <div className='frost-flex frost-items-center frost-space-x-4'>
          {/* Tabs */}
          <div className='frost-flex frost-items-center frost-space-x-1'>
            <button
              onClick={() => setActiveView('prompt')}
              className={`tab-button ${activeView === 'prompt' ? 'is-active' : ''}`}
            >
              ✨ Prompt
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`tab-button ${activeView === 'timeline' ? 'is-active' : ''}`}
            >
              🎬 Timeline
            </button>
            <button
              onClick={() => setActiveView('manager')}
              className={`tab-button ${activeView === 'manager' ? 'is-active' : ''}`}
            >
              💾 Manager
            </button>
          </div>

          {/* Stats */}
          <div className={statsClass}>
            <div className={statItemClass}>
              <span>📚</span>
              <span>
                {layers.length} layer{layers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className={statItemClass}>
              <span>🎵</span>
              <span>
                {currentTimeline.tracks.length} track
                {currentTimeline.tracks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className={closeButtonClass}
              title='Close Animation Studio'
            >
              <span className='frost-text-lg'>×</span>
            </button>
          )}
        </div>
      </div>

      {/* Studio Content */}
      <div className={contentClass}>
        {activeView === 'prompt' && (
          <AnimationPromptInput
            onAnimationGenerated={onAddLayers}
            theme={theme}
            className='frost-h-full'
          />
        )}

        {activeView === 'timeline' && (
          <TimelineView
            timeline={currentTimeline}
            onTimelineUpdate={setCurrentTimeline}
            layers={layers}
            theme={theme === 'frost_light' ? 'light' : 'dark'}
            className='frost-h-full'
          />
        )}

        {activeView === 'manager' && (
          <TimelineManager
            timeline={currentTimeline}
            layers={layers}
            sequences={sequences}
            onTimelineImport={handleTimelineImport}
            theme={theme === 'frost_light' ? 'light' : 'dark'}
            className='frost-h-full'
          />
        )}
      </div>

      {/* Footer */}
      <div
        className={`
        frost-px-6 frost-py-4 frost-border-t frost-text-xs
        ${
          theme === 'frost_light'
            ? 'frost-border-gray-200/60 frost-text-gray-500 frost-bg-gradient-to-r frost-from-gray-50/30 frost-to-white/50'
            : 'frost-border-gray-700/60 frost-text-gray-400 frost-bg-gradient-to-r frost-from-gray-900/30 frost-to-gray-800/50'
        }
      `}
      >
        <div className='frost-flex frost-items-center frost-justify-between'>
          <div className='frost-flex frost-items-center frost-space-x-4'>
            <span className='frost-flex frost-items-center frost-space-x-1'>
              <span>🚀</span>
              <span>HAL-9001 Animation Engine</span>
            </span>
            <span className='frost-opacity-60'>v2.0.0-beta</span>
          </div>

          <div className='frost-flex frost-items-center frost-space-x-2'>
            <span className='frost-opacity-60'>Press</span>
            <kbd
              className={`
              frost-px-2 frost-py-1 frost-rounded frost-text-xs frost-font-mono
              ${
                theme === 'frost_light'
                  ? 'frost-bg-gray-200/80 frost-text-gray-700'
                  : 'frost-bg-gray-700/80 frost-text-gray-300'
              }
            `}
            >
              ⌘+Enter
            </kbd>
            <span className='frost-opacity-60'>to generate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Animation Studio specific styles
export const animationStudioStyles = `
/* Animation Studio Component Styles */
.animation-studio {
  position: relative;
  min-width: 600px;
  max-width: 900px;
  overflow: hidden;
}

.animation-studio .frost_light {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(206, 247, 253, 0.80) 25%,
    rgba(240, 249, 255, 0.90) 50%,
    rgba(236, 254, 255, 0.85) 75%,
    rgba(255, 255, 255, 0.95) 100%
  );
}

.animation-studio .frost_dark {
  background: linear-gradient(
    145deg,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.90) 25%,
    rgba(51, 65, 85, 0.85) 50%,
    rgba(71, 85, 105, 0.90) 75%,
    rgba(100, 116, 139, 0.95) 100%
  );
}

/* Prompt input specific styles */
.prompt-textarea {
  min-height: 80px;
  max-height: 160px;
  resize: vertical;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.4;
}

.suggestions-panel {
  animation: slideDown 0.2s ease-out;
  transform-origin: top;
}

.result-panel {
  animation: slideUp 0.3s ease-out;
  transform-origin: bottom;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Scrollbar styling for examples */
.examples-section .frost-max-h-64::-webkit-scrollbar {
  width: 6px;
}

.examples-section .frost-max-h-64::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.examples-section .frost-max-h-64::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.5);
  border-radius: 3px;
}

.examples-section .frost-max-h-64::-webkit-scrollbar-thumb:hover {
  background: rgba(20, 184, 166, 0.7);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .animation-studio {
    min-width: 100%;
    max-width: 100%;
    border-radius: 0;
    min-height: 100vh;
  }
}
`;

export default AnimationStudio;
