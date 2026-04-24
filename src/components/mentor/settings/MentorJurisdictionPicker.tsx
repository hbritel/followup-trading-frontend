import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllCountries, getCountryName as getCountryNameDefault } from '@/lib/countries';
import { useMyJurisdictions, useSetMyJurisdictions } from '@/hooks/useMentor';
import type { MentorJurisdictionMode, MentorJurisdictionRuleDto } from '@/types/dto';

const MentorJurisdictionPicker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: rules = [], isLoading } = useMyJurisdictions();
  const setJurisdictions = useSetMyJurisdictions();
  const locale = i18n.language.split('-')[0];
  const allCountries = useMemo(() => getAllCountries(locale), [locale]);
  const getCountryName = (code: string) => getCountryNameDefault(code, locale);

  // Determine current mode from existing rules (all rules share the same mode or none exist)
  const currentMode: MentorJurisdictionMode =
    rules.length > 0 ? rules[0].mode : 'ALLOW';

  const [mode, setMode] = useState<MentorJurisdictionMode>(currentMode);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    rules.map((r) => r.countryCode)
  );
  const [addCode, setAddCode] = useState('');

  const remainingCountries = allCountries.filter(
    (c) => !selectedCountries.includes(c.code)
  );

  const handleModeChange = (newMode: MentorJurisdictionMode) => {
    setMode(newMode);
  };

  const handleAddCountry = () => {
    if (!addCode || selectedCountries.includes(addCode)) return;
    setSelectedCountries((prev) => [...prev, addCode]);
    setAddCode('');
  };

  const handleRemoveCountry = (code: string) => {
    setSelectedCountries((prev) => prev.filter((c) => c !== code));
  };

  const handleSave = () => {
    const newRules: MentorJurisdictionRuleDto[] = selectedCountries.map((code) => ({
      countryCode: code,
      mode,
    }));
    setJurisdictions.mutate(newRules);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">
          {t('mentor.settings.jurisdictions.title', 'Jurisdiction rules')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t(
            'mentor.settings.jurisdictions.description',
            'Restrict which countries can access your profile. Leave empty to allow all.'
          )}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3 bg-muted/30">
        {(['ALLOW', 'DENY'] as MentorJurisdictionMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={[
              'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
              mode === m
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {m === 'ALLOW'
              ? t('mentor.settings.jurisdictions.allowList', 'Allow list')
              : t('mentor.settings.jurisdictions.denyList', 'Deny list')}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {mode === 'ALLOW'
          ? t(
              'mentor.settings.jurisdictions.allowHint',
              'Only visitors from these countries can access your profile.'
            )
          : t(
              'mentor.settings.jurisdictions.denyHint',
              'Visitors from these countries cannot access your profile.'
            )}
      </p>

      {/* Add country */}
      <div className="flex gap-2">
        <Select value={addCode} onValueChange={setAddCode}>
          <SelectTrigger className="flex-1 text-sm">
            <SelectValue
              placeholder={t(
                'mentor.settings.jurisdictions.selectCountry',
                'Select a country…'
              )}
            />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {remainingCountries.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-sm">
                {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCountry}
          disabled={!addCode}
          className="shrink-0"
        >
          {t('common.add', 'Add')}
        </Button>
      </div>

      {/* Selected country chips */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label={t('mentor.settings.jurisdictions.selectedLabel', 'Selected countries')}>
          {selectedCountries.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-muted/60 border border-border/50"
            >
              {code} — {getCountryName(code)}
              <button
                type="button"
                onClick={() => handleRemoveCountry(code)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                aria-label={t('mentor.settings.jurisdictions.removeCountry', 'Remove {{country}}', {
                  country: getCountryName(code),
                })}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="pt-1">
        <Label className="sr-only">{t('common.save', 'Save')}</Label>
        <Button
          onClick={handleSave}
          disabled={setJurisdictions.isPending}
          size="sm"
          className="gap-2"
        >
          {setJurisdictions.isPending && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
          {t('common.save', 'Save')}
        </Button>
      </div>
    </div>
  );
};

export default MentorJurisdictionPicker;
