import React from 'react';
import { BaseShape } from '../BaseShape';
import {
  ShapeProperties,
  ShapeMetadata,
  ShapeRenderContext,
  PropertyDescriptor,
} from '../IShape';

// Concrete implementation for testing
class TestShape extends BaseShape {
  type = 'test';
  metadata: ShapeMetadata = {
    displayName: 'Test Shape',
    description: 'Test shape implementation',
    category: 'test',
    version: '1.0.0',
    author: 'Test Suite',
    icon: 'test',
  };

  render(
    props: ShapeProperties,
    context: ShapeRenderContext
  ): React.ReactElement | null {
    const uniqueId = `shape-${props.id || 'test'}`;
    const { fill, stroke } = this.getFillStroke(props, uniqueId);

    return React.createElement(
      'svg',
      {
        width: context.width,
        height: context.height,
      },
      [
        this.createGradientDefs(props, uniqueId),
        React.createElement('rect', {
          x: props.offsetX || 0,
          y: props.offsetY || 0,
          width: 100,
          height: 100,
          fill,
          stroke,
          strokeWidth: props.strokeWidth || 2,
          opacity: props.opacity || 1,
          transform: `rotate(${props.rotation || 0} 50 50) scale(${props.scale || 1})`,
        }),
      ]
    );
  }

  getShapeSpecificDefaults(): Record<string, any> {
    return {
      width: 100,
      height: 100,
    };
  }

  getShapeSpecificPropertyDescriptors(): PropertyDescriptor[] {
    return [
      {
        key: 'width',
        displayName: 'Width',
        type: 'number',
        defaultValue: 100,
        group: 'Size',
      },
      {
        key: 'height',
        displayName: 'Height',
        type: 'number',
        defaultValue: 100,
        group: 'Size',
      },
    ];
  }

  getBounds(props: ShapeProperties): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: props.offsetX || 0,
      y: props.offsetY || 0,
      width: props.shapeSpecific?.width || 100,
      height: props.shapeSpecific?.height || 100,
    };
  }

  protected validateShapeSpecific(props: ShapeProperties) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (props.shapeSpecific?.width <= 0) {
      errors.push('Width must be greater than 0');
    }

    if (props.shapeSpecific?.height <= 0) {
      errors.push('Height must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  protected getShapeSpecificAnimatableProperties(): string[] {
    return ['width', 'height'];
  }
}

describe('BaseShape', () => {
  let shape: TestShape;

  beforeEach(() => {
    shape = new TestShape();
  });

  describe('Property Validation (1.3c-UNIT-005)', () => {
    it('should validate common properties', () => {
      const validProps: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 0.5,
        blendMode: 'normal',
        scale: 1,
        rotation: 45,
        offsetX: 10,
        offsetY: 20,
        strokeWidth: 2,
      };

      const result = shape.validateProperties(validProps);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect invalid opacity values', () => {
      const invalidProps: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1.5, // Invalid: > 1
        blendMode: 'normal',
      };

      const result = shape.validateProperties(invalidProps);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Opacity must be between 0 and 1');
    });

    it('should warn about extreme scale values', () => {
      const extremeProps: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        scale: 15, // Warning: > 10
        blendMode: 'normal',
      };

      const result = shape.validateProperties(extremeProps);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Scale should be between 0.1 and 10 for best results'
      );
    });

    it('should detect negative stroke width', () => {
      const invalidProps: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        strokeWidth: -5, // Invalid: negative
        blendMode: 'normal',
      };

      const result = shape.validateProperties(invalidProps);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Stroke width cannot be negative');
    });

    it('should validate shape-specific properties', () => {
      const invalidProps: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        shapeSpecific: {
          width: -10, // Invalid: negative width
          height: 100,
        },
      };

      const result = shape.validateProperties(invalidProps);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Width must be greater than 0');
    });
  });

  describe('Default Properties', () => {
    it('should provide common default properties', () => {
      const defaults = shape.getDefaultProperties();

      expect(defaults.visible).toBe(true);
      expect(defaults.opacity).toBe(1);
      expect(defaults.blendMode).toBe('normal');
      expect(defaults.scale).toBe(1);
      expect(defaults.rotation).toBe(0);
      expect(defaults.offsetX).toBe(0);
      expect(defaults.offsetY).toBe(0);
      expect(defaults.fillType).toBe('solid');
      expect(defaults.fillColor).toBe('#ffffff');
      expect(defaults.strokeType).toBe('solid');
      expect(defaults.strokeColor).toBe('#000000');
      expect(defaults.strokeWidth).toBe(2);
      expect(defaults.glowIntensity).toBe(0);
      expect(defaults.animation).toBe('none');
      expect(defaults.animationSpeed).toBe(1);
    });

    it('should include shape-specific defaults', () => {
      const defaults = shape.getDefaultProperties();

      expect(defaults.type).toBe('test');
      expect(defaults.shapeSpecific).toEqual({
        width: 100,
        height: 100,
      });
    });
  });

  describe('Property Descriptors', () => {
    it('should provide common property descriptors', () => {
      const descriptors = shape.getPropertyDescriptors();

      // Check for common properties
      const offsetXDesc = descriptors.find(d => d.key === 'offsetX');
      expect(offsetXDesc).toBeDefined();
      expect(offsetXDesc?.displayName).toBe('Position X');
      expect(offsetXDesc?.type).toBe('number');
      expect(offsetXDesc?.group).toBe('Transform');

      const opacityDesc = descriptors.find(d => d.key === 'opacity');
      expect(opacityDesc).toBeDefined();
      expect(opacityDesc?.type).toBe('range');
      expect(opacityDesc?.min).toBe(0);
      expect(opacityDesc?.max).toBe(1);
    });

    it('should include shape-specific descriptors', () => {
      const descriptors = shape.getPropertyDescriptors();

      const widthDesc = descriptors.find(d => d.key === 'width');
      expect(widthDesc).toBeDefined();
      expect(widthDesc?.displayName).toBe('Width');
      expect(widthDesc?.type).toBe('number');
      expect(widthDesc?.group).toBe('Size');
    });

    it('should group properties correctly', () => {
      const descriptors = shape.getPropertyDescriptors();

      const groups = new Set(descriptors.map(d => d.group));
      expect(groups.has('Transform')).toBe(true);
      expect(groups.has('Fill')).toBe(true);
      expect(groups.has('Stroke')).toBe(true);
      expect(groups.has('Effects')).toBe(true);
      expect(groups.has('Animation')).toBe(true);
      expect(groups.has('Size')).toBe(true); // Shape-specific
    });
  });

  describe('Animatable Properties (1.3c-UNIT-006)', () => {
    it('should list common animatable properties', () => {
      const animatable = shape.getAnimatableProperties();

      expect(animatable).toContain('offsetX');
      expect(animatable).toContain('offsetY');
      expect(animatable).toContain('scale');
      expect(animatable).toContain('rotation');
      expect(animatable).toContain('opacity');
      expect(animatable).toContain('fillColor');
      expect(animatable).toContain('strokeColor');
      expect(animatable).toContain('strokeWidth');
      expect(animatable).toContain('glowIntensity');
    });

    it('should include shape-specific animatable properties', () => {
      const animatable = shape.getAnimatableProperties();

      expect(animatable).toContain('width');
      expect(animatable).toContain('height');
    });
  });

  describe('Gradient Support', () => {
    it('should create linear gradient definitions', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        fillType: 'gradient',
        fillGradient: {
          type: 'linear',
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
          angle: 45,
        },
      };

      const gradientDefs = shape['createGradientDefs'](props, 'test-id');
      expect(gradientDefs).toBeTruthy();
      expect(gradientDefs?.type).toBe('defs');
    });

    it('should create radial gradient definitions', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        strokeType: 'gradient',
        strokeGradient: {
          type: 'radial',
          colors: ['#0000ff', '#ffffff'],
          stops: [0, 1],
        },
      };

      const gradientDefs = shape['createGradientDefs'](props, 'test-id');
      expect(gradientDefs).toBeTruthy();
      expect(gradientDefs?.type).toBe('defs');
    });

    it('should return null when no gradients', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        fillType: 'solid',
        strokeType: 'solid',
      };

      const gradientDefs = shape['createGradientDefs'](props, 'test-id');
      expect(gradientDefs).toBeNull();
    });
  });

  describe('Fill and Stroke', () => {
    it('should calculate solid fill and stroke', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        fillType: 'solid',
        fillColor: '#ff0000',
        strokeType: 'solid',
        strokeColor: '#0000ff',
      };

      const { fill, stroke } = shape['getFillStroke'](props, 'test-id');
      expect(fill).toBe('#ff0000');
      expect(stroke).toBe('#0000ff');
    });

    it('should calculate gradient fill and stroke', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        fillType: 'gradient',
        fillGradient: { type: 'linear', colors: [], stops: [] },
        strokeType: 'gradient',
        strokeGradient: { type: 'radial', colors: [], stops: [] },
      };

      const { fill, stroke } = shape['getFillStroke'](props, 'test-id');
      expect(fill).toBe('url(#test-id-fill)');
      expect(stroke).toBe('url(#test-id-stroke)');
    });

    it('should handle none fill and stroke', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        fillType: 'none' as any,
        strokeType: 'none' as any,
      };

      const { fill, stroke } = shape['getFillStroke'](props, 'test-id');
      expect(fill).toBe('none');
      expect(stroke).toBe('none');
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call onCreate hook', () => {
      const testShape = new TestShape();
      testShape.onCreate = jest.fn(props => props);

      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      testShape.onCreate(props);
      expect(testShape.onCreate).toHaveBeenCalledWith(props);
    });

    it('should call onUpdate hook', () => {
      const testShape = new TestShape();
      testShape.onUpdate = jest.fn((oldProps, newProps) => newProps);

      const oldProps: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const newProps: ShapeProperties = {
        ...oldProps,
        opacity: 0.5,
      };

      testShape.onUpdate(oldProps, newProps);
      expect(testShape.onUpdate).toHaveBeenCalledWith(oldProps, newProps);
    });

    it('should call onDestroy hook', () => {
      const testShape = new TestShape();
      testShape.onDestroy = jest.fn();

      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      testShape.onDestroy(props);
      expect(testShape.onDestroy).toHaveBeenCalledWith(props);
    });
  });

  describe('Bounds Calculation', () => {
    it('should calculate shape bounds', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        offsetX: 50,
        offsetY: 75,
        shapeSpecific: {
          width: 200,
          height: 150,
        },
      };

      const bounds = shape.getBounds(props);
      expect(bounds).toEqual({
        x: 50,
        y: 75,
        width: 200,
        height: 150,
      });
    });

    it('should use defaults when properties missing', () => {
      const props: ShapeProperties = {
        id: 'test',
        name: 'Test',
        type: 'test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };

      const bounds = shape.getBounds(props);
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
    });
  });
});
