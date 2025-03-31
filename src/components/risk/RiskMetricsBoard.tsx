
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  LineChart,
  ShieldAlert,
  Info 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Bar,
  BarChart as RechartsBarChart
} from 'recharts';

import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

// Types for risk metrics data
interface VaRData {
  confidence: string;
  value: number;
  benchmark: number;
}

interface AssetAllocation {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
  benchmark?: number;
}

interface StressTestScenario {
  name: string;
  impact: number;
  probability: string;
  description: string;
}

interface KellyMetric {
  strategy: string;
  kelly: number;
  recommended: number;
  aggressive: number;
}

interface CorrelationData {
  asset1: string;
  asset2: string;
  correlation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface DownsideRiskMetric {
  metric: string;
  value: number;
  benchmark: number;
  description: string;
}

const RiskMetricsBoard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sample data for risk metrics dashboard
  const valueAtRiskData: VaRData[] = [
    { confidence: "95%", value: -2.8, benchmark: -3.5 },
    { confidence: "99%", value: -4.2, benchmark: -5.1 },
    { confidence: "99.9%", value: -6.7, benchmark: -7.8 }
  ];
  
  const assetAllocationData: AssetAllocation[] = [
    { name: 'Actions', value: 45, color: '#4f46e5' },
    { name: 'Obligations', value: 20, color: '#06b6d4' },
    { name: 'Devises', value: 15, color: '#10b981' },
    { name: 'Matières premières', value: 10, color: '#f59e0b' },
    { name: 'Crypto', value: 10, color: '#ef4444' }
  ];
  
  const historicalVaRData: TimeSeriesData[] = [
    { date: 'Jan', value: 2.5, benchmark: 3.1 },
    { date: 'Fév', value: 2.3, benchmark: 3.0 },
    { date: 'Mar', value: 2.9, benchmark: 3.2 },
    { date: 'Avr', value: 3.2, benchmark: 3.1 },
    { date: 'Mai', value: 2.7, benchmark: 3.0 },
    { date: 'Juin', value: 3.0, benchmark: 3.1 },
    { date: 'Juil', value: 3.5, benchmark: 3.2 },
    { date: 'Août', value: 3.3, benchmark: 3.1 },
    { date: 'Sept', value: 2.8, benchmark: 3.0 },
    { date: 'Oct', value: 3.1, benchmark: 3.2 },
    { date: 'Nov', value: 3.4, benchmark: 3.3 },
    { date: 'Déc', value: 3.6, benchmark: 3.2 }
  ];
  
  const stressTestScenarios: StressTestScenario[] = [
    {
      name: 'Crise économique majeure',
      impact: -32.5,
      probability: 'Faible',
      description: 'Scénario d\'une crise économique mondiale similaire à 2008'
    },
    {
      name: 'Hausse des taux d\'intérêt',
      impact: -15.3,
      probability: 'Moyenne',
      description: 'Hausse rapide et inattendue des taux par les banques centrales'
    },
    {
      name: 'Crise géopolitique',
      impact: -18.7,
      probability: 'Moyenne',
      description: 'Conflit majeur ou tension géopolitique sévère'
    },
    {
      name: 'Krach boursier',
      impact: -28.4,
      probability: 'Faible',
      description: 'Correction soudaine et sévère sur les marchés boursiers'
    },
    {
      name: 'Crise monétaire',
      impact: -12.6,
      probability: 'Moyenne-Faible',
      description: 'Dévaluation importante d\'une devise majeure'
    }
  ];
  
  const kellyMetricsData: KellyMetric[] = [
    { strategy: "Tendance", kelly: 23.4, recommended: 11.7, aggressive: 16.4 },
    { strategy: "Contre-tendance", kelly: 15.2, recommended: 7.6, aggressive: 10.6 },
    { strategy: "Momentum", kelly: 19.8, recommended: 9.9, aggressive: 13.9 },
    { strategy: "Breakout", kelly: 17.5, recommended: 8.8, aggressive: 12.3 }
  ];
  
  const correlationData: CorrelationData[] = [
    { asset1: 'S&P 500', asset2: 'NASDAQ', correlation: 0.89, trend: 'stable' },
    { asset1: 'S&P 500', asset2: 'Or', correlation: -0.21, trend: 'decreasing' },
    { asset1: 'EUR/USD', asset2: 'Or', correlation: 0.35, trend: 'increasing' },
    { asset1: 'Bitcoin', asset2: 'NASDAQ', correlation: 0.62, trend: 'increasing' },
    { asset1: 'Pétrole', asset2: 'S&P 500', correlation: 0.28, trend: 'stable' }
  ];
  
  const downsideRiskMetrics: DownsideRiskMetric[] = [
    { 
      metric: 'Drawdown Maximum', 
      value: 15.3, 
      benchmark: 18.7, 
      description: 'La baisse maximale entre un sommet et un creux subséquent' 
    },
    { 
      metric: 'Ratio de Sortino', 
      value: 1.82, 
      benchmark: 1.54, 
      description: 'Mesure le rendement ajusté au risque de baisse' 
    },
    { 
      metric: 'Ratio de Calmar', 
      value: 1.24, 
      benchmark: 0.98, 
      description: 'Rendement annualisé divisé par le drawdown maximum' 
    },
    { 
      metric: 'Semi-variance', 
      value: 8.6, 
      benchmark: 10.2, 
      description: 'Variance des rendements négatifs uniquement' 
    },
    { 
      metric: 'Conditional VaR (95%)', 
      value: -4.9, 
      benchmark: -5.7, 
      description: 'Perte moyenne attendue au-delà du VaR' 
    }
  ];
  
  const radarChartData = [
    { subject: 'VaR', valeur: 70, benchmark: 65, fullMark: 100 },
    { subject: 'Ratio de Sharpe', valeur: 85, benchmark: 75, fullMark: 100 },
    { subject: 'Drawdown', valeur: 65, benchmark: 60, fullMark: 100 },
    { subject: 'Volatilité', valeur: 55, benchmark: 50, fullMark: 100 },
    { subject: 'Ratio de Sortino', valeur: 80, benchmark: 70, fullMark: 100 },
    { subject: 'Beta', valeur: 60, benchmark: 55, fullMark: 100 },
  ];
  
  const getCardColorClass = (impact: number): string => {
    if (impact <= -25) return "border-red-500 dark:border-red-700";
    if (impact <= -15) return "border-orange-400 dark:border-orange-600";
    return "border-yellow-300 dark:border-yellow-500";
  };
  
  const getCorrelationColor = (correlation: number): string => {
    const absCorrelation = Math.abs(correlation);
    if (absCorrelation > 0.7) return 'text-red-500 dark:text-red-400';
    if (absCorrelation > 0.4) return 'text-orange-500 dark:text-orange-400';
    return 'text-green-500 dark:text-green-400';
  };
  
  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <LineChart className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('risk.metricsTitle', 'Tableau de Bord des Métriques de Risque')}</CardTitle>
              <CardDescription>{t('risk.metricsDescription', 'Analyse approfondie des risques du portefeuille')}</CardDescription>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8">
              <TabsTrigger value="overview">{t('risk.overview', 'Aperçu')}</TabsTrigger>
              <TabsTrigger value="var">{t('risk.valueAtRisk', 'VaR')}</TabsTrigger>
              <TabsTrigger value="stress">{t('risk.stressTests', 'Tests de Stress')}</TabsTrigger>
              <TabsTrigger value="correlation">{t('risk.correlation', 'Corrélations')}</TabsTrigger>
              <TabsTrigger value="allocation">{t('risk.allocation', 'Allocation')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('risk.riskProfile', 'Profil de Risque')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius="75%" data={radarChartData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis />
                          <Radar name={t('risk.portfolio', 'Portefeuille')} dataKey="valeur" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                          <Radar name={t('risk.benchmark', 'Référence')} dataKey="benchmark" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('risk.downsideMetrics', 'Métriques de Risque Baissier')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {downsideRiskMetrics.map((metric, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{metric.metric}</span>
                              <div className="group relative">
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                <span className="absolute left-0 -top-8 w-48 p-2 bg-popover text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  {metric.description}
                                </span>
                              </div>
                            </div>
                            <div className={`flex items-center space-x-2 ${metric.value < metric.benchmark ? 'text-green-500' : 'text-red-500'}`}>
                              <span className="font-bold">{metric.value}</span>
                              <span className="text-xs text-muted-foreground">
                                vs {metric.benchmark} {t('risk.benchmark', 'référence')}
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(Math.abs(metric.value / metric.benchmark) * 100, 100)} 
                            className={`h-1 ${metric.value < metric.benchmark ? 'bg-green-500' : ''}`} 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('risk.kellyMetrics', 'Critère de Kelly')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {kellyMetricsData.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{item.strategy}</span>
                            <span>
                              {item.kelly.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative pt-1">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                              <div style={{ width: `${item.recommended}%` }} className="bg-green-500 h-full"></div>
                              <div style={{ width: `${item.aggressive - item.recommended}%` }} className="bg-yellow-500 h-full"></div>
                              <div style={{ width: `${item.kelly - item.aggressive}%` }} className="bg-red-500 h-full"></div>
                            </div>
                            <div className="flex text-xs justify-between mt-1">
                              <span className="text-green-500">{t('risk.recommended', 'Recommandé')} ({item.recommended.toFixed(1)}%)</span>
                              <span className="text-yellow-500">{t('risk.aggressive', 'Agressif')} ({item.aggressive.toFixed(1)}%)</span>
                              <span className="text-red-500">{t('risk.optimal', 'Optimal')} ({item.kelly.toFixed(1)}%)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="var">
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {valueAtRiskData.map((item, index) => (
                    <Card key={index} className="bg-accent/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{t('risk.valueAtRisk', 'Value at Risk')} ({item.confidence})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold">{item.value}%</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {t('risk.benchmark', 'Référence')}: {item.benchmark}%
                            </div>
                          </div>
                          <div className={`text-sm ${item.value > item.benchmark ? 'text-red-500' : 'text-green-500'}`}>
                            {Math.abs(((item.value - item.benchmark) / item.benchmark * 100)).toFixed(1)}% {item.value > item.benchmark ? t('risk.worse', 'pire') : t('risk.better', 'mieux')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('risk.varEvolution', 'Évolution du VaR au fil du temps')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historicalVaRData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            name={t('risk.portfolioVar', 'VaR Portefeuille')} 
                            stroke="#4f46e5" 
                            fill="#4f46e5" 
                            fillOpacity={0.3} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="benchmark" 
                            name={t('risk.benchmarkVar', 'VaR Référence')} 
                            stroke="#10b981" 
                            fill="#10b981" 
                            fillOpacity={0.2} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      {t('risk.varExplanation', 'Le Value at Risk (VaR) représente la perte maximale potentielle avec un niveau de confiance donné sur une période définie. Un VaR inférieur à la référence indique une meilleure gestion du risque.')}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stress">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('risk.stressTestScenarios', 'Scénarios de Tests de Stress')}</CardTitle>
                  <CardDescription>
                    {t('risk.stressTestExplanation', 'Impact potentiel de différents scénarios de crise sur votre portefeuille')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      {stressTestScenarios.map((scenario, index) => (
                        <Card key={index} className={`mb-4 border-l-4 ${getCardColorClass(scenario.impact)}`}>
                          <CardHeader className="py-3 px-4">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{scenario.name}</CardTitle>
                              <div className="text-red-500 font-bold">{scenario.impact}%</div>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 px-4">
                            <div className="flex justify-between text-sm">
                              <div>{scenario.description}</div>
                              <div className="text-muted-foreground">{t('risk.probability', 'Probabilité')}: {scenario.probability}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={stressTestScenarios}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={['dataMin', 0]} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="impact" 
                            fill="#ef4444" 
                            name={t('risk.portfolioImpact', 'Impact sur le portefeuille (%)')} 
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="correlation">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('risk.assetCorrelation', 'Corrélation entre Classes d\'Actifs')}</CardTitle>
                  <CardDescription>
                    {t('risk.correlationExplanation', 'Analyse des corrélations entre les différentes classes d\'actifs du portefeuille')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('risk.asset1', 'Actif 1')}</TableHead>
                        <TableHead>{t('risk.asset2', 'Actif 2')}</TableHead>
                        <TableHead>{t('risk.correlation', 'Corrélation')}</TableHead>
                        <TableHead>{t('risk.trend', 'Tendance')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {correlationData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.asset1}</TableCell>
                          <TableCell>{item.asset2}</TableCell>
                          <TableCell className={getCorrelationColor(item.correlation)}>
                            {item.correlation.toFixed(2)}
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            {getTrendIcon(item.trend)}
                            <span>
                              {item.trend === 'increasing' && t('risk.increasing', 'En hausse')}
                              {item.trend === 'decreasing' && t('risk.decreasing', 'En baisse')}
                              {item.trend === 'stable' && t('risk.stable', 'Stable')}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>{t('risk.highCorrelation', 'Corrélation Forte (> 0.7): Risque de mouvements synchronisés')}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>{t('risk.mediumCorrelation', 'Corrélation Moyenne (0.4 - 0.7): Diversification limitée')}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>{t('risk.lowCorrelation', 'Corrélation Faible (< 0.4): Bonne diversification')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allocation">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('risk.assetAllocation', 'Allocation d\'Actifs')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={assetAllocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {assetAllocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('risk.diversificationMetrics', 'Métriques de Diversification')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {assetAllocationData.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span 
                              className="flex items-center gap-2"
                              style={{ color: item.color }}
                            >
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              {item.name}
                            </span>
                            <span>{item.value}%</span>
                          </div>
                          <div className="relative pt-1">
                            <Progress 
                              value={item.value} 
                              className="h-2" 
                              style={{ 
                                '--progress-background': item.color 
                              } as React.CSSProperties} 
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {index === 0 && t('risk.overexposed', 'Surexposition potentielle')}
                            {index === 1 && t('risk.wellBalanced', 'Exposition équilibrée')}
                            {index === 2 && t('risk.goodDiversification', 'Bonne diversification')}
                            {index === 3 && t('risk.limitedAllocation', 'Allocation limitée')}
                            {index === 4 && t('risk.riskAllocation', 'Allocation à risque spécifique')}
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t border-border mt-4">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{t('risk.diversificationScore', 'Score de Diversification')}:</span>
                          <span className="font-bold text-amber-500">72/100</span>
                        </div>
                        <Progress value={72} className="h-2 bg-amber-200 dark:bg-amber-900" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {t('risk.diversificationRecommendation', 'Recommandation : Augmenter l\'exposition aux classes d\'actifs non-corrélées')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskMetricsBoard;

