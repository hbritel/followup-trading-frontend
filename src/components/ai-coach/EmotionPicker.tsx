import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useEmotionLog, useLogEmotion } from '@/hooks/useEmotionLog';

interface EmotionPickerProps {
  tradeId: string;
}

const EMOTIONS: Array<{ value: string; label: string; emoji: string }> = [
  { value: 'CALM', label: 'Calm', emoji: '😌' },
  { value: 'CONFIDENT', label: 'Confident', emoji: '💪' },
  { value: 'STRESSED', label: 'Stressed', emoji: '😰' },
  { value: 'FOMO', label: 'FOMO', emoji: '🤯' },
  { value: 'REVENGE', label: 'Revenge', emoji: '😤' },
  { value: 'DISCIPLINED', label: 'Disciplined', emoji: '🎯' },
  { value: 'FEARFUL', label: 'Fearful', emoji: '😨' },
  { value: 'EUPHORIC', label: 'Euphoric', emoji: '🤑' },
];

const EmotionPicker: React.FC<EmotionPickerProps> = ({ tradeId }) => {
  const { data: existing, isLoading } = useEmotionLog(tradeId);
  const { mutate: logEmotion, isPending } = useLogEmotion(tradeId);

  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Pre-fill from existing data
  useEffect(() => {
    if (existing) {
      setSelectedEmotion(existing.emotionAfter ?? '');
      setConfidence(existing.confidence ?? 0);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSave = () => {
    if (!selectedEmotion) return;
    logEmotion({
      emotionAfter: selectedEmotion,
      confidence: confidence || undefined,
      notes: notes.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Emotion buttons */}
      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map((em) => (
          <button
            key={em.value}
            type="button"
            onClick={() => setSelectedEmotion(em.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
              selectedEmotion === em.value
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-muted-foreground'
            )}
          >
            <span>{em.emoji}</span>
            <span>{em.label}</span>
          </button>
        ))}
      </div>

      {/* Confidence — star rating 1-5 */}
      {selectedEmotion && (
        <>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Confidence level</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setConfidence(star)}
                  className={cn(
                    'text-lg transition-transform hover:scale-110',
                    star <= confidence ? 'text-amber-400' : 'text-muted-foreground/30'
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Notes (optional)</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What were you feeling during this trade?"
              rows={2}
              maxLength={300}
              className="text-sm resize-none"
            />
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !selectedEmotion}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Psychology Entry
          </Button>
        </>
      )}
    </div>
  );
};

export default EmotionPicker;
