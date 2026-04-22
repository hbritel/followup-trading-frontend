import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
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
import type { MentorStudentDto } from '@/types/dto';

interface StudentListProps {
  students: MentorStudentDto[];
  onSelectStudent: (userId: string) => void;
  onRemoveStudent: (userId: string) => void;
}

const SharingDot: React.FC<{ shared: boolean; label: string }> = ({ shared, label }) => (
  <span
    title={label}
    className={[
      'w-2.5 h-2.5 rounded-full flex-shrink-0',
      shared ? 'bg-emerald-400' : 'bg-muted-foreground/30',
    ].join(' ')}
  />
);

const StudentList: React.FC<StudentListProps> = ({
  students,
  onSelectStudent,
  onRemoveStudent,
}) => {
  const { t } = useTranslation();
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const handleConfirmRemove = () => {
    if (removeTarget) {
      onRemoveStudent(removeTarget);
      setRemoveTarget(null);
    }
  };

  const safeStudents = Array.isArray(students) ? students : [];

  if (safeStudents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {t('mentor.noStudents', 'No students have joined yet.')}
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
              <th className="py-3 px-3 font-medium text-center">
                {t('mentor.sharing', 'Sharing')}
              </th>
              <th className="py-3 px-3 font-medium">
                {t('mentor.joinedDate', 'Joined')}
              </th>
              <th className="py-3 px-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {safeStudents.map((student) => (
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
                  <div className="flex items-center justify-center gap-2">
                    <SharingDot
                      shared={student.shareMetrics}
                      label={t('mentor.shareMetrics', 'Metrics')}
                    />
                    <SharingDot
                      shared={student.shareTrades}
                      label={t('mentor.shareTrades', 'Trades')}
                    />
                    <SharingDot
                      shared={student.sharePsychology}
                      label={t('mentor.sharePsychology', 'Psychology')}
                    />
                  </div>
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {new Date(student.joinedAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setRemoveTarget(student.studentUserId)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
