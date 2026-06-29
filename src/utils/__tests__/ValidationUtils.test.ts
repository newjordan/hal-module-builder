/**
 * ValidationUtils Tests
 * Tests for input validation schemas and sanitization
 */
import { ValidationUtils } from '../ValidationUtils';

describe('ValidationUtils', () => {
  describe('Basic Validation', () => {
    it('should validate required fields', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: false },
      };

      const validData = { name: 'John', age: 30 };
      const result = ValidationUtils.validate(validData, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const schema = {
        name: { type: 'string', required: true },
        email: { type: 'string', required: true },
      };

      const invalidData = { name: 'John' }; // Missing email
      const result = ValidationUtils.validate(invalidData, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email is required');
    });

    it('should validate field types', () => {
      const schema = {
        name: { type: 'string' },
        age: { type: 'number' },
        active: { type: 'boolean' },
        tags: { type: 'array' },
        config: { type: 'object' },
      };

      const validData = {
        name: 'John',
        age: 30,
        active: true,
        tags: ['tag1', 'tag2'],
        config: { setting: 'value' },
      };

      const result = ValidationUtils.validate(validData, schema);
      expect(result.isValid).toBe(true);

      const invalidData = {
        name: 123, // Should be string
        age: 'thirty', // Should be number
        active: 'yes', // Should be boolean
        tags: 'tag1,tag2', // Should be array
        config: 'setting=value', // Should be object
      };

      const invalidResult = ValidationUtils.validate(invalidData, schema);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('String Validation', () => {
    it('should validate string length', () => {
      const schema = {
        username: { type: 'string', minLength: 3, maxLength: 20 },
      };

      const validData = { username: 'john_doe' };
      expect(ValidationUtils.validate(validData, schema).isValid).toBe(true);

      const tooShort = { username: 'jo' };
      const tooShortResult = ValidationUtils.validate(tooShort, schema);
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors[0]).toContain('at least 3 characters');

      const tooLong = { username: 'a'.repeat(25) };
      const tooLongResult = ValidationUtils.validate(tooLong, schema);
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors[0]).toContain('no more than 20 characters');
    });

    it('should validate string patterns', () => {
      const schema = {
        email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      };

      const validEmail = { email: 'user@example.com' };
      expect(ValidationUtils.validate(validEmail, schema).isValid).toBe(true);

      const invalidEmail = { email: 'invalid-email' };
      const result = ValidationUtils.validate(invalidEmail, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('format is invalid');
    });
  });

  describe('Number Validation', () => {
    it('should validate number ranges', () => {
      const schema = {
        score: { type: 'number', min: 0, max: 100 },
      };

      const validScore = { score: 85 };
      expect(ValidationUtils.validate(validScore, schema).isValid).toBe(true);

      const tooLow = { score: -10 };
      const tooLowResult = ValidationUtils.validate(tooLow, schema);
      expect(tooLowResult.isValid).toBe(false);
      expect(tooLowResult.errors[0]).toContain('at least 0');

      const tooHigh = { score: 150 };
      const tooHighResult = ValidationUtils.validate(tooHigh, schema);
      expect(tooHighResult.isValid).toBe(false);
      expect(tooHighResult.errors[0]).toContain('no more than 100');
    });
  });

  describe('Enum Validation', () => {
    it('should validate enum values', () => {
      const schema = {
        status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
      };

      const validStatus = { status: 'active' };
      expect(ValidationUtils.validate(validStatus, schema).isValid).toBe(true);

      const invalidStatus = { status: 'unknown' };
      const result = ValidationUtils.validate(invalidStatus, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain(
        'must be one of: active, inactive, pending'
      );
    });
  });

  describe('Custom Validation', () => {
    it('should handle custom validation functions', () => {
      const schema = {
        password: {
          type: 'string',
          custom: (value: string) => {
            if (value.length < 8)
              return 'Password must be at least 8 characters';
            if (!/[A-Z]/.test(value))
              return 'Password must contain uppercase letter';
            if (!/[0-9]/.test(value)) return 'Password must contain a number';
            return true;
          },
        },
      };

      const validPassword = { password: 'SecurePass123' };
      expect(ValidationUtils.validate(validPassword, schema).isValid).toBe(
        true
      );

      const weakPassword = { password: 'weak' };
      const result = ValidationUtils.validate(weakPassword, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be at least 8 characters');
    });
  });

  describe('Layer Validation', () => {
    it('should validate layer objects', () => {
      const validLayer = {
        id: 'layer-1',
        name: 'Test Layer',
        type: 'solid',
        visible: true,
        opacity: 0.8,
        blendMode: 'normal',
        scale: 1.0,
        rotation: 45,
        offsetX: 10,
        offsetY: -5,
        color: '#ff0000',
      };

      const result = ValidationUtils.validateLayer(validLayer);
      expect(result.isValid).toBe(true);
    });

    it('should fail validation for invalid layer', () => {
      const invalidLayer = {
        name: 'Test Layer',
        // Missing required fields
        type: 'invalid-type',
        opacity: 2.0, // Out of range
        blendMode: 'invalid-blend',
      };

      const result = ValidationUtils.validateLayer(invalidLayer);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate image layer source', () => {
      const imageLayer = {
        id: 'img-1',
        name: 'Image Layer',
        type: 'image',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        src: 'https://example.com/image.jpg',
      };

      const result = ValidationUtils.validateLayer(imageLayer);
      expect(result.isValid).toBe(true);

      // Invalid URL
      const invalidImageLayer = { ...imageLayer, src: 'invalid-url' };
      const invalidResult = ValidationUtils.validateLayer(invalidImageLayer);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('Template Validation', () => {
    it('should validate template objects', () => {
      const validTemplate = {
        id: 'template-1',
        name: 'Test Template',
        timestamp: Date.now(),
        layers: [
          {
            id: 'layer-1',
            name: 'Layer 1',
            type: 'solid',
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            scale: 1,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            color: '#ff0000',
          },
        ],
      };

      const result = ValidationUtils.validateTemplate(validTemplate);
      expect(result.isValid).toBe(true);
    });

    it('should validate all layers in template', () => {
      const templateWithInvalidLayer = {
        id: 'template-1',
        name: 'Test Template',
        timestamp: Date.now(),
        layers: [
          {
            id: 'layer-1',
            name: 'Valid Layer',
            type: 'solid',
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            scale: 1,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
          },
          {
            // Invalid layer - missing required fields
            name: 'Invalid Layer',
          },
        ],
      };

      const result = ValidationUtils.validateTemplate(templateWithInvalidLayer);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Layer 1'))).toBe(true);
    });
  });

  describe('Sanitization', () => {
    it('should sanitize strings', () => {
      const input = '  <script>alert("xss")</script>  ';
      const sanitized = ValidationUtils.sanitizeString(input);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized.trim()).toBe(sanitized); // Should be trimmed
    });

    it('should sanitize strings with options', () => {
      const input = 'Very long string that exceeds limit';
      const sanitized = ValidationUtils.sanitizeString(input, {
        maxLength: 10,
        trim: true,
      });

      expect(sanitized.length).toBeLessThanOrEqual(10);
    });

    it('should sanitize numbers', () => {
      expect(ValidationUtils.sanitizeNumber('123.456', { precision: 2 })).toBe(
        123.46
      );
      expect(ValidationUtils.sanitizeNumber('50', { min: 0, max: 100 })).toBe(
        50
      );
      expect(ValidationUtils.sanitizeNumber('-10', { min: 0, max: 100 })).toBe(
        0
      );
      expect(ValidationUtils.sanitizeNumber('150', { min: 0, max: 100 })).toBe(
        100
      );
      expect(ValidationUtils.sanitizeNumber('invalid')).toBeNull();
    });
  });

  describe('Type Guards', () => {
    it('should validate layer types', () => {
      expect(ValidationUtils.isValidLayerType('solid')).toBe(true);
      expect(ValidationUtils.isValidLayerType('image')).toBe(true);
      expect(ValidationUtils.isValidLayerType('invalid')).toBe(false);
    });

    it('should validate blend modes', () => {
      expect(ValidationUtils.isValidBlendMode('normal')).toBe(true);
      expect(ValidationUtils.isValidBlendMode('multiply')).toBe(true);
      expect(ValidationUtils.isValidBlendMode('invalid')).toBe(false);
    });

    it('should validate themes', () => {
      expect(ValidationUtils.isValidTheme('frost_light')).toBe(true);
      expect(ValidationUtils.isValidTheme('frost_dark')).toBe(true);
      expect(ValidationUtils.isValidTheme('invalid')).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should validate URLs', () => {
      expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true);
      expect(ValidationUtils.isValidUrl('http://localhost:3000')).toBe(true);
      expect(ValidationUtils.isValidUrl('invalid-url')).toBe(false);
    });

    it('should validate colors', () => {
      expect(ValidationUtils.isValidColor('#ff0000')).toBe(true);
      expect(ValidationUtils.isValidColor('#fff')).toBe(true);
      expect(ValidationUtils.isValidColor('rgb(255, 0, 0)')).toBe(true);
      expect(ValidationUtils.isValidColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(ValidationUtils.isValidColor('red')).toBe(true);
      expect(ValidationUtils.isValidColor('invalid-color')).toBe(false);
    });

    it('should generate error messages', () => {
      const errors = ['Field is required', 'Invalid format'];
      const message = ValidationUtils.generateErrorMessage(errors);

      expect(message).toContain('Multiple validation errors');
      expect(message).toContain('Field is required');
      expect(message).toContain('Invalid format');
    });

    it('should safely clone objects', () => {
      const obj = { name: 'test', nested: { value: 42 } };
      const cloned = ValidationUtils.safeClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj); // Different reference

      // Should handle circular references
      const circular: any = { name: 'test' };
      circular.self = circular;

      const clonedCircular = ValidationUtils.safeClone(circular);
      expect(clonedCircular).toBeNull();
    });
  });

  describe('Edge Cases and Coverage', () => {
    it('should validate array type with constraints', () => {
      const schema = {
        tags: { type: 'array', minLength: 1, maxLength: 3 },
      };

      // Test minimum length violation
      const tooFew = { tags: [] };
      const result1 = ValidationUtils.validate(tooFew, schema);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('tags must have at least 1 items');

      // Test maximum length violation
      const tooMany = { tags: ['a', 'b', 'c', 'd'] };
      const result2 = ValidationUtils.validate(tooMany, schema);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('tags must have no more than 3 items');

      // Test valid array
      const valid = { tags: ['a', 'b'] };
      const result3 = ValidationUtils.validate(valid, schema);
      expect(result3.isValid).toBe(true);
    });

    it('should handle custom validation returning false', () => {
      const schema = {
        field: {
          type: 'string',
          custom: () => false, // This triggers the boolean false path
        },
      };

      const data = { field: 'value' };
      const result = ValidationUtils.validate(data, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('field failed custom validation');
    });

    it('should handle validation that generates warnings', () => {
      // We need a schema that will trigger warnings in the main validate method
      const schemaWithOptional = {
        required: { type: 'string', required: true },
        optional: { type: 'string', required: false },
      };

      // Test data that passes validation but could generate warnings in some scenarios
      const data = { required: 'value' };
      const result = ValidationUtils.validate(data, schemaWithOptional);

      expect(result.isValid).toBe(true);
      // The warnings array might be undefined if no warnings were generated
      if (result.warnings) {
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });
  });
});
