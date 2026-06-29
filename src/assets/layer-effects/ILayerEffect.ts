import { IEffect, EffectParameters } from '../effects/IEffect';

/**
 * Extended effect interface for layer effects
 * Inherits from base IEffect system
 */
export interface ILayerEffect extends IEffect {
  /** Effect applies to entire layer (not just canvas content) */
  readonly appliesToLayer: true;

  /** Whether effect expands layer bounds (shadows, glows) */
  readonly expandsBounds: boolean;

  /** Calculate additional bounds needed for effect */
  calculateBoundsExpansion(params: EffectParameters): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}