import { act, fireEvent, render, screen } from '@testing-library/react';
import { AgentConsole } from '../AgentConsole';
import type { AgentCommand } from '../../../agent-system/types';

describe('AgentConsole', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers and focuses an agent delivered through the document event bridge', () => {
    render(<AgentConsole />);

    const detail = {
      id: 'nova-started',
      agentId: 'nova',
      kind: 'thought',
      state: 'thinking',
      severity: 'info',
      title: 'Dependency plan ready',
      detail: 'Nova identified two independent implementation lanes.',
      task: 'Plan workspace changes',
      agent: {
        id: 'nova',
        name: 'Nova',
        callsign: 'NV-09',
        role: 'Planning agent',
      },
    };
    act(() => {
      window.dispatchEvent(new CustomEvent('hal:agent-event', { detail }));
      window.dispatchEvent(new CustomEvent('hal:agent-event', { detail }));
    });

    const novaRow = screen.getByRole('button', { name: /Nova NV-09/i });
    fireEvent.click(novaRow);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Nova' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Dependency plan ready')).not.toHaveLength(0);
    expect(window.HAL_AGENT_NOTIFICATIONS?.snapshot().agents).toHaveLength(1);
    expect(window.HAL_AGENT_NOTIFICATIONS?.snapshot().events).toHaveLength(1);
  });

  it('publishes approval commands and applies the deterministic demo acknowledgement', () => {
    jest.useFakeTimers();
    let command: AgentCommand | undefined;
    const listener = (event: Event) => {
      command = (event as CustomEvent<AgentCommand>).detail;
    };
    window.addEventListener('hal:agent-command', listener);

    render(<AgentConsole />);
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

    expect(command).toMatchObject({
      agentId: 'sentinel',
      action: 'approve',
      eventId: 'seed-approval',
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(
      window.HAL_AGENT_NOTIFICATIONS?.snapshot().agents.find(
        agent => agent.id === 'sentinel'
      )?.state
    ).toBe('processing');

    window.removeEventListener('hal:agent-command', listener);
  });

  it('falls back safely when persisted agent state is malformed', () => {
    localStorage.setItem(
      'hal-agent-operations-v1',
      JSON.stringify({
        version: 2,
        state: {
          agents: [{ id: 'broken', state: 'impossible' }],
          events: [],
        },
      })
    );

    expect(() => render(<AgentConsole />)).not.toThrow();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Codex Prime' })
    ).toBeInTheDocument();
  });

  it('keeps the connection indicator visible when no agent is registered', () => {
    localStorage.setItem(
      'hal-agent-operations-v1',
      JSON.stringify({
        version: 2,
        state: {
          agents: [],
          events: [
            {
              id: 'live-1',
              agentId: 'live-agent',
              kind: 'system',
              severity: 'info',
              title: 'Bridge signal',
              detail: 'A live event without a surviving agent snapshot.',
              timestamp: Date.now(),
              acknowledged: true,
              resolved: true,
              source: 'bridge',
            },
          ],
        },
      })
    );

    render(<AgentConsole />);
    expect(screen.getByText('No agents registered yet')).toBeInTheDocument();
    expect(screen.getByText(/live source is offline/i)).toBeInTheDocument();
    expect(screen.getByText('Awaiting live source')).toBeInTheDocument();
  });
});
