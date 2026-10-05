/**
 * Energy-based voice activity detection for the portal's microphone.
 *
 * Feed it 16 kHz mono samples in any block size; it frames them (20 ms),
 * tracks the room's noise floor while nobody is talking, and hands back one
 * Float32Array per utterance: from a short pre-roll before speech began to
 * the end of the closing pause. Pure, so it is unit tested.
 */

export interface VadConfig {
  sampleRate: number;
  /** Samples per analysis frame (20 ms at 16 kHz). */
  frameSize: number;
  /** Absolute RMS below which nothing counts as speech. */
  minLevel: number;
  /** Speech is RMS above noise floor × ratio. */
  ratio: number;
  /** Consecutive loud frames that start an utterance. */
  startFrames: number;
  /** Consecutive quiet frames that end one. */
  hangFrames: number;
  /** Frames kept from before speech started. */
  preRollFrames: number;
  /** Loud frames an utterance needs, or it is dropped as a noise blip. */
  minSpeechFrames: number;
  /** Hard cap; a longer utterance is cut and returned. */
  maxFrames: number;
}

export const DEFAULT_VAD: VadConfig = {
  sampleRate: 16_000,
  frameSize: 320,
  minLevel: 0.012,
  ratio: 3,
  startFrames: 3,
  hangFrames: 45,
  preRollFrames: 15,
  minSpeechFrames: 20,
  maxFrames: 1_000,
};

function concat(frames: readonly Float32Array[]): Float32Array {
  const out = new Float32Array(
    frames.reduce((sum, frame) => sum + frame.length, 0)
  );
  let offset = 0;
  for (const frame of frames) {
    out.set(frame, offset);
    offset += frame.length;
  }
  return out;
}

export class VoiceActivityDetector {
  readonly config: VadConfig;
  /** Tracked background level. */
  noise: number;
  /** Peak-held RMS for meters, decays when quiet. */
  level = 0;
  speaking = false;
  private carry = new Float32Array(0);
  private preRoll: Float32Array[] = [];
  private utterance: Float32Array[] = [];
  private startRun = 0;
  private quietRun = 0;
  private loudFrames = 0;

  constructor(config: Partial<VadConfig> = {}) {
    this.config = { ...DEFAULT_VAD, ...config };
    this.noise = this.config.minLevel / this.config.ratio;
  }

  /** Drop anything in progress (e.g. while HAL itself is talking). */
  reset(): void {
    this.carry = new Float32Array(0);
    this.preRoll = [];
    this.utterance = [];
    this.speaking = false;
    this.startRun = 0;
    this.quietRun = 0;
    this.loudFrames = 0;
  }

  /** Returns every utterance completed by these samples (usually none). */
  push(samples: Float32Array): Float32Array[] {
    const { frameSize } = this.config;
    const data = this.carry.length ? concat([this.carry, samples]) : samples;
    const done: Float32Array[] = [];
    let offset = 0;
    for (; offset + frameSize <= data.length; offset += frameSize) {
      const utterance = this.frame(data.slice(offset, offset + frameSize));
      if (utterance) done.push(utterance);
    }
    this.carry = data.slice(offset);
    return done;
  }

  private frame(frame: Float32Array): Float32Array | null {
    const c = this.config;
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += (frame[i] ?? 0) ** 2;
    const rms = Math.sqrt(sum / frame.length);
    this.level = Math.max(rms, this.level * 0.85);
    const loud = rms > Math.max(c.minLevel, this.noise * c.ratio);

    if (!this.speaking) {
      this.preRoll.push(frame);
      if (this.preRoll.length > c.preRollFrames) this.preRoll.shift();
      this.startRun = loud ? this.startRun + 1 : 0;
      // Follow the floor down quickly and up slowly, only between words.
      if (!loud)
        this.noise += (rms - this.noise) * (rms < this.noise ? 0.2 : 0.02);
      if (this.startRun >= c.startFrames) {
        this.speaking = true;
        this.utterance = this.preRoll;
        this.preRoll = [];
        this.loudFrames = this.startRun;
        this.quietRun = 0;
      }
      return null;
    }

    this.utterance.push(frame);
    if (loud) {
      this.loudFrames++;
      this.quietRun = 0;
    } else {
      this.quietRun++;
    }
    if (this.quietRun < c.hangFrames && this.utterance.length < c.maxFrames)
      return null;

    const enough = this.loudFrames >= c.minSpeechFrames;
    const audio = enough ? concat(this.utterance) : null;
    this.utterance = [];
    this.speaking = false;
    this.startRun = 0;
    this.loudFrames = 0;
    this.quietRun = 0;
    return audio;
  }
}
