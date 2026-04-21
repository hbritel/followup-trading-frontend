import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Target, TrendingDown, AlertTriangle, Layers, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropFirmProfile } from '@/types/propfirm';

interface PropFirmCardProps {
  firm: PropFirmProfile;
  onStartEvaluation?: (firm: PropFirmProfile) => void;
  className?: string;
}

// Simple country-code to flag emoji conversion (covers common prop firm countries)
const countryFlag = (country: string | null | undefined): string => {
  if (!country) return '';
  const trimmed = country.trim();
  if (trimmed.length < 2) return '';
  const code = trimmed.toUpperCase().slice(0, 2);
  const offset = 0x1f1e6 - 65;
  const codePoints = [...code].map((c) => c.charCodeAt(0) + offset);
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '';
  }
};

const FirmLogo: React.FC<{ firm: PropFirmProfile }> = ({ firm }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError && firm.logoUrl) {
    return (
      <img
        src={firm.logoUrl}
        alt={`${firm.firmName} logo`}
        className="h-10 w-10 rounded-xl object-contain bg-muted/40 p-1 shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-white">
        {firm.firmCode.substring(0, 2).toUpperCase()}
      </span>
    </div>
  );
};

const PropFirmCard: React.FC<PropFirmCardProps> = ({ firm, onStartEvaluation, className }) => {
  const { t } = useTranslation();
  // Use the first challenge type's phase 1 for metrics display — gives a consistent
  // entry-level snapshot regardless of how many challenge variants the firm offers.
  const firstChallengeType =
    firm.challengeTypes && firm.challengeTypes.length > 0 ? firm.challengeTypes[0] : null;

  const phase1 = firm.phases.find(
    (p) =>
      p.phaseOrder === 1 &&
      (firstChallengeType == null ||
        p.challengeType === firstChallengeType ||
        p.challengeType == null),
  ) ?? firm.phases.find((p) => p.phaseOrder === 1) ?? firm.phases[0];

  // Profit split — take from phase 1 of first challenge type if available
  const profitSplit = phase1?.profitSplitPercent ?? null;

  // Challenge type count label
  const challengeTypeCount = firm.challengeTypes?.length ?? 0;

  // Count total phases per challenge type (or just total phases if no types)
  const phasesPerType: number | null = (() => {
    if (!firstChallengeType) return firm.phases.length;
    const count = firm.phases.filter(
      (p) => p.challengeType === firstChallengeType || p.challengeType == null,
    ).length;
    return count > 0 ? count : firm.phases.length;
  })();

  const flag = countryFlag(firm.country);

  return (
    <Card
      className={cn(
        'glass-card rounded-2xl hover:border-primary/30 transition-all group flex flex-col',
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Logo + firm name */}
          <div className="flex items-center gap-3 min-w-0">
            <FirmLogo firm={firm} />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate">{firm.firmName}</h3>
              {firm.country && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  {flag && <span aria-label={firm.country}>{flag}</span>}
                  {firm.country}
                </p>
              )}
            </div>
          </div>

          {/* Challenge count badge */}
          <Badge variant="secondary" className="text-[10px] shrink-0 flex items-center gap-0.5">
            <Layers className="h-2.5 w-2.5" />
            {challengeTypeCount > 0
              ? t('propFirm.firmCard.challengeCount', { count: challengeTypeCount })
              : t('propFirm.firmCard.phaseCount', { count: firm.phases.length })}
          </Badge>
        </div>

        {/* Challenge type pills — limit to first 3 to keep card compact */}
        {challengeTypeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {firm.challengeTypes.slice(0, 3).map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-primary/20 text-primary/70"
              >
                {type}
              </Badge>
            ))}
            {challengeTypeCount > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-border/50 text-muted-foreground"
              >
                +{challengeTypeCount - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 flex flex-col flex-1 gap-4">
        {/* Phase 1 key metrics — from the first challenge type */}
        {phase1 ? (
          <>
            {/* Sub-label indicating which challenge type / phase the metrics belong to */}
            {firstChallengeType && (
              <p className="text-[10px] text-muted-foreground -mb-2">
                {t('propFirm.firmCard.phaseLine', {
                  type: firstChallengeType,
                  total: phasesPerType,
                })}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {phase1.profitTargetPercent != null && (
                <div className="rounded-xl bg-green-500/8 border border-green-500/15 p-2.5 text-center">
                  <Target className="h-3.5 w-3.5 text-green-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground leading-none mb-1">
                    {t('propFirm.firmCard.profit')}
                  </p>
                  <p className="text-sm font-bold font-mono text-green-400">
                    {phase1.profitTargetPercent}%
                  </p>
                </div>
              )}
              {phase1.maxDrawdownPercent != null && (
                <div className="rounded-xl bg-red-500/8 border border-red-500/15 p-2.5 text-center">
                  <TrendingDown className="h-3.5 w-3.5 text-red-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground leading-none mb-1">
                    {t('propFirm.firmCard.maxDd')}
                  </p>
                  <p className="text-sm font-bold font-mono text-red-400">
                    {phase1.maxDrawdownPercent}%
                  </p>
                </div>
              )}
              {phase1.dailyLossLimitPercent != null && (
                <div className="rounded-xl bg-orange-500/8 border border-orange-500/15 p-2.5 text-center">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground leading-none mb-1">
                    {t('propFirm.firmCard.daily')}
                  </p>
                  <p className="text-sm font-bold font-mono text-orange-400">
                    {phase1.dailyLossLimitPercent}%
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t('propFirm.firmCard.noPhase')}
          </p>
        )}

        {/* Secondary info row: min trading days + profit split */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {phase1 && (
            <p className="text-xs text-muted-foreground">
              {phase1.maxTradingDays
                ? t('propFirm.firmCard.minDaysWithMax', {
                    min: phase1.minTradingDays,
                    max: phase1.maxTradingDays,
                  })
                : t('propFirm.firmCard.minDays', { min: phase1.minTradingDays })}
            </p>
          )}
          {profitSplit != null && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400">
              <Percent className="h-3 w-3" />
              {t('propFirm.firmCard.profitSplit', { percent: profitSplit })}
            </span>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-auto pt-1 gap-2">
          {firm.websiteUrl && (
            <a
              href={firm.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('propFirm.firmCard.websiteAria', { name: firm.firmName })}
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
          <Button
            size="sm"
            className="flex-1 ml-auto"
            onClick={() => onStartEvaluation?.(firm)}
          >
            {t('propFirm.startEvaluation')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropFirmCard;
