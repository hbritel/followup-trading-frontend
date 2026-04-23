import React from 'react';
import { useTranslation } from 'react-i18next';
import type { MentorCohortDto } from '@/types/dto';

interface CohortFilterChipsProps {
  cohorts: MentorCohortDto[];
  selected: Set<string>;
  onToggle: (cohortId: string) => void;
  onClear: () => void;
  totalStudents: number;
}

const DEFAULT_COLOR = '#6366f1';

const Chip: React.FC<{
  active: boolean;
  onClick: () => void;
  color?: string;
  label: string;
  count: number;
}> = ({ active, onClick, color, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={[
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 motion-reduce:transition-none',
      active
        ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
        : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    ].join(' ')}
  >
    {color !== undefined && (
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color ?? DEFAULT_COLOR }}
        aria-hidden="true"
      />
    )}
    <span className="truncate max-w-[10rem]">{label}</span>
    <span className="tabular-nums opacity-70">{count}</span>
  </button>
);

const CohortFilterChips: React.FC<CohortFilterChipsProps> = ({
  cohorts,
  selected,
  onToggle,
  onClear,
  totalStudents,
}) => {
  const { t } = useTranslation();

  if (cohorts.length === 0) return null;

  const allActive = selected.size === 0;

  return (
    <div
      role="group"
      aria-label={t('mentor.cohorts.filterLabel', 'Filter by cohort')}
      className="flex flex-wrap items-center gap-1.5"
    >
      <Chip
        active={allActive}
        onClick={onClear}
        label={t('mentor.cohorts.allStudents', 'All students')}
        count={totalStudents}
      />
      {cohorts.map((c) => (
        <Chip
          key={c.id}
          active={selected.has(c.id)}
          onClick={() => onToggle(c.id)}
          color={c.color ?? DEFAULT_COLOR}
          label={c.name}
          count={c.memberCount}
        />
      ))}
    </div>
  );
};

export default CohortFilterChips;
