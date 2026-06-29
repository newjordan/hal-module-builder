/**
 * TypeScript interfaces for TemplateManager components
 *
 * Defines all type interfaces for template management components
 * extracted from HalModuleBuilder.tsx
 */

import { Layer, Preset } from '../../types/layer-types';

/**
 * Props for the main TemplateManager component
 */
export interface TemplateManagerProps {
  /** Array of available presets/templates */
  presets: Preset[];
  /** Current layers to save as template */
  layers: Layer[];
  /** Current preset name for saving */
  presetName: string;
  /** Callback when preset name changes */
  onPresetNameChange: (name: string) => void;
  /** Callback to save a new preset */
  onSavePreset: (name: string) => void;
  /** Callback to load a preset */
  onLoadPreset: (preset: Preset) => void;
  /** Callback to delete a preset */
  onDeletePreset: (presetId: string) => void;
  /** Callback to export a preset */
  onExportPreset: (preset: Preset) => void;
  /** Callback to import presets from file */
  onImportPreset: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether template operations are disabled */
  disabled?: boolean;
  /** Custom CSS class name */
  className?: string;
}

/**
 * Props for the TemplateSaveDialog component
 */
export interface TemplateSaveDialogProps {
  /** Current preset name */
  presetName: string;
  /** Current layers to save */
  layers: Layer[];
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Whether save operation is in progress */
  isSaving?: boolean;
  /** Callback when preset name changes */
  onPresetNameChange: (name: string) => void;
  /** Callback to save preset */
  onSave: (name: string) => void;
  /** Callback to close dialog */
  onClose: () => void;
  /** Callback when dialog opens */
  onOpen?: () => void;
  /** Custom validation function */
  validateName?: (name: string) => string | null;
}

/**
 * Props for the TemplateLoadDialog component
 */
export interface TemplateLoadDialogProps {
  /** Array of available presets */
  presets: Preset[];
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Whether load operation is in progress */
  isLoading?: boolean;
  /** Callback to load a preset */
  onLoad: (preset: Preset) => void;
  /** Callback to delete a preset */
  onDelete: (presetId: string) => void;
  /** Callback to export a preset */
  onExport: (preset: Preset) => void;
  /** Callback to import presets */
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback to close dialog */
  onClose: () => void;
  /** Callback when dialog opens */
  onOpen?: () => void;
  /** Whether to show advanced options (delete, export) */
  showAdvancedOptions?: boolean;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  /** Whether template is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Validated preset data */
  preset?: Preset;
}

/**
 * Template save options
 */
export interface TemplateSaveOptions {
  /** Whether to create a backup before saving */
  createBackup?: boolean;
  /** Whether to validate before saving */
  validate?: boolean;
  /** Custom timestamp for the preset */
  timestamp?: number;
}

/**
 * Template load options
 */
export interface TemplateLoadOptions {
  /** Whether to merge with existing layers */
  merge?: boolean;
  /** Whether to validate before loading */
  validate?: boolean;
  /** Custom layer ID mapping */
  layerIdMapping?: Record<string, string>;
}

/**
 * Template export options
 */
export interface TemplateExportOptions {
  /** File format for export */
  format?: 'json' | 'yaml';
  /** Whether to include metadata */
  includeMetadata?: boolean;
  /** Custom filename */
  filename?: string;
}

/**
 * Template statistics
 */
export interface TemplateStats {
  /** Total number of presets */
  totalPresets: number;
  /** Number of layers in current preset */
  layerCount: number;
  /** Estimated file size in bytes */
  estimatedSize: number;
  /** Last save timestamp */
  lastSaved?: number;
  /** Most recently used preset */
  recentPreset?: Preset;
}

/**
 * Template manager configuration
 */
export interface TemplateManagerConfig {
  /** Maximum number of presets to keep */
  maxPresets?: number;
  /** Whether to enable auto-save */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Storage key prefix for localStorage */
  storageKeyPrefix?: string;
  /** Whether to enable template validation */
  enableValidation?: boolean;
}
