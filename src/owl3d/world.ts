import * as THREE from 'three';
import { BACKGROUND, D, H, MAX_BOTS, ROOM, W } from './config';
import { glowTexture } from './fx';
import { rand, scene } from './stage';

const PULSES = 6;

/** Uniforms shared by every grid surface. */
export const gridUniforms = {
  uTime: { value: 0 },
  uGlowPos: {
    value: Array.from({ length: MAX_BOTS }, () => new THREE.Vector4()),
  },
  uGlowCol: {
    value: Array.from({ length: MAX_BOTS }, () => new THREE.Color()),
  },
  uTiles: {
    value: Array.from({ length: MAX_BOTS }, () => new THREE.Vector4()),
  },
  uTileCol: {
    value: Array.from({ length: MAX_BOTS }, () => new THREE.Color()),
  },
  uPulses: {
    value: Array.from(
      { length: PULSES },
      () => new THREE.Vector4(0, 0, -100, 0)
    ),
  },
  uPulseCol: { value: Array.from({ length: PULSES }, () => new THREE.Color()) },
  uBg: { value: new THREE.Color(BACKGROUND) },
  uLine: { value: new THREE.Color(0x2a5a80) },
  uFloorY: { value: ROOM.floor },
  /** Floor hatch: center x, center z, half size, openness 0..1. */
  uHatch: { value: new THREE.Vector4(0, 0, 1, 0) },
};

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform int uMode;
  uniform vec4 uGlowPos[${MAX_BOTS}];
  uniform vec3 uGlowCol[${MAX_BOTS}];
  uniform vec4 uTiles[${MAX_BOTS}];
  uniform vec3 uTileCol[${MAX_BOTS}];
  uniform vec4 uPulses[${PULSES}];
  uniform vec3 uPulseCol[${PULSES}];
  uniform vec3 uBg;
  uniform vec3 uLine;
  uniform float uFloorY;
  uniform vec4 uHatch;
  varying vec3 vWorld;

  float grid(vec2 c, float cell, float width) {
    vec2 g = c / cell;
    vec2 d = abs(fract(g - 0.5) - 0.5) / (fwidth(g) * width);
    return 1.0 - min(min(d.x, d.y), 1.0);
  }

  void main() {
    // The floor hatch opens onto the inner computer below.
    if (uMode == 0 && vWorld.y < 0.0 && uHatch.w > 0.001 &&
        abs(vWorld.x - uHatch.x) < uHatch.z && abs(vWorld.z - uHatch.y) < uHatch.z) {
      discard;
    }
    vec2 c = uMode == 0 ? vWorld.xz : (uMode == 1 ? vWorld.xy : vWorld.zy);
    float lines = max(grid(c, 2.0, 1.5), grid(c, 0.5, 1.0) * 0.22);

    vec3 glow = vec3(0.0);
    float shadow = 0.0;
    for (int i = 0; i < ${MAX_BOTS}; i++) {
      vec4 g = uGlowPos[i];
      if (g.w <= 0.0) continue;
      float d = distance(vWorld, g.xyz);
      glow += uGlowCol[i] * g.w / (1.0 + d * d * 0.32);
      if (uMode == 0) {
        float h = max(0.4, g.y - vWorld.y);
        float r = distance(vWorld.xz, g.xz);
        shadow = max(shadow, (1.0 - smoothstep(0.0, 0.6 + h * 0.22, r)) * clamp(1.8 / h, 0.0, 0.75));
      }
    }

    vec3 tile = vec3(0.0);
    if (uMode == 0) {
      for (int i = 0; i < ${MAX_BOTS}; i++) {
        vec4 t = uTiles[i];
        if (t.z <= 0.0) continue;
        vec2 center = floor(t.xy / 2.0) * 2.0 + 1.0;
        vec2 q = abs(vWorld.xz - center);
        float m = max(q.x, q.y);
        float inside = step(m, 1.0);
        tile += uTileCol[i] * t.z * (inside * 0.18 + smoothstep(0.82, 1.0, m) * inside * 1.4);
      }
    }

    vec3 pulse = vec3(0.0);
    for (int i = 0; i < ${PULSES}; i++) {
      vec4 p = uPulses[i];
      float age = uTime - p.z;
      if (age < 0.0 || age > 2.6) continue;
      float d = abs(distance(vWorld, vec3(p.x, uFloorY, p.y)) - age * 8.0);
      pulse += uPulseCol[i] * p.w * (1.0 - smoothstep(0.0, 0.4, d)) * (1.0 - age / 2.6);
    }

    vec3 col = uBg * 1.4 + vec3(0.003, 0.005, 0.009);
    col += uLine * lines * 0.6;
    col += glow * (0.12 + lines * 1.6);
    col += tile + pulse * (0.35 + lines * 1.2);
    if (uMode == 0 && vWorld.y < 0.0) {
      vec2 q = abs(vWorld.xz - uHatch.xy) - uHatch.z;
      float rim = 1.0 - smoothstep(0.0, 0.07, abs(max(q.x, q.y)));
      col += vec3(0.32, 0.85, 0.87) * rim * (0.2 + uHatch.w);
    }
    col *= 1.0 - shadow * 0.85;
    col = mix(col, uBg, smoothstep(${(D + 6).toFixed(1)}, ${(D + 32).toFixed(1)}, length(vWorld - cameraPosition)));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** uMode: 0 = floor/ceiling (xz), 1 = back wall (xy), 2 = side walls (zy). */
function gridSurface(
  mode: 0 | 1 | 2,
  width: number,
  height: number,
  position: THREE.Vector3,
  rotation: THREE.Euler
): void {
  const material = new THREE.ShaderMaterial({
    uniforms: { ...gridUniforms, uMode: { value: mode } },
    vertexShader,
    fragmentShader,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.copy(position);
  mesh.rotation.copy(rotation);
  scene.add(mesh);
}

export function buildRoom(): void {
  const depth = -ROOM.back;
  const midZ = ROOM.back / 2;
  gridSurface(
    0,
    W,
    depth,
    new THREE.Vector3(0, ROOM.floor, midZ),
    new THREE.Euler(-Math.PI / 2, 0, 0)
  );
  gridSurface(
    0,
    W,
    depth,
    new THREE.Vector3(0, ROOM.ceil, midZ),
    new THREE.Euler(Math.PI / 2, 0, 0)
  );
  gridSurface(1, W, H, new THREE.Vector3(0, 0, ROOM.back), new THREE.Euler());
  gridSurface(
    2,
    depth,
    H,
    new THREE.Vector3(-ROOM.x, 0, midZ),
    new THREE.Euler(0, Math.PI / 2, 0)
  );
  gridSurface(
    2,
    depth,
    H,
    new THREE.Vector3(ROOM.x, 0, midZ),
    new THREE.Euler(0, -Math.PI / 2, 0)
  );

  // A thin frame where the room meets the glass anchors zero parallax.
  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(W - 0.02, H - 0.02)),
    new THREE.LineBasicMaterial({
      color: 0x3a7fb0,
      transparent: true,
      opacity: 0.6,
    })
  );
  frame.position.z = -0.01;
  scene.add(frame);
}

let pulseIndex = 0;

export function floorPulse(
  x: number,
  z: number,
  color: number,
  strength = 1
): void {
  gridUniforms.uPulses.value[pulseIndex]?.set(
    x,
    z,
    gridUniforms.uTime.value,
    strength
  );
  gridUniforms.uPulseCol.value[pulseIndex]?.set(color);
  pulseIndex = (pulseIndex + 1) % PULSES;
}

/** Drifting dust gives the eyes something to fuse at every depth. */
export function createDust(count = 420): (now: number, dt: number) => void {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-ROOM.x, ROOM.x);
    positions[i * 3 + 1] = rand(ROOM.floor, ROOM.ceil);
    positions[i * 3 + 2] = rand(ROOM.back, 4);
    speeds[i] = rand(0.05, 0.25);
  }
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', attribute);
  scene.add(
    new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: glowTexture,
        color: 0x6fa8d8,
        size: 0.09,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );
  return (now, dt) => {
    for (let i = 0; i < count; i++) {
      const y = i * 3 + 1;
      positions[y] = (positions[y] ?? 0) + (speeds[i] ?? 0.1) * dt * 0.3;
      positions[i * 3] =
        (positions[i * 3] ?? 0) + Math.sin(now * 0.2 + i) * dt * 0.05;
      if ((positions[y] ?? 0) > ROOM.ceil) positions[y] = ROOM.floor;
    }
    attribute.needsUpdate = true;
  };
}
