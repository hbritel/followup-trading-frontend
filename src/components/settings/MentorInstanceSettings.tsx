import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useMentorInstance,
  useCreateInstance,
  useUpdateInstance,
} from '@/hooks/useMentor';
import type { CreateInstanceRequestDto } from '@/types/dto';

const MentorInstanceSettings: React.FC = () => {
  const { t } = useTranslation();
  const { data: instance, isLoading } = useMentorInstance();
  const createMutation = useCreateInstance();
  const updateMutation = useUpdateInstance();

  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (instance) {
      setBrandName(instance.brandName);
      setDescription(instance.description ?? '');
      setLogoUrl(instance.logoUrl ?? '');
      setPrimaryColor(instance.primaryColor ?? '#6366f1');
    }
  }, [instance]);

  const handleCopyCode = () => {
    if (!instance) return;
    const link = `${window.location.origin}/join/${instance.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateInstanceRequestDto = {
      brandName,
      description: description || undefined,
      logoUrl: logoUrl || undefined,
      primaryColor,
    };

    if (instance) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">
            {instance
              ? t('mentor.editInstance', 'Mentor Instance')
              : t('mentor.createInstance', 'Create Mentor Instance')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {instance
              ? t('mentor.editInstanceDesc', 'Manage your mentor program')
              : t('mentor.createInstanceDesc', 'Set up a mentor program for your students')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mentor-brand">{t('mentor.brandName', 'Brand Name')}</Label>
          <Input
            id="mentor-brand"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Trading Academy"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mentor-desc">{t('mentor.description', 'Description')}</Label>
          <Textarea
            id="mentor-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Learn trading with guided mentorship..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mentor-logo">{t('mentor.logoUrl', 'Logo URL')}</Label>
            <Input
              id="mentor-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mentor-color">{t('mentor.primaryColor', 'Primary Color')}</Label>
            <div className="flex gap-2">
              <Input
                id="mentor-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
              />
              <div
                className="w-10 h-10 rounded-lg border border-border/50 flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isPending || !brandName.trim()}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {instance ? t('common.save', 'Save') : t('mentor.createInstance', 'Create')}
        </Button>
      </form>

      {/* Invite code section — only when instance exists */}
      {instance && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {t('mentor.inviteCode', 'Invite Code')}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {instance.inviteCode}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="gap-1.5"
            >
              {codeCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {t('mentor.codeCopied', 'Copied!')}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {t('mentor.copyCode', 'Copy Link')}
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 font-mono break-all">
            {window.location.origin}/join/{instance.inviteCode}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {instance.currentStudents}/{instance.maxStudents}{' '}
              {t('mentor.students', 'students')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorInstanceSettings;
