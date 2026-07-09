import { agentSystemReducer } from '../reducer';
import { createInitialAgentSystemState } from '../seed';
import type { AgentEventInput, AgentSystemState } from '../types';

function createEmptyState(): AgentSystemState {
  return {
    agents: [],
    events: [],
    selectedAgentId: '',
    filter: 'all',
    simulationEnabled: false,
    soundEnabled: false,
    desktopAlertsEnabled: false,
    connection: 'demo',
    connectionSource: 'demo',
    connectionLabel: 'Test bridge',
    pendingCommands: [],
  };
}

function createEvent(
  overrides: Partial<AgentEventInput> = {}
): AgentEventInput {
  return {
    id: 'event-1',
    agentId: 'agent-1',
    kind: 'tool',
    state: 'processing',
    severity: 'info',
    title: 'Tool started',
    detail: 'The agent started a focused operation.',
    timestamp: 1_000,
    progress: 25,
    task: 'Verify the reducer',
    ...overrides,
  };
}

function ingest(
  state: AgentSystemState,
  event: AgentEventInput
): AgentSystemState {
  return agentSystemReducer(state, { type: 'INGEST_EVENT', event });
}

describe('agentSystemReducer', () => {
  it('ingests, normalizes, sorts, and deduplicates events by ID', () => {
    const first = ingest(
      createEmptyState(),
      createEvent({ id: 'shared-id', timestamp: 1_000 })
    );
    const second = ingest(
      first,
      createEvent({
        id: 'newer-id',
        timestamp: 2_000,
        title: 'Newer operation',
      })
    );

    expect(second.events.map(event => event.id)).toEqual([
      'newer-id',
      'shared-id',
    ]);
    expect(second.events[0]).toMatchObject({
      acknowledged: false,
      resolved: false,
      source: 'bridge',
    });

    const duplicate = ingest(
      second,
      createEvent({
        id: 'shared-id',
        timestamp: 3_000,
        title: 'Duplicate delivery',
      })
    );

    expect(duplicate).toBe(second);
    expect(duplicate.events).toHaveLength(2);
    expect(
      duplicate.events.find(event => event.id === 'shared-id')?.title
    ).toBe('Tool started');
  });

  it('registers an unknown agent from supplied metadata and event state', () => {
    const state = ingest(
      createEmptyState(),
      createEvent({
        id: 'external-event',
        agentId: 'external-9',
        state: 'thinking',
        progress: 132,
        durationMs: 840,
        task: 'Inspect an external workspace',
        agent: {
          id: 'external-9',
          name: 'External Nine',
          callsign: 'EX-09',
          role: 'Remote reviewer',
          model: 'External runtime',
          workspace: '/workspace/external',
          branch: 'review/events',
          capabilities: ['review', 'events'],
        },
      })
    );

    expect(state.agents).toHaveLength(1);
    expect(state.agents[0]).toMatchObject({
      id: 'external-9',
      name: 'External Nine',
      callsign: 'EX-09',
      role: 'Remote reviewer',
      model: 'External runtime',
      state: 'thinking',
      task: 'Inspect an external workspace',
      currentStep: 'The agent started a focused operation.',
      progress: 100,
      workspace: '/workspace/external',
      branch: 'review/events',
      startedAt: 1_000,
      lastSeen: 1_000,
      capabilities: ['review', 'events'],
    });
    expect(state.agents[0].metrics).toMatchObject({
      latencyMs: 840,
      tasksCompleted: 0,
      queueDepth: 0,
    });
  });

  it('acknowledges an event without resolving it, then resolves it', () => {
    const ingested = ingest(
      createEmptyState(),
      createEvent({ id: 'attention-event', actionable: true })
    );

    const acknowledged = agentSystemReducer(ingested, {
      type: 'HANDLE_EVENT',
      eventId: 'attention-event',
      action: 'acknowledge',
    });
    expect(acknowledged.events[0]).toMatchObject({
      acknowledged: true,
      resolved: false,
    });

    const resolved = agentSystemReducer(acknowledged, {
      type: 'HANDLE_EVENT',
      eventId: 'attention-event',
      action: 'resolve',
    });
    expect(resolved.events[0]).toMatchObject({
      acknowledged: true,
      resolved: true,
    });
  });

  it('resolves an error and creates an operator retry event', () => {
    const ingested = ingest(
      createEmptyState(),
      createEvent({
        id: 'failed-event',
        kind: 'error',
        state: 'error',
        severity: 'critical',
        title: 'Bridge failed',
        progress: 31,
        actionable: true,
      })
    );

    const retried = agentSystemReducer(ingested, {
      type: 'HANDLE_EVENT',
      eventId: 'failed-event',
      action: 'retry',
    });
    const original = retried.events.find(event => event.id === 'failed-event');
    const followUp = retried.events.find(event => event.source === 'operator');

    expect(original).toMatchObject({ acknowledged: true, resolved: true });
    expect(followUp).toMatchObject({
      agentId: 'agent-1',
      kind: 'system',
      state: 'processing',
      severity: 'info',
      title: 'Operator retry started',
      progress: 31,
      task: 'Verify the reducer',
      acknowledged: false,
      resolved: false,
    });
    expect(retried.agents[0]).toMatchObject({
      state: 'processing',
      currentStep:
        'The failed operation was re-queued with a fresh retry budget.',
      progress: 31,
    });
  });

  it('resolves an approval request and resumes processing with a minimum progress', () => {
    const ingested = ingest(
      createEmptyState(),
      createEvent({
        id: 'approval-event',
        kind: 'approval',
        state: 'waiting',
        severity: 'warning',
        title: 'Approval required',
        progress: 0,
        actionable: true,
      })
    );

    const approved = agentSystemReducer(ingested, {
      type: 'HANDLE_EVENT',
      eventId: 'approval-event',
      action: 'approve',
    });
    const original = approved.events.find(
      event => event.id === 'approval-event'
    );
    const followUp = approved.events.find(event => event.source === 'operator');

    expect(original).toMatchObject({ acknowledged: true, resolved: true });
    expect(followUp).toMatchObject({
      agentId: 'agent-1',
      kind: 'tool',
      state: 'processing',
      severity: 'info',
      title: 'Operator approval received',
      progress: 5,
      acknowledged: false,
      resolved: false,
    });
    expect(approved.agents[0]).toMatchObject({
      state: 'processing',
      currentStep:
        'The blocked operation resumed with explicit operator approval.',
      progress: 5,
    });
  });

  it('rounds and clamps agent progress while preserving the last finite value', () => {
    let state = ingest(
      createEmptyState(),
      createEvent({ id: 'progress-high', progress: 140.8 })
    );
    expect(state.agents[0].progress).toBe(100);

    state = ingest(
      state,
      createEvent({ id: 'progress-low', timestamp: 2_000, progress: -12 })
    );
    expect(state.agents[0].progress).toBe(0);

    state = ingest(
      state,
      createEvent({ id: 'progress-rounded', timestamp: 3_000, progress: 49.6 })
    );
    expect(state.agents[0].progress).toBe(50);

    state = ingest(
      state,
      createEvent({
        id: 'progress-non-finite',
        timestamp: 4_000,
        progress: Number.POSITIVE_INFINITY,
      })
    );
    expect(state.agents[0].progress).toBe(50);
  });

  it('retains late events without letting them regress the current agent snapshot', () => {
    let state = ingest(
      createEmptyState(),
      createEvent({
        id: 'current-event',
        timestamp: 5_000,
        state: 'processing',
        detail: 'Current execution step',
        progress: 72,
      })
    );

    state = ingest(
      state,
      createEvent({
        id: 'late-event',
        timestamp: 2_000,
        state: 'thinking',
        detail: 'Delayed reasoning update',
        progress: 18,
      })
    );

    expect(state.events.map(event => event.id)).toEqual([
      'current-event',
      'late-event',
    ]);
    expect(state.agents[0]).toMatchObject({
      state: 'processing',
      currentStep: 'Current execution step',
      progress: 72,
      lastSeen: 5_000,
    });
  });

  it('uses sequence ordering within a run and resets progress for a new run', () => {
    let state = ingest(
      createEmptyState(),
      createEvent({
        id: 'run-a-4',
        timestamp: 2_000,
        runId: 'run-a',
        sequence: 4,
        progress: 80,
      })
    );
    state = ingest(
      state,
      createEvent({
        id: 'run-a-3',
        timestamp: 3_000,
        runId: 'run-a',
        sequence: 3,
        state: 'thinking',
        progress: 20,
      })
    );
    expect(state.agents[0]).toMatchObject({
      state: 'processing',
      progress: 80,
      lastSequence: 4,
    });

    const nextRun = createEvent({
      id: 'run-b-start',
      timestamp: 4_000,
      runId: 'run-b',
      sequence: 1,
      state: 'thinking',
      task: 'A new run without determinate progress',
    });
    delete nextRun.progress;
    state = ingest(state, nextRun);
    expect(state.agents[0]).toMatchObject({
      activeRunId: 'run-b',
      progress: 0,
      progressKnown: false,
      lastSequence: 1,
    });
  });

  it('links live commands and resolves their source event on correlated acceptance', () => {
    let state = ingest(
      createEmptyState(),
      createEvent({
        id: 'approval-source',
        kind: 'approval',
        state: 'waiting',
        actionable: true,
      })
    );
    const command = {
      id: 'command-1',
      agentId: 'agent-1',
      eventId: 'approval-source',
      action: 'approve' as const,
      timestamp: 2_000,
    };
    state = agentSystemReducer(state, { type: 'QUEUE_COMMAND', command });
    state = agentSystemReducer(state, {
      type: 'LINK_COMMAND',
      eventId: 'approval-source',
      commandId: 'command-1',
    });
    state = ingest(
      state,
      createEvent({
        id: 'command-accepted',
        timestamp: 3_000,
        state: 'processing',
        commandId: 'command-1',
        commandStatus: 'accepted',
      })
    );

    expect(
      state.events.find(event => event.id === 'approval-source')
    ).toMatchObject({ acknowledged: true, resolved: true });
    expect(state.pendingCommands[0]).toMatchObject({
      id: 'command-1',
      status: 'accepted',
    });
  });

  it('removes demo telemetry before ingesting a live source', () => {
    let state = agentSystemReducer(createInitialAgentSystemState(1_000), {
      type: 'ACTIVATE_LIVE',
      label: 'Document event bridge',
      source: 'document',
    });
    expect(state.agents).toHaveLength(0);
    expect(state.events).toHaveLength(0);
    expect(state).toMatchObject({
      connection: 'connected',
      connectionSource: 'document',
      simulationEnabled: false,
    });

    state = ingest(
      state,
      createEvent({
        id: 'live-agent-event',
        agentId: 'live-agent',
        source: 'bridge',
        agent: { id: 'live-agent', name: 'Live Agent' },
      })
    );
    expect(state.agents.map(agent => agent.id)).toEqual(['live-agent']);
    expect(state.events.map(event => event.source)).toEqual(['bridge']);
  });
});
