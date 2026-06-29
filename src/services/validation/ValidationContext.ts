/*
 * ValidationContext: shared cross-domain validation context and helpers.
 */

export interface ValidationContext {
  correlationId?: string;
  // free-form bag for cross-domain data sharing (avoid heavy coupling)
  bag?: Record<string, unknown>;
}

export function createValidationContext(
  partial?: ValidationContext
): ValidationContext {
  return { correlationId: randomId(), bag: {}, ...(partial ?? {}) };
}

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
