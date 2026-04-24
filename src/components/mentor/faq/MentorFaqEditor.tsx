import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useMyMentorFaq,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  useReorderFaq,
} from '@/hooks/useMentor';
import { Skeleton } from '@/components/ui/skeleton';
import type { MentorFaqDto } from '@/types/dto';

const MAX_FAQ = 10;

interface EditRowProps {
  initial: { question: string; answer: string };
  onSave: (data: { question: string; answer: string }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

const EditRow: React.FC<EditRowProps> = ({ initial, onSave, onCancel, isPending }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(initial.question);
  const [answer, setAnswer] = useState(initial.answer);

  const canSave = question.trim().length > 0 && answer.trim().length > 0;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="faq-question" className="text-xs">
          {t('mentor.faq.editor.questionLabel', 'Question')}
        </Label>
        <Input
          id="faq-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('mentor.faq.editor.questionPlaceholder', 'What do students ask most?')}
          className="text-sm"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="faq-answer" className="text-xs">
          {t('mentor.faq.editor.answerLabel', 'Answer')}
        </Label>
        <Textarea
          id="faq-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('mentor.faq.editor.answerPlaceholder', 'Your answer…')}
          rows={3}
          className="text-sm resize-none"
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          size="sm"
          onClick={() => onSave({ question: question.trim(), answer: answer.trim() })}
          disabled={!canSave || isPending}
          className="h-8 gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          {t('common.save', 'Save')}
        </Button>
      </div>
    </div>
  );
};

interface FaqRowProps {
  item: MentorFaqDto;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const FaqRow: React.FC<FaqRowProps> = ({
  item,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const { t } = useTranslation();

  return (
    <div className="group rounded-xl border border-border/50 bg-background/40 p-4 flex items-start gap-3">
      <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-0.5 rounded text-muted-foreground/50 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label={t('mentor.faq.editor.moveUp', 'Move up')}
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-0.5 rounded text-muted-foreground/50 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label={t('mentor.faq.editor.moveDown', 'Move down')}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{item.question}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {item.answer}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
          aria-label={t('mentor.faq.editor.edit', 'Edit')}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label={t('mentor.faq.editor.delete', 'Delete')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

const MentorFaqEditor: React.FC = () => {
  const { t } = useTranslation();
  const { data: faqItems = [], isLoading } = useMyMentorFaq();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const reorderFaq = useReorderFaq();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = [...faqItems].sort((a, b) => a.sortOrder - b.sortOrder);
  const atCap = sorted.length >= MAX_FAQ;

  const handleCreate = (data: { question: string; answer: string }) => {
    createFaq.mutate(data, { onSuccess: () => setAdding(false) });
  };

  const handleUpdate = (id: string, data: { question: string; answer: string }) => {
    updateFaq.mutate({ id, data }, { onSuccess: () => setEditingId(null) });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteFaq.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const next = [...sorted];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    reorderFaq.mutate(next.map((i) => i.id));
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            {t('mentor.faq.editor.title', 'FAQ')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              'mentor.faq.editor.count',
              '{{count}} / {{max}} entries',
              { count: sorted.length, max: MAX_FAQ }
            )}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={() => { setAdding(true); setEditingId(null); }}
                  disabled={atCap || adding}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('mentor.faq.editor.addButton', 'Add FAQ')}
                </Button>
              </span>
            </TooltipTrigger>
            {atCap && (
              <TooltipContent side="left" className="text-xs max-w-[200px]">
                {t('mentor.faq.editor.capReached', 'Maximum {{max}} FAQ entries.', {
                  max: MAX_FAQ,
                })}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {adding && (
        <EditRow
          initial={{ question: '', answer: '' }}
          onSave={handleCreate}
          onCancel={() => setAdding(false)}
          isPending={createFaq.isPending}
        />
      )}

      {sorted.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/50 rounded-xl">
          {t(
            'mentor.faq.editor.empty',
            'No FAQ entries yet. Add a question to help prospective students.'
          )}
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((item, index) =>
          editingId === item.id ? (
            <EditRow
              key={item.id}
              initial={{ question: item.question, answer: item.answer }}
              onSave={(data) => handleUpdate(item.id, data)}
              onCancel={() => setEditingId(null)}
              isPending={updateFaq.isPending}
            />
          ) : (
            <FaqRow
              key={item.id}
              item={item}
              index={index}
              total={sorted.length}
              onEdit={() => { setEditingId(item.id); setAdding(false); }}
              onDelete={() => setDeletingId(item.id)}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
            />
          )
        )}
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => { if (!open) setDeletingId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.faq.editor.deleteTitle', 'Delete FAQ entry?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.faq.editor.deleteDesc',
                'This FAQ entry will be permanently removed from your public profile.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MentorFaqEditor;
