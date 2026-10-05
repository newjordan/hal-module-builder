/**
 * Model manifest for Blender exports (public/owl3d/models/manifest.json).
 *
 * Each entry places one glTF/GLB file on a socket of the HAL eye, in the room,
 * or as the block an agent builds when it uses a given tool. Pure parsing so
 * a bad manifest reports precise errors instead of breaking the portal.
 */

export const SOCKETS = [
  'eye.top',
  'eye.bottom',
  'eye.left',
  'eye.right',
  'eye.back',
  'eye.front',
  'eye.orbit',
  'eye.body',
  'world',
  'build',
] as const;

export type Socket = (typeof SOCKETS)[number];
export type Tint = 'none' | 'state' | 'tool';
export type Vec3 = [number, number, number];

export interface ModelEntry {
  id: string;
  file: string;
  attach: Socket;
  position: Vec3;
  /** Degrees, XYZ order, as Blender shows them after the glTF Y-up swap. */
  rotation: Vec3;
  scale: number;
  /** 'state' recolors materials named HAL_State*, 'tool' recolors HAL_Tool*. */
  tint: Tint;
  /** Agent state or bot activity → animation clip name. '*' is the fallback. */
  clips: Record<string, string>;
  /** Radians per second around the local Y axis. */
  spin: number;
  orbitRadius: number;
  orbitSpeed: number;
  /** For 'build' models: tool names (regex source) this block replaces. */
  tools: string[];
  /** Hide the default metal shell (for 'eye.body' replacements). */
  hideShell: boolean;
  enabled: boolean;
}

export interface ParsedManifest {
  models: ModelEntry[];
  errors: string[];
}

const SOCKET_SET = new Set<string>(SOCKETS);
const TINTS = new Set<string>(['none', 'state', 'tool']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function vec3(value: unknown, fallback: Vec3): Vec3 | null {
  if (value === undefined) return fallback;
  if (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(n => typeof n === 'number' && Number.isFinite(n))
  ) {
    return [value[0] as number, value[1] as number, value[2] as number];
  }
  return null;
}

function finite(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseManifest(input: unknown): ParsedManifest {
  const errors: string[] = [];
  const models: ModelEntry[] = [];
  const list = isRecord(input) ? input.models : undefined;
  if (!Array.isArray(list)) {
    return {
      models,
      errors: ['manifest must be an object with a "models" array'],
    };
  }
  const seen = new Set<string>();

  list.forEach((raw, index) => {
    const where = `models[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${where} must be an object`);
      return;
    }
    const id =
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : `model-${index}`;
    const file = typeof raw.file === 'string' ? raw.file.trim() : '';
    if (
      !/^[\w./-]+\.(glb|gltf)$/i.test(file) ||
      file.includes('..') ||
      file.startsWith('/')
    ) {
      errors.push(
        `${where} (${id}): "file" must be a relative .glb or .gltf path`
      );
      return;
    }
    const attach = typeof raw.attach === 'string' ? raw.attach : 'eye.top';
    if (!SOCKET_SET.has(attach)) {
      errors.push(
        `${where} (${id}): unknown "attach" ${JSON.stringify(attach)}; use one of ${SOCKETS.join(', ')}`
      );
      return;
    }
    if (seen.has(id)) {
      errors.push(`${where}: duplicate id "${id}"`);
      return;
    }
    const position = vec3(raw.position, [0, 0, 0]);
    const rotation = vec3(raw.rotation, [0, 0, 0]);
    const scale = finite(raw.scale, 1);
    const spin = finite(raw.spin, 0);
    const orbitRadius = finite(raw.orbitRadius, 1.7);
    const orbitSpeed = finite(raw.orbitSpeed, 0.8);
    if (!position || !rotation) {
      errors.push(
        `${where} (${id}): "position" and "rotation" must be [x, y, z] numbers`
      );
      return;
    }
    if (
      scale === null ||
      scale <= 0 ||
      spin === null ||
      orbitRadius === null ||
      orbitSpeed === null
    ) {
      errors.push(
        `${where} (${id}): "scale" must be > 0; "spin", "orbitRadius", "orbitSpeed" must be numbers`
      );
      return;
    }
    const tint =
      typeof raw.tint === 'string' && TINTS.has(raw.tint)
        ? (raw.tint as Tint)
        : 'state';
    const clips: Record<string, string> = {};
    if (isRecord(raw.clips)) {
      for (const [key, value] of Object.entries(raw.clips)) {
        if (typeof value === 'string' && value) clips[key] = value;
      }
    }
    const tools = Array.isArray(raw.tools)
      ? raw.tools.filter(
          (tool): tool is string => typeof tool === 'string' && tool.length > 0
        )
      : [];
    if (attach === 'build' && !tools.length) {
      errors.push(
        `${where} (${id}): build models need a "tools" list, e.g. ["Bash"]`
      );
      return;
    }
    seen.add(id);
    models.push({
      id,
      file,
      attach: attach as Socket,
      position,
      rotation,
      scale,
      tint,
      clips,
      spin,
      orbitRadius,
      orbitSpeed,
      tools,
      hideShell: raw.hideShell === true,
      enabled: raw.enabled !== false,
    });
  });

  return { models: models.filter(model => model.enabled), errors };
}

/** Clip to play for a bot, preferring its activity, then its state, then '*'. */
export function clipFor(
  entry: Pick<ModelEntry, 'clips'>,
  state: string,
  activity: string
): string | null {
  return (
    entry.clips[activity] ?? entry.clips[state] ?? entry.clips['*'] ?? null
  );
}

/** Whether a build model replaces the block for this tool. */
export function buildsTool(
  entry: Pick<ModelEntry, 'tools'>,
  tool: string
): boolean {
  return entry.tools.some(pattern => {
    try {
      return new RegExp(`^(?:${pattern})$`, 'i').test(tool);
    } catch {
      return pattern.toLowerCase() === tool.toLowerCase();
    }
  });
}
