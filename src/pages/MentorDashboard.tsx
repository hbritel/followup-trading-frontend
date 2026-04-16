import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudentList from '@/components/mentor/StudentList';
import StudentDetailModal from '@/components/mentor/StudentDetailModal';
import { useMentorInstance, useMentorStudents, useRemoveStudent } from '@/hooks/useMentor';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, colorClass }) => (
  <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
    </div>
  </div>
);

const MentorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { data: instance, isLoading: instanceLoading } = useMentorInstance();
  const { data: students, isLoading: studentsLoading } = useMentorStudents();
  const removeMutation = useRemoveStudent();

  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectStudent = (userId: string) => {
    setSelectedStudent(userId);
    setModalOpen(true);
  };

  const handleRemoveStudent = (userId: string) => {
    removeMutation.mutate(userId);
  };

  if (instanceLoading || studentsLoading) {
    return (
      <DashboardLayout pageTitle={t('mentor.mentorDashboard', 'Mentor Dashboard')}>
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const studentList = students ?? [];
  const totalStudents = studentList.length;

  // Compute average win rate from students who share metrics (concept — placeholder)
  const avgWinRate = 'N/A';

  // Students at risk: students with tilt > 60 (concept — show N/A since we don't have tilt data inline)
  const atRisk = 'N/A';

  // Active today: approximate from joinedAt or just show total (concept placeholder)
  const activeToday = totalStudents;

  return (
    <DashboardLayout pageTitle={t('mentor.mentorDashboard', 'Mentor Dashboard')}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('mentor.mentorDashboard', 'Mentor Dashboard')}
          </h1>
          {instance && (
            <p className="text-muted-foreground mt-1">{instance.brandName}</p>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label={t('mentor.totalStudents', 'Total Students')}
            value={totalStudents}
            icon={<Users className="w-4.5 h-4.5 text-blue-500" />}
            colorClass="bg-blue-500/10"
          />
          <KpiCard
            label={t('mentor.avgWinRate', 'Avg Win Rate')}
            value={avgWinRate}
            icon={<TrendingUp className="w-4.5 h-4.5 text-emerald-500" />}
            colorClass="bg-emerald-500/10"
          />
          <KpiCard
            label={t('mentor.atRisk', 'At Risk')}
            value={atRisk}
            icon={<AlertTriangle className="w-4.5 h-4.5 text-amber-500" />}
            colorClass="bg-amber-500/10"
          />
          <KpiCard
            label={t('mentor.activeToday', 'Active Today')}
            value={activeToday}
            icon={<Activity className="w-4.5 h-4.5 text-violet-500" />}
            colorClass="bg-violet-500/10"
          />
        </div>

        {/* Student list */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-base font-semibold mb-4">
            {t('mentor.students', 'Students')}
          </h2>
          <StudentList
            students={studentList}
            onSelectStudent={handleSelectStudent}
            onRemoveStudent={handleRemoveStudent}
          />
        </div>

        {/* Detail modal */}
        <StudentDetailModal
          studentUserId={selectedStudent}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    </DashboardLayout>
  );
};

export default MentorDashboard;
