# Radial Transform Refactoring Plan

## Executive Summary
This plan outlines the staged extraction of duplicated radial transformation logic from individual visualizations into a centralized, reusable system. The goal is to minimize risk by introducing the new primitives behind feature flags, validating behaviour through regression tooling, and migrating each visualization incrementally.

## Current State Analysis

### Affected Files (7 visualizations with radial logic)
1. `src/assets/equalizer/visualizations/BarVisualization.ts`
2. `src/assets/equalizer/visualizations/DotVisualization.ts`
3. `src/assets/equalizer/visualizations/HexagonVisualization.ts`
4. `src/assets/equalizer/visualizations/DiamondVisualization.ts`
5. `src/assets/equalizer/visualizations/CircleVisualization.ts`
6. `src/assets/equalizer/visualizations/LineBarVisualization.ts`
7. `src/assets/equalizer/visualizations/BarVisualizationSimple.ts`

### Duplicated Logic Pattern
Each visualization contains ~50-100 lines of similar radial transformation code:
```typescript
// Common pattern found in all files:
const angleRad = (angle * Math.PI) / 180 - Math.PI / 2;
const x = centerX + Math.cos(angleRad) * radius;
const y = centerY + Math.sin(angleRad) * radius;
```

### Risk Assessment
- **HIGH RISK**: Breaking visual output of 7+ visualizations
- **HIGH RISK**: Performance regression if not optimized
- **MEDIUM RISK**: Breaking existing animations
- **MEDIUM RISK**: Config compatibility issues
- **LOW RISK**: Type safety (TypeScript will catch most issues)

## Proposed Architecture

### Phase 1: Create Core Service (Non-Breaking)
- Introduce a pure, dependency-free service dedicated to radial math.
- Mirror existing behaviour 1:1, including edge cases like inverted arcs and partial sweeps.
- Ship with unit tests before integrating anywhere else.

```typescript
// src/services/radial/RadialTransformService.ts
import { RadialConfig, RadialPosition } from './types';

const DEG_TO_RAD = Math.PI / 180;

const normalizeTotal = (total: number): number => {
  if (!Number.isFinite(total) || total < 0) {
    return 0;
  }
  return Math.floor(total);
};

export class RadialTransformService {
  static calculateRadialPosition(
    index: number,
    total: number,
    config: RadialConfig
  ): RadialPosition {
    const safeTotal = normalizeTotal(total);
    const clampedIndex = Math.max(0, Math.min(index, Math.max(0, safeTotal - 1)));

    const span = config.endAngle - config.startAngle;
    const direction = config.direction === 'counterclockwise' ? -1 : 1;
    const divisions = config.arcMode
      ? Math.max(1, safeTotal - 1)
      : Math.max(1, safeTotal);
    const angleStep = safeTotal <= 1 ? 0 : span / divisions;
    const angleDegrees = config.startAngle + direction * clampedIndex * angleStep;
    const angle = angleDegrees * DEG_TO_RAD - Math.PI / 2;

    const radius = config.innerRadius;
    const x = config.centerX + Math.cos(angle) * radius;
    const y = config.centerY + Math.sin(angle) * radius;

    return { x, y, angle, angleDegrees, radius };
  }

  static batchTransform(data: unknown[], config: RadialConfig): RadialPosition[] {
    const total = normalizeTotal(data.length);
    return Array.from({ length: total }, (_, index) =>
      this.calculateRadialPosition(index, total, config)
    );
  }

  static getRadialVector(
    angle: number,
    magnitude: number,
    invert = false
  ): { dx: number; dy: number } {
    const sign = invert ? -1 : 1;
    return {
      dx: Math.cos(angle) * magnitude * sign,
      dy: Math.sin(angle) * magnitude * sign,
    };
  }
}
```

### Supporting Types
```typescript
// src/services/radial/types.ts
export interface RadialConfig {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius?: number;
  startAngle: number;
  endAngle: number;
  arcMode?: boolean;
  invert?: boolean;
  direction?: 'clockwise' | 'counterclockwise';
}

export interface RadialPosition {
  x: number;
  y: number;
  angle: number;
  angleDegrees: number;
  radius: number;
}
```

### Phase 2: Create Hook Wrapper
- Provide React-friendly accessors with memoized config and helpers.
- Accept both visualization config and live center coordinates so canvases that reflow can keep output aligned.
- Normalize visualization-specific configs to `RadialConfig` in one place, keeping legacy defaults intact.
- Expose a small API surface: `transformPosition`, `transformBatch`, `getVector`, and metadata.

```typescript
// src/hooks/useRadialTransform.ts
interface RadialHookArgs {
  config: VisualizationConfig;
  center: { x: number; y: number };
}

export const useRadialTransform = ({ config, center }: RadialHookArgs) => {
  const radialConfig = useMemo(() => ({
    centerX: center.x,
    centerY: center.y,
    innerRadius: config.innerRadius ?? 140,
    startAngle: config.startAngle ?? 0,
    endAngle: config.endAngle ?? 360,
    arcMode: config.arcMode ?? false,
    invert: config.invert ?? false,
    direction: config.direction ?? 'clockwise',
  }), [center.x, center.y, config]);

  const transformPosition = useCallback((index: number, total: number) => {
    return RadialTransformService.calculateRadialPosition(index, total, radialConfig);
  }, [radialConfig]);

  const transformBatch = useCallback((data: unknown[]) => {
    return RadialTransformService.batchTransform(data, radialConfig);
  }, [radialConfig]);

  const getVector = useCallback((angle: number, magnitude: number) => {
    return RadialTransformService.getRadialVector(angle, magnitude, radialConfig.invert);
  }, [radialConfig.invert]);

  return {
    transformPosition,
    transformBatch,
    getVector,
    isRadialMode: radialConfig.arcMode,
    config: radialConfig,
  };
};
```

- Long term, visualization classes become thin wrappers around hook-driven React components, so the hook should stay React-first and avoid leaking Canvas internals.

### Phase 3: Migration Strategy (One Visualization at a Time)
1. Capture current screenshots/metrics for the target visualization and enable the feature flag for local testing only.
2. Introduce a parallel rendering path (e.g., `renderRadialBarsNew`) that consumes the hook while the legacy path remains untouched.
3. Create regression tests comparing legacy vs. new output, and run automated visual diff.
4. Behind the feature flag, switch the runtime code to the new path and run performance benchmarks.
5. When validated, delete the legacy method and enable the flag for that visualization by default.

```typescript
// BarVisualization.ts (excerpt)
const { transformBatch } = useRadialTransform({ config, center: { x: context.centerX, y: context.centerY } });

const positions = transformBatch(data);
positions.forEach((pos, index) => {
  drawBar(ctx, pos, data[index], config);
});
```

### Phase 4: Cleanup and Hardening
- Remove feature flag checks once all visualizations are migrated.
- Inline shared helpers (e.g., `drawBar`) where duplication remains.
- Document the radial API in the contributor guide.

## Validation Strategy

### Unit Tests
- `calculateRadialPosition` handles single item, full circle, partial arc, inverted arcs, and clamped totals.
- `batchTransform` returns stable arrays and reuses calculations for identical inputs.
- `getRadialVector` respects `invert`, zero magnitude, and angle wrap-around.
- Hook memoization maintains referential equality when config and center are unchanged.

```typescript
// src/services/radial/__tests__/RadialTransformService.test.ts
const baseConfig: RadialConfig = {
  centerX: 100,
  centerY: 100,
  innerRadius: 50,
  startAngle: 0,
  endAngle: 360,
};

describe('RadialTransformService', () => {
  it('returns center point when total is one', () => {
    const pos = RadialTransformService.calculateRadialPosition(0, 1, baseConfig);
    expect(pos.x).toBeCloseTo(baseConfig.centerX);
    expect(pos.y).toBeCloseTo(baseConfig.centerY - baseConfig.innerRadius);
  });

  it('spreads points across partial arcs in arc mode', () => {
    const config = { ...baseConfig, startAngle: 0, endAngle: 90, arcMode: true };
    const positions = RadialTransformService.batchTransform(new Array(4), config);
    expect(positions[positions.length - 1].angleDegrees).toBeCloseTo(90);
  });

  it('inverts vectors when requested', () => {
    const { dy } = RadialTransformService.getRadialVector(Math.PI / 2, 10, true);
    expect(dy).toBeCloseTo(-10);
  });
});
```

### Visual Regression Tests
- Add canvas snapshot tests comparing legacy vs. new implementations per visualization.
- Store golden images under `__image_snapshots__/radial` and refresh only after sign-off.
- Fail CI if diff percentage exceeds 0.5% to catch subtle layout shifts.

### Performance Benchmarks
- Instrument render loops with `performance.now()` and record averages over 500 frames.
- Add a Jest performance harness guarded by `@jest-environment node` to avoid DOM noise.
- Require that new implementation is <=10% slower than baseline; document results in PR description.

### Manual QA Checklist
- Verify audio-reactivity across low, mid, and high frequency ranges.
- Confirm animation modes (bounce, pulse, trail) render identically.
- Test resizing scenarios (desktop, tablet) for clipping or alignment issues.
- Validate theming (light/dark) to ensure color math remains untouched.

## Implementation Timeline
- **Week 1**: Finalize service, supporting types, baseline unit tests, and documentation updates.
- **Week 2**: Build hook, integrate feature flag plumbing, and land shared regression tooling.
- **Week 3**: Migrate Bar, Dot, and Circle visualizations; collect performance numbers.
- **Week 4**: Migrate remaining visualizations, remove legacy code, and perform rollout checklist.

## Rollback Strategy

### Feature Flags
```typescript
// src/config/features.ts
export const FEATURES = {
  USE_NEW_RADIAL_TRANSFORM: {
    bar: false,
    dot: false,
    hexagon: false,
    diamond: false,
    circle: false,
    lineBar: false,
    barSimple: false,
  },
};
```

### Git Strategy
1. Create feature branch: `feature/radial-transform-extraction`.
2. Give each visualization its own commit scoped to that migration.
3. Merge once CI passes and snapshots are approved.
4. Revert per-visualization commits if regressions surface.

### Monitoring
- Add performance metrics via existing telemetry pipeline.
- Add error boundaries and logging for transform failures.
- A/B test with a subset of users before global enablement.

## Success Metrics

### Code Quality
- Reduce duplicated radial math by at least 350 lines across the codebase.
- Maintain a single source of truth for radial calculations and config parsing.
- Achieve 100% unit test coverage on `RadialTransformService` and 90%+ on the hook.

### Performance
- Maintain render time within +/-10% of current benchmarks for all migrated visualizations.
- Avoid additional allocations inside render loops beyond temporary objects already in use.
- Ensure batch transformations remain O(n) with no additional intermediate arrays.

### Maintainability
- New visualizations adopt radial support by wiring configs without bespoke math.
- Configuration changes propagate automatically through the service and hook.
- Shared documentation enables onboarding in under 30 minutes for new contributors.

## Potential Issues & Mitigations

### Issue 1: Subtle visual differences
**Mitigation**: Visual regression tests, side-by-side comparison tool

### Issue 2: Performance regression
**Mitigation**: Benchmark before/after, optimize hot paths, use memoization

### Issue 3: Breaking existing animations
**Mitigation**: Test all animation modes, preserve exact math operations

### Issue 4: Config incompatibility
**Mitigation**: Backward compatibility layer, config migration utility

### Issue 5: React re-render issues
**Mitigation**: Proper memoization, dependency arrays, React DevTools profiling

## Alternative Approaches Considered

### 1. Mixin Pattern
```typescript
class RadialMixin {
  renderRadial() { /* shared logic */ }
}
```
**Rejected**: TypeScript mixins are complex, poor IDE support

### 2. Higher-Order Component
```typescript
const withRadialTransform = (Visualization) => { /* ... */ }
```
**Rejected**: Visualizations aren't React components

### 3. Inheritance
```typescript
class RadialBaseVisualization extends BaseVisualization { }
```
**Rejected**: Inflexible, violates composition over inheritance

## Conclusion

This refactoring will:
1. **Reduce code duplication** by centralizing radial calculations.
2. **Improve maintainability** through shared primitives and documentation.
3. **Enable new features** (spiral, elliptical layouts) without touching each visualization.
4. **Maintain performance** through careful benchmarking and memoization.
5. **Minimize risk** via phased rollout and robust rollback levers.