/**
 * AudioService - A comprehensive service for managing Web Audio API functionalities.
 *
 * This service manages a single, global AudioContext and provides methods for
 * both audio playback and audio analysis for visualizations.
 * It is designed to be the central point for all audio operations in the application.
 */

let audioContext: AudioContext | null = null;
const activeSources = new Map<string, AudioBufferSourceNode>();

/**
 * Returns the global AudioContext, creating it if it doesn't exist.
 * @returns The global AudioContext instance.
 */
function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Decodes audio data into an AudioBuffer.
 * @param audioData The raw audio data in an ArrayBuffer.
 * @returns A Promise that resolves with the decoded AudioBuffer.
 */
async function decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer> {
  const context = getAudioContext();
  return context.decodeAudioData(audioData);
}

/**
 * Plays audio from a decoded AudioBuffer.
 *
 * @param audioBuffer The AudioBuffer to play.
 * @param layerId A unique ID to track the audio source. If a source with the same ID is already playing, it will be stopped first.
 */
function playAudioBuffer(audioBuffer: AudioBuffer, layerId: string): void {
  const context = getAudioContext();

  // If there's already a sound playing for this layer, stop it.
  if (activeSources.has(layerId)) {
    activeSources.get(layerId)?.stop();
  }

  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(context.destination);
  source.start(0);

  // When playback finishes, remove the source from the active list.
  source.onended = () => {
    activeSources.delete(layerId);
  };

  activeSources.set(layerId, source);
}

/**
 * Stops the audio playback for a specific layer.
 * @param layerId The ID of the layer to stop playback for.
 */
function stopAudio(layerId: string): void {
  if (activeSources.has(layerId)) {
    activeSources.get(layerId)?.stop();
    activeSources.delete(layerId);
  }
}

// --- Visualization-related methods (adapted from the old service) ---

let visualizerStream: MediaStream | null = null;
let visualizerAnalyser: AnalyserNode | null = null;

/**
 * Starts the audio input stream for visualization purposes.
 * @param onDataCallback A callback to receive frequency data on each animation frame.
 */
async function startVisualizer(
  onDataCallback: (data: number[]) => void
): Promise<void> {
  const context = getAudioContext();
  if (!navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia not supported on your browser!');
  }

  visualizerStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = context.createMediaStreamSource(visualizerStream);
  visualizerAnalyser = context.createAnalyser();
  visualizerAnalyser.fftSize = 256;
  source.connect(visualizerAnalyser);

  const dataArray = new Uint8Array(visualizerAnalyser.frequencyBinCount);

  function draw() {
    if (!visualizerAnalyser) return;
    requestAnimationFrame(draw);
    visualizerAnalyser.getByteFrequencyData(dataArray);
    const normalizedData = Array.from(dataArray).map(v => v / 255);
    onDataCallback(normalizedData);
  }

  draw();
}

/**
 * Stops the audio input stream for the visualizer.
 */
function stopVisualizer(): void {
  visualizerStream?.getTracks().forEach(track => track.stop());
  visualizerStream = null;
  visualizerAnalyser = null;
}

/**
 * The main unified AudioService object.
 */
export const AudioService = {
  /**
   * Plays audio from raw audio data.
   * @param audioData The audio data in an ArrayBuffer.
   * @param layerId A unique ID for the audio source.
   */
  async playAudio(audioData: ArrayBuffer, layerId: string): Promise<void> {
    const audioBuffer = await decodeAudioData(audioData);
    playAudioBuffer(audioBuffer, layerId);
  },

  /**
   * Stops audio playback for a given layer ID.
   * @param layerId The ID of the layer to stop.
   */
  stopAudio,

  /**
   * Starts the microphone and provides visualization data.
   * @param onData A callback to receive frequency data.
   */
  startVisualizer,

  /**
   * Stops the microphone visualizer.
   */
  stopVisualizer,

  /**
   * Disposes of the entire audio service, closing the context.
   */
  dispose: (): void => {
    stopVisualizer();
    activeSources.forEach(source => source.stop());
    activeSources.clear();
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    audioContext = null;
  },
};

// Export the dispose function separately for the cleanup in App.tsx
export const disposeAudioService = AudioService.dispose;
