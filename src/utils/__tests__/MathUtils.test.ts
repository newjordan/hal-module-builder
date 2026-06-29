import {
  clamp,
  lerp,
  mapRange,
  degToRad,
  radToDeg,
  FFTUtils,
  TransformUtils,
  GeometryUtils,
  AnimationUtils,
  PerformanceUtils,
} from '../MathUtils';

describe('MathUtils', () => {
  describe('Basic Math Functions', () => {
    describe('clamp', () => {
      it('should clamp value below minimum', () => {
        expect(clamp(-5, 0, 10)).toBe(0);
      });

      it('should clamp value above maximum', () => {
        expect(clamp(15, 0, 10)).toBe(10);
      });

      it('should return value within range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
      });

      it('should handle negative ranges', () => {
        expect(clamp(-5, -10, -1)).toBe(-5);
      });
    });

    describe('lerp', () => {
      it('should interpolate between two values', () => {
        expect(lerp(0, 10, 0.5)).toBe(5);
      });

      it('should return start value for t=0', () => {
        expect(lerp(10, 20, 0)).toBe(10);
      });

      it('should return end value for t=1', () => {
        expect(lerp(10, 20, 1)).toBe(20);
      });

      it('should clamp t to [0,1]', () => {
        expect(lerp(0, 10, 2)).toBe(10);
        expect(lerp(0, 10, -1)).toBe(0);
      });
    });

    describe('mapRange', () => {
      it('should map value from one range to another', () => {
        expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      });

      it('should handle negative ranges', () => {
        expect(mapRange(-5, -10, 0, 0, 100)).toBe(50);
      });

      it('should handle reversed ranges', () => {
        expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
      });
    });

    describe('degToRad', () => {
      it('should convert degrees to radians', () => {
        expect(degToRad(180)).toBeCloseTo(Math.PI);
        expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
        expect(degToRad(0)).toBe(0);
      });
    });

    describe('radToDeg', () => {
      it('should convert radians to degrees', () => {
        expect(radToDeg(Math.PI)).toBeCloseTo(180);
        expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
        expect(radToDeg(0)).toBe(0);
      });
    });
  });

  describe('FFTUtils', () => {
    describe('smooth', () => {
      it('should smooth between arrays', () => {
        const current = [0, 0, 0];
        const target = [10, 20, 30];
        const result = FFTUtils.smooth(current, target, 0.5);

        expect(result).toEqual([5, 10, 15]);
      });

      it('should handle different array lengths', () => {
        const current = [0, 0, 0];
        const target = [10, 20]; // shorter
        const result = FFTUtils.smooth(current, target, 0.5);

        expect(result).toEqual([5, 10, 0]);
      });

      it('should use default smoothing factor', () => {
        const current = [0];
        const target = [10];
        const result = FFTUtils.smooth(current, target);

        expect(result[0]).toBe(8); // 0 * 0.2 + 10 * 0.8
      });
    });

    describe('getFrequencyBands', () => {
      it('should divide data into frequency bands', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8];
        const result = FFTUtils.getFrequencyBands(data, 4);

        expect(result).toHaveLength(4);
        expect(result[0]).toBe(1.5); // average of [1, 2]
        expect(result[1]).toBe(3.5); // average of [3, 4]
      });

      it('should use default band count', () => {
        const data = new Array(64).fill(1);
        const result = FFTUtils.getFrequencyBands(data);

        expect(result).toHaveLength(8);
        expect(result[0]).toBe(1);
      });

      it('should handle empty data', () => {
        const result = FFTUtils.getFrequencyBands([]);
        expect(result).toEqual([]);
      });
    });

    describe('filterFrequencyRange', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      it('should filter bass range', () => {
        const result = FFTUtils.filterFrequencyRange(data, 'bass');
        expect(result).toEqual([1, 2, 3]); // first 30%
      });

      it('should filter mid range', () => {
        const result = FFTUtils.filterFrequencyRange(data, 'mid');
        expect(result).toEqual([4, 5, 6, 7]); // 30-70%
      });

      it('should filter treble range', () => {
        const result = FFTUtils.filterFrequencyRange(data, 'treble');
        expect(result).toEqual([8, 9, 10]); // last 30%
      });

      it('should return full range for full', () => {
        const result = FFTUtils.filterFrequencyRange(data, 'full');
        expect(result).toEqual(data);
      });

      it('should handle invalid range', () => {
        const result = FFTUtils.filterFrequencyRange(data, 'invalid' as any);
        expect(result).toEqual(data);
      });
    });
  });

  describe('TransformUtils', () => {
    describe('getTransformMatrix', () => {
      it('should generate transform matrix string', () => {
        const result = TransformUtils.getTransformMatrix(1.5, 45, 10, 20);
        expect(result).toBe(
          'translate(-50%, -50%) translate(10px, 20px) scale(1.5) rotate(45deg)'
        );
      });

      it('should handle zero values', () => {
        const result = TransformUtils.getTransformMatrix(1, 0, 0, 0);
        expect(result).toBe(
          'translate(-50%, -50%) translate(0px, 0px) scale(1) rotate(0deg)'
        );
      });
    });

    describe('toPolar', () => {
      it('should convert cartesian to polar coordinates', () => {
        const result = TransformUtils.toPolar(3, 4);
        expect(result.r).toBeCloseTo(5);
        expect(result.theta).toBeCloseTo(Math.atan2(4, 3));
      });

      it('should handle origin', () => {
        const result = TransformUtils.toPolar(0, 0);
        expect(result.r).toBe(0);
        expect(result.theta).toBe(0);
      });
    });

    describe('toCartesian', () => {
      it('should convert polar to cartesian coordinates', () => {
        const result = TransformUtils.toCartesian(5, Math.PI / 4);
        expect(result.x).toBeCloseTo(5 * Math.cos(Math.PI / 4));
        expect(result.y).toBeCloseTo(5 * Math.sin(Math.PI / 4));
      });

      it('should handle zero radius', () => {
        const result = TransformUtils.toCartesian(0, Math.PI);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
      });
    });

    describe('getCirclePoints', () => {
      it('should generate points on circle', () => {
        const result = TransformUtils.getCirclePoints(0, 0, 10, 4);

        expect(result).toHaveLength(4);
        expect(result[0].x).toBeCloseTo(10);
        expect(result[0].y).toBeCloseTo(0);
        expect(result[1].y).toBeCloseTo(10);
      });

      it('should handle start angle', () => {
        const result = TransformUtils.getCirclePoints(0, 0, 10, 4, Math.PI / 2);

        expect(result[0].x).toBeCloseTo(0);
        expect(result[0].y).toBeCloseTo(10);
      });

      it('should include angle information', () => {
        const result = TransformUtils.getCirclePoints(0, 0, 10, 4);

        expect(result[0].angle).toBe(0);
        expect(result[1].angle).toBeCloseTo(Math.PI / 2);
      });
    });
  });

  describe('GeometryUtils', () => {
    describe('distance', () => {
      it('should calculate distance between points', () => {
        expect(GeometryUtils.distance(0, 0, 3, 4)).toBe(5);
        expect(GeometryUtils.distance(0, 0, 0, 0)).toBe(0);
      });

      it('should handle negative coordinates', () => {
        expect(GeometryUtils.distance(-3, -4, 0, 0)).toBe(5);
      });
    });

    describe('isPointInCircle', () => {
      it('should detect point inside circle', () => {
        expect(GeometryUtils.isPointInCircle(1, 1, 0, 0, 5)).toBe(true);
      });

      it('should detect point outside circle', () => {
        expect(GeometryUtils.isPointInCircle(10, 10, 0, 0, 5)).toBe(false);
      });

      it('should detect point on circle edge', () => {
        expect(GeometryUtils.isPointInCircle(5, 0, 0, 0, 5)).toBe(true);
      });
    });

    describe('angleBetweenPoints', () => {
      it('should calculate angle between points', () => {
        expect(GeometryUtils.angleBetweenPoints(0, 0, 1, 0)).toBe(0);
        expect(GeometryUtils.angleBetweenPoints(0, 0, 0, 1)).toBeCloseTo(
          Math.PI / 2
        );
      });

      it('should handle same points', () => {
        expect(GeometryUtils.angleBetweenPoints(0, 0, 0, 0)).toBe(0);
      });
    });

    describe('normalizeAngle', () => {
      it('should normalize positive angles', () => {
        expect(GeometryUtils.normalizeAngle(450)).toBe(90);
        expect(GeometryUtils.normalizeAngle(720)).toBe(0);
      });

      it('should normalize negative angles', () => {
        expect(GeometryUtils.normalizeAngle(-90)).toBe(270);
        expect(GeometryUtils.normalizeAngle(-450)).toBe(270);
      });

      it('should handle angles in range', () => {
        expect(GeometryUtils.normalizeAngle(180)).toBe(180);
        expect(GeometryUtils.normalizeAngle(0)).toBe(0);
      });
    });
  });

  describe('AnimationUtils', () => {
    describe('easeInOut', () => {
      it('should provide ease in-out animation curve', () => {
        expect(AnimationUtils.easeInOut(0)).toBe(0);
        expect(AnimationUtils.easeInOut(1)).toBe(1);
        expect(AnimationUtils.easeInOut(0.5)).toBe(0.5);
      });

      it('should handle edge cases', () => {
        expect(AnimationUtils.easeInOut(0.25)).toBeCloseTo(0.125);
        expect(AnimationUtils.easeInOut(0.75)).toBeCloseTo(0.875);
      });
    });

    describe('easeInOutCubic', () => {
      it('should provide cubic ease in-out animation curve', () => {
        expect(AnimationUtils.easeInOutCubic(0)).toBe(0);
        expect(AnimationUtils.easeInOutCubic(1)).toBe(1);
        expect(AnimationUtils.easeInOutCubic(0.5)).toBe(0.5);
      });
    });

    describe('bounce', () => {
      it('should provide bounce animation curve', () => {
        expect(AnimationUtils.bounce(0)).toBe(0);
        expect(AnimationUtils.bounce(1)).toBeCloseTo(1, 3);
      });

      it('should handle different bounce phases', () => {
        const result1 = AnimationUtils.bounce(0.2);
        const result2 = AnimationUtils.bounce(0.6);
        const result3 = AnimationUtils.bounce(0.8);
        const result4 = AnimationUtils.bounce(0.95);

        expect(result1).toBeGreaterThan(0);
        expect(result2).toBeGreaterThan(0);
        expect(result3).toBeGreaterThan(0);
        expect(result4).toBeGreaterThan(0);
      });
    });

    describe('frameIndependentLerp', () => {
      it('should interpolate frame-independently', () => {
        const result = AnimationUtils.frameIndependentLerp(0, 10, 5, 0.1);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(10);
      });

      it('should approach target over time', () => {
        let current = 0;
        current = AnimationUtils.frameIndependentLerp(current, 10, 5, 0.1);
        current = AnimationUtils.frameIndependentLerp(current, 10, 5, 0.1);

        expect(current).toBeGreaterThan(0);
        expect(current).toBeLessThan(10);
      });
    });

    describe('oscillate', () => {
      it('should create oscillating value', () => {
        expect(AnimationUtils.oscillate(0)).toBe(0);
        expect(AnimationUtils.oscillate(0.25)).toBeCloseTo(1);
        expect(AnimationUtils.oscillate(0.5)).toBeCloseTo(0);
      });

      it('should handle frequency parameter', () => {
        const result1 = AnimationUtils.oscillate(0.25, 2);
        const result2 = AnimationUtils.oscillate(0.125, 2);
        expect(result1).toBeCloseTo(0);
        expect(result2).toBeCloseTo(1);
      });

      it('should handle amplitude and offset', () => {
        const result = AnimationUtils.oscillate(0.25, 1, 5, 10);
        expect(result).toBeCloseTo(15); // sin(PI/2) * 5 + 10
      });
    });
  });

  describe('PerformanceUtils', () => {
    beforeEach(() => {
      // Clear any existing marks
      PerformanceUtils['performanceMarks'].clear();
    });

    describe('performance measurement', () => {
      it('should measure performance', () => {
        PerformanceUtils.startMeasure('test');
        const duration = PerformanceUtils.endMeasure('test');

        expect(duration).toBeGreaterThanOrEqual(0);
        expect(typeof duration).toBe('number');
      });

      it('should warn for unmeasured operations', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const duration = PerformanceUtils.endMeasure('nonexistent');

        expect(duration).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith(
          "Performance measure 'nonexistent' was not started"
        );

        consoleSpy.mockRestore();
      });

      it('should clean up marks after measurement', () => {
        PerformanceUtils.startMeasure('test');
        PerformanceUtils.endMeasure('test');

        // Should not exist anymore
        const duration = PerformanceUtils.endMeasure('test');
        expect(duration).toBe(0);
      });
    });

    describe('throttle', () => {
      it('should throttle function calls', done => {
        let callCount = 0;
        const throttled = PerformanceUtils.throttle(() => {
          callCount++;
        }, 50);

        throttled();
        throttled();
        throttled();

        expect(callCount).toBe(1);

        setTimeout(() => {
          throttled();
          expect(callCount).toBe(2);
          done();
        }, 60);
      });

      it('should pass arguments to throttled function', done => {
        let receivedArgs: any[] = [];
        const throttled = PerformanceUtils.throttle((...args: any[]) => {
          receivedArgs = args;
        }, 10);

        throttled('test', 123);

        setTimeout(() => {
          expect(receivedArgs).toEqual(['test', 123]);
          done();
        }, 20);
      });
    });

    describe('debounce', () => {
      it('should debounce function calls', done => {
        let callCount = 0;
        const debounced = PerformanceUtils.debounce(() => {
          callCount++;
        }, 50);

        debounced();
        debounced();
        debounced();

        expect(callCount).toBe(0);

        setTimeout(() => {
          expect(callCount).toBe(1);
          done();
        }, 60);
      });

      it('should pass arguments to debounced function', done => {
        let receivedArgs: any[] = [];
        const debounced = PerformanceUtils.debounce((...args: any[]) => {
          receivedArgs = args;
        }, 10);

        debounced('test', 456);

        setTimeout(() => {
          expect(receivedArgs).toEqual(['test', 456]);
          done();
        }, 20);
      });
    });

    describe('movingAverage', () => {
      it('should calculate moving average', () => {
        const values = [1, 2, 3, 4, 5];
        const result = PerformanceUtils.movingAverage(values, 3);
        expect(result).toBe(4); // average of [3, 4, 5]
      });

      it('should use default window size', () => {
        const values = new Array(15).fill(2);
        const result = PerformanceUtils.movingAverage(values);
        expect(result).toBe(2);
      });

      it('should handle arrays smaller than window', () => {
        const values = [1, 2];
        const result = PerformanceUtils.movingAverage(values, 5);
        expect(result).toBe(1.5);
      });

      it('should handle empty arrays', () => {
        const result = PerformanceUtils.movingAverage([]);
        expect(result).toBeNaN();
      });
    });
  });
});
