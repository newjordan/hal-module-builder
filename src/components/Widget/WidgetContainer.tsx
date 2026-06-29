import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetControls } from './WidgetControls';
import { WidgetWebSocketConnection } from './WidgetWebSocketConnection';
import { HalEvent } from '../../types/widget-types';

export interface WidgetContainerProps {
  className?: string;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  className = '',
}) => {
  const [events, setEvents] = useState<HalEvent[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [settings, setSettings] = useState({
    size: 200,
    opacity: 1,
    clickThrough: false,
    showControls: true,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for events from the main window
  useEffect(() => {
    if (!window.electronAPI?.onHalEvent) return;

    const handleEvent = (_: any, eventData: HalEvent) => {
      console.log('Widget received event:', eventData);
      setEvents(prev => [...prev.slice(-9), eventData]); // Keep last 10 events
    };

    window.electronAPI!.onHalEvent(handleEvent);

    return () => {
      window.electronAPI?.removeHalEventListener(handleEvent);
    };
  }, []);

  // Listen for focus state changes
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleFocus = () => setIsHovered(true);
    const handleBlur = () => setIsHovered(false);

    window.electronAPI!.onWidgetFocused(handleFocus);
    window.electronAPI!.onWidgetBlurred(handleBlur);

    return () => {
      window.electronAPI?.removeAllListeners('widget-focused');
      window.electronAPI?.removeAllListeners('widget-blurred');
    };
  }, []);

  // Apply settings to Electron window
  useEffect(() => {
    if (window.electronAPI?.updateWidgetSettings) {
      window.electronAPI.updateWidgetSettings({
        size: { width: settings.size, height: settings.size },
        opacity: settings.opacity,
        clickThrough: settings.clickThrough,
      });
    }
  }, [settings]);

  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Handle incoming WebSocket events
  const handleWebSocketEvent = useCallback((event: HalEvent) => {
    console.log('Widget received WebSocket event:', event);
    setEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
  }, []);

  return (
    <div
      ref={containerRef}
      className={`widget-container ${className}`}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'transparent',
        cursor: isHovered ? 'move' : 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main widget renderer */}
      <WidgetRenderer events={events} settings={settings} />

      {/* Controls overlay (shown on hover) */}
      {isHovered && settings.showControls && (
        <WidgetControls
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {/* Drag handle (invisible but functional) */}
      <div
        className='widget-drag-handle'
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30px',
          cursor: 'move',
          zIndex: 1000,
        }}
      />

      {/* WebSocket connection for receiving events */}
      <WidgetWebSocketConnection onEvent={handleWebSocketEvent} />
    </div>
  );
};

export default WidgetContainer;
