
import React from 'react';
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";

export interface StatisticItem {
  name: string;
  value: string;
  highlight: boolean;
}

interface StatisticsCardsProps {
  statistics: StatisticItem[];
}

const StatisticsCards = ({ statistics }: StatisticsCardsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {statistics.slice(0, 4).map((stat, index) => (
        <Card key={index}>
          <CardHeader className="p-4 pb-2">
            <CardDescription>{stat.name}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className={`text-2xl font-bold ${stat.highlight && stat.value.includes('-') ? 'text-red-500' : (stat.highlight ? 'text-green-500' : '')}`}>
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatisticsCards;
