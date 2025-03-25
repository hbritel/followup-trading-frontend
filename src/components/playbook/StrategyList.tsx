
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StrategyList = () => {
  const { t } = useTranslation();
  
  // Mock data for strategies
  const strategies = [
    { 
      id: 1, 
      name: "Breakout Strategy", 
      type: "breakout", 
      timeframe: "intraday",
      winRate: 56,
      riskReward: 1.8
    },
    { 
      id: 2, 
      name: "Moving Average Crossover", 
      type: "trend-following", 
      timeframe: "swing",
      winRate: 48,
      riskReward: 2.5
    },
    { 
      id: 3, 
      name: "RSI Divergence", 
      type: "mean-reversion", 
      timeframe: "intraday",
      winRate: 52,
      riskReward: 2.2
    },
    { 
      id: 4, 
      name: "Gap and Go", 
      type: "momentum", 
      timeframe: "scalping",
      winRate: 62,
      riskReward: 1.5
    },
  ];
  
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'breakout':
        return <Badge className="bg-blue-500">{t(`playbook.${type}`)}</Badge>;
      case 'trend-following':
        return <Badge className="bg-green-500">{t(`playbook.trendFollowing`)}</Badge>;
      case 'mean-reversion':
        return <Badge className="bg-purple-500">{t(`playbook.meanReversion`)}</Badge>;
      case 'momentum':
        return <Badge className="bg-orange-500">{t(`playbook.momentum`)}</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playbook.strategies')}</CardTitle>
        <CardDescription>{t('playbook.strategiesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('playbook.strategyName')}</TableHead>
              <TableHead>{t('playbook.strategyType')}</TableHead>
              <TableHead>{t('playbook.timeframe')}</TableHead>
              <TableHead>{t('playbook.winRate')}</TableHead>
              <TableHead>{t('playbook.riskRewardRatio')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategies.map((strategy) => (
              <TableRow key={strategy.id}>
                <TableCell className="font-medium">{strategy.name}</TableCell>
                <TableCell>{getTypeBadge(strategy.type)}</TableCell>
                <TableCell>{t(`playbook.${strategy.timeframe}`)}</TableCell>
                <TableCell>{strategy.winRate}%</TableCell>
                <TableCell>{strategy.riskReward}:1</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StrategyList;
