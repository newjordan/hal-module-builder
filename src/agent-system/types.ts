export type AgentState =
  | 'idle'
  | 'thinking'
  | 'processing'
  | 'waiting'
  | 'completed'
  | 'error'
  | 'offline';

export type AgentStage =
  | 'intake'
  | 'context'
  | 'reason'
  | 'execute'
  | 'verify'
  | 'deliver';

export type EventKind =
  | 'thought'
  | 'tool'
  | 'message'
  | 'approval'
  | 'completion'
  | 'error'
  | 'system';

export type EventSeverity =
  | 'trace'
  | 'info'
  | 'success'
  | 'warning'
  | 'critical';

export type EventAction = 'acknowledge' | 'resolve' | 'retry' | 'approve';

export type EventFilter = 'all' | 'attention' | 'active' | 'completed';

export type ConnectionState = 'demo' | 'connecting' | 'connected' | 'offline';
export type ConnectionSource =
  | 'demo'
  | 'document'
  | 'broadcast'
  | 'window'
  | 'websocket';

export interface AgentMetrics {
  tokensUsed: number;
  contextWindow: number;
  latencyMs: number;
  tasksCompleted: number;
  successRate: number | null;
  queueDepth: number;
}

export interface Agent {
  id: string;
  name: string;
  callsign: string;
  role: string;
  model: string;
  state: AgentState;
  stage: AgentStage;
  task: string;
  currentStep: string;
  progress: number;
  progressKnown: boolean;
  workspace: string;
  branch: string;
  startedAt: number | null;
  lastSeen: number;
  capabilities: string[];
  metrics: AgentMetrics;
  parentAgentId?: string;
  activeRunId?: string;
  lastSequence?: number;
}

export interface AgentRegistration
  extends Partial<Omit<Agent, 'id' | 'name' | 'metrics'>> {
  id: string;
  name: string;
  metrics?: Partial<AgentMetrics>;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  kind: EventKind;
  state?: AgentState;
  stage?: AgentStage;
  severity: EventSeverity;
  title: string;
  detail: string;
  timestamp: number;
  progress?: number;
  task?: string;
  tool?: string;
  durationMs?: number;
  artifact?: string;
  sessionId?: string;
  turnId?: string;
  runId?: string;
  callId?: string;
  parentAgentId?: string;
  sequence?: number;
  metrics?: Partial<AgentMetrics>;
  commandId?: string;
  commandStatus?: 'accepted' | 'rejected' | 'completed';
  actionable?: boolean;
  acknowledged: boolean;
  resolved: boolean;
  source: 'demo' | 'bridge' | 'websocket' | 'operator';
}

export interface AgentEventInput
  extends Omit<
    AgentEvent,
    'id' | 'timestamp' | 'acknowledged' | 'resolved' | 'source'
  > {
  id?: string;
  timestamp?: number;
  acknowledged?: boolean;
  resolved?: boolean;
  source?: AgentEvent['source'];
  agent?: AgentRegistration;
}

export interface AgentSystemState {
  agents: Agent[];
  events: AgentEvent[];
  selectedAgentId: string;
  filter: EventFilter;
  simulationEnabled: boolean;
  soundEnabled: boolean;
  desktopAlertsEnabled: boolean;
  connection: ConnectionState;
  connectionSource: ConnectionSource;
  connectionLabel: string;
  pendingCommands: PendingAgentCommand[];
}

export type AgentCommandAction = 'retry' | 'approve' | 'pause' | 'resume';

export interface AgentCommand {
  id: string;
  agentId: string;
  action: AgentCommandAction;
  timestamp: number;
  eventId?: string;
}

export interface PendingAgentCommand extends AgentCommand {
  status: 'queued' | 'sent' | 'accepted' | 'rejected' | 'completed';
}

export type AgentSystemAction =
  | { type: 'INGEST_EVENT'; event: AgentEventInput }
  | { type: 'SELECT_AGENT'; agentId: string }
  | { type: 'SET_FILTER'; filter: EventFilter }
  | { type: 'SET_SIMULATION'; enabled: boolean }
  | { type: 'SET_SOUND'; enabled: boolean }
  | { type: 'SET_DESKTOP_ALERTS'; enabled: boolean }
  | {
      type: 'SET_CONNECTION';
      connection: ConnectionState;
      label: string;
      source: ConnectionSource;
    }
  | { type: 'HANDLE_EVENT'; eventId: string; action: EventAction }
  | { type: 'ACKNOWLEDGE_ALL' }
  | { type: 'CLEAR_RESOLVED' }
  | { type: 'TOGGLE_AGENT_PAUSE'; agentId: string }
  | { type: 'ACTIVATE_LIVE'; label: string; source: ConnectionSource }
  | { type: 'LINK_COMMAND'; eventId: string; commandId: string }
  | { type: 'QUEUE_COMMAND'; command: AgentCommand }
  | {
      type: 'SET_COMMAND_STATUS';
      commandId: string;
      status: PendingAgentCommand['status'];
    };

export interface HalAgentBridge {
  emit: (event: AgentEventInput) => string;
  command: (
    command: Omit<AgentCommand, 'id' | 'timestamp'> &
      Partial<Pick<AgentCommand, 'id' | 'timestamp'>>
  ) => string;
  snapshot: () => AgentSystemState;
  channel: string;
  commandChannel: string;
}

declare global {
  interface Window {
    HAL_AGENT_NOTIFICATIONS?: HalAgentBridge;
  }
}
