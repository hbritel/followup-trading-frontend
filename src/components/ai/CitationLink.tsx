import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookText, FileText, Sparkles, TrendingUp } from 'lucide-react';

/**
 * Sprint 5 PR D — clickable citation chip.
 *
 * <p>Renders the {@code [trade:UUID]}, {@code [journal:UUID]},
 * {@code [debrief:UUID]} or {@code [briefing:UUID]} marker emitted by the
 * coach into a small inline pill that navigates to the relevant detail
 * surface. Unknown types render as a no-op pill so the chat layout never
 * breaks on a typo.</p>
 */
export type CitationSourceType = 'trade' | 'journal' | 'debrief' | 'briefing';

export interface CitationLinkProps {
  type: CitationSourceType | string;
  id: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  trade: TrendingUp,
  journal: BookText,
  debrief: FileText,
  briefing: Sparkles,
};

const TINT_MAP: Record<string, string> = {
  trade: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30',
  journal: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/30',
  debrief: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/30',
  briefing: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30',
};

const CitationLink: React.FC<CitationLinkProps> = ({ type, id }) => {
  const navigate = useNavigate();
  const lower = (type || '').toLowerCase();
  const Icon = ICON_MAP[lower] ?? FileText;
  const tint = TINT_MAP[lower] ?? 'bg-muted text-muted-foreground ring-border';
  const shortId = id.length > 6 ? id.slice(0, 6) : id;

  const target = (() => {
    switch (lower) {
      case 'trade':
        return `/trades?focus=${id}`;
      case 'journal':
        return `/daily-journal?focus=${id}`;
      case 'debrief':
        return `/ai-coach?debrief=${id}`;
      case 'briefing':
        return `/ai-coach?briefing=${id}`;
      default:
        return null;
    }
  })();

  const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!target) return;
    e.preventDefault();
    navigate(target);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!target}
      title={`${lower}:${id}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 mx-0.5 text-[10px] font-medium ring-1 align-middle transition-colors hover:brightness-105 ${tint} ${
        target ? 'cursor-pointer' : 'cursor-default opacity-60'
      }`}
    >
      <Icon className="h-3 w-3" />
      <span className="capitalize">{lower}</span>
      <span className="font-mono opacity-70">#{shortId}</span>
    </button>
  );
};

export default CitationLink;
