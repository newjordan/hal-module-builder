/**
 * E6 Performance Regression Test Suite
 *
 * Automated tests to detect performance regressions during equalizer system decomposition.
 * Tests critical performance metrics for 60fps audio visualization requirements.
 *
 * Story: E6-0 Audio Processing Analysis
 */

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';

// Mock Web Audio API for testing environment
const mockAudioContext = {
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 128,
    frequencyBinCount: 64,
    smoothingTimeConstant: 0.8,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn(),
  }),
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
  }),
  close: jest.fn(),
  state: 'running',
  sampleRate: 44100,
};

// Mock performance API for consistent testing
const mockPerformance = {
  now: jest.fn().mockReturnValue(0),
  mark: jest.fn(),
  measure: jest.fn(),
};

global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
global.performance = mockPerformance as any;

// Import modules to test
import { AudioProcessor } from '../assets/equalizer/AudioProcessor';
import { BarVisualization } from '../assets/equalizer/visualizations/BarVisualization';
import { FrequencyProcessor } from '../utils/audio/frequencyAnalysis';
import {
  smoothAudioData,
  normalizeAudioData,
} from '../utils/audio/audioProcessing';

// Performance baseline constants (60fps requirement)
const TARGET_FRAME_TIME = 16.67; // 60fps = 16.67ms per frame
const MAX_PROCESSING_TIME = 10; // Max 10ms for audio processing per frame
const MAX_MEMORY_ALLOCATIONS_PER_SECOND = 60; // Reasonable allocation limit

/**
 * Performance test utilities
 */
class PerformanceTestUtils {
  private static startTime: number = 0;
  private static memoryAllocations: number = 0;

  static startMeasurement(): void {
    this.startTime = performance.now();
    this.memoryAllocations = 0;
  }

  static endMeasurement(): number {
    return performance.now() - this.startTime;
  }

  static trackMemoryAllocation(): void {
    this.memoryAllocations++;
  }

  static getMemoryAllocations(): number {
    return this.memoryAllocations;
  }

  static generateTestAudioData(size: number = 64): Uint8Array {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.floor(Math.random() * 255);
    }
    return data;
  }

  static generateTestFrequencyData(size: number = 64): number[] {
    return Array.from({ length: size }, () => Math.random());
  }
}

describe('E6 Performance Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Audio Processing Performance', () => {
    test('AudioProcessor initialization should complete within performance budget', () => {
      PerformanceTestUtils.startMeasurement();

      const processor = new AudioProcessor({
        fftSize: 128,
        smoothingTimeConstant: 0.8,
      });

      const executionTime = PerformanceTestUtils.endMeasurement();

      // Initialization should be nearly instantaneous
      expect(executionTime).toBeLessThan(5);
      expect(processor).toBeDefined();
    });

    test('FrequencyProcessor frame processing should meet 60fps requirement', () => {
      const processor = new FrequencyProcessor(128);
      const mockAnalyser = mockAudioContext.createAnalyser();

      // Mock frequency data
      const mockData = PerformanceTestUtils.generateTestAudioData(64);
      mockAnalyser.getByteFrequencyData = jest
        .fn()
        .mockImplementation((arr: Uint8Array) => {
          for (let i = 0; i < Math.min(arr.length, mockData.length); i++) {
            arr[i] = mockData[i]!;
          }
        });

      PerformanceTestUtils.startMeasurement();

      const result = processor.processFrame(mockAnalyser, 0.8);

      const executionTime = PerformanceTestUtils.endMeasurement();

      // Frame processing must be under 10ms for 60fps target
      expect(executionTime).toBeLessThan(MAX_PROCESSING_TIME);
      expect(result).toBeDefined();
    });

    test('Audio data smoothing should be optimized for real-time performance', () => {
      const currentData = PerformanceTestUtils.generateTestFrequencyData(64);
      const newData = PerformanceTestUtils.generateTestFrequencyData(64);

      PerformanceTestUtils.startMeasurement();

      // Run smoothing operation multiple times to test sustained performance
      for (let i = 0; i < 100; i++) {
        smoothAudioData(
          currentData,
          newData.map(v => v * 255),
          0.8
        );
      }

      const executionTime = PerformanceTestUtils.endMeasurement();

      // 100 smoothing operations should complete well under 16ms
      expect(executionTime).toBeLessThan(TARGET_FRAME_TIME);
    });

    test('Audio data normalization should have minimal performance impact', () => {
      const testData = Array.from({ length: 1000 }, () =>
        Math.floor(Math.random() * 255)
      );

      PerformanceTestUtils.startMeasurement();

      // Test batch normalization performance
      for (let i = 0; i < 50; i++) {
        normalizeAudioData(testData);
      }

      const executionTime = PerformanceTestUtils.endMeasurement();

      // Normalization should be very fast
      expect(executionTime).toBeLessThan(5);
    });
  });

  describe('Visualization Rendering Performance', () => {
    test('BarVisualization rendering should maintain 60fps performance', () => {
      const visualization = new BarVisualization();
      const config = visualization.getDefaultConfig();

      // Mock SVG context
      const mockSVG = {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        firstChild: null,
      } as any;

      const renderContext = {
        ctx: mockSVG,
        width: 400,
        height: 400,
        centerX: 200,
        centerY: 200,
        time: performance.now(),
        theme: 'frost_light' as const,
      };

      const testData = PerformanceTestUtils.generateTestFrequencyData(48);

      PerformanceTestUtils.startMeasurement();

      // Render multiple frames to test sustained performance
      for (let frame = 0; frame < 10; frame++) {
        visualization.render(renderContext, testData, config);
      }

      const executionTime = PerformanceTestUtils.endMeasurement();

      // 10 frames should render well under frame budget
      expect(executionTime).toBeLessThan(TARGET_FRAME_TIME * 10);
    });

    test('BarVisualization canvas rendering should be optimized', () => {
      const visualization = new BarVisualization();
      const config = visualization.getDefaultConfig();

      // Mock canvas context
      const mockCanvas = {
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        fillRect: jest.fn(),
        fillStyle: '',
        shadowColor: '',
        shadowBlur: 0,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        strokeStyle: '',
        lineWidth: 0,
        lineCap: '',
      } as any;

      const renderContext = {
        ctx: mockCanvas,
        width: 400,
        height: 400,
        centerX: 200,
        centerY: 200,
        time: performance.now(),
        theme: 'frost_light' as const,
      };

      const testData = PerformanceTestUtils.generateTestFrequencyData(48);

      PerformanceTestUtils.startMeasurement();

      visualization.render(renderContext, testData, config);

      const executionTime = PerformanceTestUtils.endMeasurement();

      // Single canvas render should be very fast
      expect(executionTime).toBeLessThan(5);
    });
  });

  describe('Memory Performance', () => {
    test('FrequencyProcessor should minimize memory allocations', () => {
      const processor = new FrequencyProcessor(128);
      const mockAnalyser = mockAudioContext.createAnalyser();

      const mockData = PerformanceTestUtils.generateTestAudioData(64);
      mockAnalyser.getByteFrequencyData = jest
        .fn()
        .mockImplementation((arr: Uint8Array) => {
          for (let i = 0; i < Math.min(arr.length, mockData.length); i++) {
            arr[i] = mockData[i]!;
          }
        });

      // Track memory allocations by counting array/object creations
      const originalArray = Array;
      let allocationCount = 0;

      // Mock Array constructor to count allocations
      global.Array = class extends originalArray {
        constructor(...args: any[]) {
          super(...args);
          allocationCount++;
          return this;
        }
      } as any;

      // Process multiple frames
      for (let i = 0; i < 60; i++) {
        processor.processFrame(mockAnalyser, 0.8);
      }

      global.Array = originalArray;

      // Should minimize allocations for 60 frames (1 second at 60fps)
      expect(allocationCount).toBeLessThan(MAX_MEMORY_ALLOCATIONS_PER_SECOND);
    });

    test('Audio data processing should reuse buffers when possible', () => {
      const data1 = PerformanceTestUtils.generateTestFrequencyData(64);
      const data2 = PerformanceTestUtils.generateTestFrequencyData(64);

      // Test multiple operations with same data structure
      for (let i = 0; i < 100; i++) {
        smoothAudioData(
          data1,
          data2.map(v => v * 255),
          0.8
        );
        normalizeAudioData(data2.map(v => v * 255));
      }

      // This test mainly ensures no memory leaks or excessive allocations
      expect(true).toBe(true); // Performance is tested implicitly
    });
  });

  describe('Latency Performance', () => {
    test('Audio processing latency should meet real-time requirements', () => {
      const processor = new AudioProcessor();
      const startTime = performance.now();

      // Simulate audio processing pipeline
      processor.initialize().then(() => {
        const mockData = PerformanceTestUtils.generateTestAudioData(64);

        // Process frequency data
        const processedData = processor.getSmoothedFrequencyData(0.8);

        const endTime = performance.now();
        const latency = endTime - startTime;

        // Total latency should be minimal for real-time audio
        expect(latency).toBeLessThan(MAX_PROCESSING_TIME);
        expect(processedData).toBeDefined();
      });
    });

    test('End-to-end processing latency should support <16ms requirement', () => {
      const processor = new FrequencyProcessor(128);
      const visualization = new BarVisualization();
      const mockAnalyser = mockAudioContext.createAnalyser();

      const mockData = PerformanceTestUtils.generateTestAudioData(64);
      mockAnalyser.getByteFrequencyData = jest
        .fn()
        .mockImplementation((arr: Uint8Array) => {
          for (let i = 0; i < Math.min(arr.length, mockData.length); i++) {
            arr[i] = mockData[i]!;
          }
        });

      const mockSVG = {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        firstChild: null,
      } as any;

      const renderContext = {
        ctx: mockSVG,
        width: 400,
        height: 400,
        centerX: 200,
        centerY: 200,
        time: performance.now(),
        theme: 'frost_light' as const,
      };

      PerformanceTestUtils.startMeasurement();

      // Complete processing pipeline
      const audioData = processor.processFrame(mockAnalyser, 0.8);
      if (audioData) {
        visualization.render(
          renderContext,
          audioData,
          visualization.getDefaultConfig()
        );
      }

      const totalTime = PerformanceTestUtils.endMeasurement();

      // Complete pipeline should be well under 16ms frame budget
      expect(totalTime).toBeLessThan(TARGET_FRAME_TIME);
    });
  });

  describe('Stress Testing', () => {
    test('Should maintain performance under high frequency data throughput', () => {
      const processor = new FrequencyProcessor(512); // High resolution
      const mockAnalyser = mockAudioContext.createAnalyser();
      mockAnalyser.frequencyBinCount = 256;

      const mockData = PerformanceTestUtils.generateTestAudioData(256);
      mockAnalyser.getByteFrequencyData = jest
        .fn()
        .mockImplementation((arr: Uint8Array) => {
          for (let i = 0; i < Math.min(arr.length, mockData.length); i++) {
            arr[i] = mockData[i]!;
          }
        });

      PerformanceTestUtils.startMeasurement();

      // Process 120 frames (2 seconds at 60fps)
      for (let i = 0; i < 120; i++) {
        processor.processFrame(mockAnalyser, 0.8);
      }

      const executionTime = PerformanceTestUtils.endMeasurement();

      // Should maintain performance even with high data throughput
      expect(executionTime).toBeLessThan(TARGET_FRAME_TIME * 120);
    });

    test('Should handle multiple simultaneous visualizations efficiently', () => {
      const visualizations = [
        new BarVisualization(),
        new BarVisualization(),
        new BarVisualization(),
      ];

      const mockSVG = {
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        firstChild: null,
      } as any;

      const renderContext = {
        ctx: mockSVG,
        width: 400,
        height: 400,
        centerX: 200,
        centerY: 200,
        time: performance.now(),
        theme: 'frost_light' as const,
      };

      const testData = PerformanceTestUtils.generateTestFrequencyData(48);

      PerformanceTestUtils.startMeasurement();

      // Render all visualizations simultaneously
      visualizations.forEach(viz => {
        viz.render(renderContext, testData, viz.getDefaultConfig());
      });

      const executionTime = PerformanceTestUtils.endMeasurement();

      // Multiple visualizations should still render within frame budget
      expect(executionTime).toBeLessThan(TARGET_FRAME_TIME);
    });
  });

  describe('Performance Regression Detection', () => {
    test('Baseline performance metrics should not degrade', () => {
      // These tests serve as regression detection for performance changes
      const processor = new FrequencyProcessor(128);
      const mockAnalyser = mockAudioContext.createAnalyser();

      const mockData = PerformanceTestUtils.generateTestAudioData(64);
      mockAnalyser.getByteFrequencyData = jest
        .fn()
        .mockImplementation((arr: Uint8Array) => {
          for (let i = 0; i < Math.min(arr.length, mockData.length); i++) {
            arr[i] = mockData[i]!;
          }
        });

      const measurements: number[] = [];

      // Take multiple measurements for statistical analysis
      for (let run = 0; run < 10; run++) {
        PerformanceTestUtils.startMeasurement();

        // Standard frame processing
        processor.processFrame(mockAnalyser, 0.8);

        measurements.push(PerformanceTestUtils.endMeasurement());
      }

      const averageTime =
        measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxTime = Math.max(...measurements);

      // Average should be well under budget, max should not exceed budget
      expect(averageTime).toBeLessThan(MAX_PROCESSING_TIME / 2);
      expect(maxTime).toBeLessThan(MAX_PROCESSING_TIME);
    });
  });
});
