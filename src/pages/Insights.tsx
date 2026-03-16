
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import TradingPatterns from '@/components/insights/TradingPatterns';
import MarketConditions from '@/components/insights/MarketConditions';
import PerformanceMetrics from '@/components/insights/PerformanceMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, X, TrendingUp, AlertTriangle, Target, Award, BarChart3, Sparkles, RefreshCw } from 'lucide-react';
import { useInsights, useDismissInsight } from '@/hooks/useInsights';
import { useWeeklyDigest, useGenerateWeeklyDigest } from '@/hooks/useWeeklyDigest';
import { useToast } from '@/hooks/use-toast';
import type { InsightResponseDto, InsightType } from '@/types/dto';

const insightTypeConfig: Record<InsightType, { color: string; icon: React.ElementType; badgeClass: string }> = {
  PATTERN: { color: 'text-blue-500', icon: BarChart3, badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  STREAK: { color: 'text-green-500', icon: TrendingUp, badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  RISK_WARNING: { color: 'text-red-500', icon: AlertTriangle, badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  IMPROVEMENT: { color: 'text-purple-500', icon: Target, badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  MILESTONE: { color: 'text-amber-500', icon: Award, badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
};

const insightTypeLabel = (type: InsightType, t: (key: string) => string): string => {
  const labelMap: Record<InsightType, string> = {
    PATTERN: t('insights.pattern'),
    STREAK: t('insights.streak'),
    RISK_WARNING: t('insights.riskWarning'),
    IMPROVEMENT: t('insights.improvement'),
    MILESTONE: t('insights.milestone'),
  };
  return labelMap[type] || type;
};

const Insights = () => {
  const { t } = useTranslation();
  const { data: insights, isLoading } = useInsights();
  const dismissInsight = useDismissInsight();
  const { toast } = useToast();
  const { data: digest, isLoading: digestLoading } = useWeeklyDigest();
  const generateDigest = useGenerateWeeklyDigest();

  const handleDismiss = (id: string) => {
    dismissInsight.mutate(id, {
      onError: () => {
        toast({
          title: t('common.error'),
          description: t('insights.dismissFailed'),
          variant: 'destructive',
        });
      },
    });
  };

  const activeInsights = insights?.filter((i) => !i.dismissed) ?? [];

  const renderInsightCard = (insight: InsightResponseDto) => {
    const config = insightTypeConfig[insight.type];
    const IconComponent = config.icon;

    return (
      <Card key={insight.id} className="glass-card rounded-2xl relative">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconComponent className={`h-5 w-5 shrink-0 ${config.color}`} />
              <CardTitle className="text-base truncate text-gradient-primary">{insight.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
                {insightTypeLabel(insight.type, t)}
              </span>
              {insight.actionable && (
                <Badge variant="outline" className="text-xs">
                  {t('insights.actionable')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
              <span>
                <span className="label-caps mr-1">{t('insights.confidence')}:</span>
                {Math.round(insight.confidence * 100)}%
              </span>
              <span>
                <span className="label-caps mr-1">{t('insights.generatedAt')}:</span>
                {new Date(insight.generatedAt).toLocaleDateString()}
              </span>
            </div>
            {!insight.dismissed && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(insight.id)}
                disabled={dismissInsight.isPending}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {t('insights.dismiss')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-1">{t('insights.noInsights')}</h3>
      <p className="text-muted-foreground">{t('insights.noInsightsDescription')}</p>
    </div>
  );

  const renderInsightsContent = () => {
    if (isLoading) {
      return renderLoadingSkeleton();
    }
    if (activeInsights.length === 0) {
      return renderEmptyState();
    }
    return (
      <div className="space-y-4">
        {activeInsights.map(renderInsightCard)}
      </div>
    );
  };

  return (
    <DashboardLayout pageTitle={t('pages.insights')}>
      <PageTransition className="max-w-screen-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gradient animate-fade-in">{t('pages.insights')}</h1>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="insights">{t('insights.aiInsights')}</TabsTrigger>
            <TabsTrigger value="ai-coach" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              {t('ai.title', 'AI Coach')}
            </TabsTrigger>
            <TabsTrigger value="metrics">{t('insights.metrics')}</TabsTrigger>
            <TabsTrigger value="patterns">{t('insights.patterns')}</TabsTrigger>
            <TabsTrigger value="market">{t('insights.marketConditions')}</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {renderInsightsContent()}
          </TabsContent>

          <TabsContent value="ai-coach" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gradient-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  {t('ai.digest', 'Weekly Digest')}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('ai.digestDescription', 'AI-generated summary of your trading week')}
                </p>
              </div>
              <Button
                onClick={() => generateDigest.mutate()}
                disabled={generateDigest.isPending}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${generateDigest.isPending ? 'animate-spin' : ''}`} />
                {t('ai.generateDigest', 'Generate Digest')}
              </Button>
            </div>

            {digestLoading ? (
              <Card className="glass-card rounded-2xl">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ) : digest ? (
              <Card className="glass-card rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gradient-primary">
                      {t('ai.digest', 'Weekly Digest')}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono tabular-nums">
                      <span>
                        <span className="label-caps mr-1">Week:</span>
                        {new Date(digest.weekStart).toLocaleDateString()} &ndash; {new Date(digest.weekEnd).toLocaleDateString()}
                      </span>
                      <span>
                        <span className="label-caps mr-1">Generated:</span>
                        {new Date(digest.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {digest.content}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-amber-400/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">{t('ai.noDigest', 'No digest yet')}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t('ai.noDigestDescription', 'Generate your first weekly trading digest to get AI-powered insights.')}
                </p>
                <Button
                  onClick={() => generateDigest.mutate()}
                  disabled={generateDigest.isPending}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {t('ai.generateDigest', 'Generate Digest')}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <TradingPatterns />
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <MarketConditions />
          </TabsContent>
        </Tabs>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Insights;
