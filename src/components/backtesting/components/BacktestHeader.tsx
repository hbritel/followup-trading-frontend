
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BacktestHeaderProps {
  title: string;
  subtitle: string;
}

const BacktestHeader = ({ title, subtitle }: BacktestHeaderProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const handleSaveBacktest = () => {
    toast({
      title: "Backtest Saved",
      description: "Your backtest has been saved successfully.",
    });
  };
  
  const handleExportResults = () => {
    toast({
      title: "Results Exported",
      description: "Your backtest results have been exported successfully.",
    });
  };
  
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleSaveBacktest}>
          <Save className="h-4 w-4 mr-2" />
          {t('backtesting.saveBacktest')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportResults}>
          <Download className="h-4 w-4 mr-2" />
          {t('backtesting.exportResults')}
        </Button>
      </div>
    </div>
  );
};

export default BacktestHeader;
