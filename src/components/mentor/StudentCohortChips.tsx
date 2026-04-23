import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useMentorCohorts,
  useStudentCohorts,
  useAddStudentToCohort,
  useRemoveStudentFromCohort,
} from '@/hooks/useMentor';
import type { MentorCohortDto } from '@/types/dto';

const DEFAULT_COLOR = '#6366f1';

interface StudentCohortChipsProps {
  studentUserId: string;
  maxVisible?: number;
}

const StudentCohortChips: React.FC<StudentCohortChipsProps> = ({
  studentUserId,
  maxVisible = 2,
}) => {
  const { t } = useTranslation();
  const { data: allCohorts } = useMentorCohorts();
  const { data: myCohorts, isLoading } = useStudentCohorts(studentUserId);
  const addMutation = useAddStudentToCohort();
  const removeMutation = useRemoveStudentFromCohort();

  const memberIds = useMemo(
    () => new Set((myCohorts ?? []).map((c) => c.id)),
    [myCohorts]
  );

  const visible = (myCohorts ?? []).slice(0, maxVisible);
  const overflow = (myCohorts?.length ?? 0) - visible.length;
  const pending = addMutation.isPending || removeMutation.isPending;

  const toggle = (cohort: MentorCohortDto) => {
    if (memberIds.has(cohort.id)) {
      removeMutation.mutate({
        cohortId: cohort.id,
        studentUserId,
      });
    } else {
      addMutation.mutate({
        cohortId: cohort.id,
        studentUserId,
      });
    }
  };

  const cohortsList = allCohorts ?? [];

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {!isLoading &&
        visible.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
            title={c.name}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: c.color ?? DEFAULT_COLOR }}
              aria-hidden="true"
            />
            <span className="truncate max-w-[6rem]">{c.name}</span>
          </span>
        ))}
      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          +{overflow}
        </span>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            aria-label={t('mentor.cohorts.assignLabel', 'Assign to cohort')}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2">
          <p className="px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t('mentor.cohorts.assignTitle', 'Assign cohorts')}
          </p>
          {cohortsList.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground text-center">
              {t(
                'mentor.cohorts.noneYet',
                'Create a cohort first to assign students.'
              )}
            </p>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {cohortsList.map((c) => {
                const isMember = memberIds.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      disabled={pending}
                      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 text-left disabled:opacity-60"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color ?? DEFAULT_COLOR }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      {isMember && (
                        <Check
                          className="w-4 h-4 text-primary"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {pending && (
            <div className="flex items-center justify-center pt-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default StudentCohortChips;
