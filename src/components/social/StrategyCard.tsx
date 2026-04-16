import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Copy, User, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
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
  onLike: (strategyId: string) => void;
  onCopy: (strategyId: string) => void;
  onPurchase?: (strategyId: string) => void;
  isLikePending?: boolean;
  isCopyPending?: boolean;
  isPurchasePending?: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  onLike,
  onCopy,
  onPurchase,
  isLikePending = false,
  isCopyPending = false,
  isPurchasePending = false,
}) => {
  const { t } = useTranslation();
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  const isPaid = strategy.price != null && strategy.price > 0;
  const isPurchased = strategy.purchasedByMe === true;

  const handleLike = () => {
    onLike(strategy.id);
  };

  const handleCopyConfirm = () => {
    onCopy(strategy.id);
    setCopyDialogOpen(false);
  };

  const handlePurchaseConfirm = () => {
    onPurchase?.(strategy.id);
    setPurchaseDialogOpen(false);
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
          {isPaid && (
            <Badge
              variant="outline"
              className={
                isPurchased
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 flex-shrink-0'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20 flex-shrink-0'
              }
            >
              {isPurchased ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('social.purchased', 'Purchased')}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  ${strategy.price!.toFixed(2)}
                </span>
              )}
            </Badge>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {strategy.creatorUsername.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{strategy.creatorUsername}</span>
        </div>

        {/* Metrics badges */}
        <div className="flex flex-wrap gap-2">
          {strategy.historicalWinRate != null && (
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
              WR {strategy.historicalWinRate.toFixed(1)}%
            </Badge>
          )}
          {strategy.historicalProfitFactor != null && (
            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
              PF {strategy.historicalProfitFactor.toFixed(2)}
            </Badge>
          )}
          {strategy.tradeCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
              {strategy.tradeCount} {t('social.trades')}
            </Badge>
          )}
          {strategy.suitableMarkets && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {strategy.suitableMarkets}
            </Badge>
          )}
        </div>

        {/* Stats + actions */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Like count */}
            <span className="flex items-center gap-1">
              <Heart
                className={`w-4 h-4 transition-colors ${
                  strategy.likedByMe ? 'text-red-500 fill-red-500' : ''
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
                strategy.likedByMe
                  ? 'text-red-500 hover:text-red-400'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${strategy.likedByMe ? 'fill-red-500' : ''}`}
              />
            </Button>

            {/* Copy / Buy button */}
            {isPaid && !isPurchased ? (
              <Button
                size="sm"
                disabled={isPurchasePending}
                onClick={() => setPurchaseDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
              >
                {isPurchasePending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <DollarSign className="w-3.5 h-3.5" />
                )}
                {t('social.buy', 'Buy')} ${strategy.price!.toFixed(2)}
              </Button>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Copy Confirmation dialog */}
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

      {/* Purchase Confirmation dialog */}
      <AlertDialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <AlertDialogContent className="glass-panel border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('social.purchaseTitle', 'Purchase Strategy')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('social.purchaseDesc', {
                title: strategy.title,
                price: strategy.price?.toFixed(2),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchaseConfirm}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {t('social.confirmPurchase', 'Confirm Purchase')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StrategyCard;
