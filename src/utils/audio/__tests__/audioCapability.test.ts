import {
  detectAudioCapability,
  isLiveAudioAvailable,
  liveAudioButtonLabel,
  presentAudioHint,
} from '../audioCapability';

describe('audioCapability', () => {
  it('reports both capabilities when Web Audio and getUserMedia exist', () => {
    const capability = detectAudioCapability({
      AudioContext:
        function AudioContext() {} as unknown as typeof AudioContext,
      mediaDevices: { getUserMedia: () => Promise.resolve({} as MediaStream) },
    });

    expect(capability).toEqual({
      webAudio: true,
      microphone: true,
      reason: null,
    });
    expect(isLiveAudioAvailable(capability)).toBe(true);
  });

  it('explains a missing Web Audio implementation without throwing', () => {
    const capability = detectAudioCapability({
      mediaDevices: { getUserMedia: () => Promise.resolve({} as MediaStream) },
    });

    expect(capability.webAudio).toBe(false);
    expect(capability.microphone).toBe(true);
    expect(capability.reason).toMatch(/Web Audio is unavailable/);
    expect(capability.reason).toMatch(/still renders/);
    expect(isLiveAudioAvailable(capability)).toBe(false);
  });

  it('accepts the prefixed Web Audio constructor', () => {
    const capability = detectAudioCapability({
      webkitAudioContext:
        function webkitAudioContext() {} as unknown as typeof AudioContext,
      mediaDevices: { getUserMedia: () => Promise.resolve({} as MediaStream) },
    });

    expect(capability.webAudio).toBe(true);
    expect(isLiveAudioAvailable(capability)).toBe(true);
  });

  it('explains a missing microphone while Web Audio is present', () => {
    const capability = detectAudioCapability({
      AudioContext:
        function AudioContext() {} as unknown as typeof AudioContext,
      mediaDevices: null,
    });

    expect(capability.webAudio).toBe(true);
    expect(capability.microphone).toBe(false);
    expect(capability.reason).toMatch(/Microphone capture is unavailable/);
  });

  it('labels the studio control for supported, active, and unavailable audio', () => {
    expect(liveAudioButtonLabel(true, false)).toBe('🔇 Enable Audio');
    expect(liveAudioButtonLabel(true, true)).toBe('🎵 Audio Active');
    expect(liveAudioButtonLabel(false, false)).toBe('Audio unavailable');
  });

  it('replaces the present-mode hint when live audio cannot start', () => {
    expect(presentAudioHint(true, false, null)).toBe(
      'Click to activate • Double-click to edit'
    );
    expect(presentAudioHint(true, true, null)).toBe('');
    expect(
      presentAudioHint(false, false, 'Microphone capture is unavailable.')
    ).toBe('Microphone capture is unavailable.');
    expect(presentAudioHint(true, false, 'Permission was denied.')).toBe(
      'Permission was denied.'
    );
  });
});
