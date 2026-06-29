# HAL Builder Component Architecture

**Last Updated:** September 2, 2025  
**Version:** 1.0  
**System Status:** ✅ Production Ready Component System

---

## Overview

HAL Builder follows a **component-driven architecture** with a main orchestration component (`HalModuleBuilder.tsx`) that coordinates specialized sub-systems. The architecture balances **performance** (60fps requirement) with **maintainability** through strategic component organization.

## Component Hierarchy

### Application Root Structure

```typescript
App.tsx (Root Application)
├── 🎨 ThemeProvider (Frost Glass theme context)
├── 🛡️ ErrorBoundary (Global error handling)
└── 🏗️ HalModuleBuilder.tsx (Main Application Orchestrator)
    ├── 📋 LayerManager (Left Panel - Layer List & Controls)
    │   ├── LayerItem (Individual layer representation)
    │   ├── LayerControls (Add/remove/reorder operations)
    │   └── LayerTypeSelector (Layer type creation)
    ├── 🎨 Canvas Rendering Area (Center Panel - Visual Output)
    │   ├── ShapeRenderer (Shape visualization engine)
    │   ├── AnimationEngine (60fps animation coordinator)
    │   ├── PerformanceMonitor (Frame rate & memory tracking)
    │   └── AudioVisualization (Real-time audio rendering)
    ├── ⚙️ PropertyPanel (Right Panel - Layer Properties)
    │   ├── BulkEditPanel (Multi-layer operations)
    │   ├── LayerSpecificControls (Type-specific property editors)
    │   ├── AudioVisualizationControls (Audio settings)
    │   └── TemplateControls (Save/load operations)
    └── 🔧 SystemControls (Global application controls)
        ├── ThemeToggle (Light/dark mode switching)
        ├── PerformanceDisplay (Real-time metrics)
        └── DebugPanel (Development utilities)
```

---

## Technical Debt Acknowledgment

### LayerItem Monolith (Identified: September 9, 2025)
- **File:** `src/components/LayerItem.tsx`
- **Size:** 1,733 lines (CRITICAL)
- **Status:** Undergoing mandatory decomposition
- **Impact:** Blocks feature development and performance optimization
- **Resolution:** Epic created for emergency decomposition into focused hooks/handlers
- **Target:** No file to exceed 300 lines post-decomposition

## Core Component Detailed Architecture

### 1. App.tsx - Application Root

**Responsibilities:**
- Global theme management (frost_light/frost_dark)
- Error boundary setup
- Application bootstrapping
- Global CSS variable injection

**Key Features:**
```typescript
interface AppProps {}

const App: React.FC = () => {
  const [theme, setTheme] = useState<'frost_light' | 'frost_dark'>('frost_light');
  
  // Theme persistence & CSS variable management
  // Global error handling setup
  // Application context providers
};
```

**Performance Considerations:**
- Minimal re-renders through theme context optimization
- CSS custom property updates without DOM thrashing
- Error boundary prevents cascade failures

### 2. HalModuleBuilder.tsx - Main Orchestrator

**Responsibilities:**
- Central state management for all layers
- Audio system coordination
- Template system management
- Performance monitoring coordination
- UI panel layout management

**Architecture Pattern:**
```typescript
interface HalModuleBuilderState {
  layers: Layer[];
  selectedLayerId: string;
  audioEnabled: boolean;
  performanceMetrics: PerformanceData;
  templateData: TemplateConfig;
}

const HalModuleBuilder: React.FC = () => {
  // Layer management state
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');
  
  // Audio system state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  
  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceData>();
  
  // Template system
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>();
  
  // Event handlers with performance optimization
  const handleLayerUpdate = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);
  
  // Animation loop coordination
  useEffect(() => {
    const animationLoop = () => {
      // 60fps animation coordination
      // Performance monitoring
      // Audio data processing
      requestAnimationFrame(animationLoop);
    };
    requestAnimationFrame(animationLoop);
  }, []);
};
```

**Design Decisions:**
- **Monolithic by Choice:** Single large component optimizes for performance over modularity
- **Centralized State:** Reduces prop drilling and component communication overhead
- **Direct DOM Manipulation:** Canvas operations bypass React for performance
- **useCallback Optimization:** Prevents unnecessary child re-renders

### 3. LayerManager - Left Panel Component

**Responsibilities:**
- Display sortable list of layers
- Layer creation/deletion controls
- Layer selection management
- Drag-and-drop reordering
- Layer visibility toggles

**Component Structure:**
```typescript
interface LayerManagerProps {
  layers: Layer[];
  selectedLayerId: string;
  onLayerSelect: (id: string) => void;
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onLayerDelete: (id: string) => void;
  onLayerAdd: (type: LayerType) => void;
  onLayerReorder: (dragIndex: number, hoverIndex: number) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onLayerAdd,
  onLayerReorder
}) => {
  return (
    <div className="frostlight-panel-primary frostdark-panel-primary">
      <LayerControls onLayerAdd={onLayerAdd} />
      <LayerList
        layers={layers}
        selectedLayerId={selectedLayerId}
        onLayerSelect={onLayerSelect}
        onLayerUpdate={onLayerUpdate}
        onLayerDelete={onLayerDelete}
        onLayerReorder={onLayerReorder}
      />
    </div>
  );
};
```

**Sub-Components:**
- **LayerItem:** Individual layer representation with controls
- **LayerControls:** Add/remove layer buttons and type selector
- **LayerTypeSelector:** Dropdown for selecting layer types to create

### 4. PropertyPanel - Right Panel Component

**Responsibilities:**
- Display properties for selected layer(s)
- Bulk editing capabilities
- Audio visualization controls
- Template management interface
- Performance monitoring display

**Dynamic Property System:**
```typescript
interface PropertyPanelProps {
  selectedLayers: Layer[];
  onLayerUpdate: (id: string, updates: Partial<Layer>) => void;
  onBulkUpdate: (updates: Partial<Layer>) => void;
  audioEnabled: boolean;
  onAudioToggle: (enabled: boolean) => void;
  templateConfig: TemplateConfig;
  onTemplateAction: (action: TemplateAction) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ ... }) => {
  const renderPropertyControls = useCallback((layer: Layer) => {
    switch (layer.type) {
      case 'circle':
        return <CircleLayerControls layer={layer} onUpdate={onLayerUpdate} />;
      case 'gradient':
        return <GradientLayerControls layer={layer} onUpdate={onLayerUpdate} />;
      case 'equalizer':
        return <EqualizerLayerControls layer={layer} onUpdate={onLayerUpdate} />;
      // ... other layer types
      default:
        return <BaseLayerControls layer={layer} onUpdate={onLayerUpdate} />;
    }
  }, [onLayerUpdate]);
};
```

### 5. Canvas Rendering System

**Responsibilities:**
- Real-time shape rendering
- Animation coordination
- Performance monitoring
- Audio visualization rendering
- Mouse interaction handling

**Rendering Architecture:**
```typescript
interface CanvasSystemProps {
  layers: Layer[];
  audioData: AudioData | null;
  onPerformanceUpdate: (metrics: PerformanceData) => void;
}

const CanvasSystem: React.FC<CanvasSystemProps> = ({
  layers,
  audioData,
  onPerformanceUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Rendering loop with performance monitoring
  const renderFrame = useCallback(() => {
    const startTime = performance.now();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render all layers
    layers.forEach(layer => {
      renderLayer(ctx, layer, audioData);
    });
    
    // Performance tracking
    const frameTime = performance.now() - startTime;
    onPerformanceUpdate({
      frameTime,
      fps: 1000 / frameTime,
      memoryUsage: performance.memory?.usedJSHeapSize
    });
    
    animationRef.current = requestAnimationFrame(renderFrame);
  }, [layers, audioData, onPerformanceUpdate]);
  
  useEffect(() => {
    animationRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderFrame]);
};
```

---

## Component Communication Patterns

### 1. Props-Down, Events-Up Pattern

**Data Flow:**
```typescript
// Parent to child: Props
<LayerManager 
  layers={layers}
  selectedLayerId={selectedLayerId}
  onLayerUpdate={handleLayerUpdate}
/>

// Child to parent: Callback functions
const handleLayerClick = (layerId: string) => {
  onLayerSelect(layerId); // Bubbles up to parent
};
```

### 2. Context for Global State

**Theme Management:**
```typescript
const ThemeContext = createContext<{
  theme: 'frost_light' | 'frost_dark';
  toggleTheme: () => void;
}>({
  theme: 'frost_light',
  toggleTheme: () => {}
});

// Usage in components
const { theme, toggleTheme } = useContext(ThemeContext);
```

### 3. Custom Hooks for Shared Logic

**Audio Processing Hook:**
```typescript
const useAudioProcessor = (enabled: boolean) => {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Setup audio context and processing
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    
    // Processing loop
    const processAudio = () => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      setAudioData({ frequencies: dataArray });
      requestAnimationFrame(processAudio);
    };
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        processAudio();
      });
    
    return () => {
      audioContext.close();
    };
  }, [enabled]);
  
  return audioData;
};
```

### 4. Performance Optimization Patterns

**React.memo for Expensive Components:**
```typescript
const LayerItem = React.memo<LayerItemProps>(({ layer, onUpdate }) => {
  return (
    <div className="layer-item">
      {/* Layer representation */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return prevProps.layer === nextProps.layer &&
         prevProps.selected === nextProps.selected;
});
```

**useCallback for Stable References:**
```typescript
const handleLayerUpdate = useCallback((layerId: string, updates: Partial<Layer>) => {
  setLayers(prevLayers => 
    prevLayers.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    )
  );
}, []); // Stable reference prevents child re-renders
```

---

## Component Extension Patterns

### 1. Layer Type Extension

**Adding New Layer Types:**
```typescript
// 1. Define new layer interface
interface CustomLayer extends Layer {
  type: 'custom';
  customProperty: string;
}

// 2. Add to layer type union
type LayerType = 'circle' | 'gradient' | 'custom' | ...;

// 3. Create property control component
const CustomLayerControls: React.FC<LayerControlProps<CustomLayer>> = ({
  layer,
  onUpdate
}) => {
  return (
    <div className="custom-layer-controls">
      {/* Custom property controls */}
    </div>
  );
};

// 4. Register in property panel switch
const renderLayerControls = (layer: Layer) => {
  switch (layer.type) {
    case 'custom':
      return <CustomLayerControls layer={layer as CustomLayer} onUpdate={onUpdate} />;
    // ... other cases
  }
};
```

### 2. Plugin Architecture Pattern

**Hook-Based Extensions:**
```typescript
interface LayerPlugin {
  type: string;
  name: string;
  createLayer: () => Layer;
  renderControls: (layer: Layer, onUpdate: Function) => ReactElement;
  renderLayer: (ctx: CanvasRenderingContext2D, layer: Layer) => void;
}

const useLayerPlugins = () => {
  const [plugins, setPlugins] = useState<LayerPlugin[]>([]);
  
  const registerPlugin = useCallback((plugin: LayerPlugin) => {
    setPlugins(prev => [...prev, plugin]);
  }, []);
  
  return { plugins, registerPlugin };
};
```

---

## Component Testing Patterns

### 1. Component Unit Testing

**Layer Component Test:**
```typescript
describe('LayerManager', () => {
  const mockProps = {
    layers: [mockCircleLayer, mockGradientLayer],
    selectedLayerId: 'layer-1',
    onLayerSelect: jest.fn(),
    onLayerUpdate: jest.fn(),
    onLayerDelete: jest.fn(),
    onLayerAdd: jest.fn(),
    onLayerReorder: jest.fn()
  };
  
  it('should render all layers', () => {
    render(<LayerManager {...mockProps} />);
    expect(screen.getByText('Circle Layer')).toBeInTheDocument();
    expect(screen.getByText('Gradient Layer')).toBeInTheDocument();
  });
  
  it('should handle layer selection', () => {
    render(<LayerManager {...mockProps} />);
    fireEvent.click(screen.getByText('Circle Layer'));
    expect(mockProps.onLayerSelect).toHaveBeenCalledWith('layer-1');
  });
});
```

### 2. Integration Testing

**Component Communication Test:**
```typescript
describe('HalModuleBuilder Integration', () => {
  it('should update layer properties across components', () => {
    render(<HalModuleBuilder />);
    
    // Select layer in LayerManager
    fireEvent.click(screen.getByText('Circle Layer'));
    
    // Update property in PropertyPanel
    fireEvent.change(screen.getByLabelText('Opacity'), { target: { value: '0.5' } });
    
    // Verify canvas updates
    const canvas = screen.getByRole('img'); // Canvas has img role
    // Canvas content verification would require more complex testing
  });
});
```

### 3. Performance Testing

**Component Performance Test:**
```typescript
describe('LayerManager Performance', () => {
  it('should handle 50+ layers without performance degradation', () => {
    const manyLayers = Array.from({ length: 50 }, (_, i) => createMockLayer(i));
    const startTime = performance.now();
    
    render(<LayerManager layers={manyLayers} {...otherProps} />);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in under 100ms
  });
});
```

---

## Component Best Practices

### 1. Performance Guidelines

**Do:**
- Use `React.memo` for components that render frequently
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive calculations
- Minimize state updates to prevent unnecessary re-renders
- Use keys for list items to help React optimize updates

**Don't:**
- Create new objects/functions in render methods
- Use inline functions for event handlers in performance-critical components
- Update state unnecessarily
- Forget to cleanup resources in `useEffect`

### 2. Code Organization

**Component File Structure:**
```typescript
// ComponentName.tsx
import React, { useState, useCallback, useMemo } from 'react';
import './ComponentName.css';

// Types and interfaces first
interface ComponentNameProps {
  // Props definition
}

// Component implementation
const ComponentName: React.FC<ComponentNameProps> = ({ ... }) => {
  // Hooks first
  const [state, setState] = useState();
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Computed values
  const computedValue = useMemo(() => {
    // Expensive computation
  }, [dependencies]);
  
  // Render
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### 3. Accessibility Guidelines

**ARIA and Semantic HTML:**
```typescript
const LayerItem: React.FC<LayerItemProps> = ({ layer, selected, onSelect }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={`${layer.name} layer`}
      className={`layer-item ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(layer.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(layer.id)}
    >
      <span className="layer-name">{layer.name}</span>
      <button
        aria-label={`Delete ${layer.name} layer`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(layer.id);
        }}
      >
        ×
      </button>
    </div>
  );
};
```

---

## Component Maintenance Strategy

### 1. Refactoring Guidelines

**When to Extract Components:**
- Component function exceeds 200 lines
- Repeated UI patterns across multiple components
- Complex logic that can be isolated and tested independently
- Performance bottlenecks that would benefit from memoization

**When to Keep Components Large:**
- Performance-critical rendering paths (like canvas operations)
- Highly coupled state that would require extensive prop drilling
- Components with complex animation timing requirements

### 2. Documentation Requirements

**Component Documentation Template:**
```typescript
/**
 * LayerManager - Manages the list of layers in the left panel
 * 
 * @description Handles layer creation, deletion, selection, and reordering.
 * Optimized for performance with React.memo and useCallback patterns.
 * 
 * @param layers - Array of layer objects to display
 * @param selectedLayerId - ID of currently selected layer
 * @param onLayerSelect - Callback when layer is selected
 * @param onLayerUpdate - Callback when layer properties are updated
 * 
 * @performance Uses React.memo to prevent unnecessary re-renders
 * @accessibility Supports keyboard navigation and screen readers
 * 
 * @example
 * <LayerManager
 *   layers={layers}
 *   selectedLayerId="layer-1"
 *   onLayerSelect={handleLayerSelect}
 *   onLayerUpdate={handleLayerUpdate}
 * />
 */
```

---

**Component Architecture Status:** ✅ **Production Ready** - The component system provides a solid foundation for the 60fps performance requirement while maintaining clean separation of concerns and extensibility for future enhancements.