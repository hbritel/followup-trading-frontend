import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MentorTagDto, MentorTagCategory } from '@/types/dto';

export interface FilterValues {
  tags: string[];
  langs: string[];
  minPrice: number;
  maxPrice: number;
  acceptsNew: boolean;
  freeOnly: boolean;
  verifiedOnly: boolean;
}

interface FilterRailProps {
  tags: MentorTagDto[];
  languages: string[];
  values: FilterValues;
  onChange: (next: Partial<FilterValues>) => void;
  onClear: () => void;
}

const MAX_PRICE = 200;

const CATEGORY_ORDER: MentorTagCategory[] = ['asset_class', 'style', 'focus'];

function groupByCategory(tags: MentorTagDto[]): Record<MentorTagCategory, MentorTagDto[]> {
  const groups: Record<MentorTagCategory, MentorTagDto[]> = {
    asset_class: [],
    style: [],
    focus: [],
  };
  for (const tag of tags) {
    groups[tag.category]?.push(tag);
  }
  for (const cat of CATEGORY_ORDER) {
    groups[cat].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return groups;
}

const CATEGORY_LABEL_KEYS: Record<MentorTagCategory, string> = {
  asset_class: 'filters.nicheAssetClass',
  style: 'filters.nicheStyle',
  focus: 'filters.nicheFocus',
};

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 hover:text-muted-foreground transition-colors"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200',
            open ? '' : '-rotate-90'
          )}
          aria-hidden="true"
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

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
};

const FilterRail: React.FC<FilterRailProps> = ({
  tags,
  languages,
  values,
  onChange,
  onClear,
}) => {
  const { t, i18n } = useTranslation();

  const grouped = groupByCategory(tags);
  const lang = i18n.language.split('-')[0];

  const getTagLabel = (tag: MentorTagDto): string => {
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  const toggleTag = (slug: string) => {
    const next = values.tags.includes(slug)
      ? values.tags.filter((s) => s !== slug)
      : [...values.tags, slug];
    onChange({ tags: next });
  };

  const toggleLang = (code: string) => {
    const next = values.langs.includes(code)
      ? values.langs.filter((c) => c !== code)
      : [...values.langs, code];
    onChange({ langs: next });
  };

  const hasActiveFilters =
    values.tags.length > 0 ||
    values.langs.length > 0 ||
    values.minPrice > 0 ||
    values.maxPrice < MAX_PRICE ||
    values.acceptsNew ||
    values.freeOnly ||
    values.verifiedOnly;

  return (
    <aside
      aria-label={t('mentor.directory.filters.label', 'Filters')}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('mentor.directory.filters.niche')}</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            {t('mentor.directory.filters.clearAll')}
          </Button>
        )}
      </div>

      {/* Tag filters by category */}
      {CATEGORY_ORDER.map((cat) => {
        const catTags = grouped[cat];
        if (!catTags.length) return null;
        return (
          <CollapsibleSection
            key={cat}
            title={t(`mentor.directory.${CATEGORY_LABEL_KEYS[cat]}`, cat)}
          >
            <ul className="space-y-2">
              {catTags.map((tag) => (
                <li key={tag.slug}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox
                      id={`tag-${tag.slug}`}
                      checked={values.tags.includes(tag.slug)}
                      onCheckedChange={() => toggleTag(tag.slug)}
                      className="shrink-0"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                      {getTagLabel(tag)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        );
      })}

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Language */}
      {languages.length > 0 && (
        <CollapsibleSection title={t('mentor.directory.filters.language')}>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((code) => {
              const active = values.langs.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleLang(code)}
                  className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full border transition-all duration-150',
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                      : 'bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
                  )}
                  aria-pressed={active}
                >
                  {LANG_DISPLAY[code] ?? code.toUpperCase()}
                </button>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Price range */}
      <CollapsibleSection title={t('mentor.directory.filters.priceRange')}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              id="free-only"
              checked={values.freeOnly}
              onCheckedChange={(v) => onChange({ freeOnly: v, minPrice: 0, maxPrice: v ? 0 : MAX_PRICE })}
            />
            <Label htmlFor="free-only" className="text-sm cursor-pointer">
              {t('mentor.directory.filters.priceFree')}
            </Label>
          </div>

          {!values.freeOnly && (
            <div className="space-y-2 px-1">
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>$0</span>
                <span>${values.maxPrice < MAX_PRICE ? values.maxPrice : t('mentor.directory.filters.priceMax')}</span>
              </div>
              <Slider
                min={0}
                max={MAX_PRICE}
                step={5}
                value={[values.maxPrice]}
                onValueChange={([val]) => onChange({ maxPrice: val })}
                className="w-full"
                aria-label={t('mentor.directory.filters.priceRange')}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Accepts new toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="accepts-new"
          checked={values.acceptsNew}
          onCheckedChange={(v) => onChange({ acceptsNew: v })}
        />
        <Label htmlFor="accepts-new" className="text-sm cursor-pointer">
          {t('mentor.directory.filters.acceptsNew')}
        </Label>
      </div>

      {/* Verified only toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="verified-only"
          checked={values.verifiedOnly}
          onCheckedChange={(v) => onChange({ verifiedOnly: v })}
        />
        <Label htmlFor="verified-only" className="text-sm cursor-pointer">
          {t('mentor.directory.filters.verifiedOnly', 'Verified only')}
        </Label>
      </div>
    </aside>
  );
};

export default FilterRail;
