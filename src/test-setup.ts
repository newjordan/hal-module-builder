/**
 * Jest Test Setup - Canvas Mocking and Global Test Configuration
 * Resolves Canvas API issues in JSDOM environment for Effects system testing
 */

import '@testing-library/jest-dom';

// Canvas Mock Implementation
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth = 1;
  globalAlpha = 1;
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  miterLimit = 10;
  shadowBlur = 0;
  shadowColor = 'rgba(0, 0, 0, 0)';
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  font = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // Path methods
  beginPath = jest.fn();
  closePath = jest.fn();
  moveTo = jest.fn();
  lineTo = jest.fn();
  quadraticCurveTo = jest.fn();
  bezierCurveTo = jest.fn();
  arc = jest.fn();
  arcTo = jest.fn();
  ellipse = jest.fn();
  rect = jest.fn();

  // Fill and stroke
  fill = jest.fn();
  stroke = jest.fn();
  clip = jest.fn();

  // Text
  fillText = jest.fn();
  strokeText = jest.fn();
  measureText = jest.fn(() => ({ width: 100 }));

  // Images
  drawImage = jest.fn();

  // Transforms
  save = jest.fn();
  restore = jest.fn();
  scale = jest.fn();
  rotate = jest.fn();
  translate = jest.fn();
  transform = jest.fn();
  setTransform = jest.fn();
  resetTransform = jest.fn();

  // Gradients and patterns
  createLinearGradient = jest.fn(() => ({
    addColorStop: jest.fn(),
  }));
  createRadialGradient = jest.fn(() => ({
    addColorStop: jest.fn(),
  }));
  createPattern = jest.fn(() => null);

  // Image data
  createImageData = jest.fn(() => ({
    data: new Uint8ClampedArray(0),
    width: 0,
    height: 0,
  }));
  getImageData = jest.fn(() => ({
    data: new Uint8ClampedArray(0),
    width: 0,
    height: 0,
  }));
  putImageData = jest.fn();

  // Pixel manipulation
  clearRect = jest.fn();
  fillRect = jest.fn();
  strokeRect = jest.fn();

  // Line styles
  setLineDash = jest.fn();
  getLineDash = jest.fn(() => []);

  // Compositing
  isPointInPath = jest.fn(() => false);
  isPointInStroke = jest.fn(() => false);
}

// Mock canvas creation function
const createMockCanvas = (): HTMLCanvasElement => {
  const baseCanvas = {
    width: 300,
    height: 300,
    style: {},
    toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
    toBlob: jest.fn(callback => {
      callback?.(new Blob(['mock'], { type: 'image/png' }));
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
      top: 0,
      left: 0,
      width: 300,
      height: 300,
      right: 300,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    })),
  };

  const mockCanvas = baseCanvas as any;
  mockCanvas.getContext = jest.fn((contextType: string) => {
    if (contextType === '2d') {
      return new MockCanvasRenderingContext2D(mockCanvas);
    }
    return null;
  });

  return mockCanvas;
};

// Override createElement to return mocked canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn(
  (tagName: string, options?: ElementCreationOptions) => {
    if (tagName === 'canvas') {
      return createMockCanvas();
    }
    return originalCreateElement.call(document, tagName, options);
  }
);

// Web Audio API Mocks (for AudioService tests)
global.AudioContext = jest.fn().mockImplementation(() => ({
  createAnalyser: jest.fn(() => ({
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  resume: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
  state: 'running',
}));

global.MediaDevices = {
  getUserMedia: jest.fn(() =>
    Promise.resolve({
      getTracks: () => [
        {
          stop: jest.fn(),
        },
      ],
    })
  ),
} as any;

// Performance API Mock
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
};
// Polyfill Performance marks/measures if missing
if (typeof performance.mark !== 'function') {
  // @ts-ignore
  performance.mark = jest.fn();
  // @ts-ignore
  performance.measure = jest.fn();
  // @ts-ignore
  performance.clearMarks = jest.fn();
  // @ts-ignore
  performance.clearMeasures = jest.fn();
}

// Ensure a #root container exists for components that expect it
(() => {
  if (!document.getElementById('root')) {
    const el = document.createElement('div');
    el.id = 'root';
    document.body.appendChild(el);
  }
})();

// RequestAnimationFrame Mock
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

// Resize Observer Mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// IntersectionObserver Mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// File API Mocks
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(chunks: BlobPart[], filename: string, options?: FilePropertyBag) {
    this.name = filename;
    this.size = chunks.reduce(
      (size, chunk) =>
        size +
        (typeof chunk === 'string' ? chunk.length : (chunk as any).size || 0),
      0
    );
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
  }

  arrayBuffer = jest.fn(() => Promise.resolve(new ArrayBuffer(0)));
  text = jest.fn(() => Promise.resolve(''));
  stream = jest.fn();
  slice = jest.fn(() => new Blob());
} as any;

global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: number = 0;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;

  readAsText = jest.fn((_file: Blob) => {
    this.readyState = 2;
    this.result = 'mock file content';
    if (this.onload) {
      this.onload.call(this as any, {} as any);
    }
  });

  readAsDataURL = jest.fn((_file: Blob) => {
    this.readyState = 2;
    this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
    if (this.onload) {
      this.onload.call(this as any, {} as any);
    }
  });

  readAsArrayBuffer = jest.fn();
  readAsBinaryString = jest.fn();
  abort = jest.fn();

  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
} as any;

// Console suppression for known test warnings
const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    const message = args[0];
    // Suppress known Jest/Testing Library warnings
    if (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: React.createFactory is deprecated') ||
      message.includes('ValidationUtils: Failed to clone object')
    ) {
      return;
    }
  }
  originalError.apply(console, args);
};

// Export for direct import in tests if needed
export { MockCanvasRenderingContext2D };
