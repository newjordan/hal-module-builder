import * as THREE from 'three';
import { STATE_COLORS, toolColor } from './config';
import type { Bot, PortalEvent } from './bot';
import { MONO_FONT, UI_FONT, textSurface } from './fx';
import { cssColor, scene } from './stage';

interface LogEntry {
  at: number;
  callsign: string;
  title: string;
  color: number;
}

const time = (at: number): string =>
  new Date(at).toLocaleTimeString([], {
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

/** Status panel floating just behind the glass, top left. */
export class Hud {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly surface = textSurface(1600, 720);
  private readonly log: LogEntry[] = [];
  private notice = '';
  private dirty = true;
  private drawnSecond = -1;

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 2.88),
      new THREE.MeshBasicMaterial({
        map: this.surface.texture,
        transparent: true,
        depthWrite: false,
      })
    );
    this.mesh.position.set(-4.5, 2.85, -0.8);
    this.mesh.rotation.y = 0.16;
    this.mesh.renderOrder = 10;
    scene.add(this.mesh);
  }

  push(event: PortalEvent, bot: Bot): void {
    this.dirty = true;
    if (event.replay || event.kind === 'system') return;
    this.log.unshift({
      at: event.timestamp ?? Date.now(),
      callsign: bot.callsign,
      title: event.title,
      color:
        event.kind === 'tool' && event.state === 'processing'
          ? toolColor(event.tool)
          : event.state
            ? STATE_COLORS[event.state]
            : 0x8a97a3,
    });
    this.log.length = Math.min(this.log.length, 6);
  }

  setNotice(text: string): void {
    this.notice = text;
    this.dirty = true;
  }

  touch(): void {
    this.dirty = true;
  }

  draw(bots: readonly Bot[], connection: string): void {
    const second = Math.floor(Date.now() / 1000);
    if (!this.dirty && second === this.drawnSecond) return;
    this.dirty = false;
    this.drawnSecond = second;
    const { canvas, g, texture } = this.surface;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = 'rgba(7,9,11,0.72)';
    g.strokeStyle = 'rgba(83,216,223,0.35)';
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 28);
    g.fill();
    g.stroke();

    g.textBaseline = 'alphabetic';
    g.textAlign = 'left';
    g.fillStyle = '#ff625f';
    g.beginPath();
    g.arc(56, 64, 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#eef1f3';
    g.font = `700 44px ${UI_FONT}`;
    g.fillText('HAL · OWL3D', 86, 80);
    g.font = `500 30px ${MONO_FONT}`;
    g.fillStyle = connection === 'live' ? '#62d995' : '#8a97a3';
    g.fillText(connection.toUpperCase(), 420, 78);
    g.font = `500 40px ${MONO_FONT}`;
    g.textAlign = 'right';
    g.fillStyle = '#8a97a3';
    g.fillText(time(Date.now()), canvas.width - 44, 80);
    g.textAlign = 'left';

    let y = 150;
    for (const bot of bots) {
      g.fillStyle = cssColor(bot.color.getHex());
      g.beginPath();
      g.arc(56, y - 13, 11, 0, Math.PI * 2);
      g.fill();
      g.font = `700 36px ${MONO_FONT}`;
      g.fillStyle = '#eef1f3';
      g.fillText(bot.callsign, 84, y, 230);
      g.font = `500 36px ${UI_FONT}`;
      g.fillStyle = '#8a97a3';
      g.fillText(bot.name, 330, y, 340);
      g.font = `700 32px ${MONO_FONT}`;
      g.fillStyle = cssColor(STATE_COLORS[bot.state]);
      g.fillText(bot.state.toUpperCase(), 700, y);
      g.font = `500 34px ${UI_FONT}`;
      g.fillStyle = '#c9d1d8';
      g.fillText(bot.title, 960, y, canvas.width - 1010);
      if (bot.contextFraction > 0) {
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(84, y + 14, 560, 6);
        g.fillStyle = bot.contextFraction > 0.8 ? '#ff625f' : '#53d8df';
        g.fillRect(84, y + 14, 560 * bot.contextFraction, 6);
      }
      y += 70;
    }

    y = Math.max(y + 10, 330);
    for (const entry of this.log) {
      if (y > canvas.height - 80) break;
      g.font = `500 32px ${MONO_FONT}`;
      g.fillStyle = '#56616b';
      g.fillText(time(entry.at), 56, y);
      g.fillStyle = cssColor(entry.color);
      g.fillRect(250, y - 24, 6, 30);
      g.fillStyle = '#8a97a3';
      g.fillText(entry.callsign, 276, y, 180);
      g.fillStyle = '#c9d1d8';
      g.font = `500 32px ${UI_FONT}`;
      g.fillText(entry.title, 470, y, canvas.width - 520);
      y += 54;
    }
    if (this.notice) {
      g.font = `500 28px ${MONO_FONT}`;
      g.fillStyle = '#f2b84b';
      g.fillText(this.notice, 56, canvas.height - 34, canvas.width - 100);
    }
    texture.needsUpdate = true;
  }
}
