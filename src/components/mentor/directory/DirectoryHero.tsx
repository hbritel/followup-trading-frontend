import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, ShieldCheck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MentorTagDto } from '@/types/dto';

interface DirectoryHeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  /** Top tags surfaced as one-click filter pills under the search bar. */
  popularTags?: MentorTagDto[];
  selectedTagSlugs?: string[];
  onTagToggle?: (slug: string) => void;
  totalElements?: number;
}

/**
 * Page header for the mentor directory. Matches the typography + spacing
 * rhythm of the other dashboard pages (h1 = text-2xl sm:text-3xl, no
 * oversized heroes, no full-bleed gradient that breaks the layout box).
 */
const DirectoryHero: React.FC<DirectoryHeroProps> = ({
  searchValue,
  onSearchChange,
  isLoading = false,
  popularTags = [],
  selectedTagSlugs = [],
  onTagToggle,
  totalElements,
}) => {
  const { t, i18n } = useTranslation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lang = i18n.language.split('-')[0];

  // Sync DOM input when URL changes externally (back/forward, programmatic clear).
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== searchValue) {
      inputRef.current.value = searchValue;
    }
  }, [searchValue]);

  // Global "/" shortcut focuses the search input — marketplace convention.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target
        && (target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(val);
      }, 300);
    },
    [onSearchChange],
  );

  const tagLabel = (tag: MentorTagDto): string => {
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  return (
    <header className="space-y-5">
      {/* Page header — matches the rest of the dashboard pages */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('mentor.directory.hero.title')}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {t('mentor.directory.hero.subtitle')}
        </p>
      </div>

      {/* Search bar with optional / shortcut hint on desktop. Wider than the
          page header text so it feels like a primary action without the
          oversized hero treatment. */}
      <div className="relative max-w-2xl">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          defaultValue={searchValue}
          onChange={handleInput}
          placeholder={t('mentor.directory.searchPlaceholder')}
          className="pl-11 pr-16 h-11 rounded-xl bg-card border-border/60 shadow-sm focus-visible:ring-primary/40 focus-visible:ring-offset-0"
          aria-label={t('mentor.directory.searchPlaceholder')}
        />
        {isLoading ? (
          <Loader2
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin pointer-events-none"
            aria-hidden="true"
          />
        ) : (
          <kbd
            className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center h-6 min-w-[24px] px-1.5 rounded-md border border-border/60 bg-muted/60 text-[11px] font-mono font-medium text-muted-foreground pointer-events-none select-none"
            aria-hidden="true"
            title={t('mentor.directory.hero.slashHint', 'Press / to search')}
          >
            /
          </kbd>
        )}
      </div>

      {/* Popular niche pills — touch-friendly height, X icon on active state */}
      {popularTags.length > 0 && onTagToggle && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mr-1">
            {t('mentor.directory.hero.popular', 'Popular')}
          </span>
          {popularTags.map((tag) => {
            const active = selectedTagSlugs.includes(tag.slug);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => onTagToggle(tag.slug)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm font-medium px-3.5 h-9 rounded-full border transition-colors duration-200 motion-reduce:transition-none',
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                    : 'bg-card text-foreground/85 border-border/60 hover:border-primary/40 hover:text-foreground',
                )}
              >
                {tagLabel(tag)}
                {active && <X className="w-3 h-3 opacity-80" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Trust ribbon — concrete claims, sits inline with header rhythm */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-1">
        {typeof totalElements === 'number' && totalElements > 0 && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck
                className="w-3.5 h-3.5 text-primary"
                aria-hidden="true"
              />
              <span className="font-semibold text-foreground tabular-nums">
                {totalElements}
              </span>
              {t('mentor.directory.hero.trust.verifiedCount', 'verified mentors')}
            </span>
            <span className="opacity-30" aria-hidden="true">
              ·
            </span>
          </>
        )}
        <span>{t('mentor.directory.hero.trust.stripe', 'Stripe-secured payments')}</span>
        <span className="opacity-30" aria-hidden="true">
          ·
        </span>
        <span>{t('mentor.directory.hero.trust.refund', '14-day refund window')}</span>
      </div>
    </header>
  );
};

export default DirectoryHero;
