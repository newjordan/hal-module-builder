/**
 * Integration tests for DotVisualization radial rendering.
 */

import { DotVisualization } from '../DotVisualization';
import { RadialTransformService } from '../../../../services/radial/RadialTransformService';

const createPositions = (count: number) =>
  Array.from({ length: count }, () => ({ x: 200, y: 180, angle: Math.PI / 2 }));

describe('DotVisualization Radial Integration', () => {
  let dotVis: DotVisualization;
  let mockContext: any;
  let mockFrequencyData: any;
  let baseConfig: any;

  beforeEach(() => {
    dotVis = new DotVisualization(null);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    mockContext = {
      ctx,
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300,
      time: 0,
      theme: 'frost_light',
    };

    mockFrequencyData = {
      bands: new Float32Array(32).fill(0.5),
      raw: new Uint8Array(128),
      peakFrequency: 440,
      averageFrequency: 0.5,
    };

    baseConfig = {
      barCount: 32,
      barWidth: 4,
      barSpacing: 2,
      maxHeight: 120,
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
      layout: 'radial',
      dotSize: 12,
      gridColumns: 8,
      gridRows: 6,
      dotSpacing: 20,
      trailEffect: false,
      gravityEffect: false,
      scatterRadius: 120,
      fillMode: 'solid',
      shape: 'circle',
      innerRadius: 100,
      outerRadius: 220,
      startAngle: 0,
      endAngle: 360,
      arcMode: false,
      invert: false,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders radial dots using RadialTransformService', () => {
    const positions = createPositions(baseConfig.barCount);
    const transformSpy = jest
      .spyOn(RadialTransformService, 'batchTransform')
      .mockReturnValue(positions as any);
    const renderDotSpy = jest.spyOn(dotVis as any, 'renderDot');

    dotVis.render(mockContext, mockFrequencyData, baseConfig);

    expect(transformSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        centerX: mockContext.centerX,
        centerY: mockContext.centerY,
        innerRadius: baseConfig.innerRadius,
      })
    );
    expect(renderDotSpy).toHaveBeenCalled();
  });

  test('passes radial configuration options to the transform service', () => {
    const arcConfig = {
      ...baseConfig,
      arcMode: true,
      startAngle: 45,
      endAngle: 315,
      invert: true,
      outerRadius: 260,
    };
    const positions = createPositions(arcConfig.barCount);
    const transformSpy = jest
      .spyOn(RadialTransformService, 'batchTransform')
      .mockReturnValue(positions as any);

    dotVis.render(mockContext, mockFrequencyData, arcConfig);

    expect(transformSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        arcMode: true,
        startAngle: 45,
        endAngle: 315,
        invert: true,
        outerRadius: 260,
      })
    );
  });

  test('applies pulse scaling when rendering radial dots', () => {
    const positions = createPositions(baseConfig.barCount);
    jest
      .spyOn(RadialTransformService, 'batchTransform')
      .mockReturnValue(positions as any);
    const renderDotSpy = jest.spyOn(dotVis as any, 'renderDot');

    const pulseConfig = { ...baseConfig, pulseMode: 'strong' };
    dotVis.render(mockContext, mockFrequencyData, pulseConfig);

    expect(renderDotSpy).toHaveBeenCalled();
    const sizes = renderDotSpy.mock.calls.map(call => call[2]);
    expect(Math.max(...sizes)).toBeGreaterThan(baseConfig.dotSize);
  });
});
