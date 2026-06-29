# Immediate Action Items - SRP Reactive UI

## 🚨 Quick Wins (Do Today)

### 1. Fix Dot Visualization (30 minutes)
```typescript
// In TypeSpecificPropertiesPanel.tsx, line ~344
// Replace the entire equalizer block with:
import { VisualizationSettingsPanel } from './visualizations/VisualizationSettingsPanel';

// Then just:
<VisualizationSettingsPanel
  visualizationType={equalizerSettings.barStyle || 'dot'}
  settings={equalizerSettings}
  onUpdate={(updates) => onUpdate({
    equalizerSettings: { ...equalizerSettings, ...updates }
  })}
  theme={theme}
/>
```

### 2. Connect Inner Radius for Dots (15 minutes)
- The UI has the slider (line 443-461)
- DotVisualization expects `innerRadius`
- Just needs proper property mapping in render pipeline

### 3. Hide Irrelevant Settings (20 minutes)
Add conditional rendering:
```typescript
{visualizationType !== 'dot' && (
  // Bar Width, Bar Spacing controls
)}

{visualizationType === 'dot' && (
  // Dot Size, Grid Columns/Rows controls
)}
```

---

## 📋 This Week's Implementation

### Monday: Create Base Components
- [ ] Create `SliderControl.tsx` - reusable slider
- [ ] Create `SelectControl.tsx` - reusable dropdown
- [ ] Create `ColorPicker.tsx` - reusable color input
- [ ] Create base interfaces in `types/visualization-settings.ts`

### Tuesday: Build Dot Settings
- [ ] Complete `DotVisualizationSettings.tsx`
- [ ] Add all dot-specific controls
- [ ] Test with actual DotVisualization
- [ ] Verify all properties connect

### Wednesday: Build Bar/Line Settings
- [ ] Complete `BarVisualizationSettings.tsx`
- [ ] Create `LineVisualizationSettings.tsx`
- [ ] Test property connections
- [ ] Handle layout switching

### Thursday: Integration
- [ ] Update `TypeSpecificPropertiesPanel.tsx`
- [ ] Remove 464-line monolith
- [ ] Add proper routing logic
- [ ] Test all visualization types

### Friday: Polish & Test
- [ ] Add transitions between panels
- [ ] Add validation messages
- [ ] Create preset system
- [ ] Write tests

---

## 🎯 Measurable Goals This Sprint

1. **Reduce Settings Panel from 464 → 50 lines**
2. **Create 5 visualization-specific panels**
3. **Fix all dot visualization settings**
4. **Achieve 100% setting connectivity**
5. **Add setting validation**

---

## 🔧 Technical Debt to Address

### Immediate
- Dot inner radius not connected ✅ (Fixed in our implementation)
- Settings showing for wrong vis types
- No validation on setting combinations

### Next Sprint
- No preset system
- No undo/redo for settings
- No settings persistence
- No responsive mobile view

### Future
- No AI-suggested settings
- No A/B comparison mode
- No direct manipulation on canvas
- No cross-device sync

---

## 💡 Key Insights from Audit

### What's Actually Broken
1. **Inner Radius** - UI exists but not wired to dot vis
2. **Dot Size** - No UI control at all
3. **Grid Layout** - No UI for columns/rows
4. **Shape Selection** - No UI for dot shapes
5. **Layout Mode** - No UI for grid/radial/spiral/scatter

### What Users Can't Access
- 9+ working dot features with no UI
- Shape-specific settings
- Layout-specific options
- Performance optimizations

### Why It Feels Broken
- Users see "Bar Width" when using dots
- Settings don't affect what users expect
- No feedback on what settings actually work
- Cognitive overload from irrelevant options

---

## ✅ Success Criteria

**By End of Week:**
- [ ] Users only see relevant settings
- [ ] All dot settings have UI controls
- [ ] Settings panel is modular and extensible
- [ ] Each vis type has its own panel
- [ ] No more "broken" settings

**By End of Month:**
- [ ] Full reactive UI system
- [ ] Preset management
- [ ] Mobile responsive
- [ ] 90% test coverage
- [ ] Documentation complete