#!/usr/bin/env node
/**
 * Connect an agent session to HAL's voice.
 *
 *   hal-voice listen              print each thing you say to HAL, one line
 *                                 per utterance, as it is heard (run this
 *                                 as an agent's event monitor, unfiltered)
 *   hal-voice say <text…>         HAL speaks <text> through the speakers
 *   hal-voice say --agent <id> …  …as the bot for that agent session
 *   hal-voice heard <text…>       pretend you said <text> (testing)
 *
 * The Owl3D shell writes transcripts to the inbox and speaks the outbox
 * (both JSON lines in ~/.hal/voice, or HAL_VOICE_DIR). Nothing leaves the
 * machine.
 */
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readSync, statSync, writeSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const VOICE_DIR = process.env.HAL_VOICE_DIR || path.join(os.homedir(), '.hal', 'voice');
export const INBOX = path.join(VOICE_DIR, 'inbox.jsonl');
export const OUTBOX = path.join(VOICE_DIR, 'outbox.jsonl');

export function makeLine(text, extra = {}) {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    text,
    ...extra,
  };
}

export function appendLine(file, line) {
  mkdirSync(path.dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(line)}\n`);
  return line;
}

/**
 * Read whole lines appended since `cursor` ({ offset, carry }). Returns the
 * parsed lines and the next cursor; a truncated file starts over.
 */
export function readNew(file, cursor = { offset: 0, carry: '' }) {
  let size;
  try {
    size = statSync(file).size;
  } catch {
    return { lines: [], cursor };
  }
  let { offset, carry } = cursor;
  if (size < offset) {
    offset = 0;
    carry = '';
  }
  if (size === offset) return { lines: [], cursor: { offset, carry } };
  const buffer = Buffer.alloc(size - offset);
  const fd = openSync(file, 'r');
  try {
    readSync(fd, buffer, 0, buffer.length, offset);
  } finally {
    closeSync(fd);
  }
  const parts = (carry + buffer.toString('utf8')).split('\n');
  const rest = parts.pop() ?? '';
  const lines = [];
  for (const part of parts) {
    try {
      const line = JSON.parse(part);
      if (line && typeof line.text === 'string' && line.text.trim()) lines.push(line);
    } catch {
      /* skip foreign or broken lines */
    }
  }
  return { lines, cursor: { offset: size, carry: rest } };
}

function endCursor(file) {
  return { offset: existsSync(file) ? statSync(file).size : 0, carry: '' };
}

async function main(argv) {
  const [command, ...rest] = argv;
  if (command === 'say' || command === 'heard') {
    let agentId;
    if (rest[0] === '--agent') {
      agentId = rest[1];
      rest.splice(0, 2);
    }
    const text = rest.join(' ').trim();
    if (!text) throw new Error(`usage: hal-voice ${command} <text…>`);
    const line = appendLine(
      command === 'say' ? OUTBOX : INBOX,
      makeLine(text, command === 'say' ? (agentId ? { agentId } : {}) : { source: 'cli' })
    );
    console.log(`${command === 'say' ? 'queued' : 'heard'} ${line.id}`);
    return;
  }
  if (command === 'listen') {
    let cursor = endCursor(INBOX);
    // One utterance per stdout line, written straight through so a monitor
    // sees it at once; the banner goes to stderr so stdout needs no filter.
    const emit = text => writeSync(1, `${text}\n`);
    writeSync(2, `[hal-voice] listening for speech in ${INBOX}\n`);
    for (;;) {
      const next = readNew(INBOX, cursor);
      cursor = next.cursor;
      for (const line of next.lines) emit(`🎙 ${line.text.replace(/\s+/g, ' ')}`);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  console.log('usage: hal-voice listen | say [--agent <id>] <text…> | heard <text…>');
  process.exitCode = command ? 1 : 0;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main(process.argv.slice(2)).catch(error => {
    console.error(`[hal-voice] ${error.message}`);
    process.exitCode = 1;
  });
}
