import * as THREE from 'three';
import { STATE_COLORS } from './config';
import type { Bot, PortalEvent } from './bot';
import { UI_FONT, textSurface } from './fx';
import { clamp, clock, cssColor, damp, scene } from './stage';
import { captionPages, eventWord, stateWord } from './words';

/**
 * Text on the Owl3D Shift has to be huge to read in 3D, so the HUD is just
 * two words: what HAL is doing (state) and the latest action (RUN, EDIT…).
 */
export class Hud {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly surface = textSurface(1600, 600);
  private action = '';
  private drawn = '';
  private visibility = 1;

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 2.4),
      new THREE.MeshBasicMaterial({
        map: this.surface.texture,
        transparent: true,
        depthWrite: false,
      })
    );
    this.mesh.position.set(-4.4, 3.05, -0.8);
    this.mesh.rotation.y = 0.16;
    this.mesh.renderOrder = 10;
    scene.add(this.mesh);
  }

  /** Keep the latest action word worth showing. */
  push(event: PortalEvent, _bot: Bot): void {
    if (event.replay) return;
    const word = eventWord(event);
    if (word) this.action = word;
  }

  /** `quiet` fades the HUD out (subtitles have the stage). */
  draw(bots: readonly Bot[], dt: number, quiet: boolean): void {
    this.visibility += ((quiet ? 0.15 : 1) - this.visibility) * damp(5, dt);
    this.mesh.material.opacity = this.visibility;
    const bot = bots[0];
    if (!bot) return;
    const resting = bot.state === 'idle' || bot.state === 'offline';
    const action = resting ? '' : this.action;
    const word = stateWord(bot.state);
    const color = STATE_COLORS[bot.state];
    const key = `${word}|${action}|${color}`;
    if (key === this.drawn) return;
    this.drawn = key;

    const { canvas, g, texture } = this.surface;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = 'rgba(5,7,9,0.62)';
    g.beginPath();
    g.roundRect(0, 0, canvas.width, canvas.height, 48);
    g.fill();
    g.fillStyle = cssColor(color);
    g.fillRect(0, 60, 26, canvas.height - 120);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `800 230px ${UI_FONT}`;
    g.fillStyle = cssColor(color);
    g.fillText(word, 70, 270, canvas.width - 110);
    if (action) {
      g.font = `800 170px ${UI_FONT}`;
      g.fillStyle = '#eef1f3';
      g.fillText(action, 70, 500, canvas.width - 110);
    }
    texture.needsUpdate = true;
  }
}

/**
 * Subtitles for the conversation, a few huge words at a time: your words in
 * cyan, HAL's in red. Long lines page through while they are spoken.
 */
export class Caption {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly surface = textSurface(2048, 600);
  private pages: string[][] = [];
  private color = 0xff625f;
  private startedAt = 0;
  private duration = 0;
  private page = -1;
  private until = 0;

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 2.58),
      new THREE.MeshBasicMaterial({
        map: this.surface.texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    this.mesh.position.set(3.1, 3.0, -0.6);
    this.mesh.rotation.y = -0.1;
    this.mesh.renderOrder = 11;
    scene.add(this.mesh);
  }

  get showing(): boolean {
    return clock.now < this.until;
  }

  show(text: string, color: number, seconds?: number): void {
    this.pages = captionPages(text);
    this.color = color;
    const words = text.split(/\s+/).length;
    this.duration = seconds ?? clamp(1.2 + words * 0.38, 2.5, 40);
    this.startedAt = clock.now;
    this.until = this.startedAt + this.duration + 1.2;
    this.page = -1;
  }

  /** Keep it up while HAL is still talking. */
  hold(seconds: number): void {
    this.until = Math.max(this.until, clock.now + seconds);
  }

  private drawPage(lines: readonly string[]): void {
    const { canvas, g, texture } = this.surface;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = 'rgba(5,7,9,0.8)';
    g.beginPath();
    g.roundRect(0, 0, canvas.width, canvas.height, 56);
    g.fill();
    g.fillStyle = cssColor(this.color);
    g.fillRect(0, 70, 30, canvas.height - 140);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `800 180px ${UI_FONT}`;
    g.fillStyle = '#ffffff';
    lines.forEach((line, i) =>
      g.fillText(line, 80, 250 + i * 230, canvas.width - 120)
    );
    texture.needsUpdate = true;
  }

  update(dt: number): void {
    if (this.pages.length) {
      const per = this.duration / this.pages.length;
      const index = Math.min(
        this.pages.length - 1,
        Math.floor((clock.now - this.startedAt) / Math.max(per, 1.4))
      );
      if (index !== this.page) {
        this.page = index;
        const lines = this.pages[index];
        if (lines) this.drawPage(lines);
      }
    }
    const material = this.mesh.material;
    material.opacity +=
      ((this.showing ? 1 : 0) - material.opacity) * damp(6, dt);
    this.mesh.visible = material.opacity > 0.01;
  }
}
