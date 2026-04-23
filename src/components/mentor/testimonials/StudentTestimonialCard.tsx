import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MessageSquarePlus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  useDeleteMyTestimonial,
  useMyTestimonial,
  useSubmitTestimonial,
  useUpdateMyTestimonial,
} from '@/hooks/useMentor';

const MAX_BODY = 1000;

const StarPicker: React.FC<{
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [hover, setHover] = useState(0);
  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 p-0.5 disabled:opacity-50"
          >
            <Star
              className={[
                'w-6 h-6 transition-colors',
                active
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/40',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
};

const StudentTestimonialCard: React.FC = () => {
  const { t } = useTranslation();
  const { data: mine, isLoading } = useMyTestimonial();
  const submit = useSubmitTestimonial();
  const update = useUpdateMyTestimonial();
  const del = useDeleteMyTestimonial();

  const [rating, setRating] = useState<number>(0);
  const [body, setBody] = useState<string>('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setBody(mine.body);
    }
  }, [mine]);

  const canSave = rating > 0 && body.trim().length > 0 && body.length <= MAX_BODY;
  const dirty =
    !mine || rating !== mine.rating || body !== mine.body;

  const handleSave = () => {
    if (!canSave) return;
    if (mine) {
      update.mutate({ rating, body });
    } else {
      submit.mutate({ rating, body });
    }
  };

  const handleDelete = () => {
    del.mutate(undefined, {
      onSuccess: () => {
        setRating(0);
        setBody('');
        setDeleteOpen(false);
      },
    });
  };

  if (isLoading) {
    return <div className="h-28 rounded-2xl bg-muted/20 animate-pulse" />;
  }

  return (
    <section
      aria-labelledby="my-testimonial-heading"
      className="glass-card rounded-2xl p-5 border border-border/50 space-y-4"
    >
      <div className="flex items-center gap-2">
        <MessageSquarePlus
          className="w-4 h-4 text-primary"
          aria-hidden="true"
        />
        <h2 id="my-testimonial-heading" className="text-base font-semibold">
          {mine
            ? t('mentor.myTestimonial.editTitle', 'Your review')
            : t('mentor.myTestimonial.title', 'Leave a review')}
        </h2>
        {mine && !mine.approved && (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
            {t('mentor.myTestimonial.pending', 'Awaiting approval')}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t('mentor.myTestimonial.rating', 'Rating')}</Label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial-body">
          {t('mentor.myTestimonial.body', 'What has your mentor helped with?')}
        </Label>
        <Textarea
          id="testimonial-body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          maxLength={MAX_BODY}
          placeholder={t(
            'mentor.myTestimonial.bodyPlaceholder',
            'Share your honest experience…'
          )}
        />
        <p className="text-[11px] text-muted-foreground text-right tabular-nums">
          {body.length} / {MAX_BODY}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button
          onClick={handleSave}
          disabled={
            !canSave || !dirty || submit.isPending || update.isPending
          }
        >
          {(submit.isPending || update.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {mine
            ? t('mentor.myTestimonial.update', 'Update review')
            : t('mentor.myTestimonial.submit', 'Submit review')}
        </Button>
        {mine && (
          <Button
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            {t('mentor.myTestimonial.delete', 'Delete review')}
          </Button>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.myTestimonial.deleteTitle', 'Delete your review?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.myTestimonial.deleteDesc',
                'You can write a new one any time.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={del.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StudentTestimonialCard;
