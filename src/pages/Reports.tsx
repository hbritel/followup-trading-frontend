
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Share2, ArrowUpRight, PlusCircle } from 'lucide-react';

const reportsData = [
  {
    id: 1,
    title: 'Monthly Performance Summary',
    description: 'Detailed analysis of June 2023 trading performance',
    date: 'July 1, 2023',
    category: 'monthly',
    status: 'ready',
  },
  {
    id: 2,
    title: 'Quarterly Trading Review',
    description: 'Q2 2023 comprehensive trading performance review',
    date: 'July 3, 2023',
    category: 'quarterly',
    status: 'ready',
  },
  {
    id: 3,
    title: 'Strategy Backtest Results',
    description: 'MACD crossover strategy 5-year backtest performance',
    date: 'June 28, 2023',
    category: 'strategy',
    status: 'ready',
  },
  {
    id: 4,
    title: 'Portfolio Allocation Report',
    description: 'Current portfolio allocation with risk metrics',
    date: 'June 25, 2023',
    category: 'portfolio',
    status: 'ready',
  },
  {
    id: 5,
    title: 'Tax Loss Harvesting Opportunities',
    description: 'Potential tax loss harvesting trades for current year',
    date: 'June 22, 2023',
    category: 'tax',
    status: 'ready',
  },
  {
    id: 6,
    title: 'Weekly Trading Performance',
    description: 'Summary of trades and performance for last week',
    date: 'June 19, 2023',
    category: 'weekly',
    status: 'ready',
  },
  {
    id: 7,
    title: 'July Monthly Report',
    description: 'Monthly trading performance summary',
    date: 'August 2, 2023',
    category: 'monthly',
    status: 'processing',
  },
  {
    id: 8,
    title: 'Risk Analysis',
    description: 'Exposure and risk metrics for current positions',
    date: 'June 15, 2023',
    category: 'risk',
    status: 'ready',
  },
];

const Reports = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const filteredReports = selectedCategory === 'all' 
    ? reportsData 
    : reportsData.filter(report => report.category === selectedCategory);
  
  return (
    <DashboardLayout pageTitle="Reports">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trading Reports</h1>
            <p className="text-muted-foreground">Generate and access detailed trading reports</p>
          </div>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Access your recently generated trading reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>All</TabsTrigger>
                <TabsTrigger value="monthly" onClick={() => setSelectedCategory('monthly')}>Monthly</TabsTrigger>
                <TabsTrigger value="quarterly" onClick={() => setSelectedCategory('quarterly')}>Quarterly</TabsTrigger>
                <TabsTrigger value="strategy" onClick={() => setSelectedCategory('strategy')}>Strategy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-border">
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">{report.title}</h3>
                          <Badge variant={report.status === 'ready' ? 'outline' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-2 p-4 border-t sm:border-t-0 sm:border-l border-border bg-muted/30">
                        <div className="text-xs text-muted-foreground mr-2">
                          {report.date}
                        </div>
                        {report.status === 'ready' && (
                          <>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">Share</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="monthly" className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-border">
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">{report.title}</h3>
                          <Badge variant={report.status === 'ready' ? 'outline' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-2 p-4 border-t sm:border-t-0 sm:border-l border-border bg-muted/30">
                        <div className="text-xs text-muted-foreground mr-2">
                          {report.date}
                        </div>
                        {report.status === 'ready' && (
                          <>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">Share</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="quarterly" className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-border">
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">{report.title}</h3>
                          <Badge variant={report.status === 'ready' ? 'outline' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-2 p-4 border-t sm:border-t-0 sm:border-l border-border bg-muted/30">
                        <div className="text-xs text-muted-foreground mr-2">
                          {report.date}
                        </div>
                        {report.status === 'ready' && (
                          <>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">Share</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="strategy" className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-border">
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">{report.title}</h3>
                          <Badge variant={report.status === 'ready' ? 'outline' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-2 p-4 border-t sm:border-t-0 sm:border-l border-border bg-muted/30">
                        <div className="text-xs text-muted-foreground mr-2">
                          {report.date}
                        </div>
                        {report.status === 'ready' && (
                          <>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">Share</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Predefined report templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Daily Summary</span>
                    <span className="text-xs text-muted-foreground">Daily trading performance summary</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Weekly Review</span>
                    <span className="text-xs text-muted-foreground">Weekly trading performance analysis</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Monthly Performance</span>
                    <span className="text-xs text-muted-foreground">Comprehensive monthly report</span>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Strategy Analysis</span>
                    <span className="text-xs text-muted-foreground">Detailed strategy performance metrics</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Auto-generated reports based on schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Weekly Performance Summary</h3>
                      <p className="text-sm text-muted-foreground">Every Monday at 8:00 AM</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Monthly Trading Report</h3>
                      <p className="text-sm text-muted-foreground">1st day of each month at 9:00 AM</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Quarterly Performance Review</h3>
                      <p className="text-sm text-muted-foreground">Every 3 months on the 1st at 10:00 AM</p>
                    </div>
                    <Badge variant="outline">Paused</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
