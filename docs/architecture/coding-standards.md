# HAL Builder Coding Standards

**Last Updated:** August 26, 2025  
**Version:** 1.0  
**Applies To:** HAL Builder Brownfield Enhancements

---

## Overview

This document establishes coding standards for the HAL Builder project, a fully functional React-based visual template builder with real-time audio visualization. These standards ensure consistency, maintainability, and seamless integration with the existing codebase while preserving the proven 60fps performance characteristics.

## Fundamental Principles

### 1. Brownfield Preservation 🛡️
- **NEVER break existing functionality** - All current features must remain operational
- **Maintain performance characteristics** - Preserve 60fps animation performance
- **Respect existing patterns** - Follow established code patterns in `HalModuleBuilder.tsx`
- **Preserve data compatibility** - Existing templates must continue to load without issues

### 2. Frost Glass CSS Exclusive Usage
- **MANDATORY:** Use ONLY Frost Glass CSS classes, never generic Tailwind utilities
- **Light Theme:** Use `frostlight-*` prefixed classes
- **Dark Theme:** Use `frostdark-*` prefixed classes  
- **Reference Location:** `src/themes/frost-glass.css` lines 94-377 for implementation patterns
- **Component Examples:** Follow patterns in existing `HalModuleBuilder.tsx` implementation

---

## TypeScript Standards

### Type Definitions
```typescript
// REQUIRED: All layer interfaces must extend existing Layer base
interface Layer {
  id: string;
  name: string;
  type: 'image' | 'gradient' | 'solid' | 'effect' | 'circle' | 'equalizer';
  visible: boolean;
  opacity: number;
  blendMode: string;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  // Type-specific properties follow...
}

// REQUIRED: Use strict typing for all new layer types
interface CustomLayerType extends Layer {
  type: 'custom';
  customProperties: {
    // Specific to custom type
  };
}
```

### Function Signatures
```typescript
// REQUIRED: All layer manipulation functions must follow this pattern
const updateLayer = (
  layers: Layer[], 
  layerId: string, 
  updates: Partial<Layer>
): Layer[] => {
  // Implementation must preserve existing layer structure
};

// REQUIRED: Performance-critical functions must be memoized
const expensiveCalculation = useMemo(() => {
  // Implementation
}, [dependencies]);
```

### State Management
```typescript
// REQUIRED: Follow existing useState patterns for layer management
const [layers, setLayers] = useState<Layer[]>([]);
const [selectedLayerId, setSelectedLayerId] = useState<string>('');

// PROHIBITED: Do not introduce external state management libraries
// The existing local state pattern is proven and performant
```

---

## React Component Standards

### Component Structure
```typescript
// REQUIRED: All new components must follow this structure
interface ComponentProps {
  // Props interface with clear typing
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks first
  const [state, setState] = useState();
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Render
  return (
    <div className="frostlight-card-primary frostdark-card-primary">
      {/* Frost Glass CSS only */}
    </div>
  );
};
```

### Performance Requirements
```typescript
// REQUIRED: Use React.memo for components that render frequently
const LayerComponent = React.memo<LayerComponentProps>(({ layer }) => {
  // Implementation
});

// REQUIRED: Use useCallback for event handlers in performance-critical areas
const handleLayerUpdate = useCallback((layerId: string, updates: Partial<Layer>) => {
  // Must not impact 60fps performance
}, []);

// REQUIRED: Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);
```

---

## CSS/Styling Standards

### Frost Glass CSS Usage
```css
/* REQUIRED: Use only frost glass classes */
.layer-panel {
  @apply frostlight-panel-primary frostdark-panel-primary;
}

/* PROHIBITED: Do not use generic Tailwind utilities */
.layer-panel {
  /* @apply bg-white border border-gray-200; ❌ WRONG */
}

/* REQUIRED: Theme-aware implementations */
.input-field {
  @apply frostlight-input-field frostdark-input-field;
  @apply frostlight-focus-ring frostdark-focus-ring;
}
```

### Animation Standards
```css
/* REQUIRED: All animations must support 60fps performance */
.layer-animation {
  transform: translateZ(0); /* Force hardware acceleration */
  will-change: transform, opacity; /* Optimize for animation */
}

/* REQUIRED: Use CSS custom properties for theme variables */
.custom-component {
  background: var(--frost-surface-primary);
  border: 1px solid var(--frost-border-subtle);
}
```

---

## JavaScript/Performance Standards

### Audio Processing
```typescript
// REQUIRED: All audio processing must be non-blocking
const processAudioData = (analyser: AnalyserNode) => {
  requestAnimationFrame(() => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    // Process without blocking UI thread
  });
};
```

### Memory Management
```typescript
// REQUIRED: Cleanup all resources in useEffect
useEffect(() => {
  const audioContext = new AudioContext();
  const interval = setInterval(() => {
    // Processing
  }, 16); // 60fps timing

  return () => {
    // REQUIRED: Cleanup
    audioContext.close();
    clearInterval(interval);
  };
}, []);
```

---

## File Organization Standards

### Directory Structure
```
src/
├── components/
│   ├── HalModuleBuilder.tsx    # Main component (existing)
│   ├── [Component].tsx         # New components
│   ├── [component].css         # Component-specific styles
│   └── shared/                 # Shared utility components
├── themes/
│   ├── frost-glass.css         # Main library (existing)
│   ├── frost-light.css         # Light theme (existing)
│   └── frost-dark.css          # Dark theme (existing)
└── utils/
    ├── layer-utils.ts          # Layer manipulation utilities
    ├── audio-utils.ts          # Audio processing utilities
    └── performance-utils.ts    # Performance optimization utilities
```

### Naming Conventions
- **Components:** PascalCase (`LayerPanel.tsx`)
- **Utilities:** kebab-case (`layer-utils.ts`)  
- **CSS Classes:** Follow Frost Glass naming (`frostlight-*`, `frostdark-*`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_LAYER_COUNT`)
- **Functions:** camelCase (`updateLayerPosition`)

---

## Testing Standards

### Performance Testing
```typescript
// REQUIRED: Performance benchmarks for new features
describe('Layer Performance', () => {
  it('should maintain 60fps with 20+ layers', () => {
    // Test implementation
    expect(averageFrameRate).toBeGreaterThan(58);
  });
});
```

### Integration Testing
```typescript
// REQUIRED: Test existing functionality remains intact
describe('Brownfield Compatibility', () => {
  it('should load existing templates without errors', () => {
    // Test with real template data
  });
  
  it('should maintain theme switching functionality', () => {
    // Test frost_light/frost_dark switching
  });
});
```

---

## Code Review Checklist

### ✅ Pre-Commit Requirements
- [ ] All existing functionality tested and working
- [ ] 60fps performance maintained in test scenarios
- [ ] Only Frost Glass CSS classes used (no Tailwind utilities)
- [ ] TypeScript strict mode compliance
- [ ] Memory leaks checked and resolved
- [ ] Theme switching tested in both modes
- [ ] Existing template loading verified

### ✅ Architecture Compliance
- [ ] Follows existing layer system patterns
- [ ] No breaking changes to Layer interface
- [ ] Performance optimizations implemented
- [ ] Proper cleanup implemented for all resources
- [ ] Audio processing remains non-blocking

---

## Migration Guidelines

### Adding New Features
1. **Study existing patterns** in `HalModuleBuilder.tsx`
2. **Extend, don't replace** existing functionality  
3. **Test integration** with current layer system
4. **Verify performance** impact on 60fps target
5. **Validate theme compatibility** across light/dark modes

### Legacy Code Integration
- **Preserve existing APIs** - don't break current layer interfaces
- **Add progressive enhancements** - new features should gracefully degrade  
- **Maintain backward compatibility** - existing templates must continue working
- **Document integration points** - clearly mark where new code interfaces with legacy

---

## Enforcement

### Automated Checks
```json
// package.json scripts for enforcement
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test:performance": "jest --config performance.config.js",
    "verify:frost-css": "node scripts/verify-frost-css-usage.js"
  }
}
```

### Manual Review Points
- Code review must verify Frost Glass CSS exclusive usage
- Performance testing required for all new animation features
- Brownfield compatibility must be validated before merge
- Theme switching functionality must be tested

---

**Remember: We're enhancing a working system, not building from scratch. Every change must preserve the existing functionality while adding new capabilities.**