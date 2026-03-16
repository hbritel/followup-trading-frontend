
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TradeReplayResponseDto } from '@/types/dto';

interface ReplayControlsProps {
  replayData: TradeReplayResponseDto | undefined;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const SPEED_MAP: Record<string, number> = {
  '0.5x': 2000,
  '1x': 1000,
  '2x': 500,
  '4x': 250,
};

const formatTimestamp = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

const ReplayControls: React.FC<ReplayControlsProps> = ({
  replayData,
  currentIndex,
  onIndexChange,
}) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxIndex = replayData ? replayData.timelinePoints.length - 1 : 0;
  const hasData = replayData && replayData.timelinePoints.length > 0;

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || !hasData) {
      return;
    }

    intervalRef.current = setInterval(() => {
      onIndexChange(currentIndex + 1);
    }, SPEED_MAP[speed]);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, currentIndex, hasData, onIndexChange]);

  useEffect(() => {
    if (currentIndex >= maxIndex && isPlaying) {
      stopPlayback();
    }
  }, [currentIndex, maxIndex, isPlaying, stopPlayback]);

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else if (currentIndex >= maxIndex) {
      onIndexChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    stopPlayback();
    onIndexChange(0);
  };

  const handleStepBack = () => {
    stopPlayback();
    onIndexChange(Math.max(0, currentIndex - 1));
  };

  const handleStepForward = () => {
    stopPlayback();
    onIndexChange(Math.min(maxIndex, currentIndex + 1));
  };

  const handleSkipBack = () => {
    stopPlayback();
    onIndexChange(0);
  };

  const handleSkipForward = () => {
    stopPlayback();
    onIndexChange(maxIndex);
  };

  const currentPoint = hasData ? replayData.timelinePoints[currentIndex] : null;

  const startTimestamp = hasData ? formatTimestamp(replayData.timelinePoints[0].timestamp) : '';
  const endTimestamp = hasData
    ? formatTimestamp(replayData.timelinePoints[maxIndex].timestamp)
    : '';

  return (
    <div>
      <div className="p-0">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipBack}
                disabled={!hasData}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleStepBack}
                disabled={!hasData || currentIndex <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={isPlaying ? 'default' : 'outline'}
                size="icon"
                onClick={togglePlay}
                disabled={!hasData}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleStepForward}
                disabled={!hasData || currentIndex >= maxIndex}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipForward}
                disabled={!hasData}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                disabled={!hasData}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Tabs value={speed} className="h-8">
                <TabsList className="h-8">
                  <TabsTrigger
                    value="0.5x"
                    className="px-2 text-xs h-7"
                    onClick={() => setSpeed('0.5x')}
                  >
                    0.5x
                  </TabsTrigger>
                  <TabsTrigger
                    value="1x"
                    className="px-2 text-xs h-7"
                    onClick={() => setSpeed('1x')}
                  >
                    1x
                  </TabsTrigger>
                  <TabsTrigger
                    value="2x"
                    className="px-2 text-xs h-7"
                    onClick={() => setSpeed('2x')}
                  >
                    2x
                  </TabsTrigger>
                  <TabsTrigger
                    value="4x"
                    className="px-2 text-xs h-7"
                    onClick={() => setSpeed('4x')}
                  >
                    4x
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{startTimestamp}</span>
              <span>{endTimestamp}</span>
            </div>
            <Slider
              value={[currentIndex]}
              max={maxIndex || 1}
              step={1}
              className="w-full"
              disabled={!hasData}
              onValueChange={(values) => {
                stopPlayback();
                onIndexChange(values[0]);
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="text-sm text-muted-foreground">
              {hasData && (
                <span>
                  {t('tradeReplay.point')} {currentIndex + 1} {t('tradeReplay.of')}{' '}
                  {maxIndex + 1}
                </span>
              )}
            </div>

            {currentPoint && (
              <div className="flex items-center gap-4 text-sm font-mono tabular-nums">
                <span className="text-muted-foreground">
                  {formatTimestamp(currentPoint.timestamp)}
                </span>
                <span className="font-medium">
                  <span className="label-caps mr-1">{t('tradeReplay.price')}:</span>
                  {currentPoint.price.toFixed(4)}
                </span>
                <span className={`font-semibold tabular-nums ${currentPoint.unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  <span className="label-caps mr-1">{t('tradeReplay.unrealizedPnl')}:</span>
                  ${currentPoint.unrealizedPnl.toFixed(2)}
                </span>
                {currentPoint.annotation && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded label-caps ${
                    currentPoint.annotation === 'MAX_PROFIT' ? 'bg-emerald-500/20 text-emerald-400' :
                    currentPoint.annotation === 'MAX_LOSS' ? 'bg-red-500/20 text-red-400' :
                    'bg-accent text-accent-foreground'
                  }`}>
                    {currentPoint.annotation}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayControls;
