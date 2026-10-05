import type { PortalMode } from '../config';
import type { VoiceState } from './voice';

/**
 * On-screen voice controls, sized for the 3D screen: one big record button
 * (hold to talk, or tap to start and tap again to send) with one big word next
 * to it, and a big stop button while HAL is talking. Everything else lives in
 * the menu bar menu. The button glows with the microphone level.
 *
 * In side-by-side stereo the dock is drawn once per eye at the same spot in
 * each half, squeezed like the rest of the frame, so it fuses into a single
 * flat control at the glass. Either copy works.
 */

export interface DockCallbacks {
  onRecordDown(): void;
  onRecordUp(): void;
  onStop(): void;
}

const WORDS: Record<VoiceState, string> = {
  off: 'OFF',
  loading: 'WAIT',
  ready: 'TALK',
  recording: 'REC',
  listening: 'EARS',
  hearing: 'HEARD',
  transcribing: '…',
  speaking: 'HAL',
  error: 'MIC?',
};

class DockView {
  readonly root = document.createElement('div');
  private readonly record = document.createElement('button');
  private readonly word = document.createElement('span');
  private readonly stop = document.createElement('button');

  constructor(callbacks: DockCallbacks) {
    this.root.className = 'voice-dock';

    this.record.type = 'button';
    this.record.className = 'voice-dock__record';
    this.record.setAttribute('aria-label', 'Hold to talk to HAL');
    this.record.addEventListener('pointerdown', event => {
      event.preventDefault();
      this.record.setPointerCapture(event.pointerId);
      callbacks.onRecordDown();
    });
    const release = (event: PointerEvent) => {
      if (this.record.hasPointerCapture(event.pointerId))
        this.record.releasePointerCapture(event.pointerId);
      callbacks.onRecordUp();
    };
    this.record.addEventListener('pointerup', release);
    this.record.addEventListener('pointercancel', release);

    this.word.className = 'voice-dock__word';

    this.stop.type = 'button';
    this.stop.className = 'voice-dock__stop';
    this.stop.setAttribute('aria-label', 'Stop HAL talking');
    this.stop.addEventListener('click', callbacks.onStop);

    this.root.append(this.record, this.word, this.stop);
    document.body.append(this.root);
  }

  render(state: VoiceState, warning: boolean): void {
    this.root.dataset.state = state;
    this.root.classList.toggle('has-warning', warning);
    this.record.setAttribute('aria-pressed', String(state === 'recording'));
    this.word.textContent = warning ? 'NO MIC' : WORDS[state];
    this.stop.hidden = state !== 'speaking';
  }

  level(value: number): void {
    this.root.style.setProperty(
      '--level',
      Math.min(1, Math.max(0, value)).toFixed(3)
    );
  }
}

export class VoiceDock {
  private readonly views: DockView[];

  constructor(callbacks: DockCallbacks) {
    // Two views: the second is only shown in stereo, for the right eye.
    this.views = [new DockView(callbacks), new DockView(callbacks)];
    this.layout('window', true);
  }

  layout(mode: PortalMode, squeeze: boolean): void {
    const stereo = mode === 'sbs';
    this.views.forEach((view, index) => {
      const style = view.root.style;
      view.root.hidden = index > 0 && !stereo;
      if (!stereo) {
        style.left = '28px';
        style.transform = '';
        return;
      }
      // Same spot in each eye's half; squeezed when the panel stretches halves.
      style.left = `calc(${index * 50}% + ${squeeze ? 14 : 28}px)`;
      style.transform = squeeze ? 'scaleX(0.5)' : '';
    });
  }

  render(state: VoiceState, warning: boolean): void {
    this.views.forEach(view => view.render(state, warning));
  }

  level(value: number): void {
    this.views.forEach(view => view.level(value));
  }
}
