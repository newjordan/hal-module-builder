# API Reference

HAL Agent Operations is a private application, not a published package. Its
public integration surface is the agent event bridge, documented in
[Agent Event Bridge](../agent-event-bridge.md):

- inbound events via `hal:agent-event` CustomEvents, the `hal-agent-events`
  BroadcastChannel, `window.HAL_AGENT_NOTIFICATIONS`, or a WebSocket
  (`VITE_HAL_AGENT_WS_URL`);
- outbound operator commands via `hal:agent-command`, `hal-agent-commands`,
  and the same WebSocket;
- the bundled read-only Codex sidecar (`scripts/agent-bridge.mjs`).

## Source modules

| Module | Location |
| --- | --- |
| Event validation and contract types | `src/agent-system/validation.ts`, `src/agent-system/types.ts` |
| State reducer and retention rules | `src/agent-system/reducer.ts` |
| Transports, persistence, feedback channels | `src/agent-system/useAgentSystem.ts` |
| Console UI | `src/components/AgentConsole/` |
| Codex sidecar and dev launcher | `scripts/agent-bridge.mjs`, `scripts/dev-live.mjs` |
| HAL Lens Studio (`/studio`) | `src/components/`, `src/effects/`, `src/hooks/`, `src/services/` |

Types in `src/agent-system/types.ts` are the authoritative definitions for the
event, agent, metrics, and command shapes described in the bridge document.
