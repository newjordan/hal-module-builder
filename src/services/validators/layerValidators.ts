import { Layer } from '../../types/layer-types';
import { ERR } from '../validation/errorCodes';
import { ValidationResult } from '../validation/validationTypes';
import {
  sanitizeBoolean,
  sanitizeNumber,
  sanitizeString,
} from './commonValidators';
import { effectValidators } from './effectValidators';
import { validateColor } from './uiValidators';

// Constants
const LAYER_TYPES = [
  'image',
  'equalizer',
  'shape',
  'gradient',
  'solid',
  'effect',
  'circle',
] as const;
const BLEND_MODES = [
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
] as const;

type Rule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
};
function validateField(
  value: any,
  field: string,
  rules: Rule
): ValidationResult {
  const errors: string[] = [];
  if (rules.required && (value === undefined || value === null)) {
    return { isValid: false, errors: [`${field} is required`], warnings: [] };
  }
  if (value === undefined || value === null) {
    return { isValid: true, errors: [], warnings: [] };
  }
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (rules.type && actualType !== rules.type) {
    errors.push(`${field} must be of type ${rules.type}`);
  }
  if (rules.type === 'number') {
    if (rules.min !== undefined && value < rules.min)
      errors.push(`${field} must be at least ${rules.min}`);
    if (rules.max !== undefined && value > rules.max)
      errors.push(`${field} must be at most ${rules.max}`);
  }
  if (rules.type === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength)
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    if (rules.maxLength !== undefined && value.length > rules.maxLength)
      errors.push(`${field} must be at most ${rules.maxLength} characters`);
    if (rules.pattern && !rules.pattern.test(value))
      errors.push(`${field} format is invalid`);
  }
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
  }
  if (rules.custom) {
    const cr = rules.custom(value);
    if (typeof cr === 'string') errors.push(cr);
    else if (cr === false) errors.push(`${field} failed custom validation`);
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
    sanitizedValue: value,
  };
}

function validateGradient(gradient: any): ValidationResult {
  const sanitized: any = {};
  const errors: string[] = [];
  if (!gradient || typeof gradient !== 'object') {
    return {
      isValid: false,
      errors: [ERR.GRADIENT_MUST_BE_OBJECT],
      warnings: [],
      sanitizedValue: {
        type: 'radial',
        colors: ['#ffffff', '#000000'],
        stops: [0, 1],
        centerX: 50,
        centerY: 50,
      },
    };
  }
  const validTypes = ['radial', 'linear', 'conic'];
  sanitized.type = validTypes.includes(gradient.type)
    ? gradient.type
    : 'radial';

  if (Array.isArray(gradient.colors) && gradient.colors.length >= 2) {
    sanitized.colors = gradient.colors.filter(
      (c: string) => validateColor(c).isValid
    );
    if (sanitized.colors.length < 2) {
      sanitized.colors = ['#ffffff', '#000000'];
      errors.push(ERR.GRADIENT_NEED_TWO_COLORS);
    }
  } else {
    sanitized.colors = ['#ffffff', '#000000'];
    errors.push(ERR.GRADIENT_COLORS_ARRAY);
  }
  if (
    Array.isArray(gradient.stops) &&
    gradient.stops.length === sanitized.colors.length
  ) {
    sanitized.stops = gradient.stops.map((stop: number, i: number) =>
      sanitizeNumber(stop, i / (sanitized.colors.length - 1), 0, 1)
    );
  } else {
    sanitized.stops = sanitized.colors.map(
      (_: string, i: number) => i / (sanitized.colors.length - 1)
    );
  }
  if (sanitized.type === 'radial') {
    sanitized.centerX = sanitizeNumber(gradient.centerX, 50, 0, 100);
    sanitized.centerY = sanitizeNumber(gradient.centerY, 50, 0, 100);
  } else if (sanitized.type === 'linear') {
    sanitized.angle = sanitizeNumber(gradient.angle, 0, 0, 360);
  }
  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
    sanitizedValue: sanitized,
  };
}

function validateCircleSettings(settings: any): ValidationResult {
  if (!settings || typeof settings !== 'object') {
    return {
      isValid: false,
      errors: [ERR.CIRCLE_SETTINGS_OBJECT],
      warnings: [],
      sanitizedValue: getDefaultCircleSettings(),
    };
  }
  const sanitized: any = {};
  sanitized.radius = sanitizeNumber(settings.radius, 100, 1, 500);
  sanitized.thickness = sanitizeNumber(settings.thickness, 5, 0.5, 50);
  const fillTypes = ['none', 'solid', 'gradient'];
  sanitized.fillType = fillTypes.includes(settings.fillType)
    ? settings.fillType
    : 'none';
  const strokeTypes = ['solid', 'gradient'];
  sanitized.strokeType = strokeTypes.includes(settings.strokeType)
    ? settings.strokeType
    : 'solid';
  if (settings.fillColor)
    sanitized.fillColor = validateColor(settings.fillColor).isValid
      ? settings.fillColor
      : '#ffffff';
  if (settings.strokeColor)
    sanitized.strokeColor = validateColor(settings.strokeColor).isValid
      ? settings.strokeColor
      : '#ffffff';
  sanitized.glowIntensity = sanitizeNumber(settings.glowIntensity, 0.5, 0, 2);
  sanitized.dashArray = sanitizeString(settings.dashArray, '', 50);
  const animations = ['none', 'rotate'];
  sanitized.animation = animations.includes(settings.animation)
    ? settings.animation
    : 'none';
  sanitized.animationSpeed = sanitizeNumber(
    settings.animationSpeed,
    1,
    0.1,
    10
  );
  return { isValid: true, errors: [], warnings: [], sanitizedValue: sanitized };
}

function getDefaultCircleSettings() {
  return {
    radius: 100,
    thickness: 5,
    fillType: 'none',
    strokeType: 'solid',
    strokeColor: '#ffffff',
    fillColor: '#ffffff',
    glowIntensity: 0.5,
    glowColor: '#ffffff',
    dashArray: '',
    animation: 'none',
    animationSpeed: 1,
  };
}

function validateTypeSpecificProperties(layer: any, type: string) {
  const sanitized: Partial<Layer> = {};
  const errors: string[] = [];
  const warnings: string[] = [];
  switch (type) {
    case 'image':
      if (layer.src) sanitized.src = sanitizeString(layer.src, '', 2000);
      sanitized.brightness = sanitizeNumber(layer.brightness, 1, 0, 10);
      sanitized.contrast = sanitizeNumber(layer.contrast, 1, 0, 10);
      break;
    case 'solid':
      if (layer.color) {
        const cr = validateColor(layer.color);
        if (cr.isValid) sanitized.color = cr.sanitizedValue;
        else {
          warnings.push(ERR.invalidColorWarning(layer.color));
          sanitized.color = '#ffffff';
        }
      }
      break;
    case 'gradient':
      if (layer.gradient) {
        const gr = validateGradient(layer.gradient);
        sanitized.gradient = gr.sanitizedValue;
        warnings.push(...gr.errors);
      }
      break;
    case 'circle':
    case 'shape':
      if (layer.circleSettings) {
        const cr = validateCircleSettings(layer.circleSettings);
        sanitized.circleSettings = cr.sanitizedValue;
        warnings.push(...cr.errors);
      }
      break;
    case 'equalizer':
    case 'effect':
      if (layer.equalizerSettings) {
        const er = effectValidators.validateEqualizerSettings(
          layer.equalizerSettings
        );
        const mergedEqualizer = {
          ...(typeof layer.equalizerSettings === 'object'
            ? layer.equalizerSettings
            : {}),
          ...(typeof er.sanitizedValue === 'object' ? er.sanitizedValue : {}),
        };
        sanitized.equalizerSettings = mergedEqualizer;
        warnings.push(...er.errors);
      }
      break;
  }
  return { sanitized, errors, warnings };
}

export const layerValidators = {
  /** Full layer structure + type-specific validation */
  validateLayerStructure(layer: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!layer || typeof layer !== 'object') {
      return {
        isValid: false,
        errors: [ERR.LAYER_OBJECT_REQUIRED],
        warnings: [],
      };
    }

    const input = layer as any;
    const sanitized: Partial<Layer> = {};

    const idRes = validateField(input.id, 'id', {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 100,
    });
    if (!idRes.isValid) errors.push(...idRes.errors);
    else sanitized.id = idRes.sanitizedValue;

    const nameRes = validateField(input.name, 'name', {
      required: true,
      type: 'string',
      maxLength: 200,
    });
    if (!nameRes.isValid) errors.push(...nameRes.errors);
    else sanitized.name = nameRes.sanitizedValue;

    const typeRes = validateField(input.type, 'type', {
      required: true,
      enum: Array.from(LAYER_TYPES) as any[],
    });
    if (!typeRes.isValid) errors.push(...typeRes.errors);
    else sanitized.type = typeRes.sanitizedValue;

    sanitized.visible = sanitizeBoolean(input.visible, true);

    const opRes = validateField(input.opacity, 'opacity', {
      type: 'number',
      min: 0,
      max: 1,
    });
    sanitized.opacity = opRes.isValid ? opRes.sanitizedValue : 1;
    if (!opRes.isValid) warnings.push(...opRes.errors);

    const bmRes = validateField(input.blendMode, 'blendMode', {
      enum: Array.from(BLEND_MODES) as any[],
    });
    sanitized.blendMode = bmRes.isValid ? bmRes.sanitizedValue : 'normal';
    if (!bmRes.isValid) warnings.push(...bmRes.errors);

    sanitized.scale = sanitizeNumber(input.scale, 1, 0.01, 10);
    sanitized.rotation = sanitizeNumber(input.rotation, 0, -360, 360);
    sanitized.offsetX = sanitizeNumber(input.offsetX, 0, -1000, 1000);
    sanitized.offsetY = sanitizeNumber(input.offsetY, 0, -1000, 1000);

    if (sanitized.type) {
      const t = validateTypeSpecificProperties(input, sanitized.type);
      Object.assign(sanitized, t.sanitized);
      errors.push(...t.errors);
      warnings.push(...t.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: sanitized as Layer,
    };
  },
};

export type LayerValidators = typeof layerValidators;
export default layerValidators;
