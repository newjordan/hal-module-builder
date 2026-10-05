import type { AgentStage, AgentState } from '../agent-system/types';

/**
 * World scale. The screen plane is W × H units at z = 0 and the viewer sits D
 * units in front of it, matching the Owl3D Shift's panel and viewing
 * distance (≈2.1 cm per unit). The room is a box behind the glass whose front edges match the
 * screen edges, so nothing is clipped by the frame in stereo.
 */
export const W = 16;
export const H = 9;
/** The Owl3D Shift: a 339 × 200 mm panel (EDID), viewed from 45–100 cm. */
export const PANEL_WIDTH_CM = 33.9;
export const VIEWING_CM = 55;
export const D = (W * VIEWING_CM) / PANEL_WIDTH_CM;
/** 6.4 cm between the eyes, in world units. */
export const EYE_SEPARATION = (W * 6.4) / PANEL_WIDTH_CM;
export const ROOM = { x: 8, floor: -4.5, ceil: 4.5, back: -26 } as const;
export const BOUNDS = {
  x: 6.4,
  yMin: -3.4,
  yMax: 3.3,
  zMin: -21,
  zMax: 3.6,
} as const;
export const BACKGROUND = 0x030406;
export const MAX_BOTS = 4;
export const NAP_AFTER_SECONDS = 8 * 60;
export const STALE_AGENT_SECONDS = 20 * 60;

/** HAL console signal colors (src/components/AgentConsole/agent-console.css). */
export const STATE_COLORS: Record<AgentState, number> = {
  idle: 0xff2a00, // the HAL eye
  thinking: 0x53d8df, // --ops-cyan
  processing: 0xf2b84b, // --ops-gold
  waiting: 0xd99bff, // --ops-violet
  completed: 0x62d995, // --ops-green
  error: 0xff625f, // --ops-red
  offline: 0x3a1410,
};

export const STAGES: AgentStage[] = [
  'intake',
  'context',
  'reason',
  'execute',
  'verify',
  'deliver',
];

export function toolColor(name = ''): number {
  if (/^bash|shell|exec/i.test(name)) return 0x39ff88;
  if (/edit|write|notebook|apply_patch/i.test(name)) return 0x4aa8ff;
  if (/read|grep|glob|search|^ls$|find/i.test(name)) return 0x20e0e0;
  if (/agent|task|workflow/i.test(name)) return 0xc070ff;
  if (/web|fetch|http/i.test(name)) return 0xffb030;
  if (/^mcp__/i.test(name)) return 0xff70c0;
  return 0xb0b8c8;
}

export type PortalMode = 'sbs' | 'window';

export interface PortalSettings {
  mode: PortalMode;
  /** Multiplier on physical eye separation; 0 is flat. */
  depth: number;
  /** Shifts the zero-parallax plane; positive pushes the scene out of the glass. */
  convergence: number;
  swapEyes: boolean;
  /** Each half is stretched to full width by the panel (the Owl3D Shift does). */
  squeeze: boolean;
  hud: boolean;
  /** Listen on the microphone (Whisper) and talk back. */
  voice: boolean;
}

export const DEFAULT_SETTINGS: PortalSettings = {
  mode: 'window',
  depth: 0.5,
  convergence: 0,
  swapEyes: false,
  squeeze: true,
  hud: true,
  voice: false,
};
