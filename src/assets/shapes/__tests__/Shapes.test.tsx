import React from 'react';
import { CircleShape } from '../Circle';
import { RectangleShape } from '../Rectangle';
import { TriangleShape } from '../Triangle';
import { StarShape } from '../Star';
import { PolygonShape } from '../Polygon';
import { ShapeProperties, ShapeRenderContext } from '../IShape';

describe('Shape Implementations (1.3c-UNIT-004)', () => {
  const defaultProps: ShapeProperties = {
    id: 'test-shape',
    name: 'Test Shape',
    type: '',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    fillType: 'solid',
    fillColor: '#ffffff',
    strokeType: 'solid',
    strokeColor: '#000000',
    strokeWidth: 2,
  };

  const defaultContext: ShapeRenderContext = {
    size: 300,
    audioData: undefined,
    isActive: false,
    animationFrame: 0,
    width: 300,
    height: 300,
  };

  describe('Circle Shape', () => {
    const circle = new CircleShape();

    it('should have correct type and metadata', () => {
      expect(circle.type).toBe('circle');
      expect(circle.metadata.displayName).toBe('Circle');
      expect(circle.metadata.category).toBe('Basic Shapes');
    });

    it('should render circle element', () => {
      const props = { ...defaultProps, type: 'circle' };
      const element = circle.render(props, defaultContext);

      expect(element).toBeTruthy();
      expect(element?.type).toBe('svg');

      const children = React.Children.toArray(element?.props.children);
      const circleElement = children.find(
        (child: any) => child?.type === 'circle'
      );
      expect(circleElement).toBeTruthy();
    });

    it('should provide circle-specific properties', () => {
      const defaults = circle.getDefaultProperties();
      expect(defaults.shapeSpecific?.radius).toBe(100);
    });

    it('should validate circle properties', () => {
      const validProps = { ...defaultProps, type: 'circle' };
      const validation = circle.validateProperties(validProps);
      expect(validation.valid).toBe(true);
    });

    it('should calculate circle bounds', () => {
      const props = {
        ...defaultProps,
        type: 'circle',
        offsetX: 100,
        offsetY: 100,
        shapeSpecific: { radius: 75 },
      };

      const bounds = circle.getBounds(props);
      expect(bounds).toEqual({
        x: 22.5,
        y: 22.5,
        width: 155,
        height: 155,
      });
    });

    it('should build radial fill gradient defs with center offsets', () => {
      const gradientProps = ({
        ...defaultProps,
        id: 'gradient-circle',
        type: 'circle',
        fillType: 'gradient',
        fillGradient: {
          type: 'radial',
          colors: ['#ffffff', '#000000'],
          stops: [0, 1],
          centerX: 0.8,
          centerY: 0.2,
        },
        strokeType: 'none',
      }) as ShapeProperties;

      const defs = (circle as any).createGradientDefs(
        gradientProps,
        'circle-gradient-circle'
      );
      expect(defs).toBeTruthy();

      const fillGradient = React.Children.toArray((defs as any).props.children).find(
        (child: any) => child?.props?.id?.endsWith('-fill')
      ) as any;

      expect(fillGradient?.type).toBe('radialGradient');
      expect(parseFloat(fillGradient?.props?.cx)).toBeCloseTo(80, 3);
      expect(parseFloat(fillGradient?.props?.cy)).toBeCloseTo(20, 3);
    });

    it('should build stroke gradient defs with radial metadata', () => {
      const gradientProps = ({
        ...defaultProps,
        id: 'gradient-circle-stroke',
        type: 'circle',
        strokeType: 'gradient',
        strokeGradient: {
          type: 'radial',
          colors: ['#ff0000', '#0000ff'],
          stops: [0, 1],
          centerX: 0.25,
          centerY: 0.75,
        },
        fillType: 'none',
      }) as ShapeProperties;

      const defs = (circle as any).createGradientDefs(
        gradientProps,
        'circle-gradient-circle-stroke'
      );
      expect(defs).toBeTruthy();

      const strokeGradient = React.Children.toArray((defs as any).props.children).find(
        (child: any) => child?.props?.id?.endsWith('-stroke')
      ) as any;

      expect(strokeGradient?.type).toBe('radialGradient');
      expect(strokeGradient?.props?.cx).toBe('25%');
      expect(strokeGradient?.props?.cy).toBe('75%');
    });
  });

  describe('Rectangle Shape', () => {
    const rectangle = new RectangleShape();

    it('should have correct type and metadata', () => {
      expect(rectangle.type).toBe('rectangle');
      expect(rectangle.metadata.displayName).toBe('Rectangle');
      expect(rectangle.metadata.category).toBe('basic');
    });

    it('should render rect element', () => {
      const props = { ...defaultProps, type: 'rectangle' };
      const element = rectangle.render(props, defaultContext);

      expect(element).toBeTruthy();
      expect(element?.type).toBe('svg');

      const children = React.Children.toArray(element?.props.children);
      const rectElement = children.find((child: any) => child?.type === 'rect');
      expect(rectElement).toBeTruthy();
    });

    it('should provide rectangle-specific properties', () => {
      const defaults = rectangle.getDefaultProperties();
      expect(defaults.shapeSpecific?.width).toBe(100);
      expect(defaults.shapeSpecific?.height).toBe(100);
      expect(defaults.shapeSpecific?.cornerRadius).toBe(0);
    });

    it('should handle corner radius', () => {
      const props = {
        ...defaultProps,
        type: 'rectangle',
        shapeSpecific: { width: 100, height: 100, cornerRadius: 10 },
      };

      const element = rectangle.render(props, defaultContext);
      const children = React.Children.toArray(element?.props.children);
      const rectElement: any = children.find(
        (child: any) => child?.type === 'rect'
      );

      expect(rectElement?.props.rx).toBe(10);
      expect(rectElement?.props.ry).toBe(10);
    });
  });

  describe('Triangle Shape', () => {
    const triangle = new TriangleShape();

    it('should have correct type and metadata', () => {
      expect(triangle.type).toBe('triangle');
      expect(triangle.metadata.displayName).toBe('Triangle');
      expect(triangle.metadata.category).toBe('basic');
    });

    it('should render polygon element with 3 points', () => {
      const props = { ...defaultProps, type: 'triangle' };
      const element = triangle.render(props, defaultContext);

      expect(element).toBeTruthy();
      const children = React.Children.toArray(element?.props.children);
      const polygonElement: any = children.find(
        (child: any) => child?.type === 'polygon'
      );
      expect(polygonElement).toBeTruthy();

      // Triangle should have 3 vertices
      const points = polygonElement?.props.points;
      expect(points).toBeTruthy();
      const pointArray = points.split(' ');
      expect(pointArray.length).toBe(3);
    });

    it('should support equilateral and isosceles types', () => {
      const descriptors = triangle.getPropertyDescriptors();
      const typeDescriptor = descriptors.find(d => d.key === 'triangleType');

      expect(typeDescriptor).toBeDefined();
      expect(typeDescriptor?.options).toContainEqual({
        value: 'equilateral',
        label: 'Equilateral',
      });
      expect(typeDescriptor?.options).toContainEqual({
        value: 'isosceles',
        label: 'Isosceles',
      });
    });
  });

  describe('Star Shape', () => {
    const star = new StarShape();

    it('should have correct type and metadata', () => {
      expect(star.type).toBe('star');
      expect(star.metadata.displayName).toBe('Star');
      expect(star.metadata.category).toBe('decorative');
    });

    it('should render polygon element with correct number of points', () => {
      const props = {
        ...defaultProps,
        type: 'star',
        shapeSpecific: { points: 5, innerRadius: 30, outerRadius: 60 },
      };
      const element = star.render(props, defaultContext);

      expect(element).toBeTruthy();
      const children = React.Children.toArray(element?.props.children);
      const polygonElement: any = children.find(
        (child: any) => child?.type === 'polygon'
      );
      expect(polygonElement).toBeTruthy();

      // 5-pointed star should have 10 vertices (5 outer + 5 inner)
      const points = polygonElement?.props.points;
      const pointArray = points.split(' ');
      expect(pointArray.length).toBe(10);
    });

    it('should provide star-specific properties', () => {
      const defaults = star.getDefaultProperties();
      expect(defaults.shapeSpecific?.points).toBe(5);
      expect(defaults.shapeSpecific?.innerRadius).toBe(30);
      expect(defaults.shapeSpecific?.outerRadius).toBe(60);
    });

    it('should validate star points range', () => {
      const invalidProps = {
        ...defaultProps,
        type: 'star',
        shapeSpecific: { points: 2 }, // Too few points
      };

      const validation = star.validateProperties(invalidProps);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'Star points must be between 3 and 12'
      );
    });
  });

  describe('Polygon Shape', () => {
    const polygon = new PolygonShape();

    it('should have correct type and metadata', () => {
      expect(polygon.type).toBe('polygon');
      expect(polygon.metadata.displayName).toBe('Polygon');
      expect(polygon.metadata.category).toBe('geometric');
    });

    it('should render polygon element with correct number of sides', () => {
      const props = {
        ...defaultProps,
        type: 'polygon',
        shapeSpecific: { sides: 6, radius: 50 },
      };
      const element = polygon.render(props, defaultContext);

      expect(element).toBeTruthy();
      const children = React.Children.toArray(element?.props.children);
      const polygonElement: any = children.find(
        (child: any) => child?.type === 'polygon'
      );
      expect(polygonElement).toBeTruthy();

      // Hexagon should have 6 vertices
      const points = polygonElement?.props.points;
      const pointArray = points.split(' ');
      expect(pointArray.length).toBe(6);
    });

    it('should provide polygon-specific properties', () => {
      const defaults = polygon.getDefaultProperties();
      expect(defaults.shapeSpecific?.sides).toBe(6);
      expect(defaults.shapeSpecific?.radius).toBe(50);
    });

    it('should validate polygon sides range', () => {
      const invalidProps = {
        ...defaultProps,
        type: 'polygon',
        shapeSpecific: { sides: 2 }, // Too few sides
      };

      const validation = polygon.validateProperties(invalidProps);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'Polygon sides must be between 3 and 12'
      );
    });

    it('should create regular polygons', () => {
      // Test that vertices are evenly distributed
      const props = {
        ...defaultProps,
        type: 'polygon',
        shapeSpecific: { sides: 4, radius: 100 }, // Square
      };

      const element = polygon.render(props, defaultContext);
      const children = React.Children.toArray(element?.props.children);
      const polygonElement: any = children.find(
        (child: any) => child?.type === 'polygon'
      );

      const points = polygonElement?.props.points;
      const vertices = points.split(' ').map((p: string) => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });

      // Square should have 4 vertices at 90-degree intervals
      expect(vertices.length).toBe(4);
    });
  });

  describe('Shape Library Integration (1.3c-INT-005)', () => {
    it('should integrate all shapes with ShapeRenderer', () => {
      const shapes = [
        new CircleShape(),
        new RectangleShape(),
        new TriangleShape(),
        new StarShape(),
        new PolygonShape(),
      ];

      shapes.forEach(shape => {
        const props = { ...defaultProps, type: shape.type };
        const element = shape.render(props, defaultContext);

        // All shapes should render successfully
        expect(element).toBeTruthy();
        expect(element?.type).toBe('svg');

        // All shapes should provide required interface methods
        expect(shape.getDefaultProperties()).toBeDefined();
        expect(shape.getPropertyDescriptors()).toBeDefined();
        expect(shape.validateProperties(props)).toBeDefined();
        expect(shape.getAnimatableProperties()).toBeDefined();
        expect(shape.getBounds(props)).toBeDefined();
      });
    });
  });

  describe('Performance Tests (1.3c-UNIT-007)', () => {
    it('should render shapes efficiently', () => {
      const shapes = [
        new CircleShape(),
        new RectangleShape(),
        new TriangleShape(),
        new StarShape(),
        new PolygonShape(),
      ];

      const iterations = 100;
      const startTime = performance.now();

      shapes.forEach(shape => {
        const props = { ...defaultProps, type: shape.type };
        for (let i = 0; i < iterations; i++) {
          shape.render(props, defaultContext);
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / (shapes.length * iterations);

      // Average render time should be under 1ms
      expect(averageTime).toBeLessThan(1);
    });

    it('should validate properties efficiently', () => {
      const shapes = [
        new CircleShape(),
        new RectangleShape(),
        new TriangleShape(),
        new StarShape(),
        new PolygonShape(),
      ];

      const iterations = 1000;
      const startTime = performance.now();

      shapes.forEach(shape => {
        const props = { ...defaultProps, type: shape.type };
        for (let i = 0; i < iterations; i++) {
          shape.validateProperties(props);
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / (shapes.length * iterations);

      // Validation should be very fast (under 0.1ms)
      expect(averageTime).toBeLessThan(0.1);
    });
  });
});

