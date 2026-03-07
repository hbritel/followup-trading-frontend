
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';
import { useCreateStrategy, useUpdateStrategy } from '@/hooks/useStrategies';
import { useToast } from '@/hooks/use-toast';
import type { StrategyResponseDto, StrategyRequestDto } from '@/types/dto';

interface StrategyFormProps {
  editingStrategy?: StrategyResponseDto | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const StrategyForm: React.FC<StrategyFormProps> = ({ editingStrategy, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (editingStrategy) {
      setName(editingStrategy.name);
      setDescription(editingStrategy.description ?? '');
      setActive(editingStrategy.active);
    } else {
      setName('');
      setDescription('');
      setActive(true);
    }
  }, [editingStrategy]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: t('common.error'),
        description: t('playbook.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    const data: StrategyRequestDto = {
      name: name.trim(),
      description: description.trim() || null,
      active,
    };

    try {
      if (editingStrategy) {
        await updateMutation.mutateAsync({ id: editingStrategy.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      toast({ title: t('playbook.strategySaved') });
      onSuccess?.();
    } catch {
      toast({
        title: t('common.error'),
        description: t('playbook.saveError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingStrategy ? t('playbook.editStrategy') : t('playbook.newStrategy')}
        </CardTitle>
        <CardDescription>
          {editingStrategy ? t('playbook.editStrategyDescription') : t('playbook.newStrategyDescription')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('playbook.strategyName')}</Label>
            <Input
              id="name"
              placeholder={t('playbook.strategyNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('playbook.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('playbook.descriptionPlaceholder')}
              className="min-h-32"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
            />
            <Label htmlFor="active">{t('playbook.activeStrategy')}</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default StrategyForm;
