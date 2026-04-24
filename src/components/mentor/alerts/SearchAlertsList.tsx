import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  useMySearchAlerts,
  useUpdateSearchAlert,
  useDeleteSearchAlert,
} from '@/hooks/useMentorRevenue';
import type { SearchAlertDto } from '@/types/dto';

const AlertRow: React.FC<{ alert: SearchAlertDto }> = ({ alert }) => {
  const { t } = useTranslation();
  const updateAlert = useUpdateSearchAlert();
  const deleteAlert = useDeleteSearchAlert();

  const tagsCount =
    (alert.queryJson.tags?.length ?? 0) +
    (alert.queryJson.langs?.length ?? 0);

  const summary = [
    alert.queryJson.q ? `"${alert.queryJson.q}"` : null,
    tagsCount > 0 ? `${tagsCount} filter(s)` : null,
    alert.queryJson.acceptsNew ? t('mentor.alerts.acceptsNew', 'accepts new') : null,
    alert.queryJson.verifiedOnly ? t('mentor.alerts.verified', 'verified') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const lastMatch = alert.lastMatchedAt
    ? new Date(alert.lastMatchedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : t('mentor.alerts.neverMatched', 'Never matched');

  return (
    <article className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-4">
      <div
        className={[
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
          alert.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        ].join(' ')}
      >
        {alert.active ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{alert.name}</p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{summary}</p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {t('mentor.alerts.lastMatch', 'Last match: {{date}}', { date: lastMatch })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={alert.active}
              onCheckedChange={(v) => updateAlert.mutate({ id: alert.id, active: v })}
              aria-label={
                alert.active
                  ? t('mentor.alerts.disable', 'Disable alert')
                  : t('mentor.alerts.enable', 'Enable alert')
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => deleteAlert.mutate(alert.id)}
              disabled={deleteAlert.isPending}
              aria-label={t('common.delete', 'Delete')}
            >
              {deleteAlert.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

const SearchAlertsList: React.FC = () => {
  const { t } = useTranslation();
  const { data: alerts = [], isLoading } = useMySearchAlerts();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Bell className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t(
            'mentor.alerts.emptyList',
            "You have no search alerts. Save a search on the mentors directory to get notified."
          )}
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="alerts-heading" className="space-y-3">
      <h3
        id="alerts-heading"
        className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
      >
        {t('mentor.alerts.listTitle', 'Saved search alerts')}
      </h3>
      <div className="space-y-2">
        {alerts.map((a) => (
          <AlertRow key={a.id} alert={a} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          'mentor.alerts.emailFreqNote',
          'Alerts are sent by email at most once per day when new mentors match.'
        )}
      </p>
    </section>
  );
};

export default SearchAlertsList;
