import { EffectParameters } from '../IEffect';

export interface ProcessingContext {
  width: number;
  height: number;
  time?: number;
}

export interface IEffectProcessor<
  _P extends EffectParameters = EffectParameters,
> {
  // Implementations expose specific processX methods; this is a marker for typing.
}
