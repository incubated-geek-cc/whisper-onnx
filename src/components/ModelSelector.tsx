import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModelConfig } from '@/workers/whisper-worker';

interface ModelSelectorProps {
  models: Record<string, ModelConfig>;
  selectedModel: string;
  onModelChange: (modelKey: string) => void;
  disabled?: boolean;
}

export const ModelSelector = ({ models, selectedModel, onModelChange, disabled }: ModelSelectorProps) => {
  const getModelSize = (modelKey: string): string => {
    if (modelKey.includes('tiny')) return 'tiny';
    if (modelKey.includes('base')) return 'base';
    if (modelKey.includes('small')) return 'small';
    if (modelKey.includes('medium')) return 'medium';
    if (modelKey.includes('large')) return 'large';
    return 'unknown';
  };

  const getSizeColor = (size: string): string => {
    switch (size) {
      case 'tiny': return 'bg-green-500';
      case 'base': return 'bg-blue-500';
      case 'small': return 'bg-yellow-500';
      case 'medium': return 'bg-orange-500';
      case 'large': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Model</label>
      <Select value={selectedModel} onValueChange={onModelChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(models).map(([key, model]) => {
            const size = getModelSize(key);
            return (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getSizeColor(size)}>
                    {size}
                  </Badge>
                  <span>{model.name}</span>
                  {model.language && (
                    <Badge variant="outline" className="text-xs">
                      {model.language.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Smaller models are faster but less accurate. Larger models provide better transcription quality.
      </p>
    </div>
  );
};