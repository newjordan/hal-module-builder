// Minimal error string scaffolding mapped to existing legacy messages
export const ERR = {
  // Object requirements
  LAYER_OBJECT_REQUIRED: 'Layer must be a valid object',
  TEMPLATE_OBJECT_REQUIRED: 'Template must be an object',
  CIRCLE_SETTINGS_OBJECT: 'Circle settings must be an object',
  EQUALIZER_SETTINGS_OBJECT: 'Equalizer settings must be an object',
  GRADIENT_MUST_BE_OBJECT: 'Gradient must be an object',

  // Template base
  TEMPLATE_ID_REQUIRED: 'Template ID is required',
  TEMPLATE_NAME_EMPTY: 'Template name cannot be empty',
  TEMPLATE_LAYERS_REQUIRED: 'Template must have a layers array',

  // Color/gradient
  COLOR_MUST_BE_STRING: 'Color must be a string',
  INVALID_COLOR_FORMAT: 'Invalid color format',
  GRADIENT_NEED_TWO_COLORS: 'Gradient must have at least 2 valid colors',
  GRADIENT_COLORS_ARRAY:
    'Gradient colors must be an array with at least 2 colors',

  // Helpers for dynamic warnings/errors
  invalidColorWarning: (color: string) => `Invalid color: ${color}`,
};

export type ErrorKeys = keyof typeof ERR;
