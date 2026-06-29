# HAL Radial Lens System

**Purpose**: Make ANY content (text, images, components) look perfect in circular arrangements for AI/robot lens interfaces.

## The Problem We Solved

Your original radial hook was ambiguous - when you arranged blocks in a circle, they automatically rotated to create "spokes" instead of staying vertical. You wanted **circular arrangement with maintained orientation**, but got **radial spokes**.

## The HAL Lens Solution

The `useRadialLens` hook is laser-focused on **lens design for AI interfaces**:

### Core Principle: **Content Mode Control**
```typescript
contentMode: 'maintain' | 'follow-radius' | 'follow-tangent'
```

- **`maintain`**: Keep content readable (text, images stay upright) ✅ **This is what you wanted**
- **`follow-radius`**: Point outward from center (status indicators, spokes)
- **`follow-tangent`**: Follow circle direction (flowing carousel effect)

## Usage Examples

### 1. **Classic HAL Interface** (What you originally wanted)
```tsx
const HALInterface = () => {
  const lens = useHALClassicLens({ x: 400, y: 300 }, 120);

  const menuItems = ['ANALYZE', 'PROCESS', 'EXECUTE', 'MONITOR'];

  return (
    <div className="hal-lens">
      {menuItems.map((text, i) => {
        const transform = lens.getItemTransform(i, menuItems.length);

        return (
          <div
            key={i}
            className="menu-item"
            style={{
              transform: transform.transform,
              opacity: transform.opacity,
              position: 'absolute',
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};
```
**Result**: Text stays readable, arranged in perfect circle

### 2. **Robot Status Ring** (Using the spoke effect purposefully)
```tsx
const RobotStatusRing = () => {
  const lens = useStatusRing({ x: 400, y: 300 }, 100);

  const statusItems = [
    { icon: '🔋', value: '98%' },
    { icon: '🌡️', value: '72°F' },
    { icon: '📡', value: 'CONN' },
    { icon: '⚡', value: 'READY' }
  ];

  return (
    <div className="status-ring">
      {statusItems.map((status, i) => {
        const transform = lens.getItemTransform(i, statusItems.length);

        return (
          <div
            key={i}
            className="status-indicator"
            style={{
              transform: transform.transform,
              position: 'absolute',
            }}
          >
            <div className="icon">{status.icon}</div>
            <div className="value">{status.value}</div>
          </div>
        );
      })}
    </div>
  );
};
```
**Result**: Status indicators point outward like spokes

### 3. **Content Carousel** (Flowing around lens)
```tsx
const ContentCarousel = () => {
  const lens = useContentCarousel({ x: 400, y: 300 }, 160);

  const images = [
    '/image1.jpg',
    '/image2.jpg',
    '/image3.jpg',
    '/image4.jpg'
  ];

  return (
    <div className="content-carousel">
      {images.map((src, i) => {
        const transform = lens.getItemTransform(i, images.length);

        return (
          <img
            key={i}
            src={src}
            style={{
              transform: transform.transform,
              opacity: transform.opacity,
              position: 'absolute',
              width: '60px',
              height: '60px',
              borderRadius: '8px',
            }}
          />
        );
      })}
    </div>
  );
};
```
**Result**: Images maintain orientation but flow around circle with depth

## Key Features for Lens Design

### 1. **Auto-Sizing**
```typescript
autoSize: true,          // Automatically calculates optimal sizes
minSpacing: 15,          // Ensures content doesn't overlap
maxItemSize: 1.5,        // Prevents content from getting too large
```

### 2. **Lens Depth Effects**
```typescript
perspective: 0.1,        // Subtle 3D depth (0 = flat, 1 = extreme)
fadeEdges: true,         // Fade items at circle edges
alignment: 'center',     // 'inner' | 'center' | 'outer'
```

### 3. **Flexible Arc Control**
```typescript
startAngle: 0,           // Start position (0 = top)
endAngle: 270,           // End position (270 = 3/4 circle)
```

## Ready-to-Use Presets

```typescript
// Clean, readable HAL interface
const halLens = useHALClassicLens(center, radius);

// Futuristic robot lens with 3D effects
const robotLens = useRobotLens(center, radius);

// Status indicators pointing outward
const statusLens = useStatusRing(center, radius);

// Content flowing around lens
const carouselLens = useContentCarousel(center, radius);
```

## Backward Compatibility

Your existing equalizer can be fixed with one line:

```typescript
// In EqualizerEngine.tsx, replace:
const radialTransform = useRadialTransform({
  config,
  center: { x: centerX, y: centerY }
});

// With:
const radialTransform = useHALClassicLens(
  { x: centerX, y: centerY },
  config.innerRadius || 120
);
```

## The Result

✅ **Circular bars stay vertical** (what you originally wanted)
✅ **Spoke effect available when desired** (as a deliberate choice)
✅ **Any content looks perfect** (text, images, components)
✅ **Professional lens design** (depth, scaling, alignment)
✅ **Zero configuration needed** (smart defaults)

This focused system gives you exactly what you need for HAL lens interfaces without the complexity of the ultra-architecture (which we can add later when needed).