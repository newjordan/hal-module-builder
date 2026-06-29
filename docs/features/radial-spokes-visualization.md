# Radial Spokes Visualization Feature Plan

## Overview
Turn the accidental "3D cylinder" effect discovered in bar visualization into a dedicated feature. This creates a unique spoke-like pattern where bars radiate outward from a center point, creating an interesting cylindrical/3D appearance.

## Current State
- **Discovered in**: Bar visualization with radial transform
- **Effect**: Bars rotate to follow radial angles, creating spoke-like pattern
- **Visual Result**: Almost 3D cylindrical appearance
- **User feedback**: "Very interesting effect" but not intended behavior

## Feature Implementation Plan

### Phase 1: Extract and Isolate (1-2 hours)
- [ ] Create new `RadialSpokesVisualization` class extending `BaseVisualization`
- [ ] Copy current bar radial logic with rotation behavior
- [ ] Add to visualization factory registration
- [ ] Test basic functionality

### Phase 2: Enhanced Configuration (2-3 hours)
- [ ] Add spoke-specific config options:
  - `spokeLength`: Control how far bars extend from center
  - `spokeWidth`: Individual bar thickness
  - `centerRadius`: Minimum radius before spokes start
  - `spokeSpacing`: Angular spacing between spokes
  - `followCurvature`: Whether spokes follow perfect radials or curve slightly

### Phase 3: Visual Enhancements (3-4 hours)
- [ ] **Depth Effects**:
  - Gradient from center to edge for 3D appearance
  - Shadow/highlight on spoke edges
  - Opacity variation based on distance from center
- [ ] **Color Options**:
  - Radial gradient support
  - Per-spoke color variation
  - Hue shifting around the circle

### Phase 4: Animation Features (2-3 hours)
- [ ] **Rotation Animation**: Entire spoke pattern can spin
- [ ] **Pulse Animation**: Spokes grow/shrink from center
- [ ] **Wave Animation**: Spokes activate in sequence around circle
- [ ] **Beat Response**: Intensity affects spoke length and brightness

### Phase 5: Integration and Polish (1-2 hours)
- [ ] Add to visualization type selector
- [ ] Create preset configurations
- [ ] Documentation and examples
- [ ] Performance optimization

## Configuration Interface
```typescript
interface RadialSpokesConfig extends VisualizationConfig {
  spokeLength: number;        // Max extension from center
  spokeWidth: number;         // Individual spoke thickness
  centerRadius: number;       // Dead zone in center
  spokeSpacing: number;       // Angular spacing (auto or manual)
  followCurvature: boolean;   // Perfect radials vs slight curve
  depthEffect: boolean;       // 3D gradient effects
  rotationSpeed: number;      // Animation speed (0 = static)
  pulseIntensity: number;     // Beat response strength
}
```

## Use Cases
- **Music visualization**: Great for electronic, ambient, or rhythmic music
- **Background effects**: Subtle rotating pattern for UI backgrounds
- **Data visualization**: Radial data display with spoke emphasis
- **Artistic displays**: Creative visual effects for performances

## Technical Notes
- Reuse existing radial transform service
- Optimize for performance with many spokes
- Ensure smooth animation at 60fps
- Consider WebGL acceleration for complex effects

**Estimated Total Effort**: 8-12 hours
**Priority**: Medium (cool feature, not critical)
**Dependencies**: Current radial transform system