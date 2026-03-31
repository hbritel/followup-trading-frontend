import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { EconomicEventImpact } from '@/types/dto';

interface ImpactIndicatorProps {
  impact: EconomicEventImpact;
}

const IMPACT_CONFIG: Record<
  EconomicEventImpact,
  { barClass: string; height: string; labelKey: string }
> = {
  HIGH: {
    barClass: 'bg-red-500',
    height: 'h-6',
    labelKey: 'calendar.impactHigh',
  },
  MEDIUM: {
    barClass: 'bg-amber-500',
    height: 'h-4',
    labelKey: 'calendar.impactMedium',
  },
  LOW: {
    barClass: 'bg-yellow-400',
    height: 'h-2',
    labelKey: 'calendar.impactLow',
  },
};

const ImpactIndicator = ({ impact }: ImpactIndicatorProps) => {
  const { t } = useTranslation();
  const config = IMPACT_CONFIG[impact] ?? IMPACT_CONFIG.LOW;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center w-3 h-6 cursor-default" aria-label={t(config.labelKey)}>
            <div
              className={cn(
                'w-[3px] rounded-full self-end',
                config.barClass,
                config.height,
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs font-medium">{t(config.labelKey)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ImpactIndicator;
