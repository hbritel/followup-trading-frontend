import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import AccountSelector from '@/components/dashboard/AccountSelector';
import ReportTemplates from '@/components/reports/ReportTemplates';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';
import { useAccountFilter } from '@/hooks/useAccountFilter';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Download,
  Trash2,
  FileText,
  Calendar,
  Loader2,
  ArrowDownToLine,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReports, useGenerateReport, useDownloadReport, useDeleteReport } from '@/hooks/useReports';
import { reportService } from '@/services/report.service';
import type { ReportType, ReportFormat, ReportResponseDto, ReportStatus } from '@/types/dto';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<ReportStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  COMPLETED: 'default',
  GENERATING: 'secondary',
  PENDING: 'secondary',
  FAILED: 'destructive',
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_VARIANT[status as ReportStatus] ?? 'outline';
}

const ALL_TYPES: ReportType[] = [
  'TRADE_SUMMARY',
  'PERFORMANCE',
  'DAILY_JOURNAL',
  'STRATEGY_BREAKDOWN',
  'RISK_REPORT',
  'TAX_PREVIEW',
  'PERFORMANCE_ATTRIBUTION',
  'PROP_FIRM_VERIFICATION',
  'BEHAVIORAL_ANALYSIS',
  'COMMISSION_ANALYSIS',
  'EQUITY_CURVE_ADVANCED',
  'BACKTEST_VS_LIVE',
  'YEAR_IN_REVIEW',
];

// ── component ─────────────────────────────────────────────────────────────────

const Reports = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: reports, isLoading } = useReports();
  const generateReport = useGenerateReport();
  const downloadReport = useDownloadReport();
  const deleteReport = useDeleteReport();

  // Subscription usage
  const { data: subscription } = useSubscription();
  const reportsUsed = subscription?.usage?.reportsThisMonth ?? 0;
  const reportsMax = subscription?.usage?.reportsMax ?? 0;
  const isUnlimited = reportsMax >= 2147483647;
  const atMonthlyLimit = !isUnlimited && reportsMax > 0 && reportsUsed >= reportsMax;

  // Reports list filters
  const [filterType, setFilterType] = useState<'all' | ReportType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | ReportStatus>('all');

  // Generate dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<ReportType>('TRADE_SUMMARY');
  const [dialogFormats, setDialogFormats] = useState<ReportFormat[]>(['PDF', 'CSV']);
  const [reportFormat, setReportFormat] = useState<ReportFormat>('PDF');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startCalOpen, setStartCalOpen] = useState(false);
  const [endCalOpen, setEndCalOpen] = useState(false);
  const [endCalMonth, setEndCalMonth] = useState<Date>(new Date());
  const [dialogAccountId, setDialogAccountId] = useState('all');

  // Resolve dialog account selection (hook must be at component top level)
  const { accountId: dialogResolvedAccountId } = useAccountFilter(dialogAccountId);

  const openDialog = (type: ReportType, formats: ReportFormat[]) => {
    setDialogType(type);
    setDialogFormats(formats);
    setReportFormat(formats[0]);
    setStartDate(undefined);
    setEndDate(undefined);
    setDialogAccountId('all');
    setShowDialog(true);
  };

  const handleGenerate = () => {
    generateReport.mutate(
      {
        type: dialogType,
        format: reportFormat,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        ...(dialogResolvedAccountId ? { accountId: dialogResolvedAccountId } : {}),
      },
      {
        onSuccess: () => {
          setShowDialog(false);
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
      },
    );
  };

  const handleDownload = (id: string) => {
    downloadReport.mutate(id, {
      onSuccess: () => {
        toast({ title: t('reports.reportDownloaded'), description: t('reports.reportHasBeenDownloaded') });
      },
      onError: () => {
        toast({ title: t('common.error'), description: t('reports.downloadFailed'), variant: 'destructive' });
      },
    });
  };

  const handlePreview = async (id: string) => {
    try {
      const { blob } = await reportService.downloadReport(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after a delay to allow the browser tab to load
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast({ title: t('common.error'), description: t('reports.downloadFailed'), variant: 'destructive' });
    }
  };

  const handleDelete = (id: string) => {
    deleteReport.mutate(id, {
      onSuccess: () => {
        toast({ title: t('reports.reportDeleted'), description: t('reports.reportDeletedDescription') });
      },
      onError: () => {
        toast({ title: t('common.error'), description: t('reports.deleteFailed'), variant: 'destructive' });
      },
    });
  };

  // Apply list filters
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [reports, filterType, filterStatus]);

  // ── render helpers ─────────────────────────────────────────────────────────

  const renderTypeLabel = (type: ReportType) =>
    t(`reports.templates.${type}.name`, { defaultValue: type });

  const renderReportItem = (report: ReportResponseDto) => (
    <div
      key={report.id}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card/50 hover:bg-accent/30 transition-colors"
    >
      {/* Icon + meta */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{report.title}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Badges + actions */}
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <Badge variant="outline" className="text-[10px] font-mono">
          {report.format}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {renderTypeLabel(report.type)}
        </Badge>
        <Badge variant={statusVariant(report.status)} className="text-[10px]">
          {t(`reports.status_${report.status.toLowerCase()}`)}
        </Badge>

        {report.status === 'COMPLETED' && (
          <>
            {report.format === 'PDF' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label={t('reports.previewReport', 'Preview report')}
                onClick={() => handlePreview(report.id)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label={t('reports.downloadReport')}
              onClick={() => handleDownload(report.id)}
              disabled={downloadReport.isPending}
            >
              {downloadReport.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </Button>
          </>
        )}

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          aria-label={t('reports.deleteReport')}
          onClick={() => handleDelete(report.id)}
          disabled={deleteReport.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-44 mb-1.5" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <ArrowDownToLine className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-base">{t('reports.noReports')}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {t('reports.noReportsDescription')}
        </p>
      </div>
    </div>
  );

  // ── main render ────────────────────────────────────────────────────────────

  return (
    <DashboardLayout pageTitle={t('pages.reports')}>
      <PageTransition className="space-y-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('reports.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('reports.description')}</p>
          </div>

          {/* Monthly usage counter */}
          {reportsMax > 0 && (
            <div className="flex items-center gap-2 rounded-xl border bg-card/50 px-4 py-2.5 shrink-0">
              <UsageLimitIndicator
                used={reportsUsed}
                max={reportsMax}
                label={t('reports.reportsThisMonth', 'Reports this month:')}
                showBar
                className="min-w-[160px]"
              />
            </div>
          )}
        </div>

        {/* ── Template gallery ── */}
        <section aria-labelledby="templates-heading">
          <h2 id="templates-heading" className="text-base font-semibold mb-4">
            {t('reports.templatesTitle')}
          </h2>
          <ReportTemplates onGenerate={openDialog} atMonthlyLimit={atMonthlyLimit} />
        </section>

        {/* ── Generated reports list ── */}
        <section aria-labelledby="my-reports-heading">
          <Card className="glass-card rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle id="my-reports-heading" className="text-base font-semibold">
                  {t('reports.myReports')}
                  {reports && reports.length > 0 && (
                    <span className="ml-2 text-xs font-mono text-muted-foreground font-normal">
                      ({filteredReports.length}/{reports.length})
                    </span>
                  )}
                </CardTitle>

                {/* Filter row */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={filterType}
                    onValueChange={(v) => setFilterType(v as typeof filterType)}
                  >
                    <SelectTrigger className="h-8 text-xs w-44">
                      <SelectValue placeholder={t('reports.allTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.allTypes')}</SelectItem>
                      {ALL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {renderTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterStatus}
                    onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
                  >
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue placeholder={t('reports.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.allStatuses')}</SelectItem>
                      <SelectItem value="COMPLETED">{t('reports.status_completed')}</SelectItem>
                      <SelectItem value="GENERATING">{t('reports.status_generating')}</SelectItem>
                      <SelectItem value="PENDING">{t('reports.status_pending')}</SelectItem>
                      <SelectItem value="FAILED">{t('reports.status_failed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading
                ? renderSkeleton()
                : filteredReports.length === 0
                  ? renderEmpty()
                  : (
                    <div className="space-y-2">
                      {filteredReports.map(renderReportItem)}
                    </div>
                  )}
            </CardContent>
          </Card>
        </section>
      </PageTransition>

      {/* ── Generate dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reports.generateReport')}</DialogTitle>
            <DialogDescription>
              {t(`reports.templates.${dialogType}.description`, {
                defaultValue: t('reports.generateDialogDescription'),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Account */}
            <div className="space-y-1.5">
              <Label>{t('reports.account')}</Label>
              <AccountSelector
                value={dialogAccountId}
                onChange={setDialogAccountId}
                className="w-full"
              />
            </div>

            {/* Format — only show formats available for this type */}
            <div className="space-y-1.5">
              <Label>{t('reports.format')}</Label>
              <Select
                value={reportFormat}
                onValueChange={(v) => setReportFormat(v as ReportFormat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectFormat')} />
                </SelectTrigger>
                <SelectContent>
                  {dialogFormats.map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>
                      {fmt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range — auto-chain: start closes → end opens → end closes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('reports.startDate')}</Label>
                <Popover open={startCalOpen} onOpenChange={setStartCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal text-sm h-9',
                        !startDate && 'text-muted-foreground',
                      )}
                    >
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      {startDate ? format(startDate, 'PP') : t('reports.pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        setStartDate(d);
                        setStartCalOpen(false);
                        if (d) setEndCalMonth(d);
                        setTimeout(() => setEndCalOpen(true), 150);
                      }}
                      disabled={{ after: endDate || new Date() }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label>{t('reports.endDate')}</Label>
                <Popover open={endCalOpen} onOpenChange={setEndCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal text-sm h-9',
                        !endDate && 'text-muted-foreground',
                      )}
                    >
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      {endDate ? format(endDate, 'PP') : t('reports.pickDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      month={endCalMonth}
                      onMonthChange={setEndCalMonth}
                      onSelect={(d) => {
                        setEndDate(d);
                        setEndCalOpen(false);
                      }}
                      disabled={{ before: startDate || undefined, after: new Date() }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateReport.isPending || atMonthlyLimit}
              title={atMonthlyLimit ? t('reports.monthlyLimitReached', 'Monthly report limit reached') : undefined}
            >
              {generateReport.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('reports.generatingBtn')}
                </>
              ) : atMonthlyLimit ? (
                t('reports.monthlyLimitReached', 'Monthly limit reached')
              ) : (
                t('reports.generateReport')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Reports;
