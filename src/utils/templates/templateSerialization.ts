/**
 * Template Serialization Utilities
 *
 * Provides JSON serialization, export, and import functionality for templates/presets.
 * Handles safe data cloning and format conversion for the TemplateManager components.
 */

import { Layer, Preset } from '../../types/layer-types';

/**
 * Serialization options
 */
export interface SerializationOptions {
  /** Whether to include metadata in exports */
  includeMetadata?: boolean;
  /** Whether to pretty-print JSON */
  prettyPrint?: boolean;
  /** Number of spaces for indentation (when pretty printing) */
  indentSize?: number;
  /** Whether to include version information */
  includeVersion?: boolean;
  /** Custom metadata to include */
  customMetadata?: Record<string, any>;
}

/**
 * Export file formats
 */
export type ExportFormat = 'json' | 'yaml' | 'javascript';

/**
 * Metadata included in exports
 */
interface ExportMetadata {
  version: string;
  exportedAt: string;
  exportedBy: string;
  layerCount: number;
  estimatedSize: number;
  appVersion?: string;
}

/**
 * Default serialization options
 */
const DEFAULT_OPTIONS: SerializationOptions = {
  includeMetadata: true,
  prettyPrint: false,
  indentSize: 2,
  includeVersion: true,
};

/**
 * Current template format version
 */
const TEMPLATE_VERSION = '1.0';

/**
 * Safely clones layer data using structuredClone if available
 * @param layers - Layers array to clone
 * @returns Deep-cloned layers array
 */
export const cloneLayers = (layers: Layer[]): Layer[] => {
  try {
    // Use structuredClone if available (faster)
    if (typeof structuredClone === 'function') {
      return structuredClone(layers);
    }

    // Fallback to JSON serialization (slower but compatible)
    return JSON.parse(JSON.stringify(layers));
  } catch (error) {
    console.error('Failed to clone layers:', error);

    // Manual shallow copy as last resort
    return layers.map(layer => ({ ...layer }));
  }
};

/**
 * Safely clones preset data
 * @param preset - Preset to clone
 * @returns Deep-cloned preset
 */
export const clonePreset = (preset: Preset): Preset => {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(preset);
    }

    return JSON.parse(JSON.stringify(preset));
  } catch (error) {
    console.error('Failed to clone preset:', error);

    // Manual shallow copy as fallback
    const cloned: Preset = {
      ...preset,
      layers: cloneLayers(preset.layers),
    };

    if (preset.groups) {
      cloned.groups = [...preset.groups];
    }

    return cloned;
  }
};

/**
 * Calculates estimated file size of a preset
 * @param preset - Preset to estimate
 * @returns Estimated size in bytes
 */
export const estimatePresetSize = (preset: Preset): number => {
  try {
    const jsonString = JSON.stringify(preset);
    return new Blob([jsonString]).size;
  } catch (error) {
    // Fallback estimation
    return preset.layers.length * 500; // Rough estimate per layer
  }
};

/**
 * Creates export metadata
 * @param preset - Preset being exported
 * @param options - Serialization options
 * @returns Export metadata object
 */
export const createExportMetadata = (
  preset: Preset,
  options: SerializationOptions = DEFAULT_OPTIONS
): ExportMetadata & { complexity: string; tags: string[] } => {
  // Calculate complexity based on layers and their types
  const layerCount = preset.layers.length;
  const complexTypes = ['gradient', 'effect', 'equalizer'];
  const complexLayerCount = preset.layers.filter(layer =>
    complexTypes.includes(layer.type)
  ).length;

  let complexity = 'simple';
  if (layerCount >= 10 || complexLayerCount >= 5) {
    complexity = 'complex';
  } else if (layerCount >= 5 || complexLayerCount >= 2) {
    complexity = 'medium';
  }

  // Extract tags from preset metadata if available
  const tags = (preset as any).metadata?.tags || ['template'];

  return {
    version: TEMPLATE_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: 'HAL 9000 Layer Composer',
    layerCount: preset.layers.length,
    estimatedSize: estimatePresetSize(preset),
    complexity,
    tags,
    ...options.customMetadata,
  };
};

/**
 * Serializes a preset to JSON string
 * @param preset - Preset to serialize
 * @param options - Serialization options
 * @returns JSON string
 */
export const serializePreset = (
  preset: Preset,
  options: SerializationOptions = DEFAULT_OPTIONS
): string => {
  const exportData: any = {
    ...clonePreset(preset),
  };

  // Add metadata if requested
  if (options.includeMetadata) {
    exportData._metadata = createExportMetadata(preset, options);
  }

  // Add version if requested
  if (options.includeVersion) {
    exportData._version = TEMPLATE_VERSION;
  }

  // Serialize to JSON
  const indentSize = options.prettyPrint ? options.indentSize || 2 : undefined;
  return JSON.stringify(exportData, null, indentSize);
};

/**
 * Deserializes a preset from JSON string
 * @param jsonString - JSON string to deserialize
 * @returns Result with success status and template or error
 */
export const deserializePreset = (
  jsonString: string
): { success: boolean; template?: Preset; error?: string } => {
  try {
    const parsed = JSON.parse(jsonString);

    // Remove metadata fields if present
    const { _metadata, _version, ...presetData } = parsed;

    // Validate the template data
    const validation = validateTemplateData(presetData);
    if (!validation.valid) {
      return {
        success: false,
        error: `Template validation failed: missing required fields - ${validation.errors.join(', ')}`,
      };
    }

    return {
      success: true,
      template: presetData as Preset,
    };
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Exports a preset to downloadable file
 * @param preset - Preset to export
 * @param format - Export format
 * @param filename - Optional custom filename
 * @param options - Serialization options
 */
export const exportPresetToFile = (
  preset: Preset,
  format: ExportFormat = 'json',
  filename?: string,
  options: SerializationOptions = DEFAULT_OPTIONS
): void => {
  try {
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    // Generate content based on format
    switch (format) {
      case 'json':
        content = serializePreset(preset, options);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;

      case 'yaml':
        // Convert JSON to YAML-like format (simple implementation)
        const jsonData = JSON.parse(
          serializePreset(preset, { ...options, prettyPrint: false })
        );
        content = jsonToYaml(jsonData);
        mimeType = 'text/yaml';
        fileExtension = 'yaml';
        break;

      case 'javascript':
        const jsData = serializePreset(preset, {
          ...options,
          prettyPrint: false,
        });
        content = `// HAL 9000 Preset Export\nconst preset = ${jsData};\n\nexport default preset;\n`;
        mimeType = 'text/javascript';
        fileExtension = 'js';
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Generate filename
    const defaultName = `hal-preset-${preset.name.replace(/[^a-zA-Z0-9\-_]/g, '-')}`;
    const finalFilename = filename ?? `${defaultName}.${fileExtension}`;

    // Create and download file
    const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', finalFilename);
    linkElement.style.display = 'none';

    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  } catch (error) {
    throw new Error(
      `Failed to export preset: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Simple JSON to YAML converter (basic implementation)
 * @param obj - Object to convert
 * @param indent - Current indentation level
 * @returns YAML string
 */
const jsonToYaml = (obj: any, indent: number = 0): string => {
  const indentStr = '  '.repeat(indent);

  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return (
      '\n' +
      obj
        .map(item => `${indentStr}- ${jsonToYaml(item, indent + 1).trim()}`)
        .join('\n')
    );
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    return (
      '\n' +
      keys
        .map(key => {
          const value = jsonToYaml(obj[key], indent + 1);
          if (value.startsWith('\n')) {
            return `${indentStr}${key}:${value}`;
          } else {
            return `${indentStr}${key}: ${value}`;
          }
        })
        .join('\n')
    );
  }

  return String(obj);
};

/**
 * Imports preset from file content
 * @param fileContent - File content as string
 * @param filename - Original filename for format detection
 * @returns Imported preset
 * @throws Error if import fails
 */
export const importPresetFromFile = (
  fileContent: string,
  filename: string
): Preset => {
  try {
    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'json': {
        const result = deserializePreset(fileContent);
        if (!result.success) {
          throw new Error(result.error || 'Failed to deserialize preset');
        }
        return result.template!;
      }

      case 'yaml':
      case 'yml':
        // Simple YAML parsing (limited implementation)
        throw new Error('YAML import not yet implemented');

      case 'js':
      case 'javascript': {
        // Extract JSON from JavaScript export
        const jsonMatch = fileContent.match(/const\s+preset\s*=\s*({.*?});/s);
        if (!jsonMatch || !jsonMatch[1]) {
          throw new Error('Invalid JavaScript preset format');
        }
        const result = deserializePreset(jsonMatch[1]);
        if (!result.success) {
          throw new Error(result.error || 'Failed to deserialize preset');
        }
        return result.template!;
      }

      default: {
        // Try to parse as JSON by default
        const result = deserializePreset(fileContent);
        if (!result.success) {
          throw new Error(result.error || 'Failed to deserialize preset');
        }
        return result.template!;
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to import preset from ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Batch serializes multiple presets
 * @param presets - Array of presets to serialize
 * @param options - Serialization options
 * @returns JSON string containing all presets
 */
export const serializePresets = (
  presets: Preset[],
  options: SerializationOptions = DEFAULT_OPTIONS
): string => {
  const exportData = {
    presets: presets.map(preset => clonePreset(preset)),
    _metadata: {
      version: TEMPLATE_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: 'HAL 9000 Layer Composer',
      presetCount: presets.length,
      totalLayers: presets.reduce(
        (sum, preset) => sum + preset.layers.length,
        0
      ),
    },
  };

  const indentSize = options.prettyPrint ? options.indentSize || 2 : undefined;
  return JSON.stringify(exportData, null, indentSize);
};

/**
 * Batch deserializes multiple presets
 * @param jsonString - JSON string containing multiple presets
 * @returns Array of deserialized presets
 */
export const deserializePresets = (jsonString: string): Preset[] => {
  try {
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed)) {
      // Direct array of presets
      return parsed;
    } else if (parsed.presets && Array.isArray(parsed.presets)) {
      // Wrapped in metadata object
      return parsed.presets;
    } else {
      // Single preset
      return [parsed];
    }
  } catch (error) {
    throw new Error(
      `Failed to deserialize presets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Gets preset statistics for display
 * @param preset - Preset to analyze
 * @returns Statistics object
 */
export const getPresetStats = (preset: Preset) => {
  const visibleLayers = preset.layers.filter(layer => layer.visible).length;
  const layerTypes = preset.layers.reduce(
    (counts, layer) => {
      counts[layer.type] = (counts[layer.type] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>
  );

  return {
    totalLayers: preset.layers.length,
    visibleLayers,
    hiddenLayers: preset.layers.length - visibleLayers,
    layerTypes,
    estimatedSize: estimatePresetSize(preset),
    createdDate: new Date(preset.timestamp),
  };
};

/**
 * Validates template/preset data structure
 * @param template - Template data to validate
 * @returns Validation result with success status and errors
 */
export const validateTemplateData = (
  template: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!template) {
    errors.push('Template is null or undefined');
    return { valid: false, errors };
  }

  if (!template.id || typeof template.id !== 'string') {
    errors.push('Missing required field: id');
  }

  if (!template.name || typeof template.name !== 'string') {
    errors.push('Template must have a valid name');
  }

  if (!Array.isArray(template.layers)) {
    errors.push('Template must have a layers array');
  } else {
    template.layers.forEach((layer: any, index: number) => {
      if (!layer.id) {
        errors.push(`Layer at index ${index} missing required 'id' field`);
      }
      if (!layer.type) {
        errors.push(`Layer at index ${index} missing required 'type' field`);
      }
      if (typeof layer.visible !== 'boolean') {
        errors.push(`Layer at index ${index} missing required 'visible' field`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Converts legacy template format to current format
 * @param legacyTemplate - Old format template
 * @returns Result with success status and converted template
 */
export const convertLegacyTemplate = (
  legacyTemplate: any
): { success: boolean; template?: Preset; error?: string } => {
  try {
    // If already in current format, return as-is
    // Check for current versions: '1.0', '1.0.0', '2.0.0' or _version field presence
    const isCurrentVersion =
      legacyTemplate.version === TEMPLATE_VERSION ||
      legacyTemplate.version === '1.0.0' ||
      legacyTemplate.version === '2.0.0' ||
      legacyTemplate._version;

    if (isCurrentVersion) {
      return {
        success: true,
        template: legacyTemplate,
      };
    }

    // Convert legacy format
    const converted: any = {
      id: legacyTemplate.id || `legacy_${Date.now()}`,
      name: legacyTemplate.title || legacyTemplate.name || 'Converted Template',
      timestamp: legacyTemplate.timestamp || Date.now(),
      version: '2.0.0', // Set version for converted templates
      layers: [],
      groups: legacyTemplate.groups || [],
    };

    // Convert layers if they exist
    if (Array.isArray(legacyTemplate.layers)) {
      converted.layers = legacyTemplate.layers.map((layer: any) => {
        const { color, type, ...otherProps } = layer;

        const convertedLayer: any = {
          id: layer.id || `layer_${Date.now()}_${Math.random()}`,
          type:
            type === 'color' || type === 'solid' ? 'shape' : type || 'shape', // Convert color/solid types to shape
          visible: layer.visible !== false, // Default to visible
          opacity: layer.opacity || 1,
          ...otherProps, // Preserve other properties but exclude original type and color
        };

        // Convert color property to fillColor for shape layers
        if (color && (type === 'color' || type === 'solid')) {
          convertedLayer.fillColor = color;
          convertedLayer.fillType = 'solid';
          convertedLayer.shapeType = 'rectangle'; // Default to rectangle for solid fills
        }

        return convertedLayer;
      });
    }

    return {
      success: true,
      template: converted,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to convert legacy template: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Optimizes template size by removing unnecessary data
 * @param template - Template to optimize
 * @returns Optimized template with reduced size
 */
export const optimizeTemplateSize = (template: Preset): Preset => {
  const optimized = clonePreset(template);

  // Remove empty or default properties
  optimized.layers = optimized.layers.map(layer => {
    const optimizedLayer = { ...layer };

    // Remove default opacity (both 100 and 1 are common defaults)
    if (optimizedLayer.opacity === 100 || optimizedLayer.opacity === 1) {
      delete (optimizedLayer as any).opacity;
    }

    // Remove default scale
    if ((optimizedLayer as any).scale === 1) {
      delete (optimizedLayer as any).scale;
    }

    // Remove default rotation
    if ((optimizedLayer as any).rotation === 0) {
      delete (optimizedLayer as any).rotation;
    }

    // Remove default offsets
    if ((optimizedLayer as any).offsetX === 0) {
      delete (optimizedLayer as any).offsetX;
    }
    if ((optimizedLayer as any).offsetY === 0) {
      delete (optimizedLayer as any).offsetY;
    }

    // Remove empty properties object if it exists
    if (
      'properties' in optimizedLayer &&
      optimizedLayer.properties &&
      Object.keys(optimizedLayer.properties).length === 0
    ) {
      delete (optimizedLayer as any).properties;
    }

    // Remove default visible if it's true
    if (optimizedLayer.visible === true) {
      delete (optimizedLayer as any).visible;
    }

    return optimizedLayer;
  });

  // Remove empty groups array if present
  if (optimized.groups && optimized.groups.length === 0) {
    delete (optimized as any).groups;
  }

  return optimized;
};
