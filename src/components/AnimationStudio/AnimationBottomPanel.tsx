import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  AnimationSequence,
  useAnimationOrchestrator,
} from '../../hooks/useAnimationOrchestrator';
import { AnimationTimeline } from '../../hooks/useTimelineManager';
import { Layer } from '../../types/layer-types';
import './AnimationBottomPanel.css';
import { AnimationPromptInput } from './AnimationPromptInput';
import { TimelineManager } from './TimelineManager';
import { TimelineView } from './TimelineView';

export interface AnimationBottomPanelProps {
  layers: Layer[];
  onAddLayers?: (layers: Layer[]) => void;
  onUpdateLayer?: (layerId: string, updates: Partial<Layer>) => void;
  theme: 'frost_light' | 'frost_dark';
  height: number;
  onHeightChange: (height: number) => void;
}

export const AnimationBottomPanel: React.FC<AnimationBottomPanelProps> = ({
  layers,
  onAddLayers,
  onUpdateLayer: _onUpdateLayer,
  theme,
  height,
  onHeightChange,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'timeline' | 'manager'>(
    'prompt'
  );
  const resizeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
        importedSequences.forEach(seq => {
          orchestrator.loadSequence(seq);
        });
      }

      if (onAddLayers && importedLayers.length > 0) {
        const fullLayers = importedLayers.map(layer => ({
          ...layer,
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

  // Handle resize drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startY = e.clientY;
      const startHeight = height;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = startY - e.clientY; // Inverted because we're dragging upward
        const viewport =
          typeof window !== 'undefined' ? window.innerHeight : 900;
        const min = 200;
        const max = Math.min(
          Math.max(320, Math.round(viewport * 0.75)),
          viewport - 80
        );
        const newHeight = Math.max(min, Math.min(max, startHeight + deltaY));
        onHeightChange(newHeight);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [height, onHeightChange]
  );

  // Theme-aware class names
  const panelClass = `
    animation-bottom-panel
  `;

  const headerClass = `
    panel-header flex items-center justify-between px-4 py-2
  `;

  const resizeHandleClass = `
    resize-handle
    ${isDragging ? 'dragging' : ''}
  `;

  const tabButtonClass = (isActive: boolean) => `
    tab-button ${isActive ? 'is-active' : ''}
  `;

  const statsClass = `
    stats-container flex items-center space-x-4 text-sm timeline-text-muted
  `;

  return (
    <>
      {/* Animation Panel */}
      <div ref={panelRef} className={panelClass} style={{ height }}>
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className={resizeHandleClass}
          onMouseDown={handleMouseDown}
        />

        {/* Panel Header */}
        <div className={headerClass}>
          <div className='flex items-center space-x-4'>
            {/* Title */}
            <div className='flex items-center space-x-2'>
              <span className='text-xl'>🎬</span>
              <h2 className={`text-lg font-semibold timeline-text-primary`}>
                Animation Studio
              </h2>
              <span className='text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-600'>
                v2.0
              </span>
            </div>

            {/* Tabs */}
            <div className='tab-container flex items-center space-x-1'>
              <button
                onClick={() => setActiveTab('prompt')}
                className={tabButtonClass(activeTab === 'prompt')}
              >
                ✨ Prompt
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={tabButtonClass(activeTab === 'timeline')}
              >
                🎞️ Timeline
              </button>
              <button
                onClick={() => setActiveTab('manager')}
                className={tabButtonClass(activeTab === 'manager')}
              >
                💾 Manager
              </button>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            {/* Stats */}
            <div className={statsClass}>
              <div className='flex items-center space-x-1'>
                <span>📚</span>
                <span>
                  {layers.length} layer{layers.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className='flex items-center space-x-1'>
                <span>🎵</span>
                <span>
                  {currentTimeline.tracks.length} track
                  {currentTimeline.tracks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Content */}
        <div
          className='panel-content flex-1 overflow-hidden p-4'
          style={{ height: height - 60 }}
        >
          {activeTab === 'prompt' && (
            <AnimationPromptInput
              onAnimationGenerated={onAddLayers || (() => {})}
              theme={theme}
              className='h-full'
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              timeline={currentTimeline}
              onTimelineUpdate={setCurrentTimeline}
              layers={layers}
              theme={theme === 'frost_light' ? 'light' : 'dark'}
              className='h-full'
            />
          )}

          {activeTab === 'manager' && (
            <TimelineManager
              timeline={currentTimeline}
              layers={layers}
              sequences={sequences}
              onTimelineImport={handleTimelineImport}
              theme={theme === 'frost_light' ? 'light' : 'dark'}
              className='h-full overflow-y-auto'
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AnimationBottomPanel;
