import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { appendLine, makeLine, readNew } from './hal-voice.mjs';

const tempFile = () => path.join(mkdtempSync(path.join(os.tmpdir(), 'hal-voice-')), 'inbox.jsonl');

test('reads only lines appended since the cursor', () => {
  const file = tempFile();
  appendLine(file, makeLine('first'));
  let { lines, cursor } = readNew(file);
  assert.deepEqual(
    lines.map(line => line.text),
    ['first']
  );
  appendLine(file, makeLine('second'));
  appendLine(file, makeLine('third', { agentId: 'claude:abc' }));
  ({ lines, cursor } = readNew(file, cursor));
  assert.deepEqual(
    lines.map(line => [line.text, line.agentId]),
    [
      ['second', undefined],
      ['third', 'claude:abc'],
    ]
  );
  assert.deepEqual(readNew(file, cursor).lines, []);
});

test('holds a half-written line until it is complete', () => {
  const file = tempFile();
  writeFileSync(file, '{"text":"open the pod');
  let { lines, cursor } = readNew(file);
  assert.deepEqual(lines, []);
  appendFileSync(file, ' bay doors"}\n');
  ({ lines, cursor } = readNew(file, cursor));
  assert.equal(lines[0]?.text, 'open the pod bay doors');
  assert.equal(cursor.carry, '');
});

test('skips foreign lines and starts over when the file is truncated', () => {
  const file = tempFile();
  writeFileSync(file, 'not json\n{"nope":1}\n{"text":"  "}\n{"text":"kept"}\n');
  let { lines, cursor } = readNew(file);
  assert.deepEqual(
    lines.map(line => line.text),
    ['kept']
  );
  writeFileSync(file, '{"text":"fresh"}\n');
  ({ lines, cursor } = readNew(file, cursor));
  assert.deepEqual(
    lines.map(line => line.text),
    ['fresh']
  );
});

test('a missing file yields nothing', () => {
  assert.deepEqual(readNew(path.join(os.tmpdir(), 'hal-voice-missing', 'x.jsonl')).lines, []);
});
