import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimationPromptInput } from '../components/AnimationStudio/AnimationPromptInput';
import '../components/AnimationStudio/timeline.css';
import { TimelineManager } from '../components/AnimationStudio/TimelineManager';
import { TimelineView } from '../components/AnimationStudio/TimelineView';
import {
  AnimationSequence,
  useAnimationOrchestrator,
} from '../hooks/useAnimationOrchestrator';
import { AnimationTimeline } from '../hooks/useTimelineManager';
import { Layer } from '../types/layer-types';
import './AnimationStudioModule.css';

export interface AnimationStudioModuleProps {
  layers: Layer[];
  onAddLayers?: (layers: Layer[]) => void;
  onUpdateLayer?: (layerId: string, updates: Partial<Layer>) => void;
  theme: 'frost_light' | 'frost_dark';
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export const AnimationStudioModule: React.FC<AnimationStudioModuleProps> = ({
  layers,
  onAddLayers,
  theme,
  isOpen,
  onClose,
  onMinimize,
  isMinimized = false,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'timeline' | 'manager'>(
    'prompt'
  );
  const moduleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 100, y: 100 });

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

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (
      e.target !== headerRef.current &&
      !headerRef.current?.contains(e.target as Node)
    )
      return;

    setIsDragging(true);
    const rect = moduleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !moduleRef.current) return;

      const newX = e.clientX - dragOffset.x;
      const newY = Math.max(0, e.clientY - dragOffset.y); // Prevent dragging above viewport

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('hal-animation-studio-position');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
      } catch (e) {
        console.warn('Failed to parse saved Animation Studio position');
      }
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem(
      'hal-animation-studio-position',
      JSON.stringify(position)
    );
  }, [position]);

  if (!isOpen) return null;

  const moduleClass = `
    animation-studio-module timeline-card fixed z-50 transition-all duration-300
    ${isMinimized ? 'minimized' : ''}
    ${isDragging ? 'dragging' : ''}
  `;

  const headerClass = `
    timeline-header header flex items-center justify-between px-4 py-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
  `;

  const tabButtonClass = (isActive: boolean) => `
    tab-button ${isActive ? 'is-active' : ''}
  `;

  return (
    <div
      ref={moduleRef}
      className={moduleClass}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? '320px' : '900px',
        minWidth: '320px',
        maxWidth: '95vw',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Module Header */}
      <div ref={headerRef} className={headerClass}>
        <div className='flex items-center space-x-3'>
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

          {!isMinimized && (
            <>
              {/* Tabs */}
              <div className='flex items-center space-x-1 ml-4'>
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

              {/* Stats */}
              <div
                className={
                  'flex items-center space-x-3 text-sm ml-auto timeline-text-muted'
                }
              >
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
            </>
          )}
        </div>

        <div className='flex items-center space-x-2'>
          {/* Minimize Button */}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className={
                'timeline-button timeline-button--ghost p-1 rounded transition-all'
              }
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '🔼' : '🔽'}
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className={
              'timeline-button timeline-button--ghost p-1 rounded transition-all'
            }
            title='Close Animation Studio'
          >
            ✕
          </button>
        </div>
      </div>

      {/* Module Content */}
      {!isMinimized && (
        <div
          className='content flex-1 overflow-hidden p-4'
          style={{ height: '320px' }}
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
      )}
    </div>
  );
};

export default AnimationStudioModule;
