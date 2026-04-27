import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MentorTagDto } from '@/types/dto';
import type { FilterValues } from './FilterRail';

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

interface ActiveFiltersBarProps {
  filters: FilterValues;
  tags: MentorTagDto[];
  maxPrice: number;
  onChange: (next: Partial<FilterValues>) => void;
  onClear: () => void;
}

interface ChipProps {
  label: string;
  onRemove: () => void;
  ariaLabel: string;
}

const Chip: React.FC<ChipProps> = ({ label, onRemove, ariaLabel }) => (
  <button
    type="button"
    onClick={onRemove}
    aria-label={ariaLabel}
    className="inline-flex items-center gap-1.5 h-8 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium px-3 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors motion-reduce:transition-none"
  >
    <span>{label}</span>
    <X className="w-3.5 h-3.5" aria-hidden="true" />
  </button>
);

const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  filters,
  tags,
  maxPrice,
  onChange,
  onClear,
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.split('-')[0];

  const tagLabel = (slug: string): string => {
    const tag = tags.find((g) => g.slug === slug);
    if (!tag) return slug;
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  const chips: React.ReactNode[] = [];

  filters.tags.forEach((slug) => {
    chips.push(
      <Chip
        key={`tag-${slug}`}
        label={tagLabel(slug)}
        ariaLabel={t('mentor.directory.activeFilters.removeTag', 'Remove {{label}}', {
          label: tagLabel(slug),
        })}
        onRemove={() =>
          onChange({ tags: filters.tags.filter((s) => s !== slug) })
        }
      />,
    );
  });

  filters.langs.forEach((code) => {
    const label = LANG_DISPLAY[code] ?? code.toUpperCase();
    chips.push(
      <Chip
        key={`lang-${code}`}
        label={label}
        ariaLabel={t('mentor.directory.activeFilters.removeLang', 'Remove {{label}}', {
          label,
        })}
        onRemove={() =>
          onChange({ langs: filters.langs.filter((c) => c !== code) })
        }
      />,
    );
  });

  if (filters.freeOnly) {
    chips.push(
      <Chip
        key="free"
        label={t('mentor.directory.filters.priceFree', 'Free')}
        ariaLabel={t('mentor.directory.activeFilters.removeFree', 'Remove free filter')}
        onRemove={() =>
          onChange({ freeOnly: false, minPrice: 0, maxPrice })
        }
      />,
    );
  } else if (filters.maxPrice < maxPrice || filters.minPrice > 0) {
    const label = `${filters.minPrice > 0 ? `$${filters.minPrice}` : '$0'} – $${filters.maxPrice}`;
    chips.push(
      <Chip
        key="price"
        label={label}
        ariaLabel={t('mentor.directory.activeFilters.removePrice', 'Remove price filter')}
        onRemove={() => onChange({ minPrice: 0, maxPrice })}
      />,
    );
  }

  if (filters.acceptsNew) {
    chips.push(
      <Chip
        key="acceptsNew"
        label={t('mentor.directory.filters.acceptsNew', 'Accepts new')}
        ariaLabel={t(
          'mentor.directory.activeFilters.removeAcceptsNew',
          'Remove "accepts new" filter',
        )}
        onRemove={() => onChange({ acceptsNew: false })}
      />,
    );
  }

  if (filters.verifiedOnly) {
    chips.push(
      <Chip
        key="verified"
        label={t('mentor.directory.filters.verifiedOnly', 'Verified only')}
        ariaLabel={t(
          'mentor.directory.activeFilters.removeVerified',
          'Remove "verified only" filter',
        )}
        onRemove={() => onChange({ verifiedOnly: false })}
      />,
    );
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 flex-wrap mb-4"
      aria-label={t('mentor.directory.activeFilters.label', 'Active filters')}
    >
      {chips}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
      >
        {t('mentor.directory.filters.clearAll', 'Clear all')}
      </Button>
    </div>
  );
};

export default ActiveFiltersBar;
