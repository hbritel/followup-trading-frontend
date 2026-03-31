import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Copy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SharedStrategyDto } from '@/types/dto';

interface StrategyCardProps {
  strategy: SharedStrategyDto;
  onLike: (strategyId: string, isLiked: boolean) => void;
  onCopy: (strategyId: string) => void;
  isLikePending?: boolean;
  isCopyPending?: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  onLike,
  onCopy,
  isLikePending = false,
  isCopyPending = false,
}) => {
  const { t } = useTranslation();
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  const handleLike = () => {
    onLike(strategy.id, strategy.isLiked);
  };

  const handleCopyConfirm = () => {
    onCopy(strategy.id);
    setCopyDialogOpen(false);
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{strategy.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{strategy.description}</p>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {strategy.username.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{strategy.username}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary flex-shrink-0">
            {strategy.level}
          </Badge>
        </div>

        {/* Stats + actions */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Like count */}
            <span className="flex items-center gap-1">
              <Heart
                className={`w-4 h-4 transition-colors ${
                  strategy.isLiked ? 'text-red-500 fill-red-500' : ''
                }`}
              />
              <span className="kpi-value text-sm">{strategy.likes}</span>
            </span>
            {/* Copy count */}
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="kpi-value text-sm">{strategy.copies}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Like button */}
            <Button
              size="sm"
              variant="ghost"
              disabled={isLikePending}
              onClick={handleLike}
              className={`px-2 transition-colors ${
                strategy.isLiked
                  ? 'text-red-500 hover:text-red-400'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${strategy.isLiked ? 'fill-red-500' : ''}`}
              />
            </Button>

            {/* Copy button */}
            <Button
              size="sm"
              variant="outline"
              disabled={isCopyPending}
              onClick={() => setCopyDialogOpen(true)}
              className="border-white/20 text-white hover:bg-white/5 flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {t('social.copyStrategy')}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent className="glass-panel border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('social.copyStrategyTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('social.copyStrategyDesc', { title: strategy.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCopyConfirm} className="bg-primary hover:bg-primary/90">
              {t('social.copy')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StrategyCard;
