import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Pencil,
  Trash2,
  StickyNote,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  useStudentMetrics,
  useStudentTrades,
  useStudentPsychology,
  useStudentNotes,
  useAddStudentNote,
  useUpdateStudentNote,
  useDeleteStudentNote,
} from '@/hooks/useMentor';
import type {
  MentorStudentTradeDto,
  MentorStudentPsychologyDto,
  MentorStudentNoteDto,
} from '@/types/dto';

const MAX_NOTE = 5000;

interface StudentDetailModalProps {
  studentUserId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Shown when the student has not shared a particular category */
const NotSharedBanner: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <ShieldAlert className="w-6 h-6 text-amber-500 dark:text-amber-400" />
      </div>
      <p className="text-sm text-muted-foreground">
        {t('mentor.notShared', 'Student has not shared this data')}
      </p>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/* ── Metrics Tab ──────────────────────────────────────────── */
interface StudentMetricsShape {
  totalTrades?: number | null;
  winRate?: number | null;
  profitFactor?: number | null;
  totalPnl?: number | null;
  avgWin?: number | null;
  avgLoss?: number | null;
}

const MetricsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useStudentMetrics(userId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <NotSharedBanner />;

  const metrics = data as StudentMetricsShape;

  const items: { label: string; value: string | number }[] = [
    {
      label: t('mentor.metricsLabels.totalTrades', 'Total Trades'),
      value: metrics.totalTrades ?? 'N/A',
    },
    {
      label: t('mentor.metricsLabels.winRate', 'Win Rate'),
      value:
        metrics.winRate != null
          ? `${(metrics.winRate * 100).toFixed(1)}%`
          : 'N/A',
    },
    {
      label: t('mentor.metricsLabels.profitFactor', 'Profit Factor'),
      value: metrics.profitFactor?.toFixed(2) ?? 'N/A',
    },
    {
      label: t('mentor.metricsLabels.totalPnl', 'Total P&L'),
      value:
        metrics.totalPnl != null ? `$${metrics.totalPnl.toFixed(2)}` : 'N/A',
    },
    {
      label: t('mentor.metricsLabels.avgWin', 'Avg Win'),
      value: metrics.avgWin != null ? `$${metrics.avgWin.toFixed(2)}` : 'N/A',
    },
    {
      label: t('mentor.metricsLabels.avgLoss', 'Avg Loss'),
      value:
        metrics.avgLoss != null ? `$${metrics.avgLoss.toFixed(2)}` : 'N/A',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-muted/30 border border-border/30 p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
          <p className="text-lg font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

/* ── Trades Tab ───────────────────────────────────────────── */
const TradesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useStudentTrades(userId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <NotSharedBanner />;

  const tradeList: MentorStudentTradeDto[] = Array.isArray(data)
    ? (data as MentorStudentTradeDto[])
    : [];

  if (tradeList.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground text-sm">
        {t('mentor.emptyTrades', 'No trades to display.')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[60vh]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background">
          <tr className="border-b border-border/50 text-muted-foreground text-left">
            <th className="py-2 px-2 font-medium">
              {t('mentor.tradeCols.symbol', 'Symbol')}
            </th>
            <th className="py-2 px-2 font-medium">
              {t('mentor.tradeCols.direction', 'Direction')}
            </th>
            <th className="py-2 px-2 font-medium text-right">
              {t('mentor.tradeCols.pnl', 'P&L')}
            </th>
            <th className="py-2 px-2 font-medium">
              {t('mentor.tradeCols.date', 'Date')}
            </th>
          </tr>
        </thead>
        <tbody>
          {tradeList.slice(0, 50).map((trade, idx) => {
            const pnl = Number(trade.pnl ?? trade.profit ?? 0);
            const direction = String(trade.direction ?? trade.type ?? '');
            const isLong =
              direction.toUpperCase() === 'BUY' ||
              direction.toUpperCase() === 'LONG';
            return (
              <tr
                key={String(trade.id ?? idx)}
                className="border-b border-border/30"
              >
                <td className="py-2 px-2 font-medium">
                  {String(trade.symbol ?? '')}
                </td>
                <td className="py-2 px-2">
                  <span className="flex items-center gap-1">
                    {isLong ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                    )}
                    {direction}
                  </span>
                </td>
                <td
                  className={[
                    'py-2 px-2 text-right font-medium',
                    pnl >= 0
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400',
                  ].join(' ')}
                >
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </td>
                <td className="py-2 px-2 text-muted-foreground">
                  {trade.openTime
                    ? new Date(String(trade.openTime)).toLocaleDateString()
                    : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ── Psychology Tab ───────────────────────────────────────── */
const PsychologyTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useStudentPsychology(userId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data) return <NotSharedBanner />;

  const entries: MentorStudentPsychologyDto[] = Array.isArray(data)
    ? (data as MentorStudentPsychologyDto[])
    : [];

  if (entries.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground text-sm">
        {t('mentor.emptyPsychology', 'No psychology entries to display.')}
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      {entries.map((entry, idx) => (
        <div
          key={String(entry.id ?? idx)}
          className="rounded-xl bg-muted/30 border border-border/30 p-4 space-y-1"
        >
          {entry.emotion && <span className="text-lg">{entry.emotion}</span>}
          {entry.note && (
            <p className="text-sm text-muted-foreground">{entry.note}</p>
          )}
          {entry.date && (
            <p className="text-xs text-muted-foreground/60">
              {new Date(entry.date).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Notes Tab (mentor-private) ─────────────────────────── */
const NoteCharCounter: React.FC<{ count: number }> = ({ count }) => {
  const tone =
    count >= MAX_NOTE
      ? 'text-destructive'
      : count >= 4500
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-muted-foreground/70';
  return (
    <span className={`text-[11px] tabular-nums ${tone}`}>
      {count}/{MAX_NOTE}
    </span>
  );
};

const NoteRow: React.FC<{
  userId: string;
  note: MentorStudentNoteDto;
}> = ({ userId, note }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [visibleToStudent, setVisibleToStudent] = useState(note.visibleToStudent);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateMutation = useUpdateStudentNote(userId);
  const deleteMutation = useDeleteStudentNote(userId);

  const canSubmit = body.trim().length > 0 && body.length <= MAX_NOTE;

  const handleSave = () => {
    if (!canSubmit) return;
    updateMutation.mutate(
      { noteId: note.id, body: body.trim(), visibleToStudent },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleCancel = () => {
    setBody(note.body);
    setVisibleToStudent(note.visibleToStudent);
    setEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate(note.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  };

  return (
    <div className="group rounded-xl bg-muted/30 border border-border/30 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            {new Date(note.createdAt).toLocaleString()}
            {note.updatedAt !== note.createdAt && (
              <span className="italic ml-1">(edited)</span>
            )}
          </p>
          {note.visibleToStudent && !editing && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">
              <Eye className="w-3 h-3" aria-hidden="true" />
              {t('mentor.notes.visibleChip', 'Visible to student')}
            </span>
          )}
        </div>
        {!editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditing(true)}
              aria-label={t('mentor.notes.editAction', 'Edit note')}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              aria-label={t('mentor.notes.deleteAction', 'Delete note')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={MAX_NOTE}
            aria-label={t('mentor.notes.addPlaceholder', 'Note body')}
          />
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
            <Switch
              id={`visible-edit-${note.id}`}
              checked={visibleToStudent}
              onCheckedChange={setVisibleToStudent}
            />
            <div className="min-w-0">
              <Label htmlFor={`visible-edit-${note.id}`} className="text-xs font-medium cursor-pointer">
                {t('mentor.notes.shareWithStudentLabel', 'Share with student')}
              </Label>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {t('mentor.notes.shareWithStudentHelper', 'When enabled, the student sees this note and receives a notification.')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <NoteCharCounter count={body.length} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                size="sm"
                disabled={!canSubmit || updateMutation.isPending}
                onClick={handleSave}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.body}</p>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.notes.deleteConfirmTitle', 'Delete this note?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.notes.deleteConfirmDesc',
                'This private note will be permanently removed.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('mentor.notes.deleteAction', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const NotesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useStudentNotes(userId);
  const addMutation = useAddStudentNote(userId);
  const [body, setBody] = useState('');
  const [visibleToStudent, setVisibleToStudent] = useState(false);

  const canSubmit = body.trim().length > 0 && body.length <= MAX_NOTE;

  const handleSave = () => {
    if (!canSubmit) return;
    addMutation.mutate(
      { body: body.trim(), visibleToStudent },
      {
        onSuccess: () => {
          setBody('');
          setVisibleToStudent(false);
        },
      }
    );
  };

  const notes = data ?? [];

  return (
    <div className="space-y-4">
      {/* Composer */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-2">
        <label htmlFor="note-body" className="sr-only">
          {t('mentor.notes.addPlaceholder', 'Write a private note…')}
        </label>
        <Textarea
          id="note-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t(
            'mentor.notes.addPlaceholder',
            'Write a private note…'
          )}
          rows={3}
          maxLength={MAX_NOTE}
        />
        <div className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
          <Switch
            id="note-visible-to-student"
            checked={visibleToStudent}
            onCheckedChange={setVisibleToStudent}
          />
          <div className="min-w-0">
            <Label htmlFor="note-visible-to-student" className="text-xs font-medium cursor-pointer">
              {t('mentor.notes.shareWithStudentLabel', 'Share with student')}
            </Label>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {t('mentor.notes.shareWithStudentHelper', 'When enabled, the student sees this note and receives a notification.')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <NoteCharCounter count={body.length} />
          <Button
            size="sm"
            disabled={!canSubmit || addMutation.isPending}
            onClick={handleSave}
          >
            {addMutation.isPending && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            )}
            {t('mentor.notes.saveButton', 'Save note')}
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {t('mentor.notes.empty', 'No notes yet')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {t(
                'mentor.notes.emptyDesc',
                'Notes are private — only you see them.'
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[55vh] overflow-y-auto">
          {notes.map((note) => (
            <NoteRow key={note.id} userId={userId} note={note} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main Modal ───────────────────────────────────────────── */
const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentUserId,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto max-sm:max-w-none max-sm:rounded-none max-sm:h-[100dvh] max-sm:max-h-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t('mentor.studentDetail', 'Student Detail')}
          </DialogTitle>
        </DialogHeader>

        {studentUserId && (
          <Tabs defaultValue="metrics" className="mt-2">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="metrics" className="rounded-lg py-2 text-sm">
                {t('mentor.metrics', 'Metrics')}
              </TabsTrigger>
              <TabsTrigger value="trades" className="rounded-lg py-2 text-sm">
                {t('mentor.trades', 'Trades')}
              </TabsTrigger>
              <TabsTrigger value="psychology" className="rounded-lg py-2 text-sm">
                {t('mentor.psychology', 'Psychology')}
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-lg py-2 text-sm gap-1"
              >
                <StickyNote className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('mentor.notes.title', 'Notes')}</span>
                <Lock
                  className="w-3 h-3 text-muted-foreground/70 ml-0.5"
                  aria-label={t('mentor.notes.private', 'Private')}
                />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-4">
              <MetricsTab userId={studentUserId} />
            </TabsContent>
            <TabsContent value="trades" className="mt-4">
              <TradesTab userId={studentUserId} />
            </TabsContent>
            <TabsContent value="psychology" className="mt-4">
              <PsychologyTab userId={studentUserId} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <NotesTab userId={studentUserId} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailModal;
