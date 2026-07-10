import { act, renderHook } from '@testing-library/react';
import { agentSystemReducer, MAX_EVENTS } from '../reducer';
import type { AgentEventInput, AgentSystemState } from '../types';
import { useAgentSystem } from '../useAgentSystem';

const STORAGE_KEY = 'hal-agent-operations-v1';

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

function createLiveEvent(
  overrides: Partial<AgentEventInput> = {}
): AgentEventInput {
  return {
    id: 'live-event-1',
    agentId: 'live-agent',
    kind: 'tool',
    state: 'processing',
    severity: 'info',
    title: 'Tool started',
    detail: 'The agent started a focused operation.',
    timestamp: 1_000,
    progress: 25,
    task: 'Verify hydration',
    source: 'bridge',
    ...overrides,
  };
}

function seedStoredState(state: AgentSystemState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, state }));
}

function liveState(): AgentSystemState {
  return agentSystemReducer(createEmptyState(), {
    type: 'INGEST_EVENT',
    event: createLiveEvent(),
  });
}

describe('useAgentSystem', () => {
  afterEach(() => {
    localStorage.clear();
    delete (globalThis as Record<string, unknown>).__HAL_AGENT_WS_URL__;
    delete (globalThis as Record<string, unknown>).WebSocket;
    delete (window as unknown as Record<string, unknown>).WebSocket;
  });

  it('caps hydrated events and pending commands at the ingest limits', () => {
    const base = liveState();
    const template = base.events[0];
    seedStoredState({
      ...base,
      events: Array.from({ length: MAX_EVENTS + 80 }, (_, index) => ({
        ...template,
        id: `stored-event-${index}`,
        timestamp: 1_000 + index,
      })),
      pendingCommands: Array.from({ length: 80 }, (_, index) => ({
        id: `stored-command-${index}`,
        agentId: 'live-agent',
        action: 'retry' as const,
        timestamp: 1_000 + index,
        status: 'queued' as const,
      })),
    });

    const { result, unmount } = renderHook(() => useAgentSystem());
    expect(result.current.state.events.length).toBeLessThanOrEqual(MAX_EVENTS);
    expect(result.current.state.pendingCommands.length).toBeLessThanOrEqual(50);
    unmount();
  });

  it('hydrates live history as offline and recovers back to demo mode', () => {
    seedStoredState(liveState());

    const { result, unmount } = renderHook(() => useAgentSystem());
    expect(result.current.state.connection).toBe('offline');
    expect(result.current.state.simulationEnabled).toBe(false);

    act(() => {
      result.current.setSimulation(true);
    });
    expect(result.current.state.connection).toBe('demo');
    expect(result.current.state.simulationEnabled).toBe(true);
    unmount();
  });

  it('keeps demo mode after recovery despite pending WebSocket retries', () => {
    jest.useFakeTimers();
    seedStoredState(liveState());
    (globalThis as Record<string, unknown>).__HAL_AGENT_WS_URL__ =
      'ws://127.0.0.1:8765/agents';

    class FakeWebSocket {
      static OPEN = 1;
      static instances: FakeWebSocket[] = [];
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((message: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      readyState = 0;
      constructor() {
        FakeWebSocket.instances.push(this);
      }
      send(): void {}
      close(): void {
        this.onclose?.();
      }
    }
    (window as unknown as Record<string, unknown>).WebSocket = FakeWebSocket;
    (globalThis as Record<string, unknown>).WebSocket = FakeWebSocket;

    const { result, unmount } = renderHook(() => useAgentSystem());
    expect(result.current.state.connection).toBe('connecting');

    act(() => {
      FakeWebSocket.instances[0]?.onclose?.();
    });
    expect(result.current.state.connection).toBe('offline');

    act(() => {
      result.current.setSimulation(true);
    });
    expect(result.current.state.connection).toBe('demo');

    act(() => {
      jest.advanceTimersByTime(120_000);
    });
    expect(result.current.state.connection).toBe('demo');
    expect(FakeWebSocket.instances.length).toBe(1);

    unmount();
    jest.useRealTimers();
  });

  it('reconnects the live WebSocket source on demand after demo recovery', () => {
    jest.useFakeTimers();
    seedStoredState(liveState());
    (globalThis as Record<string, unknown>).__HAL_AGENT_WS_URL__ =
      'ws://127.0.0.1:8765/agents';

    class FakeWebSocket {
      static OPEN = 1;
      static instances: FakeWebSocket[] = [];
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((message: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      readyState = 0;
      constructor() {
        FakeWebSocket.instances.push(this);
      }
      send(): void {}
      close(): void {
        this.onclose?.();
      }
    }
    (window as unknown as Record<string, unknown>).WebSocket = FakeWebSocket;
    (globalThis as Record<string, unknown>).WebSocket = FakeWebSocket;

    const { result, unmount } = renderHook(() => useAgentSystem());
    expect(result.current.liveSourceConfigured).toBe(true);

    act(() => {
      FakeWebSocket.instances[0]?.onclose?.();
    });
    act(() => {
      result.current.setSimulation(true);
    });
    expect(result.current.state.connection).toBe('demo');

    act(() => {
      result.current.reconnectLive();
    });
    expect(result.current.state.connection).toBe('connecting');
    expect(FakeWebSocket.instances.length).toBe(2);

    act(() => {
      FakeWebSocket.instances[1]?.onopen?.();
    });
    expect(result.current.state.connection).toBe('connected');
    expect(result.current.state.connectionSource).toBe('websocket');

    act(() => {
      result.current.reconnectLive();
    });
    expect(FakeWebSocket.instances.length).toBe(2);

    unmount();
    jest.useRealTimers();
  });

  it('returns to demo mode with simulation enabled when reconnect-live fails', () => {
    jest.useFakeTimers();
    seedStoredState(liveState());
    (globalThis as Record<string, unknown>).__HAL_AGENT_WS_URL__ =
      'ws://127.0.0.1:8765/agents';

    class FakeWebSocket {
      static OPEN = 1;
      static instances: FakeWebSocket[] = [];
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((message: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      readyState = 0;
      constructor() {
        FakeWebSocket.instances.push(this);
      }
      send(): void {}
      close(): void {
        this.onclose?.();
      }
    }
    (window as unknown as Record<string, unknown>).WebSocket = FakeWebSocket;
    (globalThis as Record<string, unknown>).WebSocket = FakeWebSocket;

    const { result, unmount } = renderHook(() => useAgentSystem());
    act(() => {
      FakeWebSocket.instances[0]?.onclose?.();
    });
    act(() => {
      result.current.setSimulation(true);
    });
    expect(result.current.state.connection).toBe('demo');

    act(() => {
      result.current.reconnectLive();
    });
    expect(result.current.state.connection).toBe('connecting');

    act(() => {
      FakeWebSocket.instances[1]?.onclose?.();
    });
    expect(result.current.state.connection).toBe('demo');
    expect(result.current.state.simulationEnabled).toBe(true);

    act(() => {
      jest.advanceTimersByTime(120_000);
    });
    expect(result.current.state.connection).toBe('demo');
    expect(FakeWebSocket.instances.length).toBe(2);

    act(() => {
      result.current.reconnectLive();
    });
    expect(result.current.state.connection).toBe('connecting');
    act(() => {
      FakeWebSocket.instances[2]?.onopen?.();
    });
    expect(result.current.state.connection).toBe('connected');

    unmount();
    jest.useRealTimers();
  });

  it('returns to demo mode when reconnect-live throws on construction', () => {
    jest.useFakeTimers();
    seedStoredState(liveState());
    (globalThis as Record<string, unknown>).__HAL_AGENT_WS_URL__ =
      'ws://127.0.0.1:8765/agents';

    class FlakyWebSocket {
      static OPEN = 1;
      static count = 0;
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((message: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      readyState = 0;
      static instances: FlakyWebSocket[] = [];
      constructor() {
        FlakyWebSocket.count += 1;
        if (FlakyWebSocket.count > 1) {
          throw new SyntaxError('invalid websocket url');
        }
        FlakyWebSocket.instances.push(this);
      }
      send(): void {}
      close(): void {
        this.onclose?.();
      }
    }
    (window as unknown as Record<string, unknown>).WebSocket = FlakyWebSocket;
    (globalThis as Record<string, unknown>).WebSocket = FlakyWebSocket;

    const { result, unmount } = renderHook(() => useAgentSystem());
    act(() => {
      FlakyWebSocket.instances[0]?.onclose?.();
    });
    act(() => {
      result.current.setSimulation(true);
    });
    expect(result.current.state.connection).toBe('demo');

    act(() => {
      result.current.reconnectLive();
    });
    expect(result.current.state.connection).toBe('demo');
    expect(result.current.state.simulationEnabled).toBe(true);

    unmount();
    jest.useRealTimers();
  });

  it('always allows switching the simulation toggle off with an external source', () => {
    jest.useFakeTimers();
    seedStoredState(liveState());
    (globalThis as Record<string, unknown>).__HAL_AGENT_WS_URL__ =
      'ws://127.0.0.1:8765/agents';

    class FakeWebSocket {
      static OPEN = 1;
      static instances: FakeWebSocket[] = [];
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((message: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      readyState = 0;
      constructor() {
        FakeWebSocket.instances.push(this);
      }
      send(): void {}
      close(): void {
        this.onclose?.();
      }
    }
    (window as unknown as Record<string, unknown>).WebSocket = FakeWebSocket;
    (globalThis as Record<string, unknown>).WebSocket = FakeWebSocket;

    const { result, unmount } = renderHook(() => useAgentSystem());
    act(() => {
      FakeWebSocket.instances[0]?.onclose?.();
    });
    act(() => {
      result.current.setSimulation(true);
    });
    act(() => {
      result.current.reconnectLive();
    });
    expect(result.current.state.connection).toBe('connecting');
    expect(result.current.state.simulationEnabled).toBe(true);

    act(() => {
      result.current.setSimulation(false);
    });
    expect(result.current.state.simulationEnabled).toBe(false);

    act(() => {
      FakeWebSocket.instances[1]?.onclose?.();
    });
    act(() => {
      result.current.setSimulation(true);
    });
    expect(result.current.state.simulationEnabled).toBe(true);
    expect(result.current.state.connection).toBe('demo');

    unmount();
    jest.useRealTimers();
  });

  it('persists within the max-wait bound under a sustained event stream', () => {
    jest.useFakeTimers();
    seedStoredState(createEmptyState());
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    const { result, unmount } = renderHook(() => useAgentSystem());
    act(() => {
      jest.advanceTimersByTime(400);
    });
    setItemSpy.mockClear();

    for (let index = 0; index < 20; index += 1) {
      act(() => {
        result.current.emit(
          createLiveEvent({
            id: `stream-${index}`,
            timestamp: 1_000 + index,
            source: 'demo',
          })
        );
      });
      act(() => {
        jest.advanceTimersByTime(300);
      });
    }

    expect(setItemSpy.mock.calls.some(call => call[0] === STORAGE_KEY)).toBe(
      true
    );

    setItemSpy.mockRestore();
    unmount();
    jest.useRealTimers();
  });

  it('survives a WebSocket constructor throw on a malformed configured URL', () => {
    (globalThis as Record<string, unknown>).__HAL_AGENT_WS_URL__ =
      'http://[malformed';
    class ThrowingWebSocket {
      static OPEN = 1;
      constructor() {
        throw new SyntaxError('invalid websocket url');
      }
    }
    (window as unknown as Record<string, unknown>).WebSocket =
      ThrowingWebSocket;
    (globalThis as Record<string, unknown>).WebSocket = ThrowingWebSocket;

    const { result, unmount } = renderHook(() => useAgentSystem());
    expect(result.current.state.connection).toBe('offline');
    expect(result.current.state.connectionLabel).toBe(
      'Invalid event stream URL'
    );
    expect(result.current.liveSourceConfigured).toBe(false);
    unmount();
  });
});
