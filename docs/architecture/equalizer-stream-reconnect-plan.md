# Equalizer Stream Reconnection Plan

## Current State
- `useAudioContext` (`src/hooks/useAudioContext.ts`) builds the live Web Audio stream (starts microphone, FFT, smoothing) and exposes spectrum values via `audioData`.
- `Equalizer` passes that buffer to `EqualizerEngine`, but the engine treats empty/undefined data as a failure and substitutes `generateDemoData` (`src/components/EqualizerEngine/EqualizerEngine.tsx:57`).
- Because `EqualizerEngine` never sees the hook’s live samples during initialization, the visualization library only renders the synthetic fallback.

## Primary Problems
1. `EqualizerEngine` bootstraps a second, internal audio pipeline when we already have live data supplied externally.
2. Demo data kicks in whenever the incoming buffer is falsy/empty, so the real stream is ignored even after the microphone starts delivering frames.

## Minimal Fix Strategy
1. **Trust the external audio buffer**
   - Treat an empty array as "no update yet" but keep the previous non-empty frame instead of overwriting with demo data.
   - Only fall back to demo data when audio is explicitly inactive (layer hidden or audio service not running).
2. **Inject the stream after initialization**
   - Once `initializeIntegratedEqualizer` returns the library instance, feed it the latest `audioData` every RAF tick without replacing it with generated data.
   - Ensure `stopExternalAudioData()` is invoked on unmount/inactive to release resources.
3. **Guard against race conditions**
   - Skip rendering until the library and canvas are ready.
   - Log a one-time warning if audio remains empty after a grace period so QA can spot broken permissions/devices.

## Follow-Up (Future Enhancements)
- Expose a hook/API to toggle between live input and diagnostic demo mode via the UI instead of implicit fallback.
- Consolidate audio initialization so the visualization library can accept the `AnalyserNode` created by `useAudioContext` (removing duplicate FFT settings).
- Clean up debug logging/noise once the stream path is stable.
