// HAL Widget Event System Types

export interface HalEvent {
  id?: string;
  type: string;
  timestamp?: number;
  data?: any;

  // Visual properties
  effect?: VisualEffect;
  color?: string;
  intensity?: number; // 0-1
  duration?: number; // milliseconds
  layer?: string;

  // Metadata
  source?: string;
  correlation?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export type VisualEffect =
  | 'pulse'
  | 'wave'
  | 'flash'
  | 'spiral'
  | 'shake'
  | 'glow'
  | 'ripple'
  | 'particles'
  | 'lightning'
  | 'constellation'
  | 'matrix_rain'
  | 'fire'
  | 'water'
  | 'crystallize'
  | 'shatter';

export interface WidgetSettings {
  // Window properties
  size: number;
  position?: { x: number; y: number };
  opacity: number;
  clickThrough: boolean;
  alwaysOnTop: boolean;

  // Visual properties
  theme: 'dark' | 'light' | 'auto';
  backgroundColor: string;
  borderRadius: number;

  // Behavior
  showControls: boolean;
  autoHide: boolean;
  focusMode: boolean;

  // Performance
  maxEvents: number;
  frameRate: number;
  enableAnimations: boolean;
}

export interface VisualCommand {
  effect: VisualEffect;
  timestamp: number;
  properties: {
    color?: string;
    intensity?: number;
    duration?: number;
    position?: { x: number; y: number };
    scale?: number;
    rotation?: number;
    opacity?: number;
    [key: string]: any;
  };
}

export interface EventMapping {
  pattern: string | RegExp;
  effect: VisualEffect;
  color?: string;
  intensity?: number;
  duration?: number;
  condition?: (event: HalEvent) => boolean;
  transform?: (event: HalEvent) => Partial<HalEvent>;
}

export interface ConnectionConfig {
  type: 'websocket' | 'webhook' | 'ipc' | 'file_watch';
  enabled: boolean;
  settings: {
    [key: string]: any;
  };
}

export interface WebSocketConfig extends ConnectionConfig {
  type: 'websocket';
  settings: {
    url: string;
    auth?: {
      type: 'bearer' | 'basic' | 'none';
      token?: string;
      username?: string;
      password?: string;
    };
    reconnect: boolean;
    reconnectInterval: number;
    maxRetries: number;
  };
}

export interface WebhookConfig extends ConnectionConfig {
  type: 'webhook';
  settings: {
    port: number;
    endpoint: string;
    auth?: {
      type: 'bearer' | 'basic' | 'none';
      token?: string;
    };
    cors: boolean;
    rateLimit?: {
      windowMs: number;
      max: number;
    };
  };
}

// Electron API types
declare global {
  interface Window {
    electronAPI?: {
      createWidget: () => Promise<boolean>;
      closeWidget: () => Promise<boolean>;
      getWidgetStatus: () => Promise<boolean>;
      sendWidgetEvent: (eventData: HalEvent) => void;
      onHalEvent: (callback: (event: any, data: HalEvent) => void) => void;
      removeHalEventListener: (
        callback: (event: any, data: HalEvent) => void
      ) => void;
      updateWidgetSettings: (settings: any) => void;
      onWidgetFocused: (callback: () => void) => void;
      onWidgetBlurred: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      isElectron: boolean;
      platform: string;
    };
  }
}
