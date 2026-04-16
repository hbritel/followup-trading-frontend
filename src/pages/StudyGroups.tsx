import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Loader2, Plus, BookOpen, Compass } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import GroupCard from '@/components/social/GroupCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  usePublicGroups,
  useMyGroups,
  useCreateGroup,
  useJoinGroup,
  useLeaveGroup,
  useDeleteGroup,
} from '@/hooks/useStudyGroups';
import { toast } from '@/hooks/use-toast';
import type { GroupType } from '@/types/dto';

const StudyGroups: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('discover');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('OPEN');

  useEffect(() => {
    document.title = `${t('studyGroups.title')} | FollowUp Trading`;
  }, [t]);

  const { data: publicGroups, isLoading: loadingPublic, isError: errorPublic } = usePublicGroups();
  const { data: myGroups, isLoading: loadingMy, isError: errorMy } = useMyGroups();

  const createMutation = useCreateGroup();
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();
  const deleteMutation = useDeleteGroup();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        type: groupType,
      });
      toast({ title: t('studyGroups.createSuccess') });
      setCreateOpen(false);
      setName('');
      setDescription('');
      setGroupType('OPEN');
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleJoin = async (id: string) => {
    try {
      await joinMutation.mutateAsync(id);
      toast({ title: t('studyGroups.joinSuccess') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleLeave = async (id: string) => {
    try {
      await leaveMutation.mutateAsync(id);
      toast({ title: t('studyGroups.leaveSuccess') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast({ title: t('common.success') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const isLoading = activeTab === 'discover' ? loadingPublic : loadingMy;
  const isError = activeTab === 'discover' ? errorPublic : errorMy;

  return (
    <DashboardLayout pageTitle={t('studyGroups.title')}>
      <PageTransition className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              {t('studyGroups.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('studyGroups.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('studyGroups.createGroup')}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="discover" className="flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              {t('studyGroups.discover')}
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {t('studyGroups.myGroups')}
            </TabsTrigger>
          </TabsList>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">{t('common.errorLoading', 'Failed to load data.')}</p>
            </div>
          )}

          {/* Discover tab */}
          <TabsContent value="discover">
            {!loadingPublic && !errorPublic && publicGroups && publicGroups.length === 0 && (
              <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">{t('studyGroups.emptyPublicTitle')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('studyGroups.emptyPublicDesc')}</p>
                </div>
              </div>
            )}
            {!loadingPublic && publicGroups && publicGroups.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onDelete={(id) => setDeleteTarget(id)}
                    isJoinPending={joinMutation.isPending}
                    isLeavePending={leaveMutation.isPending}
                    isDeletePending={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Groups tab */}
          <TabsContent value="my">
            {!loadingMy && !errorMy && myGroups && myGroups.length === 0 && (
              <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">{t('studyGroups.emptyMyTitle')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('studyGroups.emptyMyDesc')}</p>
                </div>
              </div>
            )}
            {!loadingMy && myGroups && myGroups.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onDelete={(id) => setDeleteTarget(id)}
                    isJoinPending={joinMutation.isPending}
                    isLeavePending={leaveMutation.isPending}
                    isDeletePending={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Group Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="glass-panel border border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">{t('studyGroups.createGroup')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="group-name">{t('studyGroups.groupName')}</Label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('studyGroups.groupName')}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-desc">{t('studyGroups.description')}</Label>
                <Textarea
                  id="group-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('studyGroups.description')}
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-type">{t('studyGroups.groupType')}</Label>
                <Select value={groupType} onValueChange={(v) => setGroupType(v as GroupType)}>
                  <SelectTrigger id="group-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">{t('studyGroups.open')}</SelectItem>
                    <SelectItem value="INVITE_ONLY">{t('studyGroups.inviteOnly')}</SelectItem>
                    <SelectItem value="MENTOR_LED">{t('studyGroups.mentorLed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="border-white/20"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('studyGroups.createGroup')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="glass-panel border border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('studyGroups.delete')}</AlertDialogTitle>
              <AlertDialogDescription>{t('studyGroups.deleteConfirm')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/20">{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </DashboardLayout>
  );
};

export default StudyGroups;
