
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import RiskMetrics from '@/components/insights/RiskMetrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Share2 } from 'lucide-react';

const RiskAnalysis = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t('pages.riskAnalysis') + " | Followup Trading";
  }, [t]);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold animate-fade-in">{t('pages.riskAnalysis')}</h1>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    {t('common.generateReport')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    {t('common.export')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    {t('common.share')}
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('insights.riskAnalysisOverview')}</CardTitle>
                  <CardDescription>
                    {t('insights.riskAnalysisDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    {t('insights.riskAnalysisHelp')}
                  </p>
                </CardContent>
              </Card>
              
              <RiskMetrics />
              
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RiskAnalysis;
