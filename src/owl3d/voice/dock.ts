import type { PortalMode } from '../config';
import type { VoiceState } from './voice';

/**
 * On-screen voice controls: a record button (hold to talk, or tap to start
 * and tap again to send), a level meter, hands-free listening, and stop for
 * when HAL is talking.
 *
 * In side-by-side stereo the dock is drawn once per eye at the same spot in
 * each half, squeezed like the rest of the frame, so it fuses into a single
 * flat control at the glass. Either copy works.
 */

export interface DockCallbacks {
  onRecordDown(): void;
  onRecordUp(): void;
  onHandsFree(): void;
  onStop(): void;
  /** Pick a microphone by label ('' for the system default). */
  onInput(label: string): void;
}

export interface MicOption {
  label: string;
  isDefault: boolean;
}

const LABELS: Record<VoiceState, string> = {
  off: 'Voice off',
  loading: 'Loading Whisper',
  ready: 'Hold ● or . to talk',
  recording: 'Recording · release to send',
  listening: 'Listening (hands-free)',
  hearing: 'Hearing you',
  transcribing: 'Transcribing',
  speaking: 'HAL speaking',
  error: 'Mic error',
};

class DockView {
  readonly root = document.createElement('div');
  private readonly record = document.createElement('button');
  private readonly label = document.createElement('span');
  private readonly detail = document.createElement('span');
  private readonly fill = document.createElement('i');
  private readonly handsFree = document.createElement('button');
  private readonly stop = document.createElement('button');
  private readonly input = document.createElement('select');

  constructor(callbacks: DockCallbacks) {
    this.root.className = 'voice-dock';

    this.record.type = 'button';
    this.record.className = 'voice-dock__record';
    this.record.setAttribute('aria-label', 'Hold to talk to HAL');
    this.record.title =
      'Hold to talk (or tap to start, tap again to send) · ⌘⌥. from anywhere';
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

    const text = document.createElement('span');
    text.className = 'voice-dock__text';
    this.label.className = 'voice-dock__label';
    this.detail.className = 'voice-dock__detail';
    text.append(this.label, this.detail);

    const meter = document.createElement('span');
    meter.className = 'voice-dock__meter';
    meter.append(this.fill);

    this.handsFree.type = 'button';
    this.handsFree.className = 'voice-dock__toggle';
    this.handsFree.textContent = 'Hands-free';
    this.handsFree.title = 'Listen all the time instead of push-to-talk (⌘⌥M)';
    this.handsFree.addEventListener('click', callbacks.onHandsFree);

    this.stop.type = 'button';
    this.stop.className = 'voice-dock__stop';
    this.stop.textContent = 'Stop';
    this.stop.title = 'Stop HAL talking';
    this.stop.addEventListener('click', callbacks.onStop);

    const keys = document.createElement('kbd');
    keys.textContent = '. hold · ⌘⌥.';
    keys.title = 'Hold . in this window, or ⌘⌥. anywhere to start and stop';

    this.input.className = 'voice-dock__input';
    this.input.title = 'Microphone';
    this.input.setAttribute('aria-label', 'Microphone');
    this.input.addEventListener('change', () =>
      callbacks.onInput(this.input.value)
    );

    this.root.append(
      this.record,
      text,
      meter,
      this.stop,
      this.input,
      this.handsFree,
      keys
    );
    document.body.append(this.root);
  }

  render(
    state: VoiceState,
    detail: string,
    handsFree: boolean,
    warning = ''
  ): void {
    this.root.dataset.state = state;
    this.root.classList.toggle('has-warning', Boolean(warning));
    this.record.setAttribute('aria-pressed', String(state === 'recording'));
    this.label.textContent = LABELS[state];
    this.detail.textContent =
      warning || (state === 'error' || state === 'loading' ? detail : '');
    this.stop.hidden = state !== 'speaking';
    this.handsFree.setAttribute('aria-pressed', String(handsFree));
  }

  level(value: number): void {
    this.fill.style.transform = `scaleX(${Math.min(1, Math.max(0, value)).toFixed(3)})`;
  }

  inputs(options: readonly MicOption[], selected: string): void {
    const fallback = options.find(option => option.isDefault)?.label ?? '';
    const items: Array<[string, string]> = [
      ['', `Mic: system default${fallback ? ` (${fallback})` : ''}`],
      ...options
        .filter(option => !option.isDefault)
        .map((option): [string, string] => [
          option.label,
          `Mic: ${option.label}`,
        ]),
    ];
    this.input.replaceChildren(
      ...items.map(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        return option;
      })
    );
    this.input.value = items.some(([value]) => value === selected)
      ? selected
      : '';
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
        style.left = '20px';
        style.transform = '';
        return;
      }
      // Same spot in each eye's half; squeezed when the panel stretches halves.
      style.left = `calc(${index * 50}% + ${squeeze ? 10 : 20}px)`;
      style.transform = squeeze ? 'scaleX(0.5)' : '';
    });
  }

  render(
    state: VoiceState,
    detail: string,
    handsFree: boolean,
    warning = ''
  ): void {
    this.views.forEach(view => view.render(state, detail, handsFree, warning));
  }

  inputs(options: readonly MicOption[], selected: string): void {
    this.views.forEach(view => view.inputs(options, selected));
  }

  level(value: number): void {
    this.views.forEach(view => view.level(value));
  }
}
