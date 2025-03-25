
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StrategyForm = () => {
  const { t } = useTranslation();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Strategy submitted');
    // TODO: Implement form submission
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playbook.newStrategy')}</CardTitle>
        <CardDescription>{t('playbook.newStrategyDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('playbook.strategyName')}</Label>
            <Input id="name" placeholder={t('playbook.strategyNamePlaceholder')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">{t('playbook.strategyType')}</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={t('playbook.selectStrategyType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trend-following">{t('playbook.trendFollowing')}</SelectItem>
                <SelectItem value="mean-reversion">{t('playbook.meanReversion')}</SelectItem>
                <SelectItem value="breakout">{t('playbook.breakout')}</SelectItem>
                <SelectItem value="momentum">{t('playbook.momentum')}</SelectItem>
                <SelectItem value="volatility">{t('playbook.volatility')}</SelectItem>
                <SelectItem value="other">{t('playbook.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeframe">{t('playbook.timeframe')}</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={t('playbook.selectTimeframe')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scalping">{t('playbook.scalping')}</SelectItem>
                <SelectItem value="intraday">{t('playbook.intraday')}</SelectItem>
                <SelectItem value="swing">{t('playbook.swing')}</SelectItem>
                <SelectItem value="position">{t('playbook.position')}</SelectItem>
                <SelectItem value="long-term">{t('playbook.longTerm')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('playbook.description')}</Label>
            <Textarea 
              id="description" 
              placeholder={t('playbook.descriptionPlaceholder')} 
              className="min-h-32"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entry-criteria">{t('playbook.entryCriteria')}</Label>
            <Textarea 
              id="entry-criteria" 
              placeholder={t('playbook.entryCriteriaPlaceholder')} 
              className="min-h-20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exit-criteria">{t('playbook.exitCriteria')}</Label>
            <Textarea 
              id="exit-criteria" 
              placeholder={t('playbook.exitCriteriaPlaceholder')} 
              className="min-h-20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="risk-management">{t('playbook.riskManagement')}</Label>
            <Textarea 
              id="risk-management" 
              placeholder={t('playbook.riskManagementPlaceholder')} 
              className="min-h-20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="win-rate">{t('playbook.expectedWinRate')}</Label>
              <Input id="win-rate" type="number" placeholder="50" min="0" max="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-reward">{t('playbook.riskRewardRatio')}</Label>
              <Input id="risk-reward" type="number" placeholder="2" min="0" step="0.1" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline">{t('common.cancel')}</Button>
          <Button type="submit">{t('common.save')}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default StrategyForm;
