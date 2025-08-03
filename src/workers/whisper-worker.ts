import { pipeline, env } from '@huggingface/transformers';

// Configure environment for local models
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/';

env.backends.onnx.wasm.numThreads = 1; // fallback for WASM
env.backends.onnx.wasm.proxy = true;
env.backends.onnx.wasm.simd = true;
env.backends.onnx.wasm.cacheDir = 'indexeddb://transformers';

// ✅ Force WebGPU if supported
if (navigator.gpu) {
  env.backends.onnx.wasm.proxy = false; // WebGPU bypasses WASM proxy
  env.backends.onnx.backend = 'webgpu';
  console.log('[Whisper] Using WebGPU backend');
} else {
  console.log('[Whisper] WebGPU not available, falling back to WASM');
}

export interface ModelConfig {
  name: string;
  path: string;
  language?: string;
  quantized?: boolean;
  dtype?: 'fp16' | 'fp32' | 'q8' | 'q4';
}

export interface WorkerMessage {
  type: 'load' | 'transcribe' | 'configure';
  modelConfig?: ModelConfig;
  audio?: ArrayBuffer;
  options?: Record<string, any>;
}

export interface WorkerResponse {
  type: 'loading' | 'ready' | 'transcribe-start' | 'transcribe-complete' | 'partial' | 'error' | 'configured';
  status?: string;
  progress?: number;
  file?: string;
  result?: any;
  segment?: { text: string; timestamp: [number, number] }; // ✅ add this
  error?: string;
  modelConfig?: ModelConfig;
}

// Default model configurations
const DEFAULT_MODELS: Record<string, ModelConfig> = {
  'whisper-tiny.en': {
    name: 'Whisper Tiny (English)',
    path: 'Xenova/whisper-tiny.en',
    quantized: true,
    dtype: 'fp16'
  },
  'whisper-base.en': {
    name: 'Whisper Base (English)',
    path: 'Xenova/whisper-base.en',
    quantized: true,
    dtype: 'fp16'
  },
  'whisper-base': {
    name: 'Whisper Base (Multilingual)',
    path: 'Xenova/whisper-base',
    is_multilingual: true,
    quantized: true,
    dtype: 'fp16'
  }
};

class WhisperPipeline {
  static instance: any = null;
  static currentModel: ModelConfig | null = null;

  static async getInstance(modelConfig: ModelConfig, progress_callback?: (data: any) => void): Promise<any> {
    if (this.instance && this.currentModel?.path !== modelConfig.path) {
      this.instance = null;
    }

    if (this.instance === null) {
      this.instance = await pipeline('automatic-speech-recognition', modelConfig.path, {
        progress_callback,
        dtype: modelConfig.dtype || 'fp16'
      });
      this.currentModel = modelConfig;
    }
    return this.instance;
  }

  static reset() {
    this.instance = null;
    this.currentModel = null;
  }
}

let currentModelConfig: ModelConfig = DEFAULT_MODELS['whisper-tiny.en'];

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, modelConfig, audio, options } = event.data;

  try {
      if(type==='configure') {
        if (modelConfig) {
          currentModelConfig = modelConfig;
          WhisperPipeline.reset(); // Reset pipeline when model changes
          
          const response: WorkerResponse = {
            type: 'configured',
            modelConfig: currentModelConfig
          };
          self.postMessage(response);
        }
      } else if(type==='load') {
        try {
          const pipe = await WhisperPipeline.getInstance(currentModelConfig, (data) => {
            const response: WorkerResponse = {
              type: 'loading',
              status: data.status,
              progress: data.progress || 0,
              file: data.file || ''
            };
            self.postMessage(response);
          });
          
          const response: WorkerResponse = { type: 'ready' };
          self.postMessage(response);
        } catch (error) {
          const response: WorkerResponse = { 
            type: 'error', 
            error: `Failed to load model ${currentModelConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
          self.postMessage(response);
        }

      } else if (type === 'transcribe') {
          if (!audio) {
            self.postMessage({ type: 'error', error: 'No audio data provided' });
            return;
          }

          try {
            const pipe = await WhisperPipeline.getInstance(currentModelConfig);
            self.postMessage({ type: 'transcribe-start' });

            const audioArray = new Float32Array(audio);
            const chunkSize = 30 * 16000;
            const stride = 5 * 16000;
            let position = 0;
            let offsetSec = 0; // ✅ initialize offset

            const transcriptionOptions = {
              chunk_length_s: 30,
              stride_length_s: 5,
              return_timestamps: 'segment',
              language: currentModelConfig.language,
              ...options
            };

            const collected: { text: string; timestamp: [number, number] }[] = [];

            while (position < audioArray.length) {
              const chunk = audioArray.slice(position, position + chunkSize);
              const result = await pipe(chunk, transcriptionOptions);

              // ✅ Adjust timestamps by offset
              if (result.chunks) {
                result.chunks.forEach(seg => {
                  seg.timestamp = [
                    seg.timestamp[0] + offsetSec,
                    seg.timestamp[1] + offsetSec
                  ];
                  self.postMessage({ type: 'partial', segment: seg });
                  collected.push(seg);
                });
              }

              position += chunkSize - stride;
              offsetSec = position / 16000;
            }
            self.postMessage({
              type: 'transcribe-complete',
              result: {
                text: collected.map(s => s.text).join(' '),
                chunks: collected
              }
            });
          } catch (error) {
            self.postMessage({
              type: 'error',
              error: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
      } else {
        const response: WorkerResponse = { 
          type: 'error', 
          error: `Unknown message type: ${type}` 
        };
        self.postMessage(response);
      }
  } catch (error) {
    const response: WorkerResponse = { 
      type: 'error', 
      error: `Worker error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
    self.postMessage(response);
  }
});

export { DEFAULT_MODELS };