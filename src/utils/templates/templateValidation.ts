/**
 * Template Validation Utilities
 *
 * Extracted and enhanced from template-utils.ts to provide comprehensive
 * template/preset validation functionality for the TemplateManager components.
 */

import { Layer, Preset } from '../../types/layer-types';

/**
 * Template validation result interface
 */
export interface TemplateValidationResult {
  /** Whether the template is valid */
  isValid: boolean;
  /** Validated preset data */
  preset?: Preset;
  /** Error message if validation failed */
  error?: string;
  /** Warning messages for non-critical issues */
  warnings?: string[];
}

/**
 * Template validation configuration
 */
export interface ValidationConfig {
  /** Current template version */
  version: number;
  /** Whether to allow missing optional fields */
  allowMissingOptional: boolean;
  /** Whether to repair invalid data automatically */
  autoRepair: boolean;
  /** Maximum number of layers allowed */
  maxLayers: number;
  /** Maximum preset name length */
  maxNameLength: number;
}

/**
 * Default validation configuration
 */
const DEFAULT_CONFIG: ValidationConfig = {
  version: 1,
  allowMissingOptional: true,
  autoRepair: true,
  maxLayers: 100,
  maxNameLength: 50,
};

/**
 * Required layer properties for validation
 */
const REQUIRED_LAYER_PROPS = [
  'id',
  'name',
  'type',
  'visible',
  'opacity',
  'blendMode',
  'scale',
  'rotation',
  'offsetX',
  'offsetY',
];

/**
 * Valid layer types
 */
const VALID_LAYER_TYPES = [
  'image',
  'gradient',
  'solid',
  'effect',
  'circle',
  'equalizer',
  'shape',
];

/**
 * Valid blend modes
 */
const VALID_BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

/**
 * Validates a single layer object (internal implementation)
 * @param layer - Layer object to validate
 * @param config - Validation configuration
 * @returns Validation result with repaired layer if auto-repair is enabled
 */
export const validateLayerInternal = (
  layer: any,
  config: ValidationConfig = DEFAULT_CONFIG
): {
  isValid: boolean;
  layer?: Layer;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!layer || typeof layer !== 'object') {
    errors.push('Layer must be an object');
    return { isValid: false, errors, warnings };
  }

  // Check required properties
  for (const prop of REQUIRED_LAYER_PROPS) {
    if (!(prop in layer) || layer[prop] === undefined) {
      if (config.autoRepair) {
        // Attempt to repair missing properties
        switch (prop) {
          case 'id':
            layer[prop] =
              `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            warnings.push(`Generated missing layer ID: ${layer[prop]}`);
            break;
          case 'name':
            layer[prop] = `Layer ${Date.now()}`;
            warnings.push(`Generated missing layer name: ${layer[prop]}`);
            break;
          case 'type':
            layer[prop] = 'solid';
            warnings.push('Set missing layer type to "solid"');
            break;
          case 'visible':
            layer[prop] = true;
            warnings.push('Set missing visibility to true');
            break;
          case 'opacity':
            layer[prop] = 1;
            warnings.push('Set missing opacity to 1');
            break;
          case 'blendMode':
            layer[prop] = 'normal';
            warnings.push('Set missing blend mode to "normal"');
            break;
          case 'scale':
            layer[prop] = 1;
            warnings.push('Set missing scale to 1');
            break;
          case 'rotation':
          case 'offsetX':
          case 'offsetY':
            layer[prop] = 0;
            warnings.push(`Set missing ${prop} to 0`);
            break;
        }
      } else {
        errors.push(`Missing required property: ${prop}`);
      }
    }
  }

  // Validate property types and values
  if (typeof layer.id !== 'string' || !layer.id.trim()) {
    errors.push('Layer ID is required');
  }

  if (typeof layer.name !== 'string' || !layer.name.trim()) {
    if (config.autoRepair) {
      layer.name = `Layer ${layer.id || Date.now()}`;
      warnings.push(`Repaired invalid layer name: ${layer.name}`);
    } else {
      errors.push('Layer name must be a non-empty string');
    }
  }

  if (!VALID_LAYER_TYPES.includes(layer.type)) {
    if (config.autoRepair) {
      layer.type = 'solid';
      warnings.push(`Changed invalid layer type to "solid"`);
    } else {
      errors.push('Invalid layer type');
    }
  }

  if (typeof layer.visible !== 'boolean') {
    if (config.autoRepair) {
      layer.visible = Boolean(layer.visible);
      warnings.push(`Converted visibility to boolean: ${layer.visible}`);
    } else {
      errors.push('Layer visibility must be a boolean');
    }
  }

  // Validate numeric properties
  const numericProps = ['opacity', 'scale', 'rotation', 'offsetX', 'offsetY'];
  for (const prop of numericProps) {
    if (typeof layer[prop] !== 'number' || isNaN(layer[prop])) {
      if (config.autoRepair) {
        const defaultValue = prop === 'opacity' || prop === 'scale' ? 1 : 0;
        layer[prop] = defaultValue;
        warnings.push(`Repaired invalid ${prop} to ${defaultValue}`);
      } else {
        errors.push(`Layer ${prop} must be a valid number`);
      }
    }
  }

  // Validate blend mode
  if (!VALID_BLEND_MODES.includes(layer.blendMode)) {
    if (config.autoRepair) {
      layer.blendMode = 'normal';
      warnings.push('Changed invalid blend mode to "normal"');
    } else {
      errors.push(`Invalid blend mode: ${layer.blendMode}`);
    }
  }

  // Validate numeric ranges
  if (layer.opacity < 0 || layer.opacity > 1) {
    if (config.autoRepair) {
      layer.opacity = Math.max(0, Math.min(1, layer.opacity));
      warnings.push(`Clamped opacity to valid range: ${layer.opacity}`);
    } else {
      errors.push('Opacity must be between 0 and 1');
    }
  }

  if (layer.scale <= 0) {
    if (config.autoRepair) {
      layer.scale = 1;
      warnings.push('Reset invalid scale to 1');
    } else {
      errors.push('Layer scale must be greater than 0');
    }
  }

  if (errors.length === 0) {
    return {
      isValid: true,
      layer: layer as Layer,
      errors,
      warnings,
    };
  } else {
    return {
      isValid: false,
      errors,
      warnings,
    };
  }
};

/**
 * Validates a single layer object (test-compatible interface)
 * @param layer - Layer object to validate
 * @returns Validation result matching test expectations
 */
export const validateLayer = (layer: any): TemplateValidationError => {
  const result = validateLayerInternal(layer, {
    ...DEFAULT_CONFIG,
    autoRepair: false,
  });

  // Additional validation for specific layer types
  const additionalErrors: string[] = [];

  if (layer && layer.type === 'gradient' && !layer.gradient) {
    additionalErrors.push('Gradient layer requires gradient properties');
  }

  return {
    valid: result.isValid && additionalErrors.length === 0,
    errors: [...result.errors, ...additionalErrors],
    warnings: result.warnings,
  };
};

/**
 * Validates a preset object structure
 * @param preset - Preset object to validate
 * @param config - Validation configuration
 * @returns Validation result with repaired preset if auto-repair is enabled
 */
export const validatePreset = (
  preset: any,
  config: ValidationConfig = DEFAULT_CONFIG
): TemplateValidationResult => {
  const warnings: string[] = [];

  try {
    // Check if preset is an object
    if (!preset || typeof preset !== 'object') {
      return {
        isValid: false,
        error: 'Preset must be an object',
      };
    }

    // Check required preset fields
    if (!preset.id || typeof preset.id !== 'string') {
      if (config.autoRepair) {
        preset.id = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        warnings.push(`Generated missing preset ID: ${preset.id}`);
      } else {
        return {
          isValid: false,
          error: 'Preset must have a valid ID',
        };
      }
    }

    if (!preset.name || typeof preset.name !== 'string') {
      if (config.autoRepair) {
        preset.name = `Preset ${Date.now()}`;
        warnings.push(`Generated missing preset name: ${preset.name}`);
      } else {
        return {
          isValid: false,
          error: 'Preset must have a valid name',
        };
      }
    }

    // Validate name length
    if (preset.name.length > config.maxNameLength) {
      if (config.autoRepair) {
        preset.name = preset.name.substring(0, config.maxNameLength);
        warnings.push(
          `Trimmed preset name to ${config.maxNameLength} characters`
        );
      } else {
        return {
          isValid: false,
          error: `Preset name must be ${config.maxNameLength} characters or less`,
        };
      }
    }

    // Check timestamp
    if (
      preset.timestamp &&
      (typeof preset.timestamp !== 'number' || preset.timestamp <= 0)
    ) {
      if (config.autoRepair) {
        preset.timestamp = Date.now();
        warnings.push('Repaired invalid timestamp');
      } else {
        return {
          isValid: false,
          error: 'Preset timestamp must be a valid number',
        };
      }
    } else if (!preset.timestamp) {
      preset.timestamp = Date.now();
      warnings.push('Added missing timestamp');
    }

    // Check layers array
    if (!Array.isArray(preset.layers)) {
      return {
        isValid: false,
        error: 'Preset must have a layers array',
      };
    }

    if (preset.layers.length > config.maxLayers) {
      if (config.autoRepair) {
        preset.layers = preset.layers.slice(0, config.maxLayers);
        warnings.push(`Limited layers to maximum of ${config.maxLayers}`);
      } else {
        return {
          isValid: false,
          error: `Preset cannot have more than ${config.maxLayers} layers`,
        };
      }
    }

    // Validate each layer
    const validatedLayers: Layer[] = [];
    for (let i = 0; i < preset.layers.length; i++) {
      const layerResult = validateLayerInternal(preset.layers[i], config);

      if (!layerResult.isValid) {
        return {
          isValid: false,
          error: `Layer ${i + 1}: ${layerResult.errors.join(', ')}`,
          warnings,
        };
      }

      if (layerResult.layer) {
        validatedLayers.push(layerResult.layer);
      }

      warnings.push(...layerResult.warnings);
    }

    // Create validated preset
    const validatedPreset: Preset = {
      id: preset.id,
      name: preset.name,
      timestamp: preset.timestamp,
      layers: validatedLayers,
      groups: preset.groups || undefined, // Optional
    };

    if (warnings.length > 0) {
      return {
        isValid: true,
        preset: validatedPreset,
        warnings,
      };
    } else {
      return {
        isValid: true,
        preset: validatedPreset,
      };
    }
  } catch (error) {
    if (warnings.length > 0) {
      return {
        isValid: false,
        error: `Template validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings,
      };
    } else {
      return {
        isValid: false,
        error: `Template validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
};

/**
 * Validates imported preset data from JSON
 * @param jsonData - Raw JSON data string
 * @param config - Validation configuration
 * @returns Validation result
 */
export const validateImportedPreset = (
  jsonData: string,
  config: ValidationConfig = DEFAULT_CONFIG
): TemplateValidationResult => {
  try {
    const parsed = JSON.parse(jsonData);
    return validatePreset(parsed, config);
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`,
    };
  }
};

/**
 * Validates preset name for uniqueness and format
 * @param name - Preset name to validate
 * @param existingPresets - Array of existing presets
 * @param config - Validation configuration
 * @returns Error message if invalid, null if valid
 */
export const validatePresetName = (
  name: string,
  existingPresets: Preset[] = [],
  config: ValidationConfig = DEFAULT_CONFIG
): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    return 'Name cannot be empty';
  }

  if (trimmedName.length > config.maxNameLength) {
    return `Name must be ${config.maxNameLength} characters or less`;
  }

  // Check for invalid characters
  if (!/^[a-zA-Z0-9\s\-_().]+$/.test(trimmedName)) {
    return 'Name contains invalid characters. Use only letters, numbers, spaces, hyphens, underscores, and parentheses';
  }

  // Check for duplicates
  const duplicate = existingPresets.find(
    preset => preset.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (duplicate) {
    return 'A preset with this name already exists';
  }

  return null; // Valid
};

/**
 * Sanitizes preset data for safe storage
 * @param preset - Preset to sanitize
 * @returns Sanitized preset
 */
export const sanitizePreset = (preset: Preset): Preset => {
  return {
    id: preset.id.trim(),
    name: preset.name.trim(),
    timestamp: preset.timestamp,
    layers: preset.layers.map(layer => ({
      ...layer,
      id: layer.id.trim(),
      name: layer.name.trim(),
      opacity: Math.max(0, Math.min(1, layer.opacity)),
      scale: Math.max(0.01, layer.scale),
      rotation: layer.rotation % 360,
      offsetX: Math.max(-2000, Math.min(2000, layer.offsetX)),
      offsetY: Math.max(-2000, Math.min(2000, layer.offsetY)),
    })),
    ...(preset.groups ? { groups: preset.groups } : {}),
  };
};

/**
 * Template validation result interface for template-specific validation
 */
export interface TemplateValidationError {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validates a template object (main function expected by tests)
 * @param template - Template object to validate
 * @returns Validation result
 */
export const validateTemplate = (template: any): TemplateValidationError => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!template || typeof template !== 'object') {
    return { valid: false, errors: ['Template must be an object'] };
  }

  // Check required template fields
  if (!template.id || typeof template.id !== 'string') {
    errors.push('Template ID is required');
  }

  if (
    !template.name ||
    typeof template.name !== 'string' ||
    !template.name.trim()
  ) {
    errors.push('Template name cannot be empty');
  }

  if (!Array.isArray(template.layers)) {
    errors.push('Template must have a layers array');
  } else {
    // Validate each layer
    for (let i = 0; i < template.layers.length; i++) {
      const layerResult = validateLayerInternal(template.layers[i]);
      if (!layerResult.isValid) {
        errors.push(`Layer ${i + 1}: ${layerResult.errors.join(', ')}`);
      }
      warnings.push(...layerResult.warnings);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates template structure for circular references and layer limits
 * @param template - Template to validate
 * @returns Validation result
 */
export const validateTemplateStructure = (
  template: any
): TemplateValidationError => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!template || typeof template !== 'object') {
    return { valid: false, errors: ['Template must be an object'] };
  }

  // Check for circular references
  try {
    JSON.stringify(template);
  } catch (error) {
    errors.push('Circular reference detected');
  }

  // Check layer count
  if (Array.isArray(template.layers) && template.layers.length > 100) {
    errors.push('Too many layers (max: 100)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates layer properties based on layer type
 * @param layer - Layer to validate
 * @returns Validation result
 */
export const validateLayerProperties = (
  layer: any
): TemplateValidationError => {
  const errors: string[] = [];

  if (!layer || typeof layer !== 'object') {
    return { valid: false, errors: ['Layer must be an object'] };
  }

  // Validate layer type specific properties
  switch (layer.type) {
    case 'solid':
      // Check if there's a valid color property (either color or solidColor)
      const colorValue = layer.color || layer.solidColor;

      if (!colorValue || typeof colorValue !== 'string') {
        errors.push('Invalid solid color format');
      } else {
        // Basic color format validation (hex, rgb, named colors)
        // More strict validation: only allow hex colors, rgb functions, or common named colors
        const isHex = /^#[0-9a-fA-F]{3,8}$/.test(colorValue);
        const isRgb =
          /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+)?\s*\)$/.test(
            colorValue
          );
        const isHsl =
          /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(\s*,\s*[\d.]+)?\s*\)$/.test(
            colorValue
          );
        const commonColors = [
          'red',
          'green',
          'blue',
          'white',
          'black',
          'yellow',
          'cyan',
          'magenta',
          'transparent',
        ];
        const isNamedColor = commonColors.includes(colorValue.toLowerCase());

        if (!isHex && !isRgb && !isHsl && !isNamedColor) {
          errors.push('Invalid solid color format');
        }
      }
      break;
    case 'image':
      // For image layers, we don't require src to be present for the basic property validation
      // The src is validated elsewhere in the layer validation
      break;
    case 'gradient':
      if (!layer.gradient || typeof layer.gradient !== 'object') {
        errors.push('Gradient layer must have gradient properties');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitizes template by removing dangerous properties
 * @param template - Template to sanitize
 * @returns Sanitized template
 */
export const sanitizeTemplate = (template: any): any => {
  if (!template || typeof template !== 'object') {
    return template;
  }

  // Create a clean object to avoid prototype issues
  const sanitized = JSON.parse(JSON.stringify(template));

  // Recursively sanitize layers to remove event handlers
  if (Array.isArray(sanitized.layers)) {
    sanitized.layers = sanitized.layers.map((layer: any) => {
      if (typeof layer === 'object' && layer !== null) {
        const sanitizedLayer = { ...layer };

        // Remove dangerous event handlers
        delete sanitizedLayer.onclick;
        delete sanitizedLayer.onmouseover;
        delete sanitizedLayer.onload;
        delete sanitizedLayer.onerror;

        // Remove any function properties (though JSON.parse/stringify should have removed them)
        Object.keys(sanitizedLayer).forEach(key => {
          if (typeof sanitizedLayer[key] === 'function') {
            delete sanitizedLayer[key];
          }
        });

        return sanitizedLayer;
      }
      return layer;
    });
  }

  return sanitized;
};

/**
 * Checks template compatibility with current version
 * @param template - Template to check
 * @param currentVersion - Current version to check against
 * @returns Compatibility result
 */
export const checkTemplateCompatibility = (
  template: any,
  currentVersion?: string
): { compatible: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (!template || typeof template !== 'object') {
    return { compatible: false, issues: ['Invalid template object'] };
  }

  if (!template.version) {
    issues.push('Template version is missing');
    return { compatible: false, issues };
  }

  if (currentVersion && template.version !== currentVersion) {
    const templateVersion = parseVersion(template.version);
    const current = parseVersion(currentVersion);

    if (templateVersion.major > current.major) {
      issues.push('Template version is newer than supported');
      return { compatible: false, issues };
    }
  }

  return { compatible: true, issues };
};

/**
 * Validates template metadata
 * @param metadata - Metadata to validate
 * @returns Validation result
 */
export const validateTemplateMetadata = (
  metadata: any
): TemplateValidationError => {
  const errors: string[] = [];

  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, errors: ['Metadata must be an object'] };
  }

  // Validate tags
  if (metadata.tags && !Array.isArray(metadata.tags)) {
    errors.push('Tags must be an array');
  } else if (metadata.tags) {
    for (const tag of metadata.tags) {
      if (typeof tag !== 'string' || !tag.trim()) {
        errors.push('Invalid tag format');
        break;
      }
      // Check for invalid characters (no spaces, special chars except hyphens and underscores)
      if (!/^[a-zA-Z0-9\-_]+$/.test(tag.trim())) {
        errors.push('Invalid tag format');
        break;
      }
    }
  }

  // Validate category
  const validCategories = ['basic', 'advanced', 'experimental', 'user', 'test'];
  if (metadata.category && !validCategories.includes(metadata.category)) {
    errors.push('Invalid category');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Helper function to parse version strings
 */
function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}
