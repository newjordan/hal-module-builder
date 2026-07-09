import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';

export function envInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const HOST = '127.0.0.1';
const PORT = envInt(process.env.HAL_BRIDGE_PORT, 8765);
const ROUTE = '/hal-agent-events';
const MAX_HISTORY = 120;
const MAX_LINE_BYTES = 2 * 1024 * 1024;
const MAX_SEEN_IDS = 5000;
const POLL_MS = Math.max(250, envInt(process.env.HAL_POLL_MS, 750));
const LOOKBACK_MS =
  Math.max(1, envInt(process.env.HAL_LOOKBACK_HOURS, 24)) * 60 * 60 * 1000;
const WORKSPACE = path.resolve(process.env.HAL_WORKSPACE || process.cwd());
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const SESSIONS_ROOT = path.join(CODEX_HOME, 'sessions');
const ALLOWED_ORIGINS = new Set(
  (
    process.env.HAL_ALLOWED_ORIGINS ||
    'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173'
  )
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);

function stableId(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 18);
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function eventTime(record) {
  const parsed = Date.parse(record?.timestamp || '');
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function safeToolName(value) {
  const normalized = String(value || 'tool')
    .replace(/[^a-zA-Z0-9._:-]/g, '')
    .slice(0, 80);
  return normalized || 'tool';
}

export function sanitizeVisibleText(value, maxLength = 480) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-[a-zA-Z0-9_-]{8,}\b/g, '[REDACTED_KEY]')
    .replace(
      /\b(api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*[^\s,;]+/gi,
      '$1=[REDACTED]'
    )
    .replace(/\b[a-zA-Z0-9+/_=-]{64,}\b/g, '[REDACTED_VALUE]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function callsignFor(metadata) {
  const base = (metadata.nickname || metadata.path?.split('/').pop() || 'agent')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();
  return `${base || 'AGT'}-${metadata.sessionId.slice(-3).toUpperCase()}`;
}

function agentRegistration(context) {
  const workspaceName = path.basename(context.cwd || WORKSPACE) || 'workspace';
  return {
    id: context.sessionId,
    name:
      context.nickname ||
      (context.path === '/root' ? 'Codex' : context.path?.split('/').pop()) ||
      'Codex Agent',
    callsign: callsignFor(context),
    role:
      context.path && context.path !== '/root'
        ? `Sub-agent · ${context.path}`
        : 'Lead coding agent',
    model: context.model || 'Codex',
    workspace: workspaceName,
    branch: context.branch || 'unknown',
    capabilities: ['reasoning', 'tools', 'code'],
    ...(context.parentAgentId ? { parentAgentId: context.parentAgentId } : {}),
    metrics: {
      tokensUsed: context.tokensUsed || 0,
      contextWindow: context.contextWindow || 0,
      latencyMs: 0,
      tasksCompleted: context.tasksCompleted || 0,
      successRate: null,
      queueDepth: context.currentTurn ? 1 : 0,
    },
  };
}

export function createSessionContext(metadata = {}, epoch = 0) {
  return {
    sessionId: String(
      metadata.sessionId || metadata.id || 'unknown-session'
    ).slice(0, 128),
    epoch,
    parentAgentId:
      metadata.parentAgentId ||
      metadata.parent_thread_id ||
      metadata.forked_from_id,
    nickname: sanitizeVisibleText(
      metadata.nickname || metadata.agent_nickname || '',
      120
    ),
    path: sanitizeVisibleText(
      metadata.path || metadata.agent_path || '/root',
      160
    ),
    cwd: path.resolve(metadata.cwd || WORKSPACE),
    branch: sanitizeVisibleText(
      metadata.branch || metadata.git?.branch || '',
      160
    ),
    model: sanitizeVisibleText(
      metadata.model || metadata.model_provider || 'Codex',
      120
    ),
    contextWindow: finite(metadata.contextWindow) || 0,
    tokensUsed: 0,
    tasksCompleted: 0,
    currentTurn: undefined,
    currentTask: 'Active Codex session',
    emittedSession: false,
    lastReasoningAt: 0,
    lastTokenAt: 0,
    tools: new Map(),
    toolStartedAt: new Map(),
  };
}

function baseEvent(context, record, offset, suffix) {
  const generation = context.epoch ? `r${context.epoch}:` : '';
  return {
    id: `${context.sessionId}:${generation}${offset}:${suffix}`.slice(0, 256),
    agentId: context.sessionId,
    timestamp: eventTime(record),
    sessionId: context.sessionId,
    runId: context.currentTurn || context.sessionId,
    sequence: offset,
    ...(context.currentTurn ? { turnId: context.currentTurn } : {}),
    ...(context.parentAgentId ? { parentAgentId: context.parentAgentId } : {}),
    agent: agentRegistration(context),
  };
}

export function normalizeRecord(record, context, offset = 0) {
  if (!record || typeof record !== 'object') return [];
  const payload =
    record.payload && typeof record.payload === 'object' ? record.payload : {};
  const type = record.type;
  const payloadType = payload.type;
  const timestamp = eventTime(record);

  if (type === 'session_meta') {
    if (context.emittedSession) return [];
    context.emittedSession = true;
    return [
      {
        ...baseEvent(context, record, offset, 'session'),
        kind: 'system',
        state: 'idle',
        stage: 'intake',
        severity: 'success',
        title: 'Codex session connected',
        detail: `${context.nickname || 'Codex'} is available in ${path.basename(context.cwd)}.`,
        task: 'Standing by',
        metrics: { queueDepth: 0 },
      },
    ];
  }

  if (type === 'event_msg' && payloadType === 'task_started') {
    context.currentTurn = String(
      payload.turn_id || `${context.sessionId}-turn`
    ).slice(0, 128);
    context.currentTask = 'Active Codex turn';
    context.contextWindow =
      finite(payload.model_context_window) || context.contextWindow;
    context.tools.clear();
    context.toolStartedAt.clear();
    return [
      {
        ...baseEvent(context, record, offset, 'task-started'),
        kind: 'system',
        state: 'thinking',
        stage: 'intake',
        severity: 'info',
        title: 'Task started',
        detail: 'The agent accepted a new turn and is gathering context.',
        task: context.currentTask,
        metrics: {
          contextWindow: context.contextWindow,
          queueDepth: 1,
        },
      },
    ];
  }

  if (type === 'event_msg' && payloadType === 'task_complete') {
    const detail =
      sanitizeVisibleText(payload.last_agent_message, 420) ||
      'The agent completed the current turn.';
    context.tasksCompleted += 1;
    const completedTurn = context.currentTurn;
    const event = {
      ...baseEvent(context, record, offset, 'task-complete'),
      kind: 'completion',
      state: 'completed',
      stage: 'deliver',
      severity: 'success',
      title: 'Task complete',
      detail,
      task: context.currentTask,
      actionable: true,
      ...(finite(payload.duration_ms) !== undefined
        ? { durationMs: finite(payload.duration_ms) }
        : {}),
      metrics: {
        tasksCompleted: context.tasksCompleted,
        queueDepth: 0,
      },
      ...(completedTurn ? { runId: completedTurn, turnId: completedTurn } : {}),
    };
    context.currentTurn = undefined;
    return [event];
  }

  if (
    type === 'event_msg' &&
    (payloadType === 'turn_aborted' || payloadType === 'task_failed')
  ) {
    return [
      {
        ...baseEvent(context, record, offset, 'turn-aborted'),
        kind: 'error',
        state: 'error',
        stage: 'execute',
        severity: 'critical',
        title: 'Agent turn interrupted',
        detail: 'The current agent turn ended before completion.',
        task: context.currentTask,
        actionable: true,
        metrics: { queueDepth: 0 },
      },
    ];
  }

  if (type === 'response_item' && payloadType === 'reasoning') {
    if (timestamp - context.lastReasoningAt < 1_500) return [];
    context.lastReasoningAt = timestamp;
    return [
      {
        ...baseEvent(context, record, offset, 'reasoning'),
        kind: 'thought',
        state: 'thinking',
        stage: 'reason',
        severity: 'info',
        title: 'Reasoning pulse',
        detail:
          'The agent is evaluating context and selecting its next operation.',
        task: context.currentTask,
      },
    ];
  }

  if (type === 'response_item' && payloadType === 'custom_tool_call') {
    const callId = String(payload.call_id || payload.id || `${offset}`).slice(
      0,
      128
    );
    const tool = safeToolName(payload.name);
    context.tools.set(callId, tool);
    context.toolStartedAt.set(callId, timestamp);
    return [
      {
        ...baseEvent(context, record, offset, `tool-start:${callId}`),
        kind: 'tool',
        state: 'processing',
        stage: 'execute',
        severity: 'info',
        title: `Tool started · ${tool}`,
        detail: `The agent invoked ${tool}.`,
        task: context.currentTask,
        tool,
        callId,
      },
    ];
  }

  if (type === 'response_item' && payloadType === 'custom_tool_call_output') {
    const callId = String(payload.call_id || `${offset}`).slice(0, 128);
    const tool = context.tools.get(callId) || 'tool';
    const startedAt = context.toolStartedAt.get(callId);
    context.tools.delete(callId);
    context.toolStartedAt.delete(callId);
    return [
      {
        ...baseEvent(context, record, offset, `tool-return:${callId}`),
        kind: 'tool',
        state: 'processing',
        stage: 'execute',
        severity: 'info',
        title: `Tool returned · ${tool}`,
        detail: `${tool} returned control to the agent. Raw output was not forwarded.`,
        task: context.currentTask,
        tool,
        callId,
        ...(startedAt
          ? { durationMs: Math.max(0, timestamp - startedAt) }
          : {}),
      },
    ];
  }

  if (type === 'event_msg' && payloadType === 'token_count') {
    if (timestamp - context.lastTokenAt < 3_000) return [];
    const info =
      payload.info && typeof payload.info === 'object' ? payload.info : {};
    const total =
      info.total_token_usage && typeof info.total_token_usage === 'object'
        ? info.total_token_usage
        : {};
    const tokensUsed = finite(total.total_tokens);
    const contextWindow = finite(info.model_context_window);
    if (tokensUsed === undefined && contextWindow === undefined) return [];
    context.lastTokenAt = timestamp;
    if (tokensUsed !== undefined) context.tokensUsed = tokensUsed;
    if (contextWindow !== undefined) context.contextWindow = contextWindow;
    return [
      {
        ...baseEvent(context, record, offset, 'tokens'),
        kind: 'system',
        severity: 'trace',
        title: 'Token telemetry',
        detail: 'Measured token and context-window counters were updated.',
        task: context.currentTask,
        metrics: {
          ...(tokensUsed !== undefined ? { tokensUsed } : {}),
          ...(contextWindow !== undefined ? { contextWindow } : {}),
        },
      },
    ];
  }

  if (type === 'event_msg' && payloadType === 'agent_message') {
    const detail = sanitizeVisibleText(payload.message, 420);
    if (!detail) return [];
    const isFinal = payload.phase === 'final';
    return [
      {
        ...baseEvent(
          context,
          record,
          offset,
          isFinal ? 'final-message' : 'agent-message'
        ),
        kind: 'message',
        state: isFinal ? 'completed' : 'processing',
        stage: isFinal ? 'deliver' : 'verify',
        severity: isFinal ? 'success' : 'info',
        title: isFinal ? 'Agent response ready' : 'Agent update',
        detail,
        task: context.currentTask,
      },
    ];
  }

  if (type === 'event_msg' && payloadType === 'context_compacted') {
    return [
      {
        ...baseEvent(context, record, offset, 'context-compacted'),
        kind: 'system',
        state: 'thinking',
        stage: 'context',
        severity: 'warning',
        title: 'Context compacted',
        detail:
          'The agent compacted its working context and continued the turn.',
        task: context.currentTask,
      },
    ];
  }

  if (type === 'event_msg' && payloadType === 'patch_apply_end') {
    const succeeded = payload.success !== false;
    return [
      {
        ...baseEvent(context, record, offset, 'patch-applied'),
        kind: 'tool',
        state: 'processing',
        stage: 'execute',
        severity: succeeded ? 'success' : 'warning',
        title: succeeded ? 'Patch applied' : 'Patch not applied',
        detail: succeeded
          ? 'A workspace patch completed successfully.'
          : 'A workspace patch ended without success.',
        task: context.currentTask,
        tool: 'apply_patch',
      },
    ];
  }

  if (type === 'event_msg' && payloadType === 'sub_agent_activity') {
    return [
      {
        ...baseEvent(context, record, offset, 'delegation'),
        kind: 'system',
        state: 'processing',
        stage: 'execute',
        severity: 'info',
        title: 'Agent delegation updated',
        detail:
          'The collaboration runtime reported a sub-agent lifecycle change.',
        task: context.currentTask,
      },
    ];
  }

  return [];
}

export class JsonlDecoder {
  constructor() {
    this.carry = Buffer.alloc(0);
    this.carryOffset = 0;
  }

  reset(offset = 0) {
    this.carry = Buffer.alloc(0);
    this.carryOffset = offset;
  }

  push(chunk, chunkOffset) {
    const input = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const baseOffset = this.carry.length ? this.carryOffset : chunkOffset;
    const data = this.carry.length ? Buffer.concat([this.carry, input]) : input;
    const lines = [];
    let start = 0;
    for (let index = 0; index < data.length; index += 1) {
      if (data[index] !== 0x0a) continue;
      const raw = data.subarray(start, index);
      if (raw.length > 0 && raw.length <= MAX_LINE_BYTES) {
        lines.push({
          offset: baseOffset + start,
          text: raw.toString('utf8').replace(/\r$/, ''),
        });
      }
      start = index + 1;
    }
    this.carry = data.subarray(start);
    this.carryOffset = baseOffset + start;
    if (this.carry.length > MAX_LINE_BYTES) {
      this.carry = Buffer.alloc(0);
      this.carryOffset = chunkOffset + input.length;
    }
    return lines;
  }
}

async function readFirstRecord(file) {
  let handle;
  try {
    handle = await fs.open(file, 'r');
    const buffer = Buffer.alloc(256 * 1024);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const newline = buffer.subarray(0, bytesRead).indexOf(0x0a);
    if (newline < 0) return null;
    return JSON.parse(buffer.subarray(0, newline).toString('utf8'));
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => {});
  }
}

async function discoverJsonl(directory, output = []) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await discoverJsonl(target, output);
    else if (entry.isFile() && entry.name.endsWith('.jsonl'))
      output.push(target);
  }
  return output;
}

export function isAllowedUpgrade(request, allowedOrigins = ALLOWED_ORIGINS) {
  if (request.url !== ROUTE) return false;
  const origin = request.headers?.origin;
  return typeof origin === 'string' && allowedOrigins.has(origin);
}

function validCommandEnvelope(value) {
  if (!value || typeof value !== 'object' || value.type !== 'agent.command')
    return null;
  const command = value.command;
  if (!command || typeof command !== 'object') return null;
  if (
    typeof command.id !== 'string' ||
    !command.id ||
    command.id.length > 256 ||
    typeof command.agentId !== 'string' ||
    !command.agentId ||
    command.agentId.length > 128 ||
    !['retry', 'approve', 'pause', 'resume'].includes(command.action) ||
    typeof command.timestamp !== 'number' ||
    !Number.isFinite(command.timestamp)
  ) {
    return null;
  }
  if (
    command.eventId !== undefined &&
    (typeof command.eventId !== 'string' || command.eventId.length > 256)
  ) {
    return null;
  }
  return {
    id: command.id,
    agentId: command.agentId,
    action: command.action,
    timestamp: command.timestamp,
    ...(command.eventId ? { eventId: command.eventId } : {}),
  };
}

export function commandRejection(command, timestamp = Date.now()) {
  return {
    id: `${command.id}:rejected`.slice(0, 256),
    agentId: command.agentId,
    kind: 'system',
    severity: 'warning',
    title: 'Command rejected by read-only bridge',
    detail:
      'The Codex session bridge exposes telemetry only; no agent process was changed.',
    timestamp,
    commandId: command.id,
    commandStatus: 'rejected',
    ...(command.eventId ? { task: 'Operator command' } : {}),
  };
}

async function main() {
  const trackers = new Map();
  const history = [];
  const seenEvents = new Set();
  const seenCommands = new Set();
  const clients = new Set();
  let polling = false;

  const remember = (seen, id) => {
    seen.add(id);
    if (seen.size <= MAX_SEEN_IDS) return;
    for (const stale of seen) {
      seen.delete(stale);
      if (seen.size <= MAX_SEEN_IDS) break;
    }
  };

  const publish = event => {
    if (!event?.id || seenEvents.has(event.id)) return;
    remember(seenEvents, event.id);
    history.push(event);
    if (history.length > MAX_HISTORY)
      history.splice(0, history.length - MAX_HISTORY);
    const frame = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) client.send(frame);
    }
  };

  publish({
    id: `bridge-ready:${stableId(WORKSPACE)}`,
    agentId: 'hal-codex-bridge',
    kind: 'system',
    state: 'idle',
    stage: 'intake',
    severity: 'success',
    title: 'Codex bridge ready',
    detail: `Watching sanitized Codex activity for ${path.basename(WORKSPACE)}.`,
    timestamp: Date.now(),
    task: 'Session telemetry',
    agent: {
      id: 'hal-codex-bridge',
      name: 'HAL Bridge',
      callsign: 'HAL-IO',
      role: 'Read-only Codex telemetry',
      model: 'Local sidecar',
      workspace: path.basename(WORKSPACE),
      branch: 'local',
      capabilities: ['telemetry', 'redaction', 'replay'],
      metrics: {
        tokensUsed: 0,
        contextWindow: 0,
        latencyMs: 0,
        tasksCompleted: 0,
        successRate: null,
        queueDepth: 0,
      },
    },
  });

  const pollTracker = async tracker => {
    let stat;
    try {
      stat = await fs.stat(tracker.file);
    } catch {
      return;
    }
    if (stat.size < tracker.position || stat.ino !== tracker.inode) {
      tracker.position = 0;
      tracker.inode = stat.ino;
      tracker.decoder.reset(0);
      tracker.epoch = (tracker.epoch || 0) + 1;
      tracker.context = createSessionContext(tracker.metadata, tracker.epoch);
    }
    if (stat.size === tracker.position) return;
    let handle;
    try {
      handle = await fs.open(tracker.file, 'r');
      const length = stat.size - tracker.position;
      const chunk = Buffer.alloc(length);
      const start = tracker.position;
      const { bytesRead } = await handle.read(chunk, 0, length, start);
      tracker.position += bytesRead;
      for (const line of tracker.decoder.push(
        chunk.subarray(0, bytesRead),
        start
      )) {
        let record;
        try {
          record = JSON.parse(line.text);
        } catch {
          continue;
        }
        for (const event of normalizeRecord(
          record,
          tracker.context,
          line.offset
        ))
          publish(event);
      }
    } catch {
      // A session file can disappear between stat and read; retry next poll.
    } finally {
      await handle?.close().catch(() => {});
    }
  };

  const discover = async () => {
    const files = await discoverJsonl(SESSIONS_ROOT);
    const cutoff = Date.now() - LOOKBACK_MS;
    for (const file of files) {
      if (trackers.has(file)) continue;
      let stat;
      try {
        stat = await fs.stat(file);
      } catch {
        continue;
      }
      if (stat.mtimeMs < cutoff) continue;
      const first = await readFirstRecord(file);
      const payload = first?.type === 'session_meta' ? first.payload || {} : {};
      if (!payload.cwd || path.resolve(payload.cwd) !== WORKSPACE) continue;
      const metadata = {
        sessionId: payload.id || payload.session_id,
        parentAgentId: payload.parent_thread_id || payload.forked_from_id,
        nickname: payload.agent_nickname,
        path: payload.agent_path || '/root',
        cwd: payload.cwd,
        branch: payload.git?.branch,
        model: payload.model_provider || 'Codex',
        contextWindow: finite(payload.context_window),
      };
      trackers.set(file, {
        file,
        metadata,
        context: createSessionContext(metadata),
        position: 0,
        inode: stat.ino,
        decoder: new JsonlDecoder(),
      });
    }
  };

  const poll = async () => {
    if (polling) return;
    polling = true;
    try {
      await discover();
      for (const tracker of trackers.values()) await pollTracker(tracker);
    } catch (error) {
      console.error(`[hal-bridge] poll failed: ${error.message}`);
    } finally {
      polling = false;
    }
  };

  const server = new WebSocketServer({
    host: HOST,
    port: PORT,
    path: ROUTE,
    maxPayload: 64 * 1024,
    verifyClient(info, done) {
      done(isAllowedUpgrade(info.req));
    },
  });

  server.on('connection', socket => {
    clients.add(socket);
    socket.send(JSON.stringify(history));
    socket.on('message', (data, isBinary) => {
      if (isBinary || data.length > 64 * 1024) return;
      let parsed;
      try {
        parsed = JSON.parse(data.toString('utf8'));
      } catch {
        return;
      }
      const command = validCommandEnvelope(parsed);
      if (!command || seenCommands.has(command.id)) return;
      remember(seenCommands, command.id);
      publish(commandRejection(command));
    });
    socket.on('close', () => clients.delete(socket));
  });

  server.on('listening', () => {
    console.log(`[hal-bridge] ws://${HOST}:${PORT}${ROUTE}`);
    console.log(`[hal-bridge] workspace ${WORKSPACE}`);
  });
  server.on('error', error => {
    console.error(`[hal-bridge] ${error.message}`);
  });

  await poll();
  const timer = setInterval(() => void poll(), POLL_MS);
  timer.unref();

  const shutdown = () => {
    clearInterval(timer);
    for (const client of clients) client.close(1001, 'bridge shutdown');
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

const invokedDirectly =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch(error => {
    console.error(`[hal-bridge] ${error.message}`);
    process.exitCode = 1;
  });
}
