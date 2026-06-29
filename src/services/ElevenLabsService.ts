/**
 * ElevenLabs Service - Comprehensive API integration for Text-to-Speech, Speech-to-Speech, and Speech-to-Text
 *
 * This service provides full integration with ElevenLabs API including:
 * - Text-to-Speech (TTS) with advanced voice settings and models
 * - Speech-to-Speech (STS) for voice transformation
 * - Speech-to-Text (STT) for transcription
 */

/**
 * Retrieves the Eleven Labs API key from localStorage.
 * @returns The API key or null if not found.
 */
function getApiKey(): string | null {
  return localStorage.getItem('elevenlabs_api_key');
}

/**
 * Saves the Eleven Labs API key to localStorage.
 * @param apiKey The API key to save.
 */
export function saveApiKey(apiKey: string): void {
  localStorage.setItem('elevenlabs_api_key', apiKey);
}

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_TTS_URL = `${ELEVENLABS_API_BASE}/text-to-speech`;
const ELEVENLABS_STS_URL = `${ELEVENLABS_API_BASE}/speech-to-speech`;
const ELEVENLABS_TRANSCRIPTION_URL = `${ELEVENLABS_API_BASE}/audio/transcriptions`;
const ELEVENLABS_VOICES_URL = `${ELEVENLABS_API_BASE}/voices`;

/**
 * Advanced voice settings for ElevenLabs API
 */
export interface VoiceSettings {
  stability: number; // 0-1, controls consistency
  similarity_boost: number; // 0-1, controls voice cloning accuracy
  style?: number; // 0-1, controls style exaggeration (v2 models)
  use_speaker_boost?: boolean; // Enhances clarity
}

/**
 * Text-to-Speech settings
 */
export interface TTSSettings {
  model_id?: string;
  voice_settings?: VoiceSettings;
  pronunciation_dictionary_locators?: string[];
  seed?: number; // For deterministic output
  previous_text?: string; // For context
  next_text?: string; // For context
  output_format?:
    | 'mp3_44100_128'
    | 'mp3_44100_64'
    | 'mp3_44100_32'
    | 'mp3_44100_16'
    | 'pcm_16000'
    | 'pcm_22050'
    | 'pcm_24000'
    | 'pcm_44100'
    | 'ulaw_8000';
  optimize_streaming_latency?: 0 | 1 | 2 | 3 | 4; // 0 = default, 4 = max optimization
}

/**
 * Speech-to-Speech settings
 */
export interface STSSettings {
  model_id?: string;
  voice_settings?: VoiceSettings;
  seed?: number;
  remove_background_noise?: boolean;
}

/**
 * Available ElevenLabs models
 */
export const ELEVENLABS_MODELS = {
  eleven_monolingual_v1: 'English v1',
  eleven_multilingual_v1: 'Multilingual v1',
  eleven_multilingual_v2: 'Multilingual v2',
  eleven_turbo_v2: 'Turbo v2 (English)',
  eleven_turbo_v2_5: 'Turbo v2.5 (English)',
  eleven_english_sts_v2: 'English STS v2',
  eleven_multilingual_sts_v2: 'Multilingual STS v2',
};

/**
 * Fetches available voices from ElevenLabs API
 */
export async function fetchVoices(): Promise<any[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  try {
    const response = await fetch(ELEVENLABS_VOICES_URL, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    throw error;
  }
}

/**
 * Fetches speech audio data from the Eleven Labs API with advanced settings.
 */
async function getElevenLabsSpeech(
  text: string,
  voiceId: string,
  settings?: TTSSettings
): Promise<ArrayBuffer> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const requestBody = {
    model_id: settings?.model_id || 'eleven_turbo_v2_5',
    text: text,
    voice_settings: settings?.voice_settings || {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true,
    },
    ...(settings?.pronunciation_dictionary_locators && {
      pronunciation_dictionary_locators:
        settings.pronunciation_dictionary_locators,
    }),
    ...(settings?.seed !== undefined && { seed: settings.seed }),
    ...(settings?.previous_text && { previous_text: settings.previous_text }),
    ...(settings?.next_text && { next_text: settings.next_text }),
  };

  const params = new URLSearchParams();
  if (settings?.output_format) {
    params.append('output_format', settings.output_format);
  }
  if (settings?.optimize_streaming_latency !== undefined) {
    params.append(
      'optimize_streaming_latency',
      settings.optimize_streaming_latency.toString()
    );
  }

  try {
    const url = `${ELEVENLABS_TTS_URL}/${voiceId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.error('Eleven Labs TTS API Error:', response.status, errorBody);
      const detail = errorBody?.detail?.message || errorBody?.detail || errorBody?.error || '';
      throw new Error(`ElevenLabs ${response.status}: ${detail || 'request failed'}`);
    }

    const audioData = await response.arrayBuffer();
    return audioData;
  } catch (error) {
    console.error('Failed to fetch speech from Eleven Labs:', error);
    throw error;
  }
}

/**
 * Performs speech-to-speech transformation using ElevenLabs API
 */
async function performSpeechToSpeech(
  audioFile: File | Blob,
  voiceId: string,
  settings?: STSSettings
): Promise<ArrayBuffer> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('model_id', settings?.model_id || 'eleven_english_sts_v2');

  if (settings?.voice_settings) {
    formData.append('voice_settings', JSON.stringify(settings.voice_settings));
  }
  if (settings?.seed !== undefined) {
    formData.append('seed', settings.seed.toString());
  }
  if (settings?.remove_background_noise !== undefined) {
    formData.append(
      'remove_background_noise',
      settings.remove_background_noise.toString()
    );
  }

  try {
    const response = await fetch(`${ELEVENLABS_STS_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Eleven Labs STS API Error:', errorBody);
      throw new Error(`STS API request failed with status ${response.status}`);
    }

    const audioData = await response.arrayBuffer();
    return audioData;
  } catch (error) {
    console.error('Failed to perform speech-to-speech:', error);
    throw error;
  }
}

/**
 * Transcribes audio to text using ElevenLabs API (if available) or fallback
 */
async function transcribeAudio(
  audioFile: File | Blob,
  language?: string
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const formData = new FormData();
  formData.append('audio', audioFile);
  if (language) {
    formData.append('language', language);
  }

  try {
    // Note: ElevenLabs may not have a direct transcription endpoint,
    // this is a placeholder for when/if they add it
    const response = await fetch(ELEVENLABS_TRANSCRIPTION_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      // Fallback to browser's Web Speech API if available
      if (
        'webkitSpeechRecognition' in window ||
        'SpeechRecognition' in window
      ) {
        return await transcribeWithWebSpeechAPI(audioFile);
      }
      throw new Error(
        `Transcription API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Failed to transcribe audio:', error);
    // Try Web Speech API as fallback
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      return await transcribeWithWebSpeechAPI(audioFile);
    }
    throw error;
  }
}

/**
 * Fallback transcription using Web Speech API
 */
async function transcribeWithWebSpeechAPI(
  audioFile: File | Blob
): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      reject(new Error('Web Speech API not supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    // Convert audio file to audio element and play for recognition
    const audio = new Audio(URL.createObjectURL(audioFile));
    audio.play();
    recognition.start();

    audio.onended = () => {
      recognition.stop();
    };
  });
}

/**
 * The comprehensive ElevenLabs service.
 * Provides Text-to-Speech, Speech-to-Speech, and Speech-to-Text capabilities.
 */
export const ElevenLabsService = {
  /**
   * Fetches speech data from ElevenLabs with advanced settings.
   *
   * @param text The text to convert to speech.
   * @param voiceId The voice ID for synthesis.
   * @param settings Advanced TTS settings.
   * @returns A Promise that resolves with an ArrayBuffer of the audio data.
   */
  async getSpeech(
    text: string,
    voiceId: string,
    settings?: TTSSettings
  ): Promise<ArrayBuffer> {
    return getElevenLabsSpeech(text, voiceId, settings);
  },

  /**
   * Converts speech from one voice to another.
   *
   * @param audioFile The audio file to transform.
   * @param voiceId The target voice ID.
   * @param settings STS-specific settings.
   * @returns A Promise that resolves with transformed audio.
   */
  async speechToSpeech(
    audioFile: File | Blob,
    voiceId: string,
    settings?: STSSettings
  ): Promise<ArrayBuffer> {
    return performSpeechToSpeech(audioFile, voiceId, settings);
  },

  /**
   * Transcribes audio speech into text.
   *
   * @param audioFile The audio file to transcribe.
   * @param language Optional language code for transcription.
   * @returns A Promise that resolves with the transcribed text.
   */
  async speechToText(
    audioFile: File | Blob,
    language?: string
  ): Promise<string> {
    return transcribeAudio(audioFile, language);
  },

  /**
   * Fetches available voices from the API.
   */
  async getVoices(): Promise<any[]> {
    return fetchVoices();
  },

  /**
   * Gets available models.
   */
  getModels() {
    return ELEVENLABS_MODELS;
  },
};
