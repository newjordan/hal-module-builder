import { env, pipeline } from '@huggingface/transformers';

/**
 * Whisper speech-to-text, off the render thread.
 *
 * Runs on WebGPU when the GPU is available (the Apple GPU in practice), else
 * on WebAssembly. Model files download from the Hugging Face hub on first
 * use and are cached by the browser after that.
 */

export const WHISPER_MODEL = 'onnx-community/whisper-base.en';

export type WorkerRequest =
  | { type: 'load' }
  | { type: 'transcribe'; id: number; audio: Float32Array };

export type WorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'ready'; device: string; model: string }
  | { type: 'text'; id: number; text: string; ms: number }
  | { type: 'error'; id?: number; message: string };

type Transcriber = (
  audio: Float32Array
) => Promise<{ text: string } | Array<{ text: string }>>;

const scope = self as unknown as {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

env.allowLocalModels = false;
// In the Owl3D shell, keep downloaded model files on disk (~/.hal/models)
// through its hal://app/hf-cache endpoint, so Whisper loads offline and fast
// after the first run. Downloads still come from the Hugging Face hub.
if (self.location.protocol === 'hal:') {
  const endpoint = (key: string) =>
    `${self.location.origin}/hf-cache?key=${encodeURIComponent(key)}`;
  env.useBrowserCache = false;
  env.useCustomCache = true;
  env.customCache = {
    async match(key: string | Request) {
      const url = typeof key === 'string' ? key : key.url;
      const response = await fetch(endpoint(url));
      return response.ok ? response : undefined;
    },
    async put(key: string | Request, response: Response) {
      const url = typeof key === 'string' ? key : key.url;
      await fetch(endpoint(url), {
        method: 'PUT',
        body: await response.arrayBuffer(),
      });
    },
  };
}

let transcriber: Transcriber | null = null;
let loading: Promise<void> | null = null;
const fileProgress = new Map<string, { loaded: number; total: number }>();

function onProgress(data: unknown): void {
  const info = data as {
    status?: string;
    file?: string;
    loaded?: number;
    total?: number;
  };
  if (info.status !== 'progress' || !info.file || !info.total) return;
  fileProgress.set(info.file, { loaded: info.loaded ?? 0, total: info.total });
  let loaded = 0;
  let total = 0;
  fileProgress.forEach(file => {
    loaded += file.loaded;
    total += file.total;
  });
  scope.postMessage({
    type: 'progress',
    percent: total ? (loaded / total) * 100 : 0,
  });
}

async function gpuAvailable(): Promise<boolean> {
  const gpu = (
    navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }
  ).gpu;
  try {
    return Boolean(gpu && (await gpu.requestAdapter()));
  } catch {
    return false;
  }
}

async function create(device: 'webgpu' | 'wasm'): Promise<Transcriber> {
  const options =
    device === 'webgpu'
      ? { device, dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' } }
      : { device, dtype: 'q8' };
  const asr = await pipeline('automatic-speech-recognition', WHISPER_MODEL, {
    ...options,
    progress_callback: onProgress,
  } as Parameters<typeof pipeline>[2]);
  return asr as unknown as Transcriber;
}

function load(): Promise<void> {
  loading ??= (async () => {
    let device: 'webgpu' | 'wasm' = (await gpuAvailable()) ? 'webgpu' : 'wasm';
    try {
      transcriber = await create(device);
    } catch (error) {
      if (device === 'wasm') throw error;
      device = 'wasm';
      transcriber = await create(device);
    }
    // Compile kernels now so the first real sentence is quick.
    await transcriber(new Float32Array(16_000));
    scope.postMessage({ type: 'ready', device, model: WHISPER_MODEL });
  })();
  return loading;
}

scope.onmessage = ({ data }) => {
  if (data.type === 'load') {
    load().catch(error =>
      scope.postMessage({
        type: 'error',
        message: String(error?.message ?? error),
      })
    );
    return;
  }
  const { id, audio } = data;
  const started = performance.now();
  load()
    .then(async () => {
      if (!transcriber) throw new Error('Whisper did not load');
      const output = await transcriber(audio);
      const text = Array.isArray(output)
        ? output.map(part => part.text).join(' ')
        : output.text;
      scope.postMessage({
        type: 'text',
        id,
        text,
        ms: performance.now() - started,
      });
    })
    .catch(error =>
      scope.postMessage({
        type: 'error',
        id,
        message: String(error?.message ?? error),
      })
    );
};
