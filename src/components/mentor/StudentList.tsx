import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Trash2, BarChart3, TrendingUp, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import StudentCohortChips from './StudentCohortChips';
import type { MentorStudentDto } from '@/types/dto';

interface StudentListProps {
  students: MentorStudentDto[];
  onSelectStudent: (userId: string) => void;
  onRemoveStudent: (userId: string) => void;
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
  searchQuery = '',
  sortBy = 'joined',
  visibleStudentIds,
  showCohortChips = false,
}) => {
  const { t } = useTranslation();
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const handleConfirmRemove = () => {
    if (removeTarget) {
      onRemoveStudent(removeTarget);
      setRemoveTarget(null);
    }
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

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('mentor.removeStudent', 'Remove Student')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'mentor.removeConfirm',
                'Are you sure you want to remove this student? They will need a new invite to rejoin.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.remove', 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentList;
