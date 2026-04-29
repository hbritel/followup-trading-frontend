import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BellOff, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EmotionPicker from '@/components/ai-coach/EmotionPicker';
import {
  POST_TRADE_PROMPT_OPT_OUT_KEY,
  usePostTradeEmotionPrompt,
} from '@/hooks/usePostTradeEmotionPrompt';

/**
 * Global, headless dialog that surfaces the {@link EmotionPicker} for any
 * newly-closed trade pushed via the
 * {@link usePostTradeEmotionPrompt} queue.
 *
 * <p>Mounted once at the root layout. The hook itself decides when a prompt
 * is active; this component is purely presentational glue.</p>
 */
const PostTradeEmotionDialog: React.FC = () => {
  const { t } = useTranslation();
  const { activePrompt, dismissCurrent, skipAll } = usePostTradeEmotionPrompt();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) dismissCurrent();
    },
    [dismissCurrent],
  );

  const handleSkipAll = useCallback(() => {
    try {
      window.localStorage.setItem(POST_TRADE_PROMPT_OPT_OUT_KEY, 'true');
    } catch {
      // localStorage blocked — opting out is best-effort, in-session only.
    }
    skipAll();
  }, [skipAll]);

  if (!activePrompt) return null;

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              'aiCoach.emotionPrompt.title',
              'Comment vous sentiez-vous sur ce trade ?',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'aiCoach.emotionPrompt.subtitle',
              'Quelques secondes maintenant — un meilleur diagnostic plus tard.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <EmotionPicker tradeId={activePrompt.tradeId} />
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <BellOff className="mr-1.5 h-3.5 w-3.5" />
            {t('aiCoach.emotionPrompt.skipAll', 'Ne plus me demander')}
          </Button>
          <Button variant="outline" size="sm" onClick={dismissCurrent}>
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {t('aiCoach.emotionPrompt.later', 'Plus tard')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostTradeEmotionDialog;
