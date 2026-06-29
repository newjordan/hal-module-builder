// Component-specific prop types and interfaces

import { ReactNode } from 'react';
import {
  BaseComponentProps,
  Layer,
  LayerGroup,
  Template,
  PerformanceMetrics,
} from './index';

// HalModuleBuilder types
export interface HalModuleBuilderProps extends BaseComponentProps {
  initialLayers?: Layer[];
  onLayersChange?: (layers: Layer[]) => void;
  onError?: (error: Error) => void;
}

// Layer management component types
export interface LayerManagerProps extends BaseComponentProps {
  layers: Layer[];
  groups: LayerGroup[];
  selectedLayerIds: string[];
  onLayerSelect: (layerId: string) => void;
  onLayerMultiSelect: (layerIds: string[]) => void;
  onLayerReorder: (layerIds: string[]) => void;
  onLayerGroupCreate: (layerIds: string[]) => void;
  onLayerGroupRemove: (groupId: string) => void;
}

export interface LayerItemProps extends BaseComponentProps {
  layer: Layer;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onDelete: (layerId: string) => void;
  onDuplicate: (layerId: string) => void;
}

// Property panel types
export interface PropertyPanelProps extends BaseComponentProps {
  selectedLayers: Layer[];
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onBulkUpdate: (layerIds: string[], updates: Partial<Layer>) => void;
}

export interface PropertyRowProps extends BaseComponentProps {
  label: string;
  children: ReactNode;
  helpText?: string;
  disabled?: boolean;
}

export interface PropertySectionProps extends BaseComponentProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Template management types
export interface TemplateManagerProps extends BaseComponentProps {
  templates: Template[];
  onTemplateLoad: (template: Template) => void;
  onTemplateSave: (
    template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  onTemplateDelete: (templateId: string) => void;
}

export interface TemplateListProps extends BaseComponentProps {
  templates: Template[];
  selectedTemplateId?: string;
  onTemplateSelect: (templateId: string) => void;
  onTemplateLoad: (templateId: string) => void;
  onTemplateDelete: (templateId: string) => void;
}

export interface SaveTemplateDialogProps extends BaseComponentProps {
  isOpen: boolean;
  layers: Layer[];
  groups: LayerGroup[];
  onSave: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

// Performance monitoring types
export interface PerformanceMonitorProps extends BaseComponentProps {
  metrics: PerformanceMetrics;
  showDetails?: boolean;
  alertThreshold?: number;
}

// Audio processor types
export interface AudioProcessorProps extends BaseComponentProps {
  isEnabled: boolean;
  onAudioData: (data: Float32Array) => void;
  onError: (error: Error) => void;
}

// Animation engine types
export interface AnimationEngineProps extends BaseComponentProps {
  layers: Layer[];
  isPlaying: boolean;
  audioData?: Float32Array;
  onRenderComplete: () => void;
}

// Theme manager types
export interface ThemeManagerProps extends BaseComponentProps {
  currentTheme: string;
  onThemeChange: (themeName: string) => void;
}

// Error boundary types
export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}
