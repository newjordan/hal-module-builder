import React, { useEffect, useState } from 'react';
import { WebSocketService } from '../../services/WebSocketService';
import { HalEvent } from '../../types/widget-types';

export interface WidgetWebSocketConnectionProps {
  onEvent: (event: HalEvent) => void;
  url?: string;
}

export const WidgetWebSocketConnection: React.FC<
  WidgetWebSocketConnectionProps
> = ({ onEvent, url = 'ws://localhost:8765/hal-events' }) => {
  const [_wsService, setWsService] = useState<WebSocketService | null>(null);
  const [status, setStatus] = useState<string>('disconnected');
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Create WebSocket service
    const service = new WebSocketService({
      url,
      reconnect: true,
      reconnectInterval: 2000,
      maxRetries: 5,
    });

    // Listen for events
    const unsubscribeEvents = service.onEvent(event => {
      onEvent(event);
      setEventCount(prev => prev + 1);
    });

    // Listen for status changes
    const unsubscribeStatus = service.onStatusChange(newStatus => {
      setStatus(newStatus);
      console.log('WebSocket status:', newStatus);
    });

    setWsService(service);

    // Auto-connect
    service.connect().catch(error => {
      console.error('Failed to connect to WebSocket:', error);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeStatus();
      service.dispose();
    };
  }, [url, onEvent]);

  // Don't render anything in production widget mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Show connection status in development
  return (
    <div
      style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        fontSize: '10px',
        color: getStatusColor(status),
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '4px 8px',
        borderRadius: '4px',
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      <div>WS: {status}</div>
      <div>Events: {eventCount}</div>
    </div>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return '#44ff44';
    case 'connecting':
      return '#ffaa44';
    case 'error':
      return '#ff4444';
    default:
      return '#888888';
  }
}
