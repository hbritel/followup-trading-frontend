import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  plan: 'STARTER' | 'PRO' | 'ELITE';
  className?: string;
  size?: 'sm' | 'md';
}

const PLAN_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  STARTER: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', label: 'Starter+' },
  PRO: { bg: 'bg-primary/10 border-primary/20', text: 'text-primary', label: 'Pro+' },
  ELITE: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Elite' },
};

const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, className, size = 'sm' }) => {
  const style = PLAN_STYLES[plan] ?? PLAN_STYLES.PRO;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        style.bg,
        style.text,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className,
      )}
    >
      <Lock className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {style.label}
    </span>
  );
};

export default PlanBadge;
