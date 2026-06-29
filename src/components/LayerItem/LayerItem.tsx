import React, { useState, useCallback, memo, useMemo } from 'react';
import { LayerItemProps } from './types';
import { useLayerProperties } from '../../hooks/useLayerProperties';
// TODO: Import these hooks when needed for future expansion
// import { useLayerAnimation } from '../../hooks/useLayerAnimation';
import { useLayerAudio } from '../../hooks/useLayerAudio';
// import { useGradientManagement } from '../../hooks/useGradientManagement';
import { validateLayer } from '../../utils/layer-validation';
import { Layer } from '../../types/layer-types';
import LayerItemView from './LayerItemView';

/**
 * LayerItem - Orchestration Component
 *
 * This component orchestrates the business logic and data flow
 * between hooks and the presentation layer. It handles:
 * - Hook integration and composition
 * - State management and coordination
 * - Event handler creation and binding
 * - Data transformation for presentation layer
 *
 * NO DIRECT UI RENDERING - delegates to LayerItemView
 */
export const LayerItem = memo<LayerItemProps>(
  ({
    layer,
    actualIndex,
    layerCount,
    selectedLayerId,
    updateLayer,
    moveLayer,
    setSelectedLayerId,
    duplicateLayer,
    deleteLayer,
    renameLayer,
    onShapeTypeChange,
    theme,
    onDragStart,
    isDragging = false,
    dragOverIndex = -1,
    onLayerClick,
    isMultiSelected = false,
    isExpanded = false,
    onToggleExpanded,
    groupName,
    onGroupLayers,
    onUngroupLayers,
    onAddLayers,
    layers = [],
  }) => {
    // Local UI state for name editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(layer.name);

    // Hook composition - business logic delegation
    const layerProperties = useLayerProperties({
      layer,
      theme,
      updateLayer,
      ...(onShapeTypeChange && { onShapeTypeChange }),
      ...(onAddLayers && { onAddLayers }),
      ...(layers.length > 0 && { layers }),
    });

    // Additional hooks for expansion
    // TODO: Implement these when needed
    // const gradientManagement = useGradientManagement();
    const audioProcessing = useLayerAudio(layer);
    // const animationSystem = useLayerAnimation(layer, { duration: 2000, keyframes: [], loop: 'none', easing: 'linear' });

    // Validated layer update wrapper
    const handleLayerUpdate = useCallback(
      (updates: Partial<Layer>) => {
        const validatedUpdates = validateLayer(updates);
        updateLayer(layer.id, validatedUpdates);
      },
      [layer.id, updateLayer]
    );

    // Image upload handler with memory management
    const handleImageUpload = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          try {
            const { imageMemoryManager } = await import(
              '../../utils/ImageMemoryManager'
            );
            const optimizedImageUrl = await imageMemoryManager.uploadImage(
              file,
              {
                maxSize: 2048,
                quality: 0.85,
                format: 'webp',
              }
            );
            handleLayerUpdate({ src: optimizedImageUrl });
          } catch (error) {
            console.error('Failed to upload image:', error);
            // Fallback to basic FileReader
            const reader = new FileReader();
            reader.onload = e => {
              handleLayerUpdate({ src: e.target?.result as string });
            };
            reader.readAsDataURL(file);
          }
        }
        event.target.value = '';
      },
      [handleLayerUpdate]
    );

    // =====================================
    // Event Handler Composition
    // =====================================

    // Layer selection and interaction
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onLayerClick) {
          onLayerClick(layer.id, e);
        } else {
          setSelectedLayerId(layer.id);
        }
      },
      [layer.id, onLayerClick, setSelectedLayerId]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left mouse button
        if (onDragStart && !isEditingName) {
          onDragStart(layer, actualIndex, e);
        }
      },
      [layer, actualIndex, onDragStart, isEditingName]
    );

    // Expansion control
    const handleToggleExpanded = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleExpanded) {
          onToggleExpanded(layer.id);
        }
      },
      [layer.id, onToggleExpanded]
    );

    // Name editing handlers
    const handleNameEdit = useCallback(() => {
      setIsEditingName(true);
      setTempName(layer.name);
    }, [layer.name]);

    const handleNameSave = useCallback(() => {
      if (tempName.trim() && tempName !== layer.name) {
        renameLayer(layer.id, tempName.trim());
      }
      setIsEditingName(false);
    }, [layer.id, layer.name, tempName, renameLayer]);

    const handleNameKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleNameSave();
        } else if (e.key === 'Escape') {
          setIsEditingName(false);
          setTempName(layer.name);
        }
      },
      [handleNameSave, layer.name]
    );

    const handleTempNameChange = useCallback((value: string) => {
      setTempName(value);
    }, []);

    // Layer control actions
    const handleVisibilityToggle = useCallback(() => {
      handleLayerUpdate({ visible: !layer.visible });
    }, [layer.visible, handleLayerUpdate]);

    const handleDuplicate = useCallback(() => {
      duplicateLayer(layer.id);
    }, [layer.id, duplicateLayer]);

    const handleMoveUp = useCallback(() => {
      if (actualIndex > 0) {
        moveLayer(layer.id, 'up');
      }
    }, [layer.id, actualIndex, moveLayer]);

    const handleMoveDown = useCallback(() => {
      if (actualIndex < layerCount - 1) {
        moveLayer(layer.id, 'down');
      }
    }, [layer.id, actualIndex, layerCount, moveLayer]);

    const handleDelete = useCallback(() => {
      deleteLayer(layer.id);
    }, [layer.id, deleteLayer]);

    // =====================================
    // State Calculations and Data Preparation
    // =====================================

    // UI state calculations
    const isSelected = selectedLayerId === layer.id;
    const isDraggedOver = dragOverIndex === actualIndex;
    const isAnimating = false; // TODO: Wire up animation state from hooks

    // Prepare all props for presentation layer
    const viewProps = useMemo(
      () => ({
        layer,
        isSelected,
        isMultiSelected,
        isAnimating,
        isDragging,
        isDraggedOver,
        isExpanded,
        isEditingName,
        tempName,
        theme,
        groupName: groupName || undefined,
        audioProcessing, // Pass audio processing data to presentation layer

        // Event handlers
        onClick: handleClick,
        onMouseDown: handleMouseDown,
        onToggleExpanded: handleToggleExpanded,
        onNameEdit: handleNameEdit,
        onNameSave: handleNameSave,
        onNameKeyDown: handleNameKeyDown,
        onTempNameChange: handleTempNameChange,

        // Control props
        actualIndex,
        layerCount,
        onVisibilityToggle: handleVisibilityToggle,
        onImageUpload: handleImageUpload,
        onDuplicate: handleDuplicate,
        onMoveUp: handleMoveUp,
        onMoveDown: handleMoveDown,
        onDelete: handleDelete,
        onGroupLayers,
        onUngroupLayers,
      }),
      [
        layer,
        isSelected,
        isMultiSelected,
        isAnimating,
        isDragging,
        isDraggedOver,
        isExpanded,
        isEditingName,
        tempName,
        theme,
        groupName,
        audioProcessing,
        actualIndex,
        layerCount,
        handleClick,
        handleMouseDown,
        handleToggleExpanded,
        handleNameEdit,
        handleNameSave,
        handleNameKeyDown,
        handleTempNameChange,
        handleVisibilityToggle,
        handleImageUpload,
        handleDuplicate,
        handleMoveUp,
        handleMoveDown,
        handleDelete,
        onGroupLayers,
        onUngroupLayers,
      ]
    );

    // =====================================
    // Render - Pure Delegation
    // =====================================

    return (
      <LayerItemView {...viewProps}>
        {/* Expanded property panel content */}
        {isExpanded && layerProperties.renderPropertyPanel()}
      </LayerItemView>
    );
  },
  (prevProps, nextProps) => {
    // Optimized comparison to prevent unnecessary re-renders
    return (
      prevProps.layer === nextProps.layer &&
      prevProps.actualIndex === nextProps.actualIndex &&
      prevProps.layerCount === nextProps.layerCount &&
      prevProps.selectedLayerId === nextProps.selectedLayerId &&
      prevProps.theme === nextProps.theme &&
      prevProps.isMultiSelected === nextProps.isMultiSelected &&
      prevProps.isDragging === nextProps.isDragging &&
      prevProps.dragOverIndex === nextProps.dragOverIndex &&
      prevProps.isExpanded === nextProps.isExpanded
    );
  }
);

LayerItem.displayName = 'LayerItem';

export default LayerItem;
