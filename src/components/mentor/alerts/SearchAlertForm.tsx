import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSearchAlert } from '@/hooks/useMentorRevenue';
import { useAuth } from '@/contexts/auth-context';
import type { DirectoryQuery } from '@/types/dto';

interface Props {
  currentQuery: DirectoryQuery;
}

const SearchAlertForm: React.FC<Props> = ({ currentQuery }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(
    (user as { email?: string } | null)?.email ?? ''
  );
  const createAlert = useCreateSearchAlert();

  const hasFilters =
    !!currentQuery.q ||
    (currentQuery.tags?.length ?? 0) > 0 ||
    (currentQuery.langs?.length ?? 0) > 0 ||
    currentQuery.acceptsNew ||
    currentQuery.verifiedOnly ||
    currentQuery.monetizedOnly;

  if (!isAuthenticated || !hasFilters) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert.mutate(
      { name: name.trim(), queryJson: currentQuery, email: email.trim() },
      { onSuccess: () => { setOpen(false); setName(''); } }
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-9"
        onClick={() => setOpen(true)}
        aria-label={t('mentor.alerts.saveSearch', 'Save this search as alert')}
      >
        <Bell className="w-4 h-4" />
        {t('mentor.alerts.saveSearch', 'Save search')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t('mentor.alerts.formTitle', 'Save search alert')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'mentor.alerts.formDesc',
                "Get notified by email when new mentors match your current filters."
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-name">
                {t('mentor.alerts.alertName', 'Alert name')}
              </Label>
              <Input
                id="alert-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('mentor.alerts.alertNamePlaceholder', 'e.g. Futures mentors')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-email">
                {t('mentor.alerts.alertEmail', 'Notification email')}
              </Label>
              <Input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  'mentor.alerts.emailNote',
                  'We send a digest at most once a day when new matches appear.'
                )}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createAlert.isPending || !name.trim() || !email.trim()}
              >
                {createAlert.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('mentor.alerts.saveButton', 'Save alert')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchAlertForm;
