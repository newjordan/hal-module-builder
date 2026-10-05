import { cleanTranscript } from './transcript';
import { VoiceActivityDetector } from './vad';
import type { WorkerRequest, WorkerResponse } from './whisper.worker';

/**
 * HAL's ears and mouth.
 *
 * Ears: push-to-talk by default. `beginRecording()` opens the microphone (16
 * kHz, through an audio worklet tap) and collects everything until
 * `endRecording()`, which hands the clip to Whisper in a worker and then to
 * `onHeard(text)`. The mic stays warm for a short while after you finish so
 * the next press is instant, then closes. Hands-free mode instead keeps the
 * mic open and cuts utterances with voice activity detection.
 *
 * Mouth: `play()` takes speech audio (the shell renders it with macOS `say`)
 * and plays it through the speakers with an analyser, so HAL's eye moves with
 * its own voice. Hands-free listening is deaf while HAL talks; pressing to
 * talk cuts HAL off.
 */

export type VoiceState =
  | 'off'
  | 'loading'
  | 'ready'
  | 'recording'
  | 'listening'
  | 'hearing'
  | 'transcribing'
  | 'speaking'
  | 'error';

const MIC_RATE = 16_000;
/** Hands-free listening stays deaf this long after HAL stops talking. */
const ECHO_TAIL_MS = 600;
/** Push-to-talk keeps the mic open this long after a recording ends. */
const WARM_MIC_MS = 15_000;
/** Shorter clips are taps, not speech. */
const MIN_CLIP_SECONDS = 0.35;
const MAX_CLIP_SECONDS = 60;

// Batches the mic into 1024-sample blocks for the main thread.
const TAP_SOURCE = `
class HalMicTap extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(1024); this.length = 0; }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.length++] = channel[i];
        if (this.length === this.buffer.length) {
          this.port.postMessage(this.buffer.slice(0));
          this.length = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('hal-mic-tap', HalMicTap);
`;

interface Mic {
  context: AudioContext;
  stream: MediaStream;
  node: AudioWorkletNode;
}

function concat(chunks: readonly Float32Array[]): Float32Array {
  const out = new Float32Array(
    chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  );
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export class Voice {
  state: VoiceState = 'off';
  /** What the HUD shows next to the state: model, progress or error. */
  detail = '';
  /** 0..1, your voice while you speak. */
  micLevel = 0;
  /** 0..1, HAL's voice while it speaks. */
  outLevel = 0;
  handsFree = false;
  onChange: (() => void) | null = null;
  onHeard: ((text: string) => void) | null = null;

  private enabled = false;
  private readonly vad = new VoiceActivityDetector();
  private mic: Mic | null = null;
  private opening: Promise<Mic | null> | null = null;
  private closeTimer = 0;
  private recordingNow = false;
  private chunks: Float32Array[] = [];
  private recorded = 0;
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private model = '';
  private nextId = 1;
  private readonly pending = new Map<number, (text: string) => void>();
  private output: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private wave = new Float32Array(1024);
  private deafUntil = 0;
  private speaking = 0;
  private current: AudioBufferSourceNode | null = null;
  private generation = 0;
  private queue: Promise<void> = Promise.resolve();

  get recording(): boolean {
    return this.recordingNow;
  }

  /** Where to settle when nothing is happening. */
  private resting(): VoiceState {
    if (!this.enabled) return 'off';
    if (!this.model) return 'loading';
    return this.handsFree && this.mic ? 'listening' : 'ready';
  }

  private set(state: VoiceState, detail?: string): void {
    this.state = state;
    if (detail !== undefined) this.detail = detail;
    this.onChange?.();
  }

  /* ----------------------------- whisper ----------------------------- */

  /** Spin up Whisper (downloads on first use). */
  private whisper(): Promise<void> {
    if (this.ready) return this.ready;
    const worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker = worker;
    this.ready = new Promise<void>((resolve, reject) => {
      worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        if (data.type === 'progress') {
          if (this.state === 'loading')
            this.set(
              'loading',
              `Downloading Whisper ${Math.round(data.percent)}%`
            );
        } else if (data.type === 'ready') {
          this.model = `whisper base.en · ${data.device}`;
          resolve();
        } else if (data.type === 'text') {
          this.pending.get(data.id)?.(data.text);
          this.pending.delete(data.id);
        } else if (data.id !== undefined) {
          console.warn('[owl3d] whisper:', data.message);
          this.pending.get(data.id)?.('');
          this.pending.delete(data.id);
        } else {
          reject(new Error(data.message));
        }
      };
      worker.onerror = event =>
        reject(new Error(event.message || 'Whisper worker failed'));
      worker.postMessage({ type: 'load' } satisfies WorkerRequest);
    });
    this.ready.catch(() => {
      this.ready = null;
      worker.terminate();
    });
    return this.ready;
  }

  /** Transcribe 16 kHz mono audio. */
  async transcribe(audio: Float32Array): Promise<string> {
    await this.whisper();
    const worker = this.worker;
    if (!worker) return '';
    return new Promise(resolve => {
      const id = this.nextId++;
      this.pending.set(id, resolve);
      worker.postMessage(
        { type: 'transcribe', id, audio } satisfies WorkerRequest,
        [audio.buffer]
      );
    });
  }

  /* ------------------------------ enable ------------------------------ */

  /** Voice on: load Whisper now so the first press is quick. */
  async enable(handsFree: boolean): Promise<void> {
    this.enabled = true;
    this.handsFree = handsFree;
    if (!this.model) {
      if (this.state !== 'loading') this.set('loading', 'Loading Whisper');
      try {
        await this.whisper();
      } catch (error) {
        this.set(
          'error',
          error instanceof Error ? error.message : String(error)
        );
        return;
      }
    }
    if (!this.enabled) return;
    if (this.handsFree) {
      await this.openMic();
    } else if (!this.recordingNow) {
      this.scheduleClose();
    }
    if (
      !this.recordingNow &&
      this.state !== 'transcribing' &&
      this.state !== 'speaking'
    ) {
      this.set(this.resting(), this.model);
    }
  }

  disable(): void {
    this.enabled = false;
    this.recordingNow = false;
    this.chunks = [];
    this.closeMic();
    this.set('off', '');
  }

  /* ---------------------------- microphone ---------------------------- */

  private openMic(): Promise<Mic | null> {
    window.clearTimeout(this.closeTimer);
    if (this.mic) return Promise.resolve(this.mic);
    this.opening ??= (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const context = new AudioContext({ sampleRate: MIC_RATE });
        const url = URL.createObjectURL(
          new Blob([TAP_SOURCE], { type: 'text/javascript' })
        );
        await context.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        const node = new AudioWorkletNode(context, 'hal-mic-tap');
        node.port.onmessage = ({ data }: MessageEvent<Float32Array>) =>
          this.hear(data);
        // Keep the tap in the rendered graph without echoing the room.
        const mute = context.createGain();
        mute.gain.value = 0;
        context
          .createMediaStreamSource(stream)
          .connect(node)
          .connect(mute)
          .connect(context.destination);
        this.mic = { context, stream, node };
        return this.mic;
      } catch (error) {
        this.set(
          'error',
          error instanceof Error ? error.message : String(error)
        );
        return null;
      } finally {
        this.opening = null;
      }
    })();
    return this.opening;
  }

  private closeMic(): void {
    window.clearTimeout(this.closeTimer);
    if (!this.mic) return;
    this.mic.stream.getTracks().forEach(track => track.stop());
    this.mic.node.port.onmessage = null;
    void this.mic.context.close();
    this.mic = null;
    this.vad.reset();
    this.micLevel = 0;
    if (this.state === 'listening' || this.state === 'hearing')
      this.set(this.resting());
  }

  /** Push-to-talk: let the mic go after a quiet spell. */
  private scheduleClose(): void {
    window.clearTimeout(this.closeTimer);
    if (this.handsFree || this.recordingNow) return;
    this.closeTimer = window.setTimeout(() => this.closeMic(), WARM_MIC_MS);
  }

  /* ---------------------------- push to talk --------------------------- */

  /** Start capturing what you say (cuts HAL off if it is talking). */
  async beginRecording(): Promise<void> {
    if (this.recordingNow) return;
    if (this.speaking) this.interrupt();
    this.recordingNow = true;
    this.chunks = [];
    this.recorded = 0;
    this.set('recording');
    if (!this.enabled) void this.enable(this.handsFree);
    const mic = await this.openMic();
    if (!mic) this.recordingNow = false;
  }

  /** Stop capturing and send the clip to Whisper. */
  endRecording(): void {
    if (!this.recordingNow) return;
    this.recordingNow = false;
    const audio = concat(this.chunks);
    this.chunks = [];
    this.recorded = 0;
    this.scheduleClose();
    if (audio.length < MIN_CLIP_SECONDS * MIC_RATE) {
      this.set(this.resting());
      return;
    }
    this.understand(audio);
  }

  private hear(samples: Float32Array): void {
    if (this.recordingNow) {
      this.chunks.push(samples);
      this.recorded += samples.length;
      let sum = 0;
      for (let i = 0; i < samples.length; i++) sum += (samples[i] ?? 0) ** 2;
      this.micLevel = Math.min(1, Math.sqrt(sum / samples.length) * 9);
      if (this.recorded >= MAX_CLIP_SECONDS * MIC_RATE) this.endRecording();
      return;
    }
    if (
      !this.handsFree ||
      this.speaking ||
      performance.now() < this.deafUntil ||
      !this.model
    ) {
      this.vad.reset();
      this.micLevel *= 0.8;
      return;
    }
    const utterances = this.vad.push(samples);
    this.micLevel = Math.min(1, this.vad.level * 9);
    if (this.vad.speaking && this.state === 'listening') this.set('hearing');
    if (!this.vad.speaking && this.state === 'hearing' && !utterances.length)
      this.set('listening');
    for (const audio of utterances) this.understand(audio);
  }

  private understand(audio: Float32Array): void {
    this.set('transcribing');
    void this.transcribe(audio).then(raw => {
      if (this.state === 'transcribing')
        this.set(this.vad.speaking ? 'hearing' : this.resting());
      const text = cleanTranscript(raw);
      if (text) this.onHeard?.(text);
    });
  }

  /* ------------------------------- mouth ------------------------------- */

  /** Stop HAL mid-sentence and drop anything queued behind it. */
  interrupt(): void {
    this.generation++;
    try {
      this.current?.stop();
    } catch {
      /* already stopped */
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  /** Play HAL's speech (WAV bytes); resolves when it has finished. */
  play(audio: ArrayBuffer): Promise<void> {
    const generation = this.generation;
    const run = async () => {
      if (generation !== this.generation) return;
      this.output ??= new AudioContext();
      const output = this.output;
      if (output.state === 'suspended') await output.resume();
      if (!this.analyser) {
        this.analyser = output.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.connect(output.destination);
      }
      const buffer = await output.decodeAudioData(audio.slice(0));
      if (generation !== this.generation) return;
      const source = output.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser);
      this.current = source;
      this.speaking++;
      this.vad.reset();
      if (!this.recordingNow) this.set('speaking');
      await new Promise<void>(resolve => {
        source.onended = () => resolve();
        source.start();
      });
      this.speaking--;
      this.current = null;
      this.deafUntil = performance.now() + ECHO_TAIL_MS;
      if (this.state === 'speaking' && !this.speaking) this.set(this.resting());
    };
    this.queue = this.queue.then(run, run);
    return this.queue;
  }

  /** Without the shell: speak with the browser's system voice. */
  say(text: string): Promise<void> {
    const run = () =>
      new Promise<void>(resolve => {
        if (!('speechSynthesis' in window)) return resolve();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onboundary = () => (this.outLevel = 0.9);
        utterance.onstart = () => {
          this.speaking++;
          if (!this.recordingNow) this.set('speaking');
        };
        utterance.onend = utterance.onerror = () => {
          this.speaking = Math.max(0, this.speaking - 1);
          this.deafUntil = performance.now() + ECHO_TAIL_MS;
          if (this.state === 'speaking' && !this.speaking)
            this.set(this.resting());
          resolve();
        };
        speechSynthesis.speak(utterance);
      });
    this.queue = this.queue.then(run, run);
    return this.queue;
  }

  /** Per frame: follow HAL's speech level for the eye. */
  update(): void {
    if (this.analyser && this.speaking) {
      if (this.wave.length !== this.analyser.fftSize)
        this.wave = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(this.wave);
      let sum = 0;
      for (let i = 0; i < this.wave.length; i++)
        sum += (this.wave[i] ?? 0) ** 2;
      const level = Math.min(1, Math.sqrt(sum / this.wave.length) * 7);
      this.outLevel = Math.max(level, this.outLevel * 0.82);
    } else {
      this.outLevel *= 0.85;
    }
    if (!this.recordingNow && !this.handsFree) this.micLevel *= 0.85;
  }

  /** Decode any audio file to 16 kHz mono (for tests and the debug hook). */
  static async toMono16k(data: ArrayBuffer): Promise<Float32Array> {
    const probe = new AudioContext();
    const decoded = await probe.decodeAudioData(data);
    void probe.close();
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * MIC_RATE),
      MIC_RATE
    );
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    return (await offline.startRendering()).getChannelData(0);
  }
}
