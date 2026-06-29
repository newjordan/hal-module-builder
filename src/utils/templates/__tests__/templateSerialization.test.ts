import {
  serializePreset as serializeTemplate,
  deserializePreset as deserializeTemplate,
  validateTemplateData,
  convertLegacyTemplate,
  optimizeTemplateSize,
  clonePreset,
  estimatePresetSize,
  createExportMetadata as generateTemplateMetadata,
  getPresetStats,
} from '../templateSerialization';
import { Template } from '../../../types/layer-types';

describe('templateSerialization', () => {
  const mockTemplate: Template = {
    id: 'test-template-1',
    name: 'Test Template',
    description: 'A test template',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    layers: [
      {
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
      },
    ],
    metadata: {
      tags: ['test'],
      category: 'test',
      complexity: 'simple',
    },
  };

  describe('serializeTemplate', () => {
    it('should serialize template to JSON string', () => {
      const result = serializeTemplate(mockTemplate);
      expect(typeof result).toBe('string');
      expect(result).toContain('"id":"test-template-1"');
      expect(result).toContain('"name":"Test Template"');
    });

    it('should handle template with complex layers', () => {
      const complexTemplate = {
        ...mockTemplate,
        layers: [
          ...mockTemplate.layers,
          {
            id: 'gradient-layer',
            name: 'Gradient Layer',
            type: 'gradient' as const,
            visible: true,
            opacity: 0.8,
            blendMode: 'multiply',
            scale: 1.2,
            rotation: 45,
            offsetX: 10,
            offsetY: -5,
            gradient: {
              type: 'linear',
              angle: 90,
              colors: ['#ff0000', '#00ff00', '#0000ff'],
              stops: [0, 0.5, 1],
            },
          },
        ],
      };

      const result = serializeTemplate(complexTemplate);
      expect(result).toContain('gradient-layer');
      expect(result).toContain('linear');
    });

    it('should handle empty layers array', () => {
      const emptyTemplate = { ...mockTemplate, layers: [] };
      const result = serializeTemplate(emptyTemplate);
      expect(result).toContain('"layers":[]');
    });
  });

  describe('deserializeTemplate', () => {
    it('should deserialize valid JSON to template', () => {
      const serialized = serializeTemplate(mockTemplate);
      const result = deserializeTemplate(serialized);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.template.id).toBe(mockTemplate.id);
        expect(result.template.name).toBe(mockTemplate.name);
        expect(result.template.layers).toHaveLength(1);
      }
    });

    it('should handle invalid JSON', () => {
      const result = deserializeTemplate('invalid json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle missing required fields', () => {
      const invalidTemplate = '{"name": "Incomplete"}';
      const result = deserializeTemplate(invalidTemplate);
      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required');
    });
  });

  describe('validateTemplateData', () => {
    it('should validate correct template structure', () => {
      const result = validateTemplateData(mockTemplate);
      expect(result.valid).toBe(true);
    });

    it('should reject template without required fields', () => {
      const invalidTemplate = { name: 'Test' };
      const result = validateTemplateData(invalidTemplate as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });

    it('should validate layer structure', () => {
      const templateWithInvalidLayer = {
        ...mockTemplate,
        layers: [{ id: 'invalid' }],
      };
      const result = validateTemplateData(templateWithInvalidLayer as any);
      expect(result.valid).toBe(false);
    });
  });

  describe('convertLegacyTemplate', () => {
    it('should convert v1 template to current version', () => {
      const legacyTemplate = {
        id: 'legacy-1',
        name: 'Legacy Template',
        layers: [
          {
            id: 'layer-1',
            type: 'color',
            color: '#ff0000',
          },
        ],
      };

      const result = convertLegacyTemplate(legacyTemplate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.template.version).toBe('2.0.0');
        expect(result.template.layers[0].type).toBe('shape');
        expect((result.template.layers[0] as any).fillType).toBe('solid');
      }
    });

    it('should handle already current version', () => {
      const result = convertLegacyTemplate(mockTemplate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.template).toEqual(mockTemplate);
      }
    });
  });

  describe('optimizeTemplateSize', () => {
    it('should remove unnecessary properties', () => {
      const bloatedTemplate = {
        ...mockTemplate,
        layers: [
          {
            ...mockTemplate.layers[0],
            opacity: 1, // Default value, should be removed
            scale: 1, // Default value, should be removed
            rotation: 0, // Default value, should be removed
            offsetX: 0, // Default value, should be removed
            offsetY: 0, // Default value, should be removed
          },
        ],
      };

      const result = optimizeTemplateSize(bloatedTemplate);
      expect(result.layers[0]).not.toHaveProperty('opacity');
      expect(result.layers[0]).not.toHaveProperty('scale');
      expect(result.layers[0]).not.toHaveProperty('rotation');
    });

    it('should preserve non-default values', () => {
      const customTemplate = {
        ...mockTemplate,
        layers: [
          {
            ...mockTemplate.layers[0],
            opacity: 0.5,
            scale: 2,
            rotation: 45,
          },
        ],
      };

      const result = optimizeTemplateSize(customTemplate);
      expect(result.layers[0].opacity).toBe(0.5);
      expect(result.layers[0].scale).toBe(2);
      expect(result.layers[0].rotation).toBe(45);
    });
  });

  describe('generateTemplateMetadata', () => {
    it('should generate metadata for template', () => {
      const result = generateTemplateMetadata(mockTemplate);

      expect(result).toHaveProperty('layerCount');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('estimatedSize');
      expect(result).toHaveProperty('tags');
      expect(result.layerCount).toBe(1);
    });

    it('should calculate complexity based on layers', () => {
      const complexTemplate = {
        ...mockTemplate,
        layers: Array(10)
          .fill(null)
          .map((_, i) => ({
            ...mockTemplate.layers[0],
            id: `layer-${i}`,
            type: i % 2 === 0 ? 'gradient' : 'effect',
          })),
      };

      const result = generateTemplateMetadata(complexTemplate as any);
      expect(result.complexity).toBe('complex');
    });
  });
});
