import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings, Loader2, LoaderCircle, Heart, Github, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TabNavigation, TabType } from '@/components/TabNavigation';
import { URLInput } from '@/components/URLInput';
import { FileInput } from '@/components/FileInput';
import { RecordInput } from '@/components/RecordInput';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TranscriptionResults } from '@/components/TranscriptionResults';
import { ModelSelector } from '@/components/ModelSelector';
import { useWhisperWorker, TranscriptionResult } from '@/hooks/useWhisperWorker';
import { DEFAULT_MODELS, ModelConfig } from '@/workers/whisper-worker';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { FFmpeg } from '@ffmpeg/ffmpeg';

export const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [selectedModelKey, setSelectedModelKey] = useState<string>('whisper-tiny.en');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Persistent tab states
  const [urlInputValue, setUrlInputValue] = useState('');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    duration?: string;
  } | null>(null);

  const { toast } = useToast();

  const {
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
  } = useWhisperWorker();

  useEffect(() => {
    initializeWorker();
    return cleanup;
  }, [initializeWorker, cleanup]);
  // Prevent navigation during transcription

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You may lose unsaved changes including recordings, processed audio and transcription results. Are you sure you want to leave?';
      return 'You may lose unsaved changes including recordings, processed audio and transcription results. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleModelChange = (modelKey: string) => {
    setSelectedModelKey(modelKey);
    const modelConfig = DEFAULT_MODELS[modelKey];
    if (modelConfig) {
      configureModel(modelConfig);
    }
  };

  const handleLoadModel = () => {
    loadModel();
    setIsSettingsOpen(false);
  };

  const handleAudioLoad = (url: string) => {
    setAudioSrc(url);
    setAudioBlob(null);
    setTranscriptionResult(null);
  };

  const handleWAVConversion = async (input: Blob | File): Promise<Blob | null> => {
    setIsConverting(true);   // ✅ show visual cue
    try {
      // If it's a File, we can access name; otherwise give a default name
      const fileName = input instanceof File ? input.name : 'input.webm';
      const arrayBuffer = await input.arrayBuffer();

      const ffmpeg: FFmpeg = new FFmpeg();
      await ffmpeg.load();

      await ffmpeg.writeFile( fileName , new Uint8Array(arrayBuffer));
      await ffmpeg.exec([
        '-i', fileName, 
        '-ar', '16000', 
        '-ac', '1', 
        '-c:a', 'pcm_s16le', 
        'output.wav'
      ]);
      const wavData = await ffmpeg.readFile('output.wav');
      const wavBlob = new Blob([wavData.buffer], { type: 'audio/wav' });
      return wavBlob;
    } finally {
      setIsConverting(false); // ✅ hide when done
    }
  };

  // Set file details
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleFileSelect = async(file: File) => {
    setSelectedFile(file);
    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size)
    });

    let url;
    if(!file.name.toLowerCase().endsWith('.wav')) {
      const wavBlob = await handleWAVConversion(file);
      url = URL.createObjectURL(wavBlob);
      setTranscriptionResult(null);
       toast({
        title: 'Audio processed',
        description: 'File converted to compatible format'
      });
    } else {
      url = URL.createObjectURL(file);
    }
    setAudioSrc(url);
    setAudioBlob(file);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    const wavBlob = await handleWAVConversion(blob);
    setAudioBlob(wavBlob);
    setAudioSrc(URL.createObjectURL(wavBlob));
    setTranscriptionResult(null);
  };

  const handleTranscribe = async () => {
    if (!isReady) return;
    try {
      let arrayBuffer: ArrayBuffer;
      if (audioBlob) {
        arrayBuffer = await audioBlob.arrayBuffer();
      } else if (audioSrc) {
        const response = await fetch(audioSrc);
        arrayBuffer = await response.arrayBuffer();
      } else {
        return;
      }
      setTranscriptionResult(null);

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const pcmData = audioBuffer.getChannelData(0);

      const ratio = audioBuffer.sampleRate / 16000;
      let monoData = pcmData;
      if (ratio !== 1) {
        const newLength = Math.floor(pcmData.length / ratio);
        monoData = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
          monoData[i] = pcmData[Math.floor(i * ratio)];
        }
      }

      const result = await transcribe(monoData.buffer);
      if (result) setTranscriptionResult(result);
    } catch (error) {
      console.error('Transcription failed:', error);
      toast({
        title: 'Processing failed',
        description: 'Failed to process audio file',
        variant: 'destructive'
      });
    }
  };

  const hasAudio = audioSrc || audioBlob;
  const canTranscribe = hasAudio && isReady && !isTranscribing;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="relative text-center mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-2">
            Whisper Web
          </h1>
          <p className="text-xl text-muted-foreground">
            ML-powered speech recognition directly in your browser
          </p>
          <div className="absolute top-0 right-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Heart className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3">
                <div className="space-y-2">
                  <a
                    href="https://www.buymeacoffee.com/geekcc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors text-sm"
                  >
                    <Heart className="h-4 w-4 text-red-500" /> Buy Me a 🌮Taco
                  </a>
                  <a
                    href="https://github.com/incubated-geek-cc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors text-sm"
                  >
                    <Github className="h-4 w-4" /> View on GitHub
                  </a>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Loading Status */}
        {isLoading && (
          <Card className="p-6 mb-6 bg-muted/50">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="text-sm">
                {loadingProgress ? (
                  <span>
                    {loadingProgress.status}: {Math.round(loadingProgress.progress)}%
                    {loadingProgress.file && (
                      <span className="text-muted-foreground ml-2">
                        ({loadingProgress.file})
                      </span>
                    )}
                  </span>
                ) : (
                  'Loading Whisper model...'
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}

        {/* Main Interface */}
        <Card className="mb-6">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="p-6 space-y-6">
            {/* Tab Content */}
            {activeTab === 'url' && (
              <URLInput 
                onAudioLoad={handleAudioLoad} 
                disabled={isLoading}
                value={urlInputValue}
                onChange={setUrlInputValue}
              />
            )}
            
            {activeTab === 'file' && (
              <FileInput onFileSelect={handleFileSelect} disabled={isLoading} />
            )}
            {activeTab === 'file' && fileDetails && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected File:</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>Name:</strong> {fileDetails.name}</div>
                  <div><strong>Size:</strong> {fileDetails.size}</div>
                  {fileDetails.duration && (
                    <div><strong>Duration:</strong> {fileDetails.duration}</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'record' && (
              <RecordInput 
                onRecordingComplete={handleRecordingComplete} 
                disabled={isLoading} 
                existingBlob={recordingBlob}
              />
            )}

            {isConverting && (
              <Card className="p-4 mb-4 flex items-center gap-3 bg-muted/50">
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Converting audio to WAV format...</span>
              </Card>
            )}

            {/* Audio Player */}
            {hasAudio && (
              <AudioPlayer src={audioSrc} audioBlob={audioBlob} />
            )}

            {/* Transcribe Button and Settings */}
            {hasAudio && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={handleTranscribe}
                  disabled={!canTranscribe}
                  size="lg"
                  className="px-8"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    'Transcribe Audio'
                  )}
                </Button>
                
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="h-10 w-10 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Model Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <ModelSelector
                        models={DEFAULT_MODELS}
                        selectedModel={selectedModelKey}
                        onModelChange={handleModelChange}
                        disabled={isLoading}
                      />
                      
                      {currentModel && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Current Model:</p>
                          <p className="font-medium">{currentModel.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {currentModel.is_multilingual ? 'Multilingual' : 'Language: English'}
                          </p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleLoadModel} 
                        disabled={isLoading || isReady} 
                        className="w-full"
                      >
                        {isLoading ? 'Loading...' : isReady ? 'Model Ready' : 'Load Model'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {/* Transcription Results */}
            <TranscriptionResults 
              result={transcriptionResult}
              isTranscribing={isTranscribing}
              segments={segments}
            />
          </div>
        </Card>


        <div className="text-center mt-12 text-sm text-muted-foreground">
          Made with 🤗 <a 
            href="https://huggingface.co/docs/transformers.js" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >Transformers.js + Whisper OpenAI</a> • <a 
            href="https://github.com/ffmpegwasm/ffmpeg.wasm" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >🎧 FFmpeg.wasm</a> • <a 
            href="https://www.youtube.com/watch?v=ozKAcqkGcjc" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >🗣️ Sample audio</a>
        </div>
      </div>
    </div>
  );
};

export default Index;