import {
  validateTemplate,
  validateLayer,
  validateTemplateStructure,
  validateLayerProperties,
  sanitizeTemplate,
  checkTemplateCompatibility,
  validateTemplateMetadata,
} from '../templateValidation';
import { Template, Layer } from '../../../types/layer-types';

describe('templateValidation', () => {
  const validLayer: Layer = {
    id: 'layer-1',
    name: 'Test Layer',
    type: 'solid',
    visible: true,
    opacity: 1,
    blendMode: 'normal',
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    solidColor: '#ff0000',
  };

  const validTemplate: Template = {
    id: 'template-1',
    name: 'Test Template',
    description: 'A test template',
    version: '2.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    layers: [validLayer],
    metadata: {
      tags: ['test'],
      category: 'test',
      complexity: 'simple',
    },
  };

  describe('validateTemplate', () => {
    it('should validate a correct template', () => {
      const result = validateTemplate(validTemplate);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject template with missing id', () => {
      const invalidTemplate = { ...validTemplate };
      delete (invalidTemplate as any).id;

      const result = validateTemplate(invalidTemplate as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template ID is required');
    });

    it('should reject template with empty name', () => {
      const invalidTemplate = { ...validTemplate, name: '' };

      const result = validateTemplate(invalidTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template name cannot be empty');
    });

    it('should reject template with invalid layers', () => {
      const invalidTemplate = {
        ...validTemplate,
        layers: [{ ...validLayer, id: '' }],
      };

      const result = validateTemplate(invalidTemplate as any);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateLayer', () => {
    it('should validate a correct layer', () => {
      const result = validateLayer(validLayer);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject layer with empty id', () => {
      const invalidLayer = { ...validLayer, id: '' };

      const result = validateLayer(invalidLayer);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layer ID is required');
    });

    it('should reject layer with invalid type', () => {
      const invalidLayer = { ...validLayer, type: 'invalid' as any };

      const result = validateLayer(invalidLayer);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid layer type');
    });

    it('should reject layer with opacity out of range', () => {
      const invalidLayer = { ...validLayer, opacity: 1.5 };

      const result = validateLayer(invalidLayer);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Opacity must be between 0 and 1');
    });

    it('should validate gradient layer properties', () => {
      const gradientLayer: Layer = {
        ...validLayer,
        type: 'gradient',
        gradient: {
          type: 'linear',
          angle: 45,
          colors: ['#ff0000', '#00ff00'],
          stops: [0, 1],
        },
      };

      const result = validateLayer(gradientLayer);
      expect(result.valid).toBe(true);
    });

    it('should reject gradient layer without gradient properties', () => {
      const invalidGradientLayer: Layer = {
        ...validLayer,
        type: 'gradient',
      };

      const result = validateLayer(invalidGradientLayer);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Gradient layer requires gradient properties'
      );
    });
  });

  describe('validateTemplateStructure', () => {
    it('should validate correct template structure', () => {
      const result = validateTemplateStructure(validTemplate);
      expect(result.valid).toBe(true);
    });

    it('should reject template with circular references', () => {
      const circularTemplate: any = { ...validTemplate };
      circularTemplate.self = circularTemplate;

      const result = validateTemplateStructure(circularTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Circular reference detected');
    });

    it('should reject template exceeding layer limit', () => {
      const manyLayersTemplate = {
        ...validTemplate,
        layers: Array(101)
          .fill(validLayer)
          .map((layer, i) => ({
            ...layer,
            id: `layer-${i}`,
          })),
      };

      const result = validateTemplateStructure(manyLayersTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Too many layers (max: 100)');
    });
  });

  describe('validateLayerProperties', () => {
    it('should validate solid layer properties', () => {
      const solidLayer: Layer = {
        ...validLayer,
        type: 'solid',
        solidColor: '#ff0000',
      };

      const result = validateLayerProperties(solidLayer);
      expect(result.valid).toBe(true);
    });

    it('should reject solid layer with invalid color', () => {
      const invalidSolidLayer: Layer = {
        ...validLayer,
        type: 'solid',
        solidColor: 'not-a-color',
      };

      const result = validateLayerProperties(invalidSolidLayer);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid solid color format');
    });

    it('should validate image layer properties', () => {
      const imageLayer: Layer = {
        ...validLayer,
        type: 'image',
        imageSrc:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      };

      const result = validateLayerProperties(imageLayer);
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeTemplate', () => {
    it('should sanitize template by removing dangerous properties', () => {
      const dangerousTemplate: any = {
        ...validTemplate,
        __proto__: { malicious: true },
        constructor: { dangerous: true },
        layers: [
          {
            ...validLayer,
            onclick: 'javascript:alert("xss")',
            onmouseover: 'javascript:void(0)',
          },
        ],
      };

      const result = sanitizeTemplate(dangerousTemplate);
      // The result should be a clean object with no dangerous event handlers
      expect(result.layers[0].onclick).toBeUndefined();
      expect(result.layers[0].onmouseover).toBeUndefined();
      // Should preserve valid properties
      expect(result.id).toBe(dangerousTemplate.id);
      expect(result.layers[0].id).toBe(dangerousTemplate.layers[0].id);
    });

    it('should preserve valid properties', () => {
      const result = sanitizeTemplate(validTemplate);
      expect(result.id).toBe(validTemplate.id);
      expect(result.name).toBe(validTemplate.name);
      expect(result.layers).toHaveLength(1);
    });
  });

  describe('checkTemplateCompatibility', () => {
    it('should check compatibility with current version', () => {
      const result = checkTemplateCompatibility(validTemplate, '2.0.0');
      expect(result.compatible).toBe(true);
    });

    it('should detect incompatible versions', () => {
      const futureTemplate = { ...validTemplate, version: '3.0.0' };
      const result = checkTemplateCompatibility(futureTemplate, '2.0.0');
      expect(result.compatible).toBe(false);
      expect(result.issues).toContain(
        'Template version is newer than supported'
      );
    });

    it('should handle missing version', () => {
      const noVersionTemplate: any = { ...validTemplate };
      delete noVersionTemplate.version;

      const result = checkTemplateCompatibility(noVersionTemplate, '2.0.0');
      expect(result.compatible).toBe(false);
      expect(result.issues).toContain('Template version is missing');
    });
  });

  describe('validateTemplateMetadata', () => {
    it('should validate correct metadata', () => {
      const result = validateTemplateMetadata(validTemplate.metadata!);
      expect(result.valid).toBe(true);
    });

    it('should reject metadata with invalid tags', () => {
      const invalidMetadata = {
        ...validTemplate.metadata!,
        tags: ['valid-tag', 'invalid tag with spaces and special chars!@#'],
      };

      const result = validateTemplateMetadata(invalidMetadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid tag format');
    });

    it('should validate category values', () => {
      const validCategories = ['basic', 'advanced', 'experimental', 'user'];

      validCategories.forEach(category => {
        const metadata = { ...validTemplate.metadata!, category };
        const result = validateTemplateMetadata(metadata);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid category', () => {
      const invalidMetadata = {
        ...validTemplate.metadata!,
        category: 'invalid-category',
      };

      const result = validateTemplateMetadata(invalidMetadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid category');
    });
  });
});
