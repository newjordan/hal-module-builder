import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AgentEvent } from '../../../agent-system/types';
import { AttentionCenter } from '../AgentConsole';

function createAlertEvent(): AgentEvent {
  return {
    id: 'event-1',
    agentId: 'agent-1',
    kind: 'approval',
    severity: 'warning',
    title: 'Approval required',
    detail: 'The agent is waiting for an operator decision.',
    timestamp: 1_000,
    actionable: true,
    acknowledged: false,
    resolved: false,
    source: 'demo',
  };
}

describe('AttentionCenter', () => {
  it('exposes feed focus as a keyboard-reachable button without nested interactives', async () => {
    const onSelectAgent = jest.fn();
    const onSelectEvent = jest.fn();
    render(
      <AttentionCenter
        agents={[]}
        events={[createAlertEvent()]}
        selectedEventId={null}
        onSelectAgent={onSelectAgent}
        onSelectEvent={onSelectEvent}
        onHandleEvent={jest.fn()}
        onAcknowledgeAll={jest.fn()}
        onClearResolved={jest.fn()}
        pendingCommands={[]}
        now={2_000}
      />
    );

    const card = screen.getByRole('group', {
      name: /agent-1: Approval required/,
    });
    expect(card).not.toHaveAttribute('role', 'button');

    const focusButton = screen.getByRole('button', {
      name: 'Approval required',
    });
    focusButton.focus();
    expect(focusButton).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onSelectAgent).toHaveBeenCalledWith('agent-1');
    expect(onSelectEvent).toHaveBeenCalledWith('event-1');
  });
});
