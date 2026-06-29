# Milkdrop Layer – Best Case Implementation Report

## Objective
Deliver a new `milkdrop` layer type that renders ProjectM-style visualizations inside a perfectly round viewport, integrates with the existing HAL composite pipeline, and exposes dedicated authoring controls while keeping existing systems untouched.

## Rendering Pipeline Integration
- **Composite hook:** Extend the switch in `src/components/HalComposite/HalComposite.tsx:137` to recognize `layer.type === 'milkdrop'` and render a new `<MilkdropLayer>` component. This file already centralizes layer composition and passes audio + theme props, so the new component can slot in without mutating other cases.
- **Renderer package:** Create `src/components/MilkdropLayer/` housing `MilkdropLayer.tsx` (React wrapper) and `MilkdropRenderer.ts` (WebGL/ProjectM driver). The wrapper receives `audioData`, `size`, `theme`, and `layer.milkdropSettings`, initializes the renderer, and ensures cleanup on unmount (mirroring the lifecycle handling used in `EqualizerEngine` at `src/components/EqualizerEngine/EqualizerEngine.tsx:84-205`).
- **Audio feed:** Reuse the `audioData` array that already flows from `HalInterface -> HalComposite` (`src/components/HalInterface/HalInterface.tsx:39-47`). When data is empty (idle state), fall back to a deterministic demo waveform for parity with the equalizer’s `generateDemoData` helper.

## Layer Schema & Configuration
- **Type extension:** Add `'milkdrop'` to the `Layer['type']` union and append a `milkdropSettings` block in `src/types/layer-types.ts:55-229`. Best-case settings include `presetId`, `sensitivity`, `timeScale`, `maskRadius`, `maskFeather`, and `customMaskUrl`. Keep defaults lightweight so existing presets remain valid.
- **Creation defaults:** Define a factory in `src/components/HalModuleBuilder.tsx` (new helper, no in-place edits) that instantiates milkdrop layers with a curated preset and neutral transforms. Store presets under `src/assets/milkdrop/presets/` for discoverability.

## Masking Strategy
- **Circular mask:** Wrap the renderer canvas in a container that applies `clip-path: circle()` based on `layer.milkdropSettings.maskRadius`. This leverages the absolute positioning pattern already used in `HalComposite` (`squareFrameStyle` at `src/components/HalComposite/HalComposite.tsx:47-135`) and keeps GPU operations cheap.
- **Feathered edges:** For soft edges, add an optional CSS mask (radial-gradient) or SVG mask element that the wrapper toggles when `maskFeather > 0`. Because the mask lives entirely inside the Milkdrop component, no other layers need awareness of it.

## Editor & Property Panel
- **Authoring UI:** Register a dedicated panel in `docs`-style fashion by adding a `MilkdropLayerProperties` module and delegating to it from `useLayerProperties` when `layer.type === 'milkdrop'` (`src/hooks/useLayerProperties.tsx:55-308`). The panel can reuse the existing `PropertySection`/`PropertyRow` components for consistency.
- **Layer list:** `LayerRenderer` currently has no branch for milkdrop layers (`src/components/LayerRenderer/LayerRenderer.tsx:105-197`). Best case is to return a lightweight placeholder (thumbnail or icon) so the layer appears in the stack without forcing the renderer to execute in the sidebar.

## Preset & Engine Strategy
- **Engine choice:** Load the renderer lazily with dynamic `import()` to avoid ballooning the initial bundle, similar to how `EffectLibrary` is accessed in `EffectProcessor` (`src/components/EffectProcessor/EffectProcessor.tsx:57-214`). ProjectM WASM is ideal for fidelity; wrap initialization in a hook that caches the instance and handles failure gracefully.
- **Preset metadata:** Define a JSON manifest mapping preset IDs to file paths and display names. The property panel can consume this manifest to populate a dropdown, while the renderer requests the actual preset on demand.

## Testing & Tooling
- **Unit coverage:** Validate the settings serializer/deserializer and mask math with Jest (reuse the existing setup in `jest.config.js`).
- **Integration check:** Add a Vitest or Playwright smoke test that mounts `HalComposite` with a milkdrop layer and asserts the canvas + mask render.
- **Performance:** Instrument frame times using the existing `PerformanceMonitor` widget to ensure the ProjectM loop respects the app’s budget (`src/components/PerformanceMonitor/PerformanceMonitor.tsx`).

## Delivery Roadmap (Best Case)
1. Scaffolding – schema update, component folder, placeholder renderer (0.5d).
2. ProjectM integration – WASM loader, preset plumbing, audio binding (1.5d).
3. Mask & UI polish – clip-path, feathering, property panel, layer thumbnail (1d).
4. QA – automated tests, preset smoke check, documentation updates (0.5d).

With this approach the milkdrop layer behaves like any other composable element, adheres to existing patterns, and keeps the rest of the editor untouched.
