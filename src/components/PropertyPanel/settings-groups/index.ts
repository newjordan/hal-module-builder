/**
 * Setting Groups - Layer 2 of the SRP Reactive UI Architecture
 *
 * These components compose atomic controls into logical groups:
 * - Each group manages a cohesive set of related settings
 * - Groups can be shown/hidden based on context
 * - Reusable across different visualization types
 */

export { ColorSettings } from './ColorSettings';
export type { ColorSettingsProps } from './ColorSettings';

export { AnimationSettings } from './AnimationSettings';
export type { AnimationSettingsProps } from './AnimationSettings';

export { SpatialSettings } from './SpatialSettings';
export type { SpatialSettingsProps } from './SpatialSettings';

export { FrequencySettings } from './FrequencySettings';
export type { FrequencySettingsProps } from './FrequencySettings';

export { EffectsSettings } from './EffectsSettings';
export type { EffectsSettingsProps } from './EffectsSettings';

export { RadialSettings } from './RadialSettings';
export type { RadialSettingsProps } from './RadialSettings';
