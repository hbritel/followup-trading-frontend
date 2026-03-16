import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BadgeCard from './BadgeCard';
import type { BadgeDto } from '@/types/dto';

interface BadgeGridProps {
  badges: BadgeDto[];
}

type CategoryFilter = 'ALL' | 'TRADING' | 'DISCIPLINE' | 'PERFORMANCE';

const BadgeGrid: React.FC<BadgeGridProps> = ({ badges }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CategoryFilter>('ALL');

  const filtered =
    activeTab === 'ALL' ? badges : badges.filter((b) => b.category === activeTab);

  const tabs: { value: CategoryFilter; label: string }[] = [
    { value: 'ALL', label: t('gamification.all', 'All') },
    { value: 'TRADING', label: t('gamification.trading', 'Trading') },
    { value: 'DISCIPLINE', label: t('gamification.discipline', 'Discipline') },
    { value: 'PERFORMANCE', label: t('gamification.performance', 'Performance') },
  ];

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryFilter)}>
      <TabsList className="mb-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">
              {t('common.noData')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((badge) => (
                <BadgeCard key={badge.badgeType} badge={badge} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default BadgeGrid;
