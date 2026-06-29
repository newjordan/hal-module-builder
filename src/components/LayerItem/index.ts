/**
 * LayerItem Component Exports
 *
 * Organized exports for the decomposed LayerItem component system.
 * Main orchestration component and all sub-components available.
 */

// Main orchestration component
export { default as LayerItem } from './LayerItem';
export { default } from './LayerItem';

// Individual presentation components
export { default as LayerItemView } from './LayerItemView';
export { default as LayerPreview } from './LayerPreview';
export { default as LayerControls } from './LayerControls';

// TypeScript interfaces and types
export type {
  LayerItemProps,
  LayerItemViewProps,
  LayerPreviewProps,
  LayerControlsProps,
  LayerControlAction,
  LayerControlActionEvent,
} from './types';

// Re-export for backward compatibility
export type { Layer } from '../../types/layer-types';
