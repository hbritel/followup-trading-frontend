import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

const SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const formatCents = (cents: number): string =>
  Number.isFinite(cents) ? (cents / 100).toFixed(2) : '';

const parseRawToCents = (raw: string): number => {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return 0;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
};

interface MoneyInputProps {
  id?: string;
  valueCents: number;
  currency: string;
  onChangeCents: (cents: number) => void;
  min?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  id,
  valueCents,
  currency,
  onChangeCents,
  min = 0,
  step = 0.01,
  disabled,
  className,
  placeholder,
}) => {
  const [raw, setRaw] = useState<string>(() => formatCents(valueCents));

  // Sync from outside only when the external value diverges from what the
  // current raw input represents — prevents reformatting mid-typing.
  useEffect(() => {
    const rawAsCents = parseRawToCents(raw);
    if (valueCents !== rawAsCents) {
      setRaw(formatCents(valueCents));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueCents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setRaw(next);
    const cents = parseRawToCents(next);
    onChangeCents(cents < min * 100 ? Math.round(min * 100) : cents);
  };

  const handleBlur = () => {
    setRaw(formatCents(valueCents));
  };

  const symbol = SYMBOLS[currency] ?? currency;

  return (
    <div className={['relative', className ?? ''].join(' ')}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
        {symbol}
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        step={step}
        className="pl-7"
      />
    </div>
  );
};

export default MoneyInput;
