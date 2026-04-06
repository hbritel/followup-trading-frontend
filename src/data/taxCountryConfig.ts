import type { TaxJurisdiction } from '@/types/dto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaxCountryKpi {
  /** i18n key resolved via t() at render time */
  label: string;
  field:
    | 'totalProceeds'
    | 'totalCostBasis'
    | 'totalGain'
    | 'totalShortTermGain'
    | 'totalLongTermGain'
    | 'totalWins'
    | 'totalLosses'
    | 'tradeCount'
    | 'estimatedTax'
    | 'washSaleAdjustment'
    | 'washSaleCount'
    | '__exemptionRemaining'
    | '__stLtBreakdown';
  icon: 'TrendingUp' | 'TrendingDown' | 'DollarSign' | 'Calculator' | 'AlertTriangle' | 'Scale' | 'Banknote' | 'Globe';
  signed?: boolean;
  valueClass?: string;
  cardClass?: string;
  /** i18n key for tooltip */
  tooltip?: string;
}

export interface TaxFormLink {
  label: string;
  cerfa?: string;
  url: string;
  description: string;
}

export interface TaxCountryExport {
  key: string;
  /** i18n key */
  title: string;
  /** i18n key */
  description: string;
}

export interface TaxCountryWarning {
  /** i18n key */
  text: string;
  level?: 'amber' | 'red';
}

export interface TaxCountryInfo {
  /** i18n key */
  headline: string;
  /** i18n keys */
  rates: string[];
  /** i18n keys */
  forms: string[];
  /** i18n key */
  deadline: string;
  /** i18n key */
  lossCarryforward?: string;
  warnings: TaxCountryWarning[];
  /** i18n keys */
  notes?: string[];
}

export interface TaxCountryConfig {
  jurisdiction: TaxJurisdiction;
  flag: string;
  /** i18n key for country name */
  name: string;
  currency: string;
  locale: string;
  extraTab?: {
    value: string;
    /** i18n key */
    label: string;
  };
  kpis: TaxCountryKpi[];
  info: TaxCountryInfo;
  exports: TaxCountryExport[];
}

// ---------------------------------------------------------------------------
// Shared KPI definitions — same 4 KPIs for all countries, only estimatedTax tooltip differs
// ---------------------------------------------------------------------------

function makeKpis(estimatedTaxTooltip: string): TaxCountryKpi[] {
  return [
    {
      label: 'tax.kpi.winningTrades',
      field: 'totalWins',
      icon: 'TrendingUp',
      valueClass: 'text-profit',
      tooltip: 'tax.kpi.winningTradesTooltip',
    },
    {
      label: 'tax.kpi.losingTrades',
      field: 'totalLosses',
      icon: 'TrendingDown',
      valueClass: 'text-loss',
      tooltip: 'tax.kpi.losingTradesTooltip',
    },
    {
      label: 'tax.kpi.netGainLoss',
      field: 'totalGain',
      icon: 'Scale',
      signed: true,
      tooltip: 'tax.kpi.netGainLossTooltip',
    },
    {
      label: 'tax.kpi.estimatedTax',
      field: 'estimatedTax',
      icon: 'Calculator',
      valueClass: 'text-gradient-gold',
      cardClass: 'glass-card-gold',
      tooltip: estimatedTaxTooltip,
    },
  ];
}

// ---------------------------------------------------------------------------
// Primary + secondary jurisdictions
// ---------------------------------------------------------------------------

export const PRIMARY_JURISDICTIONS: TaxJurisdiction[] = ['FR', 'US', 'CA', 'MA'];
export const SECONDARY_JURISDICTIONS: TaxJurisdiction[] = ['UK', 'DE', 'AU', 'OTHER'];

// ---------------------------------------------------------------------------
// Configurations — all labels are i18n keys
// ---------------------------------------------------------------------------

const US_CONFIG: TaxCountryConfig = {
  jurisdiction: 'US',
  flag: '🇺🇸',
  name: 'tax.country.US',
  currency: 'USD',
  locale: 'en-US',
  extraTab: { value: 'wash-sales', label: 'tax.tabs.washSales' },
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.US'),
  info: {
    headline: 'tax.info.US.headline',
    rates: ['tax.info.US.rate1', 'tax.info.US.rate2', 'tax.info.US.rate3', 'tax.info.US.rate4', 'tax.info.US.rate5'],
    forms: ['tax.info.US.form1', 'tax.info.US.form2', 'tax.info.US.form3'],
    deadline: 'tax.info.US.deadline',
    lossCarryforward: 'tax.info.US.lossCarryforward',
    warnings: [{ text: 'tax.info.US.warning1', level: 'amber' }],
    notes: ['tax.info.US.note1', 'tax.info.US.note2'],
  },
  exports: [
    { key: 'form8949', title: 'tax.export.US.form8949', description: 'tax.export.US.form8949Desc' },
    { key: 'scheduleD', title: 'tax.export.US.scheduleD', description: 'tax.export.US.scheduleDDesc' },
    { key: 'summary', title: 'tax.export.summary', description: 'tax.export.summaryDesc' },
  ],
};

const FR_CONFIG: TaxCountryConfig = {
  jurisdiction: 'FR',
  flag: '🇫🇷',
  name: 'tax.country.FR',
  currency: 'EUR',
  locale: 'fr-FR',
  extraTab: { value: 'formulaires', label: 'tax.tabs.forms' },
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.FR'),
  info: {
    headline: 'tax.info.FR.headline',
    rates: ['tax.info.FR.rate1', 'tax.info.FR.rate2', 'tax.info.FR.rate3'],
    forms: ['tax.info.FR.form1', 'tax.info.FR.form2', 'tax.info.FR.form3', 'tax.info.FR.form4'],
    deadline: 'tax.info.FR.deadline',
    lossCarryforward: 'tax.info.FR.lossCarryforward',
    warnings: [
      { text: 'tax.info.FR.warning1', level: 'red' },
      { text: 'tax.info.FR.warning2', level: 'amber' },
    ],
    notes: ['tax.info.FR.note1', 'tax.info.FR.note2', 'tax.info.FR.note3'],
  },
  exports: [
    { key: 'summary', title: 'tax.export.FR.summary', description: 'tax.export.FR.summaryDesc' },
    { key: 'form2074', title: 'tax.export.FR.form2074', description: 'tax.export.FR.form2074Desc' },
  ],
};

const CA_CONFIG: TaxCountryConfig = {
  jurisdiction: 'CA',
  flag: '🇨🇦',
  name: 'tax.country.CA',
  currency: 'CAD',
  locale: 'en-CA',
  extraTab: { value: 'cra-classification', label: 'tax.tabs.craClassification' },
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.CA'),
  info: {
    headline: 'tax.info.CA.headline',
    rates: ['tax.info.CA.rate1', 'tax.info.CA.rate2', 'tax.info.CA.rate3', 'tax.info.CA.rate4'],
    forms: ['tax.info.CA.form1', 'tax.info.CA.form2'],
    deadline: 'tax.info.CA.deadline',
    lossCarryforward: 'tax.info.CA.lossCarryforward',
    warnings: [
      { text: 'tax.info.CA.warning1', level: 'amber' },
      { text: 'tax.info.CA.warning2', level: 'red' },
    ],
    notes: ['tax.info.CA.note1', 'tax.info.CA.note2', 'tax.info.CA.note3'],
  },
  exports: [
    { key: 'summary', title: 'tax.export.CA.schedule3', description: 'tax.export.CA.schedule3Desc' },
    { key: 'scheduleD', title: 'tax.export.CA.t2125', description: 'tax.export.CA.t2125Desc' },
    { key: 'form8949', title: 'tax.export.CA.acb', description: 'tax.export.CA.acbDesc' },
  ],
};

const MA_CONFIG: TaxCountryConfig = {
  jurisdiction: 'MA',
  flag: '🇲🇦',
  name: 'tax.country.MA',
  currency: 'MAD',
  locale: 'fr-MA',
  extraTab: { value: 'reglementation', label: 'tax.tabs.regulations' },
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.MA'),
  info: {
    headline: 'tax.info.MA.headline',
    rates: ['tax.info.MA.rate1', 'tax.info.MA.rate2', 'tax.info.MA.rate3', 'tax.info.MA.rate4'],
    forms: ['tax.info.MA.form1', 'tax.info.MA.form2'],
    deadline: 'tax.info.MA.deadline',
    lossCarryforward: 'tax.info.MA.lossCarryforward',
    warnings: [
      { text: 'tax.info.MA.warning1', level: 'red' },
      { text: 'tax.info.MA.warning2', level: 'amber' },
    ],
    notes: ['tax.info.MA.note1', 'tax.info.MA.note2', 'tax.info.MA.note3', 'tax.info.MA.note4'],
  },
  exports: [
    { key: 'summary', title: 'tax.export.MA.summary', description: 'tax.export.MA.summaryDesc' },
    { key: 'form8949', title: 'tax.export.MA.perTx', description: 'tax.export.MA.perTxDesc' },
  ],
};

const UK_CONFIG: TaxCountryConfig = {
  jurisdiction: 'UK',
  flag: '🇬🇧',
  name: 'tax.country.UK',
  currency: 'GBP',
  locale: 'en-GB',
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.UK'),
  info: {
    headline: 'tax.info.UK.headline',
    rates: ['tax.info.UK.rate1', 'tax.info.UK.rate2', 'tax.info.UK.rate3', 'tax.info.UK.rate4'],
    forms: ['tax.info.UK.form1', 'tax.info.UK.form2'],
    deadline: 'tax.info.UK.deadline',
    lossCarryforward: 'tax.info.UK.lossCarryforward',
    warnings: [{ text: 'tax.info.UK.warning1', level: 'amber' }],
    notes: ['tax.info.UK.note1'],
  },
  exports: [
    { key: 'summary', title: 'tax.export.UK.sa108', description: 'tax.export.UK.sa108Desc' },
    { key: 'form8949', title: 'tax.export.UK.disposal', description: 'tax.export.UK.disposalDesc' },
  ],
};

const DE_CONFIG: TaxCountryConfig = {
  jurisdiction: 'DE',
  flag: '🇩🇪',
  name: 'tax.country.DE',
  currency: 'EUR',
  locale: 'de-DE',
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.DE'),
  info: {
    headline: 'tax.info.DE.headline',
    rates: ['tax.info.DE.rate1', 'tax.info.DE.rate2', 'tax.info.DE.rate3'],
    forms: ['tax.info.DE.form1', 'tax.info.DE.form2'],
    deadline: 'tax.info.DE.deadline',
    lossCarryforward: 'tax.info.DE.lossCarryforward',
    warnings: [{ text: 'tax.info.DE.warning1', level: 'red' }],
    notes: ['tax.info.DE.note1'],
  },
  exports: [
    { key: 'summary', title: 'tax.export.DE.anlageKap', description: 'tax.export.DE.anlageKapDesc' },
    { key: 'form8949', title: 'tax.export.DE.txHistory', description: 'tax.export.DE.txHistoryDesc' },
  ],
};

const AU_CONFIG: TaxCountryConfig = {
  jurisdiction: 'AU',
  flag: '🇦🇺',
  name: 'tax.country.AU',
  currency: 'AUD',
  locale: 'en-AU',
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.AU'),
  info: {
    headline: 'tax.info.AU.headline',
    rates: ['tax.info.AU.rate1', 'tax.info.AU.rate2', 'tax.info.AU.rate3'],
    forms: ['tax.info.AU.form1', 'tax.info.AU.form2'],
    deadline: 'tax.info.AU.deadline',
    lossCarryforward: 'tax.info.AU.lossCarryforward',
    warnings: [{ text: 'tax.info.AU.warning1', level: 'amber' }],
    notes: ['tax.info.AU.note1'],
  },
  exports: [
    { key: 'summary', title: 'tax.export.AU.cgtSchedule', description: 'tax.export.AU.cgtScheduleDesc' },
    { key: 'form8949', title: 'tax.export.AU.txLog', description: 'tax.export.AU.txLogDesc' },
  ],
};

const OTHER_CONFIG: TaxCountryConfig = {
  jurisdiction: 'OTHER',
  flag: '🌐',
  name: 'tax.country.OTHER',
  currency: 'USD',
  locale: 'en-US',
  kpis: makeKpis('tax.kpi.estimatedTaxTooltip.OTHER'),
  info: {
    headline: 'tax.info.OTHER.headline',
    rates: ['tax.info.OTHER.rate1'],
    forms: ['tax.info.OTHER.form1'],
    deadline: 'tax.info.OTHER.deadline',
    warnings: [],
    notes: ['tax.info.OTHER.note1'],
  },
  exports: [
    { key: 'summary', title: 'tax.export.summary', description: 'tax.export.summaryDesc' },
  ],
};

// ---------------------------------------------------------------------------
// Lookup map
// ---------------------------------------------------------------------------

export const TAX_COUNTRY_CONFIGS: Record<TaxJurisdiction, TaxCountryConfig> = {
  US: US_CONFIG,
  FR: FR_CONFIG,
  CA: CA_CONFIG,
  MA: MA_CONFIG,
  UK: UK_CONFIG,
  DE: DE_CONFIG,
  AU: AU_CONFIG,
  OTHER: OTHER_CONFIG,
};

export function getCountryConfig(jurisdiction: TaxJurisdiction): TaxCountryConfig {
  return TAX_COUNTRY_CONFIGS[jurisdiction] ?? OTHER_CONFIG;
}
