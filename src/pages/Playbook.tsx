
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StrategyList from '@/components/playbook/StrategyList';
import StrategyForm from '@/components/playbook/StrategyForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStrategies, useDeleteStrategy } from '@/hooks/useStrategies';
import { useToast } from '@/hooks/use-toast';
import type { StrategyResponseDto } from '@/types/dto';

const Playbook = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'strategies' | 'new'>('strategies');
  const [editingStrategy, setEditingStrategy] = useState<StrategyResponseDto | null>(null);

  const { data: strategies, isLoading } = useStrategies();
  const deleteMutation = useDeleteStrategy();

  useEffect(() => {
    document.title = "Playbook | Followup Trading";
  }, []);

  const handleEdit = (strategy: StrategyResponseDto) => {
    setEditingStrategy(strategy);
    setActiveTab('new');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t('playbook.strategyDeleted') });
    } catch {
      toast({
        title: t('common.error'),
        description: t('playbook.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setEditingStrategy(null);
    setActiveTab('strategies');
  };

  const handleFormCancel = () => {
    setEditingStrategy(null);
    setActiveTab('strategies');
  };

  const handleTabChange = (value: string) => {
    if (value === 'strategies') {
      setEditingStrategy(null);
    }
    setActiveTab(value as 'strategies' | 'new');
  };

  return (
    <DashboardLayout pageTitle={t('pages.playbook')}>
      <div className="max-w-screen-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold animate-fade-in">{t('pages.playbook')}</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="strategies">{t('playbook.strategies')}</TabsTrigger>
              <TabsTrigger value="new">
                {editingStrategy ? t('playbook.editStrategy') : t('playbook.newStrategy')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="strategies" className="space-y-4">
              <StrategyList
                strategies={strategies ?? []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <StrategyForm
                editingStrategy={editingStrategy}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Playbook;
