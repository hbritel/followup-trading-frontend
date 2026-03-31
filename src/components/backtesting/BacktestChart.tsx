import React, { useEffect, useRef, memo } from 'react';
import {
  createChart, ColorType, CandlestickSeries, HistogramSeries, createSeriesMarkers,
} from 'lightweight-charts';
import type {
  IChartApi, ISeriesApi, SeriesMarker, Time, IPriceLine,
} from 'lightweight-charts';

export interface ChartTradeLine {
  id: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  entryTime: number;
  status: 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
}

export interface StaticPriceLine {
  price: number;
  color: string;
  title: string;
  lineStyle?: number; // 0=solid, 1=dotted, 2=dashed
}

export interface StaticMarker {
  time: number; // epoch seconds
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  text: string;
}

interface BacktestChartProps {
  data: Array<{
    timestamp: number; open: number; high: number; low: number; close: number; volume: number;
  }>;
  trades?: ChartTradeLine[];
  staticLines?: StaticPriceLine[];
  staticMarkers?: StaticMarker[];
  height?: number;
  preserveScale?: boolean;
  onDragSL?: (tradeId: string, newPrice: number) => void;
  onDragTP?: (tradeId: string, newPrice: number) => void;
}

interface DragState {
  tradeId: string;
  lineType: 'SL' | 'TP';
  priceLine: IPriceLine;
  trade: ChartTradeLine; // needed to recalculate P&L during drag
}

/** Calculate $ P&L for a given price difference and lot size */
function calcPnl(entryPrice: number, targetPrice: number, direction: 'LONG' | 'SHORT', lotSize: number): number {
  const contractSize = entryPrice > 100 ? 100 : 100000;
  const diff = direction === 'LONG' ? targetPrice - entryPrice : entryPrice - targetPrice;
  return diff * lotSize * contractSize;
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}$${pnl.toFixed(0)}`;
}

function getThemeColors(dark: boolean) {
  return {
    text: dark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    grid: dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)',
    crosshair: dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    labelBg: dark ? '#374151' : '#e5e7eb',
    border: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  };
}

const BacktestChart: React.FC<BacktestChartProps> = memo(({
  data, trades = [], staticLines = [], staticMarkers = [], height = 500, preserveScale = true, onDragSL, onDragTP,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<Map<string, { entry: IPriceLine; sl: IPriceLine; tp: IPriceLine }>>(new Map());
  const markersPluginRef = useRef<ReturnType<typeof createSeriesMarkers> | null>(null);
  const hasInitialFit = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const dragStartYRef = useRef<number | null>(null); // track initial click Y for drag threshold
  const isDraggingRef = useRef(false); // true only after threshold exceeded
  const tradesRef = useRef(trades);
  tradesRef.current = trades;

  // Create chart ONCE
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const isDark = document.documentElement.classList.contains('dark');
    const theme = getThemeColors(isDark);

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: theme.text, fontSize: 12 },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
      crosshair: {
        mode: 0,
        vertLine: { color: theme.crosshair, labelBackgroundColor: theme.labelBg },
        horzLine: { color: theme.crosshair, labelBackgroundColor: theme.labelBg },
      },
      rightPriceScale: { borderColor: theme.border, scaleMargins: { top: 0.1, bottom: 0.2 }, autoScale: true },
      timeScale: { borderColor: theme.border, timeVisible: true, secondsVisible: false, rightOffset: 5 },
      handleScroll: true, handleScale: true,
      width: chartContainerRef.current.clientWidth, height,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });

    // Volume hidden by default
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(99, 102, 241, 0.3)', priceFormat: { type: 'volume' }, priceScaleId: 'vol',
      visible: false,
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const markersPlugin = createSeriesMarkers(candleSeries, []);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    markersPluginRef.current = markersPlugin;
    hasInitialFit.current = false;

    // Drag SL/TP with threshold to avoid conflict with chart zoom/pan
    const DRAG_THRESHOLD_PX = 5;
    const container = chartContainerRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      if (!candleSeriesRef.current) return;
      const y = e.clientY - container.getBoundingClientRect().top;
      const price = candleSeriesRef.current.coordinateToPrice(y);
      if (price === null) return;

      const threshold = Math.abs(price) * 0.003;
      let closest: { tradeId: string; lineType: 'SL' | 'TP'; priceLine: IPriceLine; dist: number } | null = null;

      for (const [tradeId, lines] of priceLinesRef.current.entries()) {
        const slDist = Math.abs(price - lines.sl.options().price);
        const tpDist = Math.abs(price - lines.tp.options().price);
        if (slDist < threshold && (!closest || slDist < closest.dist))
          closest = { tradeId, lineType: 'SL', priceLine: lines.sl, dist: slDist };
        if (tpDist < threshold && (!closest || tpDist < closest.dist))
          closest = { tradeId, lineType: 'TP', priceLine: lines.tp, dist: tpDist };
      }

      if (closest) {
        const tradeData = tradesRef.current.find(t => t.id === closest!.tradeId);
        if (tradeData) {
          // Prepare drag but DON'T start it yet — wait for threshold
          dragStateRef.current = { tradeId: closest.tradeId, lineType: closest.lineType, priceLine: closest.priceLine, trade: tradeData };
          dragStartYRef.current = e.clientY;
          isDraggingRef.current = false;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current || !candleSeriesRef.current || dragStartYRef.current === null) return;

      // Check threshold before starting actual drag
      if (!isDraggingRef.current) {
        const dy = Math.abs(e.clientY - dragStartYRef.current);
        if (dy < DRAG_THRESHOLD_PX) return; // not enough movement — let chart handle it
        isDraggingRef.current = true;
        container.style.cursor = 'ns-resize';
      }

      const y = e.clientY - container.getBoundingClientRect().top;
      const p = candleSeriesRef.current.coordinateToPrice(y);
      if (p === null) return;
      const { trade, lineType } = dragStateRef.current;
      const pnl = calcPnl(trade.entryPrice, p, trade.direction, trade.lotSize);
      const label = lineType === 'SL' ? `SL ${formatPnl(pnl)} ⇕` : `TP ${formatPnl(pnl)} ⇕`;
      dragStateRef.current.priceLine.applyOptions({ price: p, title: label });
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMouseUp = () => {
      if (dragStateRef.current && isDraggingRef.current) {
        const { tradeId, lineType, priceLine } = dragStateRef.current;
        if (lineType === 'SL' && onDragSL) onDragSL(tradeId, priceLine.options().price);
        if (lineType === 'TP' && onDragTP) onDragTP(tradeId, priceLine.options().price);
      }
      dragStateRef.current = null;
      dragStartYRef.current = null;
      isDraggingRef.current = false;
      container.style.cursor = '';
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    const resizeObserver = new ResizeObserver((entries) => chart.applyOptions({ width: entries[0].contentRect.width }));
    resizeObserver.observe(container);

    // Theme observer
    const themeObserver = new MutationObserver(() => {
      const t = getThemeColors(document.documentElement.classList.contains('dark'));
      chart.applyOptions({
        layout: { textColor: t.text },
        grid: { vertLines: { color: t.grid }, horzLines: { color: t.grid } },
        crosshair: {
          vertLine: { color: t.crosshair, labelBackgroundColor: t.labelBg },
          horzLine: { color: t.crosshair, labelBackgroundColor: t.labelBg },
        },
        rightPriceScale: { borderColor: t.border },
        timeScale: { borderColor: t.border },
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      markersPluginRef.current = null;
      priceLinesRef.current.clear();
    };
  }, [height, onDragSL, onDragTP]);

  // Update candle + volume data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return;
    candleSeriesRef.current.setData(data.map((d) => ({
      time: d.timestamp as unknown as Time, open: d.open, high: d.high, low: d.low, close: d.close,
    })));
    volumeSeriesRef.current.setData(data.map((d) => ({
      time: d.timestamp as unknown as Time, value: d.volume,
      color: d.close >= d.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    })));
    if (!hasInitialFit.current) {
      chartRef.current?.timeScale().fitContent();
      hasInitialFit.current = true;
    } else if (preserveScale) {
      chartRef.current?.timeScale().scrollToPosition(5, false);
    } else {
      chartRef.current?.timeScale().fitContent();
    }
  }, [data, preserveScale]);

  // Update trade markers and price lines
  useEffect(() => {
    if (!candleSeriesRef.current || !markersPluginRef.current) return;
    for (const [, lines] of priceLinesRef.current) {
      try { candleSeriesRef.current.removePriceLine(lines.entry); } catch { /* */ }
      try { candleSeriesRef.current.removePriceLine(lines.sl); } catch { /* */ }
      try { candleSeriesRef.current.removePriceLine(lines.tp); } catch { /* */ }
    }
    priceLinesRef.current.clear();
    const markers: SeriesMarker<Time>[] = [];
    const dec = (data[0]?.close ?? 0) > 100 ? 2 : 5;
    for (const trade of trades) {
      markers.push({
        time: trade.entryTime as unknown as Time,
        position: trade.direction === 'LONG' ? 'belowBar' : 'aboveBar',
        color: trade.direction === 'LONG' ? '#22c55e' : '#ef4444',
        shape: trade.direction === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `${trade.direction} @ ${trade.entryPrice.toFixed(dec)}`,
      });
      if (trade.status === 'OPEN') {
        const entryColor = trade.direction === 'LONG' ? '#22c55e' : '#ef4444';
        const slPnl = calcPnl(trade.entryPrice, trade.stopLoss, trade.direction, trade.lotSize);
        const tpPnl = calcPnl(trade.entryPrice, trade.takeProfit, trade.direction, trade.lotSize);
        const entry = candleSeriesRef.current.createPriceLine({ price: trade.entryPrice, color: entryColor, lineWidth: 1, lineStyle: 1, axisLabelVisible: true, title: '' });
        const sl = candleSeriesRef.current.createPriceLine({ price: trade.stopLoss, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: `SL ${formatPnl(slPnl)} ⇕` });
        const tp = candleSeriesRef.current.createPriceLine({ price: trade.takeProfit, color: '#22c55e', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: `TP ${formatPnl(tpPnl)} ⇕` });
        priceLinesRef.current.set(trade.id, { entry, sl, tp });
      }
    }
    // Add static markers (from Trade Replay: entry/exit points)
    for (const sm of staticMarkers) {
      // Find the closest candle timestamp to snap the marker to
      let closestTs = sm.time;
      let minDiff = Infinity;
      for (const d of data) {
        const diff = Math.abs(d.timestamp - sm.time);
        if (diff < minDiff) { minDiff = diff; closestTs = d.timestamp; }
      }
      markers.push({
        time: closestTs as unknown as Time,
        position: sm.position,
        color: sm.color,
        shape: sm.shape,
        text: sm.text,
      });
    }
    markers.sort((a, b) => (a.time as number) - (b.time as number));
    markersPluginRef.current.setMarkers(markers);
  }, [trades, data, staticMarkers]);

  // Static price lines (for Trade Replay: entry, exit, SL, TP)
  const staticLinesRef = useRef<IPriceLine[]>([]);
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    // Remove old static lines
    for (const line of staticLinesRef.current) {
      try { candleSeriesRef.current.removePriceLine(line); } catch { /* */ }
    }
    staticLinesRef.current = [];
    // Create new ones
    for (const sl of staticLines) {
      if (!sl.price || sl.price === 0) continue;
      const line = candleSeriesRef.current.createPriceLine({
        price: sl.price,
        color: sl.color,
        lineWidth: 1,
        lineStyle: sl.lineStyle ?? 0,
        axisLabelVisible: true,
        title: sl.title,
      });
      staticLinesRef.current.push(line);
    }
  }, [staticLines]);

  return (
    <div className="w-full rounded-xl border border-border/50 bg-card overflow-hidden">
      <div ref={chartContainerRef} />
    </div>
  );
});

BacktestChart.displayName = 'BacktestChart';
export default BacktestChart;
