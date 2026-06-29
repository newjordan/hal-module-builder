import { HalEvent, WebSocketConfig } from '../types/widget-types';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface WebSocketServiceOptions {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxRetries?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'none';
    token?: string;
    username?: string;
    password?: string;
  };
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private options: WebSocketServiceOptions;
  private status: ConnectionStatus = 'disconnected';
  private retryCount = 0;
  private reconnectTimeout?: number | undefined;
  private eventListeners: Array<(event: HalEvent) => void> = [];
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];

  constructor(options: WebSocketServiceOptions) {
    this.options = {
      reconnect: true,
      reconnectInterval: 2000,
      maxRetries: 5,
      ...options,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.setStatus('connecting');

      try {
        // Add auth headers if needed
        const url = new URL(this.options.url);
        if (this.options.auth?.type === 'bearer' && this.options.auth.token) {
          url.searchParams.append('token', this.options.auth.token);
        }

        this.ws = new WebSocket(url.toString(), this.options.protocols);

        this.ws.onopen = () => {
          console.log('WebSocket connected to', this.options.url);
          this.retryCount = 0;
          this.setStatus('connected');
          resolve();
        };

        this.ws.onmessage = event => {
          this.handleMessage(event);
        };

        this.ws.onclose = event => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.ws = null;

          if (event.code !== 1000 && this.options.reconnect) {
            this.scheduleReconnect();
          } else {
            this.setStatus('disconnected');
          }
        };

        this.ws.onerror = error => {
          console.error('WebSocket error:', error);
          this.setStatus('error');
          reject(new Error('WebSocket connection failed'));
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        this.setStatus('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.options.reconnect = false; // Disable auto-reconnect

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  send(data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send data');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  onEvent(listener: (event: HalEvent) => void): () => void {
    this.eventListeners.push(listener);

    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);

    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      let data;

      if (typeof event.data === 'string') {
        try {
          data = JSON.parse(event.data);
        } catch {
          // If it's not JSON, treat as a simple event
          data = {
            type: 'message',
            data: event.data,
            timestamp: Date.now(),
          };
        }
      } else {
        data = event.data;
      }

      // Ensure it's a valid HalEvent
      const halEvent: HalEvent = {
        id: data.id || `ws_${Date.now()}_${Math.random()}`,
        type: data.type || 'unknown',
        timestamp: data.timestamp || Date.now(),
        data: data.data || data,
        effect: data.effect,
        color: data.color,
        intensity: data.intensity,
        duration: data.duration,
        layer: data.layer,
        source: data.source || 'websocket',
        correlation: data.correlation,
        priority: data.priority || 'normal',
      };

      // Notify all event listeners
      this.eventListeners.forEach(listener => {
        try {
          listener(halEvent);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to process WebSocket message:', error);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('Error in status listener:', error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= (this.options.maxRetries || 5)) {
      console.warn('Max reconnection attempts reached');
      this.setStatus('error');
      return;
    }

    this.retryCount++;
    const delay =
      (this.options.reconnectInterval || 2000) *
      Math.pow(1.5, this.retryCount - 1);

    console.log(
      `Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.retryCount})`
    );

    this.reconnectTimeout = window.setTimeout(() => {
      if (this.options.reconnect) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          this.scheduleReconnect();
        });
      }
    }, delay);
  }

  // Static factory method for easy configuration
  static create(config: WebSocketConfig): WebSocketService {
    const options: WebSocketServiceOptions = {
      url: config.settings.url,
      ...(config.settings.reconnect !== undefined && {
        reconnect: config.settings.reconnect,
      }),
      ...(config.settings.reconnectInterval !== undefined && {
        reconnectInterval: config.settings.reconnectInterval,
      }),
      ...(config.settings.maxRetries !== undefined && {
        maxRetries: config.settings.maxRetries,
      }),
      ...(config.settings.auth !== undefined && { auth: config.settings.auth }),
    };

    return new WebSocketService(options);
  }

  dispose(): void {
    this.disconnect();
    this.eventListeners = [];
    this.statusListeners = [];
  }
}
