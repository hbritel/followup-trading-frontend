import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStrategies } from '@/hooks/useStrategies';
import { useShareStrategy } from '@/hooks/useSocial';
import { toast } from '@/hooks/use-toast';

const ShareStrategyDialog: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [strategyId, setStrategyId] = useState('');

  const { data: strategies, isLoading: strategiesLoading } = useStrategies();
  const shareMutation = useShareStrategy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !strategyId) return;

    try {
      await shareMutation.mutateAsync({ title: title.trim(), description: description.trim(), strategyId });
      toast({ title: t('social.shareSuccess') });
      setOpen(false);
      setTitle('');
      setDescription('');
      setStrategyId('');
    } catch {
      toast({ title: t('common.error'), description: t('social.shareError'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          {t('social.shareStrategy')}
        </Button>
      </DialogTrigger>

      <DialogContent className="glass-panel border border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('social.shareStrategyTitle')}</DialogTitle>
          <DialogDescription>{t('social.shareStrategyDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Strategy selector */}
          <div className="space-y-1.5">
            <Label>{t('social.selectStrategy')}</Label>
            <Select value={strategyId} onValueChange={setStrategyId} disabled={strategiesLoading}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder={t('social.selectStrategyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {strategies?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>{t('social.shareTitle')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('social.shareTitlePlaceholder')}
              className="bg-white/5 border-white/10"
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{t('social.shareDescription')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('social.shareDescriptionPlaceholder')}
              className="bg-white/5 border-white/10 resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/20"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !strategyId || shareMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {shareMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('social.share')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStrategyDialog;
