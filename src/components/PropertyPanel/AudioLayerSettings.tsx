import React, { useState, useEffect, useRef } from 'react';
import { Layer } from '../../types/layer-types';
import {
  ElevenLabsService,
  saveApiKey,
  VoiceSettings,
  TTSSettings,
  STSSettings,
  ELEVENLABS_MODELS,
} from '../../services/ElevenLabsService';
import { AudioService } from '../../services/AudioService';
import {
  GeneratedAudio,
  GeneratedAudioDB,
} from '../../services/GeneratedAudioDB';

import GeneratedAudioList from './GeneratedAudioList';

interface AudioLayerSettingsProps {
  layer: Layer;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  theme: 'frost_light' | 'frost_dark';
}

const AudioLayerSettings: React.FC<AudioLayerSettingsProps> = ({
  layer,
  updateLayer,
  theme,
}) => {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio[]>([]);

  const isDark = theme === 'frost_dark';

  // Styling classes using frost_glass_css
  const sectionClasses = `frost-mb-4 frost-p-3 frost-rounded ${
    isDark ? 'frostdark-standard-glass-card' : 'frostlight-standard-glass-card'
  }`;

  const labelClasses = `frost-block frost-text-sm frost-font-medium frost-mb-1 ${
    isDark ? 'frost-text-gray-300' : 'frost-text-gray-700'
  }`;

  const buttonClasses = isDark
    ? 'frostdark-button-action'
    : 'frostlight-button-action';
  const buttonDangerClasses = isDark
    ? 'frostdark-button-action-danger'
    : 'frostlight-button-action-danger';

  const tabClasses = (isActive: boolean) => {
    const baseClasses =
      'frost-px-4 frost-py-2 frost-text-sm frost-font-medium frost-rounded-t frost-transition-all frost-duration-200';
    if (isActive) {
      return `${baseClasses} ${isDark ? 'frostdark-button-action' : 'frostlight-button-action'}`;
    }
    // Inactive tabs: use frost glass secondary button styling
    return `${baseClasses} frost-btn ${isDark ? 'frost-btn-secondary' : 'frost-btn-secondary'}`;
  };

  // Load voices when component mounts or API key changes
  useEffect(() => {
    loadVoices();
    loadGeneratedAudio();
  }, []);

  // Set HAL as default when voices load and no voice is selected
  useEffect(() => {
    if (availableVoices.length > 0 && !layer.voiceId) {
      const halVoice = availableVoices.find(
        v => v.original_name === 'Timothy' || v.name === 'HAL'
      );
      if (halVoice) {
        updateLayer(layer.id, { voiceId: halVoice.voice_id });
      }
    }
  }, [availableVoices]);

  const loadGeneratedAudio = async () => {
    const audioList = await GeneratedAudioDB.getAllAudio();
    setGeneratedAudio(audioList);
  };

  const handlePlayAudio = async (audioData: ArrayBuffer) => {
    updateLayer(layer.id, { status: 'playing' });
    await AudioService.playAudio(audioData, layer.id);
    updateLayer(layer.id, { status: 'idle' });
  };

  const handleDeleteAudio = async (id: string) => {
    await GeneratedAudioDB.deleteAudio(id);
    loadGeneratedAudio();
  };

  const handleUpdateAudioName = async (id: string, name: string) => {
    await GeneratedAudioDB.updateAudioName(id, name);
    loadGeneratedAudio();
  };

  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const voices = await ElevenLabsService.getVoices();
      // Map Timothy voice to HAL
      const mappedVoices = voices.map(voice => {
        if (voice.name === 'Timothy') {
          return { ...voice, name: 'HAL', original_name: 'Timothy' };
        }
        return voice;
      });
      setAvailableVoices(mappedVoices);
    } catch (error) {
      console.error('Failed to load voices:', error);
      // Use fallback voices if API fails
      setAvailableVoices([
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
        { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
      ]);
    }
    setIsLoadingVoices(false);
  };

  const handleModeChange = (mode: string) => {
    updateLayer(layer.id, { audioMode: mode as any });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateLayer(layer.id, { textToSpeak: e.target.value });
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer(layer.id, { voiceId: e.target.value });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLayer(layer.id, { ttsModel: e.target.value });
  };

  const handleVoiceSettingChange = (
    setting: keyof VoiceSettings,
    value: number | boolean
  ) => {
    const currentSettings = layer.voiceSettings || {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true,
    };
    updateLayer(layer.id, {
      voiceSettings: {
        ...currentSettings,
        [setting]: value,
      },
    });
  };

  const handleOutputFormatChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    updateLayer(layer.id, { outputFormat: e.target.value });
  };

  const handleStreamingOptimizationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateLayer(layer.id, {
      optimizeStreamingLatency: parseInt(e.target.value),
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleGenerateAndPlay = async () => {
    if (layer.audioMode === 'tts') {
      if (!layer.textToSpeak || !layer.voiceId) return;

      updateLayer(layer.id, { status: 'loading' });

      try {
        const settings: TTSSettings = {
          model_id: layer.ttsModel || 'eleven_multilingual_v2',
          ...(layer.voiceSettings !== undefined
            ? { voice_settings: layer.voiceSettings }
            : {}),
          ...(layer.outputFormat !== undefined
            ? { output_format: layer.outputFormat as any }
            : {}),
          ...(layer.optimizeStreamingLatency !== undefined
            ? {
                optimize_streaming_latency: layer.optimizeStreamingLatency as
                  | 0
                  | 1
                  | 2
                  | 3
                  | 4,
              }
            : {}),
          ...(layer.ttsSeed !== undefined ? { seed: layer.ttsSeed } : {}),
          ...(layer.previousContext !== undefined
            ? { previous_text: layer.previousContext }
            : {}),
          ...(layer.nextContext !== undefined
            ? { next_text: layer.nextContext }
            : {}),
        };

        const audioData = await ElevenLabsService.getSpeech(
          layer.textToSpeak,
          layer.voiceId,
          settings
        );

        const newAudio = {
          id: `audio-${Date.now()}`,
          name:
            layer.textToSpeak.substring(0, 20) ||
            `Generated Audio ${generatedAudio.length + 1}`,
          data: audioData,
        };
        await GeneratedAudioDB.saveAudio(newAudio);
        loadGeneratedAudio();

        updateLayer(layer.id, { status: 'playing' });
        await handlePlayAudio(audioData);
        updateLayer(layer.id, { status: 'idle' });
      } catch (error) {
        handleError(error);
      }
    } else if (layer.audioMode === 'sts' && selectedFile) {
      updateLayer(layer.id, { status: 'loading' });

      try {
        const settings: STSSettings = {
          model_id: layer.stsModel || 'eleven_english_sts_v2',
          ...(layer.voiceSettings !== undefined
            ? { voice_settings: layer.voiceSettings }
            : {}),
          ...(layer.stsSeed !== undefined ? { seed: layer.stsSeed } : {}),
          ...(layer.removeBackgroundNoise !== undefined
            ? { remove_background_noise: layer.removeBackgroundNoise }
            : {}),
        };

        const audioData = await ElevenLabsService.speechToSpeech(
          selectedFile,
          layer.voiceId || '',
          settings
        );

        const newAudio = {
          id: `audio-${Date.now()}`,
          name:
            selectedFile.name ||
            `Transformed Audio ${generatedAudio.length + 1}`,
          data: audioData,
        };
        await GeneratedAudioDB.saveAudio(newAudio);
        loadGeneratedAudio();

        updateLayer(layer.id, { status: 'playing' });
        await handlePlayAudio(audioData);
        updateLayer(layer.id, { status: 'idle' });
      } catch (error) {
        handleError(error);
      }
    } else if (layer.audioMode === 'stt' && selectedFile) {
      updateLayer(layer.id, { status: 'loading' });

      try {
        const text = await ElevenLabsService.speechToText(
          selectedFile,
          layer.transcriptionLanguage
        );
        setTranscriptionResult(text);
        updateLayer(layer.id, { status: 'idle', transcriptionResult: text });
      } catch (error) {
        handleError(error);
      }
    }
  };

  const handleError = (error: any) => {
    if (error instanceof Error && error.message === 'API_KEY_MISSING') {
      setIsApiKeyModalOpen(true);
      updateLayer(layer.id, { status: 'idle' });
    } else {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      updateLayer(layer.id, { status: 'error', error: errorMessage });
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput) return;
    saveApiKey(apiKeyInput);
    setIsApiKeyModalOpen(false);
    setApiKeyInput('');
    loadVoices(); // Reload voices with new API key
    handleGenerateAndPlay(); // Retry the action
  };

  // Render TTS settings
  const renderTTSSettings = () => (
    <div className='frost-space-y-4'>
      {/* Text Input */}
      <div>
        <label className={labelClasses}>Text to Speak</label>
        <div
          className={
            isDark
              ? 'frostdark-conv-input-container'
              : 'frostlight-conv-input-container'
          }
        >
          <textarea
            value={layer.textToSpeak || ''}
            onChange={handleTextChange}
            className={`${isDark ? 'frostdark-conv-input' : 'frostlight-conv-input'} frost-min-h-[100px]`}
            rows={3}
            placeholder='Enter text to convert to speech...'
          />
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className={labelClasses}>Model</label>
        <div
          className={
            isDark ? 'frostdark-input-container' : 'frostlight-input-container'
          }
        >
          <select
            value={layer.ttsModel || 'eleven_multilingual_v2'}
            onChange={handleModelChange}
            className={
              isDark ? 'frostdark-input-field' : 'frostlight-input-field'
            }
          >
            {Object.entries(ELEVENLABS_MODELS).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Voice Selection */}
      <div>
        <label className={labelClasses}>
          Voice
          {isLoadingVoices && (
            <span className='frost-ml-2 frost-text-xs'>(Loading...)</span>
          )}
        </label>
        <div
          className={
            isDark ? 'frostdark-input-container' : 'frostlight-input-container'
          }
        >
          <select
            value={layer.voiceId || ''}
            onChange={handleVoiceChange}
            className={
              isDark ? 'frostdark-input-field' : 'frostlight-input-field'
            }
            disabled={isLoadingVoices}
          >
            <option value=''>Select a voice...</option>
            {availableVoices.map(voice => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name}{' '}
                {voice.labels && `(${Object.values(voice.labels).join(', ')})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Voice Settings */}
      <div className={sectionClasses}>
        <h4 className={`${labelClasses} frost-mb-3`}>Voice Settings</h4>

        <div className='frost-space-y-3'>
          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Stability: {(layer.voiceSettings?.stability ?? 0.5).toFixed(2)}
            </label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={layer.voiceSettings?.stability ?? 0.5}
              onChange={e =>
                handleVoiceSettingChange(
                  'stability',
                  parseFloat(e.target.value)
                )
              }
              className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
            />
            <div className='frost-flex frost-justify-between frost-text-xs frost-mt-1 frost-opacity-60'>
              <span>More Variable</span>
              <span>More Stable</span>
            </div>
          </div>

          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Clarity + Similarity:{' '}
              {(layer.voiceSettings?.similarity_boost ?? 0.75).toFixed(2)}
            </label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={layer.voiceSettings?.similarity_boost ?? 0.75}
              onChange={e =>
                handleVoiceSettingChange(
                  'similarity_boost',
                  parseFloat(e.target.value)
                )
              }
              className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
            />
            <div className='frost-flex frost-justify-between frost-text-xs frost-mt-1 frost-opacity-60'>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Style Exaggeration: {(layer.voiceSettings?.style ?? 0).toFixed(2)}
            </label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={layer.voiceSettings?.style ?? 0}
              onChange={e =>
                handleVoiceSettingChange('style', parseFloat(e.target.value))
              }
              className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
            />
            <div className='frost-flex frost-justify-between frost-text-xs frost-mt-1 frost-opacity-60'>
              <span>None</span>
              <span>Exaggerated</span>
            </div>
          </div>

          <div className='frost-flex frost-items-center frost-space-x-2'>
            <input
              type='checkbox'
              id='speaker-boost'
              checked={layer.voiceSettings?.use_speaker_boost ?? true}
              onChange={e =>
                handleVoiceSettingChange('use_speaker_boost', e.target.checked)
              }
              className={isDark ? 'frostdark-checkbox' : 'frostlight-checkbox'}
            />
            <label
              htmlFor='speaker-boost'
              className={`${labelClasses} frost-mb-0`}
            >
              Use Speaker Boost (Enhance Clarity)
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <details className={sectionClasses}>
        <summary className={`${labelClasses} frost-cursor-pointer`}>
          Advanced Settings
        </summary>
        <div className='frost-mt-3 frost-space-y-3'>
          {/* Output Format */}
          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Output Format
            </label>
            <div
              className={
                isDark
                  ? 'frostdark-input-container'
                  : 'frostlight-input-container'
              }
            >
              <select
                value={layer.outputFormat || 'mp3_44100_128'}
                onChange={handleOutputFormatChange}
                className={
                  isDark ? 'frostdark-input-field' : 'frostlight-input-field'
                }
              >
                <option value='mp3_44100_128'>MP3 128kbps</option>
                <option value='mp3_44100_64'>MP3 64kbps</option>
                <option value='mp3_44100_32'>MP3 32kbps</option>
                <option value='mp3_44100_16'>MP3 16kbps</option>
                <option value='pcm_44100'>PCM 44.1kHz</option>
                <option value='pcm_24000'>PCM 24kHz</option>
                <option value='pcm_22050'>PCM 22.05kHz</option>
                <option value='pcm_16000'>PCM 16kHz</option>
                <option value='ulaw_8000'>μ-law 8kHz</option>
              </select>
            </div>
          </div>

          {/* Streaming Optimization */}
          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Streaming Optimization: {layer.optimizeStreamingLatency ?? 0}
            </label>
            <input
              type='range'
              min='0'
              max='4'
              step='1'
              value={layer.optimizeStreamingLatency ?? 0}
              onChange={handleStreamingOptimizationChange}
              className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
            />
            <div className='frost-flex frost-justify-between frost-text-xs frost-mt-1 frost-opacity-60'>
              <span>Default</span>
              <span>Max Optimization</span>
            </div>
          </div>

          {/* Seed for deterministic output */}
          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Seed (for deterministic output)
            </label>
            <div
              className={
                isDark
                  ? 'frostdark-input-container'
                  : 'frostlight-input-container'
              }
            >
              <input
                type='number'
                value={layer.ttsSeed || ''}
                onChange={e => {
                  const parsed = parseInt(e.target.value);
                  updateLayer(layer.id, {
                    ttsSeed: isNaN(parsed) ? 0 : parsed,
                  });
                }}
                className={
                  isDark ? 'frostdark-input-field' : 'frostlight-input-field'
                }
                placeholder='Leave empty for random'
              />
            </div>
          </div>

          {/* Context */}
          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Previous Context
            </label>
            <div
              className={
                isDark
                  ? 'frostdark-input-container'
                  : 'frostlight-input-container'
              }
            >
              <input
                type='text'
                value={layer.previousContext || ''}
                onChange={e =>
                  updateLayer(layer.id, { previousContext: e.target.value })
                }
                className={
                  isDark ? 'frostdark-input-field' : 'frostlight-input-field'
                }
                placeholder='Text that comes before (for better prosody)'
              />
            </div>
          </div>

          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Next Context
            </label>
            <div
              className={
                isDark
                  ? 'frostdark-input-container'
                  : 'frostlight-input-container'
              }
            >
              <input
                type='text'
                value={layer.nextContext || ''}
                onChange={e =>
                  updateLayer(layer.id, { nextContext: e.target.value })
                }
                className={
                  isDark ? 'frostdark-input-field' : 'frostlight-input-field'
                }
                placeholder='Text that comes after (for better prosody)'
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  );

  // Render STS settings
  const renderSTSSettings = () => (
    <div className='frost-space-y-4'>
      {/* File Input */}
      <div>
        <label className={labelClasses}>Input Audio File</label>
        <input
          ref={fileInputRef}
          type='file'
          accept='audio/*'
          onChange={handleFileSelect}
          className={`frost-w-full frost-text-sm ${isDark ? 'frost-text-gray-200' : 'frost-text-gray-900'}`}
        />
        {selectedFile && (
          <p className='frost-text-sm frost-mt-1 frost-opacity-75'>
            Selected: {selectedFile.name}
          </p>
        )}
      </div>

      {/* Model Selection */}
      <div>
        <label className={labelClasses}>Model</label>
        <div
          className={
            isDark ? 'frostdark-input-container' : 'frostlight-input-container'
          }
        >
          <select
            value={layer.stsModel || 'eleven_english_sts_v2'}
            onChange={e => updateLayer(layer.id, { stsModel: e.target.value })}
            className={
              isDark ? 'frostdark-input-field' : 'frostlight-input-field'
            }
          >
            <option value='eleven_english_sts_v2'>English STS v2</option>
            <option value='eleven_multilingual_sts_v2'>
              Multilingual STS v2
            </option>
          </select>
        </div>
      </div>

      {/* Target Voice */}
      <div>
        <label className={labelClasses}>Target Voice</label>
        <div
          className={
            isDark ? 'frostdark-input-container' : 'frostlight-input-container'
          }
        >
          <select
            value={layer.voiceId || ''}
            onChange={handleVoiceChange}
            className={
              isDark ? 'frostdark-input-field' : 'frostlight-input-field'
            }
            disabled={isLoadingVoices}
          >
            <option value=''>Select target voice...</option>
            {availableVoices.map(voice => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name}{' '}
                {voice.labels && `(${Object.values(voice.labels).join(', ')})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Voice Settings (same as TTS) */}
      <div className={sectionClasses}>
        <h4 className={`${labelClasses} frost-mb-3`}>Voice Settings</h4>

        <div className='frost-space-y-3'>
          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Stability: {(layer.voiceSettings?.stability ?? 0.5).toFixed(2)}
            </label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={layer.voiceSettings?.stability ?? 0.5}
              onChange={e =>
                handleVoiceSettingChange(
                  'stability',
                  parseFloat(e.target.value)
                )
              }
              className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
            />
          </div>

          <div>
            <label className={`${labelClasses} frost-text-xs`}>
              Clarity + Similarity:{' '}
              {(layer.voiceSettings?.similarity_boost ?? 0.75).toFixed(2)}
            </label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={layer.voiceSettings?.similarity_boost ?? 0.75}
              onChange={e =>
                handleVoiceSettingChange(
                  'similarity_boost',
                  parseFloat(e.target.value)
                )
              }
              className={`frost-w-full ${isDark ? 'frostdark-slider' : 'frostlight-slider'}`}
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className='frost-space-y-3'>
        <div className='frost-flex frost-items-center frost-space-x-2'>
          <input
            type='checkbox'
            id='remove-noise'
            checked={layer.removeBackgroundNoise ?? false}
            onChange={e =>
              updateLayer(layer.id, { removeBackgroundNoise: e.target.checked })
            }
            className={isDark ? 'frostdark-checkbox' : 'frostlight-checkbox'}
          />
          <label
            htmlFor='remove-noise'
            className={`${labelClasses} frost-mb-0`}
          >
            Remove Background Noise
          </label>
        </div>

        <div>
          <label className={`${labelClasses} frost-text-xs`}>
            Seed (for deterministic output)
          </label>
          <div
            className={
              isDark
                ? 'frostdark-input-container'
                : 'frostlight-input-container'
            }
          >
            <input
              type='number'
              value={layer.stsSeed || ''}
              onChange={e => {
                const parsed = parseInt(e.target.value);
                updateLayer(layer.id, {
                  stsSeed: isNaN(parsed) ? 0 : parsed,
                });
              }}
              className={
                isDark ? 'frostdark-input-field' : 'frostlight-input-field'
              }
              placeholder='Leave empty for random'
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render STT settings
  const renderSTTSettings = () => (
    <div className='frost-space-y-4'>
      {/* File Input */}
      <div>
        <label className={labelClasses}>Audio File to Transcribe</label>
        <input
          ref={fileInputRef}
          type='file'
          accept='audio/*'
          onChange={handleFileSelect}
          className={`frost-w-full frost-text-sm ${isDark ? 'frost-text-gray-200' : 'frost-text-gray-900'}`}
        />
        {selectedFile && (
          <p className='frost-text-sm frost-mt-1 frost-opacity-75'>
            Selected: {selectedFile.name}
          </p>
        )}
      </div>

      {/* Language */}
      <div>
        <label className={labelClasses}>Language (Optional)</label>
        <div
          className={
            isDark ? 'frostdark-input-container' : 'frostlight-input-container'
          }
        >
          <select
            value={layer.transcriptionLanguage || ''}
            onChange={e =>
              updateLayer(layer.id, { transcriptionLanguage: e.target.value })
            }
            className={
              isDark ? 'frostdark-input-field' : 'frostlight-input-field'
            }
          >
            <option value=''>Auto-detect</option>
            <option value='en'>English</option>
            <option value='es'>Spanish</option>
            <option value='fr'>French</option>
            <option value='de'>German</option>
            <option value='it'>Italian</option>
            <option value='pt'>Portuguese</option>
            <option value='nl'>Dutch</option>
            <option value='pl'>Polish</option>
            <option value='ja'>Japanese</option>
            <option value='ko'>Korean</option>
            <option value='zh'>Chinese</option>
          </select>
        </div>
      </div>

      {/* Transcription Result */}
      {transcriptionResult && (
        <div className={sectionClasses}>
          <h4 className={labelClasses}>Transcription Result</h4>
          <div
            className={`frost-p-3 frost-min-h-[100px] ${isDark ? 'frostdark-standard-glass-card' : 'frostlight-standard-glass-card'}`}
          >
            {transcriptionResult}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(transcriptionResult)}
            className={buttonClasses}
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );

  // Render API Key Modal
  const renderApiKeyModal = () => (
    <div className='frost-fixed frost-inset-0 frost-bg-black frost-bg-opacity-50 frost-flex frost-items-center frost-justify-center frost-z-50'>
      <div
        className={`${sectionClasses} frost-max-w-md frost-w-full frost-mx-4`}
      >
        <h3 className={`${labelClasses} frost-text-lg frost-mb-3`}>
          Enter ElevenLabs API Key
        </h3>
        <p className='frost-text-sm frost-mb-4 frost-opacity-75'>
          An API key is required to use ElevenLabs services. You can get one
          from{' '}
          <a
            href='https://elevenlabs.io'
            target='_blank'
            rel='noopener noreferrer'
            className='frost-underline'
          >
            elevenlabs.io
          </a>
        </p>
        <div
          className={
            isDark
              ? 'frostdark-input-container frost-mb-4'
              : 'frostlight-input-container frost-mb-4'
          }
        >
          <input
            type='password'
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            className={
              isDark ? 'frostdark-input-field' : 'frostlight-input-field'
            }
            placeholder='Your API Key...'
            autoFocus
          />
        </div>
        <div className='frost-flex frost-justify-end frost-gap-2'>
          <button
            onClick={() => setIsApiKeyModalOpen(false)}
            className={buttonDangerClasses}
          >
            Cancel
          </button>
          <button onClick={handleSaveApiKey} className={buttonClasses}>
            Save and Continue
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className={sectionClasses}>
      <h3 className={`${labelClasses} frost-text-lg frost-mb-4`}>
        Audio Layer Settings
      </h3>

      {/* Mode Tabs */}
      <div className='frost-flex frost-space-x-1 frost-mb-4'>
        <button
          onClick={() => handleModeChange('tts')}
          className={tabClasses(layer.audioMode === 'tts' || !layer.audioMode)}
        >
          Text to Speech
        </button>
        <button
          onClick={() => handleModeChange('sts')}
          className={tabClasses(layer.audioMode === 'sts')}
        >
          Speech to Speech
        </button>
        <button
          onClick={() => handleModeChange('stt')}
          className={tabClasses(layer.audioMode === 'stt')}
        >
          Speech to Text
        </button>
        <button
          onClick={() => handleModeChange('visualizer')}
          className={tabClasses(layer.audioMode === 'visualizer')}
        >
          Visualizer
        </button>
      </div>

      {/* Content based on mode */}
      {(layer.audioMode === 'tts' || !layer.audioMode) && renderTTSSettings()}
      {layer.audioMode === 'sts' && renderSTSSettings()}
      {layer.audioMode === 'stt' && renderSTTSettings()}
      {layer.audioMode === 'visualizer' && (
        <div className='frost-text-center frost-py-8 frost-opacity-75'>
          <p className={labelClasses}>
            Audio visualizer mode - displays audio waveforms and frequency data
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {layer.audioMode !== 'visualizer' && (
        <div className='frost-mt-6'>
          <button
            onClick={handleGenerateAndPlay}
            disabled={
              layer.status === 'loading' ||
              layer.status === 'playing' ||
              (layer.audioMode === 'tts' &&
                (!layer.textToSpeak || !layer.voiceId)) ||
              ((layer.audioMode === 'sts' || layer.audioMode === 'stt') &&
                !selectedFile)
            }
            className={buttonClasses}
          >
            {layer.status === 'loading' && 'Processing...'}
            {layer.status === 'playing' && 'Playing...'}
            {layer.status !== 'loading' &&
              layer.status !== 'playing' &&
              (layer.audioMode === 'tts'
                ? 'Generate & Play'
                : layer.audioMode === 'sts'
                  ? 'Transform & Play'
                  : layer.audioMode === 'stt'
                    ? 'Transcribe'
                    : 'Process')}
          </button>

          {layer.status === 'error' && (
            <p className='frost-text-red-500 frost-text-sm frost-mt-2'>
              Error: {layer.error}
            </p>
          )}
        </div>
      )}

      {/* Generated Audio List */}
      <div className='frost-mt-6'>
        <GeneratedAudioList
          audioList={generatedAudio}
          onDelete={handleDeleteAudio}
          onUpdateName={handleUpdateAudioName}
          theme={theme}
        />
      </div>

      {/* API Key Modal */}
      {isApiKeyModalOpen && renderApiKeyModal()}
    </div>
  );
};

export default AudioLayerSettings;
