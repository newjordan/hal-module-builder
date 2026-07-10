import {
  Activity,
  Archive,
  Bell,
  BellRing,
  Bot,
  BrainCircuit,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CirclePause,
  Clock3,
  Code2,
  Cpu,
  GitBranch,
  MessageSquareText,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TriangleAlert,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  Agent,
  AgentEvent,
  AgentStage,
  AgentState,
  ConnectionSource,
  ConnectionState,
  EventFilter,
  EventKind,
  EventSeverity,
  PendingAgentCommand,
} from '../../agent-system/types';
import { useAgentSystem } from '../../agent-system/useAgentSystem';
import './agent-console.css';

interface StateVisual {
  label: string;
  shortLabel: string;
  color: string;
  icon: LucideIcon;
  motion: string;
}

const STATE_VISUALS: Record<AgentState, StateVisual> = {
  idle: {
    label: 'Standing by',
    shortLabel: 'Idle',
    color: '#8b96a3',
    icon: CircleDashed,
    motion: 'Heartbeat stable',
  },
  thinking: {
    label: 'Reasoning',
    shortLabel: 'Thinking',
    color: '#53d8df',
    icon: BrainCircuit,
    motion: 'Context moving inward',
  },
  processing: {
    label: 'Executing',
    shortLabel: 'Processing',
    color: '#f2b84b',
    icon: Cpu,
    motion: 'Tool progress clockwise',
  },
  waiting: {
    label: 'Input required',
    shortLabel: 'Waiting',
    color: '#d99bff',
    icon: CirclePause,
    motion: 'Operator gate held',
  },
  completed: {
    label: 'Task complete',
    shortLabel: 'Complete',
    color: '#62d995',
    icon: CircleCheck,
    motion: 'Result settled',
  },
  error: {
    label: 'Intervention required',
    shortLabel: 'Error',
    color: '#ff625f',
    icon: TriangleAlert,
    motion: 'Execution interrupted',
  },
  offline: {
    label: 'Signal unavailable',
    shortLabel: 'Offline',
    color: '#68717b',
    icon: WifiOff,
    motion: 'Heartbeat missing',
  },
};

const KIND_ICONS: Record<EventKind, LucideIcon> = {
  thought: BrainCircuit,
  tool: TerminalSquare,
  message: MessageSquareText,
  approval: ShieldCheck,
  completion: CheckCheck,
  error: TriangleAlert,
  system: Radio,
};

const SEVERITY_LABELS: Record<EventSeverity, string> = {
  trace: 'Trace',
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  critical: 'Critical',
};

const FILTERS: Array<{ id: EventFilter; label: string; icon: LucideIcon }> = [
  { id: 'all', label: 'All agents', icon: Bot },
  { id: 'active', label: 'Active agents', icon: Activity },
  { id: 'attention', label: 'Needs attention', icon: TriangleAlert },
  { id: 'completed', label: 'Completed agents', icon: CheckCheck },
];

const ACTIVE_STATES: AgentState[] = ['thinking', 'processing'];
const ATTENTION_STATES: AgentState[] = ['waiting', 'error', 'offline'];

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(ms < 10_000 ? 1 : 0)}s`;
  const minutes = Math.floor(ms / 60_000);
  return `${minutes}m ${Math.floor((ms % 60_000) / 1_000)}s`;
}

function relativeTime(timestamp: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1_000));
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

function useClock(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function IconButton({
  label,
  active = false,
  toggle = false,
  badge,
  children,
  onClick,
  disabled = false,
}: {
  label: string;
  active?: boolean;
  toggle?: boolean;
  badge?: number;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`icon-button${active ? ' is-active' : ''}`}
      type='button'
      aria-label={label}
      title={label}
      aria-pressed={toggle ? active : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      {badge !== undefined && badge > 0 ? (
        <span className='icon-button__badge'>{badge > 9 ? '9+' : badge}</span>
      ) : null}
    </button>
  );
}

function StateGlyph({
  state,
  size = 16,
}: {
  state: AgentState;
  size?: number;
}) {
  const visual = STATE_VISUALS[state];
  const Icon = visual.icon;
  return (
    <span
      className={`state-glyph state-glyph--${state}`}
      style={{ '--state-color': visual.color } as CSSProperties}
      title={visual.label}
    >
      <Icon size={size} strokeWidth={1.8} aria-hidden='true' />
    </span>
  );
}

function Header({
  agents,
  events,
  query,
  onQueryChange,
  simulationEnabled,
  setSimulation,
  soundEnabled,
  setSound,
  desktopAlertsEnabled,
  requestDesktopAlerts,
  connection,
  connectionLabel,
  liveSourceConfigured,
  onReconnectLive,
  now,
}: {
  agents: Agent[];
  events: AgentEvent[];
  query: string;
  onQueryChange: (value: string) => void;
  simulationEnabled: boolean;
  setSimulation: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSound: (enabled: boolean) => void;
  desktopAlertsEnabled: boolean;
  requestDesktopAlerts: () => Promise<boolean>;
  connection: 'demo' | 'connecting' | 'connected' | 'offline';
  connectionLabel: string;
  liveSourceConfigured: boolean;
  onReconnectLive: () => void;
  now: number;
}) {
  const activeCount = agents.filter(agent =>
    ACTIVE_STATES.includes(agent.state)
  ).length;
  const attentionCount = events.filter(
    event =>
      !event.acknowledged &&
      !event.resolved &&
      (event.actionable ||
        event.severity === 'warning' ||
        event.severity === 'critical' ||
        event.kind === 'completion')
  ).length;
  const lastEvent = events[0];
  const ConnectionIcon =
    connection === 'offline'
      ? WifiOff
      : connection === 'connected'
        ? Wifi
        : Radio;

  return (
    <header className='ops-header'>
      <div className='ops-brand'>
        <div className='ops-brand__mark' aria-hidden='true'>
          <img src='/hal_lens_1.png' alt='' />
        </div>
        <div>
          <strong>HAL</strong>
          <span>Agent Operations</span>
        </div>
      </div>

      <div className='ops-header__metrics' aria-label='Fleet summary'>
        <div>
          <span className='metric-dot metric-dot--active' />
          <strong>{activeCount}</strong>
          <span>active</span>
        </div>
        <div>
          <span className='metric-dot metric-dot--attention' />
          <strong>{attentionCount}</strong>
          <span>attention</span>
        </div>
        <div>
          <Clock3 size={13} aria-hidden='true' />
          <strong>
            {lastEvent ? relativeTime(lastEvent.timestamp, now) : '—'}
          </strong>
          <span>last signal</span>
        </div>
      </div>

      <label className='ops-search'>
        <Search size={15} aria-hidden='true' />
        <span className='sr-only'>Search agents and events</span>
        <input
          type='search'
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder='Search operations'
        />
        <span className='ops-search__key'>/</span>
      </label>

      <div className='ops-header__controls'>
        <div
          className={`connection-pill connection-pill--${connection}`}
          title={connectionLabel}
        >
          <ConnectionIcon size={13} aria-hidden='true' />
          <span>{connection === 'demo' ? 'Simulation' : connectionLabel}</span>
        </div>
        {liveSourceConfigured && connection === 'demo' ? (
          <IconButton
            label='Reconnect live event stream'
            onClick={onReconnectLive}
          >
            <RotateCcw size={17} />
          </IconButton>
        ) : null}
        <IconButton
          label={
            connection === 'connected' || connection === 'connecting'
              ? 'Simulation disabled while a live source is active'
              : connection === 'offline'
                ? 'Switch back to event simulation'
                : simulationEnabled
                  ? 'Pause event simulation'
                  : 'Resume event simulation'
          }
          active={simulationEnabled}
          toggle
          disabled={connection === 'connected' || connection === 'connecting'}
          onClick={() => setSimulation(!simulationEnabled)}
        >
          {simulationEnabled ? <Pause size={17} /> : <Play size={17} />}
        </IconButton>
        <IconButton
          label={soundEnabled ? 'Mute alert tones' : 'Enable alert tones'}
          active={soundEnabled}
          toggle
          onClick={() => setSound(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </IconButton>
        <IconButton
          label={
            desktopAlertsEnabled
              ? 'Disable desktop alerts'
              : 'Enable desktop alerts'
          }
          active={desktopAlertsEnabled}
          toggle
          badge={attentionCount}
          onClick={() => void requestDesktopAlerts()}
        >
          {desktopAlertsEnabled ? <BellRing size={17} /> : <Bell size={17} />}
        </IconButton>
      </div>
    </header>
  );
}

function AgentRail({
  agents,
  selectedId,
  onSelect,
  filter,
  onFilter,
  query,
  events,
  now,
}: {
  agents: Agent[];
  selectedId: string;
  onSelect: (agentId: string) => void;
  filter: EventFilter;
  onFilter: (filter: EventFilter) => void;
  query: string;
  events: AgentEvent[];
  now: number;
}) {
  const matchingAgents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return agents.filter(agent => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          agent.name,
          agent.callsign,
          agent.role,
          agent.task,
          agent.workspace,
          ...events
            .filter(event => event.agentId === agent.id)
            .flatMap(event => [event.title, event.detail, event.tool || '']),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (filter === 'active') return ACTIVE_STATES.includes(agent.state);
      if (filter === 'attention') return ATTENTION_STATES.includes(agent.state);
      if (filter === 'completed') return agent.state === 'completed';
      return true;
    });
  }, [agents, events, filter, query]);

  return (
    <aside className='agent-rail' aria-label='Agent roster'>
      <div className='panel-heading'>
        <div>
          <span className='eyebrow'>Fleet</span>
          <h2>Agents</h2>
        </div>
        <span className='count-badge'>
          {matchingAgents.length}/{agents.length}
        </span>
      </div>

      <div className='agent-filter' role='tablist' aria-label='Filter agents'>
        {FILTERS.map(item => {
          const FilterIcon = item.icon;
          return (
            <button
              key={item.id}
              type='button'
              role='tab'
              aria-selected={filter === item.id}
              title={item.label}
              onClick={() => onFilter(item.id)}
              className={filter === item.id ? 'is-active' : ''}
            >
              <FilterIcon size={15} aria-hidden='true' />
              <span className='sr-only'>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className='agent-list'>
        {matchingAgents.map((agent, index) => {
          const unread = events.filter(
            event => event.agentId === agent.id && !event.acknowledged
          ).length;
          const visual = STATE_VISUALS[agent.state];
          return (
            <button
              type='button'
              key={agent.id}
              className={`agent-row${selectedId === agent.id ? ' is-selected' : ''}`}
              onClick={() => onSelect(agent.id)}
              aria-current={selectedId === agent.id ? 'true' : undefined}
              style={
                {
                  '--state-color': visual.color,
                  '--agent-notch': `${(index % 4) + 1}`,
                } as CSSProperties
              }
            >
              <span className='agent-row__identity' aria-hidden='true'>
                <span />
                <span />
                <span />
              </span>
              <span className='agent-row__main'>
                <span className='agent-row__topline'>
                  <strong>{agent.name}</strong>
                  <span className='agent-row__callsign'>{agent.callsign}</span>
                  {unread > 0 ? (
                    <span className='agent-row__unread'>{unread}</span>
                  ) : null}
                </span>
                <span className='agent-row__role'>{agent.role}</span>
                <span className='agent-row__task'>{agent.task}</span>
                <span className='agent-row__status'>
                  <StateGlyph state={agent.state} size={13} />
                  <span>{visual.shortLabel}</span>
                  <span className='agent-row__age'>
                    {relativeTime(agent.lastSeen, now)}
                  </span>
                </span>
                {ACTIVE_STATES.includes(agent.state) ||
                agent.state === 'waiting' ? (
                  <span
                    className={`agent-row__progress${agent.progressKnown ? '' : ' is-indeterminate'}`}
                    role='progressbar'
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      agent.progressKnown ? agent.progress : undefined
                    }
                    aria-label={
                      agent.progressKnown
                        ? `${agent.progress}% complete`
                        : 'Operation in progress'
                    }
                  >
                    <span
                      style={
                        agent.progressKnown
                          ? { width: `${agent.progress}%` }
                          : undefined
                      }
                    />
                  </span>
                ) : null}
              </span>
              <ChevronRight
                className='agent-row__chevron'
                size={15}
                aria-hidden='true'
              />
            </button>
          );
        })}
        {matchingAgents.length === 0 ? (
          <div className='empty-state'>
            <Search size={18} />
            <span>No matching agents</span>
          </div>
        ) : null}
      </div>

      <div className='agent-rail__footer'>
        <div className='rail-signal'>
          <Network size={14} aria-hidden='true' />
          <span>Event mesh</span>
          <strong>
            {
              agents.filter(
                agent =>
                  agent.state !== 'offline' && now - agent.lastSeen < 120_000
              ).length
            }
            /{agents.length}
          </strong>
        </div>
        <div className='signal-legend' aria-label='State signal legend'>
          {(['thinking', 'processing', 'waiting', 'error'] as AgentState[]).map(
            state => (
              <span key={state} title={STATE_VISUALS[state].shortLabel}>
                <i style={{ background: STATE_VISUALS[state].color }} />
                {STATE_VISUALS[state].shortLabel}
              </span>
            )
          )}
        </div>
      </div>
    </aside>
  );
}

function AgentLens({ agent, now }: { agent: Agent; now: number }) {
  const visual = STATE_VISUALS[agent.state];
  const StateIcon = visual.icon;
  const contextPercent = agent.metrics.contextWindow
    ? Math.min(
        100,
        Math.round(
          (agent.metrics.tokensUsed / agent.metrics.contextWindow) * 100
        )
      )
    : 0;
  const elapsed = agent.startedAt
    ? formatDuration(now - agent.startedAt)
    : 'Standby';
  const isBusy = ACTIVE_STATES.includes(agent.state);
  const progressLabel = agent.progressKnown ? `${agent.progress}%` : 'LIVE';
  const style = {
    '--signal': visual.color,
    '--progress': agent.progressKnown ? `${agent.progress * 3.6}deg` : '82deg',
    '--context': `${contextPercent * 3.6}deg`,
  } as CSSProperties;

  return (
    <section
      className={`agent-lens agent-lens--${agent.state}${agent.progressKnown ? '' : ' agent-lens--indeterminate'}`}
      style={style}
      aria-labelledby='selected-agent-title'
      aria-busy={isBusy}
    >
      <div className='agent-lens__header'>
        <div>
          <span className='eyebrow'>Selected signal</span>
          <h1 id='selected-agent-title'>{agent.name}</h1>
          <span className='agent-lens__role'>
            {agent.role} · {agent.model}
          </span>
        </div>
        <div className={`state-chip state-chip--${agent.state}`}>
          <StateIcon size={15} aria-hidden='true' />
          <span>{visual.label}</span>
        </div>
      </div>

      <div className='agent-lens__stage'>
        <div className='lens-readout lens-readout--northwest'>
          <span>Context</span>
          <strong>{contextPercent}%</strong>
          <i>
            <span style={{ width: `${contextPercent}%` }} />
          </i>
        </div>
        <div className='lens-readout lens-readout--northeast'>
          <span>Queue</span>
          <strong>{agent.metrics.queueDepth}</strong>
          <small>{agent.metrics.queueDepth === 1 ? 'task' : 'tasks'}</small>
        </div>
        <div className='lens-readout lens-readout--southwest'>
          <span>Elapsed</span>
          <strong>{elapsed}</strong>
          <small>current run</small>
        </div>
        <div className='lens-readout lens-readout--southeast'>
          <span>Latency</span>
          <strong>{formatDuration(agent.metrics.latencyMs)}</strong>
          <small>last operation</small>
        </div>

        <div
          className='lens-assembly'
          aria-label={
            agent.progressKnown
              ? `${visual.shortLabel}, ${agent.progress}% progress`
              : `${visual.shortLabel}, indeterminate progress`
          }
        >
          <div className='lens-ring lens-ring--orbit'>
            {Array.from(
              { length: Math.min(3, agent.metrics.queueDepth) },
              (_, index) => (
                <span
                  key={index}
                  className={`lens-satellite lens-satellite--${['one', 'two', 'three'][index]}`}
                  title={`Queued task ${index + 1}`}
                />
              )
            )}
          </div>
          <div className='lens-ring lens-ring--state' />
          <div className='lens-ring lens-ring--progress' />
          <div className='lens-ring lens-ring--context' />
          <div className='lens-ring lens-ring--ticks' />
          <div className='lens-core'>
            <img src='/hal_lens_1.png' alt='' aria-hidden='true' />
            <span className='lens-core__signal' />
            <span className='lens-core__scan' />
          </div>
          <div className='lens-center-status'>
            <StateIcon size={18} aria-hidden='true' />
            <strong>{progressLabel}</strong>
          </div>
        </div>

        <div className='lens-axis lens-axis--horizontal' aria-hidden='true' />
        <div className='lens-axis lens-axis--vertical' aria-hidden='true' />
      </div>

      <div className='agent-lens__task'>
        <span className='task-sequence'>
          {agent.callsign} / RUN-{agent.id.slice(0, 4).toUpperCase()}
        </span>
        <strong>{agent.task}</strong>
        <span>{agent.currentStep}</span>
        <div
          className={`task-progress${agent.progressKnown ? '' : ' is-indeterminate'}`}
          role='progressbar'
          aria-label='Task progress'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={agent.progressKnown ? agent.progress : undefined}
        >
          <span
            style={
              agent.progressKnown ? { width: `${agent.progress}%` } : undefined
            }
          />
        </div>
        <div className='motion-caption'>
          <Activity size={13} aria-hidden='true' />
          {visual.motion}
        </div>
      </div>

      <div className='agent-lens__metrics'>
        <Metric
          label='Tokens'
          value={formatCompactNumber(agent.metrics.tokensUsed)}
          icon={<Zap size={14} />}
        />
        <Metric
          label='Success'
          value={
            agent.metrics.successRate === null
              ? '—'
              : `${agent.metrics.successRate.toFixed(1)}%`
          }
          icon={<ShieldCheck size={14} />}
        />
        <Metric
          label='Completed'
          value={String(agent.metrics.tasksCompleted)}
          icon={<CheckCheck size={14} />}
        />
        <Metric
          label='Workspace'
          value={agent.workspace.split('/').pop() || agent.workspace}
          icon={<Archive size={14} />}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className='lens-metric'>
      <span className='lens-metric__icon'>{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

function CognitionStream({
  agent,
  events,
  now,
  selectedEventId,
  onSelectEvent,
}: {
  agent: Agent;
  events: AgentEvent[];
  now: number;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}) {
  const streamEvents = events
    .filter(event =>
      ['thought', 'tool', 'message', 'system', 'error'].includes(event.kind)
    )
    .slice(0, 7);

  return (
    <section className='cognition-panel' aria-labelledby='cognition-title'>
      <div className='panel-heading panel-heading--bordered'>
        <div>
          <span className='eyebrow'>Observable summaries</span>
          <h2 id='cognition-title'>Cognition stream</h2>
        </div>
        <span
          className={`live-indicator${ACTIVE_STATES.includes(agent.state) ? ' is-live' : ''}`}
        >
          <i />
          {ACTIVE_STATES.includes(agent.state) ? 'Live' : 'Settled'}
        </span>
      </div>

      <div className='stream-current'>
        <div className='stream-current__label'>Current operation</div>
        <strong>{agent.currentStep}</strong>
        <div
          className={`stream-wave stream-wave--${agent.state}`}
          aria-hidden='true'
        >
          {Array.from({ length: 18 }, (_, index) => (
            <span
              key={index}
              style={{ '--bar-index': index } as CSSProperties}
            />
          ))}
        </div>
      </div>

      <div
        className='event-stream'
        role='log'
        aria-live='polite'
        aria-relevant='additions'
      >
        {streamEvents.map((event, index) => {
          const EventIcon = KIND_ICONS[event.kind];
          return (
            <button
              type='button'
              key={event.id}
              className={`stream-event${selectedEventId === event.id ? ' is-selected' : ''}${index === 0 ? ' is-latest' : ''}`}
              onClick={() => onSelectEvent(event.id)}
            >
              <span className={`stream-event__icon severity-${event.severity}`}>
                <EventIcon size={14} aria-hidden='true' />
              </span>
              <span className='stream-event__body'>
                <span className='stream-event__meta'>
                  <strong>{event.title}</strong>
                  <time dateTime={new Date(event.timestamp).toISOString()}>
                    {relativeTime(event.timestamp, now)}
                  </time>
                </span>
                <span className='stream-event__detail'>{event.detail}</span>
                <span className='stream-event__tags'>
                  <span>{event.kind}</span>
                  {event.tool ? <span>{event.tool}</span> : null}
                  {event.durationMs ? (
                    <span>{formatDuration(event.durationMs)}</span>
                  ) : null}
                  <span>{event.source}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const PIPELINE_STAGES = [
  { id: 'intake', label: 'Intake', icon: Radio },
  { id: 'context', label: 'Context', icon: Archive },
  { id: 'reason', label: 'Reason', icon: BrainCircuit },
  { id: 'execute', label: 'Execute', icon: TerminalSquare },
  { id: 'verify', label: 'Verify', icon: ShieldCheck },
  { id: 'deliver', label: 'Deliver', icon: Sparkles },
] satisfies Array<{ id: AgentStage; label: string; icon: LucideIcon }>;

function Pipeline({ agent }: { agent: Agent }) {
  const effectiveCurrent = Math.max(
    0,
    PIPELINE_STAGES.findIndex(stage => stage.id === agent.stage)
  );
  return (
    <section className='pipeline' aria-labelledby='pipeline-title'>
      <div className='section-title'>
        <div>
          <span className='eyebrow'>Run path</span>
          <h2 id='pipeline-title'>Execution pipeline</h2>
        </div>
        <div className='branch-label'>
          <GitBranch size={13} aria-hidden='true' />
          <span>{agent.branch}</span>
        </div>
      </div>
      <div className='pipeline__track'>
        {PIPELINE_STAGES.map((stage, index) => {
          const StageIcon = stage.icon;
          const isDone =
            agent.state === 'completed' || index < effectiveCurrent;
          const isCurrent = index === effectiveCurrent && agent.progress < 100;
          return (
            <div
              key={stage.label}
              className={`pipeline-stage${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
            >
              <span className='pipeline-stage__node'>
                {isDone ? <Check size={14} /> : <StageIcon size={14} />}
              </span>
              <strong>{stage.label}</strong>
              <small>
                {isDone
                  ? 'complete'
                  : isCurrent
                    ? STATE_VISUALS[agent.state].shortLabel
                    : 'queued'}
              </small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Timeline({
  agents,
  events,
  selectedAgentId,
  selectedEventId,
  onSelectAgent,
  onSelectEvent,
  now,
}: {
  agents: Agent[];
  events: AgentEvent[];
  selectedAgentId: string;
  selectedEventId: string | null;
  onSelectAgent: (agentId: string) => void;
  onSelectEvent: (eventId: string) => void;
  now: number;
}) {
  const windowMs = 5 * 60_000;
  return (
    <section className='timeline' aria-labelledby='timeline-title'>
      <div className='section-title'>
        <div>
          <span className='eyebrow'>Last five minutes</span>
          <h2 id='timeline-title'>Fleet trace</h2>
        </div>
        <div className='timeline-scale' aria-hidden='true'>
          <span>-5m</span>
          <span>-4m</span>
          <span>-3m</span>
          <span>-2m</span>
          <span>-1m</span>
          <span>now</span>
        </div>
      </div>
      <div className='timeline__body'>
        <div className='timeline__grid' aria-hidden='true'>
          {Array.from({ length: 6 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        {agents.slice(0, 6).map(agent => {
          const agentEvents = events.filter(
            event =>
              event.agentId === agent.id && now - event.timestamp <= windowMs
          );
          const activeDuration = agent.startedAt
            ? Math.max(0, Math.min(windowMs, now - agent.startedAt))
            : 0;
          return (
            <div
              className={`timeline-lane${selectedAgentId === agent.id ? ' is-selected' : ''}`}
              key={agent.id}
            >
              <button type='button' onClick={() => onSelectAgent(agent.id)}>
                <span className='timeline-lane__code'>{agent.callsign}</span>
                <span className='timeline-lane__name'>{agent.name}</span>
              </button>
              <div className='timeline-lane__events'>
                {agentEvents.map(event => {
                  const age = Math.min(
                    windowMs,
                    Math.max(0, now - event.timestamp)
                  );
                  const left = 100 - (age / windowMs) * 100;
                  return (
                    <button
                      type='button'
                      key={event.id}
                      title={`${event.title} · ${relativeTime(event.timestamp, now)}`}
                      aria-label={`${agent.name}: ${event.title}`}
                      onClick={() => {
                        onSelectAgent(agent.id);
                        onSelectEvent(event.id);
                      }}
                      className={`timeline-event timeline-event--${event.kind}${selectedEventId === event.id ? ' is-selected' : ''}`}
                      style={{ left: `${left}%` }}
                    />
                  );
                })}
                {ACTIVE_STATES.includes(agent.state) ? (
                  <span
                    className={`timeline-span timeline-span--${agent.state}`}
                    style={
                      {
                        '--span-width': `${Math.max(2, (activeDuration / windowMs) * 100)}%`,
                      } as CSSProperties
                    }
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AttentionCenter({
  agents,
  events,
  selectedEventId,
  onSelectAgent,
  onSelectEvent,
  onHandleEvent,
  onAcknowledgeAll,
  onClearResolved,
  pendingCommands,
  now,
}: {
  agents: Agent[];
  events: AgentEvent[];
  selectedEventId: string | null;
  onSelectAgent: (agentId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onHandleEvent: (
    eventId: string,
    action: 'acknowledge' | 'resolve' | 'retry' | 'approve'
  ) => void;
  onAcknowledgeAll: () => void;
  onClearResolved: () => void;
  pendingCommands: PendingAgentCommand[];
  now: number;
}) {
  const alerts = events.filter(
    event =>
      !event.resolved &&
      (event.actionable ||
        event.severity === 'critical' ||
        event.severity === 'warning' ||
        event.kind === 'completion')
  );
  const unread = alerts.filter(event => !event.acknowledged).length;

  return (
    <section className='attention-center' aria-labelledby='attention-title'>
      <div className='panel-heading panel-heading--bordered'>
        <div>
          <span className='eyebrow'>Actionable signals</span>
          <h2 id='attention-title'>Attention</h2>
        </div>
        <div className='panel-actions'>
          <IconButton
            label='Acknowledge all'
            onClick={onAcknowledgeAll}
            disabled={unread === 0}
          >
            <CheckCheck size={15} />
          </IconButton>
          <IconButton label='Clear resolved' onClick={onClearResolved}>
            <X size={15} />
          </IconButton>
          <span className='count-badge count-badge--alert'>{unread}</span>
        </div>
      </div>

      <div className='attention-list'>
        {alerts.slice(0, 5).map(event => {
          const agent = agents.find(item => item.id === event.agentId);
          const AlertIcon = KIND_ICONS[event.kind];
          const pendingCommand = pendingCommands.find(
            command =>
              command.eventId === event.id &&
              ['queued', 'sent', 'accepted'].includes(command.status)
          );
          const focusEvent = () => {
            onSelectAgent(event.agentId);
            onSelectEvent(event.id);
          };
          return (
            <article
              key={event.id}
              className={`attention-card severity-${event.severity}${event.acknowledged ? ' is-acknowledged' : ''}${selectedEventId === event.id ? ' is-selected' : ''}`}
              role='group'
              aria-label={`${agent?.name || event.agentId}: ${event.title}`}
            >
              <div className='attention-card__signal'>
                <AlertIcon size={16} aria-hidden='true' />
              </div>
              <div className='attention-card__body'>
                <div className='attention-card__meta'>
                  <span>{agent?.name || event.agentId}</span>
                  <time dateTime={new Date(event.timestamp).toISOString()}>
                    {relativeTime(event.timestamp, now)}
                  </time>
                </div>
                <button
                  type='button'
                  className='attention-card__focus'
                  onClick={focusEvent}
                >
                  <strong>{event.title}</strong>
                </button>
                <p>{event.detail}</p>
                <div
                  className='attention-card__actions'
                  onClick={click => click.stopPropagation()}
                  onKeyDown={key => key.stopPropagation()}
                >
                  {pendingCommand ? (
                    <button
                      type='button'
                      className='action-button action-button--pending'
                      disabled
                    >
                      <Clock3 size={13} /> {pendingCommand.status}
                    </button>
                  ) : null}
                  {event.kind === 'approval' && !pendingCommand ? (
                    <button
                      type='button'
                      className='action-button action-button--primary'
                      onClick={() => onHandleEvent(event.id, 'approve')}
                    >
                      <ShieldCheck size={13} /> Approve
                    </button>
                  ) : null}
                  {(event.kind === 'error' || event.severity === 'critical') &&
                  !pendingCommand ? (
                    <button
                      type='button'
                      className='action-button action-button--primary'
                      onClick={() => onHandleEvent(event.id, 'retry')}
                    >
                      <RotateCcw size={13} /> Retry
                    </button>
                  ) : null}
                  {!event.acknowledged ? (
                    <button
                      type='button'
                      className='action-button'
                      onClick={() => onHandleEvent(event.id, 'acknowledge')}
                    >
                      <Check size={13} /> Acknowledge
                    </button>
                  ) : (
                    <button
                      type='button'
                      className='action-button'
                      onClick={() => onHandleEvent(event.id, 'resolve')}
                    >
                      <CheckCheck size={13} /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {alerts.length === 0 ? (
          <div className='attention-empty'>
            <CircleCheck size={24} />
            <strong>Queue clear</strong>
            <span>No agent needs operator input.</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TraceInspector({
  agent,
  event,
  onTogglePause,
  commandPending,
}: {
  agent: Agent;
  event: AgentEvent | undefined;
  onTogglePause: (agentId: string) => void;
  commandPending: boolean;
}) {
  const EventIcon = event ? KIND_ICONS[event.kind] : Activity;
  const isPaused = agent.state === 'waiting';
  return (
    <section className='trace-inspector' aria-labelledby='inspector-title'>
      <div className='panel-heading panel-heading--bordered'>
        <div>
          <span className='eyebrow'>Selected payload</span>
          <h2 id='inspector-title'>Trace inspector</h2>
        </div>
        <IconButton
          label={isPaused ? `Resume ${agent.name}` : `Pause ${agent.name}`}
          active={isPaused}
          toggle
          disabled={commandPending}
          onClick={() => onTogglePause(agent.id)}
        >
          {commandPending ? (
            <Clock3 size={15} />
          ) : isPaused ? (
            <Play size={15} />
          ) : (
            <Pause size={15} />
          )}
        </IconButton>
      </div>
      <div className='inspector-body'>
        <div className='inspector-event'>
          <span
            className={`inspector-event__icon${event ? ` severity-${event.severity}` : ''}`}
          >
            <EventIcon size={16} />
          </span>
          <div>
            <span>
              {event ? SEVERITY_LABELS[event.severity] : 'Agent snapshot'}
            </span>
            <strong>{event?.title || agent.currentStep}</strong>
          </div>
        </div>
        <dl className='inspector-grid'>
          <div>
            <dt>Agent</dt>
            <dd>{agent.callsign}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>{STATE_VISUALS[agent.state].shortLabel}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{event?.source || 'snapshot'}</dd>
          </div>
          <div>
            <dt>Kind</dt>
            <dd>{event?.kind || 'state'}</dd>
          </div>
          <div>
            <dt>Tool</dt>
            <dd>{event?.tool || '—'}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>
              {event?.durationMs ? formatDuration(event.durationMs) : '—'}
            </dd>
          </div>
        </dl>
        <div className='inspector-detail'>
          <span>Summary</span>
          <p>{event?.detail || agent.currentStep}</p>
        </div>
        {event?.artifact ? (
          <div className='artifact-row'>
            <Code2 size={14} />
            <span>Artifact</span>
            <strong>{event.artifact}</strong>
          </div>
        ) : null}
        <div className='capability-row'>
          {agent.capabilities.map(capability => (
            <span key={capability}>{capability}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FleetHealth({
  agents,
  events,
  now,
}: {
  agents: Agent[];
  events: AgentEvent[];
  now: number;
}) {
  const measuredSuccess = agents
    .map(agent => agent.metrics.successRate)
    .filter((value): value is number => value !== null);
  const averageSuccess =
    measuredSuccess.reduce((sum, value) => sum + value, 0) /
    Math.max(1, measuredSuccess.length);
  const measuredLatency = agents
    .map(agent => agent.metrics.latencyMs)
    .filter(value => value > 0);
  const averageLatency =
    measuredLatency.reduce((sum, value) => sum + value, 0) /
    Math.max(1, measuredLatency.length);
  const throughput = events.filter(
    event => now - event.timestamp < 60_000
  ).length;
  const contextUsed = agents.reduce(
    (sum, agent) => sum + agent.metrics.tokensUsed,
    0
  );
  const contextTotal = agents.reduce(
    (sum, agent) => sum + agent.metrics.contextWindow,
    0
  );
  const contextPercent = contextTotal
    ? Math.round((contextUsed / contextTotal) * 100)
    : 0;
  return (
    <section className='fleet-health' aria-labelledby='health-title'>
      <div className='section-title section-title--compact'>
        <div>
          <span className='eyebrow'>Rolling telemetry</span>
          <h2 id='health-title'>Fleet health</h2>
        </div>
        <Activity size={16} aria-hidden='true' />
      </div>
      <HealthBar
        label='Completion quality'
        value={measuredSuccess.length ? `${averageSuccess.toFixed(1)}%` : '—'}
        percent={averageSuccess}
        tone='success'
      />
      <HealthBar
        label='Context allocation'
        value={`${contextPercent}%`}
        percent={contextPercent}
        tone='info'
      />
      <HealthBar
        label='Mean latency'
        value={formatDuration(Math.round(averageLatency))}
        percent={Math.min(100, averageLatency / 30)}
        tone={averageLatency > 1800 ? 'warning' : 'neutral'}
      />
      <div className='health-stats'>
        <div>
          <strong>{throughput}</strong>
          <span>signals / min</span>
        </div>
        <div>
          <strong>
            {agents.reduce((sum, agent) => sum + agent.metrics.queueDepth, 0)}
          </strong>
          <span>queued tasks</span>
        </div>
        <div>
          <strong>
            {
              agents.filter(
                agent =>
                  agent.state !== 'offline' && now - agent.lastSeen < 120_000
              ).length
            }
          </strong>
          <span>heartbeats</span>
        </div>
      </div>
    </section>
  );
}

function HealthBar({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: string;
}) {
  return (
    <div className={`health-bar health-bar--${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i>
        <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </i>
    </div>
  );
}

function Footer({
  agents,
  events,
  connection,
  connectionSource,
}: {
  agents: Agent[];
  events: AgentEvent[];
  connection: ConnectionState;
  connectionSource: ConnectionSource;
}) {
  const unresolved = events.filter(
    event => event.actionable && !event.resolved
  ).length;
  return (
    <footer className='ops-footer'>
      <div className='ops-footer__channel'>
        <Radio size={13} />
        <span>CHANNEL</span>
        <strong>hal-agent-events</strong>
      </div>
      <div className='ops-footer__sources'>
        <span>
          <i className='source-ok' /> Window API
        </span>
        <span>
          <i
            className={
              typeof BroadcastChannel === 'undefined'
                ? 'source-offline'
                : 'source-ok'
            }
          />{' '}
          BroadcastChannel
        </span>
        <span>
          <i
            className={
              connectionSource === 'websocket' && connection === 'connected'
                ? 'source-ok'
                : connectionSource === 'websocket' && connection === 'offline'
                  ? 'source-offline'
                  : 'source-standby'
            }
          />{' '}
          WebSocket
        </span>
      </div>
      <div className='ops-footer__summary'>
        <span>{agents.length} registered</span>
        <span>{events.length} retained signals</span>
        <span>{unresolved} unresolved</span>
      </div>
    </footer>
  );
}

export function AgentConsole() {
  const controller = useAgentSystem();
  const {
    state,
    selectedAgent,
    selectedEvents,
    selectAgent,
    setFilter,
    setSimulation,
    setSound,
    requestDesktopAlerts,
    handleEvent,
    acknowledgeAll,
    clearResolved,
    toggleAgentPause,
    liveSourceConfigured,
    reconnectLive,
  } = controller;
  const [query, setQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    selectedEvents[0]?.id || null
  );
  const now = useClock();

  useEffect(() => {
    if (
      !selectedEventId ||
      !state.events.some(event => event.id === selectedEventId)
    ) {
      setSelectedEventId(selectedEvents[0]?.id || null);
    }
  }, [selectedEventId, selectedEvents, state.events]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (
        event.key === '/' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isEditableTarget
      ) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('.ops-search input')?.focus();
      }
      if (event.key === 'Escape' && !event.isComposing) {
        const searchInput =
          document.querySelector<HTMLInputElement>('.ops-search input');
        if (target === searchInput || !isEditableTarget) setQuery('');
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  if (!selectedAgent) {
    return (
      <div className='agent-console'>
        <Header
          agents={state.agents}
          events={state.events}
          query={query}
          onQueryChange={setQuery}
          simulationEnabled={state.simulationEnabled}
          setSimulation={setSimulation}
          soundEnabled={state.soundEnabled}
          setSound={setSound}
          desktopAlertsEnabled={state.desktopAlertsEnabled}
          requestDesktopAlerts={requestDesktopAlerts}
          connection={state.connection}
          connectionLabel={state.connectionLabel}
          liveSourceConfigured={liveSourceConfigured}
          onReconnectLive={reconnectLive}
          now={now}
        />
        <div className='ops-empty-state' role='status'>
          <strong>No agents registered yet</strong>
          <span>
            {state.connection === 'offline'
              ? 'The live source is offline. Restart the bridge or resume the event simulation to continue.'
              : 'Waiting for the first agent event to arrive.'}
          </span>
        </div>
        <Footer
          agents={state.agents}
          events={state.events}
          connection={state.connection}
          connectionSource={state.connectionSource}
        />
      </div>
    );
  }
  const selectedEvent = state.events.find(
    event => event.id === selectedEventId
  );

  return (
    <div className='agent-console'>
      <Header
        agents={state.agents}
        events={state.events}
        query={query}
        onQueryChange={setQuery}
        simulationEnabled={state.simulationEnabled}
        setSimulation={setSimulation}
        soundEnabled={state.soundEnabled}
        setSound={setSound}
        desktopAlertsEnabled={state.desktopAlertsEnabled}
        requestDesktopAlerts={requestDesktopAlerts}
        connection={state.connection}
        connectionLabel={state.connectionLabel}
        liveSourceConfigured={liveSourceConfigured}
        onReconnectLive={reconnectLive}
        now={now}
      />

      <div className='ops-workspace'>
        <AgentRail
          agents={state.agents}
          selectedId={selectedAgent.id}
          onSelect={agentId => {
            selectAgent(agentId);
            const latest = state.events.find(
              event => event.agentId === agentId
            );
            setSelectedEventId(latest?.id || null);
          }}
          filter={state.filter}
          onFilter={setFilter}
          query={query}
          events={state.events}
          now={now}
        />

        <main className='ops-main'>
          <div className='ops-primary-grid'>
            <AgentLens agent={selectedAgent} now={now} />
            <CognitionStream
              agent={selectedAgent}
              events={selectedEvents}
              now={now}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          </div>
          <Pipeline agent={selectedAgent} />
          <Timeline
            agents={state.agents}
            events={state.events}
            selectedAgentId={selectedAgent.id}
            selectedEventId={selectedEventId}
            onSelectAgent={selectAgent}
            onSelectEvent={setSelectedEventId}
            now={now}
          />
        </main>

        <aside className='ops-right-rail' aria-label='Operations inspector'>
          <AttentionCenter
            agents={state.agents}
            events={state.events}
            selectedEventId={selectedEventId}
            onSelectAgent={selectAgent}
            onSelectEvent={setSelectedEventId}
            onHandleEvent={handleEvent}
            onAcknowledgeAll={acknowledgeAll}
            onClearResolved={clearResolved}
            pendingCommands={state.pendingCommands}
            now={now}
          />
          <TraceInspector
            agent={selectedAgent}
            event={selectedEvent}
            onTogglePause={toggleAgentPause}
            commandPending={state.pendingCommands.some(
              command =>
                command.agentId === selectedAgent.id &&
                (command.action === 'pause' || command.action === 'resume') &&
                ['queued', 'sent', 'accepted'].includes(command.status)
            )}
          />
          <FleetHealth agents={state.agents} events={state.events} now={now} />
        </aside>
      </div>

      <Footer
        agents={state.agents}
        events={state.events}
        connection={state.connection}
        connectionSource={state.connectionSource}
      />
      <div className='sr-only' aria-live='polite'>
        {selectedAgent.name} is{' '}
        {STATE_VISUALS[selectedAgent.state].label.toLowerCase()}.
      </div>
    </div>
  );
}
