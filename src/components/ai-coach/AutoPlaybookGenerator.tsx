import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import { useStrategies } from '@/hooks/useStrategies';
import { useGenerateAutoPlaybook } from '@/hooks/useAutoPlaybook';
import {
  PLAYBOOK_LOOKBACK_DEFAULT,
  PLAYBOOK_LOOKBACK_MAX,
  PLAYBOOK_LOOKBACK_MIN,
  PLAYBOOK_MIN_TRADES_CEILING,
  PLAYBOOK_MIN_TRADES_DEFAULT,
  PLAYBOOK_MIN_TRADES_FLOOR,
  type GeneratedPlaybookResponse,
  type GeneratedPlaybookStructure,
} from '@/types/autoPlaybook';

const NONE_STRATEGY = '__none__';

/**
 * Container component for the Sprint 4 auto-playbook generator.
 *
 * <p>Plan-gated to PRO+ via {@code useFeatureFlags().hasPlan} — FREE / STARTER
 * see an upgrade prompt. Renders a small form (lookback days, min trades,
 * optional strategy filter), kicks off the generation, and shows the
 * structured playbook + markdown when the backend responds. Long-running call
 * (5-15 s) so the submit button shows a spinner while pending.</p>
 */
const AutoPlaybookGenerator: React.FC = () => {
  const { t } = useTranslation();
  const { hasPlan, currentPlan } = useFeatureFlags();
  const allowed = hasPlan('PRO');
  const { data: strategies } = useStrategies();
  const mutation = useGenerateAutoPlaybook();

  const [lookbackDays, setLookbackDays] = useState<string>(String(PLAYBOOK_LOOKBACK_DEFAULT));
  const [minTrades, setMinTrades] = useState<string>(String(PLAYBOOK_MIN_TRADES_DEFAULT));
  const [strategyId, setStrategyId] = useState<string>(NONE_STRATEGY);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      mutation.mutate({
        lookbackDays: clampInt(lookbackDays, PLAYBOOK_LOOKBACK_MIN, PLAYBOOK_LOOKBACK_MAX,
          PLAYBOOK_LOOKBACK_DEFAULT),
        minTrades: clampInt(minTrades, PLAYBOOK_MIN_TRADES_FLOOR, PLAYBOOK_MIN_TRADES_CEILING,
          PLAYBOOK_MIN_TRADES_DEFAULT),
        filterStrategyId: strategyId === NONE_STRATEGY ? undefined : strategyId,
      });
    },
    [lookbackDays, minTrades, strategyId, mutation],
  );

  const handleReset = useCallback(() => mutation.reset(), [mutation]);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-center">
        <Lock className="h-5 w-5 text-amber-500" />
        <p className="text-sm font-medium">
          {t('autoPlaybook.locked.title', {
            defaultValue: 'Auto-Playbook generation is available from the PRO plan.',
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('autoPlaybook.locked.body', {
            defaultValue: 'The AI clusters your winning trades into a personalised playbook.',
          })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {t('autoPlaybook.locked.currentPlan', {
            defaultValue: 'Your plan: {{plan}}',
            plan: currentPlan,
          })}
        </p>
      </div>
    );
  }

  if (mutation.isSuccess && mutation.data === null) {
    return <UnavailableNotice onRetry={handleReset} />;
  }

  if (mutation.isSuccess && mutation.data) {
    return <ResultPanel result={mutation.data} onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ap-lookback">
            {t('autoPlaybook.lookbackLabel', 'Look-back (days)')}
          </Label>
          <Input
            id="ap-lookback"
            type="number"
            min={PLAYBOOK_LOOKBACK_MIN}
            max={PLAYBOOK_LOOKBACK_MAX}
            value={lookbackDays}
            onChange={(e) => setLookbackDays(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>
        <div>
          <Label htmlFor="ap-min-trades">
            {t('autoPlaybook.minTradesLabel', 'Minimum winners')}
          </Label>
          <Input
            id="ap-min-trades"
            type="number"
            min={PLAYBOOK_MIN_TRADES_FLOOR}
            max={PLAYBOOK_MIN_TRADES_CEILING}
            value={minTrades}
            onChange={(e) => setMinTrades(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>
      </div>
      <div>
        <Label>
          {t('autoPlaybook.strategyLabel', 'Filter by strategy (optional)')}
        </Label>
        <Select value={strategyId} onValueChange={setStrategyId} disabled={mutation.isPending}>
          <SelectTrigger>
            <SelectValue placeholder={t('common.none', 'None')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_STRATEGY}>{t('common.none', 'None')}</SelectItem>
            {(strategies ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive" role="alert">
          {extractErrorMessage(mutation.error, t)}
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-1.5 h-4 w-4" />
        )}
        {mutation.isPending
          ? t('autoPlaybook.generating', 'Generating playbook…')
          : t('autoPlaybook.generate', 'Generate playbook')}
      </Button>
      <p className="text-[10px] italic text-muted-foreground">
        {t('autoPlaybook.disclaimer', {
          defaultValue:
            'Informational only — observation on your own winning trades. Not investment advice.',
        })}
      </p>
    </form>
  );
};

const UnavailableNotice: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-center">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <p className="text-sm font-medium">
        {t('autoPlaybook.unavailable.title', 'Auto-playbook generation is currently unavailable.')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('autoPlaybook.unavailable.body', {
          defaultValue: 'No AI provider is connected. Try again later or contact support.',
        })}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {t('common.retry', 'Retry')}
      </Button>
    </div>
  );
};

const ResultPanel: React.FC<{
  result: GeneratedPlaybookResponse;
  onReset: () => void;
}> = ({ result, onReset }) => {
  const { t } = useTranslation();
  const structure: GeneratedPlaybookStructure = result.structure ?? {};

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        <div className="flex flex-col">
          <p className="text-sm font-semibold">{result.name}</p>
          {result.description && (
            <p className="text-xs text-muted-foreground">{result.description}</p>
          )}
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {t('autoPlaybook.basis', {
              defaultValue: 'Based on {{count}} winners over {{days}} days',
              count: result.basedOnTradesCount,
              days: result.lookbackDays,
            })}
          </p>
        </div>
      </div>

      {structure.entryConditions && structure.entryConditions.length > 0 && (
        <Section title={t('autoPlaybook.entryConditions', 'Entry conditions')}>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
            {structure.entryConditions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid grid-cols-2 gap-3">
        {structure.stopLossHeuristic && (
          <Section title={t('autoPlaybook.stopHeuristic', 'Stop heuristic')}>
            <p className="text-xs text-muted-foreground">{structure.stopLossHeuristic}</p>
          </Section>
        )}
        {structure.targetHeuristic && (
          <Section title={t('autoPlaybook.targetHeuristic', 'Target heuristic')}>
            <p className="text-xs text-muted-foreground">{structure.targetHeuristic}</p>
          </Section>
        )}
        {structure.preferredMarketContext && (
          <Section title={t('autoPlaybook.marketContext', 'Preferred context')}>
            <p className="text-xs text-muted-foreground">{structure.preferredMarketContext}</p>
          </Section>
        )}
        {structure.preferredTimeOfDay && (
          <Section title={t('autoPlaybook.timeOfDay', 'Preferred time')}>
            <p className="text-xs text-muted-foreground">{structure.preferredTimeOfDay}</p>
          </Section>
        )}
        {typeof structure.rrTarget === 'number' && (
          <Section title={t('autoPlaybook.rrTarget', 'R:R target')}>
            <p className="text-xs text-muted-foreground tabular-nums">
              {structure.rrTarget.toFixed(2)}
            </p>
          </Section>
        )}
      </div>

      {result.markdownVersion && (
        <details className="rounded-md border border-border bg-muted/20 p-2">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
            {t('autoPlaybook.fullMarkdown', 'Full markdown')}
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-[11px] text-foreground">
            {result.markdownVersion}
          </pre>
        </details>
      )}

      <Button variant="outline" size="sm" onClick={onReset} className="w-full">
        {t('autoPlaybook.generateAnother', 'Generate another playbook')}
      </Button>
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

function clampInt(raw: string, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

function extractErrorMessage(
  err: unknown,
  t: (key: string, opts?: Record<string, string>) => string,
): string {
  const data = (err as { response?: { data?: { code?: string; message?: string } } } | null)
    ?.response?.data;
  if (data?.code === 'PLAN_FEATURE_LOCKED') {
    return t('autoPlaybook.errors.planLocked', 'Upgrade to PRO to use this feature.');
  }
  if (data?.message) {
    return data.message;
  }
  return t('autoPlaybook.errors.generic', 'Could not generate the playbook. Please retry.');
}

export default AutoPlaybookGenerator;
