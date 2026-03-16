
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { PlusCircle, Download, Trash2, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReports, useGenerateReport, useDownloadReport, useDeleteReport } from '@/hooks/useReports';
import type { ReportType, ReportFormat, ReportResponseDto } from '@/types/dto';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'GENERATING':
    case 'PENDING':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const typeLabel = (type: ReportType, t: (key: string) => string): string => {
  switch (type) {
    case 'TRADE_SUMMARY':
      return t('reports.tradeSummary');
    case 'PERFORMANCE':
      return t('reports.performance');
    case 'TAX_PREVIEW':
      return t('reports.taxPreview');
    default:
      return type;
  }
};

const Reports = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: reports, isLoading } = useReports();
  const generateReport = useGenerateReport();
  const downloadReport = useDownloadReport();
  const deleteReport = useDeleteReport();

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('TRADE_SUMMARY');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('PDF');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleNewReport = () => {
    setReportType('TRADE_SUMMARY');
    setReportFormat('PDF');
    setStartDate(undefined);
    setEndDate(undefined);
    setShowGenerateDialog(true);
  };

  const handleGenerate = () => {
    generateReport.mutate(
      {
        type: reportType,
        format: reportFormat,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      },
      {
        onSuccess: () => {
          setShowGenerateDialog(false);
          toast({
            title: t('reports.reportGenerated'),
            description: t('reports.reportGeneratedDescription'),
          });
        },
        onError: () => {
          toast({
            title: t('common.error'),
            description: t('reports.reportGenerationFailed'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDownloadReport = (id: string) => {
    downloadReport.mutate(id, {
      onSuccess: () => {
        toast({
          title: t('reports.reportDownloaded'),
          description: t('reports.reportHasBeenDownloaded'),
        });
      },
      onError: () => {
        toast({
          title: t('common.error'),
          description: t('reports.downloadFailed'),
          variant: 'destructive',
        });
      },
    });
  };

  const handleDeleteReport = (id: string) => {
    deleteReport.mutate(id, {
      onSuccess: () => {
        toast({
          title: t('reports.reportDeleted'),
          description: t('reports.reportDeletedDescription'),
        });
      },
      onError: () => {
        toast({
          title: t('common.error'),
          description: t('reports.deleteFailed'),
          variant: 'destructive',
        });
      },
    });
  };

  const renderReportItem = (report: ReportResponseDto) => (
    <div
      key={report.id}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="font-medium truncate">{report.title}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <Badge variant="outline">{typeLabel(report.type, t)}</Badge>
        <Badge variant="outline">{report.format}</Badge>
        <Badge variant={statusVariant(report.status)}>
          {t(`reports.${report.status.toLowerCase()}`)}
        </Badge>
        {report.status === 'COMPLETED' && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDownloadReport(report.id)}
            disabled={downloadReport.isPending}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleDeleteReport(report.id)}
          disabled={deleteReport.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-5 rounded" />
            <div>
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-1">{t('reports.noReports')}</h3>
      <p className="text-muted-foreground">{t('reports.noReportsDescription')}</p>
    </div>
  );

  const renderReportsContent = () => {
    if (isLoading) {
      return renderLoadingSkeleton();
    }
    const hasReports = reports && reports.length > 0;
    if (!hasReports) {
      return renderEmptyState();
    }
    return (
      <div className="space-y-3">
        {reports.map(renderReportItem)}
      </div>
    );
  };

  return (
    <DashboardLayout pageTitle={t('pages.reports')}>
      <PageTransition className="space-y-6">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t('reports.title')}</CardTitle>
            <CardDescription>{t('reports.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderReportsContent()}
          </CardContent>
        </Card>
      </PageTransition>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reports.generateReport')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('reports.type')}</Label>
              <Select
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRADE_SUMMARY">{t('reports.tradeSummary')}</SelectItem>
                  <SelectItem value="PERFORMANCE">{t('reports.performance')}</SelectItem>
                  <SelectItem value="TAX_PREVIEW">{t('reports.taxPreview')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('reports.format')}</Label>
              <Select
                value={reportFormat}
                onValueChange={(v) => setReportFormat(v as ReportFormat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectFormat')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('reports.startDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PP') : <span>{t('backtesting.pickDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t('reports.endDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PP') : <span>{t('backtesting.pickDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateReport.isPending}
            >
              {generateReport.isPending
                ? t('reports.generating')
                : t('reports.generateReport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Reports;
