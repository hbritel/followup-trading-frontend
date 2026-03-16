import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { StrategyResponseDto, StrategyRequestDto } from '@/types/dto';

interface StrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy?: StrategyResponseDto | null;
  onSave: (data: StrategyRequestDto) => Promise<void>;
  isSaving: boolean;
}

const StrategyDialog: React.FC<StrategyDialogProps> = ({
  open,
  onOpenChange,
  strategy,
  onSave,
  isSaving,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const isEditing = !!strategy;

  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setDescription(strategy.description || '');
      setActive(strategy.active);
    } else {
      setName('');
      setDescription('');
      setActive(true);
    }
  }, [strategy, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t('settings.editStrategy', 'Edit Strategy')
                : t('settings.createStrategy', 'Create Strategy')}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t('settings.editStrategyDescription', 'Update your trading strategy details.')
                : t('settings.createStrategyDescription', 'Add a new trading strategy to organize your trades.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-name">{t('settings.strategyName', 'Name')}</Label>
              <Input
                id="strategy-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.strategyNamePlaceholder', 'Enter a name for your strategy')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy-description">{t('common.description', 'Description')}</Label>
              <Input
                id="strategy-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('settings.strategyDescriptionPlaceholder', 'Optional description')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="strategy-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="strategy-active">{t('common.active', 'Active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('common.save', 'Save') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyDialog;
