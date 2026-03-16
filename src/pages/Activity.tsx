
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useActivity } from '@/hooks/useActivity';

const PAGE_SIZE = 20;

const ActivityPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useActivity(page, PAGE_SIZE, typeFilter);

  const activities = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredActivities = searchQuery
    ? activities.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activities;

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'trade':
        return 'bg-blue-500';
      case 'login':
        return 'bg-green-500';
      case 'setting':
        return 'bg-purple-500';
      case 'broker':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout pageTitle={t('activity.pageTitle')}>
      <PageTransition className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('activity.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {typeFilter !== 'all' ? `${t('common.filter')}: ${typeFilter}` : t('common.filter')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setTypeFilter('all'); setPage(0); }}>
                {t('activity.allActivities')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTypeFilter('trade'); setPage(0); }}>
                {t('activity.tradesOnly')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTypeFilter('login'); setPage(0); }}>
                {t('activity.loginsOnly')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTypeFilter('setting'); setPage(0); }}>
                {t('activity.settingsOnly')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTypeFilter('broker'); setPage(0); }}>
                {t('activity.brokerOnly')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('activity.pageTitle')}</CardTitle>
            <CardDescription>{t('activity.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 border rounded-lg">
                    <Skeleton className="h-6 w-16" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent/10 transition-colors">
                    <Badge className={getBadgeColor(activity.category)}>
                      {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                    </Badge>
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('activity.noActivitiesFound')}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PageTransition>
    </DashboardLayout>
  );
};

export default ActivityPage;
