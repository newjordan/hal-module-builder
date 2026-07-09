import { createInitialAgentSystemState } from './seed';
import type {
  Agent,
  AgentEvent,
  AgentEventInput,
  AgentMetrics,
  AgentStage,
  AgentSystemAction,
  AgentSystemState,
} from './types';

const MAX_EVENTS = 120;

export function createEventId(prefix = 'event'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

function clampProgress(progress: number | undefined, fallback: number): number {
  if (progress === undefined || !Number.isFinite(progress)) return fallback;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function inferStage(state: Agent['state']): AgentStage {
  switch (state) {
    case 'thinking':
      return 'reason';
    case 'processing':
    case 'waiting':
    case 'error':
      return 'execute';
    case 'completed':
      return 'deliver';
    default:
      return 'intake';
  }
}

function finiteMetric(
  value: number | null | undefined,
  fallback: number
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback;
}

function mergeMetrics(
  current: AgentMetrics,
  update: Partial<AgentMetrics> | undefined,
  completedDelta = 0,
  completedState = false
): AgentMetrics {
  const suppliedSuccess = update?.successRate;
  return {
    tokensUsed: finiteMetric(update?.tokensUsed, current.tokensUsed),
    contextWindow: finiteMetric(update?.contextWindow, current.contextWindow),
    latencyMs: finiteMetric(update?.latencyMs, current.latencyMs),
    tasksCompleted: finiteMetric(
      update?.tasksCompleted,
      current.tasksCompleted + completedDelta
    ),
    successRate:
      suppliedSuccess === null
        ? null
        : typeof suppliedSuccess === 'number' &&
            Number.isFinite(suppliedSuccess)
          ? Math.max(0, Math.min(100, suppliedSuccess))
          : current.successRate,
    queueDepth: finiteMetric(
      update?.queueDepth,
      completedState ? Math.max(0, current.queueDepth - 1) : current.queueDepth
    ),
  };
}

export function normalizeEvent(input: AgentEventInput): AgentEvent {
  return {
    id: input.id || createEventId(input.agentId),
    agentId: input.agentId,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    detail: input.detail,
    timestamp: input.timestamp ?? Date.now(),
    acknowledged: input.acknowledged ?? false,
    resolved: input.resolved ?? false,
    source: input.source ?? 'bridge',
    ...(input.state ? { state: input.state } : {}),
    ...(input.stage ? { stage: input.stage } : {}),
    ...(input.progress !== undefined ? { progress: input.progress } : {}),
    ...(input.task ? { task: input.task } : {}),
    ...(input.tool ? { tool: input.tool } : {}),
    ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
    ...(input.artifact ? { artifact: input.artifact } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.turnId ? { turnId: input.turnId } : {}),
    ...(input.runId ? { runId: input.runId } : {}),
    ...(input.callId ? { callId: input.callId } : {}),
    ...(input.parentAgentId ? { parentAgentId: input.parentAgentId } : {}),
    ...(input.sequence !== undefined ? { sequence: input.sequence } : {}),
    ...(input.metrics ? { metrics: { ...input.metrics } } : {}),
    ...(input.commandId ? { commandId: input.commandId } : {}),
    ...(input.commandStatus ? { commandStatus: input.commandStatus } : {}),
    ...(input.actionable !== undefined ? { actionable: input.actionable } : {}),
  };
}

function createUnknownAgent(input: AgentEventInput, event: AgentEvent): Agent {
  const supplied = input.agent;
  const state = event.state || supplied?.state || 'idle';
  const baseMetrics: AgentMetrics = {
    tokensUsed: 0,
    contextWindow: 0,
    latencyMs: event.durationMs || 0,
    tasksCompleted: 0,
    successRate: null,
    queueDepth: 0,
  };
  const suppliedMetrics = supplied?.metrics
    ? mergeMetrics(baseMetrics, supplied.metrics)
    : baseMetrics;
  const parentAgentId = event.parentAgentId || supplied?.parentAgentId;

  return {
    id: event.agentId,
    name: supplied?.name || event.agentId,
    callsign: supplied?.callsign || event.agentId.slice(0, 5).toUpperCase(),
    role: supplied?.role || 'External agent',
    model: supplied?.model || 'Unknown runtime',
    state,
    stage: event.stage || supplied?.stage || inferStage(state),
    task: event.task || supplied?.task || event.title,
    currentStep: event.detail,
    progress: clampProgress(event.progress, supplied?.progress || 0),
    progressKnown: event.progress !== undefined,
    workspace: supplied?.workspace || 'External workspace',
    branch: supplied?.branch || 'unknown',
    startedAt: supplied?.startedAt ?? event.timestamp,
    lastSeen: event.timestamp,
    capabilities: supplied?.capabilities || ['external'],
    metrics: mergeMetrics(suppliedMetrics, event.metrics),
    ...(parentAgentId ? { parentAgentId } : {}),
    ...(event.runId ? { activeRunId: event.runId } : {}),
    ...(event.sequence !== undefined ? { lastSequence: event.sequence } : {}),
  };
}

function updateAgentFromEvent(agent: Agent, event: AgentEvent): Agent {
  const sameRun =
    !event.runId || !agent.activeRunId || event.runId === agent.activeRunId;
  if (
    sameRun &&
    event.sequence !== undefined &&
    agent.lastSequence !== undefined
  ) {
    if (event.sequence <= agent.lastSequence) return agent;
  } else if (sameRun && event.timestamp < agent.lastSeen) {
    return agent;
  }

  const nextState = event.state || agent.state;
  const runChanged = Boolean(event.runId && event.runId !== agent.activeRunId);
  const taskChanged = Boolean(event.task && event.task !== agent.task);
  const isStarting =
    runChanged ||
    taskChanged ||
    ((agent.state === 'idle' ||
      agent.state === 'completed' ||
      agent.state === 'error') &&
      (nextState === 'thinking' || nextState === 'processing'));
  const completedDelta =
    event.kind === 'completion' && agent.state !== 'completed' ? 1 : 0;
  const resetProgress =
    (runChanged || taskChanged) && event.progress === undefined;

  return {
    ...agent,
    state: nextState,
    stage: event.stage || (runChanged ? inferStage(nextState) : agent.stage),
    task: event.task || agent.task,
    currentStep: event.detail || agent.currentStep,
    progress: resetProgress ? 0 : clampProgress(event.progress, agent.progress),
    progressKnown:
      event.progress !== undefined
        ? true
        : resetProgress
          ? false
          : agent.progressKnown,
    startedAt: isStarting ? event.timestamp : agent.startedAt,
    lastSeen: event.timestamp,
    metrics: mergeMetrics(
      agent.metrics,
      {
        ...event.metrics,
        ...(event.durationMs !== undefined
          ? { latencyMs: event.durationMs }
          : {}),
      },
      completedDelta,
      nextState === 'completed'
    ),
    ...(event.parentAgentId ? { parentAgentId: event.parentAgentId } : {}),
    ...(event.runId ? { activeRunId: event.runId } : {}),
    ...(event.sequence !== undefined ? { lastSequence: event.sequence } : {}),
  };
}

function ingestEvent(
  state: AgentSystemState,
  input: AgentEventInput
): AgentSystemState {
  const event = normalizeEvent(input);
  if (state.events.some(existing => existing.id === event.id)) return state;

  const exists = state.agents.some(agent => agent.id === event.agentId);
  const agents = exists
    ? state.agents.map(agent =>
        agent.id === event.agentId ? updateAgentFromEvent(agent, event) : agent
      )
    : [...state.agents, createUnknownAgent(input, event)];

  const commandResolved =
    event.commandStatus === 'accepted' || event.commandStatus === 'completed';
  const priorEvents = event.commandId
    ? state.events.map(existing =>
        existing.commandId === event.commandId && commandResolved
          ? { ...existing, acknowledged: true, resolved: true }
          : existing
      )
    : state.events;
  const pendingCommands = event.commandId
    ? state.pendingCommands.map(command =>
        command.id === event.commandId && event.commandStatus
          ? { ...command, status: event.commandStatus }
          : command
      )
    : state.pendingCommands;

  return {
    ...state,
    agents,
    selectedAgentId:
      state.selectedAgentId &&
      agents.some(agent => agent.id === state.selectedAgentId)
        ? state.selectedAgentId
        : event.agentId,
    events: [event, ...priorEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_EVENTS),
    pendingCommands,
  };
}

function handleEventAction(
  state: AgentSystemState,
  eventId: string,
  action: 'acknowledge' | 'resolve' | 'retry' | 'approve'
): AgentSystemState {
  const target = state.events.find(event => event.id === eventId);
  if (!target) return state;

  if (action === 'acknowledge' || action === 'resolve') {
    return {
      ...state,
      events: state.events.map(event =>
        event.id === eventId
          ? {
              ...event,
              acknowledged: true,
              resolved: action === 'resolve' ? true : event.resolved,
            }
          : event
      ),
    };
  }

  const isApproval = action === 'approve';
  const followUp: AgentEventInput = {
    agentId: target.agentId,
    kind: isApproval ? 'tool' : 'system',
    state: 'processing',
    stage: 'execute',
    severity: 'info',
    title: isApproval ? 'Operator approval received' : 'Operator retry started',
    detail: isApproval
      ? 'The blocked operation resumed with explicit operator approval.'
      : 'The failed operation was re-queued with a fresh retry budget.',
    progress: Math.max(5, target.progress || 0),
    source: 'operator',
    ...(target.task ? { task: target.task } : {}),
  };

  const handled = {
    ...state,
    events: state.events.map(event =>
      event.id === eventId
        ? { ...event, acknowledged: true, resolved: true }
        : event
    ),
  };
  return ingestEvent(handled, followUp);
}

export function agentSystemReducer(
  state: AgentSystemState,
  action: AgentSystemAction
): AgentSystemState {
  switch (action.type) {
    case 'INGEST_EVENT':
      return ingestEvent(state, action.event);
    case 'SELECT_AGENT':
      return state.agents.some(agent => agent.id === action.agentId)
        ? { ...state, selectedAgentId: action.agentId }
        : state;
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    case 'SET_SIMULATION':
      return { ...state, simulationEnabled: action.enabled };
    case 'SET_SOUND':
      return { ...state, soundEnabled: action.enabled };
    case 'SET_DESKTOP_ALERTS':
      return { ...state, desktopAlertsEnabled: action.enabled };
    case 'SET_CONNECTION':
      return {
        ...state,
        connection: action.connection,
        connectionSource: action.source,
        connectionLabel: action.label,
      };
    case 'HANDLE_EVENT':
      return handleEventAction(state, action.eventId, action.action);
    case 'ACKNOWLEDGE_ALL':
      return {
        ...state,
        events: state.events.map(event => ({ ...event, acknowledged: true })),
      };
    case 'CLEAR_RESOLVED':
      return {
        ...state,
        events: state.events.filter(event => !event.resolved),
      };
    case 'TOGGLE_AGENT_PAUSE':
      return {
        ...state,
        agents: state.agents.map(agent => {
          if (agent.id !== action.agentId) return agent;
          const paused = agent.state === 'waiting';
          return {
            ...agent,
            state: paused ? 'processing' : 'waiting',
            stage: 'execute',
            currentStep: paused
              ? 'Operator resumed execution'
              : 'Paused by operator',
            lastSeen: Date.now(),
          };
        }),
      };
    case 'ACTIVATE_LIVE': {
      const liveEvents = state.events.filter(event => event.source !== 'demo');
      const liveAgentIds = new Set(liveEvents.map(event => event.agentId));
      const liveAgents = state.agents.filter(agent =>
        liveAgentIds.has(agent.id)
      );
      return {
        ...state,
        agents: liveAgents,
        events: liveEvents,
        selectedAgentId: liveAgents.some(
          agent => agent.id === state.selectedAgentId
        )
          ? state.selectedAgentId
          : liveAgents[0]?.id || '',
        simulationEnabled: false,
        connection: 'connected',
        connectionSource: action.source,
        connectionLabel: action.label,
      };
    }
    case 'LINK_COMMAND':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.eventId
            ? { ...event, commandId: action.commandId, acknowledged: true }
            : event
        ),
      };
    case 'QUEUE_COMMAND':
      return {
        ...state,
        pendingCommands: [
          { ...action.command, status: 'queued' as const },
          ...state.pendingCommands.filter(
            command => command.id !== action.command.id
          ),
        ].slice(0, 50),
      };
    case 'SET_COMMAND_STATUS':
      return {
        ...state,
        pendingCommands: state.pendingCommands.map(command =>
          command.id === action.commandId
            ? { ...command, status: action.status }
            : command
        ),
      };
    default:
      return state;
  }
}

export function freshAgentSystemState(): AgentSystemState {
  return createInitialAgentSystemState();
}
