import { useMode, AppMode } from './ModeContext';

interface ModeOption {
  mode: AppMode;
  label: string;
  icon: string;
  shortcut: string;
}

const modes: ModeOption[] = [
  { mode: 'present', label: 'Present', icon: '▶', shortcut: '⌘1' },
  { mode: 'design', label: 'Design', icon: '◆', shortcut: '⌘2' },
];

interface ModeBarProps {
  className?: string;
}

export function ModeBar({ className = '' }: ModeBarProps) {
  const { mode, setMode, isPresenting } = useMode();

  // In present mode, show minimal bar that appears on hover
  if (isPresenting) {
    return (
      <div
        className={`mode-bar mode-bar--minimal ${className}`}
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%) translateY(-100%)',
          transition: 'transform 0.2s ease',
          zIndex: 1000,
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '0 0 8px 8px',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform =
            'translateX(-50%) translateY(-100%)';
        }}
      >
        <button
          onClick={() => setMode('design')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px 12px',
            fontSize: '12px',
            opacity: 0.8,
          }}
        >
          Exit Present Mode (⌘2)
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mode-bar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        background: 'rgba(30, 30, 30, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.5)',
          marginRight: '8px',
          letterSpacing: '0.5px',
        }}
      >
        HAL
      </span>

      {modes.map(option => (
        <button
          key={option.mode}
          onClick={() => setMode(option.mode)}
          title={`${option.label} (${option.shortcut})`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background:
              mode === option.mode
                ? 'rgba(255, 255, 255, 0.15)'
                : 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: mode === option.mode ? 'white' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: mode === option.mode ? 500 : 400,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            if (mode !== option.mode) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }
          }}
          onMouseLeave={e => {
            if (mode !== option.mode) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }
          }}
        >
          <span style={{ fontSize: '14px' }}>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.3)',
        }}
      >
        Ctrl+1 for Present mode
      </span>
    </div>
  );
}
