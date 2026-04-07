import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, ShieldAlert } from 'lucide-react';
import { useAcceptDisclaimer } from '@/hooks/useDisclaimer';

const DisclaimerModal: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: accept, isPending } = useAcceptDisclaimer();

  const handleAccept = () => {
    accept();
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Dialog open>
      <DialogContent
        className="max-w-lg"
        // Prevent closing by clicking outside — user must explicitly accept or cancel
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Brain className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle className="text-xl">AI Coach Disclaimer</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-4">
              <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  Please read and acknowledge the following before using the AI Coach.
                </p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                I understand that all AI-generated content provided by FollowUp Trading is for{' '}
                <strong>educational and informational purposes only</strong>. It does not constitute investment
                advice, financial advice, trading advice, or any other form of professional advice.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                All analyses are based on my own historical trading data. I am <strong>solely responsible</strong>{' '}
                for my trading decisions. FollowUp Trading and its operators cannot be held liable for any
                losses resulting from trading decisions made using this platform.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            I Understand and Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisclaimerModal;
