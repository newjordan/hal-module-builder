import { cleanTranscript } from './transcript';
import { VoiceActivityDetector } from './vad';
import type { WorkerRequest, WorkerResponse } from './whisper.worker';

/**
 * HAL's ears and mouth.
 *
 * Ears: the microphone at 16 kHz → an audio worklet tap → voice activity
 * detection → Whisper in a worker → `onHeard(text)`.
 * Mouth: `play()` takes speech audio (the shell renders it with macOS `say`)
 * and plays it through the speakers with an analyser, so HAL's eye moves with
 * its own voice. The microphone is gated while HAL talks so it never hears
 * itself.
 */

export type VoiceState =
  | 'off'
  | 'starting'
  | 'loading'
  | 'listening'
  | 'hearing'
  | 'transcribing'
  | 'speaking'
  | 'error';

const MIC_RATE = 16_000;
/** Mic stays deaf this long after HAL stops talking (room echo). */
const ECHO_TAIL_MS = 600;

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

export class Voice {
  state: VoiceState = 'off';
  /** What the HUD shows next to the state: model, progress or error. */
  detail = '';
  /** 0..1, your voice while you speak. */
  micLevel = 0;
  /** 0..1, HAL's voice while it speaks. */
  outLevel = 0;
  onChange: (() => void) | null = null;
  onHeard: ((text: string) => void) | null = null;

  private readonly vad = new VoiceActivityDetector();
  private mic: Mic | null = null;
  private wanted = false;
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

  /** Where to settle after hearing or speaking. */
  private resting(): VoiceState {
    return this.mic ? (this.model ? 'listening' : 'loading') : 'off';
  }

  private set(state: VoiceState, detail?: string): void {
    this.state = state;
    if (detail !== undefined) this.detail = detail;
    this.onChange?.();
  }

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

  async start(): Promise<void> {
    this.wanted = true;
    if (this.mic || this.state === 'starting') return;
    this.set('starting', 'Opening the microphone');
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
      if (!this.wanted) {
        stream.getTracks().forEach(track => track.stop());
        void context.close();
        return;
      }
      this.mic = { context, stream, node };
      this.set('loading', 'Loading Whisper');
      await this.whisper();
      if (this.mic) this.set('listening', this.model);
    } catch (error) {
      this.release();
      this.set('error', error instanceof Error ? error.message : String(error));
    }
  }

  stop(): void {
    this.wanted = false;
    this.release();
    this.set('off', '');
  }

  private release(): void {
    if (!this.mic) return;
    this.mic.stream.getTracks().forEach(track => track.stop());
    this.mic.node.port.onmessage = null;
    void this.mic.context.close();
    this.mic = null;
    this.vad.reset();
    this.micLevel = 0;
  }

  private hear(samples: Float32Array): void {
    if (
      this.speaking ||
      performance.now() < this.deafUntil ||
      this.state === 'loading'
    ) {
      this.vad.reset();
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
      const source = output.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser);
      this.current = source;
      this.speaking++;
      this.vad.reset();
      this.set('speaking');
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
          this.set('speaking');
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
    if (!this.mic) this.micLevel *= 0.85;
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
