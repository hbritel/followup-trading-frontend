import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useAnalyzeChart } from '@/hooks/useChartAnalysis';
import TradeChartUpload from '@/components/trades/TradeChartUpload';
import type { ChartAnalysisResponse } from '@/types/visionAnalysis';

interface ChartAnalyzerProps {
  /** Optional trade UUID — when set, the analysis is linked to that trade. */
  tradeId?: string;
  /** Pre-fills the trade context block (playbook excerpt, R:R, etc). */
  defaultContext?: string;
  /** Locale override. Defaults to the i18next-resolved language. */
  locale?: string;
}

/**
 * Container component for the Sprint 4 chart analyzer.
 *
 * <p>Renders an upload zone, an optional context box, and the structured
 * result panel once the backend responds. Plan-gated to PRO+ via
 * {@code useFeatureFlags().hasPlan} — FREE / STARTER see an upgrade prompt.
 * Backend 503 (no provider configured) is rendered as a friendly
 * "unavailable" notice.</p>
 */
const ChartAnalyzer: React.FC<ChartAnalyzerProps> = ({
  tradeId,
  defaultContext,
  locale,
}) => {
  const { t, i18n } = useTranslation();
  const { hasPlan, currentPlan } = useFeatureFlags();
  const allowed = hasPlan('PRO');

  const [file, setFile] = useState<File | null>(null);
  const [tradeContext, setTradeContext] = useState(defaultContext ?? '');
  const mutation = useAnalyzeChart();

  const lockedMessage = useMemo(
    () =>
      t('visionAnalysis.locked.title', {
        defaultValue: 'Chart analysis is available from the PRO plan.',
      }),
    [t],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) {
        return;
      }
      mutation.mutate({
        image: file,
        tradeId,
        tradeContext: tradeContext.trim() || undefined,
        locale: locale ?? i18n.resolvedLanguage ?? i18n.language,
      });
    },
    [file, mutation, tradeContext, tradeId, locale, i18n],
  );

  const handleReset = useCallback(() => {
    mutation.reset();
    setFile(null);
  }, [mutation]);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-center">
        <Lock className="h-5 w-5 text-amber-500" />
        <p className="text-sm font-medium">{lockedMessage}</p>
        <p className="text-xs text-muted-foreground">
          {t('visionAnalysis.locked.body', {
            defaultValue:
              'Upload a chart screenshot, the AI grades the setup against your playbook.',
          })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {t('visionAnalysis.locked.currentPlan', {
            defaultValue: 'Your plan: {{plan}}',
            plan: currentPlan,
          })}
        </p>
      </div>
    );
  }

  if (mutation.isSuccess && mutation.data === null) {
    return (
      <UnavailableNotice onRetry={handleReset} />
    );
  }

  if (mutation.isSuccess && mutation.data) {
    return <ResultPanel result={mutation.data} onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TradeChartUpload
        file={file}
        onFileChange={setFile}
        disabled={mutation.isPending}
      />
      <div>
        <Label htmlFor="vision-context">
          {t('visionAnalysis.contextLabel', 'Trade context (optional)')}
        </Label>
        <Textarea
          id="vision-context"
          rows={2}
          maxLength={1000}
          value={tradeContext}
          onChange={(e) => setTradeContext(e.target.value)}
          placeholder={t('visionAnalysis.contextPlaceholder', {
            defaultValue: 'NAS100 LONG, R:R 1.5, ICT Silver Bullet playbook…',
          })}
          disabled={mutation.isPending}
        />
      </div>
      {mutation.isError && (
        <p className="text-xs text-destructive" role="alert">
          {t('visionAnalysis.errors.generic', 'Could not analyse the chart. Please retry.')}
        </p>
      )}
      <Button type="submit" disabled={!file || mutation.isPending} className="w-full">
        {mutation.isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-1.5 h-4 w-4" />
        )}
        {mutation.isPending
          ? t('visionAnalysis.analyzing', 'Analysing chart…')
          : t('visionAnalysis.analyze', 'Analyse chart')}
      </Button>
    </form>
  );
};

const UnavailableNotice: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-center">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <p className="text-sm font-medium">
        {t('visionAnalysis.unavailable.title', 'Vision analysis is currently unavailable.')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('visionAnalysis.unavailable.body', {
          defaultValue:
            'No multimodal AI provider is connected. Try again later or contact support.',
        })}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {t('common.retry', 'Retry')}
      </Button>
    </div>
  );
};

const ResultPanel: React.FC<{
  result: ChartAnalysisResponse;
  onReset: () => void;
}> = ({ result, onReset }) => {
  const { t } = useTranslation();
  const tier = scoreTier(result.complianceScore);

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border p-3',
          tier === 'high' && 'border-emerald-500/40 bg-emerald-500/5',
          tier === 'mid' && 'border-amber-500/40 bg-amber-500/5',
          tier === 'low' && 'border-destructive/40 bg-destructive/5',
        )}
      >
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('visionAnalysis.scoreLabel', 'Compliance')}
          </p>
          <p className="text-3xl font-bold tabular-nums">
            {result.complianceScore}
            <span className="text-base text-muted-foreground">/100</span>
          </p>
          {result.setupIdentified && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {result.setupIdentified}
            </p>
          )}
        </div>
        {tier === 'high' && <CheckCircle2 className="h-8 w-8 text-emerald-500" />}
        {tier === 'mid' && <Sparkles className="h-8 w-8 text-amber-500" />}
        {tier === 'low' && <AlertTriangle className="h-8 w-8 text-destructive" />}
      </div>

      {result.imageUrl && (
        <img
          src={result.imageUrl}
          alt={t('visionAnalysis.imageAlt', 'Analysed chart')}
          className="max-h-64 w-full rounded-md border border-border object-contain"
        />
      )}

      {result.recommendation && (
        <p className="text-sm text-foreground">{result.recommendation}</p>
      )}

      {result.keyLevels.length > 0 && (
        <Section title={t('visionAnalysis.keyLevels', 'Key levels')}>
          <ul className="flex flex-wrap gap-1.5">
            {result.keyLevels.map((level, i) => (
              <li
                key={`${level}-${i}`}
                className="rounded bg-muted/40 px-2 py-0.5 text-xs font-mono"
              >
                {level}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.stopAnalysis && (
        <Section title={t('visionAnalysis.stopAnalysis', 'Stop')}>
          <p className="text-xs text-muted-foreground">{result.stopAnalysis}</p>
        </Section>
      )}

      {result.targetAnalysis && (
        <Section title={t('visionAnalysis.targetAnalysis', 'Target')}>
          <p className="text-xs text-muted-foreground">{result.targetAnalysis}</p>
        </Section>
      )}

      {result.playbookMatch && (
        <Section title={t('visionAnalysis.playbookMatch', 'Playbook match')}>
          <p className="text-xs text-muted-foreground">{result.playbookMatch}</p>
        </Section>
      )}

      <p className="text-[10px] text-muted-foreground">
        {t('visionAnalysis.providerLine', {
          defaultValue: '{{provider}} · {{tokens}} tokens',
          provider: result.providerName,
          tokens: result.tokensUsed,
        })}
      </p>

      <Button variant="outline" size="sm" onClick={onReset} className="w-full">
        {t('visionAnalysis.analyzeAnother', 'Analyse another chart')}
      </Button>

      <p className="pt-1 text-[10px] italic text-muted-foreground">
        {t('visionAnalysis.disclaimer', {
          defaultValue:
            'Informational only — observation on your own playbook + chart. Not investment advice.',
        })}
      </p>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </p>
    {children}
  </div>
);

function scoreTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

export default ChartAnalyzer;
