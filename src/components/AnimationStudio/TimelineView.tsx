import React, { useCallback, useRef, useState } from 'react';
import {
  AnimationTimeline,
  TimelineKeyframe,
  TimelineTrack,
  useTimelineManager,
} from '../../hooks/useTimelineManager';
import { Layer } from '../../types/layer-types';
import './timeline.css';

export interface TimelineViewProps {
  timeline: AnimationTimeline;
  onTimelineUpdate: (timeline: AnimationTimeline) => void;
  layers: Layer[];
  theme: 'light' | 'dark';
  className?: string;
}

interface DragState {
  isDragging: boolean;
  dragType: 'keyframe' | 'playhead' | 'selection';
  dragData?: {
    keyframeId?: string;
    trackId?: string;
    startTime?: number;
    startX?: number;
  };
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  layers,
  theme: _theme,
  className = '',
}) => {
  const timelineManager = useTimelineManager(layers, timeline);
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'keyframe',
  });

  // Constants for layout
  const TRACK_HEIGHT = 48;
  const RULER_HEIGHT = 32;
  const TRACK_HEADER_WIDTH = 200;
  const PIXEL_PER_SECOND = 100;

  /**
   * Convert time to pixel position
   */
  const timeToPixel = useCallback(
    (time: number): number => {
      return (
        (time / 1000) * PIXEL_PER_SECOND * timeline.zoom - timeline.viewStart
      );
    },
    [timeline.zoom, timeline.viewStart]
  );

  /**
   * Convert pixel position to time
   */
  const pixelToTime = useCallback(
    (pixel: number): number => {
      return (
        ((pixel + timeline.viewStart) / (PIXEL_PER_SECOND * timeline.zoom)) *
        1000
      );
    },
    [timeline.zoom, timeline.viewStart]
  );

  /**
   * Handle playhead scrubbing
   */
  const handlePlayheadDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - TRACK_HEADER_WIDTH;
      const newTime = Math.max(0, Math.min(timeline.duration, pixelToTime(x)));

      timelineManager.seekTo(newTime);
    },
    [timeline.duration, pixelToTime, timelineManager]
  );

  /**
   * Handle keyframe dragging
   */
  const handleKeyframeDrag = useCallback(
    (e: React.MouseEvent, keyframe: TimelineKeyframe, track: TimelineTrack) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startTime = keyframe.time;

      setDragState({
        isDragging: true,
        dragType: 'keyframe',
        dragData: {
          keyframeId: keyframe.id,
          trackId: track.id,
          startTime,
          startX,
        },
      });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!timelineRef.current || !dragState.dragData) return;

        const deltaX = moveEvent.clientX - startX;
        const deltaTime = (deltaX / (PIXEL_PER_SECOND * timeline.zoom)) * 1000;
        const newTime = Math.max(
          0,
          Math.min(timeline.duration, startTime + deltaTime)
        );

        timelineManager.updateKeyframe(keyframe.id, { time: newTime });
      };

      const handleMouseUp = () => {
        setDragState({ isDragging: false, dragType: 'keyframe' });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [dragState.dragData, timeline.duration, timeline.zoom, timelineManager]
  );

  /**
   * Handle timeline zoom
   */
  const handleZoom = useCallback(
    (delta: number, centerX?: number) => {
      const newZoom = Math.max(0.1, Math.min(5, timeline.zoom + delta * 0.1));

      if (centerX) {
        // Zoom toward cursor position
        const centerTime = pixelToTime(centerX);
        const newViewStart =
          centerTime -
          (centerTime - timeline.viewStart) * (newZoom / timeline.zoom);

        timelineManager.setZoom(newZoom);
        timelineManager.setViewport(
          newViewStart,
          newViewStart + timeline.viewEnd - timeline.viewStart
        );
      } else {
        timelineManager.setZoom(newZoom);
      }
    },
    [
      timeline.zoom,
      timeline.viewStart,
      timeline.viewEnd,
      pixelToTime,
      timelineManager,
    ]
  );

  /**
   * Render time ruler with markers
   */
  const renderRuler = () => {
    const markers = [];

    // Calculate appropriate step size based on zoom
    const stepSeconds =
      timeline.zoom > 2
        ? 0.1
        : timeline.zoom > 1
          ? 0.5
          : timeline.zoom > 0.5
            ? 1
            : 5;

    for (let time = 0; time <= timeline.duration; time += stepSeconds * 1000) {
      const x = timeToPixel(time);
      const isSecond = time % 1000 === 0;
      const height = isSecond ? 20 : 12;

      markers.push(
        <div
          key={time}
          className={'absolute timeline-grid-line'}
          style={{
            left: x,
            top: RULER_HEIGHT - height,
            height,
          }}
        />
      );

      if (isSecond) {
        markers.push(
          <div
            key={`label-${time}`}
            className={'timeline-label'}
            style={{
              left: x + 4,
              top: 4,
            }}
          >
            {(time / 1000).toFixed(1)}s
          </div>
        );
      }
    }

    return (
      <div
        ref={rulerRef}
        className={'timeline-ruler'}
        style={{ height: RULER_HEIGHT, marginLeft: TRACK_HEADER_WIDTH }}
        onMouseDown={handlePlayheadDrag}
      >
        {markers}

        {/* Playhead */}
        <div
          className='timeline-playhead'
          style={{
            left: timeToPixel(timeline.currentTime),
            top: 0,
            height: RULER_HEIGHT,
          }}
        />

        {/* Playhead handle */}
        <div
          className='timeline-playhead-handle'
          style={{
            left: timeToPixel(timeline.currentTime) - 6,
            top: -2,
            width: 14,
            height: 8,
          }}
        />
      </div>
    );
  };

  /**
   * Render individual keyframe
   */
  const renderKeyframe = (keyframe: TimelineKeyframe, track: TimelineTrack) => {
    const isSelected = timeline.selectedKeyframes.includes(keyframe.id);

    return (
      <div
        key={keyframe.id}
        className={`timeline-keyframe ${isSelected ? 'timeline-keyframe--selected' : ''}`}
        style={{
          left: timeToPixel(keyframe.time),
          top: TRACK_HEIGHT / 2,
          width: 12,
          height: 12,
        }}
        onMouseDown={e => handleKeyframeDrag(e, keyframe, track)}
        onClick={e => {
          e.stopPropagation();
          timelineManager.selectKeyframes([keyframe.id]);
        }}
        title={`${track.property}: ${keyframe.value} at ${(keyframe.time / 1000).toFixed(2)}s`}
      />
    );
  };

  /**
   * Render track header controls
   */
  const renderTrackHeader = (track: TimelineTrack, layer?: Layer) => {
    return (
      <div
        className={'timeline-track-header'}
        style={{ width: TRACK_HEADER_WIDTH, height: TRACK_HEIGHT }}
      >
        {/* Track controls */}
        <div className='timeline-control-group'>
          {/* Solo button */}
          <button
            className={`timeline-icon-button ${track.solo ? 'is-active' : ''}`}
            onClick={() => timelineManager.toggleTrackSolo(track.id)}
            title='Solo track'
          >
            S
          </button>

          {/* Mute button */}
          <button
            className={`timeline-icon-button ${track.muted ? 'is-active' : ''}`}
            onClick={() => timelineManager.toggleTrackMute(track.id)}
            title='Mute track'
          >
            M
          </button>

          {/* Lock button */}
          <button
            className={`timeline-icon-button ${track.locked ? 'is-active' : ''}`}
            onClick={() => timelineManager.toggleTrackLock(track.id)}
            title='Lock track'
          >
            🔒
          </button>
        </div>

        {/* Track name */}
        <div className='ml-3 flex-1 min-w-0'>
          <div className={'text-sm font-medium timeline-text-primary truncate'}>
            {layer ? layer.name : track.layerId}
          </div>
          <div className={'text-xs timeline-text-muted truncate'}>
            {track.property}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render individual track
   */
  const renderTrack = (track: TimelineTrack, index: number) => {
    const layer = layers.find(l => l.id === track.layerId);

    return (
      <div
        key={track.id}
        className={`timeline-track-row ${index % 2 === 0 ? 'timeline-track--even' : 'timeline-track--odd'}`}
        style={{ height: TRACK_HEIGHT }}
      >
        {/* Track Header */}
        {renderTrackHeader(track, layer)}

        {/* Track Timeline */}
        <div
          className={'timeline-track-timeline'}
          style={{
            minWidth:
              (timeline.duration / 1000) * PIXEL_PER_SECOND * timeline.zoom,
          }}
        >
          {/* Keyframes */}
          {track.keyframes.map(keyframe => renderKeyframe(keyframe, track))}

          {/* Track curve visualization (simplified) */}
          {track.keyframes.length > 1 && (
            <svg
              className='absolute inset-0 pointer-events-none'
              style={{ width: '100%', height: '100%' }}
            >
              <polyline
                points={track.keyframes
                  .map(kf => `${timeToPixel(kf.time)},${TRACK_HEIGHT / 2}`)
                  .join(' ')}
                fill='none'
                stroke={'var(--timeline-accent-primary)'}
                strokeWidth='2'
                opacity='0.5'
              />
            </svg>
          )}
        </div>
      </div>
    );
  };

  /**
   * Handle wheel events for zooming and scrolling
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const rect = timelineRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = e.clientX - rect.left - TRACK_HEADER_WIDTH;
          handleZoom(-e.deltaY / 100, centerX);
        }
      } else {
        // Horizontal scroll
        const scrollAmount = e.deltaX || e.deltaY;
        const newViewStart = Math.max(0, timeline.viewStart + scrollAmount);
        const viewWidth = timeline.viewEnd - timeline.viewStart;
        const maxViewStart = Math.max(
          0,
          (timeline.duration / 1000) * PIXEL_PER_SECOND * timeline.zoom -
            viewWidth
        );

        timelineManager.setViewport(
          Math.min(newViewStart, maxViewStart),
          Math.min(
            newViewStart + viewWidth,
            (timeline.duration / 1000) * PIXEL_PER_SECOND * timeline.zoom
          )
        );
      }
    },
    [
      handleZoom,
      timeline.viewStart,
      timeline.viewEnd,
      timeline.duration,
      timeline.zoom,
      timelineManager,
    ]
  );

  return (
    <div
      ref={timelineRef}
      className={`${className} timeline-panel`}
      onWheel={handleWheel}
    >
      {/* Timeline Controls */}
      <div className='timeline-header'>
        <div className='flex items-center space-x-2'>
          <button
            className={'timeline-button'}
            onClick={() =>
              timeline.playbackState === 'playing'
                ? timelineManager.pause()
                : timelineManager.play()
            }
          >
            {timeline.playbackState === 'playing' ? '⏸️' : '▶️'}
          </button>

          <button
            className={'timeline-button'}
            onClick={() => timelineManager.stop()}
          >
            ⏹️
          </button>
        </div>

        <div className='ml-auto flex items-center space-x-4'>
          <span className={'text-sm timeline-text-muted'}>
            {(timeline.currentTime / 1000).toFixed(2)}s /{' '}
            {(timeline.duration / 1000).toFixed(2)}s
          </span>

          <div className='flex items-center space-x-2'>
            <span className={'text-sm timeline-text-muted'}>Zoom:</span>
            <input
              type='range'
              min='0.1'
              max='5'
              step='0.1'
              value={timeline.zoom}
              onChange={e =>
                handleZoom(parseFloat(e.target.value) - timeline.zoom)
              }
              className='w-16'
            />
            <span className={'text-sm timeline-text-muted'}>
              {timeline.zoom.toFixed(1)}x
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Ruler */}
      {renderRuler()}

      {/* Timeline Tracks */}
      <div className='timeline-tracks overflow-auto max-h-96'>
        {timeline.tracks.map((track, index) => renderTrack(track, index))}

        {timeline.tracks.length === 0 && (
          <div
            className={
              'flex items-center justify-center py-8 timeline-text-muted'
            }
          >
            No animation tracks. Add keyframes to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
