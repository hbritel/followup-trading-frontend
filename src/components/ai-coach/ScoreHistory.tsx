import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Info } from 'lucide-react';
import { coachService } from '@/services/coach.service';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SessionDebriefResponseDto } from '@/types/dto';

const WIDTH = 300;
const HEIGHT = 60;
const PADDING_X = 4;
const PADDING_Y = 6;

const scoreToY = (score: number): number => {
  // score 0-10, Y axis inverted (0 at bottom = HEIGHT, 10 at top = 0)
  const ratio = score / 10;
  return HEIGHT - PADDING_Y - ratio * (HEIGHT - PADDING_Y * 2);
};

const getLineColor = (lastScore: number): string => {
  if (lastScore > 7) return '#22c55e'; // green-500
  if (lastScore >= 5) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

const getGradientId = (lastScore: number): string => {
  if (lastScore > 7) return 'scoreGradientGreen';
  if (lastScore >= 5) return 'scoreGradientAmber';
  return 'scoreGradientRed';
};

interface SparklineProps {
  scores: number[];
  lineColor: string;
  gradientId: string;
}

const Sparkline: React.FC<SparklineProps> = ({ scores, lineColor, gradientId }) => {
  const points = useMemo(() => {
    if (scores.length === 0) return [];
    if (scores.length === 1) {
      const x = PADDING_X + (WIDTH - PADDING_X * 2) / 2;
      return [{ x, y: scoreToY(scores[0]) }];
    }
    const step = (WIDTH - PADDING_X * 2) / (scores.length - 1);
    return scores.map((score, i) => ({
      x: PADDING_X + i * step,
      y: scoreToY(score),
    }));
  }, [scores]);

  if (points.length === 0) return null;

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Area path: go along the line then close at the bottom
  const areaPath =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y} L ${points[0].x} ${HEIGHT}`
      : [
          `M ${points[0].x} ${HEIGHT}`,
          ...points.map((p) => `L ${p.x} ${p.y}`),
          `L ${points[points.length - 1].x} ${HEIGHT}`,
          'Z',
        ].join(' ');

  const lastPoint = points[points.length - 1];
  const lastScore = scores[scores.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      style={{ height: HEIGHT }}
      aria-label="Session score history sparkline"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      {points.length > 1 && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Last score dot with label */}
      <circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={lineColor} />
      <text
        x={lastPoint.x}
        y={lastPoint.y - 6}
        textAnchor={lastPoint.x > WIDTH - 20 ? 'end' : 'middle'}
        fontSize={9}
        fill={lineColor}
        fontWeight={600}
      >
        {lastScore.toFixed(1)}
      </text>
    </svg>
  );
};

const ScoreHistory: React.FC = () => {
  const { t } = useTranslation();

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { data: debriefs = [], isLoading } = useQuery<SessionDebriefResponseDto[]>({
    queryKey: ['debriefs-history', thirtyDaysAgo, today],
    queryFn: async () => {
      const resp = await coachService.getDebriefs(thirtyDaysAgo, today);
      return Array.isArray(resp) ? resp : (resp as { data?: unknown[] })?.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const scores = useMemo(
    () =>
      debriefs
        .filter((d): d is SessionDebriefResponseDto & { sessionScore: number } =>
          d.sessionScore != null,
        )
        .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
        .map((d) => d.sessionScore),
    [debriefs],
  );

  const avgScore = useMemo(
    () => (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null),
    [scores],
  );

  const lastScore = scores.length > 0 ? scores[scores.length - 1] : null;
  const lineColor = lastScore != null ? getLineColor(lastScore) : '#6b7280';
  const gradientId = lastScore != null ? getGradientId(lastScore) : 'scoreGradientGray';

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <Skeleton className="h-4 w-36 mb-3" />
        <Skeleton className="h-[60px] w-full mb-2 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t('ai.scoreHistoryTitle', 'Session Scores')}
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors" />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" sideOffset={4} avoidCollisions className="max-w-[280px] text-xs leading-relaxed z-50">
              {t('ai.scoreHistoryInfo', 'AI rates each session 1-10 based on discipline, not just P&L. Factors: trade plan adherence, position sizing, emotional control, and risk management.')}
            </TooltipContent>
          </Tooltip>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
      </div>

      {scores.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t('ai.scoreHistoryEmpty', 'Complete a session debrief to see your scores')}
        </p>
      ) : (
        <>
          <Sparkline scores={scores} lineColor={lineColor} gradientId={gradientId} />

          <div className="flex items-center gap-3 mt-2">
            {avgScore != null && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {t('ai.scoreAvg', 'Avg')}
                </span>
                <span className="text-xs font-semibold">{avgScore.toFixed(1)}</span>
              </div>
            )}
            {lastScore != null && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {t('ai.scoreLast', 'Last')}
                </span>
                <span className="text-xs font-semibold" style={{ color: lineColor }}>
                  {lastScore.toFixed(1)}
                </span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {scores.length} {t('common.sessions', 'sessions')}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ScoreHistory;
