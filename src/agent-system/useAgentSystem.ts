import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  agentSystemReducer,
  createEventId,
  MAX_COMMANDS,
  MAX_EVENTS,
} from './reducer';
import { createInitialAgentSystemState } from './seed';
import type {
  AgentCommand,
  AgentCommandAction,
  AgentEventInput,
  AgentSystemState,
  ConnectionSource,
  EventAction,
  EventFilter,
} from './types';
import {
  parseAgentEventInput,
  parseCommandInput,
  parseStoredAgent,
  parseStoredCommand,
  parseStoredEvent,
} from './validation';

const STORAGE_KEY = 'hal-agent-operations-v1';
const BRIDGE_CHANNEL = 'hal-agent-events';
const COMMAND_CHANNEL = 'hal-agent-commands';
const PERSIST_DEBOUNCE_MS = 400;
const PERSIST_MAX_WAIT_MS = 5_000;

interface StoredState {
  version: 2;
  state: AgentSystemState;
}

const simulationFrames: Array<Omit<AgentEventInput, 'id' | 'timestamp'>> = [
  {
    agentId: 'codex-prime',
    kind: 'thought',
    state: 'thinking',
    stage: 'reason',
    severity: 'info',
    title: 'Feedback path evaluated',
    detail:
      'Checking that every state signal maps to an operator decision or a measurable outcome.',
    task: 'Agent notification control plane',
    progress: 51,
    source: 'demo',
  },
  {
    agentId: 'atlas',
    kind: 'tool',
    state: 'processing',
    stage: 'execute',
    severity: 'info',
    title: 'Compact viewport verified',
    detail:
      'Navigation collapsed cleanly and the attention queue moved below the primary console.',
    progress: 79,
    tool: 'viewport-check',
    durationMs: 742,
    source: 'demo',
  },
  {
    agentId: 'codex-prime',
    kind: 'tool',
    state: 'processing',
    stage: 'execute',
    severity: 'trace',
    title: 'Event reducer executing',
    detail:
      'Applying acknowledgement and agent-state transitions to the shared operation snapshot.',
    progress: 64,
    tool: 'state-engine',
    durationMs: 318,
    source: 'demo',
  },
  {
    agentId: 'atlas',
    kind: 'completion',
    state: 'completed',
    stage: 'deliver',
    severity: 'success',
    title: 'Viewport matrix complete',
    detail: 'Four responsive layouts passed overflow and interaction checks.',
    progress: 100,
    actionable: true,
    durationMs: 21_420,
    source: 'demo',
  },
  {
    agentId: 'archive',
    kind: 'message',
    state: 'thinking',
    stage: 'context',
    severity: 'info',
    title: 'Context retrieval started',
    detail:
      'Indexing the latest operation events for fast agent and task filtering.',
    task: 'Refresh operation index',
    progress: 18,
    source: 'demo',
  },
  {
    agentId: 'codex-prime',
    kind: 'completion',
    state: 'completed',
    stage: 'deliver',
    severity: 'success',
    title: 'Control plane implementation complete',
    detail:
      'The event bridge, feedback controls, and visual state system are ready for verification.',
    progress: 100,
    actionable: true,
    artifact: 'dist/',
    source: 'demo',
  },
  {
    agentId: 'forge',
    kind: 'tool',
    state: 'processing',
    stage: 'execute',
    severity: 'info',
    title: 'Build verification started',
    detail:
      'Running type-check, test suite, lint, and optimized production bundling.',
    task: 'Release candidate verification',
    progress: 24,
    tool: 'npm',
    source: 'demo',
  },
  {
    agentId: 'archive',
    kind: 'completion',
    state: 'idle',
    stage: 'deliver',
    severity: 'success',
    title: 'Operation index current',
    detail: 'All recent events are searchable and Archive returned to standby.',
    progress: 0,
    source: 'demo',
  },
];

function hydrateState(): AgentSystemState {
  const fallback = createInitialAgentSystemState();
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== 2 ||
      !('state' in parsed) ||
      typeof parsed.state !== 'object' ||
      parsed.state === null
    ) {
      return fallback;
    }
    const rawState = parsed.state as Record<string, unknown>;
    if (!Array.isArray(rawState.agents) || !Array.isArray(rawState.events)) {
      return fallback;
    }
    const agents = rawState.agents
      .map(parseStoredAgent)
      .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
    const events = rawState.events
      .map(parseStoredEvent)
      .filter((event): event is NonNullable<typeof event> => Boolean(event))
      .slice(0, MAX_EVENTS);
    const pendingCommands = Array.isArray(rawState.pendingCommands)
      ? rawState.pendingCommands
          .map(parseStoredCommand)
          .filter((command): command is NonNullable<typeof command> =>
            Boolean(command)
          )
          .slice(0, MAX_COMMANDS)
      : [];
    if (agents.length !== rawState.agents.length) return fallback;

    const selectedAgentId =
      typeof rawState.selectedAgentId === 'string' &&
      agents.some(agent => agent.id === rawState.selectedAgentId)
        ? rawState.selectedAgentId
        : agents[0]?.id || '';
    const hasLiveHistory = events.some(event => event.source !== 'demo');
    return {
      ...fallback,
      agents,
      events,
      pendingCommands,
      selectedAgentId,
      filter: ['all', 'attention', 'active', 'completed'].includes(
        rawState.filter as string
      )
        ? (rawState.filter as AgentSystemState['filter'])
        : 'all',
      simulationEnabled:
        typeof rawState.simulationEnabled === 'boolean'
          ? rawState.simulationEnabled && !hasLiveHistory
          : !hasLiveHistory,
      soundEnabled:
        typeof rawState.soundEnabled === 'boolean'
          ? rawState.soundEnabled
          : false,
      desktopAlertsEnabled:
        typeof rawState.desktopAlertsEnabled === 'boolean'
          ? rawState.desktopAlertsEnabled
          : false,
      connection: hasLiveHistory ? 'offline' : 'demo',
      connectionSource: hasLiveHistory
        ? ['document', 'broadcast', 'window', 'websocket'].includes(
            rawState.connectionSource as string
          )
          ? (rawState.connectionSource as ConnectionSource)
          : 'websocket'
        : 'demo',
      connectionLabel: hasLiveHistory
        ? 'Awaiting live source'
        : 'Local simulation',
    };
  } catch {
    return fallback;
  }
}

function shouldAlert(event: AgentEventInput): boolean {
  return (
    event.actionable === true ||
    event.severity === 'critical' ||
    event.kind === 'completion' ||
    event.kind === 'error'
  );
}

export function useAgentSystem() {
  const [state, dispatch] = useReducer(
    agentSystemReducer,
    undefined,
    hydrateState
  );
  const stateRef = useRef(state);
  const simulationIndex = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const commandChannelRef = useRef<BroadcastChannel | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const socketConfiguredRef = useRef(false);
  const queuedSocketCommands = useRef<AgentCommand[]>([]);
  const externalSourceRef = useRef(state.connection !== 'demo');
  const demoRecoveryRef = useRef(false);
  const reconnectLiveRef = useRef<(() => void) | null>(null);
  const seenEventIds = useRef(new Set(state.events.map(event => event.id)));
  const lastPersistRef = useRef(Date.now());

  useEffect(() => {
    stateRef.current = state;
    const persist = () => {
      lastPersistRef.current = Date.now();
      const stored: StoredState = { version: 2, state };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // The console remains fully functional if persistence is unavailable.
      }
    };
    const sinceLastPersist = Date.now() - lastPersistRef.current;
    const delay =
      sinceLastPersist >= PERSIST_MAX_WAIT_MS
        ? 0
        : Math.min(PERSIST_DEBOUNCE_MS, PERSIST_MAX_WAIT_MS - sinceLastPersist);
    const timer = window.setTimeout(persist, delay);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const flush = () => {
      lastPersistRef.current = Date.now();
      const stored: StoredState = { version: 2, state: stateRef.current };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // The console remains fully functional if persistence is unavailable.
      }
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  const playSignal = useCallback((severity: AgentEventInput['severity']) => {
    if (!stateRef.current.soundEnabled || severity === 'trace') return;
    try {
      const AudioContextClass = window.AudioContext;
      const context = audioContext.current || new AudioContextClass();
      audioContext.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = severity === 'critical' ? 'sawtooth' : 'sine';
      oscillator.frequency.value = severity === 'critical' ? 220 : 520;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.065,
        context.currentTime + 0.015
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.18
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch {
      // Audio feedback is optional and must never block event ingestion.
    }
  }, []);

  const notifyDesktop = useCallback((event: AgentEventInput) => {
    if (
      !stateRef.current.desktopAlertsEnabled ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      document.visibilityState === 'visible' ||
      !shouldAlert(event)
    ) {
      return;
    }
    const agent = stateRef.current.agents.find(
      item => item.id === event.agentId
    );
    const notification = new Notification(
      `${agent?.name || event.agentId}: ${event.title}`,
      {
        body: event.detail,
        icon: '/hal_lens_1.png',
        tag: event.id || `${event.agentId}-${event.kind}`,
        silent: stateRef.current.soundEnabled,
      }
    );
    notification.onclick = () => {
      window.focus();
      dispatch({ type: 'SELECT_AGENT', agentId: event.agentId });
      notification.close();
    };
  }, []);

  const activateLiveSource = useCallback(
    (label: string, source: Exclude<ConnectionSource, 'demo'>) => {
      externalSourceRef.current = true;
      demoRecoveryRef.current = false;
      dispatch({ type: 'ACTIVATE_LIVE', label, source });
    },
    []
  );

  const emit = useCallback(
    (input: AgentEventInput): string => {
      const id = input.id || createEventId(input.agentId);
      if (seenEventIds.current.has(id)) return id;
      seenEventIds.current.add(id);
      if (seenEventIds.current.size > 1_000) {
        seenEventIds.current = new Set([
          ...stateRef.current.events.map(event => event.id),
          id,
        ]);
      }
      const event = { ...input, id };
      dispatch({ type: 'INGEST_EVENT', event });
      playSignal(event.severity);
      notifyDesktop(event);
      return id;
    },
    [notifyDesktop, playSignal]
  );

  const publishCommand = useCallback(
    (
      input: Omit<AgentCommand, 'id' | 'timestamp'> &
        Partial<Pick<AgentCommand, 'id' | 'timestamp'>>
    ): string => {
      const command: AgentCommand = {
        ...input,
        id: input.id || createEventId('command'),
        timestamp: input.timestamp || Date.now(),
      };
      dispatch({ type: 'QUEUE_COMMAND', command });
      window.dispatchEvent(
        new CustomEvent<AgentCommand>('hal:agent-command', { detail: command })
      );
      commandChannelRef.current?.postMessage(command);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ type: 'agent.command', command })
        );
        dispatch({
          type: 'SET_COMMAND_STATUS',
          commandId: command.id,
          status: 'sent',
        });
      } else if (socketConfiguredRef.current) {
        queuedSocketCommands.current = [
          ...queuedSocketCommands.current.filter(
            item => item.id !== command.id
          ),
          command,
        ].slice(-50);
      }
      return command.id;
    },
    []
  );

  useEffect(() => {
    const ingestBridgeEvent = (
      value: unknown,
      label: string,
      source: 'document' | 'broadcast' | 'window'
    ): string => {
      const event = parseAgentEventInput(value, 'bridge');
      if (!event) return '';
      if (!externalSourceRef.current) activateLiveSource(label, source);
      return emit(event);
    };
    const onCustomEvent = (raw: Event) => {
      const custom = raw as CustomEvent<unknown>;
      ingestBridgeEvent(custom.detail, 'Document event bridge', 'document');
    };
    window.addEventListener('hal:agent-event', onCustomEvent);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(BRIDGE_CHANNEL);
      channel.onmessage = message => {
        ingestBridgeEvent(message.data, 'Broadcast event bridge', 'broadcast');
      };
    }

    if ('BroadcastChannel' in window) {
      commandChannelRef.current = new BroadcastChannel(COMMAND_CHANNEL);
    }

    window.HAL_AGENT_NOTIFICATIONS = {
      emit: event => ingestBridgeEvent(event, 'Window event bridge', 'window'),
      command: command => {
        const parsed = parseCommandInput(command);
        return parsed ? publishCommand(parsed) : '';
      },
      snapshot: () => stateRef.current,
      channel: BRIDGE_CHANNEL,
      commandChannel: COMMAND_CHANNEL,
    };

    return () => {
      window.removeEventListener('hal:agent-event', onCustomEvent);
      channel?.close();
      commandChannelRef.current?.close();
      commandChannelRef.current = null;
      delete window.HAL_AGENT_NOTIFICATIONS;
    };
  }, [activateLiveSource, emit, publishCommand]);

  useEffect(() => {
    const configuredSocketUrl =
      typeof __HAL_AGENT_WS_URL__ === 'string'
        ? __HAL_AGENT_WS_URL__.trim()
        : '';
    const socketUrl = configuredSocketUrl || undefined;
    if (!socketUrl) return;
    socketConfiguredRef.current = true;

    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let closed = false;
    let retries = 0;

    let socketHost = socketUrl;
    try {
      socketHost = new URL(socketUrl, window.location.href).host || socketUrl;
    } catch {
      // Keep the raw configured value as the display label.
    }

    const connect = () => {
      if (demoRecoveryRef.current) return;
      dispatch({
        type: 'SET_CONNECTION',
        connection: 'connecting',
        label: 'Connecting event stream',
        source: 'websocket',
      });
      try {
        socket = new WebSocket(socketUrl);
      } catch {
        socketConfiguredRef.current = false;
        dispatch({
          type: 'SET_CONNECTION',
          connection: 'offline',
          label: 'Invalid event stream URL',
          source: 'websocket',
        });
        return;
      }
      socketRef.current = socket;
      socket.onopen = () => {
        retries = 0;
        activateLiveSource(socketHost, 'websocket');
        for (const command of queuedSocketCommands.current) {
          socket?.send(JSON.stringify({ type: 'agent.command', command }));
          dispatch({
            type: 'SET_COMMAND_STATUS',
            commandId: command.id,
            status: 'sent',
          });
        }
        queuedSocketCommands.current = [];
      };
      socket.onmessage = message => {
        try {
          const payload: unknown = JSON.parse(message.data);
          const events = Array.isArray(payload) ? payload : [payload];
          const validEvents = events.map(event =>
            parseAgentEventInput(event, 'websocket')
          );
          if (validEvents.some(event => !event)) {
            throw new Error('Invalid event shape');
          }
          validEvents.forEach(event => {
            if (event) emit(event);
          });
        } catch {
          emit({
            agentId: 'system',
            kind: 'error',
            state: 'error',
            severity: 'warning',
            title: 'Malformed bridge event',
            detail:
              'A WebSocket payload could not be parsed as an agent event.',
            source: 'websocket',
          });
        }
      };
      socket.onclose = () => {
        socketRef.current = null;
        if (closed || demoRecoveryRef.current) return;
        retries += 1;
        dispatch({
          type: 'SET_CONNECTION',
          connection: 'offline',
          label: `Retry ${retries}`,
          source: 'websocket',
        });
        retryTimer = window.setTimeout(
          connect,
          Math.min(30_000, 1_500 * 2 ** retries)
        );
      };
      socket.onerror = () => socket?.close();
    };

    reconnectLiveRef.current = () => {
      if (closed || socketRef.current) return;
      window.clearTimeout(retryTimer);
      retries = 0;
      demoRecoveryRef.current = false;
      externalSourceRef.current = true;
      connect();
    };

    connect();
    return () => {
      closed = true;
      window.clearTimeout(retryTimer);
      socket?.close();
      socketRef.current = null;
      socketConfiguredRef.current = false;
      reconnectLiveRef.current = null;
    };
  }, [activateLiveSource, emit]);

  useEffect(() => {
    if (!state.simulationEnabled || state.connection !== 'demo') return;
    const timer = window.setInterval(() => {
      const frame =
        simulationFrames[simulationIndex.current % simulationFrames.length];
      if (!frame) return;
      simulationIndex.current += 1;
      emit({ ...frame, id: createEventId('demo'), timestamp: Date.now() });
    }, 7_500);
    return () => window.clearInterval(timer);
  }, [emit, state.connection, state.simulationEnabled]);

  useEffect(() => {
    return () => {
      void audioContext.current?.close();
    };
  }, []);

  const selectedAgent = useMemo(
    () =>
      state.agents.find(agent => agent.id === state.selectedAgentId) ||
      state.agents[0],
    [state.agents, state.selectedAgentId]
  );

  const selectedEvents = useMemo(
    () => state.events.filter(event => event.agentId === selectedAgent?.id),
    [selectedAgent?.id, state.events]
  );

  const requestDesktopAlerts = useCallback(async () => {
    if (stateRef.current.desktopAlertsEnabled) {
      dispatch({ type: 'SET_DESKTOP_ALERTS', enabled: false });
      return false;
    }
    if (typeof Notification === 'undefined') {
      emit({
        agentId: 'system',
        kind: 'system',
        severity: 'warning',
        title: 'Desktop alerts unavailable',
        detail: 'This browser does not expose the Notification API.',
        source: 'operator',
      });
      return false;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    dispatch({ type: 'SET_DESKTOP_ALERTS', enabled });
    if (!enabled) {
      emit({
        agentId: 'system',
        kind: 'system',
        severity: 'warning',
        title: 'Desktop alerts blocked',
        detail: 'Notification permission was not granted by the browser.',
        source: 'operator',
      });
    }
    return enabled;
  }, [emit]);

  const setSound = useCallback((enabled: boolean) => {
    if (enabled) {
      try {
        const context = audioContext.current || new window.AudioContext();
        audioContext.current = context;
        if (context.state === 'suspended') void context.resume();
      } catch {
        return;
      }
    }
    dispatch({ type: 'SET_SOUND', enabled });
  }, []);

  const handleEvent = useCallback(
    (eventId: string, action: EventAction) => {
      if (action === 'acknowledge' || action === 'resolve') {
        dispatch({ type: 'HANDLE_EVENT', eventId, action });
        return;
      }

      const target = stateRef.current.events.find(
        event => event.id === eventId
      );
      if (!target) return;
      const commandId = publishCommand({
        agentId: target.agentId,
        eventId,
        action,
      });
      dispatch({ type: 'LINK_COMMAND', eventId, commandId });

      if (!externalSourceRef.current) {
        window.setTimeout(() => {
          dispatch({
            type: 'SET_COMMAND_STATUS',
            commandId,
            status: 'completed',
          });
          dispatch({ type: 'HANDLE_EVENT', eventId, action });
        }, 280);
        return;
      }

      dispatch({
        type: 'HANDLE_EVENT',
        eventId,
        action: 'acknowledge',
      });
      emit({
        agentId: target.agentId,
        kind: 'system',
        severity: 'info',
        title: `Operator ${action} requested`,
        detail:
          'The command is queued across available control transports and is waiting for a correlated acknowledgement.',
        source: 'operator',
        commandId,
        ...(target.task ? { task: target.task } : {}),
      });
    },
    [emit, publishCommand]
  );

  const toggleAgentPause = useCallback(
    (agentId: string) => {
      const agent = stateRef.current.agents.find(item => item.id === agentId);
      if (!agent) return;
      const action: AgentCommandAction =
        agent.state === 'waiting' ? 'resume' : 'pause';
      const commandId = publishCommand({ agentId, action });
      if (!externalSourceRef.current) {
        dispatch({
          type: 'SET_COMMAND_STATUS',
          commandId,
          status: 'completed',
        });
        dispatch({ type: 'TOGGLE_AGENT_PAUSE', agentId });
      } else {
        emit({
          agentId,
          kind: 'system',
          severity: 'info',
          title: `Operator ${action} requested`,
          detail:
            'The command is queued across available control transports and is waiting for a correlated acknowledgement.',
          source: 'operator',
          commandId,
          task: agent.task,
        });
      }
    },
    [emit, publishCommand]
  );

  return {
    state,
    selectedAgent,
    selectedEvents,
    emit,
    selectAgent: (agentId: string) =>
      dispatch({ type: 'SELECT_AGENT', agentId }),
    setFilter: (filter: EventFilter) =>
      dispatch({ type: 'SET_FILTER', filter }),
    setSimulation: (enabled: boolean) => {
      if (externalSourceRef.current) {
        if (
          !enabled ||
          stateRef.current.connection !== 'offline' ||
          socketRef.current
        ) {
          return;
        }
        externalSourceRef.current = false;
        demoRecoveryRef.current = true;
        dispatch({
          type: 'SET_CONNECTION',
          connection: 'demo',
          source: 'demo',
          label: 'Local simulation',
        });
      }
      dispatch({ type: 'SET_SIMULATION', enabled });
    },
    liveSourceConfigured:
      typeof __HAL_AGENT_WS_URL__ === 'string' &&
      __HAL_AGENT_WS_URL__.trim() !== '',
    reconnectLive: () => reconnectLiveRef.current?.(),
    setSound,
    requestDesktopAlerts,
    handleEvent,
    acknowledgeAll: () => dispatch({ type: 'ACKNOWLEDGE_ALL' }),
    clearResolved: () => dispatch({ type: 'CLEAR_RESOLVED' }),
    toggleAgentPause,
  };
}

export type AgentSystemController = ReturnType<typeof useAgentSystem>;
