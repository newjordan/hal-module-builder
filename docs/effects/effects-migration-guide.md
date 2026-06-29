# Effects System Migration Guide

This guide helps developers adopt the modular Distortion architecture and extend it safely.

## What Changed
- Distortion.ts became an orchestration-only facade
- Effect logic moved to processor modules
- Public IEffect API remains the same

## Consumer Impact
- EffectProcessor / AnimationEngine usage unchanged
- Continue passing EffectContext and EffectParameters as before

## Migrating Existing Integrations
1) Verify imports still point to src/assets/effects/Distortion
2) Ensure parameter names match the new descriptors (distortionDescriptors)
3) Run unit, integration, visual, and performance tests
4) Address any snapshot updates only if intentional changes were made

## Adding a New Effect Variant
1) Decide the family (waveform, noise, filter). If novel, create a new processor
2) Implement processing in the chosen processor
   - Read source ImageData once
   - Write to a reused output ImageData (buffer cache)
   - Avoid per-frame allocations
3) Wire the orchestration route in Distortion.render() based on a new params.distortionType
4) Add tests
   - Unit: renders without throwing, parameter validation
   - Visual: deterministic snapshot(s)
   - Performance: baseline and multires checks
   - Memory: long-run (e.g., 2000 frames @ 64x64)

## Performance & Memory Best Practices
- Target <=16.8ms/frame at target resolutions
- Use output buffer reuse pattern to avoid GC pressure
- Do not create canvases per frame; reuse context/canvas
- Keep hot loops branch-light and math-friendly

## Testing Playbook (Commands)
- All suites: npm test
- Targeted: jest path/to/test --runInBand
- Update snapshots intentionally: jest path --updateSnapshot

## Troubleshooting
- Flaky visual tests: lock time/speed/phase; use checkerboard inputs
- Perf regressions: profile loops; precompute constants
- Memory issues: confirm cached buffers; check for hidden allocations

## Example Routing Snippet (Facade)
```ts
switch (params.distortionType) {
  case 'wave': return this.processors.distortion.processWave(context, params);
  case 'ripple': return this.processors.waveform.processRipple(input, context, params);
  case 'twist': return this.processors.noise.processTwist(input, context, params);
  case 'swirl': return this.processors.noise.processSwirl(input, context, params);
  case 'bulge': return this.processors.filter.processBulge(input, context, params);
  case 'pinch': return this.processors.filter.processPinch(input, context, params);
}
```

## Definition of Done (for new effects)
- All tests pass (unit/integration/perf/visual/memory)
- Snapshots validated or updated intentionally
- No per-frame allocations; buffers reused
- Documentation updated if the effect adds new patterns
