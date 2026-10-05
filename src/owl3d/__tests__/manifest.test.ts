import { buildsTool, clipFor, parseManifest } from '../manifest';

describe('parseManifest', () => {
  it('fills defaults for a minimal entry', () => {
    const { models, errors } = parseManifest({
      models: [{ id: 'antenna', file: 'antenna.glb' }],
    });
    expect(errors).toEqual([]);
    expect(models[0]).toMatchObject({
      id: 'antenna',
      attach: 'eye.top',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
      tint: 'state',
      enabled: true,
    });
  });

  it('reports each bad entry and keeps the good ones', () => {
    const { models, errors } = parseManifest({
      models: [
        {
          id: 'ok',
          file: 'models/ok.gltf',
          attach: 'world',
          position: [1, 2, 3],
        },
        { id: 'escape', file: '../secret.glb' },
        { id: 'abs', file: '/etc/x.glb' },
        { id: 'socket', file: 'a.glb', attach: 'eye.nose' },
        { id: 'pos', file: 'a.glb', position: [1, 2] },
        { id: 'scale', file: 'a.glb', scale: 0 },
        { id: 'build', file: 'a.glb', attach: 'build' },
        { id: 'ok', file: 'dupe.glb' },
        'nope',
      ],
    });
    expect(models.map(model => model.id)).toEqual(['ok']);
    expect(errors).toHaveLength(8);
    expect(errors.join('\n')).toMatch(/eye\.nose/);
  });

  it('drops disabled entries without error', () => {
    const { models, errors } = parseManifest({
      models: [{ id: 'off', file: 'off.glb', enabled: false }],
    });
    expect(models).toEqual([]);
    expect(errors).toEqual([]);
  });

  it('rejects a manifest without a models array', () => {
    expect(parseManifest(null).errors).toHaveLength(1);
    expect(parseManifest({ models: {} }).errors).toHaveLength(1);
  });
});

describe('rig parts', () => {
  it('accepts known parts and rejects unknown ones', () => {
    const { models, errors } = parseManifest({
      models: [
        { id: 'desk', file: 'desk.glb', attach: 'part', part: 'desk' },
        { id: 'arm', file: 'arm.glb', attach: 'part', part: 'arm.elbow' },
        { id: 'nopart', file: 'x.glb', attach: 'part' },
      ],
    });
    expect(models.map(model => [model.id, model.part])).toEqual([
      ['desk', 'desk'],
    ]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/arm\.elbow|part models need/);
  });

  it('leaves part null for socket models', () => {
    const { models } = parseManifest({ models: [{ id: 'a', file: 'a.glb' }] });
    expect(models[0]?.part).toBeNull();
  });
});

describe('clipFor', () => {
  const entry = {
    clips: { processing: 'Work', celebrate: 'Spin', '*': 'Idle' },
  };
  it('prefers activity, then state, then the fallback', () => {
    expect(clipFor(entry, 'completed', 'celebrate')).toBe('Spin');
    expect(clipFor(entry, 'processing', 'work')).toBe('Work');
    expect(clipFor(entry, 'idle', 'wander')).toBe('Idle');
    expect(clipFor({ clips: {} }, 'idle', 'wander')).toBeNull();
  });
});

describe('buildsTool', () => {
  it('matches tool names case-insensitively, whole name only', () => {
    const entry = { tools: ['Bash', 'mcp__.*'] };
    expect(buildsTool(entry, 'bash')).toBe(true);
    expect(buildsTool(entry, 'mcp__github__create_pr')).toBe(true);
    expect(buildsTool(entry, 'BashOutput')).toBe(false);
    expect(buildsTool({ tools: ['(bad'] }, '(bad')).toBe(true);
  });
});

describe('shipped starter manifest', () => {
  const fs = require('fs') as typeof import('fs');

  const path = require('path') as typeof import('path');
  const dir = path.join(__dirname, '../../../public/owl3d/models');
  const raw: unknown = JSON.parse(
    fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')
  );

  it('parses without errors and every model file exists', () => {
    const { models, errors } = parseManifest(raw);
    expect(errors).toEqual([]);
    expect(models.length).toBeGreaterThan(0);
    for (const model of models)
      expect(fs.existsSync(path.join(dir, model.file))).toBe(true);
  });

  it('routes Bash and Edit work to Blender build blocks', () => {
    const { models } = parseManifest(raw);
    const builds = models.filter(model => model.attach === 'build');
    expect(builds.some(model => buildsTool(model, 'Bash'))).toBe(true);
    expect(builds.some(model => buildsTool(model, 'Edit'))).toBe(true);
    expect(builds.some(model => buildsTool(model, 'Read'))).toBe(false);
  });
});
