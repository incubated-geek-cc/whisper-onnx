import { useState, useRef, useCallback } from 'react';
import { ModelConfig, WorkerMessage, WorkerResponse } from '@/workers/whisper-worker';

export interface TranscriptionSegment {
  text: string;
  timestamp: [number, number];
}

export interface TranscriptionResult {
  text: string;
  chunks?: TranscriptionSegment[];
}

export interface LoadingProgress {
  status: string;
  progress: number;
  file: string;
}

export const useWhisperWorker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelConfig | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const transcriptionResolve = useRef<((r: TranscriptionResult) => void) | null>(null);
  const transcriptionReject = useRef<((e: Error) => void) | null>(null);
  const segmentsRef = useRef<TranscriptionSegment[]>([]);

  const initializeWorker = useCallback(() => {
    if (workerRef.current) return;
    const worker = new Worker(new URL('../workers/whisper-worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, status, progress, file, modelConfig, segment, error: workerError } = event.data;

      switch (type) {
        case 'configured':
          if (modelConfig) {
            setCurrentModel(modelConfig);
            setIsReady(false);
          }
          break;
        case 'loading':
          setLoadingProgress({ status, progress: progress || 0, file: file || '' });
          break;
        case 'ready':
          setIsLoading(false);
          setIsReady(true);
          setLoadingProgress(null);
          break;
        case 'transcribe-start':
          setIsTranscribing(true);
          setSegments([]);
          segmentsRef.current = [];
          break;
        case 'partial':
          if (segment) {
            setSegments(prev => [...prev, segment]);
            segmentsRef.current = [...segmentsRef.current, segment];
          }
          break;
        case 'transcribe-complete':
          setIsTranscribing(false);
          if (transcriptionResolve.current) {
            const finalSegments = segmentsRef.current;
            transcriptionResolve.current({
              text: finalSegments.map(s => s.text).join(' '),
              chunks: finalSegments
            });
          }
          transcriptionResolve.current = null;
          transcriptionReject.current = null;
          break;
        case 'error':
          setIsLoading(false);
          setIsTranscribing(false);
          setError(workerError || 'Unknown error');
          if (transcriptionReject.current) {
            transcriptionReject.current(new Error(workerError || 'Transcription failed'));
          }
          transcriptionResolve.current = null;
          transcriptionReject.current = null;
          break;
      }
    };

    worker.onerror = (error) => {
      setError(`Worker error: ${error.message}`);
      setIsLoading(false);
      setIsTranscribing(false);
      if (transcriptionReject.current) transcriptionReject.current(new Error(error.message));
    };

    workerRef.current = worker;
    setIsLoading(true);
    setError(null);
    worker.postMessage({ type: 'load' });
  }, []);
  


  const configureModel = useCallback((modelConfig: ModelConfig) => {
    if (!workerRef.current) return;
    
    setError(null);
    const message: WorkerMessage = { type: 'configure', modelConfig };
    workerRef.current.postMessage(message);
  }, []);

  const loadModel = useCallback(() => {
    if (!workerRef.current) return;
    
    setIsLoading(true);
    setError(null);
    const message: WorkerMessage = { type: 'load' };
    workerRef.current.postMessage(message);
  }, []);

  const transcribe = useCallback(async (audioData: ArrayBuffer, options?: Record<string, any>) => {
    if (!workerRef.current || !isReady) {
      setError('Worker not ready');
      return null;
    }

    return new Promise<TranscriptionResult>((resolve, reject) => {
      transcriptionResolve.current = resolve;
      transcriptionReject.current = reject;

      const message: WorkerMessage = { 
        type: 'transcribe', 
        audio: audioData,
        options 
      };
      workerRef.current!.postMessage(message);
    });
  }, [isReady]);

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
      setIsLoading(false);
      setIsTranscribing(false);
      setLoadingProgress(null);
      setError(null);
      setCurrentModel(null);
      setSegments([]);
      segmentsRef.current = [];
    }
  }, []);

  return {
    isLoading,
    isReady,
    isTranscribing,
    segments,
    loadingProgress,
    error,
    currentModel,
    initializeWorker,
    configureModel,
    loadModel,
    transcribe,
    cleanup
  };
};