/**
 * Simple integration test to verify the visualization pipeline works
 */

import { initializeIntegratedEqualizer, VisualizationLibrary } from '../index';

// Mock canvas for testing
const createTestCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;

  const mockContext = {
    clearRect: jest.fn(),
    setTransform: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    globalAlpha: 1,
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
  } as any;

  canvas.getContext = jest.fn().mockReturnValue(mockContext);
  return canvas;
};

describe('Visualization Pipeline Integration', () => {
  let canvas: HTMLCanvasElement;
  let library: VisualizationLibrary;

  beforeEach(() => {
    canvas = createTestCanvas();
    library = initializeIntegratedEqualizer(canvas);
  });

  afterEach(() => {
    if (library) {
      library.dispose();
    }
  });

  test('should initialize and have registered visualizations', () => {
    expect(library).toBeDefined();

    const availableTypes = library.getAvailableTypes();
    expect(availableTypes).toContain('bar');
    expect(availableTypes).toContain('circle');
    expect(availableTypes).toContain('line');
    expect(availableTypes).toContain('dot');
    expect(availableTypes.length).toBeGreaterThan(0);
  });

  test('should render bar visualization successfully', () => {
    // Generate test audio data
    const audioData = Array.from(
      { length: 48 },
      (_, i) => Math.sin((i / 48) * Math.PI * 4) * 0.5 + 0.5
    );

    // Inject audio data
    library.injectAudioData(audioData);

    // Render bar visualization
    const result = library.renderVisualization('bar', {
      barCount: 48,
      barWidth: 3,
      barSpacing: 1,
      maxHeight: 100,
      responseSpeed: 0.8,
      colorMode: 'solid' as const,
      primaryColor: '#ff0000',
      glowIntensity: 0,
      pulseMode: 'none' as const,
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });

    expect(result.success).toBe(true);
    expect(result.visualizationType).toBe('bar');
    expect(result.performance).toBeDefined();
  });

  test('should handle multiple visualization types', () => {
    const audioData = Array.from({ length: 32 }, () => Math.random() * 0.8);
    library.injectAudioData(audioData);

    const config = {
      barCount: 32,
      barWidth: 2,
      barSpacing: 1,
      maxHeight: 80,
      responseSpeed: 0.8,
      colorMode: 'gradient' as const,
      primaryColor: '#00ff00',
      secondaryColor: '#008800',
      glowIntensity: 0,
      pulseMode: 'none' as const,
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };

    // Test each visualization type
    const barResult = library.renderVisualization('bar', config);
    expect(barResult.success).toBe(true);
    expect(barResult.visualizationType).toBe('bar');

    const circleResult = library.renderVisualization('circle', config);
    expect(circleResult.success).toBe(true);
    expect(circleResult.visualizationType).toBe('circle');

    const lineResult = library.renderVisualization('line', config);
    expect(lineResult.success).toBe(true);
    expect(lineResult.visualizationType).toBe('line');

    const dotResult = library.renderVisualization('dot', config);
    expect(dotResult.success).toBe(true);
    expect(dotResult.visualizationType).toBe('dot');
  });

  test('should provide system status and metrics', () => {
    const status = library.getSystemStatus();

    expect(status).toHaveProperty('currentVisualization');
    expect(status).toHaveProperty('availableTypes');
    expect(status).toHaveProperty('performance');
    expect(status).toHaveProperty('factoryStatus');

    expect(Array.isArray(status.availableTypes)).toBe(true);
    expect(status.availableTypes.length).toBeGreaterThan(0);

    const metrics = library.getPerformanceMetrics();
    expect(metrics).toHaveProperty('frameRate');
    expect(metrics).toHaveProperty('renderTime');
    expect(metrics).toHaveProperty('memoryUsage');
  });
});
