import type {
  Agent,
  AgentCommand,
  AgentEvent,
  AgentEventInput,
  AgentMetrics,
  AgentRegistration,
  AgentStage,
  AgentState,
  EventKind,
  EventSeverity,
  PendingAgentCommand,
} from './types';

const AGENT_STATES = new Set<AgentState>([
  'idle',
  'thinking',
  'processing',
  'waiting',
  'completed',
  'error',
  'offline',
]);
const AGENT_STAGES = new Set<AgentStage>([
  'intake',
  'context',
  'reason',
  'execute',
  'verify',
  'deliver',
]);
const EVENT_KINDS = new Set<EventKind>([
  'thought',
  'tool',
  'message',
  'approval',
  'completion',
  'error',
  'system',
]);
const EVENT_SEVERITIES = new Set<EventSeverity>([
  'trace',
  'info',
  'success',
  'warning',
  'critical',
]);
const EVENT_SOURCES = new Set<AgentEvent['source']>([
  'demo',
  'bridge',
  'websocket',
  'operator',
]);
const COMMAND_ACTIONS = new Set<AgentCommand['action']>([
  'retry',
  'approve',
  'pause',
  'resume',
]);
const COMMAND_STATUSES = new Set<PendingAgentCommand['status']>([
  'queued',
  'sent',
  'accepted',
  'rejected',
  'completed',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  value: unknown,
  maxLength: number,
  required = false
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maxLength) {
    return undefined;
  }
  return normalized || undefined;
}

function readFinite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function parseMetrics(
  value: unknown,
  requireComplete = false
): Partial<AgentMetrics> | null {
  if (!isRecord(value)) return null;
  const result: Partial<AgentMetrics> = {};
  const numericKeys: Array<Exclude<keyof AgentMetrics, 'successRate'>> = [
    'tokensUsed',
    'contextWindow',
    'latencyMs',
    'tasksCompleted',
    'queueDepth',
  ];

  for (const key of numericKeys) {
    const raw = value[key];
    if (raw === undefined && !requireComplete) continue;
    const parsed = readFinite(raw);
    if (parsed === undefined || parsed < 0) return null;
    result[key] = parsed;
  }

  if (value.successRate === null) {
    result.successRate = null;
  } else if (value.successRate !== undefined || requireComplete) {
    const successRate = readFinite(value.successRate);
    if (successRate === undefined || successRate < 0 || successRate > 100) {
      return null;
    }
    result.successRate = successRate;
  }

  return result;
}

function parseRegistration(value: unknown): AgentRegistration | null {
  if (!isRecord(value)) return null;
  const id = readString(value.id, 128, true);
  const name = readString(value.name, 120, true);
  if (!id || !name) return null;

  const state = AGENT_STATES.has(value.state as AgentState)
    ? (value.state as AgentState)
    : undefined;
  const stage = AGENT_STAGES.has(value.stage as AgentStage)
    ? (value.stage as AgentStage)
    : undefined;
  if (value.state !== undefined && !state) return null;
  if (value.stage !== undefined && !stage) return null;

  const capabilities =
    value.capabilities === undefined
      ? undefined
      : Array.isArray(value.capabilities) && value.capabilities.length <= 32
        ? value.capabilities.map(item => readString(item, 64, true))
        : null;
  if (
    capabilities === null ||
    (capabilities && capabilities.some(item => !item))
  )
    return null;

  const metrics =
    value.metrics === undefined ? undefined : parseMetrics(value.metrics);
  if (metrics === null) return null;

  const startedAt =
    value.startedAt === null ? null : readFinite(value.startedAt);
  if (
    value.startedAt !== undefined &&
    value.startedAt !== null &&
    startedAt === undefined
  ) {
    return null;
  }

  return {
    id,
    name,
    ...(readString(value.callsign, 24) && {
      callsign: readString(value.callsign, 24),
    }),
    ...(readString(value.role, 120) && { role: readString(value.role, 120) }),
    ...(readString(value.model, 120) && {
      model: readString(value.model, 120),
    }),
    ...(state ? { state } : {}),
    ...(stage ? { stage } : {}),
    ...(readString(value.task, 240) && { task: readString(value.task, 240) }),
    ...(readString(value.currentStep, 1_000) && {
      currentStep: readString(value.currentStep, 1_000),
    }),
    ...(readFinite(value.progress) !== undefined
      ? { progress: readFinite(value.progress) }
      : {}),
    ...(typeof value.progressKnown === 'boolean'
      ? { progressKnown: value.progressKnown }
      : {}),
    ...(readString(value.workspace, 500) && {
      workspace: readString(value.workspace, 500),
    }),
    ...(readString(value.branch, 240) && {
      branch: readString(value.branch, 240),
    }),
    ...(startedAt !== undefined || startedAt === null ? { startedAt } : {}),
    ...(readFinite(value.lastSeen) !== undefined
      ? { lastSeen: readFinite(value.lastSeen) }
      : {}),
    ...(capabilities ? { capabilities: capabilities as string[] } : {}),
    ...(metrics ? { metrics } : {}),
    ...(readString(value.parentAgentId, 128) && {
      parentAgentId: readString(value.parentAgentId, 128),
    }),
    ...(readString(value.activeRunId, 128) && {
      activeRunId: readString(value.activeRunId, 128),
    }),
    ...(readFinite(value.lastSequence) !== undefined
      ? { lastSequence: readFinite(value.lastSequence) }
      : {}),
  } as AgentRegistration;
}

export function parseAgentEventInput(
  value: unknown,
  source: AgentEvent['source'],
  now = Date.now()
): AgentEventInput | null {
  if (!isRecord(value)) return null;
  const agentId = readString(value.agentId, 128, true);
  const title = readString(value.title, 240, true);
  const detail =
    typeof value.detail === 'string' && value.detail.length <= 4_000
      ? value.detail.trim()
      : undefined;
  const kind = EVENT_KINDS.has(value.kind as EventKind)
    ? (value.kind as EventKind)
    : undefined;
  const severity = EVENT_SEVERITIES.has(value.severity as EventSeverity)
    ? (value.severity as EventSeverity)
    : undefined;
  if (!agentId || !title || detail === undefined || !kind || !severity) {
    return null;
  }

  const state = AGENT_STATES.has(value.state as AgentState)
    ? (value.state as AgentState)
    : undefined;
  const stage = AGENT_STAGES.has(value.stage as AgentStage)
    ? (value.stage as AgentStage)
    : undefined;
  if (value.state !== undefined && !state) return null;
  if (value.stage !== undefined && !stage) return null;

  const progress = readFinite(value.progress);
  const timestamp = readFinite(value.timestamp);
  const durationMs = readFinite(value.durationMs);
  const sequence = readFinite(value.sequence);
  if (
    (value.progress !== undefined && progress === undefined) ||
    (value.timestamp !== undefined && timestamp === undefined) ||
    (value.durationMs !== undefined &&
      (durationMs === undefined || durationMs < 0)) ||
    (value.sequence !== undefined && (sequence === undefined || sequence < 0))
  ) {
    return null;
  }

  const metrics =
    value.metrics === undefined ? undefined : parseMetrics(value.metrics);
  const agent =
    value.agent === undefined ? undefined : parseRegistration(value.agent);
  if (metrics === null || agent === null) return null;

  const commandStatus = ['accepted', 'rejected', 'completed'].includes(
    value.commandStatus as string
  )
    ? (value.commandStatus as AgentEvent['commandStatus'])
    : undefined;
  if (value.commandStatus !== undefined && !commandStatus) return null;

  const boundedTimestamp =
    timestamp === undefined
      ? undefined
      : Math.max(0, Math.min(now + 60_000, timestamp));

  return {
    agentId,
    kind,
    severity,
    title,
    detail,
    source,
    ...(readString(value.id, 256) ? { id: readString(value.id, 256) } : {}),
    ...(boundedTimestamp !== undefined ? { timestamp: boundedTimestamp } : {}),
    ...(state ? { state } : {}),
    ...(stage ? { stage } : {}),
    ...(progress !== undefined ? { progress } : {}),
    ...(readString(value.task, 240)
      ? { task: readString(value.task, 240) }
      : {}),
    ...(readString(value.tool, 160)
      ? { tool: readString(value.tool, 160) }
      : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(readString(value.artifact, 500)
      ? { artifact: readString(value.artifact, 500) }
      : {}),
    ...(readString(value.sessionId, 128)
      ? { sessionId: readString(value.sessionId, 128) }
      : {}),
    ...(readString(value.turnId, 128)
      ? { turnId: readString(value.turnId, 128) }
      : {}),
    ...(readString(value.runId, 128)
      ? { runId: readString(value.runId, 128) }
      : {}),
    ...(readString(value.callId, 128)
      ? { callId: readString(value.callId, 128) }
      : {}),
    ...(readString(value.parentAgentId, 128)
      ? { parentAgentId: readString(value.parentAgentId, 128) }
      : {}),
    ...(sequence !== undefined ? { sequence: Math.floor(sequence) } : {}),
    ...(metrics ? { metrics } : {}),
    ...(readString(value.commandId, 256)
      ? { commandId: readString(value.commandId, 256) }
      : {}),
    ...(commandStatus ? { commandStatus } : {}),
    ...(typeof value.actionable === 'boolean'
      ? { actionable: value.actionable }
      : {}),
    ...(typeof value.acknowledged === 'boolean'
      ? { acknowledged: value.acknowledged }
      : {}),
    ...(typeof value.resolved === 'boolean'
      ? { resolved: value.resolved }
      : {}),
    ...(agent ? { agent } : {}),
  } as AgentEventInput;
}

export function parseStoredAgent(value: unknown): Agent | null {
  const registration = parseRegistration(value);
  if (!registration || !isRecord(value)) return null;
  const requiredStrings = [
    'callsign',
    'role',
    'model',
    'task',
    'currentStep',
    'workspace',
    'branch',
  ];
  if (requiredStrings.some(key => typeof value[key] !== 'string')) return null;
  if (
    !AGENT_STATES.has(value.state as AgentState) ||
    !AGENT_STAGES.has(value.stage as AgentStage) ||
    typeof value.progressKnown !== 'boolean' ||
    !Array.isArray(value.capabilities)
  ) {
    return null;
  }
  const progress = readFinite(value.progress);
  const lastSeen = readFinite(value.lastSeen);
  const metrics = parseMetrics(value.metrics, true);
  const startedAt =
    value.startedAt === null ? null : readFinite(value.startedAt);
  if (
    progress === undefined ||
    lastSeen === undefined ||
    !metrics ||
    (value.startedAt !== null && startedAt === undefined)
  ) {
    return null;
  }

  return {
    id: registration.id,
    name: registration.name,
    callsign: value.callsign as string,
    role: value.role as string,
    model: value.model as string,
    state: value.state as AgentState,
    stage: value.stage as AgentStage,
    task: value.task as string,
    currentStep: value.currentStep as string,
    progress,
    progressKnown: value.progressKnown,
    workspace: value.workspace as string,
    branch: value.branch as string,
    startedAt: startedAt as number | null,
    lastSeen,
    capabilities: registration.capabilities || [],
    metrics: metrics as AgentMetrics,
    ...(registration.parentAgentId
      ? { parentAgentId: registration.parentAgentId }
      : {}),
    ...(registration.activeRunId
      ? { activeRunId: registration.activeRunId }
      : {}),
    ...(registration.lastSequence !== undefined
      ? { lastSequence: registration.lastSequence }
      : {}),
  };
}

export function parseStoredEvent(value: unknown): AgentEvent | null {
  if (
    !isRecord(value) ||
    !EVENT_SOURCES.has(value.source as AgentEvent['source'])
  ) {
    return null;
  }
  const parsed = parseAgentEventInput(
    value,
    value.source as AgentEvent['source']
  );
  if (!parsed?.id || parsed.timestamp === undefined) return null;
  const { agent: _agent, ...event } = parsed;
  return {
    ...event,
    id: parsed.id,
    timestamp: parsed.timestamp,
    acknowledged: parsed.acknowledged ?? false,
    resolved: parsed.resolved ?? false,
    source: value.source as AgentEvent['source'],
  } as AgentEvent;
}

export function parseStoredCommand(value: unknown): PendingAgentCommand | null {
  if (!isRecord(value)) return null;
  const id = readString(value.id, 256, true);
  const agentId = readString(value.agentId, 128, true);
  const timestamp = readFinite(value.timestamp);
  const action = COMMAND_ACTIONS.has(value.action as AgentCommand['action'])
    ? (value.action as AgentCommand['action'])
    : undefined;
  const status = COMMAND_STATUSES.has(
    value.status as PendingAgentCommand['status']
  )
    ? (value.status as PendingAgentCommand['status'])
    : undefined;
  if (!id || !agentId || timestamp === undefined || !action || !status) {
    return null;
  }
  return {
    id,
    agentId,
    action,
    timestamp,
    status,
    ...(readString(value.eventId, 256)
      ? { eventId: readString(value.eventId, 256) }
      : {}),
  } as PendingAgentCommand;
}

export function parseCommandInput(
  value: unknown
):
  | (Omit<AgentCommand, 'id' | 'timestamp'> &
      Partial<Pick<AgentCommand, 'id' | 'timestamp'>>)
  | null {
  if (!isRecord(value)) return null;
  const agentId = readString(value.agentId, 128, true);
  const action = COMMAND_ACTIONS.has(value.action as AgentCommand['action'])
    ? (value.action as AgentCommand['action'])
    : undefined;
  const timestamp = readFinite(value.timestamp);
  if (
    !agentId ||
    !action ||
    (value.timestamp !== undefined && timestamp === undefined)
  ) {
    return null;
  }
  return {
    agentId,
    action,
    ...(readString(value.id, 256) ? { id: readString(value.id, 256) } : {}),
    ...(timestamp !== undefined ? { timestamp } : {}),
    ...(readString(value.eventId, 256)
      ? { eventId: readString(value.eventId, 256) }
      : {}),
  } as Omit<AgentCommand, 'id' | 'timestamp'> &
    Partial<Pick<AgentCommand, 'id' | 'timestamp'>>;
}
