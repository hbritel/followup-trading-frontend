import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMyMentorLanguages, useSetMyMentorLanguages, useDirectoryLanguages } from '@/hooks/useMentor';

const LANG_DISPLAY: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  pt: 'Português',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ru: 'Русский',
  hi: 'हिन्दी',
  it: 'Italiano',
  nl: 'Nederlands',
  ko: '한국어',
  tr: 'Türkçe',
  pl: 'Polski',
};

const MentorLanguagesPicker: React.FC = () => {
  const { t } = useTranslation();
  const { data: myLangs = [], isLoading: loadingMy } = useMyMentorLanguages();
  const { data: langOptions } = useDirectoryLanguages();
  const mutation = useSetMyMentorLanguages();

  const [selected, setSelected] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!loadingMy) {
      setSelected(myLangs);
      setDirty(false);
    }
  }, [myLangs, loadingMy]);

  const available = langOptions?.allowed ?? Object.keys(LANG_DISPLAY);

  const toggleLang = (code: string) => {
    setDirty(true);
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSave = () => {
    mutation.mutate(selected, {
      onSuccess: () => setDirty(false),
    });
  };

  if (loadingMy) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading', 'Loading…')}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="langs-picker-heading"
      className="space-y-5"
    >
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" aria-hidden="true" />
        <h2 id="langs-picker-heading" className="text-base font-semibold">
          {t('mentor.settings.languages.title', 'Teaching languages')}
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        {t(
          'mentor.settings.languages.description',
          'Select the languages you teach in. Students can filter by language.'
        )}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('mentor.settings.languages.title', 'Teaching languages')}>
        {available.map((code) => {
          const active = selected.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggleLang(code)}
              aria-pressed={active}
              className={cn(
                'text-sm font-medium px-3 py-1.5 rounded-full border transition-all duration-150',
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25'
                  : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
              )}
            >
              {LANG_DISPLAY[code] ?? code.toUpperCase()}
            </button>
          );
        })}
      </div>

      {dirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('common.save', 'Save')}
          </Button>
        </div>
      )}
    </section>
  );
};

export default MentorLanguagesPicker;
