import {
  createAudioContext,
  getMicrophoneStream,
  isGetUserMediaSupported,
  isWebAudioSupported,
} from '../webAudioUtils';

describe('webAudioUtils availability', () => {
  const originalAudioContext = globalThis.AudioContext;
  const originalMediaDevices = navigator.mediaDevices;

  afterEach(() => {
    globalThis.AudioContext = originalAudioContext;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it('sees the test doubles as a supported audio environment', () => {
    expect(isWebAudioSupported()).toBe(true);
    expect(isGetUserMediaSupported()).toBe(true);
  });

  it('reports Web Audio as unavailable when no constructor exists', async () => {
    // @ts-expect-error deleting the test double
    delete globalThis.AudioContext;
    (globalThis as { webkitAudioContext?: unknown }).webkitAudioContext =
      undefined;

    expect(isWebAudioSupported()).toBe(false);
    await expect(createAudioContext()).rejects.toThrow(
      /Web Audio API is not available/
    );
  });

  it('wraps a constructor failure instead of leaking the raw exception', async () => {
    globalThis.AudioContext = function FailingAudioContext() {
      throw new Error('blocked by autoplay policy');
    } as unknown as typeof AudioContext;

    await expect(createAudioContext()).rejects.toThrow(
      /Failed to create audio context: blocked by autoplay policy/
    );
  });

  it('maps a denied microphone to a recoverable error', async () => {
    const denied = new Error('denied');
    denied.name = 'NotAllowedError';
    navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(denied);

    await expect(getMicrophoneStream()).rejects.toThrow(
      /Microphone access denied/
    );
  });

  it('fails clearly when the microphone API is missing', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });

    expect(isGetUserMediaSupported()).toBe(false);
    await expect(getMicrophoneStream()).rejects.toThrow(
      /Microphone capture is not available/
    );
  });
});
