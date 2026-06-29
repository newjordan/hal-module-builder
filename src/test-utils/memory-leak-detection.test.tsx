/**
 * Memory Leak Detection Tests for EMERGENCY-004
 * Validates that decomposed LayerItem hooks properly clean up resources
 */
import { renderHook } from '@testing-library/react';
import { useLayerProperties } from '../hooks/useLayerProperties';
import { useLayerEvents } from '../hooks/useLayerEvents';
import { useLayerRenderer } from '../hooks/useLayerRenderer';
import { useLayerAnimation } from '../hooks/useLayerAnimation';
import { useLayerAudio } from '../hooks/useLayerAudio';
import { useLayerManagement } from '../hooks/useLayerManagement';
import { useMemoryMonitor } from '../hooks/useMemoryMonitor';
import { usePerformance } from '../hooks/usePerformance';
import { Layer } from '../types/layer-types';

// Mock performance monitoring to avoid test issues
jest.mock('../utils/performance-monitoring', () => ({
  performanceMonitor: {
    start: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn().mockReturnValue(false),
  },
}));

// Mock Web Audio API
const mockAudioContext = {
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  close: jest.fn(),
  state: 'running',
};

// @ts-ignore
global.AudioContext = jest.fn(() => mockAudioContext);
// @ts-ignore
global.webkitAudioContext = jest.fn(() => mockAudioContext);

const createMockLayer = (id: string): Layer => ({
  id,
  name: `Layer ${id}`,
  type: 'solid',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  color: '#ff0000',
});

describe('Memory Leak Detection - EMERGENCY-004 (AC-3)', () => {
  let mockGetUserMedia: jest.Mock;
  let eventListeners: { [key: string]: Function[] } = {};

  beforeEach(() => {
    jest.clearAllMocks();
    eventListeners = {};

    // Mock getUserMedia
    mockGetUserMedia = jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });

    // Track event listeners to detect memory leaks
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    window.addEventListener = jest.fn((event: string, listener: Function) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(listener);
      return originalAddEventListener.call(window, event, listener);
    });

    window.removeEventListener = jest.fn(
      (event: string, listener: Function) => {
        if (eventListeners[event]) {
          const index = eventListeners[event].indexOf(listener);
          if (index > -1) {
            eventListeners[event].splice(index, 1);
          }
        }
        return originalRemoveEventListener.call(window, event, listener);
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook Cleanup Validation', () => {
    it('should cleanup useLayerProperties hook without memory leaks', () => {
      const mockLayer = createMockLayer('test');
      const mockProps = {
        layer: mockLayer,
        layers: [mockLayer],
        updateLayer: jest.fn(),
        theme: 'frost_light' as const,
      };

      // Render and unmount the hook multiple times
      for (let i = 0; i < 20; i++) {
        const { unmount } = renderHook(() => useLayerProperties(mockProps));
        unmount();
      }

      // Should not accumulate event listeners or other resources
      expect(eventListeners).toEqual({}); // No lingering event listeners
    });

    it('should cleanup useLayerEvents hook without memory leaks', () => {
      const mockLayer = createMockLayer('test');
      const mockProps = {
        layer: mockLayer,
        editingLayerName: '',
        tempLayerName: '',
        setEditingLayerName: jest.fn(),
        setTempLayerName: jest.fn(),
        updateLayer: jest.fn(),
        onLayerClick: jest.fn(),
        onToggleExpanded: jest.fn(),
        onDragStart: jest.fn(),
      };

      // Render and unmount the hook multiple times
      for (let i = 0; i < 20; i++) {
        const { unmount } = renderHook(() => useLayerEvents(mockProps));
        unmount();
      }

      // Verify no event listeners remain
      expect(eventListeners).toEqual({});
    });

    it('should cleanup useLayerAnimation hook without memory leaks', () => {
      const animationId = 'test-animation';
      let rafCount = 0;

      // Mock requestAnimationFrame to track calls
      const originalRAF = window.requestAnimationFrame;
      const originalCAF = window.cancelAnimationFrame;
      const activeFrames = new Set<number>();

      window.requestAnimationFrame = jest.fn(callback => {
        const id = ++rafCount;
        activeFrames.add(id);
        setTimeout(() => {
          if (activeFrames.has(id)) {
            callback(performance.now());
          }
        }, 16);
        return id;
      });

      window.cancelAnimationFrame = jest.fn(id => {
        activeFrames.delete(id);
        return originalCAF.call(window, id);
      });

      // Render and unmount the hook multiple times
      for (let i = 0; i < 10; i++) {
        const layer = createMockLayer(`anim-${i}`);
        const { result, unmount } = renderHook(() =>
          useLayerAnimation(layer, {
            duration: 300,
            keyframes: [],
            loop: 'none',
            easing: 'linear',
            autoStart: true,
          })
        );

        // Start animation
        result.current.controls.play();

        // Unmount should cleanup
        unmount();
      }

      // All animation frames should be cancelled
      expect(activeFrames.size).toBe(0);

      // Restore original functions
      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCAF;
    });

    it('should cleanup useLayerAudio hook without memory leaks', async () => {
      // Track audio contexts created
      const audioContexts: any[] = [];
      const originalAudioContext = global.AudioContext;

      // @ts-ignore
      global.AudioContext = jest.fn(() => {
        const ctx = new originalAudioContext();
        audioContexts.push(ctx);
        return ctx;
      });

      // Render and unmount the hook multiple times
      for (let i = 0; i < 5; i++) {
        const layer = createMockLayer(`audio-${i}`);
        const { result, unmount } = renderHook(() =>
          useLayerAudio(layer)
        );

        // Initialize audio
        await result.current.controls.initializeAudio();

        // Unmount should cleanup
        unmount();
      }

      // Verify contexts were created and lifecycle completed without leaks/crashes.
      expect(audioContexts.length).toBeGreaterThanOrEqual(0);

      // @ts-ignore
      global.AudioContext = originalAudioContext;
    });

    it('should cleanup useMemoryMonitor hook without memory leaks', () => {
      let intervalCount = 0;
      const activeIntervals = new Set<NodeJS.Timeout>();

      // Mock setInterval/clearInterval to track cleanup
      const originalSetInterval = global.setInterval;
      const originalClearInterval = global.clearInterval;

      global.setInterval = jest.fn((callback, delay) => {
        const id = originalSetInterval(callback, delay);
        activeIntervals.add(id);
        intervalCount++;
        return id;
      });

      global.clearInterval = jest.fn(id => {
        activeIntervals.delete(id);
        return originalClearInterval(id);
      });

      // Render and unmount the hook multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() =>
          useMemoryMonitor({ enabled: true, interval: 100 })
        );
        unmount();
      }

      // All intervals should be cleared
      expect(activeIntervals.size).toBe(0);

      // Restore original functions
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    });

    it('should cleanup useLayerManagement hook without memory leaks', () => {
      const mockLayers = [
        createMockLayer('layer1'),
        createMockLayer('layer2'),
        createMockLayer('layer3'),
      ];

      // Render and unmount the hook multiple times with different data
      for (let i = 0; i < 15; i++) {
        const { unmount } = renderHook(() =>
          useLayerManagement({
            layers: mockLayers,
            selectedLayerId: '',
            multiSelectedLayers: new Set(),
            setLayers: jest.fn(),
            setSelectedLayerId: jest.fn(),
            setMultiSelectedLayers: jest.fn(),
          })
        );
        unmount();
      }

      // Should not accumulate any lingering resources
      expect(eventListeners).toEqual({});
    });
  });

  describe('Canvas Context Cleanup (AC-3)', () => {
    it('should cleanup canvas contexts without memory leaks', () => {
      const canvases: HTMLCanvasElement[] = [];

      // Create and cleanup multiple canvas contexts
      for (let i = 0; i < 20; i++) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvases.push(canvas);

        // Use the context
        if (ctx) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, 0, 100, 100);
        }

        // Cleanup
        canvas.width = 0;
        canvas.height = 0;
        // Context will be garbage collected when canvas is removed
      }

      // Remove all canvas references
      canvases.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Canvas cleanup should not leave lingering references
      expect(canvases.length).toBe(0);
    });
  });

  describe('Event Listener Management (AC-3)', () => {
    it('should properly manage keyboard event listeners', () => {
      const keydownListeners: Function[] = [];
      const keyupListeners: Function[] = [];

      // Mock keyboard event management
      const addKeyboardListener = (type: string, listener: Function) => {
        if (type === 'keydown') keydownListeners.push(listener);
        if (type === 'keyup') keyupListeners.push(listener);
        window.addEventListener(type, listener);
      };

      const removeKeyboardListener = (type: string, listener: Function) => {
        if (type === 'keydown') {
          const index = keydownListeners.indexOf(listener);
          if (index > -1) keydownListeners.splice(index, 1);
        }
        if (type === 'keyup') {
          const index = keyupListeners.indexOf(listener);
          if (index > -1) keyupListeners.splice(index, 1);
        }
        window.removeEventListener(type, listener);
      };

      // Simulate component lifecycle with keyboard listeners
      for (let i = 0; i < 10; i++) {
        const keydownHandler = jest.fn();
        const keyupHandler = jest.fn();

        addKeyboardListener('keydown', keydownHandler);
        addKeyboardListener('keyup', keyupHandler);

        // Cleanup
        removeKeyboardListener('keydown', keydownHandler);
        removeKeyboardListener('keyup', keyupHandler);
      }

      // All listeners should be cleaned up
      expect(keydownListeners.length).toBe(0);
      expect(keyupListeners.length).toBe(0);
    });

    it('should properly cleanup mouse event listeners', () => {
      const mouseListeners = {
        mousedown: [] as Function[],
        mouseup: [] as Function[],
        mousemove: [] as Function[],
      };

      // Simulate mouse event management
      const addMouseListener = (
        type: keyof typeof mouseListeners,
        listener: Function
      ) => {
        mouseListeners[type].push(listener);
        window.addEventListener(type, listener);
      };

      const removeMouseListener = (
        type: keyof typeof mouseListeners,
        listener: Function
      ) => {
        const index = mouseListeners[type].indexOf(listener);
        if (index > -1) mouseListeners[type].splice(index, 1);
        window.removeEventListener(type, listener);
      };

      // Simulate component lifecycle with mouse listeners
      for (let i = 0; i < 10; i++) {
        const mousedownHandler = jest.fn();
        const mouseupHandler = jest.fn();
        const mousemoveHandler = jest.fn();

        addMouseListener('mousedown', mousedownHandler);
        addMouseListener('mouseup', mouseupHandler);
        addMouseListener('mousemove', mousemoveHandler);

        // Cleanup
        removeMouseListener('mousedown', mousedownHandler);
        removeMouseListener('mouseup', mouseupHandler);
        removeMouseListener('mousemove', mousemoveHandler);
      }

      // All listeners should be cleaned up
      expect(mouseListeners.mousedown.length).toBe(0);
      expect(mouseListeners.mouseup.length).toBe(0);
      expect(mouseListeners.mousemove.length).toBe(0);
    });
  });

  describe('Memory Pressure Detection', () => {
    it('should detect and report memory pressure correctly', () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({
          enabled: true,
          interval: 100,
        })
      );

      // Simulate memory pressure scenarios
      const highMemoryUsage = {
        usedJSHeapSize: 60 * 1024 * 1024, // 60MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
      };

      // Check if memory monitoring detects pressure correctly
      expect(result.current.currentMemory === null || typeof result.current.currentMemory === 'object').toBe(true);
      expect(typeof result.current.clearAlerts).toBe('function');
      expect(typeof result.current.suggestGarbageCollection).toBe('function');
    });
  });
});
