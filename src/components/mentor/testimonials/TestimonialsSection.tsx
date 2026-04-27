import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MessageSquareQuote,
  Star,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  useApproveTestimonial,
  useDeleteTestimonialByMentor,
  useMentorTestimonials,
} from '@/hooks/useMentor';
import type { MentorTestimonialDto } from '@/types/dto';

const StarRow: React.FC<{ rating: number }> = ({ rating }) => {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`${r} of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={[
            'w-4 h-4',
            i < r
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30',
          ].join(' ')}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const StatusBadge: React.FC<{ approved: boolean }> = ({ approved }) => {
  const { t } = useTranslation();
  if (approved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        {t('mentor.testimonials.approved', 'Approved')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" aria-hidden="true" />
      {t('mentor.testimonials.pending', 'Pending')}
    </span>
  );
};

const TestimonialCard: React.FC<{
  item: MentorTestimonialDto;
  onApprove: (id: string) => void;
  onUnapprove: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  busy?: boolean;
}> = ({ item, onApprove, onUnapprove, onDeleteRequest, busy }) => {
  const { t } = useTranslation();
  return (
    <article
      className={[
        'rounded-2xl border p-4 space-y-3 transition-colors',
        item.approved
          ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
          : 'border-amber-500/25 bg-amber-500/[0.04]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 space-y-1.5">
          <StatusBadge approved={item.approved} />
          <div className="flex items-center gap-2 flex-wrap">
            <StarRow rating={item.rating} />
            <span className="text-sm font-medium truncate">
              {item.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.approved ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnapprove(item.id)}
              disabled={busy}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="w-3.5 h-3.5" />
              {t('mentor.testimonials.unapprove', 'Unapprove')}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onApprove(item.id)}
              disabled={busy}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('mentor.testimonials.approve', 'Approve')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDeleteRequest(item.id)}
            disabled={busy}
            aria-label={t('common.delete', 'Delete')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">
        {item.body}
      </p>
    </article>
  );
};

const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: testimonials, isLoading } = useMentorTestimonials();
  const approve = useApproveTestimonial();
  const del = useDeleteTestimonialByMentor();

  const { pending, approved } = useMemo(() => {
    const list = testimonials ?? [];
    return {
      pending: list.filter((x) => !x.approved),
      approved: list.filter((x) => x.approved),
    };
  }, [testimonials]);

  const handleApprove = (id: string) => {
    approve.mutate({ id, approved: true });
  };
  const handleUnapprove = (id: string) => {
    approve.mutate({ id, approved: false });
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    del.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="glass-card rounded-2xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote
            className="w-4 h-4 text-primary"
            aria-hidden="true"
          />
          <h2
            id="testimonials-heading"
            className="text-base font-semibold"
          >
            {t('mentor.testimonials.title', 'Testimonials')}
          </h2>
          {testimonials && testimonials.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({pending.length} {t('mentor.testimonials.pendingShort', 'pending')})
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}
          className="h-8 w-8"
        >
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {open && (
        <div className="space-y-5">
          {isLoading ? (
            <div className="h-24 rounded-xl bg-muted/20 animate-pulse" />
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  {t('mentor.testimonials.pendingTitle', 'Pending')} (
                  {pending.length})
                </h3>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {t(
                      'mentor.testimonials.noPending',
                      'Nothing waiting for review.'
                    )}
                  </p>
                ) : (
                  pending.map((item) => (
                    <TestimonialCard
                      key={item.id}
                      item={item}
                      onApprove={handleApprove} onUnapprove={handleUnapprove}
                      onDeleteRequest={setDeleteId}
                      busy={approve.isPending}
                    />
                  ))
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  {t('mentor.testimonials.approvedTitle', 'Approved')} (
                  {approved.length})
                </h3>
                {approved.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    {t(
                      'mentor.testimonials.noApproved',
                      'No approved reviews yet.'
                    )}
                  </p>
                ) : (
                  approved.map((item) => (
                    <TestimonialCard
                      key={item.id}
                      item={item}
                      onApprove={handleApprove} onUnapprove={handleUnapprove}
                      onDeleteRequest={setDeleteId}
                      busy={approve.isPending}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.testimonials.deleteTitle', 'Delete testimonial?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.testimonials.deleteDesc',
                'This cannot be undone. The student can write a new one later.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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

export default TestimonialsSection;
