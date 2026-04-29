import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  Database,
  GraduationCap,
  Loader2,
  Target,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentStatus, AgentType } from '@/types/agent';

interface AgentBadgeProps {
  type: AgentType;
  status: AgentStatus;
  onClick?: () => void;
  expanded?: boolean;
}

interface AgentVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind class fragment for the dot/icon accent. */
  accent: string;
  /** Tailwind class fragment for the badge ring + bg when active. */
  ringActive: string;
  /** Tailwind class fragment for the badge ring + bg when idle. */
  ringIdle: string;
}

const AGENT_VISUALS: Record<AgentType, AgentVisualConfig> = {
  risk: {
    icon: AlertTriangle,
    accent: 'text-red-500',
    ringActive: 'ring-red-500/40 bg-red-500/10',
    ringIdle: 'ring-red-500/20 bg-red-500/5',
  },
  psychology: {
    icon: Brain,
    accent: 'text-purple-500',
    ringActive: 'ring-purple-500/40 bg-purple-500/10',
    ringIdle: 'ring-purple-500/20 bg-purple-500/5',
  },
  strategy: {
    icon: Target,
    accent: 'text-blue-500',
    ringActive: 'ring-blue-500/40 bg-blue-500/10',
    ringIdle: 'ring-blue-500/20 bg-blue-500/5',
  },
  data: {
    icon: Database,
    accent: 'text-emerald-500',
    ringActive: 'ring-emerald-500/40 bg-emerald-500/10',
    ringIdle: 'ring-emerald-500/20 bg-emerald-500/5',
  },
  education: {
    icon: GraduationCap,
    accent: 'text-amber-500',
    ringActive: 'ring-amber-500/40 bg-amber-500/10',
    ringIdle: 'ring-amber-500/20 bg-amber-500/5',
  },
};

/**
 * Per-agent pill rendered above the orchestration view. Conveys, at a glance:
 * <ul>
 *   <li>Which specialist is involved (icon + i18n label + colour)</li>
 *   <li>Where it is in its lifecycle (pulse / spinner / check / X)</li>
 *   <li>Whether the parent panel has expanded its detail view (chevron)</li>
 * </ul>
 *
 * <p>The component is purely presentational — it has no opinion on orchestration
 * state machinery.</p>
 */
const AgentBadge: React.FC<AgentBadgeProps> = ({
  type,
  status,
  onClick,
  expanded = false,
}) => {
  const { t } = useTranslation();
  const visuals = AGENT_VISUALS[type];
  const Icon = visuals.icon;
  const label = t(`aiCoach.agents.${type}.label`, fallbackLabel(type));
  const isActive = status === 'running' || status === 'done';

  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? expanded : undefined}
      aria-label={label}
      data-status={status}
      data-agent={type}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-all duration-150',
        isActive ? visuals.ringActive : visuals.ringIdle,
        status === 'error' && 'ring-destructive/40 bg-destructive/10',
        status === 'running' && 'animate-pulse',
        onClick && 'hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring',
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', visuals.accent)} />
      <span className="truncate text-foreground">{label}</span>
      <StatusGlyph status={status} accent={visuals.accent} />
      {onClick && (
        <ChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      )}
    </Element>
  );
};

/** Trailing icon that signals lifecycle status. */
const StatusGlyph: React.FC<{ status: AgentStatus; accent: string }> = ({
  status,
  accent,
}) => {
  switch (status) {
    case 'pending':
      return (
        <span
          aria-hidden
          className={cn('inline-block h-1.5 w-1.5 rounded-full bg-current opacity-40', accent)}
        />
      );
    case 'running':
      return <Loader2 className={cn('h-3 w-3 animate-spin', accent)} aria-hidden />;
    case 'done':
      return (
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={cn('h-3 w-3', accent)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5l2.5 2.5 4.5-5" />
        </svg>
      );
    case 'error':
      return <XCircle className="h-3 w-3 text-destructive" aria-hidden />;
    default:
      return null;
  }
};

/** Reasonable default if the i18n bundle lags behind a new agent type. */
function fallbackLabel(type: AgentType): string {
  switch (type) {
    case 'risk':
      return 'Risk';
    case 'psychology':
      return 'Psychology';
    case 'strategy':
      return 'Strategy';
    case 'data':
      return 'Data';
    case 'education':
      return 'Learning';
  }
}

export default AgentBadge;
