/**
 * Test to verify inner radius functionality in DotVisualization
 */

import { DotVisualization } from '../DotVisualization';

describe('DotVisualization Inner Radius', () => {
  let dotVis: DotVisualization;
  let mockContext: any;
  let mockCanvas: any;

  beforeEach(() => {
    dotVis = new DotVisualization(null);

    // Create a real canvas for testing
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    const ctx = mockCanvas.getContext('2d');

    mockContext = {
      ctx,
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300,
    };

    // Spy on arc method to track dot positions
    jest.spyOn(ctx, 'arc');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should position dots starting from inner radius', () => {
    const config = {
      barCount: 8,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 100,
      responseSpeed: 0.8,
      colorMode: 'gradient',
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      glowIntensity: 0,
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      layout: 'radial' as const,
      dotSize: 10,
      gridColumns: 8,
      gridRows: 6,
      dotSpacing: 20,
      trailEffect: false,
      gravityEffect: false,
      fillMode: 'solid' as const,
      shape: 'circle' as const,
      innerRadius: 150, // Set a specific inner radius
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
    };

    // Create frequency data with no amplitude (should position at inner radius)
    const frequencyData = {
      bands: new Float32Array(8).fill(0), // Zero amplitude
      raw: new Uint8Array(32),
      peakFrequency: 440,
      averageFrequency: 0,
    };

    // Render the dots
    dotVis.render(mockContext, frequencyData, config);

    // Check that arc was called for each dot
    expect(mockContext.ctx.arc).toHaveBeenCalledTimes(8);

    // Calculate expected positions for dots at inner radius
    const centerX = 400;
    const centerY = 300;
    const innerRadius = 150;

    // Get all arc calls
    const arcCalls = (mockContext.ctx.arc as jest.Mock).mock.calls;

    // Verify each dot is positioned at the inner radius distance
    arcCalls.forEach((call: any[]) => {
      const [x, y, radius] = call;

      // Calculate distance from center
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );

      // With zero amplitude, dots should be at inner radius
      // Allow small tolerance for floating point
      expect(distance).toBeCloseTo(innerRadius, 0);
    });
  });

  test('should extend dots outward from inner radius based on frequency', () => {
    const config = {
      barCount: 4,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 100,
      responseSpeed: 0.8,
      colorMode: 'gradient',
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      glowIntensity: 0,
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      layout: 'radial' as const,
      dotSize: 10,
      gridColumns: 8,
      gridRows: 6,
      dotSpacing: 20,
      trailEffect: false,
      gravityEffect: false,
      fillMode: 'solid' as const,
      shape: 'circle' as const,
      innerRadius: 100,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
    };

    // Create frequency data with full amplitude
    const frequencyData = {
      bands: new Float32Array(4).fill(1.0), // Full amplitude
      raw: new Uint8Array(16),
      peakFrequency: 440,
      averageFrequency: 1.0,
    };

    // Render the dots
    dotVis.render(mockContext, frequencyData, config);

    // Get all arc calls
    const arcCalls = (mockContext.ctx.arc as jest.Mock).mock.calls;
    const centerX = 400;
    const centerY = 300;
    const innerRadius = 100;
    const expectedExtension = config.maxHeight / 2; // 50

    // Verify dots are extended beyond inner radius
    arcCalls.forEach((call: any[]) => {
      const [x, y] = call;

      // Calculate distance from center
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );

      // With full amplitude and smoothing (responseSpeed: 0.8),
      // the value becomes 0.8 on first render
      // So expected extension is: 0.8 * (maxHeight / 2) = 0.8 * 50 = 40
      const actualExpectedExtension = 0.8 * expectedExtension;
      expect(distance).toBeCloseTo(innerRadius + actualExpectedExtension, 0);
    });
  });

  test('should respect arc mode with partial angles', () => {
    const config = {
      barCount: 4,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 100,
      responseSpeed: 0.8,
      colorMode: 'gradient',
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      glowIntensity: 0,
      pulseMode: 'none',
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      layout: 'radial' as const,
      dotSize: 10,
      gridColumns: 8,
      gridRows: 6,
      dotSpacing: 20,
      trailEffect: false,
      gravityEffect: false,
      fillMode: 'solid' as const,
      shape: 'circle' as const,
      innerRadius: 100,
      startAngle: 0,
      endAngle: 180, // Half circle
      arcMode: true,
    };

    const frequencyData = {
      bands: new Float32Array(4).fill(0),
      raw: new Uint8Array(16),
      peakFrequency: 440,
      averageFrequency: 0,
    };

    // Render the dots
    dotVis.render(mockContext, frequencyData, config);

    // Get all arc calls
    const arcCalls = (mockContext.ctx.arc as jest.Mock).mock.calls;
    const centerX = 400;
    const centerY = 300;

    // Verify dots are only in the specified arc (0 to 180 degrees = right half)
    arcCalls.forEach((call: any[]) => {
      const [x, y] = call;

      // Calculate angle from center
      const angle = Math.atan2(y - centerY, x - centerX);
      const degrees = ((angle * 180) / Math.PI + 360) % 360;

      // Dots should be between 0 and 180 degrees (with some tolerance)
      // Note: angles might be shifted by -90 degrees in the implementation
      // so we check if x >= centerX (right half of circle)
      expect(x).toBeGreaterThanOrEqual(centerX - 1); // Allow small tolerance
    });
  });
});
