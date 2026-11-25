/**
 * Detect whether this browser can drive live, microphone-reactive visuals.
 * The design tool keeps rendering when either capability is missing.
 */

export interface AudioCapability {
  webAudio: boolean;
  microphone: boolean;
  /** Why live audio cannot start. Null when both capabilities are present. */
  reason: string | null;
}

interface AudioGlobalSource {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  mediaDevices?: { getUserMedia?: unknown } | null;
}

const WEB_AUDIO_REASON =
  'Web Audio is unavailable in this browser. The design still renders without live audio.';
const MICROPHONE_REASON =
  'Microphone capture is unavailable in this browser. The design still renders without live audio.';

function browserAudioSource(): AudioGlobalSource {
  if (typeof window === 'undefined') return {};

  const source: AudioGlobalSource = {
    mediaDevices:
      typeof navigator === 'undefined'
        ? null
        : (navigator.mediaDevices ?? null),
  };
  if (typeof window.AudioContext === 'function') {
    source.AudioContext = window.AudioContext;
  }
  const webkit = (
    window as Window & { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext;
  if (typeof webkit === 'function') {
    source.webkitAudioContext = webkit;
  }
  return source;
}

export function detectAudioCapability(
  source?: AudioGlobalSource
): AudioCapability {
  const resolved = source ?? browserAudioSource();

  const webAudio = Boolean(
    resolved.AudioContext || resolved.webkitAudioContext
  );
  const microphone = Boolean(resolved.mediaDevices?.getUserMedia);

  let reason: string | null = null;
  if (!webAudio) {
    reason = WEB_AUDIO_REASON;
  } else if (!microphone) {
    reason = MICROPHONE_REASON;
  }

  return { webAudio, microphone, reason };
}

export function isLiveAudioAvailable(capability: AudioCapability): boolean {
  return capability.webAudio && capability.microphone;
}

/** Toolbar label. Keeps the existing active/idle copy when audio can start. */
export function liveAudioButtonLabel(
  isSupported: boolean,
  isActive: boolean
): string {
  if (!isSupported) return 'Audio unavailable';
  return isActive ? '🎵 Audio Active' : '🔇 Enable Audio';
}

/** Present-mode hint. An unavailable reason replaces the click instruction. */
export function presentAudioHint(
  isSupported: boolean,
  isActive: boolean,
  unavailableReason: string | null
): string {
  if (!isSupported || (unavailableReason && !isActive)) {
    return (
      unavailableReason ??
      'Live audio is unavailable. The design still renders.'
    );
  }
  if (isActive) return '';
  return 'Click to activate • Double-click to edit';
}
