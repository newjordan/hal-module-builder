# Effects System Architecture

## Overview
The Distortion effect was refactored from a monolith into an orchestration facade that delegates to specialized processors. The goal is to preserve the public IEffect contract while improving maintainability, testability, and performance.

- Orchestration: src/assets/effects/Distortion.ts
- Processors: src/assets/effects/processors/*Processor.ts
- Algorithms/Utils: src/assets/effects/utils/*
- Consumers: EffectProcessor, AnimationEngine, EffectChain compositor

## Public Contract (IEffect)
- render(context: EffectContext, params: EffectParameters): Promise<void>
- process(): HTMLCanvasElement
- serialize()/deserialize()
- getParameterDescriptors(), validateParameters()

Consumers continue interacting only via the IEffect interface.

## Module Roles
- Distortion.ts (Facade): routes by params.distortionType and coordinates per-effect processing
- DistortionProcessor: wave variants and core distortion routing
- WaveformProcessor: ripple and waveform-based distortions
- NoiseProcessor: twist/swirl noise-style distortions
- FilterProcessor: bulge/pinch radial filters

## Data Flow
1) Consumer prepares EffectContext { canvas, ctx, dimensions, time, deltaTime }
2) render() delegates to the appropriate processor
3) Processor reads source ImageData, writes to a reusable output ImageData
4) Processor paints the output back to the target canvas context

## Performance Principles
- 60 FPS baseline at typical resolutions (<=16.8ms/frame)
- Scaled micro-benchmarks validate 480p/720p/1080p
- Avoid per-frame allocations (buffer reuse), minimize branches in hot loops

## Memory Principles
- ImageData output buffer reuse per processor instance (object pooling)
- No per-frame canvas element creation
- Long-run tests (2000 frames @ 64x64) assert no meaningful heap growth when performance.memory is available

## Testing Strategy (Summary)
- Unit: Distortion.test.ts
- Integration: EffectChain.integration.test.ts
- Performance: Distortion.performance.test.ts + multires suite
- Visual: Distortion.visual.test.ts (snapshots)
- Memory: Distortion.memory.test.ts (long-run leak checks)

## File Layout (excerpt)
- src/assets/effects/Distortion.ts
- src/assets/effects/processors/
  - DistortionProcessor.ts
  - WaveformProcessor.ts
  - NoiseProcessor.ts
  - FilterProcessor.ts
- src/assets/effects/__tests__/
  - Distortion.test.ts
  - Distortion.performance.test.ts
  - Distortion.multires.performance.test.ts
  - Distortion.visual.test.ts
  - Distortion.memory.test.ts

## Extensibility
- Add a new processor for new effect families
- Keep orchestration thin; do not add heavy logic to Distortion.ts
- Reuse test utilities to cover new effects consistently

## Troubleshooting
- Visual diffs fail: pin parameters and time to deterministic values
- Perf regressions: profile loop hotspots, ensure buffers are reused
- Memory growth: confirm no new ImageData/Canvas created per frame; validate dispose paths
