import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTags, useCreateTag } from '@/hooks/useTags';
import type { TagResponseDto } from '@/types/dto';

interface TagPickerProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  className?: string;
}

export function TagPicker({ selectedTagIds, onChange, className }: TagPickerProps) {
  const { t } = useTranslation();
  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedTags = allTags.filter(tag => selectedTagIds.includes(tag.id));
  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  // Deterministic color palette for new tags
  const TAG_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
    '#84CC16', '#E11D48', '#0EA5E9', '#D946EF', '#22C55E',
  ];
  const nextColor = TAG_COLORS[allTags.length % TAG_COLORS.length];

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const removeTag = (tagId: number) => {
    onChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!search.trim()) return;
    const existing = allTags.find(t => t.name.toLowerCase() === search.toLowerCase());
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        onChange([...selectedTagIds, existing.id]);
      }
      setSearch('');
      return;
    }
    try {
      const newTag = await createTag.mutateAsync({ name: search.trim(), color: nextColor });
      onChange([...selectedTagIds, newTag.id]);
      setSearch('');
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map(tag => (
            <Badge
              key={tag.id}
              variant="outline"
              className="gap-1 pr-1 text-xs"
              style={{ borderColor: tag.color + '40', backgroundColor: tag.color + '10', color: tag.color }}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add tag popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('trades.addTag', 'Add Tag')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <Input
            placeholder={t('trades.searchOrCreateTag', 'Search or create tag...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateTag();
              }
            }}
            className="h-8 text-xs mb-2"
          />
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {filteredTags.length === 0 && search.trim() && (
              <button
                type="button"
                onClick={handleCreateTag}
                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>{t('trades.createTag', 'Create')}: <strong>{search}</strong></span>
              </button>
            )}
            {filteredTags.map(tag => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs transition-colors',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted',
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
