# HAL Builder API Reference

**Last Updated:** September 2, 2025  
**Version:** 1.0  
**Coverage:** Complete API documentation for HAL Builder components, hooks, and utilities

---

## Overview

This directory contains comprehensive API documentation for HAL Builder's public interfaces. The documentation is organized by module type and includes TypeScript definitions, usage examples, and implementation notes.

---

## API Documentation Structure

```
docs/api/
├── README.md                    # This overview
├── components/                  # React component APIs
│   ├── HalModuleBuilder.md     # Main application component
│   ├── LayerManager.md         # Layer management components
│   └── PropertyPanel.md        # Property editing components
├── hooks/                       # Custom React hooks APIs
│   ├── useAudio.md            # Audio processing hooks
│   ├── useLayer.md            # Layer management hooks
│   └── usePerformance.md      # Performance monitoring hooks
├── services/                    # Service layer APIs
│   ├── AudioService.md        # Audio processing service
│   ├── RenderService.md       # Canvas rendering service
│   └── StorageService.md      # Template storage service
├── utils/                       # Utility function APIs
│   ├── layer-utils.md         # Layer manipulation utilities
│   ├── audio-utils.md         # Audio processing utilities
│   └── performance-utils.md   # Performance utilities
└── types/                       # Type definition references
    ├── Layer.md               # Layer type definitions
    ├── Audio.md              # Audio-related types
    └── Performance.md        # Performance monitoring types
```

---

## Quick Reference

### Core Components

| Component | Purpose | API Reference |
|-----------|---------|---------------|
| `HalModuleBuilder` | Main application component | [API](./components/HalModuleBuilder.md) |
| `LayerManager` | Layer list and controls | [API](./components/LayerManager.md) |
| `PropertyPanel` | Layer property editing | [API](./components/PropertyPanel.md) |

### Essential Hooks

| Hook | Purpose | API Reference |
|------|---------|---------------|
| `useAudio` | Audio processing and analysis | [API](./hooks/useAudio.md) |
| `useLayer` | Layer state management | [API](./hooks/useLayer.md) |
| `usePerformance` | Performance monitoring | [API](./hooks/usePerformance.md) |

### Key Services

| Service | Purpose | API Reference |
|---------|---------|---------------|
| `AudioService` | Web Audio API management | [API](./services/AudioService.md) |
| `RenderService` | Canvas rendering engine | [API](./services/RenderService.md) |
| `StorageService` | Template persistence | [API](./services/StorageService.md) |

### Utility Functions

| Utility | Purpose | API Reference |
|---------|---------|---------------|
| `layer-utils` | Layer manipulation functions | [API](./utils/layer-utils.md) |
| `audio-utils` | Audio processing helpers | [API](./utils/audio-utils.md) |
| `performance-utils` | Performance optimization | [API](./utils/performance-utils.md) |

---

## API Design Principles

### Type Safety First
All APIs are designed with comprehensive TypeScript support:

```typescript
// Example: Strongly typed layer update function
function updateLayer<T extends keyof Layer>(
  layers: Layer[],
  layerId: string,
  property: T,
  value: Layer[T]
): Layer[]
```

### Performance Conscious
APIs are optimized for 60fps performance:

```typescript
// Example: Memoized component API
const LayerItem = React.memo<LayerItemProps>(
  ({ layer, onUpdate }) => { /* implementation */ },
  (prevProps, nextProps) => shallowEqual(prevProps, nextProps)
);
```

### Error Resilience
All APIs include comprehensive error handling:

```typescript
// Example: Result type for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

### Extensibility
APIs support future enhancements through plugin patterns:

```typescript
// Example: Extensible shape system
interface ShapePlugin {
  type: string;
  render: (ctx: CanvasRenderingContext2D, props: ShapeProps) => void;
  getDefaultProps: () => ShapeProps;
}
```

---

## Common Patterns

### Component Props Pattern

HAL Builder components follow a consistent props pattern:

```typescript
interface ComponentProps extends BaseComponentProps {
  // Required props
  data: DataType;
  onUpdate: (updates: Partial<DataType>) => void;
  
  // Optional configuration
  theme?: ThemeName;
  className?: string;
  
  // Performance optimization props
  shouldUpdate?: (prev: DataType, next: DataType) => boolean;
}

interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}
```

### Hook Return Pattern

Custom hooks return objects with clear, typed interfaces:

```typescript
interface HookReturn {
  // Data
  data: DataType;
  loading: boolean;
  error: Error | null;
  
  // Actions
  update: (updates: Partial<DataType>) => void;
  refresh: () => Promise<void>;
  
  // State
  isModified: boolean;
  canUndo: boolean;
}
```

### Service Pattern

Services provide stateful functionality with lifecycle management:

```typescript
interface Service {
  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;
  
  // State
  isInitialized(): boolean;
  getStatus(): ServiceStatus;
  
  // Event handling
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
}
```

---

## Usage Examples

### Basic Component Usage

```typescript
import { HalModuleBuilder } from 'hal-builder';
import type { ThemeName } from 'hal-builder/types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeName>('frost_light');
  
  return (
    <HalModuleBuilder
      theme={theme}
      onThemeChange={setTheme}
      className="hal-builder-container"
    />
  );
};
```

### Hook Integration

```typescript
import { useAudio, useLayer } from 'hal-builder/hooks';

const AudioVisualizer: React.FC = () => {
  const { audioData, isProcessing, startProcessing } = useAudio();
  const { layers, updateLayer } = useLayer();
  
  useEffect(() => {
    if (audioData && layers.length > 0) {
      // Update equalizer layers with audio data
      layers
        .filter(layer => layer.type === 'effect')
        .forEach(layer => {
          updateLayer(layer.id, { 
            equalizerSettings: { 
              ...layer.equalizerSettings,
              audioData 
            }
          });
        });
    }
  }, [audioData, layers, updateLayer]);
  
  return (
    <div>
      <button onClick={startProcessing}>
        {isProcessing ? 'Stop' : 'Start'} Audio Processing
      </button>
    </div>
  );
};
```

### Service Integration

```typescript
import { AudioService, RenderService } from 'hal-builder/services';

class VisualizationEngine {
  private audioService: AudioService;
  private renderService: RenderService;
  
  constructor(canvas: HTMLCanvasElement) {
    this.audioService = new AudioService();
    this.renderService = new RenderService(canvas);
  }
  
  async initialize(): Promise<void> {
    await this.audioService.initialize();
    await this.renderService.initialize();
    
    // Connect services
    this.audioService.on('audioData', (data) => {
      this.renderService.updateAudioData(data);
    });
  }
  
  start(): void {
    this.audioService.startProcessing();
    this.renderService.startRenderLoop();
  }
  
  stop(): void {
    this.audioService.stopProcessing();
    this.renderService.stopRenderLoop();
  }
}
```

---

## Migration Guide

### From Previous Versions

When upgrading HAL Builder components, follow these patterns:

#### Component Props Migration
```typescript
// v1.0.x (old)
<LayerItem
  layer={layer}
  updateLayer={updateLayer}
  theme={theme}
/>

// v1.1.x (new - if there were breaking changes)
<LayerItem
  layer={layer}
  onUpdate={updateLayer}  // Renamed for consistency
  theme={theme}
  className="layer-item"  // New optional prop
/>
```

#### Hook API Migration
```typescript
// v1.0.x (old)
const { layers, setLayers } = useLayerState();

// v1.1.x (new - if there were breaking changes)  
const { layers, updateLayer, bulkUpdate } = useLayer();
// More specific, optimized update methods
```

### Deprecation Notices

Check individual API documentation for deprecation notices and migration paths. Deprecated APIs will be marked clearly:

```typescript
/**
 * @deprecated Use `newFunction` instead. Will be removed in v2.0.0
 */
function oldFunction(): void;
```

---

## Performance Considerations

### Component Rendering

All documented components are optimized for HAL Builder's 60fps requirement:

- **Memoization**: Components use `React.memo` where beneficial
- **Stable References**: Callbacks are memoized with `useCallback`
- **Efficient Updates**: State updates minimize re-renders

### Memory Usage

APIs are designed to prevent memory leaks:

- **Cleanup Functions**: All hooks return cleanup functions
- **Resource Management**: Services properly cleanup resources
- **Weak References**: Event handlers use weak references where appropriate

### Bundle Impact

Import only what you need to minimize bundle size:

```typescript
// ✅ Good: Import specific functions
import { updateLayer, validateLayer } from 'hal-builder/utils/layer-utils';

// ❌ Avoid: Importing entire modules unnecessarily  
import * as LayerUtils from 'hal-builder/utils/layer-utils';
```

---

## Contributing to API Documentation

### Documentation Standards

When contributing API documentation:

1. **Follow TypeScript-First Approach**: Always include type definitions
2. **Provide Complete Examples**: Show realistic usage scenarios  
3. **Document Performance Impact**: Note any performance considerations
4. **Include Error Scenarios**: Document error cases and handling
5. **Maintain Consistency**: Follow established documentation patterns

### Example Documentation Template

```markdown
# API Name

Brief description of the API's purpose and key features.

## Import

```typescript
import { ApiName } from 'hal-builder/module';
```

## Interface

```typescript
interface ApiInterface {
  // Complete type definition
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param1` | `Type1` | Yes | Description |
| `param2` | `Type2` | No | Optional description |

## Returns

Returns `ReturnType` - Description of return value.

## Usage

```typescript
// Complete, runnable example
```

## Performance Notes

Notes about performance characteristics, limitations, or optimizations.

## Error Handling

Description of possible errors and how to handle them.
```

---

**API Philosophy:** HAL Builder's APIs prioritize developer experience, type safety, and performance. Every public interface is designed to be intuitive, well-documented, and optimized for the application's demanding real-time performance requirements.