import type { PortalMode } from '../config';
import type { VoiceState } from './voice';

/**
 * On-screen voice controls: listen/mute, a level meter, and stop-talking.
 *
 * In side-by-side stereo the dock is drawn once per eye at the same spot in
 * each half, squeezed like the rest of the frame, so it fuses into a single
 * flat control at the glass. Either copy is clickable.
 */

interface DockCallbacks {
  onToggle(): void;
  onStop(): void;
}

const LABELS: Record<VoiceState, string> = {
  off: 'Mic off',
  starting: 'Starting mic',
  loading: 'Loading Whisper',
  listening: 'Listening',
  hearing: 'Hearing you',
  transcribing: 'Transcribing',
  speaking: 'HAL speaking',
  error: 'Mic error',
};

const MIC_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/></svg>`;
const MUTED_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 9.3V6a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 5.1 2.1"/><path d="M19 11a7 7 0 0 1-1.2 3.9M5 11a7 7 0 0 0 10.7 5.9M12 18v3M3 3l18 18"/></svg>`;

class DockView {
  readonly root = document.createElement('div');
  private readonly mic = document.createElement('button');
  private readonly label = document.createElement('span');
  private readonly detail = document.createElement('span');
  private readonly meter = document.createElement('span');
  private readonly fill = document.createElement('i');
  private readonly stop = document.createElement('button');

  constructor(callbacks: DockCallbacks) {
    this.root.className = 'voice-dock';
    this.mic.type = 'button';
    this.mic.className = 'voice-dock__mic';
    this.mic.addEventListener('click', callbacks.onToggle);
    const text = document.createElement('span');
    text.className = 'voice-dock__text';
    this.label.className = 'voice-dock__label';
    this.detail.className = 'voice-dock__detail';
    text.append(this.label, this.detail);
    this.meter.className = 'voice-dock__meter';
    this.meter.append(this.fill);
    this.stop.type = 'button';
    this.stop.className = 'voice-dock__stop';
    this.stop.textContent = 'Stop';
    this.stop.title = 'Stop HAL talking';
    this.stop.addEventListener('click', callbacks.onStop);
    const keys = document.createElement('kbd');
    keys.textContent = '⌘⌥M';
    keys.title = 'Toggle the microphone from anywhere';
    this.root.append(this.mic, text, this.meter, this.stop, keys);
    document.body.append(this.root);
  }

  render(state: VoiceState, detail: string): void {
    const on = state !== 'off' && state !== 'error';
    this.root.dataset.state = state;
    this.mic.innerHTML = on ? MIC_ICON : MUTED_ICON;
    this.mic.setAttribute('aria-pressed', String(on));
    this.mic.setAttribute(
      'aria-label',
      on ? 'Mute the microphone' : 'Listen on the microphone'
    );
    this.mic.title = on ? 'Mute (⌘⌥M)' : 'Listen (⌘⌥M)';
    this.label.textContent = LABELS[state];
    this.detail.textContent =
      state === 'error' || state === 'loading' ? detail : '';
    this.stop.hidden = state !== 'speaking';
  }

  level(value: number): void {
    this.fill.style.transform = `scaleX(${Math.min(1, Math.max(0, value)).toFixed(3)})`;
  }
}

export class VoiceDock {
  private readonly views: DockView[];
  private mode: PortalMode = 'window';
  private squeeze = true;

  constructor(callbacks: DockCallbacks) {
    // Two views: the second is only shown in stereo, for the right eye.
    this.views = [new DockView(callbacks), new DockView(callbacks)];
    this.layout('window', true);
  }

  layout(mode: PortalMode, squeeze: boolean): void {
    this.mode = mode;
    this.squeeze = squeeze;
    const [left, right] = this.views;
    if (!left || !right) return;
    const stereo = mode === 'sbs';
    right.root.hidden = !stereo;
    for (const [index, view] of this.views.entries()) {
      const style = view.root.style;
      if (!stereo) {
        style.left = '20px';
        style.transform = '';
        continue;
      }
      // Same spot in each eye's half; squeezed when the panel stretches halves.
      style.left = `calc(${index * 50}% + ${this.squeeze ? 10 : 20}px)`;
      style.transform = this.squeeze ? 'scaleX(0.5)' : '';
    }
  }

  render(state: VoiceState, detail: string): void {
    this.views.forEach(view => view.render(state, detail));
  }

  level(value: number): void {
    this.views.forEach(view => view.level(value));
  }

  get stereo(): boolean {
    return this.mode === 'sbs';
  }
}
