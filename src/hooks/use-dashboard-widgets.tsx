
import * as React from "react"
import { useLocalStorage } from "./use-local-storage"

export type WidgetType = 
  | "stats" 
  | "performance" 
  | "account" 
  | "trades" 
  | "calendar"

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  w: number;
  h: number;
  x: number;
  y: number;
  minW?: number;
  minH?: number;
  isResizable?: boolean;
}

const defaultWidgets: WidgetConfig[] = [
  { id: "stats", type: "stats", title: "Trading Stats", w: 12, h: 1, x: 0, y: 0, isResizable: false },
  { id: "performance", type: "performance", title: "Performance Chart", w: 12, h: 2, x: 0, y: 1 },
  { id: "account", type: "account", title: "Account Summary", w: 8, h: 2, x: 0, y: 3 },
  { id: "trades", type: "trades", title: "Recent Trades", w: 6, h: 2, x: 0, y: 5 },
  { id: "calendar", type: "calendar", title: "Trading Calendar", w: 6, h: 2, x: 6, y: 5 }
];

const availableWidgets: Record<WidgetType, { title: string, minW: number, minH: number }> = {
  stats: { title: "Trading Stats", minW: 6, minH: 1 },
  performance: { title: "Performance Chart", minW: 6, minH: 2 },
  account: { title: "Account Summary", minW: 6, minH: 2 },
  trades: { title: "Recent Trades", minW: 4, minH: 2 },
  calendar: { title: "Trading Calendar", minW: 4, minH: 2 }
};

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>("dashboard-widgets", defaultWidgets);
  const [isEditMode, setIsEditMode] = React.useState(false);

  const updateLayout = (layout: any[]) => {
    setWidgets(prev => 
      prev.map(widget => {
        const updatedWidget = layout.find(item => item.i === widget.id);
        if (updatedWidget) {
          return {
            ...widget,
            w: updatedWidget.w,
            h: updatedWidget.h,
            x: updatedWidget.x,
            y: updatedWidget.y
          };
        }
        return widget;
      })
    );
  };

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  const resetWidgets = () => {
    setWidgets(defaultWidgets);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== id));
  };

  const addWidget = (type: WidgetType) => {
    const typeConfig = availableWidgets[type];
    // Check if widget of this type already exists
    const existing = widgets.find(w => w.type === type);
    
    if (!existing) {
      const newWidget: WidgetConfig = {
        id: `${type}-${Date.now()}`,
        type,
        title: typeConfig.title,
        w: Math.max(6, typeConfig.minW),
        h: typeConfig.minH,
        x: 0,
        y: 0, // This will be adjusted by the grid
        minW: typeConfig.minW,
        minH: typeConfig.minH
      };
      
      setWidgets(prev => [...prev, newWidget]);
    }
  };

  const getAvailableWidgetsToAdd = () => {
    const existingTypes = new Set(widgets.map(w => w.type));
    return Object.entries(availableWidgets)
      .filter(([type]) => !existingTypes.has(type as WidgetType))
      .map(([type, config]) => ({
        type: type as WidgetType,
        title: config.title
      }));
  };

  return {
    widgets,
    isEditMode,
    updateLayout,
    toggleEditMode,
    resetWidgets,
    removeWidget,
    addWidget,
    getAvailableWidgetsToAdd
  };
}
