import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMyMentorTags, useSetMyMentorTags, useDirectoryTags } from '@/hooks/useMentor';
import type { MentorTagCategory } from '@/types/dto';

const CATEGORY_ORDER: MentorTagCategory[] = ['asset_class', 'style', 'focus'];
const CATEGORY_LABEL_KEYS: Record<MentorTagCategory, string> = {
  asset_class: 'filters.nicheAssetClass',
  style: 'filters.nicheStyle',
  focus: 'filters.nicheFocus',
};
const MAX_TAGS = 5;

const MentorTagsPicker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: myTags = [], isLoading: loadingMy } = useMyMentorTags();
  const { data: catalog = [], isLoading: loadingCatalog } = useDirectoryTags();
  const mutation = useSetMyMentorTags();

  const [selected, setSelected] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  // Sync from server data
  useEffect(() => {
    if (!loadingMy) {
      setSelected(myTags);
      setDirty(false);
    }
  }, [myTags, loadingMy]);

  const lang = i18n.language.split('-')[0];
  const getLabel = (slug: string): string => {
    const tag = catalog.find((t) => t.slug === slug);
    if (!tag) return slug;
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  const toggleTag = (slug: string) => {
    setDirty(true);
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, slug];
    });
  };

  const handleSave = () => {
    mutation.mutate(selected, {
      onSuccess: () => setDirty(false),
    });
  };

  const grouped = CATEGORY_ORDER.reduce<Record<MentorTagCategory, typeof catalog>>(
    (acc, cat) => {
      acc[cat] = catalog.filter((tag) => tag.category === cat).sort((a, b) => a.sortOrder - b.sortOrder);
      return acc;
    },
    { asset_class: [], style: [], focus: [] }
  );

  if (loadingMy || loadingCatalog) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading', 'Loading…')}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="tags-picker-heading"
      className="space-y-5"
    >
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-primary" aria-hidden="true" />
        <h2 id="tags-picker-heading" className="text-base font-semibold">
          {t('mentor.settings.tags.title', 'Niche tags')}
        </h2>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {selected.length} / {MAX_TAGS}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('mentor.settings.tags.description', 'Select up to {{max}} tags that best describe your trading focus.', { max: MAX_TAGS })}
      </p>

      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const catTags = grouped[cat];
          if (!catTags.length) return null;
          return (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                {t(`mentor.directory.${CATEGORY_LABEL_KEYS[cat]}`, cat)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {catTags.map((tag) => {
                  const checked = selected.includes(tag.slug);
                  const atLimit = !checked && selected.length >= MAX_TAGS;
                  const label = getLabel(tag.slug);
                  return (
                    <TooltipProvider key={tag.slug} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label
                            className={cn(
                              'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all duration-150',
                              checked
                                ? 'border-primary/60 bg-primary/8 text-foreground'
                                : atLimit
                                  ? 'border-border/30 bg-muted/20 text-muted-foreground/50 cursor-not-allowed'
                                  : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => !atLimit && toggleTag(tag.slug)}
                              disabled={atLimit}
                              id={`mentor-tag-${tag.slug}`}
                              className="shrink-0"
                            />
                            <span className="text-sm leading-snug truncate">{label}</span>
                          </label>
                        </TooltipTrigger>
                        {atLimit && (
                          <TooltipContent>
                            {t('mentor.settings.tags.limitReached', 'Maximum {{max}} tags allowed', { max: MAX_TAGS })}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
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

export default MentorTagsPicker;
