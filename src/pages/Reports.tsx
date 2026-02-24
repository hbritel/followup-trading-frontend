
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { reportsData } from '@/data/reportsData';
import ReportsList from '@/components/reports/ReportsList';
import ReportTemplates from '@/components/reports/ReportTemplates';
import ScheduledReports from '@/components/reports/ScheduledReports';

const Reports = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const handleNewReport = () => {
    toast({
      title: t('reports.newReport'),
      description: t('reports.creatingNewReport'),
    });
  };

  const handleShareReport = (reportId: number) => {
    toast({
      title: t('reports.reportShared'),
      description: t('reports.reportHasBeenShared', { id: reportId }),
    });
  };

  const handleDownloadReport = (reportId: number) => {
    toast({
      title: t('reports.reportDownloaded'),
      description: t('reports.reportHasBeenDownloaded', { id: reportId }),
    });
  };

  const handleViewReport = (reportId: number) => {
    toast({
      title: t('reports.reportViewed'),
      description: t('reports.openingReport', { id: reportId }),
    });
  };

  const handleCreateSchedule = () => {
    toast({
      title: t('reports.createSchedule'),
      description: t('reports.creatingNewSchedule'),
    });
  };

  const handleSelectTemplate = (template: string) => {
    toast({
      title: t('reports.templateSelected'),
      description: t('reports.templateHasBeenSelected', { template }),
    });
  };

  return (
    <DashboardLayout pageTitle={t('pages.reports')}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
            <p className="text-muted-foreground">{t('reports.description')}</p>
          </div>
          <Button onClick={handleNewReport}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('reports.newReport')}
          </Button>
        </div>

        <ReportsList
          reports={reportsData}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onShareReport={handleShareReport}
          onDownloadReport={handleDownloadReport}
          onViewReport={handleViewReport}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ReportTemplates onSelectTemplate={handleSelectTemplate} />
          <ScheduledReports onCreateSchedule={handleCreateSchedule} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
