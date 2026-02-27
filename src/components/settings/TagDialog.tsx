import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { TagResponseDto, TagRequestDto } from '@/types/dto';

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: TagResponseDto | null;
  onSave: (data: TagRequestDto) => Promise<void>;
  isSaving: boolean;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#000000',
];

const TagDialog: React.FC<TagDialogProps> = ({
  open,
  onOpenChange,
  tag,
  onSave,
  isSaving,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const isEditing = !!tag;

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
    } else {
      setName('');
      setColor('#3B82F6');
    }
  }, [tag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t('settings.editTag', 'Edit Tag')
                : t('settings.createTag', 'Create Tag')}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t('settings.editTagDescription', 'Update your tag details.')
                : t('settings.createTagDescription', 'Add a new tag to categorize your trades.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">{t('common.name', 'Name')}</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.tagNamePlaceholder', 'Enter tag name')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.tagColor', 'Color')}</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="tag-color-custom" className="text-xs text-muted-foreground">
                  {t('settings.customColor', 'Custom')}:
                </Label>
                <Input
                  id="tag-color-custom"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-8 p-0 border-0 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">{color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('common.save', 'Save') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TagDialog;
