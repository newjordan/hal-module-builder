import { RadialTransformService } from '../../../services/radial/RadialTransformService';
import { BarVisualization } from '../visualizations/BarVisualization';
import {
  RenderContext,
  VisualizationConfig,
} from '../visualizations/IVisualization';

describe('BarVisualization', () => {
  let visualization: BarVisualization;
  let mockContext: CanvasRenderingContext2D;
  let mockCanvas: HTMLCanvasElement;
  let renderContext: RenderContext;

  const createFrequencyData = (values: number[]): any => ({
    bands: values,
    raw: new Uint8Array(values.length),
    normalized: values,
    peaks: [],
  });

  beforeEach(() => {
    // Create mock canvas and context
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    mockContext = mockCanvas.getContext('2d')!;

    // Create spies for methods and properties
    jest.spyOn(mockContext, 'fillRect');
    jest.spyOn(mockContext, 'clearRect');
    jest.spyOn(mockContext, 'save');
    jest.spyOn(mockContext, 'restore');

    // Mock shadow properties with getter/setter tracking
    let shadowBlur = 0;
    let shadowColor = 'rgba(0, 0, 0, 0)';

    Object.defineProperty(mockContext, 'shadowBlur', {
      get: () => shadowBlur,
      set: (value: number) => {
        shadowBlur = value;
      },
      configurable: true,
    });

    Object.defineProperty(mockContext, 'shadowColor', {
      get: () => shadowColor,
      set: (value: string) => {
        shadowColor = value;
      },
      configurable: true,
    });

    // Create proper RenderContext
    renderContext = {
      ctx: mockContext,
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300,
      time: 0,
      theme: 'frost_light',
    };

    visualization = new BarVisualization();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create bar visualization instance', () => {
      expect(visualization).toBeDefined();
      expect(visualization.type).toBe('bar');
    });
  });

  describe('Rendering', () => {
    it('should render bars with frequency data', () => {
      const frequencyData = createFrequencyData([
        100, 150, 200, 250, 200, 150, 100, 50,
      ]);
      const config = {
        ...visualization.getDefaultConfig(),
        barCount: 8,
        barWidth: 8,
        barSpacing: 2,
        maxHeight: 300,
        primaryColor: '#00ff00',
      };

      visualization.render(renderContext, frequencyData, config);

      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should handle empty frequency data', () => {
      const frequencyData = createFrequencyData([]);
      const config: VisualizationConfig = {
        barCount: 0,
        barWidth: 0.8,
        barSpacing: 0.1,
        maxHeight: 300,
        responseSpeed: 0.5,
        colorMode: 'solid',
        primaryColor: '#00ff00',
        glowIntensity: 0.5,
        pulseMode: 'none',
        rotation: 0,
        scale: 1,
      };

      expect(() => {
        visualization.render(renderContext, frequencyData, config);
      }).not.toThrow();
    });

    it('should apply color from config', () => {
      const frequencyData = createFrequencyData([100, 150, 200]);
      const config: VisualizationConfig = {
        barCount: 3,
        barWidth: 0.8,
        barSpacing: 0.1,
        maxHeight: 300,
        responseSpeed: 0.5,
        colorMode: 'solid',
        primaryColor: '#ff0000',
        glowIntensity: 0.5,
        pulseMode: 'none',
        rotation: 0,
        scale: 1,
      };

      visualization.render(renderContext, frequencyData, config);

      // Check that fillStyle was set
      expect(mockContext.fillStyle).toBeDefined();
    });

    it('does not apply per-bar shadow; glow handled by container appearance', () => {
      const frequencyData = createFrequencyData([0.5, 0.7, 0.8]); // Normalized values
      const config = {
        ...visualization.getDefaultConfig(),
        barCount: 3,
        glowIntensity: 0.75,
        primaryColor: '#0000ff',
      };

      // Add spy to verify save/restore is called
      const saveSpy = jest.spyOn(mockContext, 'save');
      const restoreSpy = jest.spyOn(mockContext, 'restore');

      visualization.render(renderContext, frequencyData, config);

      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
      expect(mockContext.shadowBlur).toBe(0);
      expect(mockContext.shadowColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('should handle different bar counts', () => {
      const frequencyData = createFrequencyData(new Array(256).fill(0.5));

      // Test with 32 bars
      const config32 = {
        ...visualization.getDefaultConfig(),
        barCount: 32,
      };
      visualization.render(renderContext, frequencyData, config32);
      expect(mockContext.fillRect).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test with 64 bars
      const config64 = {
        ...visualization.getDefaultConfig(),
        barCount: 64,
      };
      visualization.render(renderContext, frequencyData, config64);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should handle bar width configuration', () => {
      const frequencyData = createFrequencyData([100, 150, 200, 250]);

      // Full width bars
      const configFull = {
        ...visualization.getDefaultConfig(),
        barCount: 4,
        barWidth: 20, // Wider bars
      };
      visualization.render(renderContext, frequencyData, configFull);
      expect(mockContext.fillRect).toHaveBeenCalled();

      jest.clearAllMocks();

      // Half width bars
      const configHalf = {
        ...visualization.getDefaultConfig(),
        barCount: 4,
        barWidth: 4, // Thinner bars
      };
      visualization.render(renderContext, frequencyData, configHalf);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('Radial transform rendering', () => {
    let radialCtx: CanvasRenderingContext2D;
    let radialRenderContext: RenderContext;
    let radialData: number[];
    let radialConfig: VisualizationConfig;

    beforeEach(() => {
      radialData = [0.25, 0.5, 0.75, 0.4];
      radialConfig = {
        ...visualization.getDefaultConfig(),
        layout: 'radial',
        style: 'line',
        barCount: radialData.length,
        innerRadius: 120,
        maxHeight: 160,
      } as VisualizationConfig;

      radialCtx = {
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        strokeStyle: '',
        lineWidth: 0,
        lineCap: 'round',
        fillRect: jest.fn(),
      } as unknown as CanvasRenderingContext2D;

      radialRenderContext = {
        ctx: radialCtx,
        width: 400,
        height: 400,
        centerX: 200,
        centerY: 200,
        time: 0,
        theme: 'frost_light',
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('delegates radial positions to the transform service', () => {
      const transformSpy = jest
        .spyOn(RadialTransformService, 'batchTransform')
        .mockReturnValue(
          radialData.map(() => ({
            x: 210,
            y: 120,
            angle: Math.PI / 2,
            midNormal: { x: 0, y: 1 },
            midTangent: { x: -1, y: 0 },
          })) as any
        );
      const renderSpy = jest.spyOn(visualization as any, 'renderRadialBar');

      (visualization as any).renderRadialBars(
        radialCtx,
        radialData,
        radialConfig,
        radialRenderContext
      );

      expect(transformSpy).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          innerRadius: 120,
          centerX: radialRenderContext.centerX,
          centerY: radialRenderContext.centerY,
        })
      );
      expect(renderSpy).toHaveBeenCalled();
    });

    it('aligns bars using radial vectors from the service', () => {
      const position = {
        x: 220,
        y: 140,
        angle: Math.PI / 3,
        midNormal: { x: 0.5, y: 0.866 },
        midTangent: { x: -0.866, y: 0.5 },
      };
      jest
        .spyOn(RadialTransformService, 'batchTransform')
        .mockReturnValue(radialData.map(() => position) as any);
      const renderSpy = jest.spyOn(visualization as any, 'renderRadialBar');

      (visualization as any).renderRadialBars(
        radialCtx,
        radialData,
        radialConfig,
        radialRenderContext
      );

      const [, baseX, baseY] = renderSpy.mock.calls[0];
      expect(baseX).toBeCloseTo(position.x, 6);
      expect(baseY).toBeCloseTo(position.y, 6);
    });
  });
  describe('Radial bar geometry', () => {
    const createMockContext = () => {
      const ctx: any = {
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        lineWidth: 0,
        lineCap: '',
      };

      let fillStyle = '';
      let strokeStyle = '';

      Object.defineProperty(ctx, 'fillStyle', {
        configurable: true,
        get: () => fillStyle,
        set: (value: string) => {
          fillStyle = value;
        },
      });

      Object.defineProperty(ctx, 'strokeStyle', {
        configurable: true,
        get: () => strokeStyle,
        set: (value: string) => {
          strokeStyle = value;
        },
      });

      return ctx;
    };

    it('draws block bars along the outward radial axis', () => {
      const ctx = createMockContext();
      const blockConfig = {
        ...visualization.getDefaultConfig(),
        layout: 'radial',
        style: 'block',
        barWidth: 10,
        minHeight: 0,
        invert: false,
      } as VisualizationConfig;

      (visualization as any).renderRadialBar(
        ctx,
        100,
        100,
        0,
        50,
        '#ffffff',
        blockConfig,
        1
      );

      expect(ctx.fill).toHaveBeenCalled();

      const calls = [
        ctx.moveTo.mock.calls[0],
        ...ctx.lineTo.mock.calls,
      ] as Array<[number, number]>;
      const xs = calls.map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(100, 5);
      expect(Math.max(...xs)).toBeCloseTo(150, 5);
    });

    it('inverts block bars toward the center when configured', () => {
      const ctx = createMockContext();
      const invertedConfig = {
        ...visualization.getDefaultConfig(),
        layout: 'radial',
        style: 'block',
        barWidth: 10,
        minHeight: 0,
        invert: true,
      } as VisualizationConfig;

      (visualization as any).renderRadialBar(
        ctx,
        100,
        100,
        0,
        40,
        '#ffffff',
        invertedConfig,
        1
      );

      const calls = [
        ctx.moveTo.mock.calls[0],
        ...ctx.lineTo.mock.calls,
      ] as Array<[number, number]>;
      const xs = calls.map(([x]) => x);
      expect(Math.min(...xs)).toBeCloseTo(60, 5);
      expect(Math.max(...xs)).toBeCloseTo(100, 5);
    });

    it('draws line bars using the radial vector', () => {
      const ctx = createMockContext();
      const lineConfig = {
        ...visualization.getDefaultConfig(),
        layout: 'radial',
        style: 'line',
        barWidth: 6,
        barSpacing: 0, // no spacing → line thickness equals barWidth
        minHeight: 0,
      } as VisualizationConfig;

      (visualization as any).renderRadialBar(
        ctx,
        75,
        80,
        Math.PI / 2,
        30,
        '#ffffff',
        lineConfig,
        1
      );

      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.lineCap).toBe('round');
      expect(ctx.lineWidth).toBeCloseTo(6, 5);

      const [[lineX, lineY]] = ctx.lineTo.mock.calls as Array<[number, number]>;
      expect(lineX).toBeCloseTo(75, 5);
      expect(lineY).toBeCloseTo(110, 5);
    });
  });
  describe('Performance', () => {
    it('should render efficiently with large datasets', () => {
      const frequencyData = createFrequencyData(new Array(1024).fill(0.5));
      const config: VisualizationConfig = {
        barCount: 128,
        barWidth: 0.8,
        barSpacing: 0.1,
        maxHeight: 300,
        responseSpeed: 0.5,
        colorMode: 'solid',
        primaryColor: '#00ff00',
        glowIntensity: 0.5,
        pulseMode: 'none',
        rotation: 0,
        scale: 1,
      };

      const startTime = performance.now();
      visualization.render(renderContext, frequencyData, config);
      const endTime = performance.now();

      // Should render in less than 16ms (60fps)
      expect(endTime - startTime).toBeLessThanOrEqual(17);
    });
  });

  describe('Error Handling', () => {
    it('should handle null context gracefully', () => {
      const frequencyData = createFrequencyData([100, 150, 200]);
      const config: VisualizationConfig = {
        barCount: 3,
        barWidth: 0.8,
        barSpacing: 0.1,
        maxHeight: 300,
        responseSpeed: 0.5,
        colorMode: 'solid',
        primaryColor: '#00ff00',
        glowIntensity: 0.5,
        pulseMode: 'none',
        rotation: 0,
        scale: 1,
      };

      expect(() => {
        visualization.render(null as any, frequencyData, config);
      }).not.toThrow();
    });

    it('should handle invalid frequency data', () => {
      const config: VisualizationConfig = {
        barCount: 8,
        barWidth: 0.8,
        barSpacing: 0.1,
        maxHeight: 300,
        responseSpeed: 0.5,
        colorMode: 'solid',
        primaryColor: '#00ff00',
        glowIntensity: 0.5,
        pulseMode: 'none',
        rotation: 0,
        scale: 1,
      };

      expect(() => {
        visualization.render(renderContext, null as any, config);
      }).not.toThrow();

      expect(() => {
        visualization.render(renderContext, undefined as any, config);
      }).not.toThrow();
    });
  });
});
