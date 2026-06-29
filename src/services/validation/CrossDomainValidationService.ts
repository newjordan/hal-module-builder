import {
  createValidationContext,
  ValidationContext,
} from './ValidationContext';
import { ValidationResultAggregator } from './ValidationResultAggregator';
import { ValidationResult } from './validationTypes';

// Runtime requires avoid potential cycles with ValidationService consumers
function getServices() {
  const { LayerValidationService } = require('./LayerValidationService');

  const { UIValidationService } = require('./UIValidationService');

  const { EffectValidationService } = require('./EffectValidationService');
  return {
    layer: new LayerValidationService(),
    ui: new UIValidationService(),
    effect: new EffectValidationService(),
  };
}

export interface CrossDomainPayload {
  layer?: unknown;
  equalizerSettings?: unknown;
  ui?: { color?: string; gradient?: any; circleSettings?: any };
}

export class CrossDomainValidationService {
  validate(
    payload: CrossDomainPayload,
    ctx?: ValidationContext
  ): ValidationResult {
    const context = ctx ?? createValidationContext();
    const { layer, ui, effect } = getServices();

    const start = Date.now();
    const results: ValidationResult[] = [];

    if (payload.layer !== undefined) {
      results.push(layer.validateLayer(payload.layer));
    }
    if (payload.equalizerSettings !== undefined) {
      results.push(effect.validateEqualizerSettings(payload.equalizerSettings));
    }
    if (payload.ui?.color !== undefined) {
      results.push(ui.validateColor(payload.ui.color));
    }
    if (payload.ui?.gradient !== undefined) {
      results.push(ui.validateGradient(payload.ui.gradient));
    }
    if (payload.ui?.circleSettings !== undefined) {
      results.push(ui.validateCircleSettings(payload.ui.circleSettings));
    }

    // Aggregate results (backward-compatible ValidationResult shape)
    const aggregated = ValidationResultAggregator.aggregate(results) as any;

    // Attach context and performance metadata (non-breaking extra fields)
    aggregated.context = { correlationId: context.correlationId };
    aggregated.performance = { totalTimeMs: Date.now() - start };

    // Add simple actionable suggestions based on common error patterns
    aggregated.suggestions = buildSuggestions(aggregated.errors || []);

    return aggregated as ValidationResult;
  }
}

function buildSuggestions(errors: string[]): string[] {
  const tips: string[] = [];
  const lower = errors.map(e => e.toLowerCase());
  if (lower.some(e => e.includes('color'))) {
    tips.push(
      'Use a valid hex color like #aabbcc or a CSS rgb/rgba/hsl format.'
    );
  }
  if (lower.some(e => e.includes('gradient'))) {
    tips.push(
      'Ensure gradient has at least 2 colors and matching stops within [0,1].'
    );
  }
  if (lower.some(e => e.includes('equalizer') || e.includes('barcount'))) {
    tips.push(
      'Equalizer: use barCount within supported range and valid color formats.'
    );
  }
  return tips;
}

export default CrossDomainValidationService;
