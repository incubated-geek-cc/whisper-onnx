import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause } from 'lucide-react';

interface RecordInputProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
  existingBlob?: Blob | null;
}

export const RecordInput = ({ onRecordingComplete, disabled, existingBlob }: RecordInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/ogg;codecs=opus';
      const chunks: BlobPart[] = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        chunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      });

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 0.5);
      }, 500);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check your permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (recordedBlob && audioRef.current) {
      const url = URL.createObjectURL(recordedBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
    }
  }, [recordedBlob]);

  const pauseRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const useRecording = useCallback(() => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob);
    }
  }, [recordedBlob, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <audio ref={audioRef} />
      
      <div className="text-center space-y-4">
        {!isRecording && !recordedBlob && (
          <div>
            <Button
              onClick={startRecording}
              disabled={disabled}
              size="lg"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <Mic className="h-6 w-6" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Click to start recording
            </p>
          </div>
        )}

        {isRecording && (
          <div>
            <Button
              onClick={stopRecording}
              size="lg"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50 p-0"
            >
              <Square className="h-6 w-6" />
            </Button>
            <p className="text-sm text-foreground mt-4 font-mono">
              Recording: {formatTime(recordingTime)}
            </p>
            <p className="text-xs text-muted-foreground">
              Click to stop recording
            </p>
          </div>
        )}

        {recordedBlob && (
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <Button
                onClick={isPlaying ? pauseRecording : playRecording}
                variant="outline"
                size="sm"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={() => {
                  setRecordedBlob(null);
                  setIsPlaying(false);
                  setRecordingTime(0);
                }}
                variant="outline"
                size="sm"
              >
                Record Again
              </Button>
            </div>
            
            <Button
              onClick={useRecording}
              disabled={disabled}
              className="w-full"
            >
              Use This Recording
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};