import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Play, Pause, SkipForward, SkipBack, FastForward } from 'lucide-react';

interface PlaybackControlsProps {
  currentIndex: number;
  totalCandles: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [
  { value: '0.5', label: '0.5x' },
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '5', label: '5x' },
  { value: '10', label: '10x' },
];

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentIndex, totalCandles, isPlaying, speed,
  onPlay, onPause, onStepForward, onStepBack, onSeek, onSpeedChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/50 px-4 py-2.5">
      {/* Step back */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStepBack} disabled={currentIndex <= 0}>
        <SkipBack className="h-4 w-4" />
      </Button>

      {/* Play/Pause */}
      <Button
        variant={isPlaying ? 'secondary' : 'default'}
        size="icon"
        className="h-9 w-9"
        onClick={isPlaying ? onPause : onPlay}
        disabled={currentIndex >= totalCandles}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>

      {/* Step forward */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStepForward} disabled={currentIndex >= totalCandles}>
        <SkipForward className="h-4 w-4" />
      </Button>

      {/* Progress slider */}
      <div className="flex-1 flex items-center gap-3">
        <Slider
          value={[currentIndex]}
          min={0}
          max={totalCandles}
          step={1}
          onValueChange={([val]) => onSeek(val)}
          className="flex-1"
        />
        <span className="text-xs font-mono text-muted-foreground tabular-nums whitespace-nowrap">
          {currentIndex} / {totalCandles}
        </span>
      </div>

      {/* Speed selector */}
      <Select value={String(speed)} onValueChange={(v) => onSpeedChange(Number(v))}>
        <SelectTrigger className="w-[72px] h-8 text-xs">
          <FastForward className="h-3 w-3 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SPEEDS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PlaybackControls;
