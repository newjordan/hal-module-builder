import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShapeRenderer } from '../../../components/ShapeRenderer/ShapeRenderer';
import { shapeLibrary } from '../index';
import { CircleShape } from '../Circle';
import { RectangleShape } from '../Rectangle';
import { TriangleShape } from '../Triangle';
import { StarShape } from '../Star';
import { PolygonShape } from '../Polygon';
import { ShapeProperties } from '../IShape';

// Mock console methods to avoid test output noise
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();

  // Register all shapes in the library
  shapeLibrary.register(new CircleShape());
  shapeLibrary.register(new RectangleShape());
  shapeLibrary.register(new TriangleShape());
  shapeLibrary.register(new StarShape());
  shapeLibrary.register(new PolygonShape());
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

describe('ShapeRenderer Integration Tests', () => {
  describe('Shape Rendering (1.3c-INT-004)', () => {
    it('should delegate rendering to correct shape module', () => {
      const layer: ShapeProperties = {
        id: 'test-circle',
        name: 'Test Circle',
        type: 'circle',
        shapeType: 'circle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      };

      const { container } = render(
        <ShapeRenderer layer={layer} size={300} isActive={true} />
      );

      // Circle should render an SVG element
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Circle should have specific circle element
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('should render rectangle shape correctly', () => {
      const layer: ShapeProperties = {
        id: 'test-rect',
        name: 'Test Rectangle',
        type: 'rectangle',
        shapeType: 'rectangle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      const rect = container.querySelector('rect');
      expect(rect).toBeInTheDocument();
    });

    it('should render triangle shape correctly', () => {
      const layer: ShapeProperties = {
        id: 'test-triangle',
        name: 'Test Triangle',
        type: 'triangle',
        shapeType: 'triangle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });

    it('should render star shape correctly', () => {
      const layer: ShapeProperties = {
        id: 'test-star',
        name: 'Test Star',
        type: 'star',
        shapeType: 'star',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });

    it('should render polygon shape correctly', () => {
      const layer: ShapeProperties = {
        id: 'test-polygon',
        name: 'Test Polygon',
        type: 'polygon',
        shapeType: 'polygon',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        shapeSpecific: {
          sides: 6,
        },
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });
  });

  describe('Property Integration (1.3c-INT-006, 1.3c-INT-007)', () => {
    it('should apply common properties to all shapes', () => {
      const layer: ShapeProperties = {
        id: 'test-props',
        name: 'Test Properties',
        type: 'circle',
        shapeType: 'circle',
        visible: true,
        opacity: 0.5,
        blendMode: 'multiply',
        scale: 1.5,
        rotation: 45,
        offsetX: 10,
        offsetY: 20,
        fillType: 'solid',
        fillColor: '#ff0000',
        strokeType: 'solid',
        strokeColor: '#00ff00',
        strokeWidth: 3,
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('opacity', '0.5');
      expect(circle).toHaveAttribute('fill', '#ff0000');
      expect(circle).toHaveAttribute('stroke', '#00ff00');
      expect(circle).toHaveAttribute('stroke-width', '3');
    });

    it('should apply shape-specific properties', () => {
      const layer: ShapeProperties = {
        id: 'test-star-props',
        name: 'Test Star Properties',
        type: 'star',
        shapeType: 'star',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        shapeSpecific: {
          points: 8,
          innerRadius: 30,
          outerRadius: 60,
        },
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();

      // Star with 8 points should have 16 vertices (8 outer + 8 inner)
      const points = polygon?.getAttribute('points');
      const pointCount = points?.split(' ').length;
      expect(pointCount).toBe(16);
    });

    it('should handle line thickness control (1.3c-INT-008)', () => {
      const layer: ShapeProperties = {
        id: 'test-thickness',
        name: 'Test Thickness',
        type: 'rectangle',
        shapeType: 'rectangle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        strokeType: 'solid',
        strokeColor: '#000000',
        strokeWidth: 10,
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      const rect = container.querySelector('rect');
      expect(rect).toHaveAttribute('stroke-width', '10');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown shape types gracefully', () => {
      const layer: ShapeProperties = {
        id: 'test-unknown',
        name: 'Test Unknown',
        type: 'unknown',
        shapeType: 'unknown',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      // Should render error placeholder
      const errorDiv = container.querySelector('div');
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveTextContent('Unknown shape: unknown');
      expect(console.warn).toHaveBeenCalledWith(
        'Shape type "unknown" not found in shape library'
      );
    });

    it('should validate and warn about invalid properties', () => {
      const layer: ShapeProperties = {
        id: 'test-invalid',
        name: 'Test Invalid',
        type: 'circle',
        shapeType: 'circle',
        visible: true,
        opacity: 2, // Invalid: > 1
        blendMode: 'normal',
        strokeWidth: -5, // Invalid: negative
      };

      render(<ShapeRenderer layer={layer} size={300} />);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid properties for shape "circle"'),
        expect.any(Array)
      );
    });

    it('should handle render errors gracefully', () => {
      // Create a shape that throws an error
      const BadShape = {
        type: 'bad',
        metadata: {
          displayName: 'Bad',
          description: '',
          category: '',
          version: '',
          author: '',
          icon: '',
        },
        render: () => {
          throw new Error('Render error');
        },
        getDefaultProperties: () => ({}),
        getPropertyDescriptors: () => [],
        validateProperties: () => ({ valid: true }),
        getAnimatableProperties: () => [],
        getBounds: () => ({ x: 0, y: 0, width: 100, height: 100 }),
      };

      shapeLibrary.register(BadShape as any);

      const layer: ShapeProperties = {
        id: 'test-bad',
        name: 'Test Bad',
        type: 'bad',
        shapeType: 'bad',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const { container } = render(<ShapeRenderer layer={layer} size={300} />);

      // Should render error placeholder
      const errorDiv = container.querySelector('div');
      expect(errorDiv).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith(
        'Error rendering shape "bad":',
        expect.any(Error)
      );
    });
  });

  describe('Context Integration', () => {
    it('should pass audio data to shape render', () => {
      const audioData = [0.1, 0.2, 0.3, 0.4, 0.5];

      const layer: ShapeProperties = {
        id: 'test-audio',
        name: 'Test Audio',
        type: 'circle',
        shapeType: 'circle',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const { container } = render(
        <ShapeRenderer
          layer={layer}
          size={300}
          audioData={audioData}
          isActive={true}
        />
      );

      // Shape should render with audio context
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should pass animation frame to shape render', () => {
      const layer: ShapeProperties = {
        id: 'test-animation',
        name: 'Test Animation',
        type: 'star',
        shapeType: 'star',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        animation: 'rotate',
        animationSpeed: 2,
      };

      const { container } = render(
        <ShapeRenderer layer={layer} size={300} animationFrame={120} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Performance (1.3c-UNIT-003)', () => {
    it('should render multiple shapes efficiently', () => {
      const layers: ShapeProperties[] = [
        {
          id: '1',
          name: 'Circle',
          type: 'circle',
          shapeType: 'circle',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        },
        {
          id: '2',
          name: 'Rectangle',
          type: 'rectangle',
          shapeType: 'rectangle',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        },
        {
          id: '3',
          name: 'Triangle',
          type: 'triangle',
          shapeType: 'triangle',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        },
        {
          id: '4',
          name: 'Star',
          type: 'star',
          shapeType: 'star',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        },
        {
          id: '5',
          name: 'Polygon',
          type: 'polygon',
          shapeType: 'polygon',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
        },
      ];

      const startTime = performance.now();

      layers.forEach(layer => {
        const { unmount } = render(<ShapeRenderer layer={layer} size={300} />);
        unmount();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render all shapes quickly (under 100ms total)
      expect(renderTime).toBeLessThan(100);
    });
  });
});
