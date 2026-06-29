// API and service-related types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Storage service types
export interface StorageOptions {
  compress?: boolean;
  encrypt?: boolean;
  version?: string;
}

export interface StoredItem<T = unknown> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
}

// Event bus types
export interface EventBusEvent {
  type: string;
  payload?: unknown;
  timestamp: number;
  source?: string;
}

export type EventCallback<T = unknown> = (payload: T) => void;

export interface EventSubscription {
  id: string;
  type: string;
  callback: EventCallback;
  once: boolean;
}
