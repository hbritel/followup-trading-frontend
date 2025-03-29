
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Trash2, ArrowUpRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  starred: boolean;
}

interface StockTableProps {
  stocks: StockData[];
  searchQuery: string;
  showFavorites: boolean;
  onSearchChange: (query: string) => void;
  onToggleFavorites: (value: string) => void;
  onToggleStarred: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const StockTable: React.FC<StockTableProps> = ({
  stocks,
  searchQuery,
  showFavorites,
  onSearchChange,
  onToggleFavorites,
  onToggleStarred,
  onRemoveSymbol
}) => {
  return (
    <>
      <div className="flex justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search symbols..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Tabs 
          defaultValue="all" 
          value={showFavorites ? "favorites" : "all"} 
          onValueChange={onToggleFavorites}
          className="hidden md:block"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="hidden md:table-cell">Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Chg%</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Volume</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {showFavorites 
                    ? "No favorite stocks found. Star some stocks to add them to favorites." 
                    : "No stocks found matching your search criteria."}
                </TableCell>
              </TableRow>
            ) : (
              stocks.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => onToggleStarred(stock.symbol)}
                    >
                      <Star 
                        className={`h-4 w-4 ${stock.starred ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                      />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {stock.symbol}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {stock.name}
                  </TableCell>
                  <TableCell className="text-right">
                    ${stock.price.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right ${stock.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
                    {stock.volume}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => onRemoveSymbol(stock.symbol)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default StockTable;
