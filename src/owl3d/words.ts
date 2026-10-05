import type { AgentEventInput, AgentState } from '../agent-system/types';

/**
 * Chunky words for the 3D screen. The Owl3D Shift resolves big shapes, not
 * small type, so every piece of text in the portal is one short, huge word or
 * a few words at a time. Pure, so it is unit tested.
 */

const STATE_WORDS: Record<AgentState, string> = {
  idle: 'IDLE',
  thinking: 'THINKING',
  processing: 'WORKING',
  waiting: 'WAITING',
  completed: 'DONE',
  error: 'ERROR',
  offline: 'OFFLINE',
};

export function stateWord(state: AgentState): string {
  return STATE_WORDS[state];
}

/** One word for what a tool does. */
export function toolWord(tool = ''): string {
  if (/^bash|shell|exec|command/i.test(tool)) return 'RUN';
  if (/edit|write|notebook|apply_patch/i.test(tool)) return 'EDIT';
  if (/^read$|read_file|view/i.test(tool)) return 'READ';
  if (/grep|glob|search|find|^ls$|list/i.test(tool)) return 'SEARCH';
  if (/web|fetch|http|browser/i.test(tool)) return 'WEB';
  if (/agent|task|workflow|spawn/i.test(tool)) return 'AGENTS';
  if (/^mcp__/i.test(tool)) return 'TOOL';
  const plain = tool.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return plain ? plain.slice(0, 7) : 'TOOL';
}

/** The word to float over a bot for an event, or null for none. */
export function eventWord(
  event: Pick<AgentEventInput, 'kind' | 'state' | 'stage' | 'tool'>
): string | null {
  switch (event.kind) {
    case 'tool':
      return event.state === 'processing' ? toolWord(event.tool) : null;
    case 'error':
      return 'ERROR';
    case 'message':
      return event.stage === 'intake' ? 'NEW TASK' : 'REPLY';
    case 'completion':
      return 'DONE';
    case 'approval':
      return 'APPROVE?';
    default:
      return null;
  }
}

/**
 * Split speech into pages of at most two short lines, so subtitles can be
 * huge: a few words on screen at a time.
 */
export function captionPages(
  text: string,
  lineChars = 18,
  lines = 2
): string[][] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const pages: string[][] = [];
  let page: string[] = [];
  let line = '';
  for (const raw of words) {
    // A single word longer than a line is cut so it still fits.
    const word =
      raw.length > lineChars ? `${raw.slice(0, lineChars - 1)}…` : raw;
    const next = line ? `${line} ${word}` : word;
    if (next.length <= lineChars) {
      line = next;
      continue;
    }
    page.push(line);
    line = word;
    if (page.length === lines) {
      pages.push(page);
      page = [];
    }
  }
  if (line) page.push(line);
  if (page.length) pages.push(page);
  return pages;
}
