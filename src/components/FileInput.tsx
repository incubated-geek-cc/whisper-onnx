import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileInputProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileInput = ({ onFileSelect, disabled }: FileInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    } else if (file) {
      alert('Please select a valid audio file');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    const file = files[0];
    
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    } else if (file) {
      alert('Please select a valid audio file');
    }
  };

  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div 
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border',
          disabled && 'opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={cn(
          'h-12 w-12 mx-auto mb-4',
          isDragOver ? 'text-primary' : 'text-muted-foreground'
        )} />
        <Button
          onClick={handleClick}
          disabled={disabled}
          className="mb-2"
        >
          Choose Audio File
        </Button>
        <p className="text-sm text-muted-foreground">
          or drag and drop an audio file here
        </p>
      </div>
    </div>
  );
};