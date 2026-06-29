# HAL Builder Type System Architecture

**Last Updated:** September 2, 2025  
**Version:** 1.0  
**Status:** Production Implementation Guide

---

## Overview

HAL Builder implements a comprehensive TypeScript type system that ensures type safety across all application components while maintaining performance and developer productivity. This document details the type architecture, patterns, and best practices that govern the codebase.

---

## Core Type Architecture

### Central Type Organization

```
src/types/
├── index.ts           # Main type exports and coordination
├── layer-types.ts     # Layer system types
└── [future modules]   # Extension points for new type modules
```

**Design Philosophy:** Centralized type definitions with logical module separation for maintainability and discoverability.

### Type Definition Hierarchy

```typescript
// Primary type flow
Layer → Template → AppState → Components
  ↓         ↓         ↓         ↓
Audio  →  Theme  →  Performance → UI
```

---

## Layer Type System (layer-types.ts)

### Core Layer Interface

The `Layer` interface serves as the foundation for all visual elements:

```typescript
interface Layer {
  // Identity & State
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  type: LayerType;               // Determines rendering behavior
  visible: boolean;              // Visibility state
  locked?: boolean;              // Edit protection
  groupId?: string;              // Group membership

  // Transform Properties
  opacity: number;               // 0.0-1.0 transparency
  blendMode: string;             // CSS blend mode
  scale: number;                 // Uniform scale factor
  rotation: number;              // Degrees rotation
  offsetX: number;               // X position offset
  offsetY: number;               // Y position offset

  // Visual Properties
  color?: string;                // Primary color
  brightness?: number;           // Brightness adjustment
  contrast?: number;             // Contrast adjustment

  // Type-Specific Configurations
  gradient?: GradientConfig;     // Legacy gradient support
  equalizerSettings?: EqualizerConfig;
  circleSettings?: CircleConfig;
  shapeSpecific?: Record<string, any>;
}
```

### Layer Type Discrimination

```typescript
// Precise type discrimination using literal union
type LayerType = 'image' | 'gradient' | 'solid' | 'effect' | 'equalizer' | 'shape';

// Type guards for runtime checking
const isEqualizerLayer = (layer: Layer): layer is Layer & { type: 'effect' } => {
  return layer.type === 'effect' && layer.equalizerSettings !== undefined;
};

const isImageLayer = (layer: Layer): layer is Layer & { type: 'image' } => {
  return layer.type === 'image' && layer.src !== undefined;
};
```

### Complex Configuration Types

#### Equalizer Settings
```typescript
interface EqualizerSettings {
  // Visualization Parameters
  barCount: number;              // 32-128 frequency bars
  barStyle: BarStyle;            // Visual representation
  barWidth: number;              // Pixel width
  barSpacing: number;            // Gap between bars
  
  // Layout Configuration
  innerRadius: number;           // For circular layouts
  maxHeight: number;             // Maximum bar height
  startAngle: number;            // Layout start position
  endAngle: number;              // Layout end position
  arcMode: boolean;              // Circular vs linear
  
  // Color Configuration
  colorMode: ColorMode;          // Solid, gradient, reactive
  primaryColor: string;          // Base color
  secondaryColor: string;        // Gradient endpoint
  customGradient?: GradientStop[];
  
  // Audio Processing
  frequencyRange: FrequencyRange; // Audio spectrum section
  responseSpeed: number;         // Animation responsiveness
  
  // Effects
  glowIntensity: number;         // Glow effect strength
  glowColor?: string;            // Glow color override
  symmetry: SymmetryMode;        // Mirroring patterns
  pulseMode: PulseMode;          // Animation intensity
}
```

---

## Application-Level Types (index.ts)

### Theme System Types

```typescript
// Theme configuration
interface Theme {
  id: string;                    // 'frost_light' | 'frost_dark'
  name: string;                  // Display name
  cssVars: Record<string, string>; // CSS custom properties
  isDark: boolean;               // Dark mode flag
}

// Type-safe theme name constraint
type ThemeName = 'frost_light' | 'frost_dark';
```

### Template System Types

```typescript
// Complete project configuration
interface Template {
  id: string;                    // Unique identifier
  name: string;                  // Template name
  description?: string;          // Optional description
  thumbnail?: string;            // Base64 preview image
  layers: Layer[];               // Layer configuration
  groups?: LayerGroup[];         // Organizational groups
  metadata: TemplateMetadata;    // Classification info
  createdAt: number;             // Creation timestamp
  updatedAt: number;             // Modification timestamp
}

// Template categorization
interface TemplateMetadata {
  version: string;               // Semantic version
  author?: string;               // Creator name
  category?: string;             // Template category
  tags: string[];                // Search tags
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

### Audio Processing Types

```typescript
// Web Audio API configuration
interface AudioConfig {
  sampleRate: number;            // Audio sample rate (44100/48000)
  bufferSize: number;            // Processing buffer size
  fftSize: number;               // FFT analysis size
  smoothingTimeConstant: number; // Frequency smoothing (0.0-1.0)
  minDecibels: number;           // Analysis floor
  maxDecibels: number;           // Analysis ceiling
}

// Real-time audio data
interface AudioData {
  frequencyData: Uint8Array;     // Frequency domain (0-255)
  timeData: Uint8Array;          // Time domain waveform
  sampleRate: number;            // Current sample rate
  timestamp: number;             // Capture timestamp
}
```

### Performance Monitoring Types

```typescript
// Runtime performance metrics
interface PerformanceMetrics {
  fps: number;                   // Current frame rate
  frameTime: number;             // Frame duration (ms)
  renderTime: number;            // Render phase duration (ms)
  memoryUsage: number;           // Heap usage (MB)
  timestamp: number;             // Measurement timestamp
}

// Performance threshold configuration
interface PerformanceThresholds {
  minFps: number;                // Minimum acceptable FPS
  maxFrameTime: number;          // Maximum frame duration
  maxRenderTime: number;         // Maximum render time
  maxMemoryUsage: number;        // Memory usage limit
}
```

---

## Type System Patterns

### Type-Safe Updates with Partial Types

```typescript
// Layer update pattern using Partial<T>
const updateLayer = (
  layers: Layer[], 
  layerId: string, 
  updates: Partial<Layer>
): Layer[] => {
  return layers.map(layer => 
    layer.id === layerId 
      ? { ...layer, ...updates }
      : layer
  );
};

// Usage with type safety
updateLayer(layers, 'layer_001', {
  opacity: 0.5,        // ✅ Valid Layer property
  scale: 1.2,          // ✅ Valid Layer property
  // invalidProp: true // ❌ TypeScript error
});
```

### Discriminated Unions for Layer Types

```typescript
// Type-safe layer processing
const renderLayer = (layer: Layer, ctx: CanvasRenderingContext2D): void => {
  switch (layer.type) {
    case 'image':
      // TypeScript knows layer.src might exist
      if (layer.src) {
        renderImage(ctx, layer);
      }
      break;
    
    case 'effect':
      // TypeScript knows layer.equalizerSettings might exist
      if (layer.equalizerSettings) {
        renderEqualizer(ctx, layer, layer.equalizerSettings);
      }
      break;
    
    case 'solid':
      // TypeScript knows layer.color might exist
      if (layer.color) {
        renderSolidColor(ctx, layer, layer.color);
      }
      break;
    
    default:
      // TypeScript ensures all cases are handled
      const _exhaustiveCheck: never = layer.type;
  }
};
```

### Generic Utility Types

```typescript
// Deep partial for nested configuration updates
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Usage for complex configuration updates
const updateEqualizerSettings = (
  layer: Layer,
  updates: DeepPartial<EqualizerSettings>
): Layer => {
  if (layer.type === 'effect' && layer.equalizerSettings) {
    return {
      ...layer,
      equalizerSettings: {
        ...layer.equalizerSettings,
        ...updates,
        // Nested merging handled by utility function
      }
    };
  }
  return layer;
};

// Making specific keys required
type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Layer creation with required fields
type LayerCreation = RequiredKeys<Partial<Layer>, 'id' | 'name' | 'type'>;
```

### Runtime Type Validation

```typescript
// Type guard functions for runtime validation
const isValidLayerType = (type: string): type is LayerType => {
  return ['image', 'gradient', 'solid', 'effect', 'equalizer', 'shape'].includes(type);
};

const validateLayerProps = (data: unknown): data is Layer => {
  if (typeof data !== 'object' || data === null) return false;
  
  const layer = data as Record<string, unknown>;
  
  return (
    typeof layer.id === 'string' &&
    typeof layer.name === 'string' &&
    isValidLayerType(layer.type as string) &&
    typeof layer.visible === 'boolean' &&
    typeof layer.opacity === 'number' &&
    layer.opacity >= 0 && layer.opacity <= 1
  );
};
```

---

## Component Type Integration

### React Component Props with Type Safety

```typescript
// Base component props with common properties
interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

// Layer-specific component props
interface LayerItemProps extends BaseComponentProps {
  layer: Layer;                  // Strongly typed layer
  theme: ThemeName;              // Restricted theme options
  selectedLayerId: string;       // Current selection
  onUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onDelete: (layerId: string) => void;
  onDuplicate: (layerId: string) => void;
}

// Component with full type safety
const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  theme,
  selectedLayerId,
  onUpdate,
  onDelete,
  onDuplicate,
  ...baseProps
}) => {
  // TypeScript ensures all props are properly typed
  const handleOpacityChange = (opacity: number) => {
    onUpdate(layer.id, { opacity }); // Type-safe partial update
  };
  
  return (
    <div {...baseProps} data-testid={`layer-${layer.id}`}>
      {/* Component implementation with type safety */}
    </div>
  );
};
```

### Hook Type Patterns

```typescript
// Custom hook with typed return values
interface UseLayerManagementReturn {
  layers: Layer[];
  selectedIds: string[];
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;
}

const useLayerManagement = (): UseLayerManagementReturn => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);
  
  // Additional methods with full type safety...
  
  return {
    layers,
    selectedIds,
    updateLayer,
    deleteLayer,
    duplicateLayer,
    reorderLayers
  };
};
```

---

## Error Handling Types

### Application Error Types

```typescript
// Enhanced error with context
interface AppError extends Error {
  code?: string;                 // Error categorization
  context?: Record<string, unknown>; // Debug information
  timestamp: number;             // Error occurrence time
}

// React Error Boundary information
interface ErrorInfo {
  componentStack: string;        // React stack trace
  errorBoundary?: string;        // Boundary component name
}

// Type-safe error creation
const createLayerError = (
  message: string, 
  layerId: string, 
  operation: string
): AppError => ({
  name: 'LayerProcessingError',
  message,
  code: 'LAYER_UPDATE_FAILED',
  context: { layerId, operation },
  timestamp: Date.now()
});
```

---

## Type System Best Practices

### 1. Interface Design Principles

```typescript
// ✅ Good: Specific, composable interfaces
interface LayerTransform {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

interface LayerVisual {
  opacity: number;
  blendMode: string;
  visible: boolean;
}

interface Layer extends LayerTransform, LayerVisual {
  id: string;
  name: string;
  type: LayerType;
}

// ❌ Avoid: Overly broad or loosely typed interfaces
interface Layer {
  [key: string]: any; // Loses type safety benefits
}
```

### 2. Union Type Handling

```typescript
// ✅ Good: Exhaustive switch with never check
const processLayer = (layer: Layer): ProcessResult => {
  switch (layer.type) {
    case 'image': return processImage(layer);
    case 'effect': return processEffect(layer);
    case 'solid': return processSolid(layer);
    case 'gradient': return processGradient(layer);
    case 'equalizer': return processEqualizer(layer);
    case 'shape': return processShape(layer);
    default:
      // Ensures all cases are handled
      const _exhaustiveCheck: never = layer.type;
      throw new Error(`Unhandled layer type: ${_exhaustiveCheck}`);
  }
};
```

### 3. Generic Type Constraints

```typescript
// ✅ Good: Constrained generics for type safety
const updateLayerProperty = <T extends keyof Layer>(
  layer: Layer,
  property: T,
  value: Layer[T]
): Layer => {
  return { ...layer, [property]: value };
};

// Usage is type-safe
updateLayerProperty(layer, 'opacity', 0.5);     // ✅ Valid
updateLayerProperty(layer, 'opacity', 'invalid'); // ❌ TypeScript error
```

### 4. Async Type Safety

```typescript
// ✅ Good: Properly typed async operations
const saveTemplate = async (template: Template): Promise<Template> => {
  try {
    const validatedTemplate = validateTemplate(template);
    const savedTemplate = await templateStorage.save(validatedTemplate);
    return savedTemplate;
  } catch (error) {
    throw createAppError('Template save failed', error);
  }
};

// Type-safe error handling
const handleTemplateSave = async (template: Template): Promise<void> => {
  try {
    const result = await saveTemplate(template);
    console.log('Template saved:', result.id);
  } catch (error) {
    if (error instanceof AppError) {
      // Type-safe error handling
      console.error('Save failed:', error.message, error.context);
    } else {
      console.error('Unexpected error:', error);
    }
  }
};
```

---

## Integration with Build System

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checking
    "noImplicitAny": true,            // Require explicit types
    "strictNullChecks": true,         // Null/undefined safety
    "strictFunctionTypes": true,      // Function parameter checking
    "noImplicitReturns": true,        // Require return statements
    "noFallthroughCasesInSwitch": true // Switch statement completeness
  }
}
```

### Development Workflow Integration

```typescript
// Development-time type checking
interface DevModeTypeChecker {
  validateLayerConfig: (layer: unknown) => layer is Layer;
  validateTemplateData: (template: unknown) => template is Template;
  checkPerformanceMetrics: (metrics: unknown) => metrics is PerformanceMetrics;
}

// Production runtime safety (minimal overhead)
const isValidLayer = (data: unknown): data is Layer => {
  // Minimal runtime checks for production
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data
  );
};
```

---

## Documentation Standards

### JSDoc Type Annotations

```typescript
/**
 * Updates multiple layer properties atomically with type safety
 * 
 * @template T - Layer property keys to update
 * @param layer - The layer to update
 * @param updates - Partial updates to apply
 * @returns New layer instance with updates applied
 * 
 * @example
 * ```typescript
 * const updatedLayer = updateLayerProperties(layer, {
 *   opacity: 0.8,
 *   scale: 1.2
 * });
 * ```
 */
const updateLayerProperties = <T extends Partial<Layer>>(
  layer: Layer,
  updates: T
): Layer => {
  return { ...layer, ...updates };
};
```

### Type-Driven API Documentation

```typescript
/**
 * @fileoverview Layer Management API
 * 
 * This module provides type-safe layer manipulation functions that maintain
 * the integrity of the layer system while providing maximum flexibility
 * for layer property updates.
 * 
 * Key type safety features:
 * - Compile-time property validation
 * - Runtime type guards for external data
 * - Exhaustive union type handling
 * - Generic constraints for property updates
 */

// Interface definitions serve as API contract documentation
export interface LayerAPI {
  create: (config: LayerCreation) => Layer;
  update: (id: string, updates: Partial<Layer>) => Layer;
  delete: (id: string) => boolean;
  duplicate: (id: string) => Layer;
  reorder: (fromIndex: number, toIndex: number) => Layer[];
}
```

---

## Performance Considerations

### Type System Performance Impact

**Compile Time:** Type checking adds ~2-3 seconds to build time but provides enormous development benefits through error prevention and IntelliSense.

**Runtime Impact:** Zero - TypeScript types are completely erased during compilation, resulting in no runtime performance overhead.

**Bundle Size:** No impact - type definitions don't appear in production bundles.

### Memory-Efficient Type Patterns

```typescript
// ✅ Good: Shared type instances
const LAYER_DEFAULTS: Readonly<Partial<Layer>> = {
  opacity: 1.0,
  scale: 1.0,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  visible: true
} as const;

// ❌ Avoid: Creating new type objects repeatedly
const createLayer = (): Layer => ({
  // Don't inline defaults repeatedly
});
```

---

**Type System Philosophy:** The HAL Builder type system prioritizes developer experience and runtime safety through comprehensive TypeScript integration. Every interface serves dual purposes: compile-time safety and runtime documentation, ensuring that the codebase remains maintainable as it scales.