import { TemplateValidationError } from '../../utils/templates/templateValidation';
import { templateValidators } from '../validators/templateValidators';

/**
 * TemplateValidationService
 * Now delegates to templateValidators (extracted rule host).
 */
export class TemplateValidationService {
  /** Validate a template object using extracted template rules */
  validateTemplate(template: unknown): TemplateValidationError {
    return templateValidators.validateTemplateStructure(template);
  }
}

export default TemplateValidationService;
