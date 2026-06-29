// Test helper utilities for common testing patterns

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';

// Enhanced render function with common providers
export const renderWithProviders = (
  ui: ReactElement,
  options: RenderOptions = {}
): RenderResult => {
  // In the future, add providers here (ThemeProvider, AppContext, etc.)
  return render(ui, options);
};

// Custom hook for user events
export const createUserEvent = () => userEvent.setup();

// Wait utilities
export const waitForNextTick = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0));

export const waitForAnimationFrame = (): Promise<void> =>
  new Promise(resolve => requestAnimationFrame(() => resolve()));

// Performance testing utilities
export const measureRenderTime = async (
  renderFn: () => void
): Promise<number> => {
  const start = performance.now();
  renderFn();
  await waitForAnimationFrame();
  return performance.now() - start;
};

// Memory leak detection
export const detectMemoryLeaks = (): {
  getInitialMemory: () => number;
  checkForLeaks: (threshold?: number) => boolean;
} => {
  let initialMemory: number;

  return {
    getInitialMemory: (): number => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const perfMemory = performance as any;
        initialMemory = perfMemory.memory.usedJSHeapSize;
        return initialMemory;
      }
      return 0;
    },
    checkForLeaks: (threshold = 10 * 1024 * 1024): boolean => {
      // 10MB default
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const perfMemory = performance as any;
        const currentMemory = perfMemory.memory.usedJSHeapSize;
        return currentMemory - initialMemory > threshold;
      }
      return false;
    },
  };
};

// Canvas testing utilities
export const createTestCanvas = (
  width = 800,
  height = 600
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const getCanvasImageData = (
  canvas: HTMLCanvasElement
): ImageData | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

export const compareCanvasImageData = (
  imageData1: ImageData,
  imageData2: ImageData,
  tolerance = 0
): boolean => {
  if (
    imageData1.width !== imageData2.width ||
    imageData1.height !== imageData2.height
  ) {
    return false;
  }

  const data1 = imageData1.data;
  const data2 = imageData2.data;

  for (let i = 0; i < data1.length; i++) {
    if (Math.abs(data1[i]! - data2[i]!) > tolerance) {
      return false;
    }
  }

  return true;
};

// Audio testing utilities
export const createMockAudioContext = (): any => ({
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 2048,
    frequencyBinCount: 1024,
    minDecibels: -100,
    maxDecibels: -30,
    smoothingTimeConstant: 0.8,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    getFloatFrequencyData: jest.fn(),
    getFloatTimeDomainData: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    channelCount: 2,
    channelCountMode: 'max' as ChannelCountMode,
    channelInterpretation: 'speakers' as ChannelInterpretation,
    context: {} as BaseAudioContext,
    numberOfInputs: 1,
    numberOfOutputs: 1,
  } as any),
  createGain: jest.fn().mockReturnValue({
    gain: { value: 1 },
    connect: jest.fn(),
    disconnect: jest.fn(),
    channelCount: 2,
    channelCountMode: 'max' as ChannelCountMode,
    channelInterpretation: 'speakers' as ChannelInterpretation,
    context: {} as BaseAudioContext,
    numberOfInputs: 1,
    numberOfOutputs: 1,
  } as any),
  createMediaStreamSource: jest.fn().mockReturnValue({
    mediaStream: {} as MediaStream,
    connect: jest.fn(),
    disconnect: jest.fn(),
    channelCount: 2,
    channelCountMode: 'max' as ChannelCountMode,
    channelInterpretation: 'speakers' as ChannelInterpretation,
    context: {} as BaseAudioContext,
    numberOfInputs: 0,
    numberOfOutputs: 1,
  } as any),
  sampleRate: 44100,
  state: 'running',
  suspend: jest.fn(),
  resume: jest.fn(),
  close: jest.fn(),
});

// Local storage testing utilities
export const mockLocalStorage = (): void => {
  const store: Record<string, string> = {};

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: Object.keys(store).length,
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
    },
    writable: true,
  });
};

// Error boundary testing
export const ThrowError = ({
  shouldThrow,
}: {
  shouldThrow: boolean;
}): never | null => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
};

// Async testing utilities
export const flushPromises = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0));

// File testing utilities
export const createMockFile = (
  name: string,
  content: string,
  mimeType = 'text/plain'
): File => {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], name, { type: mimeType });
};

// Custom matchers (to be registered in jest setup)
export const customMatchers = {
  toBeWithinRange: (received: number, floor: number, ceiling: number) => {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
  toHaveValidCanvasImageData: (canvas: HTMLCanvasElement) => {
    const imageData = getCanvasImageData(canvas);
    const pass = imageData !== null && imageData.data.length > 0;
    return {
      message: () =>
        pass
          ? `expected canvas not to have valid image data`
          : `expected canvas to have valid image data`,
      pass,
    };
  },
};

// Export all utilities
export * from '@testing-library/react';
export { userEvent };
