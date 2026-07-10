# HAL Agent Operations — Documentation

HAL Agent Operations is a live notification, telemetry, and control surface for
agent fleets. The agent console is the root application; the original visual
layer composer is preserved at the `/studio` route as the internal HAL Lens
Studio.

Start with the top-level [README](../README.md) for what the console does and
how to run it.

## Current documentation

- [**Agent Event Bridge**](./agent-event-bridge.md) — the canonical event
  contract, inbound transports (CustomEvent, BroadcastChannel, window API,
  WebSocket), the bundled Codex sidecar, operator commands, delivery
  semantics, persistence, and security boundaries.
- [**API Reference**](./api/README.md) — where the public integration
  surfaces and source modules live.

## Studio subsystem documentation

These describe the visual layer composer now served at `/studio`. They predate
the agent console and several are dated design analyses or refactoring plans;
treat them as historical subsystem references, not descriptions of the root
application.

- [`architecture/`](./architecture/) — studio-era system architecture,
  component, and type-system references plus epic analysis reports.
- [`effects/`](./effects/) — effects system architecture and migration guide.
- [`features/`](./features/) — studio feature plans.
- [HAL Lens System](./hal-lens-system.md) and
  [Radial Text System](./radial-text-system.md) — rendering subsystem guides.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the branch, commit, and PR
workflow.

## License

[MIT](../LICENSE)
