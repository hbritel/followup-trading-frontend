import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldAlert, TrendingDown, Flame } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type {
  MentorAtRiskStudentDto,
  MentorAtRiskReason,
} from '@/types/dto';

interface AtRiskDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: MentorAtRiskStudentDto[];
  onSelectStudent: (studentUserId: string) => void;
}

const REASON_META: Record<
  MentorAtRiskReason,
  { iconClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  LOW_WIN_RATE: {
    iconClass:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Icon: TrendingDown,
  },
  LOSING_STREAK: {
    iconClass:
      'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    Icon: ShieldAlert,
  },
  TILT_SPIKE: {
    iconClass:
      'bg-destructive/10 text-destructive border-destructive/40',
    Icon: Flame,
  },
};

const ReasonChip: React.FC<{ reason: MentorAtRiskReason }> = ({ reason }) => {
  const { t } = useTranslation();
  const { iconClass, Icon } = REASON_META[reason];
  const label = t(`mentor.atRiskReasons.${reason}.label`, reason);
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border',
        iconClass,
      ].join(' ')}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
};

const AtRiskDialog: React.FC<AtRiskDialogProps> = ({
  open,
  onOpenChange,
  students,
  onSelectStudent,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
            {t('mentor.atRisk.dialogTitle', 'Students at risk')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'mentor.atRisk.dialogDesc',
              'Students flagged by our risk signals — click a row to open their detail.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Legend */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('mentor.atRisk.legend', 'Signals')}
          </p>
          <ul className="space-y-1.5 text-xs">
            {(['LOW_WIN_RATE', 'LOSING_STREAK', 'TILT_SPIKE'] as const).map((r) => (
              <li key={r} className="flex items-start gap-2">
                <ReasonChip reason={r} />
                <span className="text-muted-foreground flex-1 mt-0.5">
                  {t(
                    `mentor.atRiskReasons.${r}.desc`,
                    r === 'LOW_WIN_RATE'
                      ? 'Win rate fell below the healthy threshold.'
                      : r === 'LOSING_STREAK'
                        ? 'Three or more consecutive losing trades.'
                        : 'Tilt score spiked above the threshold.'
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t(
              'mentor.atRisk.empty',
              'No students at risk — everything looks healthy.'
            )}
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto divide-y divide-border/40 rounded-xl border border-border/50">
            {students.map((s) => {
              const wr =
                s.winRate != null ? `${(s.winRate * 100).toFixed(1)}%` : '—';
              return (
                <li key={s.studentUserId}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStudent(s.studentUserId);
                      onOpenChange(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
                  >
                    <span className="font-medium text-primary truncate min-w-0">
                      {s.username}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <ReasonChip reason={s.reason} />
                      <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">
                        {wr}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AtRiskDialog;
