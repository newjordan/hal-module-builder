import assert from 'node:assert/strict';
import test from 'node:test';
import {
  JsonlDecoder,
  commandRejection,
  createSessionContext,
  envInt,
  isAllowedUpgrade,
  normalizeRecord,
  sanitizeVisibleText,
} from './agent-bridge.mjs';

test('redacts secret-like values from visible messages', () => {
  const raw =
    'Bearer abc.def.ghi api_key=super-secret s' +
    'k-proj-abcdefghijklmno ' +
    'A'.repeat(80);
  const sanitized = sanitizeVisibleText(raw);
  assert.doesNotMatch(sanitized, /abc\.def|super-secret|sk-proj|A{64}/);
  assert.match(sanitized, /REDACTED/);
});

test('decodes partial UTF-8 JSONL records with stable byte offsets', () => {
  const decoder = new JsonlDecoder();
  const first = Buffer.from('{"text":"signal ✓"}\n{"next":1');
  const split = first.indexOf(Buffer.from('✓')) + 1;
  assert.deepEqual(decoder.push(first.subarray(0, split), 0), []);
  const lines = decoder.push(first.subarray(split), split);
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0].text).text, 'signal ✓');
  assert.equal(lines[0].offset, 0);
  const final = decoder.push(Buffer.from('}\r\n'), first.length);
  assert.equal(JSON.parse(final[0].text).next, 1);
  assert.equal(final[0].offset, Buffer.byteLength('{"text":"signal ✓"}\n'));
});

test('normalizes reasoning and tools without forwarding private payloads', () => {
  const context = createSessionContext({
    sessionId: 'session-1',
    nickname: 'Reviewer',
    path: '/root/reviewer',
    cwd: '/workspace',
  });
  const reasoning = normalizeRecord(
    {
      timestamp: '2026-07-09T20:00:00.000Z',
      type: 'response_item',
      payload: {
        type: 'reasoning',
        encrypted_content: 'DO_NOT_LEAK',
        summary: ['DO_NOT_LEAK'],
      },
    },
    context,
    40
  );
  assert.equal(reasoning[0].kind, 'thought');
  assert.doesNotMatch(JSON.stringify(reasoning), /DO_NOT_LEAK/);

  const tools = normalizeRecord(
    {
      timestamp: '2026-07-09T20:00:02.000Z',
      type: 'response_item',
      payload: {
        type: 'custom_tool_call',
        call_id: 'call-1',
        name: 'exec_command',
        input: 'SECRET_ARGUMENT',
      },
    },
    context,
    90
  );
  assert.equal(tools[0].tool, 'exec_command');
  assert.doesNotMatch(JSON.stringify(tools), /SECRET_ARGUMENT/);
});

test('accepts exact local origins and route only', () => {
  const allowed = new Set(['http://127.0.0.1:5173']);
  assert.equal(
    isAllowedUpgrade(
      {
        url: '/hal-agent-events',
        headers: { origin: 'http://127.0.0.1:5173' },
      },
      allowed
    ),
    true
  );
  assert.equal(
    isAllowedUpgrade(
      {
        url: '/hal-agent-events?token=x',
        headers: { origin: 'http://127.0.0.1:5173' },
      },
      allowed
    ),
    false
  );
  assert.equal(
    isAllowedUpgrade(
      {
        url: '/hal-agent-events',
        headers: { origin: 'http://127.0.0.1:5173.evil' },
      },
      allowed
    ),
    false
  );
});

test('creates correlated read-only command rejection events', () => {
  const event = commandRejection(
    {
      id: 'command-1',
      agentId: 'agent-1',
      action: 'retry',
      timestamp: 1,
    },
    2
  );
  assert.equal(event.commandId, 'command-1');
  assert.equal(event.commandStatus, 'rejected');
  assert.equal(event.timestamp, 2);
});

test('falls back to defaults on malformed numeric env values', () => {
  assert.equal(envInt('750', 250), 750);
  assert.equal(envInt('not-a-number', 250), 250);
  assert.equal(envInt('', 250), 250);
  assert.equal(envInt(undefined, 8765), 8765);
});

test('rotated session files produce fresh event ids at repeated offsets', () => {
  const record = {
    timestamp: '2026-07-09T20:00:00.000Z',
    type: 'event_msg',
    payload: { type: 'task_started', turn_id: 'turn-1' },
  };
  const original = normalizeRecord(
    record,
    createSessionContext({ sessionId: 'session-1' }),
    128
  );
  const afterRotation = normalizeRecord(
    record,
    createSessionContext({ sessionId: 'session-1' }, 1),
    128
  );
  assert.ok(original[0].id);
  assert.ok(afterRotation[0].id);
  assert.notEqual(original[0].id, afterRotation[0].id);
  assert.match(afterRotation[0].id, /:r1:/);
});
