import { parseAgentEventInput, parseStoredAgent } from '../validation';
import { createDemoAgents } from '../seed';

describe('agent event validation', () => {
  const validEvent = {
    agentId: 'agent-1',
    kind: 'tool',
    state: 'processing',
    stage: 'execute',
    severity: 'info',
    title: 'Tool running',
    detail: 'The agent started a safe operation.',
  };

  it('rejects invalid durable state and malformed nested metrics', () => {
    expect(
      parseAgentEventInput({ ...validEvent, state: 'teleporting' }, 'bridge')
    ).toBeNull();
    expect(
      parseAgentEventInput(
        {
          ...validEvent,
          agent: {
            id: 'agent-1',
            name: 'Agent One',
            metrics: { successRate: 'perfect' },
          },
        },
        'bridge'
      )
    ).toBeNull();
  });

  it('strips unknown fields and clamps far-future timestamps', () => {
    const event = parseAgentEventInput(
      {
        ...validEvent,
        timestamp: 99_999,
        unsafePayload: 'not retained',
      },
      'websocket',
      1_000
    );

    expect(event).toMatchObject({
      source: 'websocket',
      timestamp: 61_000,
    });
    expect(event).not.toHaveProperty('unsafePayload');
  });

  it('accepts complete persisted agents and rejects corrupt snapshots', () => {
    const agent = createDemoAgents(1_000)[0]!;
    expect(parseStoredAgent(agent)).toEqual(agent);
    expect(
      parseStoredAgent({ ...agent, capabilities: 'not-an-array' })
    ).toBeNull();
    expect(
      parseStoredAgent({
        ...agent,
        metrics: { ...agent?.metrics, successRate: 'unknown' },
      })
    ).toBeNull();
  });
});
