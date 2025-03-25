
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReplayControls = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant={isPlaying ? "default" : "outline"} 
                size="icon" 
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Tabs defaultValue="1x" className="h-8">
                <TabsList className="h-8">
                  <TabsTrigger value="0.5x" className="px-2 text-xs h-7" onClick={() => setSpeed('0.5x')}>0.5x</TabsTrigger>
                  <TabsTrigger value="1x" className="px-2 text-xs h-7" onClick={() => setSpeed('1x')}>1x</TabsTrigger>
                  <TabsTrigger value="2x" className="px-2 text-xs h-7" onClick={() => setSpeed('2x')}>2x</TabsTrigger>
                  <TabsTrigger value="4x" className="px-2 text-xs h-7" onClick={() => setSpeed('4x')}>4x</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>May 10, 09:30 AM</span>
              <span>May 10, 04:00 PM</span>
            </div>
            <Slider 
              defaultValue={[0]} 
              max={100} 
              step={1}
              className="w-full" 
            />
          </div>
          
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <Toggle size="sm" aria-label="Toggle entries" defaultPressed>
                <span className="text-xs">{t('tradeReplay.entries')}</span>
              </Toggle>
              <Toggle size="sm" aria-label="Toggle exits" defaultPressed>
                <span className="text-xs">{t('tradeReplay.exits')}</span>
              </Toggle>
              <Toggle size="sm" aria-label="Toggle stop loss">
                <span className="text-xs">{t('tradeReplay.stopLoss')}</span>
              </Toggle>
              <Toggle size="sm" aria-label="Toggle take profit">
                <span className="text-xs">{t('tradeReplay.takeProfit')}</span>
              </Toggle>
            </div>
            
            <div className="text-sm font-medium">
              <span className="text-muted-foreground mr-2">{t('tradeReplay.currentTime')}:</span>
              <span>10:45 AM</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReplayControls;
