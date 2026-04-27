import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Trash2, BarChart3, TrendingUp, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StudentCohortChips from './StudentCohortChips';
import type { MentorStudentDto } from '@/types/dto';

const MIN_REMOVAL_REASON = 10;
const MAX_REMOVAL_REASON = 2000;

interface StudentListProps {
  students: MentorStudentDto[];
  onSelectStudent: (userId: string) => void;
  onRemoveStudent: (userId: string, reason: string) => void;
  isRemoving?: boolean;
  searchQuery?: string;
  sortBy?: 'joined' | 'sharing';
  /**
   * If provided, only students whose ID is in this set are shown.
   * Undefined means no cohort filter (show all).
   */
  visibleStudentIds?: Set<string>;
  showCohortChips?: boolean;
}

interface SharingChipProps {
  shared: boolean;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const SharingChip: React.FC<SharingChipProps> = ({ shared, label, Icon }) => (
  <span
    className={[
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-colors',
      shared
        ? 'bg-primary/10 text-primary border-primary/30'
        : 'bg-muted/40 text-muted-foreground border-border/40',
    ].join(' ')}
    aria-label={`${label}: ${shared ? 'shared' : 'not shared'}`}
  >
    <Icon className="w-3 h-3" aria-hidden="true" />
    <span>{label}</span>
  </span>
);

const sharingScore = (s: MentorStudentDto) =>
  (s.shareMetrics ? 1 : 0) + (s.shareTrades ? 1 : 0) + (s.sharePsychology ? 1 : 0);

const StudentList: React.FC<StudentListProps> = ({
  students,
  onSelectStudent,
  onRemoveStudent,
  isRemoving = false,
  searchQuery = '',
  sortBy = 'joined',
  visibleStudentIds,
  showCohortChips = false,
}) => {
  const { t } = useTranslation();
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState('');

  // Reset the reason whenever the modal opens for a new target so a previous
  // draft never leaks across removals.
  useEffect(() => {
    if (removeTarget !== null) setRemoveReason('');
  }, [removeTarget]);

  const trimmedReason = removeReason.trim();
  const reasonValid =
    trimmedReason.length >= MIN_REMOVAL_REASON
    && trimmedReason.length <= MAX_REMOVAL_REASON;

  const handleConfirmRemove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTarget || !reasonValid) return;
    onRemoveStudent(removeTarget, trimmedReason);
    setRemoveTarget(null);
  };

  const filteredStudents = useMemo(() => {
    const safe = Array.isArray(students) ? students : [];
    const q = searchQuery.trim().toLowerCase();
    let filtered = q
      ? safe.filter((s) => (s.username ?? '').toLowerCase().includes(q))
      : safe;
    if (visibleStudentIds) {
      filtered = filtered.filter((s) => visibleStudentIds.has(s.studentUserId));
    }
    const sorted = [...filtered];
    if (sortBy === 'sharing') {
      sorted.sort((a, b) => sharingScore(b) - sharingScore(a));
    } else {
      sorted.sort(
        (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      );
    }
    return sorted;
  }, [students, searchQuery, sortBy, visibleStudentIds]);

  if (filteredStudents.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        {searchQuery || visibleStudentIds
          ? t('mentor.noStudentsFound', 'No students match your search.')
          : t('mentor.noStudents', 'No students have joined yet.')}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground text-left">
              <th className="py-3 px-3 font-medium">
                {t('common.username', 'Username')}
              </th>
              <th className="py-3 px-3 font-medium">
                {t('mentor.sharing', 'Sharing')}
              </th>
              {showCohortChips && (
                <th className="py-3 px-3 font-medium hidden md:table-cell">
                  {t('mentor.cohorts.title', 'Cohorts')}
                </th>
              )}
              <th className="py-3 px-3 font-medium">
                {t('mentor.joinedDate', 'Joined')}
              </th>
              <th className="py-3 px-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.studentUserId}
                className="border-b border-border/30 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => onSelectStudent(student.studentUserId)}
                    className="text-primary hover:underline font-medium"
                  >
                    {student.username}
                  </button>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SharingChip
                      shared={student.shareMetrics}
                      label={t('mentor.sharingChip.metrics', 'Metrics')}
                      Icon={BarChart3}
                    />
                    <SharingChip
                      shared={student.shareTrades}
                      label={t('mentor.sharingChip.trades', 'Trades')}
                      Icon={TrendingUp}
                    />
                    <SharingChip
                      shared={student.sharePsychology}
                      label={t('mentor.sharingChip.psychology', 'Psychology')}
                      Icon={Brain}
                    />
                  </div>
                </td>
                {showCohortChips && (
                  <td className="py-3 px-3 hidden md:table-cell">
                    <StudentCohortChips studentUserId={student.studentUserId} />
                  </td>
                )}
                <td className="py-3 px-3 text-muted-foreground">
                  {new Date(student.joinedAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        aria-label={t('mentor.rowActions', 'Row actions')}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setRemoveTarget(student.studentUserId)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('mentor.removeFromMenu', 'Remove student')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('mentor.removeStudent', 'Remove Student')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'mentor.removeConfirm',
                'Are you sure you want to remove this student? They will need a new invite to rejoin.',
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRemove} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remove-reason" className="text-sm font-medium">
                {t(
                  'mentor.removalDialog.reasonLabel',
                  'Explain why you are removing this student',
                )}
                <span className="text-destructive ml-0.5" aria-hidden="true">
                  *
                </span>
              </Label>
              <Textarea
                id="remove-reason"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                rows={5}
                maxLength={MAX_REMOVAL_REASON}
                placeholder={t(
                  'mentor.removalDialog.reasonPlaceholder',
                  'The student will see this message in their My Mentor page. Be specific and respectful.',
                )}
                required
                aria-describedby="remove-reason-hint"
              />
              <div
                id="remove-reason-hint"
                className="flex items-center justify-between text-[11px] text-muted-foreground"
              >
                <span>
                  {t(
                    'mentor.removalDialog.reasonHint',
                    'Min {{min}} characters · shown to the student.',
                    { min: MIN_REMOVAL_REASON },
                  )}
                </span>
                <span className="tabular-nums">
                  {trimmedReason.length}/{MAX_REMOVAL_REASON}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRemoveTarget(null)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!reasonValid || isRemoving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
              >
                {isRemoving && (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                )}
                {t('common.remove', 'Remove')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentList;
