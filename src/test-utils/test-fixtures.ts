// Test fixtures and factory functions for consistent testing

import {
  Layer,
  LayerGroup,
  Template,
  PerformanceMetrics,
  AppState,
} from '../types';

// Layer factory functions
export const createMockLayer = (overrides: Partial<Layer> = {}): Layer => ({
  id: 'layer-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Layer',
  type: 'shape',
  visible: true,
  opacity: 1,
  blendMode: 'normal',
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  color: '#ff0000',
  brightness: 0,
  contrast: 0,
  locked: false,
  ...overrides,
});

export const createMockEqualizerLayer = (
  overrides: Partial<Layer> = {}
): Layer => ({
  ...createMockLayer(),
  type: 'equalizer',
  equalizerSettings: {
    barCount: 32,
    barStyle: 'line',
    barWidth: 10,
    barSpacing: 2,
    barRotation: 0,
    innerRadius: 100,
    maxHeight: 200,
    responseSpeed: 0.8,
    frequencyRange: 'full',
    colorMode: 'solid',
    primaryColor: '#00ff00',
    secondaryColor: '#ff0000',
    glowIntensity: 0,
    symmetry: 'none',
    pulseMode: 'none',
    radialSizingMode: 'flat',
    radialOrientation: 'follow-radius',
    showRadialPath: false,
    debugMarkers: [
      { id: 'marker-1', shape: 'circle', position: 0, color: '#ffffff' },
      { id: 'marker-2', shape: 'square', position: 0.33, color: '#00ffff' },
      { id: 'marker-3', shape: 'triangle', position: 0.66, color: '#ff00ff' },
    ],
    positionX: 400,
    positionY: 300,
    startAngle: 0,
    endAngle: 360,
    arcMode: false,
  },
  ...overrides,
});

export const createMockShapeLayer = (
  overrides: Partial<Layer> = {}
): Layer => ({
  ...createMockLayer(),
  type: 'shape',
  shapeType: 'circle',
  fillType: 'solid',
  fillColor: '#0000ff',
  strokeType: 'solid',
  strokeColor: '#ffffff',
  strokeWidth: 2,
  ...overrides,
});

// LayerGroup factory
export const createMockLayerGroup = (
  overrides: Partial<LayerGroup> = {}
): LayerGroup => ({
  id: 'group-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Group',
  layerIds: [],
  visible: true,
  locked: false,
  collapsed: false,
  ...overrides,
});

// Template factory
export const createMockTemplate = (
  overrides: Partial<Template> = {}
): Template => ({
  id: 'template-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Template',
  description: 'A test template',
  layers: [createMockLayer()],
  groups: [],
  metadata: {
    version: '1.0.0',
    author: 'Test Author',
    category: 'test',
    tags: ['test'],
    difficulty: 'beginner',
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// Performance metrics factory
export const createMockPerformanceMetrics = (
  overrides: Partial<PerformanceMetrics> = {}
): PerformanceMetrics => ({
  fps: 60,
  frameTime: 16.67,
  renderTime: 8.33,
  memoryUsage: 50,
  timestamp: Date.now(),
  ...overrides,
});

// App state factory
export const createMockAppState = (
  overrides: Partial<AppState> = {}
): AppState => ({
  layers: [createMockLayer()],
  groups: [],
  selectedLayerIds: [],
  currentTheme: 'frost_light',
  audioEnabled: false,
  templates: [],
  performance: createMockPerformanceMetrics(),
  error: null,
  ...overrides,
});

// Audio data factory
export const createMockAudioData = (size = 1024): Float32Array => {
  const data = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1; // Random values between -1 and 1
  }
  return data;
};

// Canvas context mock factory
export const createMockCanvasContext =
  (): Partial<CanvasRenderingContext2D> => ({
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    clearRect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    rect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
  });

// Event factory
export const createMockEvent = <T = unknown>(type: string, payload?: T) => ({
  type,
  payload,
  timestamp: Date.now(),
  source: 'test',
});

// DOM element factory
export const createMockElement = (tagName = 'div'): Partial<HTMLElement> => ({
  tagName: tagName.toUpperCase(),
  innerHTML: '',
  style: {} as CSSStyleDeclaration,
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false),
    toggle: jest.fn(),
    length: 0,
    value: '',
    item: jest.fn(),
    replace: jest.fn(),
    supports: jest.fn(),
    toString: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    [Symbol.iterator]: jest.fn(),
  } as unknown as DOMTokenList,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() =>
    Object.assign([], {
      item: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
    })
  ),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  })),
});
