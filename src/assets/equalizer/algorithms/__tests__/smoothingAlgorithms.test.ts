/**
 * smoothingAlgorithms Unit Tests
 * Part of Story E6.1 - Audio Processing Extraction
 */

import {
  applyExponentialSmoothing,
  applyLinearSmoothing,
  applyAttackReleaseSmoothing,
  updatePeakTracking,
  applyGaussianSmoothing,
  applyMedianFilter,
  initializeSmoothingState,
  initializePeakTrackingState,
  calculateDynamicResponseSpeed,
  type SmoothingConfig,
  type PeakTrackingState,
  type SmoothingState,
} from '../smoothingAlgorithms';

describe('smoothingAlgorithms', () => {
  describe('Exponential Smoothing', () => {
    test('should apply exponential smoothing', () => {
      const currentData = [100, 200, 150, 80];
      const previousSmoothed = [50, 100, 120, 90];
      const responseSpeed = 0.5;

      const result = applyExponentialSmoothing(
        currentData,
        previousSmoothed,
        responseSpeed
      );

      expect(result).toHaveLength(4);
      expect(result[0]).toBeCloseTo((0.5 * 50) / 255 + (0.5 * 100) / 255); // (previous * (1-speed)) + (current * speed)
      expect(result[1]).toBeCloseTo((0.5 * 100) / 255 + (0.5 * 200) / 255);
    });

    test('should handle Uint8Array input', () => {
      const currentData = new Uint8Array([128, 255, 64]);
      const previousSmoothed = [0.2, 0.8, 0.3];
      const responseSpeed = 0.8;

      const result = applyExponentialSmoothing(
        currentData,
        previousSmoothed,
        responseSpeed
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toBeGreaterThan(0.2);
      expect(result[1]).toBeLessThan(1);
    });

    test('should handle empty previous data', () => {
      const currentData = [100, 150];
      const previousSmoothed: number[] = [];

      const result = applyExponentialSmoothing(currentData, previousSmoothed);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeCloseTo(100 / 255);
      expect(result[1]).toBeCloseTo(150 / 255);
    });

    test('should validate response speed', () => {
      const currentData = [100];
      const previousSmoothed = [0.5];

      expect(() =>
        applyExponentialSmoothing(currentData, previousSmoothed, -0.1)
      ).toThrow('Response speed must be between 0 and 1');
      expect(() =>
        applyExponentialSmoothing(currentData, previousSmoothed, 1.5)
      ).toThrow('Response speed must be between 0 and 1');
    });

    test('should handle undefined values', () => {
      const currentData = [100, undefined, 200] as any;
      const previousSmoothed = [0.3, 0.4, 0.5];

      const result = applyExponentialSmoothing(
        currentData,
        previousSmoothed,
        0.5
      );

      expect(result[1]).toBeCloseTo(0.4 * 0.5); // Previous value preserved when current is undefined
    });

    test('should preserve normalized inputs', () => {
      const currentData = [0.2, 0.7, 0.4];
      const previousSmoothed = [0.1, 0.3, 0.5];

      const result = applyExponentialSmoothing(
        currentData,
        previousSmoothed,
        0.6
      );

      expect(result[0]).toBeCloseTo(0.1 * 0.4 + 0.2 * 0.6);
      expect(result[1]).toBeCloseTo(0.3 * 0.4 + 0.7 * 0.6);
      expect(result[2]).toBeCloseTo(0.5 * 0.4 + 0.4 * 0.6);
    });
  });

  describe('Linear Smoothing', () => {
    test('should apply linear smoothing with default window', () => {
      const inputData = [10, 30, 50, 20, 40];

      const result = applyLinearSmoothing(inputData);

      expect(result).toHaveLength(5);
      expect(result[0]).toBeCloseTo(20); // (10+30)/2
      expect(result[1]).toBeCloseTo(30); // (10+30+50)/3
      expect(result[2]).toBeCloseTo(33.33, 1); // (30+50+20)/3
    });

    test('should apply linear smoothing with custom window', () => {
      const inputData = [10, 20, 30, 40, 50];

      const result = applyLinearSmoothing(inputData, 5);

      expect(result).toHaveLength(5);
      expect(result[2]).toBeCloseTo(30); // All values averaged for center point
    });

    test('should validate window size', () => {
      expect(() => applyLinearSmoothing([1, 2, 3], 0)).toThrow(
        'Window size must be at least 1'
      );
    });

    test('should handle edge cases', () => {
      const inputData = [100];

      const result = applyLinearSmoothing(inputData, 3);

      expect(result).toEqual([100]);
    });

    test('should handle undefined values', () => {
      const inputData = [10, undefined, 30, undefined, 50] as any;

      const result = applyLinearSmoothing(inputData);

      expect(result[0]).toBeCloseTo(10);
      expect(result[2]).toBeCloseTo(20); // (10+30)/2, skipping undefined
      expect(result[4]).toBeCloseTo(40); // (30+50)/2
    });
  });

  describe('Attack/Release Smoothing', () => {
    test('should apply faster attack for rising values', () => {
      const currentData = [200, 150, 100];
      const previousData = [100, 200, 150];
      const attackSpeed = 0.9;
      const releaseSpeed = 0.3;

      const result = applyAttackReleaseSmoothing(
        currentData,
        previousData,
        attackSpeed,
        releaseSpeed
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toBeCloseTo(100 + (200 - 100) * 0.9); // Rising: use attack speed
      expect(result[1]).toBeCloseTo(200 + (150 - 200) * 0.3); // Falling: use release speed
    });

    test('should handle empty previous data', () => {
      const currentData = [100, 200];
      const previousData: number[] = [];

      const result = applyAttackReleaseSmoothing(currentData, previousData);

      expect(result).toEqual([100, 200]);
    });

    test('should validate speed parameters', () => {
      const currentData = [100];
      const previousData = [50];

      expect(() =>
        applyAttackReleaseSmoothing(currentData, previousData, -0.1, 0.5)
      ).toThrow('Attack and release speeds must be between 0 and 1');
      expect(() =>
        applyAttackReleaseSmoothing(currentData, previousData, 0.5, 1.5)
      ).toThrow('Attack and release speeds must be between 0 and 1');
    });

    test('should handle equal values', () => {
      const currentData = [100, 100];
      const previousData = [100, 100];

      const result = applyAttackReleaseSmoothing(
        currentData,
        previousData,
        0.9,
        0.3
      );

      expect(result).toEqual([100, 100]);
    });
  });

  describe('Peak Tracking', () => {
    let peakState: PeakTrackingState;
    let config: SmoothingConfig;

    beforeEach(() => {
      peakState = initializePeakTrackingState(3);
      config = {
        responseSpeed: 0.8,
        peakHoldTime: 1000,
        peakDecayRate: 0.05,
      };
    });

    test('should update peaks for new maximum values', () => {
      const currentData = [0.8, 0.6, 0.9];
      const currentTime = 1000;

      updatePeakTracking(currentData, peakState, config, currentTime);

      expect(peakState.peakValues).toEqual([0.8, 0.6, 0.9]);
      expect(peakState.peakTimers[0]).toBe(currentTime + 1000);
    });

    test('should maintain peaks during hold time', () => {
      // Set initial peaks
      peakState.peakValues = [0.8, 0.6, 0.9];
      peakState.peakTimers = [2000, 2000, 2000];

      const currentData = [0.5, 0.4, 0.7];
      const currentTime = 1500; // Before hold time expires

      updatePeakTracking(currentData, peakState, config, currentTime);

      expect(peakState.peakValues).toEqual([0.8, 0.6, 0.9]);
    });

    test('should apply decay after hold time', () => {
      // Set initial peaks
      peakState.peakValues = [0.8, 0.6, 0.9];
      peakState.peakTimers = [1000, 1000, 1000];

      const currentData = [0.5, 0.4, 0.7];
      const currentTime = 2000; // After hold time expires

      updatePeakTracking(currentData, peakState, config, currentTime);

      expect(peakState.peakValues[0]).toBeCloseTo(0.75); // 0.8 - 0.05
      expect(peakState.peakValues[1]).toBeCloseTo(0.55); // 0.6 - 0.05
      expect(peakState.peakValues[2]).toBeCloseTo(0.85); // 0.9 - 0.05
    });

    test('should resize arrays if needed', () => {
      const currentData = [0.1, 0.2, 0.3, 0.4, 0.5]; // More data than initialized

      updatePeakTracking(currentData, peakState, config);

      expect(peakState.peakValues).toHaveLength(5);
      expect(peakState.peakTimers).toHaveLength(5);
    });

    test('should not allow negative peaks', () => {
      peakState.peakValues = [0.02];
      peakState.peakTimers = [0]; // Expired

      const currentData = [0.01];
      const currentTime = 2000;

      updatePeakTracking(currentData, peakState, config, currentTime);

      expect(peakState.peakValues[0]).toBe(0); // Should not go below 0
    });
  });

  describe('Gaussian Smoothing', () => {
    test('should apply Gaussian smoothing', () => {
      const inputData = [0, 100, 0, 0, 0];

      const result = applyGaussianSmoothing(inputData, 1.0);

      expect(result).toHaveLength(5);
      expect(result[1]).toBeLessThan(100); // Peak should be reduced
      expect(result[0]).toBeGreaterThan(0); // Neighbors should increase
      expect(result[2]).toBeGreaterThan(0);
    });

    test('should validate sigma parameter', () => {
      expect(() => applyGaussianSmoothing([1, 2, 3], 0)).toThrow(
        'Sigma must be greater than 0'
      );
      expect(() => applyGaussianSmoothing([1, 2, 3], -1)).toThrow(
        'Sigma must be greater than 0'
      );
    });

    test('should handle edge effects', () => {
      const inputData = [100, 0, 0];

      const result = applyGaussianSmoothing(inputData, 0.5);

      expect(result[0]).toBeGreaterThan(0);
      expect(result[1]).toBeGreaterThan(0);
    });
  });

  describe('Median Filter', () => {
    test('should apply median filtering', () => {
      const inputData = [1, 100, 2, 3, 4]; // 100 is an outlier

      const result = applyMedianFilter(inputData, 3);

      expect(result).toHaveLength(5);
      expect(result[1]).toBeLessThan(100); // Outlier should be reduced
    });

    test('should handle even-sized windows', () => {
      const inputData = [1, 2, 3, 4];

      const result = applyMedianFilter(inputData, 2);

      expect(result).toHaveLength(4);
      expect(result).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    });

    test('should validate window size', () => {
      expect(() => applyMedianFilter([1, 2, 3], 0)).toThrow(
        'Window size must be at least 1'
      );
    });

    test('should handle undefined values', () => {
      const inputData = [1, undefined, 3, undefined, 5] as any;

      const result = applyMedianFilter(inputData, 3);

      expect(result).toHaveLength(5);
      expect(result[0]).toBe(1);
      expect(result[2]).toBe(3);
    });
  });

  describe('State Initialization', () => {
    test('should initialize smoothing state', () => {
      const state = initializeSmoothingState(5);

      expect(state.previousValues).toHaveLength(5);
      expect(state.smoothedValues).toHaveLength(5);
      expect(state.previousValues.every(v => v === 0)).toBe(true);
      expect(state.smoothedValues.every(v => v === 0)).toBe(true);
      expect(state.initialized).toBe(false);
    });

    test('should initialize peak tracking state', () => {
      const state = initializePeakTrackingState(3);

      expect(state.peakValues).toHaveLength(3);
      expect(state.peakTimers).toHaveLength(3);
      expect(state.peakValues.every(v => v === 0)).toBe(true);
      expect(state.peakTimers.every(v => v === 0)).toBe(true);
      expect(state.lastUpdate).toBeCloseTo(Date.now(), -2);
    });
  });

  describe('Dynamic Response Speed', () => {
    test('should calculate dynamic response speed', () => {
      const currentData = [0.8, 0.6, 0.9];
      const previousData = [0.2, 0.3, 0.1];
      const baseSpeed = 0.5;
      const sensitivity = 0.5;

      const dynamicSpeed = calculateDynamicResponseSpeed(
        currentData,
        previousData,
        baseSpeed,
        sensitivity
      );

      expect(dynamicSpeed).toBeGreaterThan(baseSpeed); // Should increase for large changes
      expect(dynamicSpeed).toBeLessThanOrEqual(1); // Should not exceed 1
    });

    test('should handle empty data', () => {
      const speed = calculateDynamicResponseSpeed([], [], 0.8);

      expect(speed).toBe(0.8); // Should return base speed
    });

    test('should handle no change', () => {
      const currentData = [0.5, 0.5, 0.5];
      const previousData = [0.5, 0.5, 0.5];

      const speed = calculateDynamicResponseSpeed(
        currentData,
        previousData,
        0.8
      );

      expect(speed).toBe(0.8); // Should return base speed
    });

    test('should respect maximum speed limit', () => {
      const currentData = [1.0, 1.0, 1.0];
      const previousData = [0.0, 0.0, 0.0];
      const baseSpeed = 0.9;
      const sensitivity = 2.0;

      const speed = calculateDynamicResponseSpeed(
        currentData,
        previousData,
        baseSpeed,
        sensitivity
      );

      expect(speed).toBe(1.0); // Should cap at 1.0
    });

    test('should handle mismatched array lengths', () => {
      const currentData = [0.8, 0.6];
      const previousData = [0.2, 0.3, 0.1];

      const speed = calculateDynamicResponseSpeed(
        currentData,
        previousData,
        0.5
      );

      expect(speed).toBeGreaterThanOrEqual(0.5);
    });
  });
});
