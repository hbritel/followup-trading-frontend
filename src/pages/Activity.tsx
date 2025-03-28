
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Filter, Search } from 'lucide-react';

interface Activity {
  id: number;
  type: 'trade' | 'login' | 'setting' | 'export' | 'journal';
  action: string;
  timestamp: Date;
  details: string;
}

const activities: Activity[] = [
  {
    id: 1,
    type: 'trade',
    action: 'New trade created',
    timestamp: new Date(2023, 4, 10, 9, 30),
    details: 'Long position on AAPL at $145.32',
  },
  {
    id: 2,
    type: 'trade',
    action: 'Trade closed',
    timestamp: new Date(2023, 4, 10, 14, 15),
    details: 'AAPL position closed with +3.2% profit',
  },
  {
    id: 3,
    type: 'login',
    action: 'Successful login',
    timestamp: new Date(2023, 4, 10, 9, 0),
    details: 'Login from Chrome on Windows',
  },
  {
    id: 4,
    type: 'export',
    action: 'Data exported',
    timestamp: new Date(2023, 4, 9, 16, 45),
    details: 'Trade history exported to CSV',
  },
  {
    id: 5,
    type: 'setting',
    action: 'Settings updated',
    timestamp: new Date(2023, 4, 9, 11, 30),
    details: 'Changed default currency to EUR',
  },
  {
    id: 6,
    type: 'journal',
    action: 'Journal entry added',
    timestamp: new Date(2023, 4, 8, 17, 20),
    details: 'Added notes on market conditions',
  },
  {
    id: 7,
    type: 'trade',
    action: 'Trade modified',
    timestamp: new Date(2023, 4, 8, 13, 10),
    details: 'Updated TSLA trade stop loss',
  },
  {
    id: 8,
    type: 'login',
    action: 'Failed login attempt',
    timestamp: new Date(2023, 4, 7, 22, 5),
    details: 'Failed attempt from unknown device',
  },
];

const ActivityPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      searchQuery === '' || 
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = 
      typeFilter === null || 
      activity.type === typeFilter;
      
    return matchesSearch && matchesType;
  });
  
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'trade':
        return 'bg-blue-500';
      case 'login':
        return 'bg-green-500';
      case 'setting':
        return 'bg-purple-500';
      case 'export':
        return 'bg-amber-500';
      case 'journal':
        return 'bg-rose-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <DashboardLayout pageTitle="Activity Log">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {typeFilter ? `Filter: ${typeFilter}` : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                All activities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('trade')}>
                Trades only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('login')}>
                Logins only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('setting')}>
                Settings only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('export')}>
                Exports only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('journal')}>
                Journal only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Recent actions and changes in your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent/10 transition-colors">
                    <Badge className={getBadgeColor(activity.type)}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Badge>
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.action}</h3>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.timestamp.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivityPage;
