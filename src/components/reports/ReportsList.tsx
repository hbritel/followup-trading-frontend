
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportCard from './ReportCard';

interface Report {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  status: string;
}

interface ReportsListProps {
  reports: Report[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onShareReport: (id: number) => void;
  onDownloadReport: (id: number) => void;
  onViewReport: (id: number) => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ 
  reports, 
  selectedCategory, 
  setSelectedCategory,
  onShareReport,
  onDownloadReport,
  onViewReport
}) => {
  const filteredReports = selectedCategory === 'all' 
    ? reports 
    : reports.filter(report => report.category === selectedCategory);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Reports</CardTitle>
        <CardDescription>Access your recently generated trading reports</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>All</TabsTrigger>
            <TabsTrigger value="monthly" onClick={() => setSelectedCategory('monthly')}>Monthly</TabsTrigger>
            <TabsTrigger value="quarterly" onClick={() => setSelectedCategory('quarterly')}>Quarterly</TabsTrigger>
            <TabsTrigger value="strategy" onClick={() => setSelectedCategory('strategy')}>Strategy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard 
                key={report.id}
                report={report} 
                onShare={onShareReport}
                onDownload={onDownloadReport}
                onView={onViewReport}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard 
                key={report.id}
                report={report} 
                onShare={onShareReport}
                onDownload={onDownloadReport}
                onView={onViewReport}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="quarterly" className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard 
                key={report.id}
                report={report} 
                onShare={onShareReport}
                onDownload={onDownloadReport}
                onView={onViewReport}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="strategy" className="space-y-4">
            {filteredReports.map((report) => (
              <ReportCard 
                key={report.id}
                report={report} 
                onShare={onShareReport}
                onDownload={onDownloadReport}
                onView={onViewReport}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportsList;
