import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMentorCohorts } from '@/hooks/useMentor';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface Props {
  /** Currently selected cohort ids. Empty list = no cohort restriction. */
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_COLOR = '#6366f1';

/**
 * MentorCohortPicker — multi-select cohort chips for cohort-targeted
 * resources (announcements, session offerings, webinars, etc.).
 *
 * Empty selection means "all students" (no restriction). The component is
 * deliberately read-friendly: the toggle "All" chip clears the set, the
 * named cohort chips toggle individual ids.
 */
const MentorCohortPicker: React.FC<Props> = ({
  value,
  onChange,
  label,
  hint,
  disabled,
  className,
}) => {
  const { t } = useTranslation();
  const { data: cohorts = [] } = useMentorCohorts();

  if (cohorts.length === 0) {
    return null;
  }

  const valueSet = new Set(value);
  const allActive = valueSet.size === 0;

  const toggle = (id: string) => {
    if (disabled) return;
    if (valueSet.has(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className={['space-y-2', className ?? ''].join(' ')}>
      {label !== undefined && (
        <Label className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          {label}
        </Label>
      )}

      <div
        role="group"
        aria-label={label ?? t('mentor.cohorts.pickerLabel', 'Cohort targeting')}
        className="flex flex-wrap gap-1.5"
      >
        <button
          type="button"
          onClick={() => onChange([])}
          aria-pressed={allActive}
          disabled={disabled}
          className={[
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
            allActive
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/60',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {t('mentor.cohorts.allStudents', 'All students')}
        </button>
        {cohorts.map((c) => {
          const active = valueSet.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-pressed={active}
              disabled={disabled}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/60',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: c.color ?? DEFAULT_COLOR }}
                aria-hidden="true"
              />
              <span className="truncate max-w-[10rem]">{c.name}</span>
              <span className="tabular-nums opacity-70">{c.memberCount}</span>
            </button>
          );
        })}
      </div>

      {hint && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
};

export default MentorCohortPicker;
