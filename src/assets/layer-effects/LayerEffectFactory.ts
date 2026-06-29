import { ILayerEffect } from './ILayerEffect';
import { OuterShadowEffect } from './OuterShadowEffect';
import { InnerShadowEffect } from './InnerShadowEffect';
import { OuterGlowEffect } from './OuterGlowEffect';
import { InnerGlowEffect } from './InnerGlowEffect';
import { StrokeEffect } from './StrokeEffect';
import { BlurEffect } from './BlurEffect';
import type { LayerEffectType } from '../../types/layer-types';

export class LayerEffectFactory {
  private static instances = new Map<LayerEffectType, ILayerEffect>();

  /**
   * Get singleton instance of effect by type
   */
  static getEffect(type: LayerEffectType): ILayerEffect {
    if (!this.instances.has(type)) {
      const effect = this.createEffect(type);
      this.instances.set(type, effect);
    }
    return this.instances.get(type)!;
  }

  /**
   * Create new effect instance
   */
  private static createEffect(type: LayerEffectType): ILayerEffect {
    switch (type) {
      case 'outer-shadow':
        return new OuterShadowEffect();
      case 'inner-shadow':
        return new InnerShadowEffect();
      case 'outer-glow':
        return new OuterGlowEffect();
      case 'inner-glow':
        return new InnerGlowEffect();
      case 'stroke':
        return new StrokeEffect();
      case 'blur':
        return new BlurEffect();
      default:
        throw new Error(`Unknown layer effect type: ${type}`);
    }
  }

  /**
   * Get all available effect types with metadata
   */
  static getAvailableEffects(): Array<{ type: LayerEffectType; metadata: any }> {
    const types: LayerEffectType[] = [
      'outer-shadow',
      'inner-shadow',
      'outer-glow',
      'inner-glow',
      'stroke',
      'blur'
    ];

    return types.map(type => ({
      type,
      metadata: this.getEffect(type).metadata
    }));
  }
}