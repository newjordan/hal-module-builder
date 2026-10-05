import type { PortalEvent } from './bot';

type Step = [delayMs: number, fields: Omit<PortalEvent, 'agentId' | 'detail'>];

const tool = (name: string, title: string): Step[1] => ({
  kind: 'tool',
  state: 'processing',
  stage: 'execute',
  severity: 'info',
  tool: name,
  title,
});
const done = (name: string): Step[1] => ({
  kind: 'tool',
  state: 'thinking',
  stage: 'verify',
  severity: 'success',
  tool: name,
  title: `${name} finished`,
});
const think: Step[1] = {
  kind: 'thought',
  state: 'thinking',
  stage: 'reason',
  severity: 'trace',
  title: 'Reasoning',
};

/** A scripted coding shift that exercises every behavior. */
const STEPS: Step[] = [
  [
    0,
    {
      kind: 'message',
      state: 'thinking',
      stage: 'intake',
      severity: 'info',
      title: 'New prompt',
    },
  ],
  [1800, think],
  [4200, tool('Read', 'Read portal.ts')],
  [4800, done('Read')],
  [5200, tool('Grep', 'Grep search')],
  [5700, done('Grep')],
  [6200, tool('Glob', 'Glob search')],
  [
    6700,
    {
      kind: 'approval',
      state: 'waiting',
      stage: 'execute',
      severity: 'warning',
      title: 'Approve WebFetch?',
    },
  ],
  [9800, tool('WebFetch', 'WebFetch owl3d.com')],
  [10800, done('WebFetch')],
  [11400, think],
  [13400, tool('Bash', 'Install dependencies')],
  [15000, done('Bash')],
  [15400, tool('Edit', 'Edit bot.ts')],
  [15800, done('Edit')],
  [16100, tool('Edit', 'Edit eye.ts')],
  [16500, done('Edit')],
  [16800, tool('Write', 'Write grid shader')],
  [17200, done('Write')],
  [17500, tool('Agent', 'Review the stereo math')],
  [19500, done('Agent')],
  [20000, tool('Bash', 'Run test suite')],
  [
    22000,
    {
      kind: 'error',
      state: 'thinking',
      stage: 'verify',
      severity: 'warning',
      tool: 'Bash',
      title: 'Bash failed',
    },
  ],
  [23000, think],
  [24800, tool('Edit', 'Fix flaky assertion')],
  [25300, done('Edit')],
  [25700, tool('Bash', 'Run test suite')],
  [27600, done('Bash')],
  [
    28200,
    {
      kind: 'message',
      state: 'processing',
      stage: 'deliver',
      severity: 'info',
      title: 'Writing a reply',
    },
  ],
  [
    32500,
    {
      kind: 'completion',
      state: 'completed',
      stage: 'deliver',
      severity: 'success',
      title: 'Turn complete',
    },
  ],
];

export const DEMO_LENGTH_MS = 34_000;

export function runDemo(
  agentId: string,
  emit: (event: PortalEvent) => void
): () => void {
  const runId = Date.now();
  const timers = STEPS.map(([delay, fields], index) =>
    window.setTimeout(
      () =>
        emit({
          id: `demo-${runId}-${index}`,
          agentId,
          detail: '',
          timestamp: Date.now(),
          ...fields,
        }),
      delay
    )
  );
  return () => timers.forEach(timer => window.clearTimeout(timer));
}
