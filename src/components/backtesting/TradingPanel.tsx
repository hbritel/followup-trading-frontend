import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Plus, Zap } from 'lucide-react';

export interface SimulatedTrade {
  id: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskPercent: number;
  riskAmount: number;
  rrRatio: number;
  entryTime: number; // epoch seconds
  exitPrice?: number;
  exitTime?: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
}

interface TradingPanelProps {
  currentPrice: number | null;
  balance: number;
  onPlaceTrade: (trade: Omit<SimulatedTrade, 'id' | 'status'>) => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({ currentPrice, balance, onPlaceTrade }) => {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [riskPercent, setRiskPercent] = useState(1);
  const [slValue, setSlValue] = useState(50);
  const [tpValue, setTpValue] = useState(100);
  const [slTpMode, setSlTpMode] = useState<'pips' | 'price' | 'dollar'>('pips');

  const price = currentPrice ?? 0;
  const pipValue = price > 100 ? 0.01 : 0.0001;
  const priceDecimals = price > 100 ? 2 : 5;

  const riskAmount = balance * (riskPercent / 100);

  // Convert SL/TP values to pips regardless of mode
  const slInPips = (() => {
    switch (slTpMode) {
      case 'pips': return slValue;
      case 'price': return Math.round(Math.abs(price - slValue) / pipValue);
      case 'dollar': return riskAmount > 0 ? Math.round(slValue) : 0; // in $ mode, slValue IS the dollar risk
    }
  })();

  const tpInPips = (() => {
    switch (slTpMode) {
      case 'pips': return tpValue;
      case 'price': return Math.round(Math.abs(price - tpValue) / pipValue);
      case 'dollar': return riskAmount > 0 ? Math.round(tpValue) : 0;
    }
  })();

  // In dollar mode, slValue/tpValue are $ amounts, we derive pips from lot size
  // In pips/price mode, we derive $ amounts from pips
  const effectiveRiskAmount = slTpMode === 'dollar' ? slValue : riskAmount;
  const effectiveTpAmount = slTpMode === 'dollar' ? tpValue : (slInPips > 0 ? riskAmount * (tpInPips / slInPips) : 0);

  // In dollar mode: user picks $ risk/reward. We use the risk% slider's lot size to derive pips.
  // lot = riskAmount / (slPips * 10) → slPips = riskAmount / (lot * 10)
  // For dollar mode, we use a fixed lot approach: risk$ = slPips * 10 * lots
  const baseLotSize = riskAmount / (50 * 10); // baseline lot from 50 pips

  const slDistanceInPrice = slTpMode === 'pips' ? slValue * pipValue
    : slTpMode === 'price' ? Math.abs(price - slValue)
    : baseLotSize > 0 ? (slValue / (baseLotSize * 10)) * pipValue : 0;

  const tpDistanceInPrice = slTpMode === 'pips' ? tpValue * pipValue
    : slTpMode === 'price' ? Math.abs(price - tpValue)
    : baseLotSize > 0 ? (tpValue / (baseLotSize * 10)) * pipValue : 0;

  const actualSlPips = Math.round(slDistanceInPrice / pipValue);
  const actualTpPips = Math.round(tpDistanceInPrice / pipValue);

  const lotSize = actualSlPips > 0 ? effectiveRiskAmount / (actualSlPips * 10) : 0;
  const rrRatio = slTpMode === 'dollar'
    ? (slValue > 0 ? tpValue / slValue : 0)
    : (actualSlPips > 0 ? actualTpPips / actualSlPips : 0);

  const stopLoss = slTpMode === 'price' ? slValue
    : direction === 'LONG' ? price - slDistanceInPrice : price + slDistanceInPrice;
  const takeProfit = slTpMode === 'price' ? tpValue
    : direction === 'LONG' ? price + tpDistanceInPrice : price - tpDistanceInPrice;

  const handlePlaceTrade = () => {
    if (!currentPrice || actualSlPips <= 0) return;
    onPlaceTrade({
      direction,
      entryPrice: price,
      stopLoss,
      takeProfit,
      lotSize: Math.round(lotSize * 100) / 100,
      riskPercent,
      riskAmount: Math.round(effectiveRiskAmount * 100) / 100,
      rrRatio: Math.round(rrRatio * 100) / 100,
      entryTime: Math.floor(Date.now() / 1000),
    });
  };

  return (
    <Card className="glass-card rounded-2xl w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" />
          {t('backtesting.command')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Price */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('backtesting.livePrice')}</p>
          <p className="text-3xl font-bold font-mono tabular-nums">{price.toFixed(price > 100 ? 2 : 5)}</p>
        </div>

        {/* Direction buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={direction === 'LONG' ? 'default' : 'outline'}
            className={cn('h-10', direction === 'LONG' && 'bg-green-600 hover:bg-green-700')}
            onClick={() => setDirection('LONG')}
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            LONG
          </Button>
          <Button
            variant={direction === 'SHORT' ? 'default' : 'outline'}
            className={cn('h-10', direction === 'SHORT' && 'bg-red-600 hover:bg-red-700')}
            onClick={() => setDirection('SHORT')}
          >
            <TrendingDown className="h-4 w-4 mr-1.5" />
            SHORT
          </Button>
        </div>

        {/* Risk slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">% {t('backtesting.risk')}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-500">{riskPercent}%</span>
              <span className="text-xs text-muted-foreground">| {lotSize.toFixed(2)} lots</span>
            </div>
          </div>
          <Slider
            value={[riskPercent]}
            min={0.25}
            max={10}
            step={0.25}
            onValueChange={([v]) => setRiskPercent(v)}
          />
        </div>

        {/* SL/TP mode toggle */}
        <div className="flex items-center justify-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={slTpMode === 'pips' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-3 text-[10px]"
            onClick={() => {
              setSlValue(actualSlPips || 50);
              setTpValue(actualTpPips || 100);
              setSlTpMode('pips');
            }}
          >
            Pips
          </Button>
          <Button
            variant={slTpMode === 'price' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-3 text-[10px]"
            onClick={() => {
              setSlValue(Number(stopLoss.toFixed(priceDecimals)));
              setTpValue(Number(takeProfit.toFixed(priceDecimals)));
              setSlTpMode('price');
            }}
          >
            {t('backtesting.priceMode')}
          </Button>
          <Button
            variant={slTpMode === 'dollar' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 px-3 text-[10px]"
            onClick={() => {
              setSlValue(Math.round(effectiveRiskAmount));
              setTpValue(Math.round(effectiveTpAmount));
              setSlTpMode('dollar');
            }}
          >
            $
          </Button>
        </div>

        {/* SL / TP inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-red-400">SL</Label>
              <span className="text-[10px] text-muted-foreground">{slTpMode === 'dollar' ? '$' : slTpMode}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setSlValue(Math.max(0.01, slValue - (slTpMode === 'pips' ? 5 : slTpMode === 'dollar' ? 10 : pipValue * 50)))}>
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                step={slTpMode === 'pips' ? 1 : slTpMode === 'dollar' ? 5 : pipValue}
                value={slTpMode === 'price' ? slValue.toFixed(priceDecimals) : slTpMode === 'dollar' ? slValue.toFixed(0) : slValue}
                onChange={(e) => setSlValue(Math.max(0, Number(e.target.value)))}
                className="h-8 text-center font-mono font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400" onClick={() => setSlValue(slValue + (slTpMode === 'pips' ? 5 : slTpMode === 'dollar' ? 10 : pipValue * 50))}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-green-500/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-green-400">TP</Label>
              <span className="text-[10px] text-muted-foreground">{slTpMode === 'dollar' ? '$' : slTpMode}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setTpValue(Math.max(0.01, tpValue - (slTpMode === 'pips' ? 5 : slTpMode === 'dollar' ? 10 : pipValue * 50)))}>
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                step={slTpMode === 'pips' ? 1 : slTpMode === 'dollar' ? 5 : pipValue}
                value={slTpMode === 'price' ? tpValue.toFixed(priceDecimals) : slTpMode === 'dollar' ? tpValue.toFixed(0) : tpValue}
                onChange={(e) => setTpValue(Math.max(0, Number(e.target.value)))}
                className="h-8 text-center font-mono font-bold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400" onClick={() => setTpValue(tpValue + (slTpMode === 'pips' ? 5 : slTpMode === 'dollar' ? 10 : pipValue * 50))}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* R:R and Risk amount */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">R:R</span>
          <span className={cn('font-bold font-mono', rrRatio >= 2 ? 'text-green-500' : rrRatio >= 1 ? 'text-amber-500' : 'text-red-500')}>
            1:{rrRatio.toFixed(2)}
          </span>
          <span className="text-muted-foreground">{t('backtesting.risk')}</span>
          <span className="font-bold font-mono text-amber-500">${effectiveRiskAmount.toFixed(0)}</span>
        </div>

        {/* Execute button */}
        <Button
          className={cn(
            'w-full h-12 text-base font-bold',
            direction === 'LONG' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700',
          )}
          onClick={handlePlaceTrade}
          disabled={!currentPrice}
        >
          <Zap className="h-5 w-5 mr-2" />
          {t('backtesting.execute')} {direction}
        </Button>

        {/* Balance */}
        <div className="text-center text-xs text-muted-foreground">
          {t('backtesting.balance')}: <span className="font-mono font-medium text-foreground">${balance.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingPanel;
