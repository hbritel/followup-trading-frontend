import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [pickerOpen, setPickerOpen] = useState(false);

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
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={pickerOpen}
              className="flex-1 justify-between text-sm font-normal"
            >
              {addCode
                ? `${addCode} — ${getCountryName(addCode)}`
                : t(
                    'mentor.settings.jurisdictions.selectCountry',
                    'Select a country…'
                  )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[--radix-popover-trigger-width]"
            align="start"
          >
            <Command>
              <CommandInput
                placeholder={t(
                  'mentor.settings.jurisdictions.searchCountry',
                  'Search a country…'
                )}
              />
              <CommandList className="max-h-64">
                <CommandEmpty>
                  {t(
                    'mentor.settings.jurisdictions.noMatch',
                    'No country matches.'
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {remainingCountries.map((c) => (
                    <CommandItem
                      key={c.code}
                      value={`${c.name} ${c.code}`}
                      onSelect={() => {
                        setAddCode(c.code);
                        setPickerOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          addCode === c.code ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-xs font-mono text-muted-foreground mr-2 w-8">
                        {c.code}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
