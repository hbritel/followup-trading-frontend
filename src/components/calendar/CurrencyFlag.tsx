import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CurrencyFlagProps {
  currency: string;
}

const CURRENCY_COLORS: Record<string, string> = {
  USD: 'bg-blue-600 text-white',
  EUR: 'bg-blue-800 text-yellow-300',
  GBP: 'bg-red-700 text-white',
  JPY: 'bg-red-500 text-white',
  CAD: 'bg-red-600 text-white',
  AUD: 'bg-green-700 text-white',
  CHF: 'bg-red-500 text-white',
  NZD: 'bg-slate-800 text-white',
  CNY: 'bg-red-600 text-yellow-300',
};

const CURRENCY_COUNTRY_NAMES: Record<string, string> = {
  USD: 'United States Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  NZD: 'New Zealand Dollar',
  CNY: 'Chinese Yuan',
};

const CurrencyFlag = ({ currency }: CurrencyFlagProps) => {
  const { t } = useTranslation();
  const colorClass = CURRENCY_COLORS[currency] ?? 'bg-slate-500 text-white';
  const countryName =
    CURRENCY_COUNTRY_NAMES[currency] ??
    t('calendar.unknownCurrency', { currency });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center',
              'w-8 h-5 rounded text-[10px] font-bold',
              'shrink-0 cursor-default select-none',
              colorClass,
            )}
            aria-label={countryName}
          >
            {currency.slice(0, 3)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{countryName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CurrencyFlag;
