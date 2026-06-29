import React from 'react';
import { Layer } from '../../types/layer-types';

/**
 * Props for LayerItemView - Pure presentation component
 */
export interface LayerItemViewProps {
  layer: Layer;
  isSelected: boolean;
  isMultiSelected: boolean;
  isAnimating: boolean;
  isDragging: boolean;
  isDraggedOver: boolean;
  isExpanded: boolean;
  isEditingName: boolean;
  tempName: string;
  theme: string;
  groupName: string | undefined;
  preview?: string;
  children?: React.ReactNode;

  // Control props
  actualIndex: number;
  layerCount: number;

  // Event handlers
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onToggleExpanded: (e: React.MouseEvent) => void;
  onNameEdit: () => void;
  onNameSave: () => void;
  onNameKeyDown: (e: React.KeyboardEvent) => void;
  onTempNameChange: (value: string) => void;

  // Control event handlers
  onVisibilityToggle: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onGroupLayers: ((layerIds: string[]) => void) | undefined;
  onUngroupLayers: ((layerIds: string[]) => void) | undefined;
}

/**
 * Props for LayerControls - Interactive controls component
 */
export interface LayerControlsProps {
  layer: Layer;
  theme: string;
  actualIndex: number;
  layerCount: number;
  groupName: string | undefined;

  // Event handlers
  onVisibilityToggle: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onGroupLayers: ((layerIds: string[]) => void) | undefined;
  onUngroupLayers: ((layerIds: string[]) => void) | undefined;
}

/**
 * Props for LayerPreview - Visual thumbnail component
 */
export interface LayerPreviewProps {
  layer: Layer;
  theme: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Main LayerItem orchestration component props
 */
export interface LayerItemProps {
  layer: Layer;
  actualIndex: number;
  layerCount: number;
  selectedLayerId: string;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  setSelectedLayerId: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  renameLayer: (layerId: string, newName: string) => void;
  onShapeTypeChange?: (layerId: string, newShapeType: string) => void;
  theme: string;
  onDragStart?: (layer: Layer, index: number, event: React.MouseEvent) => void;
  isDragging?: boolean;
  dragOverIndex?: number;
  onLayerClick?: (layerId: string, event: React.MouseEvent) => void;
  isMultiSelected?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: (layerId: string) => void;
  groupName: string | undefined;
  onGroupLayers: ((layerIds: string[]) => void) | undefined;
  onUngroupLayers: ((layerIds: string[]) => void) | undefined;

  // Backward compatibility - gradient management props
  addGradientColor?: (layerId: string) => void;
  removeGradientColor?: (layerId: string, index: number) => void;
  updateGradientColor?: (layerId: string, index: number, color: string) => void;
  updateGradientStop?: (layerId: string, index: number, stop: any) => void;

  // Animation system props
  onAddLayers?: (layers: Layer[]) => void;

  // All layers for audio reactivity
  layers?: Layer[];
}

/**
 * Control action types for event handling
 */
export type LayerControlAction =
  | 'toggleVisibility'
  | 'uploadImage'
  | 'duplicate'
  | 'moveUp'
  | 'moveDown'
  | 'delete'
  | 'group'
  | 'ungroup';

/**
 * Control action event data
 */
export interface LayerControlActionEvent {
  action: LayerControlAction;
  layerId: string;
  data?: any;
}
