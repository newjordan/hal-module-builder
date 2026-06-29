<div align="center">

<img src="public/hal_lens_1.png" alt="HAL" width="160" />

# HAL Module Builder

**A browser-based, audio-reactive visual design tool.**

Build layered visuals — shapes, gradients, images, radial text, and audio
equalizers — and drive them in real time with audio. Design in the editor,
then flip to a full-screen present mode.

![demo](public/loop_v1.gif)

</div>

---

## Features

- **Layer-based editor** — compose visuals from shape, image, gradient,
  radial-text, equalizer, effect, and generative asset layers.
- **Audio reactivity** — map live audio to layer properties (intensity,
  stroke width, brightness, hue shift, and more).
- **Equalizer / visualizer** — configurable bar visualizations with multiple
  endcap styles, color modes, and a radial-symmetry engine.
- **Effects system** — blur, inner/outer glow, inner/outer shadow, stroke,
  distortion, and pattern effects, plus a rich text-effects pipeline.
- **Gradient system** — presets, multi-target application, and live CSS output.
- **Generative assets** — optional image generation via Google Gemini.
- **Text-to-speech** — optional voice generation via ElevenLabs.
- **Design / Present modes** — a working editor and a distraction-free
  full-screen presentation view, plus a floating widget route.
- **Desktop build** — runs in the browser or as an Electron desktop app.

## Tech stack

React 18 · TypeScript · Vite · Canvas rendering · Jest + Testing Library ·
Electron · Tailwind CSS

## Getting started

Requires **Node.js 18+**.

```bash
# install dependencies
npm install

# start the dev server (http://localhost:5173)
npm run dev

# production build
npm run build
npm run preview
```

### Desktop (Electron)

```bash
npm run electron:dev    # run the desktop app against the dev build
npm run electron:build  # package a distributable
```

## API keys

The generative-asset and text-to-speech features call third-party APIs. **No
keys are bundled with this repo.** You provide your own at runtime through the
in-app API-key modal; keys are stored only in your browser's `localStorage` and
are never committed:

- **Google Gemini** — generative image/asset layers
- **ElevenLabs** — text-to-speech voices

These features are optional; the rest of the editor works without any keys.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm test` | Run the Jest test suite |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint `src` with ESLint |
| `npm run format` | Format `src` with Prettier |
| `npm run type-check` | Type-check without emitting |
| `npm run quality` | Type-check + lint + format check |

## Documentation

Technical docs live in [`docs/`](docs/) — see
[`docs/architecture/system-architecture-overview.md`](docs/architecture/system-architecture-overview.md)
for the high-level design.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
