import assert from 'node:assert/strict';
import { mkdtemp, mkdir, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createClaudeContext,
  discoverClaudeSessions,
  encodeClaudeProject,
  normalizeClaudeRecord,
} from './claude-code-source.mjs';

const at = '2026-10-05T12:00:00.000Z';

function assistant(content, extra = {}) {
  return {
    type: 'assistant',
    timestamp: at,
    cwd: '/work/hal-module-builder',
    gitBranch: 'owl3d',
    message: { model: 'claude-opus-5-5', content, ...extra },
  };
}

test('maps a full Claude Code turn onto the HAL lifecycle', () => {
  const context = createClaudeContext({ sessionId: 'abc12345-session' });
  const prompt = normalizeClaudeRecord(
    { type: 'user', timestamp: at, message: { content: 'please fix the tests' } },
    context,
    0
  );
  assert.equal(prompt.length, 1);
  assert.equal(prompt[0].kind, 'message');
  assert.equal(prompt[0].state, 'thinking');
  assert.equal(prompt[0].stage, 'intake');

  const thinking = normalizeClaudeRecord(
    assistant([{ type: 'thinking', thinking: 'secret plan' }]),
    context,
    10
  );
  assert.equal(thinking[0].kind, 'thought');

  const tool = normalizeClaudeRecord(
    assistant(
      [
        {
          type: 'tool_use',
          id: 'toolu_1',
          name: 'Bash',
          input: { command: 'cat ~/.ssh/id_rsa', description: 'Run the test suite' },
        },
      ],
      { usage: { input_tokens: 1000, cache_read_input_tokens: 9000, output_tokens: 50 } }
    ),
    context,
    20
  );
  assert.equal(tool[0].kind, 'tool');
  assert.equal(tool[0].state, 'processing');
  assert.equal(tool[0].tool, 'Bash');
  assert.equal(tool[0].title, 'Run the test suite');
  assert.deepEqual(tool[0].metrics, { tokensUsed: 10050, contextWindow: 200000 });

  const result = normalizeClaudeRecord(
    {
      type: 'user',
      timestamp: '2026-10-05T12:00:02.500Z',
      message: { content: [{ type: 'tool_result', tool_use_id: 'toolu_1', is_error: true, content: 'boom' }] },
    },
    context,
    30
  );
  assert.equal(result[0].kind, 'error');
  assert.equal(result[0].title, 'Bash failed');
  assert.equal(result[0].durationMs, 2500);

  const done = normalizeClaudeRecord(
    assistant([{ type: 'text', text: 'All green.' }], { stop_reason: 'end_turn' }),
    context,
    40
  );
  assert.deepEqual(
    done.map(event => event.kind),
    ['message', 'completion']
  );
  assert.equal(done[1].state, 'completed');
  assert.equal(done[1].agent.metrics.tasksCompleted, 1);
  assert.equal(done[1].agent.branch, 'owl3d');
  assert.equal(done[1].agent.workspace, 'hal-module-builder');
});

test('never forwards prompts, reasoning, tool arguments, or tool output', () => {
  const context = createClaudeContext({ sessionId: 'privacy-session' });
  const records = [
    { type: 'user', timestamp: at, message: { content: 'my password is hunter2' } },
    assistant([{ type: 'thinking', thinking: 'the password is hunter2' }]),
    assistant([
      { type: 'tool_use', id: 't', name: 'Read', input: { file_path: '/etc/hunter2' } },
    ]),
    {
      type: 'user',
      timestamp: at,
      message: { content: [{ type: 'tool_result', tool_use_id: 't', content: 'hunter2' }] },
    },
    assistant([{ type: 'text', text: 'hunter2 is set' }]),
  ];
  const events = records.flatMap((record, i) => normalizeClaudeRecord(record, context, i));
  assert.ok(events.length >= 5);
  assert.doesNotMatch(JSON.stringify(events), /hunter2/);
});

test('ignores sidechains, meta records and slash-command plumbing', () => {
  const context = createClaudeContext({ sessionId: 's' });
  const ignored = [
    { type: 'user', isSidechain: true, message: { content: 'sub-agent prompt' } },
    { type: 'user', isMeta: true, message: { content: 'caveat' } },
    { type: 'user', message: { content: '<command-name>/login</command-name>' } },
    { type: 'user', message: { content: '<local-command-stdout>ok</local-command-stdout>' } },
    { type: 'attachment' },
    null,
  ];
  for (const record of ignored) assert.deepEqual(normalizeClaudeRecord(record, context, 0), []);
});

test('event ids are stable per byte offset and namespaced per session', () => {
  const record = assistant([{ type: 'thinking', thinking: '' }]);
  const a = normalizeClaudeRecord(record, createClaudeContext({ sessionId: 'one' }), 77);
  const b = normalizeClaudeRecord(record, createClaudeContext({ sessionId: 'one' }), 77);
  const c = normalizeClaudeRecord(record, createClaudeContext({ sessionId: 'two' }), 77);
  assert.equal(a[0].id, b[0].id);
  assert.notEqual(a[0].id, c[0].id);
  assert.equal(a[0].agentId, 'claude:one');
});

test('discovers recent sessions for one workspace or all of them', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'hal-claude-'));
  const mine = encodeClaudeProject('/work/hal-module-builder');
  assert.equal(mine, '-work-hal-module-builder');
  await mkdir(path.join(root, mine));
  await mkdir(path.join(root, '-work-other'));
  await writeFile(path.join(root, mine, 'fresh.jsonl'), '{}\n');
  await writeFile(path.join(root, '-work-other', 'other.jsonl'), '{}\n');
  await writeFile(path.join(root, mine, 'stale.jsonl'), '{}\n');
  const old = new Date(Date.now() - 3 * 60 * 60 * 1000);
  await utimes(path.join(root, mine, 'stale.jsonl'), old, old);
  const cutoff = Date.now() - 60 * 60 * 1000;

  const scoped = await discoverClaudeSessions('/work/hal-module-builder', cutoff, root);
  assert.deepEqual(
    scoped.map(entry => entry.metadata.sessionId),
    ['fresh']
  );
  const everywhere = await discoverClaudeSessions('*', cutoff, root);
  assert.deepEqual(
    everywhere.map(entry => entry.metadata.sessionId).sort(),
    ['fresh', 'other']
  );
});
