/**
 * ValidationUtils - Input validation schemas, type guards, and sanitization functions
 * Provides comprehensive validation for HAL Builder components
 */

// Type definitions for validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

/**
 * Layer validation schemas
 */
export const layerValidationSchema: ValidationSchema = {
  id: { type: 'string', required: true, minLength: 1 },
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  type: {
    type: 'string',
    required: true,
    enum: ['image', 'gradient', 'solid', 'effect', 'circle', 'equalizer'],
  },
  visible: { type: 'boolean', required: true },
  opacity: { type: 'number', required: true, min: 0, max: 1 },
  blendMode: {
    type: 'string',
    required: true,
    enum: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'],
  },
  scale: { type: 'number', required: true, min: 0.1, max: 10 },
  rotation: { type: 'number', required: true, min: 0, max: 360 },
  offsetX: { type: 'number', required: true, min: -1000, max: 1000 },
  offsetY: { type: 'number', required: true, min: -1000, max: 1000 },
};

/**
 * Template validation schema
 */
export const templateValidationSchema: ValidationSchema = {
  id: { type: 'string', required: true, minLength: 1 },
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  layers: { type: 'array', required: true },
  timestamp: { type: 'number', required: true },
  version: { type: 'string', required: false },
};

/**
 * Core validation functions
 */
export class ValidationUtils {
  /**
   * Validate a value against a schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [key, rule] of Object.entries(schema)) {
      const value = data[key];
      const fieldResult = this.validateField(key, value, rule);

      if (!fieldResult.isValid) {
        errors.push(...fieldResult.errors);
      }
      if (fieldResult.warnings) {
        warnings.push(...fieldResult.warnings);
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
    } as { isValid: boolean; errors: string[]; warnings?: string[] };

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }

  /**
   * Validate a single field
   */
  private static validateField(
    fieldName: string,
    value: any,
    rule: ValidationRule
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required
    if (
      rule.required &&
      (value === undefined || value === null || value === '')
    ) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    // Skip further validation if value is not provided and not required
    if (value === undefined || value === null) {
      return { isValid: true, errors: [] };
    }

    // Type validation
    if (!this.validateType(value, rule.type)) {
      errors.push(`${fieldName} must be of type ${rule.type}`);
      return { isValid: false, errors };
    }

    // Additional validations based on type
    switch (rule.type) {
      case 'string':
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(
            `${fieldName} must be at least ${rule.minLength} characters`
          );
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(
            `${fieldName} must be no more than ${rule.maxLength} characters`
          );
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${fieldName} format is invalid`);
        }
        break;

      case 'number':
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${fieldName} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${fieldName} must be no more than ${rule.max}`);
        }
        break;

      case 'array':
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(
            `${fieldName} must have at least ${rule.minLength} items`
          );
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(
            `${fieldName} must have no more than ${rule.maxLength} items`
          );
        }
        break;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${fieldName} must be one of: ${rule.enum.join(', ')}`);
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        errors.push(`${fieldName}: ${customResult}`);
      } else if (customResult === false) {
        errors.push(`${fieldName} failed custom validation`);
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
    } as { isValid: boolean; errors: string[]; warnings?: string[] };

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return result;
  }

  /**
   * Validate type
   */
  private static validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return (
          typeof value === 'object' && value !== null && !Array.isArray(value)
        );
      default:
        return false;
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(
    input: string,
    options: {
      maxLength?: number;
      allowHtml?: boolean;
      trim?: boolean;
    } = {}
  ): string {
    let sanitized = input;

    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }

    if (!options.allowHtml) {
      // Basic HTML escape
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(
    input: any,
    options: {
      min?: number;
      max?: number;
      precision?: number;
    } = {}
  ): number | null {
    const num = Number(input);

    if (isNaN(num)) {
      return null;
    }

    let sanitized = num;

    if (options.min !== undefined && sanitized < options.min) {
      sanitized = options.min;
    }

    if (options.max !== undefined && sanitized > options.max) {
      sanitized = options.max;
    }

    if (options.precision !== undefined) {
      sanitized = Number(sanitized.toFixed(options.precision));
    }

    return sanitized;
  }

  /**
   * Type guards for layer types
   */
  static isValidLayerType(
    type: any
  ): type is
    | 'image'
    | 'gradient'
    | 'solid'
    | 'effect'
    | 'circle'
    | 'equalizer' {
    return [
      'image',
      'gradient',
      'solid',
      'effect',
      'circle',
      'equalizer',
    ].includes(type);
  }

  static isValidBlendMode(
    mode: any
  ): mode is
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten' {
    return [
      'normal',
      'multiply',
      'screen',
      'overlay',
      'darken',
      'lighten',
    ].includes(mode);
  }

  static isValidTheme(theme: any): theme is 'frost_light' | 'frost_dark' {
    return ['frost_light', 'frost_dark'].includes(theme);
  }

  /**
   * Validate layer object
   */
  static validateLayer(layer: any): ValidationResult {
    const result = this.validate(layer, layerValidationSchema);

    // Additional layer-specific validations
    if (layer.type === 'image' && layer.src && typeof layer.src === 'string') {
      if (!this.isValidUrl(layer.src) && !this.isValidFilePath(layer.src)) {
        result.errors.push('Image src must be a valid URL or file path');
        result.isValid = false;
      }
    }

    if (
      layer.type === 'solid' &&
      (!layer.color || !this.isValidColor(layer.color))
    ) {
      result.errors.push('Solid layer must have a valid color');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate template object
   */
  static validateTemplate(template: any): ValidationResult {
    const result = this.validate(template, templateValidationSchema);

    // Validate each layer in the template
    if (Array.isArray(template.layers)) {
      template.layers.forEach((layer: any, index: number) => {
        const layerResult = this.validateLayer(layer);
        if (!layerResult.isValid) {
          result.errors.push(
            `Layer ${index}: ${layerResult.errors.join(', ')}`
          );
          result.isValid = false;
        }
      });
    }

    return result;
  }

  /**
   * Utility validation functions
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidFilePath(path: string): boolean {
    // Basic file path validation - should have file extension or be absolute/relative path
    if (typeof path !== 'string' || path.length === 0) return false;

    // Security checks
    if (path.includes('<') || path.includes('>')) return false;

    // Should look like a file path (has extension or starts with ./ or / or contains backslashes)
    return (
      path.includes('.') || // has file extension
      path.startsWith('./') || // relative path
      path.startsWith('../') || // relative path
      path.startsWith('/') || // absolute unix path
      /^[A-Za-z]:\\/.test(path) || // Windows absolute path
      path.includes('\\') // Windows path separators
    );
  }

  static isValidColor(color: string): boolean {
    // Basic color validation for hex, rgb, rgba, hsl, hsla, and named colors
    const colorPatterns = [
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, // Hex colors
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, // RGB
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[01]?\.?\d*\s*\)$/, // RGBA
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/, // HSL
      /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[01]?\.?\d*\s*\)$/, // HSLA
    ];

    return (
      colorPatterns.some(pattern => pattern.test(color)) ||
      this.isValidColorName(color)
    );
  }

  static isValidColorName(color: string): boolean {
    // List of basic CSS color names
    const colorNames = [
      'black',
      'white',
      'red',
      'green',
      'blue',
      'yellow',
      'cyan',
      'magenta',
      'gray',
      'grey',
      'maroon',
      'navy',
      'olive',
      'purple',
      'teal',
      'silver',
      'orange',
      'pink',
      'brown',
      'gold',
      'violet',
      'indigo',
      'transparent',
    ];

    return colorNames.includes(color.toLowerCase());
  }

  /**
   * Generate error messages
   */
  static generateErrorMessage(errors: string[]): string {
    if (errors.length === 0) return '';
    if (errors.length === 1) return errors[0] ?? 'Unknown validation error';

    return `Multiple validation errors: ${errors.join('; ')}`;
  }

  /**
   * Deep clone with validation
   */
  static safeClone<T>(obj: T): T | null {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('ValidationUtils: Failed to clone object', error);
      return null;
    }
  }
}

export default ValidationUtils;
