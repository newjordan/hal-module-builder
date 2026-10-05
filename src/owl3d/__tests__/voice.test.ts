import { VoiceActivityDetector } from '../voice/vad';
import { cleanTranscript } from '../voice/transcript';

const RATE = 16_000;

function tone(seconds: number, amplitude: number): Float32Array {
  const out = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i++)
    out[i] = amplitude * Math.sin((2 * Math.PI * 220 * i) / RATE);
  return out;
}

function noise(seconds: number, amplitude: number): Float32Array {
  const out = new Float32Array(Math.round(seconds * RATE));
  let seed = 7;
  for (let i = 0; i < out.length; i++) {
    seed = (seed * 16807) % 2147483647;
    out[i] = amplitude * ((seed / 2147483647) * 2 - 1);
  }
  return out;
}

function feed(
  vad: VoiceActivityDetector,
  ...parts: Float32Array[]
): Float32Array[] {
  // Mimic the audio worklet: odd block sizes across frame boundaries.
  const out: Float32Array[] = [];
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 512)
      out.push(...vad.push(part.subarray(i, i + 512)));
  }
  return out;
}

describe('VoiceActivityDetector', () => {
  it('returns one utterance for speech between silences, with pre-roll', () => {
    const vad = new VoiceActivityDetector();
    const utterances = feed(
      vad,
      noise(1, 0.002),
      tone(1.2, 0.2),
      noise(1.2, 0.002)
    );
    expect(utterances).toHaveLength(1);
    const seconds = (utterances[0]?.length ?? 0) / RATE;
    // 1.2 s of speech + up to 0.3 s pre-roll + 0.9 s closing pause.
    expect(seconds).toBeGreaterThan(2.0);
    expect(seconds).toBeLessThan(2.6);
    expect(vad.speaking).toBe(false);
  });

  it('ignores blips shorter than the minimum speech length', () => {
    const vad = new VoiceActivityDetector();
    expect(
      feed(vad, noise(0.5, 0.002), tone(0.2, 0.3), noise(1.5, 0.002))
    ).toEqual([]);
  });

  it('adapts to a noisy room instead of treating it as speech', () => {
    const vad = new VoiceActivityDetector();
    expect(feed(vad, noise(3, 0.02))).toEqual([]);
    expect(vad.noise).toBeGreaterThan(0.005);
    const utterances = feed(vad, tone(1, 0.3), noise(1.2, 0.02));
    expect(utterances).toHaveLength(1);
  });

  it('cuts runaway utterances at the cap', () => {
    const vad = new VoiceActivityDetector({ maxFrames: 100 });
    const utterances = feed(vad, tone(5, 0.2));
    expect(utterances.length).toBeGreaterThanOrEqual(2);
    expect((utterances[0]?.length ?? 0) / RATE).toBeCloseTo(2, 1);
  });

  it('reset drops speech in progress', () => {
    const vad = new VoiceActivityDetector();
    feed(vad, tone(0.6, 0.2));
    expect(vad.speaking).toBe(true);
    vad.reset();
    expect(vad.speaking).toBe(false);
    expect(feed(vad, noise(1.5, 0.002))).toEqual([]);
  });
});

describe('cleanTranscript', () => {
  it('keeps real speech, tidied', () => {
    expect(cleanTranscript('  Hello HAL,   open the pod bay doors. ')).toBe(
      'Hello HAL, open the pod bay doors.'
    );
    expect(cleanTranscript('Thank you.')).toBe('Thank you.');
  });

  it('spells HAL right when you address it', () => {
    expect(
      cleanTranscript('Hey hell, run the test suite and show me what failed.')
    ).toBe('Hey HAL, run the test suite and show me what failed.');
    expect(cleanTranscript('Hal, open the pod bay doors.')).toBe(
      'HAL, open the pod bay doors.'
    );
    expect(cleanTranscript('OK, Hall. Status?')).toBe('OK, HAL. Status?');
    expect(cleanTranscript('Go to hell and back')).toBe('Go to hell and back');
    expect(cleanTranscript('How are you?')).toBe('How are you?');
    expect(cleanTranscript('Hey, how are you?')).toBe('Hey, how are you?');
  });

  it('drops annotations and stock hallucinations', () => {
    for (const junk of [
      '[BLANK_AUDIO]',
      ' (music) ',
      '♪♪',
      'you',
      'Thanks for watching!',
      '...',
      'Subtitles by the Amara.org community',
    ]) {
      expect(cleanTranscript(junk)).toBeNull();
    }
    expect(cleanTranscript('[Music] Run the tests (inaudible)')).toBe(
      'Run the tests'
    );
  });
});
