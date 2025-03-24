
import React, { useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Responsive, WidthProvider } from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Navbar from '@/components/dashboard/Navbar';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import TradingStats from '@/components/dashboard/TradingStats';
import TradeTable from '@/components/dashboard/TradeTable';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AccountSummary from '@/components/dashboard/AccountSummary';
import TradingCalendar from '@/components/dashboard/Calendar';
import WidgetControls from '@/components/dashboard/WidgetControls';
import WidgetWrapper from '@/components/dashboard/WidgetWrapper';
import { useDashboardWidgets, WidgetType } from '@/hooks/use-dashboard-widgets';
import { useIsMobile, useIsDesktop } from '@/hooks/use-mobile';

// Create the responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const { 
    widgets, 
    isEditMode, 
    updateLayout 
  } = useDashboardWidgets();
  
  useEffect(() => {
    document.title = "Dashboard | DashNest Trader";
  }, []);
  
  const renderWidget = (widget: { id: string; type: WidgetType; title: string }) => {
    switch (widget.type) {
      case "stats":
        return <TradingStats />;
      case "performance":
        return <PerformanceChart />;
      case "account":
        return <AccountSummary />;
      case "trades":
        return <TradeTable />;
      case "calendar":
        return <TradingCalendar />;
      default:
        return <div>Widget not found</div>;
    }
  };

  const handleLayoutChange = (layout: any) => {
    updateLayout(layout);
  };

  // For mobile, we'll use a simplified layout with full-width widgets
  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-accent/10">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 px-3 py-3 overflow-auto">
              <div className="max-w-screen-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold animate-fade-in">Dashboard</h1>
                  <WidgetControls />
                </div>
                
                <div className="space-y-4">
                  {widgets
                    .sort((a, b) => a.y - b.y)
                    .map((widget) => (
                      <WidgetWrapper 
                        key={widget.id} 
                        id={widget.id} 
                        title={widget.title}
                      >
                        {renderWidget(widget)}
                      </WidgetWrapper>
                    ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-accent/10">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-3 py-3 md:px-6 md:py-6 overflow-auto">
            <div className="max-w-screen-2xl mx-auto space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold animate-fade-in">Dashboard</h1>
                <WidgetControls />
              </div>
              
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: widgets, md: widgets, sm: widgets }}
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 12, sm: 6 }}
                rowHeight={150}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".card-header"
                margin={[16, 16]}
                containerPadding={[0, 0]}
              >
                {widgets.map((widget) => (
                  <div key={widget.id} data-grid={widget}>
                    <WidgetWrapper 
                      id={widget.id} 
                      title={widget.title}
                    >
                      {renderWidget(widget)}
                    </WidgetWrapper>
                  </div>
                ))}
              </ResponsiveGridLayout>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
