/**
 * ValidationService - Input validation and sanitization for HAL Builder
 * Ensures data integrity and security for all user inputs
 */

import ValidationMetrics from './validation/ValidationMetrics';
import { ValidationResult } from './validation/validationTypes';

export class ValidationService {
  private metrics = new ValidationMetrics();

  private delegate<T>(
    methodName: string,
    serviceType: string,
    delegateFn: () => T
  ): ValidationResult {
    const timer = this.metrics.begin(`ValidationService.${methodName}`);
    try {
      return delegateFn() as ValidationResult;
    } catch (_e) {
      return {
        isValid: false,
        errors: [`${serviceType} unavailable`],
        warnings: [],
      };
    } finally {
      timer.end();
    }
  }

  validateLayer(layer: any): ValidationResult {
    return this.delegate('validateLayer', 'LayerValidationService', () => {
      const {
        LayerValidationService,
      } = require('./validation/LayerValidationService');
      return new LayerValidationService().validateLayer(layer);
    });
  }

  validateTemplate(template: any): ValidationResult {
    return this.delegate(
      'validateTemplate',
      'TemplateValidationService',
      () => {
        const {
          TemplateValidationService,
        } = require('./validation/TemplateValidationService');
        const result = new TemplateValidationService().validateTemplate(
          template
        );
        return {
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings || [],
          sanitizedValue: result.sanitizedValue,
        };
      }
    );
  }

  validateAudioParams(params: any): ValidationResult {
    return this.delegate(
      'validateAudioParams',
      'AudioValidationService',
      () => {
        const {
          AudioValidationService,
        } = require('./validation/AudioValidationService');
        const audioService = new AudioValidationService();
        if (Array.isArray(params)) {
          const isValid = audioService.validateAudioData(params);
          return {
            isValid,
            errors: isValid ? [] : ['Invalid audio data format'],
            warnings: [],
          };
        }
        return {
          isValid: true,
          errors: [],
          warnings: [],
          sanitizedValue: params,
        };
      }
    );
  }

  validateUIInput(input: any, type: string): ValidationResult {
    return this.delegate('validateUIInput', 'UIValidationService', () => {
      const {
        UIValidationService,
      } = require('./validation/UIValidationService');
      const uiService = new UIValidationService();
      switch (type.toLowerCase()) {
        case 'color':
          return uiService.validateColor(input);
        case 'gradient':
          return uiService.validateGradient(input);
        case 'circle':
          return uiService.validateCircleSettings(input);
        default:
          return {
            isValid: true,
            errors: [],
            warnings: [`Unknown UI input type: ${type}`],
            sanitizedValue: input,
          };
      }
    });
  }

  validateEffect(effect: any): ValidationResult {
    return this.delegate('validateEffect', 'EffectValidationService', () => {
      const {
        EffectValidationService,
      } = require('./validation/EffectValidationService');
      const effectService = new EffectValidationService();
      if (effect?.equalizerSettings) {
        return effectService.validateEqualizerSettings(
          effect.equalizerSettings
        );
      }
      return {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedValue: effect,
      };
    });
  }

  validate(data: any, _rules: any[]): ValidationResult {
    return this.delegate('validate', 'GenericValidation', () => ({
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedValue: data,
    }));
  }

  validateColor(color: string): ValidationResult {
    return this.validateUIInput(color, 'color');
  }

  /**
   * Cross-domain validation convenience wrapper
   */
  validateCrossDomain(payload: any, ctx?: any): ValidationResult {
    return this.delegate(
      'validateCrossDomain',
      'CrossDomainValidationService',
      () => {
        const {
          CrossDomainValidationService,
        } = require('./validation/CrossDomainValidationService');
        return new CrossDomainValidationService().validate(payload, ctx);
      }
    );
  }
}

/**
 * Singleton validation service instance
 */
let validationServiceInstance: ValidationService | null = null;

export const getValidationService = (): ValidationService => {
  if (!validationServiceInstance) {
    validationServiceInstance = new ValidationService();
  }
  return validationServiceInstance;
};

export const disposeValidationService = (): void => {
  validationServiceInstance = null;
};
