import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, TriangleAlert, Activity } from 'lucide-react';
import { TranscriptionResult, TranscriptionSegment } from '@/hooks/useWhisperWorker';

interface TranscriptionResultsProps {
  result: TranscriptionResult | null;
  isTranscribing: boolean;
  segments: TranscriptionSegment[];
}

export const TranscriptionResults = ({ result, isTranscribing, segments }: TranscriptionResultsProps) => {
  const [renderedLines, setRenderedLines] = useState<TranscriptionSegment[]>([]);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when a new line appears
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [renderedLines]);

  useEffect(() => {
    if (segments.length > renderedLines.length) {
      const newChunks = segments.slice(renderedLines.length);
      setRenderedLines(prev => [...prev, ...newChunks]);
    }
  }, [segments]);

  const formatTimestamp = (timestamp: number) => {
    if (!isFinite(timestamp)) return '--:--';
    const minutes = Math.floor(timestamp / 60);
    const seconds = Math.floor(timestamp % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const exportTXT = () => {
    if (!result) return;
    let content = result.text;
    if (result.chunks && result.chunks.length > 0) {
      content = result.chunks
        .map(chunk => `${formatTimestamp(chunk.timestamp[0])}: ${chunk.text}`)
        .join('\n');
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('TXT exported!');
    setTimeout(() => setExportStatus(null), 2000);
  };

  const exportJSON = () => {
    if (!result) return;
    const jsonData = {
      text: result.text,
      segments: result.chunks?.map(chunk => ({
        start: chunk.timestamp[0],
        end: chunk.timestamp[1],
        text: chunk.text
      })) || []
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.json';
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('JSON exported!');
    setTimeout(() => setExportStatus(null), 2000);
  };
  
  // ✅ Show nothing if no data at all
  const lines = isTranscribing ? segments : result?.chunks || [];
  return (
      <div className="space-y-0">
        <Card className="border-0 shadow-none">
          <div ref={containerRef} className="space-y-4 max-h-64 overflow-y-auto">
             {
              segments.length > 0 ? 
              renderedLines.map((chunk, i) => (
                <div
                  key={i}
                  className='flex gap-3 opacity-0 animate-lineFade transcript-line'
                  style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
                >
                  <span className="text-timestamp text-sm font-mono min-w-[48px]">{formatTimestamp(chunk.timestamp[0])}</span>
                  <p className="text-foreground text-sm leading-relaxed">{chunk.text.trim()}</p>
                </div>
              )) : 
              (
                <p className="text-center text-sm text-gray-500 p-4">
                  {isTranscribing ? (
                    <span><Activity className="h-4 w-4 mr-1 ml-1 inline-flex" /> Transcribing...</span>
                  ) : (
                    <span><TriangleAlert className="h-4 w-4 mr-1 ml-1 inline-flex" /> No transcription yet</span>
                  )}
                </p>
              )
             }
          </div>
        </Card>
        
        <div className="pt-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={exportTXT}
            disabled={!result}
            className="bg-export-success border-export-success transition-all duration-200 hover:bg-teal-300 hover:scale-105 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportJSON}
            disabled={!result}
            className="bg-export-success border-export-success transition-all duration-200 hover:bg-teal-300 hover:scale-105 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
        
        {exportStatus && (
          <p className="text-sm text-export-success text-center">{exportStatus}</p>
        )}
    </div>
  );
};