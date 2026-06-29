import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock HTMLCanvasElement.getContext
beforeEach(() => {
  // Reset any canvas-related mocks before each test
  jest.clearAllMocks();
});

// Add global test utilities
global.createMockCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

global.createMockContext = () => {
  const canvas = global.createMockCanvas();
  return canvas.getContext('2d');
};

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16); // 60fps = ~16ms per frame
  return Math.floor(Math.random() * 1000) + 1; // Return random ID
});

global.cancelAnimationFrame = jest.fn();

// Mock performance.now for consistent timing in tests
const originalNow = global.performance.now;
let mockTime = 0;
global.performance.now = jest.fn(() => {
  mockTime += 16.67; // Simulate 60fps timing
  return mockTime;
});

// Add reset function for tests
global.resetMockTime = () => {
  mockTime = 0;
};

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createAnalyser: jest.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn((array) => {
      // Fill with mock frequency data
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 255);
      }
    }),
    getByteTimeDomainData: jest.fn((array) => {
      // Fill with mock waveform data
      for (let i = 0; i < array.length; i++) {
        array[i] = 128 + Math.floor(Math.random() * 64 - 32);
      }
    }),
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  close: jest.fn()
}));

// Mock MediaDevices for audio input
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() => 
    Promise.resolve({
      getTracks: () => [],
      getAudioTracks: () => [],
      getVideoTracks: () => [],
      addTrack: jest.fn(),
      removeTrack: jest.fn()
    })
  )
};

// Mock performance.memory for memory tests
if (!global.performance.memory) {
  global.performance.memory = {
    usedJSHeapSize: 45 * 1024 * 1024, // 45MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2048 * 1024 * 1024 // 2GB
  };
}

// Ensure DOM environment is properly set up for React 18
beforeEach(() => {
  // Create a div for React 18 createRoot
  if (!document.getElementById('root')) {
    const div = document.createElement('div');
    div.setAttribute('id', 'root');
    document.body.appendChild(div);
  }
});

// Extend global type definitions for TypeScript
declare global {
  function createMockCanvas(): HTMLCanvasElement;
  function createMockContext(): CanvasRenderingContext2D | null;
  function resetMockTime(): void;
  
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}