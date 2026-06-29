/**
 * LayerItem Component - Main Entry Point
 *
 * This file provides backward compatibility and serves as the main entry point
 * for the decomposed LayerItem component system. The actual implementation
 * is now organized in the LayerItem/ directory with proper separation of concerns.
 */

// Export types for TypeScript support
export type {
  LayerItemProps,
  LayerItemViewProps,
  LayerPreviewProps,
  LayerControlsProps,
  LayerControlAction,
  LayerControlActionEvent,
} from './LayerItem/types';

// Import and re-export main component
import LayerItemComponent from './LayerItem/LayerItem';

// Named export
export const LayerItem = LayerItemComponent;

// Default export for backward compatibility
export default LayerItemComponent;
