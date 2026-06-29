import { ERR } from '../validation/errorCodes';
import { ValidationResult } from '../validation/validationTypes';

/**
 * UI Validators: Pure validation functions for form inputs, colors, and user data.
 * Provides XSS protection, format validation, and sanitization for UI components.
 */

// Precompiled regex patterns for optimal performance
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const RGB_COLOR_PATTERN =
  /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/;
const HSL_COLOR_PATTERN =
  /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+\s*)?\)$/;

/**
 * Validates color format and provides sanitized value
 * Supports hex (#RRGGBB), rgb/rgba, and hsl/hsla formats
 * @param color Color string to validate
 * @returns ValidationResult with sanitized color or error details
 */
export function validateColor(color: string): ValidationResult {
  if (typeof color !== 'string') {
    return { isValid: false, errors: [ERR.COLOR_MUST_BE_STRING], warnings: [] };
  }

  if (
    HEX_COLOR_PATTERN.test(color) ||
    RGB_COLOR_PATTERN.test(color) ||
    HSL_COLOR_PATTERN.test(color)
  ) {
    return { isValid: true, errors: [], warnings: [], sanitizedValue: color };
  }

  return { isValid: false, errors: [ERR.INVALID_COLOR_FORMAT], warnings: [] };
}

export const uiValidators = {
  validateColor,
};

export default uiValidators;
