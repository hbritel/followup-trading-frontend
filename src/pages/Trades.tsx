
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Filter, PlusCircle, Search, Download, Upload, Columns } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TradesTable from '@/components/trades/TradesTable';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TradeColumnFilter from '@/components/trades/TradeColumnFilter';
import TradeImportExport from '@/components/trades/TradeImportExport';

const Trades = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState({
    symbol: true,
    type: true,
    price: true, 
    quantity: true,
    date: true,
    status: true,
    pl: true,
    entryPrice: false,
    exitPrice: false,
    stoploss: false,
    takeProfit: false,
    fees: false,
    notes: false,
    createdAt: false,
    updatedAt: false,
    plPercentage: true
  });

  const handleVisibilityChange = (columnName: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName as keyof typeof prev]
    }));
  };

  return (
    <DashboardLayout pageTitle="Trades">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>View and manage your trading activities</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <TradeImportExport />
                
                <TradeColumnFilter
                  visibleColumns={visibleColumns}
                  onVisibilityChange={handleVisibilityChange}
                />
                
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Trade
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search trades..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  className="bg-background border rounded-md p-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                <select 
                  className="bg-background border rounded-md p-2 text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <TradesTable 
              visibleColumns={visibleColumns} 
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Trades;
