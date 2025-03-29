
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { reportsData } from '@/data/reportsData';
import ReportsList from '@/components/reports/ReportsList';
import ReportTemplates from '@/components/reports/ReportTemplates';
import ScheduledReports from '@/components/reports/ScheduledReports';

const Reports = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();
  
  const handleNewReport = () => {
    toast({
      title: "New Report",
      description: "Creating a new trading report.",
    });
  };
  
  const handleShareReport = (reportId: number) => {
    toast({
      title: "Report Shared",
      description: `Report #${reportId} has been shared.`,
    });
  };
  
  const handleDownloadReport = (reportId: number) => {
    toast({
      title: "Report Downloaded",
      description: `Report #${reportId} has been downloaded.`,
    });
  };
  
  const handleViewReport = (reportId: number) => {
    toast({
      title: "Report Viewed",
      description: `Opening report #${reportId} for viewing.`,
    });
  };
  
  const handleCreateSchedule = () => {
    toast({
      title: "Create Schedule",
      description: "Creating a new report schedule.",
    });
  };
  
  const handleSelectTemplate = (template: string) => {
    toast({
      title: "Template Selected",
      description: `${template} template selected.`,
    });
  };
  
  return (
    <DashboardLayout pageTitle="Reports">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trading Reports</h1>
            <p className="text-muted-foreground">Generate and access detailed trading reports</p>
          </div>
          <Button onClick={handleNewReport}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Report
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
