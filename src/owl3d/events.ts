import { parseAgentEventInput } from '../agent-system/validation';
import type { AgentEventInput } from '../agent-system/types';
import type { PortalEvent } from './bot';

/**
 * Inbound agent events for the portal. Every transport goes through HAL's own
 * validator, the same one the agent console uses.
 *
 * - WebSocket: the HAL bridge (npm run bridge), which carries Codex and
 *   Claude Code sessions. The first frame is the bridge's history and is
 *   treated as replay so old work does not set off fireworks.
 * - BroadcastChannel 'hal-agent-events' and the 'hal:agent-event' window
 *   event, exactly as documented in docs/agent-event-bridge.md.
 */

export const DEFAULT_BRIDGE_URL = 'ws://127.0.0.1:8765/hal-agent-events';

export type ConnectionLabel = 'live' | 'connecting' | 'offline';

export interface EventSourceOptions {
  url: string;
  onEvent: (event: PortalEvent) => void;
  onConnection: (state: ConnectionLabel) => void;
}

export function bridgeUrl(): string {
  const fromQuery = new URLSearchParams(window.location.search).get('ws');
  const fromBuild =
    typeof __HAL_AGENT_WS_URL__ === 'string' ? __HAL_AGENT_WS_URL__.trim() : '';
  const url = fromQuery || fromBuild || DEFAULT_BRIDGE_URL;
  return /^wss?:\/\//.test(url) ? url : DEFAULT_BRIDGE_URL;
}

export function connectAgentEvents({
  url,
  onEvent,
  onConnection,
}: EventSourceOptions): () => void {
  const seen = new Set<string>();
  const accept = (
    raw: unknown,
    source: AgentEventInput['source'],
    replay: boolean
  ) => {
    const parsed = parseAgentEventInput(raw, source ?? 'bridge');
    if (!parsed) return;
    if (parsed.id) {
      if (seen.has(parsed.id)) return;
      seen.add(parsed.id);
      if (seen.size > 4000) seen.delete(seen.values().next().value as string);
    }
    onEvent(replay ? { ...parsed, replay } : parsed);
  };

  let socket: WebSocket | null = null;
  let retry = 1000;
  let timer = 0;
  let closed = false;
  const open = () => {
    if (closed) return;
    onConnection('connecting');
    let first = true;
    try {
      socket = new WebSocket(url);
    } catch {
      onConnection('offline');
      return;
    }
    socket.onopen = () => {
      retry = 1000;
      onConnection('live');
    };
    socket.onmessage = message => {
      try {
        const data: unknown = JSON.parse(String(message.data));
        const replay = first && Array.isArray(data);
        first = false;
        (Array.isArray(data) ? data : [data]).forEach(item =>
          accept(item, 'websocket', replay)
        );
      } catch {
        /* malformed frames are dropped, as in the console */
      }
    };
    socket.onclose = () => {
      onConnection('offline');
      if (closed) return;
      timer = window.setTimeout(open, retry);
      retry = Math.min(retry * 2, 30_000);
    };
    socket.onerror = () => socket?.close();
  };
  open();

  const channel =
    'BroadcastChannel' in window
      ? new BroadcastChannel('hal-agent-events')
      : null;
  if (channel)
    channel.onmessage = message => accept(message.data, 'bridge', false);
  const onWindowEvent = (event: Event) =>
    accept((event as CustomEvent).detail, 'bridge', false);
  window.addEventListener('hal:agent-event', onWindowEvent);

  return () => {
    closed = true;
    window.clearTimeout(timer);
    socket?.close();
    channel?.close();
    window.removeEventListener('hal:agent-event', onWindowEvent);
  };
}
