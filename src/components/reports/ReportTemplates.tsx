import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileText,
  TrendingUp,
  BookOpen,
  Target,
  Shield,
  PieChart,
  BadgeCheck,
  Brain,
  Receipt,
  Calculator,
  LineChart,
  GitCompareArrows,
  CalendarRange,
  BarChart3,
  Swords,
  AlertTriangle,
  DollarSign,
  ChevronDown,
  LayoutGrid,
  List,
  Rows3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportType, ReportFormat } from '@/types/dto';

// ── Types ──

interface TemplateConfig {
  type: ReportType;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  formats: ReportFormat[];
  available: boolean;
}

interface CategoryConfig {
  key: string;
  icon: React.ReactNode;
  iconColor: string;
  templates: TemplateConfig[];
}

type ViewMode = 'cards' | 'list' | 'compact';

// ── Data ──

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'performance',
    icon: <TrendingUp className="h-4 w-4" />,
    iconColor: 'text-green-500',
    templates: [
      { type: 'TRADE_SUMMARY', icon: <FileText className="h-5 w-5" />, iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'PERFORMANCE', icon: <TrendingUp className="h-5 w-5" />, iconColor: 'text-green-500', iconBg: 'bg-green-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'DAILY_JOURNAL', icon: <BookOpen className="h-5 w-5" />, iconColor: 'text-violet-500', iconBg: 'bg-violet-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'EQUITY_CURVE_ADVANCED', icon: <LineChart className="h-5 w-5" />, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'PERFORMANCE_ATTRIBUTION', icon: <PieChart className="h-5 w-5" />, iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10', formats: ['PDF', 'CSV'], available: true },
    ],
  },
  {
    key: 'strategy',
    icon: <Target className="h-4 w-4" />,
    iconColor: 'text-orange-500',
    templates: [
      { type: 'STRATEGY_BREAKDOWN', icon: <Target className="h-5 w-5" />, iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'STRATEGY_COMPLIANCE', icon: <Swords className="h-5 w-5" />, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'BACKTEST_VS_LIVE', icon: <GitCompareArrows className="h-5 w-5" />, iconColor: 'text-teal-500', iconBg: 'bg-teal-500/10', formats: ['PDF', 'CSV'], available: true },
    ],
  },
  {
    key: 'risk',
    icon: <AlertTriangle className="h-4 w-4" />,
    iconColor: 'text-red-500',
    templates: [
      { type: 'RISK_REPORT', icon: <Shield className="h-5 w-5" />, iconColor: 'text-red-500', iconBg: 'bg-red-500/10', formats: ['PDF'], available: true },
      { type: 'BEHAVIORAL_ANALYSIS', icon: <Brain className="h-5 w-5" />, iconColor: 'text-pink-500', iconBg: 'bg-pink-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'PROP_FIRM_VERIFICATION', icon: <BadgeCheck className="h-5 w-5" />, iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/10', formats: ['PDF', 'CSV'], available: true },
    ],
  },
  {
    key: 'financial',
    icon: <DollarSign className="h-4 w-4" />,
    iconColor: 'text-emerald-500',
    templates: [
      { type: 'SYMBOL_PERFORMANCE', icon: <BarChart3 className="h-5 w-5" />, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'COMMISSION_ANALYSIS', icon: <Receipt className="h-5 w-5" />, iconColor: 'text-cyan-500', iconBg: 'bg-cyan-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'MONTHLY_STATEMENT', icon: <FileText className="h-5 w-5" />, iconColor: 'text-slate-500', iconBg: 'bg-slate-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'YEAR_IN_REVIEW', icon: <CalendarRange className="h-5 w-5" />, iconColor: 'text-rose-500', iconBg: 'bg-rose-500/10', formats: ['PDF', 'CSV'], available: true },
      { type: 'TAX_PREVIEW', icon: <Calculator className="h-5 w-5" />, iconColor: 'text-teal-500', iconBg: 'bg-teal-500/10', formats: ['PDF', 'CSV'], available: true },
    ],
  },
];

const TEMPLATES: TemplateConfig[] = CATEGORIES.flatMap(c => c.templates);

// ── View mode toggle ──

const VIEW_MODES: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
  { value: 'cards', icon: <LayoutGrid className="h-3.5 w-3.5" />, label: 'Cards' },
  { value: 'list', icon: <List className="h-3.5 w-3.5" />, label: 'List' },
  { value: 'compact', icon: <Rows3 className="h-3.5 w-3.5" />, label: 'Compact' },
];

// ── Component ──

interface ReportTemplatesProps {
  onGenerate: (type: ReportType, formats: ReportFormat[]) => void;
}

const ReportTemplates: React.FC<ReportTemplatesProps> = ({ onGenerate }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CATEGORIES.map(c => [c.key, true]))
  );

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-2">
      {/* View mode toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-0.5 rounded-lg border bg-card/50 p-0.5">
          {VIEW_MODES.map(mode => (
            <Button
              key={mode.value}
              variant={viewMode === mode.value ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-7 px-2.5 text-xs gap-1.5', viewMode === mode.value && 'shadow-sm')}
              onClick={() => setViewMode(mode.value)}
              aria-label={mode.label}
            >
              {mode.icon}
              <span className="hidden sm:inline">{mode.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const isOpen = openCategories[cat.key] ?? true;
          return (
            <Collapsible key={cat.key} open={isOpen} onOpenChange={() => toggleCategory(cat.key)}>
              {/* Category header — clickable to collapse */}
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-1 rounded-lg hover:bg-accent/50 transition-colors group">
                <ChevronDown className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0',
                  !isOpen && '-rotate-90'
                )} />
                <div className={cn('flex items-center justify-center shrink-0', cat.iconColor)}>
                  {cat.icon}
                </div>
                <h3 className="text-sm font-semibold text-left">
                  {t(`reports.categories.${cat.key}`)}
                </h3>
                <span className="text-[11px] text-muted-foreground font-mono bg-muted/50 rounded-md px-1.5 py-0.5">
                  {cat.templates.length}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent className="pt-2">
                {viewMode === 'cards' && <CardsView templates={cat.templates} onGenerate={onGenerate} t={t} />}
                {viewMode === 'list' && <ListView templates={cat.templates} onGenerate={onGenerate} t={t} />}
                {viewMode === 'compact' && <CompactView templates={cat.templates} onGenerate={onGenerate} t={t} />}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

// ── Cards view (original grid) ──

const CardsView: React.FC<{ templates: TemplateConfig[]; onGenerate: ReportTemplatesProps['onGenerate']; t: (key: string) => string }> = ({ templates, onGenerate, t }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
    {templates.map((tpl, i) => (
      <Card
        key={tpl.type}
        className={cn(
          'glass-card rounded-2xl relative overflow-hidden transition-all',
          tpl.available ? 'hover:border-primary/30 hover:shadow-md' : 'opacity-60',
        )}
        style={{ animationDelay: `${i * 40}ms` }}
      >
        {!tpl.available && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-muted/80 text-muted-foreground">
              {t('reports.comingSoon')}
            </Badge>
          </div>
        )}
        <CardContent className="p-4 flex flex-col gap-3 h-full">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', tpl.iconBg, tpl.iconColor)}>
            {tpl.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{t(`reports.templates.${tpl.type}.name`)}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">{t(`reports.templates.${tpl.type}.description`)}</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {tpl.formats.map(fmt => (
              <Badge key={fmt} variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{fmt}</Badge>
            ))}
          </div>
          <Button
            size="sm" variant={tpl.available ? 'default' : 'outline'}
            className="w-full text-xs h-8" disabled={!tpl.available}
            onClick={() => tpl.available && onGenerate(tpl.type, tpl.formats)}
          >
            {tpl.available ? t('reports.generateReport') : t('reports.comingSoon')}
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
);

// ── List view (detailed rows) ──

const ListView: React.FC<{ templates: TemplateConfig[]; onGenerate: ReportTemplatesProps['onGenerate']; t: (key: string) => string }> = ({ templates, onGenerate, t }) => (
  <div className="space-y-2">
    {templates.map((tpl) => (
      <div
        key={tpl.type}
        className={cn(
          'flex items-center gap-4 p-3 rounded-xl border bg-card/50 transition-all',
          tpl.available ? 'hover:border-primary/30 hover:bg-accent/30' : 'opacity-60',
        )}
      >
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', tpl.iconBg, tpl.iconColor)}>
          {tpl.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{t(`reports.templates.${tpl.type}.name`)}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t(`reports.templates.${tpl.type}.description`)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {tpl.formats.map(fmt => (
            <Badge key={fmt} variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{fmt}</Badge>
          ))}
        </div>
        <Button
          size="sm" variant={tpl.available ? 'default' : 'outline'}
          className="text-xs h-8 px-4 shrink-0" disabled={!tpl.available}
          onClick={() => tpl.available && onGenerate(tpl.type, tpl.formats)}
        >
          {tpl.available ? t('reports.generateReport') : t('reports.comingSoon')}
        </Button>
      </div>
    ))}
  </div>
);

// ── Compact view (dense grid, icon + name + button only) ──

const CompactView: React.FC<{ templates: TemplateConfig[]; onGenerate: ReportTemplatesProps['onGenerate']; t: (key: string) => string }> = ({ templates, onGenerate, t }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
    {templates.map((tpl) => (
      <button
        key={tpl.type}
        disabled={!tpl.available}
        onClick={() => tpl.available && onGenerate(tpl.type, tpl.formats)}
        className={cn(
          'flex items-center gap-2.5 p-2.5 rounded-xl border bg-card/50 text-left transition-all',
          tpl.available
            ? 'hover:border-primary/30 hover:bg-accent/30 cursor-pointer'
            : 'opacity-60 cursor-not-allowed',
        )}
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', tpl.iconBg, tpl.iconColor)}>
          {React.cloneElement(tpl.icon as React.ReactElement, { className: 'h-4 w-4' })}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs leading-tight truncate">{t(`reports.templates.${tpl.type}.name`)}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {tpl.formats.map(fmt => (
              <span key={fmt} className="text-[9px] text-muted-foreground font-mono">{fmt}</span>
            ))}
          </div>
        </div>
      </button>
    ))}
  </div>
);

export { TEMPLATES, CATEGORIES };
export type { TemplateConfig, CategoryConfig, ViewMode };
export default ReportTemplates;
