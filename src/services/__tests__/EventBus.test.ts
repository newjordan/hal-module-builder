/**
 * EventBus Tests
 * Tests for publish-subscribe pattern implementation
 */
import { EventBus, TypedEventBus } from '../EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventBus.getInstance();
      const instance2 = EventBus.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to events', () => {
      const callback = jest.fn();
      const subscriptionId = eventBus.on('test-event', callback);

      expect(typeof subscriptionId).toBe('string');
      expect(eventBus.listenerCount('test-event')).toBe(1);
    });

    it('should subscribe to one-time events', () => {
      const callback = jest.fn();
      const subscriptionId = eventBus.once('test-event', callback);

      expect(typeof subscriptionId).toBe('string');
      expect(eventBus.listenerCount('test-event')).toBe(1);
    });

    it('should handle multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventBus.on('test-event', callback1);
      eventBus.on('test-event', callback2);

      expect(eventBus.listenerCount('test-event')).toBe(2);
    });
  });

  describe('Event Emission', () => {
    it('should emit events to all subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const testData = { message: 'Hello World' };

      eventBus.on('test-event', callback1);
      eventBus.on('test-event', callback2);

      eventBus.emit('test-event', testData);

      expect(callback1).toHaveBeenCalledWith(testData);
      expect(callback2).toHaveBeenCalledWith(testData);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should emit events without data', () => {
      const callback = jest.fn();

      eventBus.on('test-event', callback);
      eventBus.emit('test-event');

      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('should handle non-existent events gracefully', () => {
      expect(() => {
        eventBus.emit('non-existent-event', 'data');
      }).not.toThrow();
    });
  });

  describe('One-time Events', () => {
    it('should automatically unsubscribe after first emission', () => {
      const callback = jest.fn();

      eventBus.once('test-event', callback);

      eventBus.emit('test-event', 'first');
      eventBus.emit('test-event', 'second');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
      expect(eventBus.listenerCount('test-event')).toBe(0);
    });
  });

  describe('Event Unsubscription', () => {
    it('should unsubscribe by subscription ID', () => {
      const callback = jest.fn();
      const subscriptionId = eventBus.on('test-event', callback);

      eventBus.off(subscriptionId);

      expect(eventBus.listenerCount('test-event')).toBe(0);

      eventBus.emit('test-event', 'data');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle invalid subscription IDs gracefully', () => {
      expect(() => {
        eventBus.off('invalid-id');
      }).not.toThrow();
    });

    it('should remove all listeners for an event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventBus.on('test-event', callback1);
      eventBus.on('test-event', callback2);

      eventBus.removeAllListeners('test-event');

      expect(eventBus.listenerCount('test-event')).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', () => {
      const throwingCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      eventBus.on('test-event', throwingCallback);
      eventBus.on('test-event', normalCallback);

      eventBus.emit('test-event', 'data');

      expect(throwingCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('EventBus: Error in event handler'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Utility Methods', () => {
    it('should return event names', () => {
      eventBus.on('event1', jest.fn());
      eventBus.on('event2', jest.fn());

      const eventNames = eventBus.getEventNames();

      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toHaveLength(2);
    });

    it('should return listener count', () => {
      eventBus.on('test-event', jest.fn());
      eventBus.on('test-event', jest.fn());

      expect(eventBus.listenerCount('test-event')).toBe(2);
      expect(eventBus.listenerCount('non-existent')).toBe(0);
    });

    it('should clear all events', () => {
      eventBus.on('event1', jest.fn());
      eventBus.on('event2', jest.fn());

      eventBus.clear();

      expect(eventBus.getEventNames()).toHaveLength(0);
    });
  });

  describe('Concurrent Modifications', () => {
    it('should handle subscription changes during emission', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn(() => {
        // Unsubscribe during emission
        eventBus.off(subscription1);
      });

      const subscription1 = eventBus.on('test-event', callback1);
      eventBus.on('test-event', callback2);

      eventBus.emit('test-event', 'data');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(eventBus.listenerCount('test-event')).toBe(1);
    });
  });
});

describe('TypedEventBus', () => {
  let typedEventBus: TypedEventBus;

  beforeEach(() => {
    typedEventBus = new TypedEventBus();
    typedEventBus.clear();
  });

  afterEach(() => {
    typedEventBus.clear();
  });

  describe('Type Safety', () => {
    it('should provide type-safe event handling', () => {
      const layerCallback = jest.fn();
      const audioCallback = jest.fn();

      // Type-safe subscriptions
      typedEventBus.on('layer:created', layerCallback);
      typedEventBus.on('audio:started', audioCallback);

      // Type-safe emissions
      typedEventBus.emit('layer:created', {
        layer: { id: 'test', type: 'solid' },
      });
      typedEventBus.emit('audio:started', undefined);

      expect(layerCallback).toHaveBeenCalledWith({
        layer: { id: 'test', type: 'solid' },
      });
      expect(audioCallback).toHaveBeenCalledWith(undefined);
    });

    it('should handle once subscriptions', () => {
      const callback = jest.fn();

      typedEventBus.once('theme:changed', callback);

      typedEventBus.emit('theme:changed', { theme: 'frost_dark' });
      typedEventBus.emit('theme:changed', { theme: 'frost_light' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ theme: 'frost_dark' });
    });

    it('should handle unsubscription', () => {
      const callback = jest.fn();
      const subscriptionId = typedEventBus.on('performance:update', callback);

      typedEventBus.off(subscriptionId);
      typedEventBus.emit('performance:update', { fps: 60, renderTime: 0.016 });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should provide listener count', () => {
      typedEventBus.on('ui:resize', jest.fn());
      typedEventBus.on('ui:resize', jest.fn());

      expect(typedEventBus.listenerCount('ui:resize')).toBe(2);
    });

    it('should remove all listeners for an event', () => {
      typedEventBus.on('template:saved', jest.fn());
      typedEventBus.on('template:saved', jest.fn());

      typedEventBus.removeAllListeners('template:saved');

      expect(typedEventBus.listenerCount('template:saved')).toBe(0);
    });
  });
});
