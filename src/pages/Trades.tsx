
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Filter, PlusCircle, Search } from 'lucide-react';

const tradesData = [
  { id: 1, symbol: 'AAPL', type: 'buy', price: 182.52, quantity: 10, date: '2023-06-12', status: 'closed', pl: '+125.32', plPercentage: '+6.86%' },
  { id: 2, symbol: 'MSFT', type: 'buy', price: 337.94, quantity: 5, date: '2023-06-10', status: 'closed', pl: '+87.45', plPercentage: '+5.17%' },
  { id: 3, symbol: 'TSLA', type: 'sell', price: 193.17, quantity: 8, date: '2023-06-08', status: 'closed', pl: '-43.21', plPercentage: '-2.79%' },
  { id: 4, symbol: 'AMZN', type: 'buy', price: 127.90, quantity: 15, date: '2023-06-05', status: 'closed', pl: '+102.67', plPercentage: '+5.34%' },
  { id: 5, symbol: 'GOOGL', type: 'buy', price: 122.23, quantity: 12, date: '2023-06-01', status: 'closed', pl: '+65.43', plPercentage: '+4.47%' },
  { id: 6, symbol: 'NVDA', type: 'buy', price: 426.92, quantity: 3, date: '2023-05-30', status: 'open', pl: '', plPercentage: '' },
  { id: 7, symbol: 'META', type: 'sell', price: 326.49, quantity: 6, date: '2023-05-25', status: 'closed', pl: '+93.76', plPercentage: '+4.78%' },
  { id: 8, symbol: 'AMD', type: 'buy', price: 122.41, quantity: 20, date: '2023-05-20', status: 'open', pl: '', plPercentage: '' },
  { id: 9, symbol: 'INTC', type: 'sell', price: 33.96, quantity: 30, date: '2023-05-15', status: 'closed', pl: '-48.90', plPercentage: '-4.58%' },
  { id: 10, symbol: 'PYPL', type: 'buy', price: 60.12, quantity: 15, date: '2023-05-10', status: 'open', pl: '', plPercentage: '' },
];

const Trades = () => {
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
              <Button className="w-full sm:w-auto">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Trade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search trades..." className="pl-8" />
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Price</TableHead>
                    <TableHead className="hidden md:table-cell">Quantity</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesData.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                          {trade.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">${trade.price}</TableCell>
                      <TableCell className="hidden md:table-cell">{trade.quantity}</TableCell>
                      <TableCell className="hidden md:table-cell">{trade.date}</TableCell>
                      <TableCell>
                        <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {trade.status === 'closed' ? (
                          <div>
                            <div className={trade.pl.startsWith('+') ? 'text-profit' : 'text-loss'}>
                              ${trade.pl}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trade.plPercentage}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Trades;
