/**
 * SettingsValidator - Validates setting combinations and provides feedback
 * Single Responsibility: Ensures settings are valid and compatible
 */
import React from 'react';
import type { VisualizationSettings } from './SettingsStateManager';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface SettingsValidatorProps {
  settings: VisualizationSettings;
  visualizationType: string;
  theme: 'frost_light' | 'frost_dark';
  className?: string;
}

class SettingsValidationEngine {
  static validate(
    settings: VisualizationSettings,
    visualizationType: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Common validations
    this.validateCommonSettings(settings, errors, warnings);

    // Type-specific validations
    switch (visualizationType) {
      case 'dot':
        this.validateDotSettings(settings, errors, warnings);
        break;
      case 'bar':
      case 'block':
        this.validateBarSettings(settings, errors, warnings);
        break;
      case 'line':
        this.validateLineSettings(settings, errors, warnings);
        break;
      case 'triangle':
        this.validateTriangleSettings(settings, errors, warnings);
        break;
      case 'diamond':
        this.validateDiamondSettings(settings, errors, warnings);
        break;
      case 'hexagon':
        this.validateHexagonSettings(settings, errors, warnings);
        break;
      case 'circle':
        this.validateCircleSettings(settings, errors, warnings);
        break;
      default:
        // No specific validations for unknown types
        break;
    }

    // Performance validations
    this.validatePerformance(settings, visualizationType, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateCommonSettings(
    settings: VisualizationSettings,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    // Bar count validation
    if (settings.barCount < 8) {
      errors.push({
        field: 'barCount',
        message: 'Bar count must be at least 8',
        severity: 'error',
      });
    }

    if (settings.barCount > 128) {
      warnings.push({
        field: 'barCount',
        message: 'High bar count may impact performance',
        suggestion: 'Consider reducing to 64 or fewer for better performance',
      });
    }

    // Color validation
    if (!this.isValidColor(settings.primaryColor)) {
      errors.push({
        field: 'primaryColor',
        message: 'Invalid primary color format',
        severity: 'error',
      });
    }

    // Response speed validation
    if (settings.responseSpeed < 0.1 || settings.responseSpeed > 3) {
      errors.push({
        field: 'responseSpeed',
        message: 'Response speed must be between 0.1 and 3',
        severity: 'error',
      });
    }

    // Radial settings validation
    if (settings.layout === 'radial') {
      if (settings.innerRadius < 10) {
        errors.push({
          field: 'innerRadius',
          message: 'Inner radius must be at least 10px',
          severity: 'error',
        });
      }

      if (settings.arcMode) {
        if (settings.startAngle >= settings.endAngle) {
          errors.push({
            field: 'startAngle',
            message: 'Start angle must be less than end angle',
            severity: 'error',
          });
        }

        const arcRange = settings.endAngle - settings.startAngle;
        if (arcRange < 30) {
          warnings.push({
            field: 'arcMode',
            message: 'Very small arc range may not display well',
            suggestion:
              'Consider increasing the arc range to at least 30 degrees',
          });
        }
      }
    }
  }

  private static validateDotSettings(
    settings: VisualizationSettings,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (settings.dotSize && settings.dotSize < 2) {
      errors.push({
        field: 'dotSize',
        message: 'Dot size must be at least 2px',
        severity: 'error',
      });
    }

    // Grid layout validations
    if (settings.layout === 'grid') {
      if (settings.gridColumns && settings.gridColumns < 2) {
        errors.push({
          field: 'gridColumns',
          message: 'Grid must have at least 2 columns',
          severity: 'error',
        });
      }

      if (settings.gridRows && settings.gridRows < 2) {
        errors.push({
          field: 'gridRows',
          message: 'Grid must have at least 2 rows',
          severity: 'error',
        });
      }

      // Check if grid size matches bar count
      const gridSize = (settings.gridColumns || 8) * (settings.gridRows || 6);
      if (gridSize !== settings.barCount) {
        warnings.push({
          field: 'barCount',
          message: `Grid size (${gridSize}) doesn't match bar count (${settings.barCount})`,
          suggestion: 'Adjust grid dimensions or bar count for optimal display',
        });
      }
    }
  }

  private static validateBarSettings(
    settings: VisualizationSettings,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (settings.barWidth < 1) {
      errors.push({
        field: 'barWidth',
        message: 'Bar width must be at least 1px',
        severity: 'error',
      });
    }

    if (settings.maxHeight < 20) {
      errors.push({
        field: 'maxHeight',
        message: 'Max height must be at least 20px',
        severity: 'error',
      });
    }

    // Spacing vs width ratio
    if (settings.barSpacing > settings.barWidth * 2) {
      warnings.push({
        field: 'barSpacing',
        message: 'Large spacing relative to bar width may look sparse',
        suggestion: 'Consider reducing spacing or increasing bar width',
      });
    }
  }

  private static validateLineSettings(
    settings: VisualizationSettings,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (settings.lineWidth && settings.lineWidth < 1) {
      errors.push({
        field: 'lineWidth',
        message: 'Line width must be at least 1px',
        severity: 'error',
      });
    }

    if (
      settings.lineWidth &&
      settings.lineWidth > 10 &&
      settings.barCount > 64
    ) {
      warnings.push({
        field: 'lineWidth',
        message: 'Thick lines with high bar count may overlap',
        suggestion: 'Consider reducing line width or bar count',
      });
    }
  }

  private static validateTriangleSettings(
    settings: VisualizationSettings,
    _errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    // Triangle-specific validation
    if (
      settings.triangleOrientation === 'alternating' &&
      settings.barCount < 4
    ) {
      warnings.push({
        field: 'barCount',
        message: 'Alternating triangles work best with more elements',
        suggestion: 'Consider increasing bar count for alternating pattern',
      });
    }
  }

  private static validateDiamondSettings(
    settings: VisualizationSettings,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (settings.diamondSize && settings.diamondSize < 2) {
      errors.push({
        field: 'diamondSize',
        message: 'Diamond size must be at least 2px',
        severity: 'error',
      });
    }

    if (
      settings.diamondSize &&
      settings.diamondSize > 30 &&
      settings.barCount > 32
    ) {
      warnings.push({
        field: 'diamondSize',
        message: 'Large diamonds with high count may overlap',
        suggestion: 'Consider reducing diamond size or bar count',
      });
    }
  }

  private static validateHexagonSettings(
    settings: VisualizationSettings,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (settings.hexSize && settings.hexSize < 2) {
      errors.push({
        field: 'hexSize',
        message: 'Hexagon size must be at least 2px',
        severity: 'error',
      });
    }

    if (settings.hexSize && settings.hexSize > 25 && settings.barCount > 24) {
      warnings.push({
        field: 'hexSize',
        message: 'Large hexagons with high count may overlap',
        suggestion: 'Consider reducing hexagon size or bar count',
      });
    }
  }

  private static validateCircleSettings(
    settings: VisualizationSettings,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    if (settings.circleRadius && settings.circleRadius < 20) {
      errors.push({
        field: 'circleRadius',
        message: 'Circle radius must be at least 20px',
        severity: 'error',
      });
    }

    if (settings.pulsingEffect && settings.responseSpeed > 2) {
      warnings.push({
        field: 'responseSpeed',
        message: 'Fast response with pulsing may cause seizure-like effects',
        suggestion: 'Consider reducing response speed when pulsing is enabled',
      });
    }
  }

  private static validatePerformance(
    settings: VisualizationSettings,
    _visualizationType: string,
    _errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    // High bar count + effects warning
    if (settings.barCount > 64 && settings.glowIntensity > 1) {
      warnings.push({
        field: 'glowIntensity',
        message: 'High bar count with intense glow may impact performance',
        suggestion: 'Consider reducing glow intensity or bar count',
      });
    }

    // Complex gradient + high bar count
    if (
      settings.barCount > 96 &&
      ['custom-gradient', 'radial-gradient'].includes(settings.colorMode)
    ) {
      warnings.push({
        field: 'colorMode',
        message: 'Complex gradients with high bar count may cause lag',
        suggestion: 'Consider using simpler color modes for better performance',
      });
    }
  }

  private static isValidColor(color: string): boolean {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    return colorRegex.test(color);
  }
}

export const SettingsValidator: React.FC<SettingsValidatorProps> = ({
  settings,
  visualizationType,
  theme,
  className = '',
}) => {
  const validation = SettingsValidationEngine.validate(
    settings,
    visualizationType
  );

  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return null;
  }

  const errorClass = `
    frost-text-sm frost-p-2 frost-rounded frost-mb-2
    ${theme === 'frost_light' ? 'frost-bg-red-50 frost-text-red-700' : 'frost-bg-red-900 frost-text-red-300'}
  `;

  const warningClass = `
    frost-text-sm frost-p-2 frost-rounded frost-mb-2
    ${theme === 'frost_light' ? 'frost-bg-yellow-50 frost-text-yellow-700' : 'frost-bg-yellow-900 frost-text-yellow-300'}
  `;

  return (
    <div className={`settings-validator ${className}`}>
      {/* Errors */}
      {validation.errors.map((error, index) => (
        <div key={`error-${index}`} className={errorClass}>
          <div className='frost-flex frost-items-center frost-gap-2'>
            <span className='frost-text-lg'>❌</span>
            <strong>{error.field}:</strong>
            <span>{error.message}</span>
          </div>
        </div>
      ))}

      {/* Warnings */}
      {validation.warnings.map((warning, index) => (
        <div key={`warning-${index}`} className={warningClass}>
          <div className='frost-flex frost-items-start frost-gap-2'>
            <span className='frost-text-lg frost-mt-0.5'>⚠️</span>
            <div>
              <div>
                <strong>{warning.field}:</strong> {warning.message}
              </div>
              {warning.suggestion && (
                <div className='frost-text-xs frost-mt-1 frost-opacity-80'>
                  💡 {warning.suggestion}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { SettingsValidationEngine };
export default SettingsValidator;
