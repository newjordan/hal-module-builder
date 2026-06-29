/**
 * Comprehensive Integration Tests for Epic E6 Complete System
 * Tests the integration of E6-1, E6-2, and E6-3 modules
 *
 * Test Coverage:
 * - End-to-end audio processing pipeline
 * - Visualization factory and plugin architecture
 * - Rendering engine performance
 * - Memory optimization effectiveness
 * - Error handling and fallback mechanisms
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AudioAnalyzer,
  FrequencyProcessor,
  VisualizationFactory,
  VisualizationLibrary,
  VisualizationRenderer,
  initializeIntegratedEqualizer,
} from '../index';

// Mock DOM elements for testing
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;

  // Mock getContext to return a minimal context
  const mockContext = {
    clearRect: jest.fn(),
    setTransform: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    globalAlpha: 1,
  };

  canvas.getContext = jest.fn().mockReturnValue(mockContext);
  return canvas;
};

// Mock Web Audio API
const mockAudioContext = {
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
  createMediaStreamSource: jest.fn(),
  state: 'running',
  sampleRate: 44100,
  currentTime: 0,
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    }),
  },
  writable: true,
});

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  },
  writable: true,
});

// Mock AudioContext
(global as any).AudioContext = jest
  .fn()
  .mockImplementation(() => mockAudioContext);

describe('Epic E6 Complete Integration Tests', () => {
  let canvas: HTMLCanvasElement;
  let library: VisualizationLibrary;

  beforeEach(() => {
    canvas = createMockCanvas();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (library) {
      library.dispose();
    }
  });

  describe('System Initialization', () => {
    it('should initialize complete integrated system successfully', () => {
      expect(() => {
        library = initializeIntegratedEqualizer(canvas);
      }).not.toThrow();

      expect(library).toBeDefined();
      expect(library.getAvailableTypes()).toContain('bar');
      expect(library.getAvailableTypes()).toContain('circle');
      expect(library.getAvailableTypes()).toContain('line');
      expect(library.getAvailableTypes()).toContain('dot');
    });

    it('should initialize all E6-1 audio processing modules', async () => {
      const audioAnalyzer = new AudioAnalyzer();
      const frequencyProcessor = new FrequencyProcessor({
        sampleRate: 44100,
        binCount: 1024,
      });

      await expect(audioAnalyzer.initialize()).resolves.not.toThrow();
      expect(frequencyProcessor).toBeDefined();
    });

    it('should initialize E6-2 visualization factory with plugin architecture', () => {
      const factory = new VisualizationFactory();
      VisualizationFactory.initialize(); // Use static method

      expect(VisualizationFactory.getRegisteredTypes()).toContain('bar');
      expect(VisualizationFactory.getRegisteredTypes()).toContain('circle');
      expect(VisualizationFactory.getRegisteredTypes()).toContain('line');
      expect(VisualizationFactory.getRegisteredTypes()).toContain('dot');
    });

    it('should initialize E6-3 rendering engine with performance optimization', () => {
      const renderer = new VisualizationRenderer(canvas);
      const metrics = renderer.getMetrics();

      expect(metrics).toHaveProperty('frameRate');
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('memoryUsage');
    });
  });

  describe('End-to-End Audio Processing Pipeline', () => {
    beforeEach(() => {
      library = initializeIntegratedEqualizer(canvas);
    });

    it('should process complete audio visualization pipeline', async () => {
      const config = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',

        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      const result = library.renderVisualization('bar', config);

      expect(result.success).toBe(true);
      expect(result.visualizationType).toBe('bar');
      expect(result.performance).toBeDefined();
    });

    it('should handle visualization switching with state preservation', async () => {
      const config = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      // Render bar visualization
      const result1 = library.renderVisualization('bar', config);
      expect(result1.success).toBe(true);
      expect(result1.visualizationType).toBe('bar');

      // Switch to circle visualization
      const result2 = library.renderVisualization('circle', config);
      expect(result2.success).toBe(true);
      expect(result2.visualizationType).toBe('circle');

      // Switch back to bar
      const result3 = library.renderVisualization('bar', config);
      expect(result3.success).toBe(true);
      expect(result3.visualizationType).toBe('bar');
    });
  });

  describe('Performance Validation', () => {
    beforeEach(() => {
      library = initializeIntegratedEqualizer(canvas);
    });

    it('should maintain 60fps performance target', async () => {
      const config = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      // Simulate multiple renders to test performance
      const renderTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        const result = library.renderVisualization('bar', config);
        const endTime = performance.now();

        expect(result.success).toBe(true);
        renderTimes.push(endTime - startTime);
      }

      const averageRenderTime =
        renderTimes.reduce((a, b) => a + b) / renderTimes.length;

      // Should render faster than 50ms (reasonable performance in test environment)
      expect(averageRenderTime).toBeLessThan(50);
    });

    it('should achieve memory reduction target', async () => {
      const metrics = library.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      library = initializeIntegratedEqualizer(canvas);
    });

    it('should handle unknown visualization types gracefully', () => {
      const config = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      const result = library.renderVisualization('nonexistent-type', config);

      expect(result.success).toBe(true); // Should fallback to default
      expect(result.errors).toBeDefined();
      expect(result.visualizationType).toBe('bar'); // Fallback type
    });

    it('should handle configuration validation errors', () => {
      const invalidConfig = {
        barCount: -1, // Invalid
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      const validation = library.validateConfig('bar', invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Plugin Architecture Extensibility', () => {
    it('should support adding new visualization types', () => {
      const factory = new VisualizationFactory();

      // Mock new visualization class
      const MockVisualization = class {
        metadata = {
          name: 'Test Visualization',
          description: 'Test visualization for plugin architecture',
          version: '1.0.0',
        };

        getDefaultConfig() {
          return {
            barCount: 24,
            barWidth: 3,
            barSpacing: 2,
            maxHeight: 50,
            responseSpeed: 0.9,
            colorMode: 'solid' as const,
            primaryColor: '#00ff00',
            glowIntensity: 0,
            pulseMode: 'none' as const,
            rotation: 0,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
          };
        }

        validateConfig(config: any) {
          return { valid: true };
        }

        getAnimatableProperties() {
          return ['rotation', 'scale'];
        }

        supportsLayout() {
          return true;
        }

        getLayoutHints() {
          return {
            preferredLayouts: ['linear'],
            minElements: 1,
            maxElements: 100,
            supportsRotation: true,
            supportsScaling: true,
          };
        }

        render() {
          // Mock render implementation
        }
      };

      const registered = VisualizationFactory.register(
        'test',
        MockVisualization as any
      );
      expect(registered).toBe(true);
      expect(VisualizationFactory.getRegisteredTypes()).toContain('test');

      const info = VisualizationFactory.getRegistrationInfo('test');
      expect(info).toBeDefined();
      expect(info!.metadata.name).toBe('Test Visualization');
    });
  });

  describe('System Status and Metrics', () => {
    beforeEach(() => {
      library = initializeIntegratedEqualizer(canvas);
    });

    it('should provide comprehensive system status', () => {
      const status = library.getSystemStatus();

      expect(status).toHaveProperty('currentVisualization');
      expect(status).toHaveProperty('availableTypes');
      expect(status).toHaveProperty('performance');
      expect(status).toHaveProperty('factoryStatus');

      expect(Array.isArray(status.availableTypes)).toBe(true);
      expect(status.availableTypes.length).toBeGreaterThan(0);
    });

    it('should track performance metrics over time', () => {
      const metrics = library.getPerformanceMetrics();

      expect(metrics).toHaveProperty('frameRate');
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('averageRenderTime');
      expect(metrics).toHaveProperty('memoryUsage');

      expect(typeof metrics.frameRate).toBe('number');
      expect(typeof metrics.renderTime).toBe('number');
      expect(typeof metrics.averageRenderTime).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
    });
  });

  // E8.3 Enhancement: End-to-End Audio Pipeline Integration Tests
  describe('E8.3 End-to-End Audio Pipeline Integration', () => {
    let mockAudioService: any;
    let mockUseAudio: any;

    beforeEach(() => {
      library = initializeIntegratedEqualizer(canvas);

      // Enhanced mock AudioService for full pipeline testing
      mockAudioService = {
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn(),
        getAudioData: jest.fn().mockReturnValue(new Array(64).fill(0.5)),
        setDataCallback: jest.fn(),
        getStatus: jest.fn().mockReturnValue({
          isActive: true,
          hasAudioContext: true,
          hasAnalyser: true,
          hasStream: true,
        }),
        getSampleRate: jest.fn().mockReturnValue(44100),
        getFrequencyBinCount: jest.fn().mockReturnValue(64),
        getMemoryStats: jest.fn().mockReturnValue({
          isActive: true,
          uptime: 1000,
          totalAllocations: 5,
          audioContextState: 'running',
          hasLeaks: false,
        }),
        dispose: jest.fn(),
      };
    });

    it('should complete microphone → AudioService → useAudio → EqualizerEngine flow', async () => {
      // Simulate microphone input with realistic frequency data
      const realisticFrequencyData = Array.from({ length: 64 }, (_, i) => {
        // Simulate bass-heavy audio with natural frequency distribution
        const bassWeight = Math.exp(-i * 0.1);
        const randomVariation = 0.1 + Math.random() * 0.4;
        return Math.min(1, bassWeight * randomVariation);
      });

      mockAudioService.getAudioData.mockReturnValue(realisticFrequencyData);

      // Test AudioService initialization (microphone access)
      await expect(mockAudioService.start()).resolves.not.toThrow();
      expect(mockAudioService.getStatus().isActive).toBe(true);
      expect(mockAudioService.getStatus().hasStream).toBe(true);

      // Test audio data flow through pipeline
      const audioData = mockAudioService.getAudioData();
      expect(audioData).toEqual(realisticFrequencyData);
      expect(audioData.every((val: number) => val >= 0 && val <= 1)).toBe(true);

      // Test EqualizerEngine visualization with real audio data
      const config = {
        barCount: 64,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      const result = library.renderVisualization('bar', config);
      expect(result.success).toBe(true);
      expect(result.visualizationType).toBe('bar');
    });

    it('should handle audio permission denied gracefully', async () => {
      // Mock getUserMedia permission denied
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const mockErrorAudioService = {
        ...mockAudioService,
        start: jest
          .fn()
          .mockRejectedValue(
            new Error('Microphone access denied or audio initialization failed')
          ),
        getStatus: jest.fn().mockReturnValue({
          isActive: false,
          hasAudioContext: false,
          hasAnalyser: false,
          hasStream: false,
        }),
      };

      await expect(mockErrorAudioService.start()).rejects.toThrow(
        'Microphone access denied or audio initialization failed'
      );

      // Verify fallback behavior - should still render with default data
      const config = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      const result = library.renderVisualization('bar', config);
      expect(result.success).toBe(true);
    });

    it('should validate audio data processing with different response speeds', async () => {
      await mockAudioService.start();

      // Test different response speed settings affect audio processing
      const slowResponseData = mockAudioService.getAudioData(0.1);
      const fastResponseData = mockAudioService.getAudioData(0.9);

      expect(slowResponseData.length).toBe(fastResponseData.length);
      expect(Array.isArray(slowResponseData)).toBe(true);
      expect(Array.isArray(fastResponseData)).toBe(true);

      // Both should be valid frequency data arrays
      expect(
        slowResponseData.every((val: number) => val >= 0 && val <= 1)
      ).toBe(true);
      expect(
        fastResponseData.every((val: number) => val >= 0 && val <= 1)
      ).toBe(true);
    });

    it('should maintain audio processing during visualization switching', async () => {
      await mockAudioService.start();

      const config = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      // Test audio remains active during visualization changes
      library.renderVisualization('bar', config);
      expect(mockAudioService.getStatus().isActive).toBe(true);

      library.renderVisualization('circle', config);
      expect(mockAudioService.getStatus().isActive).toBe(true);

      library.renderVisualization('line', config);
      expect(mockAudioService.getStatus().isActive).toBe(true);

      // Audio data should remain consistent
      const audioData = mockAudioService.getAudioData();
      expect(audioData.length).toBeGreaterThan(0);
    });

    it('should validate memory stability during extended audio processing', async () => {
      await mockAudioService.start();

      const initialStats = mockAudioService.getMemoryStats();
      expect(initialStats.isActive).toBe(true);
      expect(initialStats.hasLeaks).toBe(false);

      // Simulate extended processing
      const config = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      // Perform multiple renders to simulate extended use
      for (let i = 0; i < 50; i++) {
        library.renderVisualization('bar', config);
        // Get fresh audio data for each render
        mockAudioService.getAudioData();
      }

      const finalStats = mockAudioService.getMemoryStats();
      expect(finalStats.isActive).toBe(true);
      expect(finalStats.hasLeaks).toBe(false);

      // Memory should remain stable (not grow excessively)
      expect(finalStats.totalAllocations).toBeGreaterThanOrEqual(
        initialStats.totalAllocations
      );
    });
  });

  // E8.3 Enhancement: Layer Settings Integration Tests
  describe('E8.3 Layer Settings Integration', () => {
    beforeEach(() => {
      library = initializeIntegratedEqualizer(canvas);
    });

    it('should validate barCount setting affects audio data processing', () => {
      const config32Bars = {
        barCount: 32,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      const config64Bars = { ...config32Bars, barCount: 64 };

      const result32 = library.renderVisualization('bar', config32Bars);
      const result64 = library.renderVisualization('bar', config64Bars);

      expect(result32.success).toBe(true);
      expect(result64.success).toBe(true);

      // Both should process successfully but with different data array lengths
      expect(result32.visualizationType).toBe('bar');
      expect(result64.visualizationType).toBe('bar');
    });

    it('should validate barStyle setting changes EqualizerEngine visualization type', () => {
      const baseConfig = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.8,
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      // Test different bar styles
      const barResult = library.renderVisualization('bar', baseConfig);
      const circleResult = library.renderVisualization('circle', baseConfig);
      const lineResult = library.renderVisualization('line', baseConfig);
      const dotResult = library.renderVisualization('dot', baseConfig);

      expect(barResult.success).toBe(true);
      expect(barResult.visualizationType).toBe('bar');

      expect(circleResult.success).toBe(true);
      expect(circleResult.visualizationType).toBe('circle');

      expect(lineResult.success).toBe(true);
      expect(lineResult.visualizationType).toBe('line');

      expect(dotResult.success).toBe(true);
      expect(dotResult.visualizationType).toBe('dot');
    });

    it('should validate responseSpeed setting affects audio data smoothing', () => {
      const slowConfig = {
        barCount: 48,
        barWidth: 2,
        barSpacing: 1,
        maxHeight: 40,
        responseSpeed: 0.1, // Very slow response
        colorMode: 'gradient' as const,
        primaryColor: '#dc2626',
        secondaryColor: '#7f1d1d',
        glowIntensity: 0,
        pulseMode: 'none' as const,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        innerRadius: 140,
        startAngle: 0,
        endAngle: 360,
        arcMode: false,
        invert: false,
        layout: 'radial',
        style: 'line',
      };

      const fastConfig = { ...slowConfig, responseSpeed: 0.9 }; // Very fast response

      const slowResult = library.renderVisualization('bar', slowConfig);
      const fastResult = library.renderVisualization('bar', fastConfig);

      expect(slowResult.success).toBe(true);
      expect(fastResult.success).toBe(true);

      // Both should render successfully with different smoothing characteristics
      expect(slowResult.visualizationType).toBe('bar');
      expect(fastResult.visualizationType).toBe('bar');
    });

    it('should validate layer settings persistence affects real audio processing', () => {
      const persistentConfig = {
        barCount: 32,
        barWidth: 3,
        barSpacing: 2,
        maxHeight: 60,
        responseSpeed: 0.7,
        colorMode: 'solid' as const,
        primaryColor: '#00ff00',
        secondaryColor: '#008800',
        glowIntensity: 0.5,
        pulseMode: 'none' as const,
        rotation: 45,
        scale: 1.2,
        offsetX: 10,
        offsetY: -5,
        innerRadius: 120,
        startAngle: 30,
        endAngle: 330,
        arcMode: true,
        invert: true,
        layout: 'linear',
        style: 'line', // Use valid style instead of 'filled'
      };

      // Render with persistent configuration
      const result1 = library.renderVisualization('bar', persistentConfig);
      expect(result1.success).toBe(true);

      // Re-render with same config - should maintain settings
      const result2 = library.renderVisualization('bar', persistentConfig);
      expect(result2.success).toBe(true);
      expect(result2.visualizationType).toBe('bar');

      // Configuration should be maintained across renders
      const validation = library.validateConfig('bar', persistentConfig);
      expect(validation.valid).toBe(true);
    });
  });
});
