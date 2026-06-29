/**
 * EventBus - Service for decoupled component communication
 * Implements publish-subscribe pattern for loose coupling
 */

type EventCallback<T = any> = (data: T) => void;

interface EventSubscription {
  id: string;
  callback: EventCallback;
  once?: boolean;
}

export class EventBus {
  private static instance: EventBus;
  private events: Map<string, EventSubscription[]> = new Map();
  private subscriptionCounter = 0;

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  on<T = any>(eventName: string, callback: EventCallback<T>): string {
    const subscriptionId = `sub_${++this.subscriptionCounter}`;

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName)!.push({
      id: subscriptionId,
      callback,
      once: false,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to an event that will only fire once
   */
  once<T = any>(eventName: string, callback: EventCallback<T>): string {
    const subscriptionId = `sub_${++this.subscriptionCounter}`;

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName)!.push({
      id: subscriptionId,
      callback,
      once: true,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from an event by subscription ID
   */
  off(subscriptionId: string): void {
    for (const [eventName, subscriptions] of this.events.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.events.delete(eventName);
        }
        break;
      }
    }
  }

  /**
   * Remove all subscriptions for an event
   */
  removeAllListeners(eventName: string): void {
    this.events.delete(eventName);
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T = any>(eventName: string, data?: T): void {
    const subscriptions = this.events.get(eventName);
    if (!subscriptions) return;

    // Create a copy to avoid issues if subscriptions are modified during emission
    const subscriptionsCopy = [...subscriptions];

    subscriptionsCopy.forEach(subscription => {
      try {
        subscription.callback(data);

        // Remove one-time subscriptions
        if (subscription.once) {
          this.off(subscription.id);
        }
      } catch (error) {
        console.error(
          `EventBus: Error in event handler for '${eventName}':`,
          error
        );
      }
    });
  }

  /**
   * Get list of all registered events
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get number of subscribers for an event
   */
  listenerCount(eventName: string): number {
    return this.events.get(eventName)?.length || 0;
  }

  /**
   * Clear all events and subscriptions (useful for cleanup)
   */
  clear(): void {
    this.events.clear();
    this.subscriptionCounter = 0;
  }
}

// Common event types for better type safety
export interface HALEvents {
  // Layer events
  'layer:created': { layer: any };
  'layer:updated': { layerId: string; updates: any };
  'layer:deleted': { layerId: string };
  'layer:selected': { layerId: string | null };
  'layer:reordered': { layerIds: string[] };

  // Audio events
  'audio:started': void;
  'audio:stopped': void;
  'audio:data': { data: number[] };
  'audio:error': { error: string };

  // Template events
  'template:saved': { presetId: string; name: string };
  'template:loaded': { presetId: string; layers: any[] };
  'template:deleted': { presetId: string };

  // Theme events
  'theme:changed': { theme: 'frost_light' | 'frost_dark' };

  // Performance events
  'performance:update': { fps: number; renderTime: number };
  'performance:warning': { metric: string; value: number };

  // UI events
  'ui:panel:toggle': { panel: string; visible: boolean };
  'ui:resize': { width: number; height: number };
}

// Type-safe event bus wrapper
export class TypedEventBus {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  on<K extends keyof HALEvents>(
    eventName: K,
    callback: (data: HALEvents[K]) => void
  ): string {
    return this.eventBus.on(eventName as string, callback);
  }

  once<K extends keyof HALEvents>(
    eventName: K,
    callback: (data: HALEvents[K]) => void
  ): string {
    return this.eventBus.once(eventName as string, callback);
  }

  off(subscriptionId: string): void {
    this.eventBus.off(subscriptionId);
  }

  emit<K extends keyof HALEvents>(eventName: K, data: HALEvents[K]): void {
    this.eventBus.emit(eventName as string, data);
  }

  removeAllListeners<K extends keyof HALEvents>(eventName: K): void {
    this.eventBus.removeAllListeners(eventName as string);
  }

  listenerCount<K extends keyof HALEvents>(eventName: K): number {
    return this.eventBus.listenerCount(eventName as string);
  }

  clear(): void {
    this.eventBus.clear();
  }
}

// Export singleton instances
export const eventBus = EventBus.getInstance();
export const typedEventBus = new TypedEventBus();

export default EventBus;
