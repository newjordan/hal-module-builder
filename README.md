<div align="center">

<img src="public/hal_lens_1.png" alt="HAL Agent Operations" width="160" />

# HAL Agent Operations

**A live notification, telemetry, and control surface for agent fleets.**

HAL turns agent lifecycle events into an operational display where every visual
signal has a job: thinking, tool execution, waiting, completion, failure,
progress, queue pressure, context use, and operator attention each have a
distinct color, motion, icon, and trace.

</div>

## What it does

- **Visual agent identity** - stable callsigns and identity marks make agents
  recognizable independently of status color.
- **Semantic HAL lens** - the selected agent's center instrument maps reasoning,
  execution, determinate progress, context pressure, and heartbeat state to
  separate rings and motion patterns.
- **Observable cognition stream** - safe producer-supplied summaries, tool calls,
  messages, and system events appear in a bounded live log. HAL never invents or
  exposes hidden chain-of-thought.
- **Attention queue** - approvals, failures, completions, and sustained warning
  signals support acknowledge, resolve, approve, and retry workflows.
- **Fleet trace** - a synchronized five-minute timeline shows thought, tool,
  approval, completion, and error events across every registered agent.
- **Real feedback channels** - optional alert tones and desktop notifications;
  outbound operator commands publish through `CustomEvent`, `BroadcastChannel`,
  and an attached WebSocket.
- **Multiple event sources** - a deterministic local simulation works out of the
  box, while page events, same-origin tabs/workers, and a WebSocket bridge can
  stream real events.
- **Live Codex sidecar** - the included localhost-only bridge tails current
  workspace sessions, emits safe lifecycle/tool/token telemetry, redacts visible
  commentary, and never forwards prompts, reasoning ciphertext, tool arguments,
  or raw tool output.
- **Persistent operations state** - acknowledgements, filters, selected agent,
  retained events, and preferences survive reloads in local storage.
- **Responsive operations layout** - dense desktop, compact laptop, and mobile
  arrangements preserve the primary lens and keep the attention queue reachable.

The original visual layer composer is preserved at `/studio` as the internal
HAL Lens Studio.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The console starts in clearly labeled simulation
mode and can be paused from the top bar.

For real Codex session telemetry, start the sidecar and frontend together:

```bash
npm run dev:live
```

The sidecar binds `127.0.0.1:8765`, accepts the exact local Vite origins, and by
default includes only sessions whose `cwd` matches the repository where it was
started. Override that filter with `HAL_WORKSPACE=/absolute/path`. The bridge is
intentionally read-only: operator commands receive a correlated rejection
rather than controlling a Codex process without an explicit command adapter.

To attach a WebSocket event source:

```dotenv
VITE_HAL_AGENT_WS_URL=ws://127.0.0.1:8765/hal-agent-events
```

See [Agent Event Bridge](docs/agent-event-bridge.md) for the canonical event
payload, inbound transports, outbound command channel, validation behavior, and
security boundaries.

## Integration surfaces

| Surface | Direction | Name |
| --- | --- | --- |
| DOM CustomEvent | Inbound | `hal:agent-event` |
| DOM CustomEvent | Outbound | `hal:agent-command` |
| BroadcastChannel | Inbound | `hal-agent-events` |
| BroadcastChannel | Outbound | `hal-agent-commands` |
| Window API | Both | `window.HAL_AGENT_NOTIFICATIONS` |
| WebSocket | Both | `VITE_HAL_AGENT_WS_URL` |

Inbound WebSocket messages are one event or an array of events. Outbound
commands use `{ "type": "agent.command", "command": { ... } }`. Live socket
connections automatically stop the demo stream so simulated and real activity
cannot be confused.

## Quality commands

```bash
npm run type-check
npm test -- --runInBand
npm run test:bridge
npm run lint
npm run build
```

## Stack

React 18, TypeScript, Vite, Lucide React, Jest, Testing Library, Canvas/Web Audio.

## License

[MIT](LICENSE)
