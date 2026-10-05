import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sanitizeVisibleText } from './agent-bridge.mjs';

/**
 * Claude Code session source for the HAL bridge.
 *
 * Reads ~/.claude/projects/<encoded-cwd>/<session>.jsonl and maps records onto
 * the canonical HAL event contract. Like the Codex source it never forwards
 * prompts, reasoning, tool arguments, or tool output. The only text taken from
 * a tool call is its model-authored one-line `description`, sanitized.
 */

export const CLAUDE_HOME =
  process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
export const CLAUDE_PROJECTS = path.join(CLAUDE_HOME, 'projects');
const DEFAULT_CONTEXT_WINDOW = 200_000;
// Start long transcripts near the end; only recent activity matters.
export const CLAUDE_TAIL_BYTES = 256 * 1024;

/** Claude Code names project folders after the cwd with non-alphanumerics as '-'. */
export function encodeClaudeProject(cwd) {
  return path.resolve(cwd).replace(/[^a-zA-Z0-9]/g, '-');
}

export function createClaudeContext(metadata = {}) {
  const sessionId = String(metadata.sessionId || 'unknown-session').slice(0, 96);
  return {
    sessionId,
    agentId: `claude:${sessionId}`.slice(0, 128),
    project: sanitizeVisibleText(metadata.project || 'claude', 80),
    cwd: '',
    branch: '',
    model: 'Claude Code',
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    tokensUsed: 0,
    tasksCompleted: 0,
    turn: 0,
    tools: new Map(),
  };
}

function registration(context) {
  const workspace = context.cwd ? path.basename(context.cwd) : context.project;
  return {
    id: context.agentId,
    name: `Claude · ${workspace}`.slice(0, 120),
    callsign: `CLD-${context.sessionId.slice(0, 3).toUpperCase()}`,
    role: 'Claude Code session',
    model: context.model,
    workspace,
    branch: context.branch || 'unknown',
    capabilities: ['reasoning', 'tools', 'code'],
    metrics: {
      tokensUsed: context.tokensUsed,
      contextWindow: context.contextWindow,
      latencyMs: 0,
      tasksCompleted: context.tasksCompleted,
      successRate: null,
      queueDepth: context.tools.size,
    },
  };
}

function toolName(value) {
  return String(value || 'tool').replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 80) || 'tool';
}

function isHumanPrompt(record) {
  if (record.isMeta) return false;
  const content = record.message?.content;
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content
            .filter(part => part?.type === 'text')
            .map(part => part.text)
            .join(' ')
        : '';
  if (!text.trim()) return false;
  // Slash-command plumbing, hook output and local shell echoes are not prompts.
  return !/^\s*<(command-|local-command|system-reminder|bash-|user-memory)/.test(text);
}

function usageTokens(usage) {
  if (!usage || typeof usage !== 'object') return 0;
  return (
    (usage.input_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.output_tokens || 0)
  );
}

/** Map one Claude Code JSONL record to zero or more HAL events. */
export function normalizeClaudeRecord(record, context, offset = 0) {
  if (!record || typeof record !== 'object' || record.isSidechain) return [];
  if (typeof record.cwd === 'string' && record.cwd && !context.cwd) {
    context.cwd = record.cwd;
  }
  if (typeof record.gitBranch === 'string' && record.gitBranch) {
    context.branch = sanitizeVisibleText(record.gitBranch, 160);
  }
  const parsed = Date.parse(record.timestamp || '');
  const timestamp = Number.isFinite(parsed) ? parsed : Date.now();
  const message = record.message && typeof record.message === 'object' ? record.message : {};
  const content = Array.isArray(message.content) ? message.content : [];
  const events = [];
  const make = (suffix, fields) => ({
    id: `${context.agentId}:${offset}:${suffix}`.slice(0, 256),
    agentId: context.agentId,
    timestamp,
    sessionId: context.sessionId,
    turnId: `${context.sessionId}:turn-${context.turn}`,
    sequence: offset,
    detail: '',
    ...fields,
    agent: registration(context),
  });

  if (record.type === 'user') {
    for (const part of content) {
      if (part?.type !== 'tool_result') continue;
      const open = context.tools.get(part.tool_use_id);
      context.tools.delete(part.tool_use_id);
      const tool = open?.tool || 'tool';
      events.push(
        make(`result:${events.length}`, {
          kind: part.is_error ? 'error' : 'tool',
          state: 'thinking',
          stage: 'verify',
          severity: part.is_error ? 'warning' : 'success',
          title: part.is_error ? `${tool} failed` : `${tool} finished`,
          tool,
          ...(open ? { durationMs: Math.max(0, timestamp - open.startedAt) } : {}),
          ...(typeof part.tool_use_id === 'string'
            ? { callId: part.tool_use_id.slice(0, 128) }
            : {}),
        })
      );
    }
    if (!events.length && isHumanPrompt(record)) {
      context.turn += 1;
      context.tools.clear();
      events.push(
        make('prompt', {
          kind: 'message',
          state: 'thinking',
          stage: 'intake',
          severity: 'info',
          title: 'New prompt received',
          task: `Turn ${context.turn}`,
          turnId: `${context.sessionId}:turn-${context.turn}`,
        })
      );
    }
    return events;
  }

  if (record.type !== 'assistant') return events;
  if (typeof message.model === 'string' && message.model) {
    context.model = sanitizeVisibleText(message.model, 120);
    if (/\[1m\]|-1m\b/i.test(message.model)) context.contextWindow = 1_000_000;
  }
  const tokens = usageTokens(message.usage);
  if (tokens) context.tokensUsed = tokens;
  // Transcripts do not always name long-context models; usage past the
  // assumed window proves the larger one.
  if (tokens > context.contextWindow) context.contextWindow = 1_000_000;
  const metrics = tokens
    ? { tokensUsed: tokens, contextWindow: context.contextWindow }
    : undefined;

  content.forEach((part, index) => {
    if (part?.type === 'thinking' || part?.type === 'redacted_thinking') {
      events.push(
        make(`thought:${index}`, {
          kind: 'thought',
          state: 'thinking',
          stage: 'reason',
          severity: 'trace',
          title: 'Reasoning',
          ...(metrics ? { metrics } : {}),
        })
      );
    } else if (part?.type === 'tool_use') {
      const tool = toolName(part.name);
      if (typeof part.id === 'string') {
        context.tools.set(part.id, { tool, startedAt: timestamp });
      }
      const summary = sanitizeVisibleText(part.input?.description || '', 120);
      events.push(
        make(`tool:${index}`, {
          kind: 'tool',
          state: 'processing',
          stage: 'execute',
          severity: 'info',
          title: summary || `Running ${tool}`,
          tool,
          ...(typeof part.id === 'string' ? { callId: part.id.slice(0, 128) } : {}),
          ...(metrics ? { metrics } : {}),
        })
      );
    } else if (part?.type === 'text' && typeof part.text === 'string' && part.text.trim()) {
      events.push(
        make(`message:${index}`, {
          kind: 'message',
          state: 'processing',
          stage: 'deliver',
          severity: 'info',
          title: 'Writing a reply',
          ...(metrics ? { metrics } : {}),
        })
      );
    }
  });

  if (message.stop_reason === 'end_turn') {
    context.tasksCompleted += 1;
    events.push(
      make('complete', {
        kind: 'completion',
        state: 'completed',
        stage: 'deliver',
        severity: 'success',
        title: 'Turn complete',
        ...(metrics ? { metrics } : {}),
      })
    );
  }
  return events;
}

/**
 * Recently modified Claude Code transcripts. `workspace` of '*' includes every
 * project; otherwise only the folder Claude Code derives from that cwd.
 */
export async function discoverClaudeSessions(workspace, cutoffMs, root = CLAUDE_PROJECTS) {
  let folders;
  try {
    folders = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const wanted = workspace === '*' ? null : encodeClaudeProject(workspace);
  const found = [];
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    if (wanted && folder.name !== wanted) continue;
    const directory = path.join(root, folder.name);
    let names;
    try {
      names = await fs.readdir(directory);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith('.jsonl')) continue;
      const file = path.join(directory, name);
      try {
        const stat = await fs.stat(file);
        if (stat.mtimeMs < cutoffMs) continue;
        const parts = folder.name.split('-').filter(Boolean);
        found.push({
          file,
          stat,
          metadata: {
            sessionId: path.basename(name, '.jsonl'),
            project: parts[parts.length - 1] || 'claude',
          },
        });
      } catch {
        continue;
      }
    }
  }
  return found;
}
