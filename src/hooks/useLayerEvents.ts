import { useCallback, useRef } from 'react';
import { Layer } from '../types/layer-types';

interface UseLayerEventsProps {
  layer: Layer;
  actualIndex: number;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  renameLayer: (layerId: string, newName: string) => void;
  onDragStart?: (layer: Layer, index: number, event: React.MouseEvent) => void;
  onLayerClick?: (layerId: string, event: React.MouseEvent) => void;
  onToggleExpanded?: (layerId: string) => void;
  isEditingName: boolean;
  setIsEditingName: (editing: boolean) => void;
  tempName: string;
  setTempName: (name: string) => void;
}

interface UseLayerEventsReturn {
  // File operations
  handleImageUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;

  // Layer state management
  handleVisibilityToggle: () => void;
  handleNameEdit: () => void;
  handleNameSave: () => void;
  handleNameKeyDown: (e: React.KeyboardEvent) => void;

  // Interaction events
  handleClick: (e: React.MouseEvent) => void;
  handleToggleExpanded: (e: React.MouseEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Hook for managing layer event handlers
 * Provides complete event handling separation with optimized performance
 *
 * Features:
 * - Image upload with memory management and WebP optimization
 * - Layer visibility toggling
 * - Inline name editing with keyboard shortcuts
 * - Click and drag interaction handling
 * - Layer expansion/collapse state management
 *
 * @param props - Event handling configuration
 * @returns Memoized event callbacks and refs
 */
export const useLayerEvents = ({
  layer,
  actualIndex,
  updateLayer,
  renameLayer,
  onDragStart,
  onLayerClick,
  onToggleExpanded,
  isEditingName,
  setIsEditingName,
  tempName,
  setTempName,
}: UseLayerEventsProps): UseLayerEventsReturn => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image upload handler with memory management (extracted from LayerItem)
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        try {
          const { imageMemoryManager } = await import(
            '../utils/ImageMemoryManager'
          );
          const optimizedImageUrl = await imageMemoryManager.uploadImage(file, {
            maxSize: 2048,
            quality: 0.85,
            format: 'webp',
          });
          updateLayer(layer.id, { src: optimizedImageUrl });
        } catch (error) {
          console.error('Failed to upload image:', error);
          // Fallback to basic FileReader
          const reader = new FileReader();
          reader.onload = e => {
            updateLayer(layer.id, { src: e.target?.result as string });
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [layer.id, updateLayer]
  );

  // Layer visibility toggle handler
  const handleVisibilityToggle = useCallback(() => {
    updateLayer(layer.id, { visible: !layer.visible });
  }, [layer.id, layer.visible, updateLayer]);

  // Layer name editing handlers
  const handleNameEdit = useCallback(() => {
    setIsEditingName(true);
    setTempName(layer.name);
  }, [layer.name, setIsEditingName, setTempName]);

  const handleNameSave = useCallback(() => {
    if (tempName.trim()) {
      renameLayer(layer.id, tempName.trim());
    }
    setIsEditingName(false);
  }, [layer.id, tempName, renameLayer, setIsEditingName]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNameSave();
      } else if (e.key === 'Escape') {
        setIsEditingName(false);
        setTempName(layer.name);
      }
    },
    [handleNameSave, setIsEditingName, setTempName, layer.name]
  );

  // Layer interaction handlers
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onLayerClick) {
        onLayerClick(layer.id, e);
      }
    },
    [layer.id, onLayerClick]
  );

  const handleToggleExpanded = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onToggleExpanded) {
        onToggleExpanded(layer.id);
      }
    },
    [layer.id, onToggleExpanded]
  );

  // Drag handling for layer reordering
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left mouse button
      if (onDragStart && !isEditingName) {
        onDragStart(layer, actualIndex, e);
      }
    },
    [layer, actualIndex, onDragStart, isEditingName]
  );

  return {
    handleImageUpload,
    fileInputRef,
    handleVisibilityToggle,
    handleNameEdit,
    handleNameSave,
    handleNameKeyDown,
    handleClick,
    handleToggleExpanded,
    handleMouseDown,
  };
};
