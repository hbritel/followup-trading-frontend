import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  /** Render as a compact inline chip instead of a full badge */
  compact?: boolean;
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ compact = false, className }) => {
  const { t } = useTranslation();

  const label = t('mentor.trust.verifiedBadge.label', 'Verified');
  const tooltip = t(
    'mentor.trust.verifiedBadge.tooltip',
    'Verified by FollowUp Trading'
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={tooltip}
            className={cn(
              'inline-flex items-center gap-1 font-semibold select-none cursor-default',
              compact
                ? 'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'text-xs px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
              // Subtle glow effect — intentional, not decorative
              'shadow-[0_0_8px_rgba(59,130,246,0.25)]',
              className
            )}
          >
            <BadgeCheck
              className={cn(
                'shrink-0',
                compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
              )}
              aria-hidden="true"
            />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
