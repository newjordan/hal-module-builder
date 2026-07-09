# Agent Event Bridge

HAL accepts agent activity from the current page, another same-origin context,
or a WebSocket. All transports enter the same validated reducer and use the same
bounded event contract.

## Event contract

Required fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `agentId` | `string` | Stable agent identifier, 1-128 characters. |
| `kind` | `EventKind` | `thought`, `tool`, `message`, `approval`, `completion`, `error`, or `system`. |
| `severity` | `EventSeverity` | `trace`, `info`, `success`, `warning`, or `critical`. |
| `title` | `string` | Operator-facing summary, 1-240 characters. |
| `detail` | `string` | Safe detail for the inspector, at most 4,000 characters. |

Optional fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Stable idempotency key, at most 256 characters. HAL generates one when omitted. |
| `timestamp` | `number` | Unix milliseconds. Defaults to receipt time and is capped at one minute in the future. |
| `state` | `AgentState` | `idle`, `thinking`, `processing`, `waiting`, `completed`, `error`, or `offline`. |
| `stage` | `AgentStage` | Explicit `intake`, `context`, `reason`, `execute`, `verify`, or `deliver` pipeline stage. |
| `progress` | `number` | Determinate progress; rounded and clamped to `0..100`. Omit when unknown. |
| `task` | `string` | Current task label. A new task resets stale indeterminate progress. |
| `tool` | `string` | Safe tool or integration name. |
| `durationMs` | `number` | Nonnegative operation duration. |
| `artifact` | `string` | Safe artifact name or local reference. |
| `sessionId`, `turnId`, `runId`, `callId` | `string` | Correlation identifiers. |
| `parentAgentId` | `string` | Parent identity for delegated work. |
| `sequence` | `number` | Monotonic run-local ordering. Equal/lower sequences cannot regress a snapshot. |
| `metrics` | `Partial<AgentMetrics>` | Measured tokens, context window, latency, completion count, success rate, or queue depth. |
| `commandId` | `string` | Correlates an agent response to an operator command. |
| `commandStatus` | `accepted \| rejected \| completed` | Updates pending-command feedback. |
| `actionable` | `boolean` | Places the event in operator attention. |
| `agent` | `AgentRegistration` | Metadata for an unknown agent; `id` and `name` are required. |

Unknown keys are discarded. Enum values, finite numeric fields, correlation
lengths, capabilities, and nested metrics are validated before the reducer.
Transport code assigns `source`; producer-supplied source values are ignored.

Never send credentials, raw private prompts, encrypted/hidden reasoning, tool
arguments, or raw tool output. Send concise operational summaries only.

```json
{
  "id": "build-42-bundle",
  "agentId": "build-agent",
  "kind": "tool",
  "state": "processing",
  "stage": "execute",
  "severity": "info",
  "title": "Production build running",
  "detail": "Type checking completed; Vite is bundling assets.",
  "task": "Prepare release candidate",
  "tool": "npm run build",
  "progress": 65,
  "metrics": {
    "tokensUsed": 18420,
    "contextWindow": 128000,
    "queueDepth": 1
  },
  "agent": {
    "id": "build-agent",
    "name": "Build Agent",
    "callsign": "BLD-1",
    "role": "Release verifier"
  }
}
```

## Inbound transports

### CustomEvent

```js
window.dispatchEvent(
  new CustomEvent('hal:agent-event', {
    detail: {
      id: 'review-17-waiting',
      agentId: 'review-agent',
      kind: 'approval',
      state: 'waiting',
      stage: 'execute',
      severity: 'warning',
      title: 'Publish approval required',
      detail: 'The staged release is waiting for an operator decision.',
      actionable: true
    }
  })
);
```

This path stays within the current document and records `source: "bridge"`.

### BroadcastChannel

```js
const channel = new BroadcastChannel('hal-agent-events');
channel.postMessage({
  id: 'indexer-8-complete',
  agentId: 'indexer',
  kind: 'completion',
  state: 'completed',
  stage: 'deliver',
  severity: 'success',
  title: 'Index refreshed',
  detail: 'The workspace index is current.',
  actionable: true
});
channel.close();
```

BroadcastChannel is same-origin and ephemeral. Keep the producer channel open
while publishing.

### Window API

While mounted, HAL exposes `window.HAL_AGENT_NOTIFICATIONS`:

```js
const bridge = window.HAL_AGENT_NOTIFICATIONS;
const eventId = bridge?.emit({
  agentId: 'planner',
  kind: 'thought',
  state: 'thinking',
  stage: 'reason',
  severity: 'info',
  title: 'Dependency plan ready',
  detail: 'Three independent implementation lanes are available.'
});
const commandId = bridge?.command({ agentId: 'planner', action: 'pause' });
const snapshot = bridge?.snapshot();
```

`emit()` and `command()` return `""` for invalid input. `snapshot()` reflects
the latest committed React state; a synchronous read immediately after `emit()`
can still see the preceding render. The API is removed when HAL unmounts.

### WebSocket

Set the Vite environment variable before starting the frontend:

```dotenv
VITE_HAL_AGENT_WS_URL=ws://127.0.0.1:8765/hal-agent-events
```

Each server message is one event or a flat event array. One invalid array member
rejects that entire batch. HAL reconnects with capped exponential backoff,
queues at most 50 pending socket commands, and flushes them after reconnect.

```json
[
  {
    "id": "worker-a-tests",
    "agentId": "worker-a",
    "kind": "tool",
    "state": "processing",
    "stage": "verify",
    "severity": "info",
    "title": "Tests started",
    "detail": "The focused reducer suite is running.",
    "tool": "jest"
  }
]
```

Do not wrap replay arrays in a snapshot envelope.

## Bundled Codex sidecar

`npm run dev:live` starts `scripts/agent-bridge.mjs` beside Vite and injects the
local WebSocket URL. `npm run bridge` starts only the producer. It:

- binds `127.0.0.1:8765/hal-agent-events` with a 64 KiB frame cap and exact
  origin allowlist;
- polls recent `~/.codex/sessions/**/*.jsonl` files using byte offsets, partial
  line buffering, stable IDs, and bounded replay;
- includes only sessions whose `cwd` equals `HAL_WORKSPACE` or the launch
  directory;
- maps session/task/reasoning activity/tool lifecycle/visible agent updates/
  token counters into the canonical schema;
- never forwards prompts, instructions, reasoning content or ciphertext, tool
  arguments, or raw tool output;
- redacts secret-like values and truncates visible agent commentary;
- rejects commands with a correlated `commandStatus: "rejected"` event because
  it is intentionally read-only.

Configuration:

| Variable | Default | Purpose |
| --- | --- | --- |
| `HAL_WORKSPACE` | current directory | Exact session `cwd` filter. |
| `CODEX_HOME` | `~/.codex` | Codex data root. |
| `HAL_BRIDGE_PORT` | `8765` | Local WebSocket port. |
| `HAL_ALLOWED_ORIGINS` | local Vite/preview origins | Comma-separated exact origins. |
| `HAL_LOOKBACK_HOURS` | `24` | Recent session discovery window. |
| `HAL_POLL_MS` | `750` | Filesystem poll interval, minimum 250 ms. |

Run the pure redaction, JSONL, normalization, origin, and command-correlation
tests with `npm run test:bridge`.

## Operator commands

Retry, approve, pause, and resume publish simultaneously through:

- `hal:agent-command` in the current document;
- `hal-agent-commands` on BroadcastChannel;
- `{ "type": "agent.command", "command": { ... } }` on an open WebSocket.

Commands are tracked as queued/sent and duplicate action buttons are disabled.
A consumer acknowledges with a normal event carrying the same `commandId` and
`commandStatus`. `accepted` and `completed` resolve the linked source alert;
`rejected` leaves it unresolved.

```json
{
  "agentId": "worker-a",
  "kind": "system",
  "severity": "warning",
  "title": "Command rejected",
  "detail": "This bridge is read-only.",
  "commandId": "command-2d9c",
  "commandStatus": "rejected"
}
```

Command IDs confirm local publication, not remote execution. DOM and broadcast
delivery is ephemeral; socket buffering is in-memory, not a durable queue.
Consumers must authorize and deduplicate commands. Acknowledge/resolve buttons
only manage the local notification and never publish commands. In simulation,
the deterministic demo source performs the acknowledgement locally.

## Delivery semantics

- A first valid live event disables simulation and removes demo agents/events.
- Event IDs are synchronously deduplicated before sound or desktop feedback.
- At most 120 events are retained, newest timestamp first.
- Sequence order wins within a run; timestamp order is the fallback.
- Run/task changes reset elapsed time and stale progress when no new percentage
  is supplied.
- State, stage, progress, and metrics change only when producers supply them.
- Unknown success/latency values are excluded from fleet aggregates.
- Desktop notifications are opt-in, limited to actionable/critical/completion/
  error events, and suppressed while the document is visible.

## Persistence

The bounded snapshot is stored at
`localStorage["hal-agent-operations-v1"]`. It includes event detail, artifact
references, workspace/branch metadata, acknowledgements, preferences, and
pending commands. It is unencrypted and readable by every same-origin script.

```js
localStorage.removeItem('hal-agent-operations-v1');
location.reload();
```

Stored state is versioned and fully validated on hydration. Invalid or older
snapshots fall back to a clean demo state.

## Trust boundary

Window, CustomEvent, and BroadcastChannel are transports, not authorization.
Any same-origin script can inject events or publish commands. Isolate HAL on a
trusted origin, audit third-party scripts and XSS exposure, and authorize every
command in the consumer. WebSocket servers should bind locally or use TLS,
enforce exact origins and paths, cap frames, and never execute client-supplied
shell text. `VITE_` values are public frontend configuration, not secret storage.
