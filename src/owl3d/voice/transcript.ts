/**
 * Cleans Whisper output before it is treated as something you said.
 *
 * Whisper annotates non-speech ("[BLANK_AUDIO]", "(music)") and, given breath
 * or room noise, hallucinates stock phrases from its training subtitles.
 */

const STOCK_HALLUCINATIONS = [
  /^you\.?$/i,
  /^thanks? for watching[.!]*$/i,
  /^thank you for watching[.!]*$/i,
  /^please subscribe[.!]*$/i,
  /^subtitles? by\b/i,
  /^transcribed by\b/i,
  /^\W+$/,
];

/** Whisper rarely spells the name right: "Hey hell", "Hi Hal", "Hal, …". */
const ADDRESSED =
  /\b(hey|hi|hello|okay|ok|yo|thanks|thank you)([,.!]?\s+)(hal|hell|hall|hale|hel)\b/gi;
const LEADING_NAME = /^(hal|hell|hall|hale)\b(?=[,.!?])/i;

export function cleanTranscript(raw: string): string | null {
  const text = raw
    .replace(/\[[^\]]*\]|\([^)]*\)|\*[^*]*\*|♪+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/[a-z0-9]/i.test(text)) return null;
  if (STOCK_HALLUCINATIONS.some(pattern => pattern.test(text))) return null;
  return text.replace(ADDRESSED, '$1$2HAL').replace(LEADING_NAME, 'HAL');
}
