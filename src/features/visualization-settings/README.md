# Visualization Settings Feature

Clean, modular implementation of visualization settings following DRY, SRP, and LOC principles.

## Structure

```
/features/visualization-settings/
  /components/
    /shared-sections/        # Sections shared by all visualization types
      - AppearanceSection.tsx
      - SymmetrySection.tsx
      - PositionSection.tsx
      - AudioIntegrationSection.tsx
    /style-sections/         # Visualization-specific style sections
      - BarStyleSection.tsx
      - DotStyleSection.tsx
      - TriangleStyleSection.tsx
      - DiamondStyleSection.tsx
      - HexagonStyleSection.tsx
      - CircleStyleSection.tsx
    - VisualizationSettingsPanel.tsx  # Main orchestrator
  /hooks/
    - useVisualizationSettings.ts     # Settings state management
    - useAppearanceMapping.ts         # Appearance panel integration
  /utils/
    - settings-defaults.ts            # Default values
    - settings-schema.ts              # Validation and constraints
  /types/
    - index.ts                        # Type definitions
  index.ts                            # Public API
  README.md                           # This file
```

## Settings Panel Structure

Following `docs/examples/equalizer_panel_categories_and_items.md`:

1. **Type** - Visualization type selector (bar, dot, triangle, etc.)
2. **Style** - Visualization-specific settings (e.g., Bar Count, Bar Height, Bar Width, etc.)
3. **Appearance Panel** - Full appearance suite (Fill, Stroke, Blend Mode, Opacity, Shadows, Glows, Bevel/Emboss, Global Light)
4. **Symmetry** - Symmetry mode (2-12 fold) and Bar Layout
5. **Position** - Position X/Y, Rotation, Inner Radius, Show Radial Path, Partial Arc
6. **Audio Integration** - Response Speed, Pulse Mode

## Principles

### DRY (Don't Repeat Yourself)
- Shared sections reused across all visualization types
- Common settings defined once in `CommonVisualizationSettings`
- Validation logic centralized in `settings-schema.ts`

### SRP (Single Responsibility Principle)
- Each section component handles ONE category
- Each hook handles ONE concern
- Each util function does ONE thing

### LOC (Lines of Code)
- Components: < 150 LOC
- Hooks: < 100 LOC
- Utils: < 50 LOC

## Theme Tokens

All components use Frost Glass theme tokens:
- `frostlight-standard-glass-card` / `frostdark-standard-glass-card`
- `frostlight-input-field` / `frostdark-input-field`
- `frostlight-button` / `frostdark-button`
- Tailwind Frost classes: `frost-text-*`, `frost-bg-*`, etc.

## Usage

### Basic Usage

```typescript
import { VisualizationSettingsPanel } from '@/features/visualization-settings';

function MyComponent() {
  const [settings, setSettings] = useState({
    visualizationType: 'bar',
    barCount: 64,
    barHeight: 200,
    barWidth: 8,
    barSpacing: 2,
    // ... other settings
  });

  const handleUpdate = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <VisualizationSettingsPanel
      settings={settings}
      onUpdate={handleUpdate}
      theme="frost_dark"
    />
  );
}
```

### Using Individual Sections

```typescript
import {
  BarStyleSection,
  SymmetrySection,
  PositionSection,
} from '@/features/visualization-settings';

// Use individual sections for custom layouts
<BarStyleSection
  settings={barSettings}
  onChange={handleBarUpdate}
  theme="frost_light"
/>
```

### Using Hooks

```typescript
import {
  useVisualizationSettings,
  useAppearanceMapping,
} from '@/features/visualization-settings';

function MyComponent() {
  const { settings, updateSettings } = useVisualizationSettings({
    initialSettings: DEFAULT_BAR_SETTINGS,
    onUpdate: handleUpdate,
  });

  const { appearanceSettings, updateAppearanceSettings } = useAppearanceMapping({
    settings,
    onUpdate: updateSettings,
  });

  // Use settings and update functions
}
```

## Development Status

- [x] Phase 1: Foundation (types, defaults, schemas, hooks) - ✅ 37/37 tests passing
- [x] Phase 2: Shared Sections - ✅ Complete
- [x] Phase 3: Style Sections - ✅ Complete
- [x] Phase 4: Main Orchestrator - ✅ Complete
- [x] Phase 5: Replace Old Implementation - ✅ Complete
- [x] Phase 6: Full Appearance Panel Integration - ✅ Complete
- [ ] Phase 7: Polish & Refinement
- [ ] Phase 8: Documentation

## Phase 6 Notes: Appearance Panel Integration

The AppearanceSection currently implements:
- ✅ Blend Mode (all standard blend modes)
- ✅ Opacity (0-1 range)

Appearance integration status:
- [x] Fill Controls (solid, gradient types) — via adapter into existing AppearancePanel
- [x] Stroke Controls (width, align, gradient) — UI integrated; rendering TBD per visualization
- [x] Drop Shadow — applied visually via CSS drop-shadow filter
- [x] Outer Glow — applied visually via CSS drop-shadow glow
- [x] Inner Shadow — UI integrated; renderer TBD
- [x] Inner Glow — UI integrated; renderer TBD
- [x] Bevel/Emboss — UI integrated; renderer TBD (requires shading per shape)
- [x] Global Light — state plumbed for future shading

Integration approach:
1. Adapter maps `VisualizationSettings` ↔ `Layer` for AppearancePanel reuse.
2. Mapping hook `useAppearanceMapping` performs bidirectional mapping.
3. Renderer currently applies opacity, blend mode (CSS) and drop shadow/outer glow (CSS filters). Remaining effects will be implemented per visualization renderer.


## Quality Gates

Each phase includes automated tests where applicable. Manual verification is only required for visual/functional UI elements after implementation is complete.

