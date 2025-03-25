
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";

declare global {
  interface Window {
    TradingView?: {
      widget: any;
    };
  }
}

const TradingViewChart = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = initializeWidget;
    document.head.appendChild(script);
    
    return () => {
      if (widgetRef.current) {
        try {
          // Attempt to clean up the widget
          containerRef.current?.firstChild && containerRef.current.removeChild(containerRef.current.firstChild);
          widgetRef.current = null;
        } catch (error) {
          console.error('Error cleaning up TradingView widget:', error);
        }
      }
    };
  }, []);
  
  const initializeWidget = () => {
    if (!window.TradingView || !containerRef.current) return;
    
    widgetRef.current = new window.TradingView.widget({
      container_id: containerRef.current.id,
      width: '100%',
      height: '100%',
      symbol: 'NASDAQ:AAPL',
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      save_image: false,
      studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
      drawings: {
        enabled: true,
        visibility: true,
        tools: {
          drawingTools: true,
          measure: true,
          position: true,
          shapes: true,
          text: true
        }
      },
    });
  };
  
  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <div 
          id="tradingview-widget-container" 
          ref={containerRef} 
          className="w-full h-full min-h-[500px]"
        />
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
