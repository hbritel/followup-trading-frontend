
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Star, Pencil, Trash2, ArrowUpRight, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';

// Sample data
const initialWatchlists = [
  { id: 1, name: 'Tech Stocks', description: 'Major technology companies', symbols: 15 },
  { id: 2, name: 'Dividend Aristocrats', description: 'Companies with consistent dividend growth', symbols: 23 },
  { id: 3, name: 'Growth Opportunities', description: 'High growth potential stocks', symbols: 18 },
  { id: 4, name: 'ETFs', description: 'Exchange-traded funds', symbols: 10 },
  { id: 5, name: 'Earnings This Week', description: 'Companies reporting earnings', symbols: 7 },
];

const initialTechStocksData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.52, change: 2.34, changePercent: 1.28, volume: '24.5M', marketCap: '2.87T', starred: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 337.94, change: 3.76, changePercent: 1.12, volume: '18.2M', marketCap: '2.51T', starred: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 122.23, change: 1.85, changePercent: 1.53, volume: '22.8M', marketCap: '1.54T', starred: false },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 127.90, change: 2.10, changePercent: 1.67, volume: '31.4M', marketCap: '1.32T', starred: true },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 326.49, change: 5.23, changePercent: 1.62, volume: '16.7M', marketCap: '838.2B', starred: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 193.17, change: -2.76, changePercent: -1.41, volume: '43.5M', marketCap: '612.9B', starred: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 426.92, change: 8.47, changePercent: 2.02, volume: '35.1M', marketCap: '1.05T', starred: true },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 122.41, change: 2.31, changePercent: 1.92, volume: '27.6M', marketCap: '197.5B', starred: false },
  { symbol: 'INTC', name: 'Intel Corp.', price: 33.96, change: -0.52, changePercent: -1.51, volume: '32.8M', marketCap: '142.3B', starred: false },
  { symbol: 'CRM', name: 'Salesforce Inc.', price: 217.43, change: 3.85, changePercent: 1.80, volume: '12.3M', marketCap: '211.8B', starred: false },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 472.63, change: 7.34, changePercent: 1.57, volume: '8.7M', marketCap: '216.4B', starred: false },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', price: 45.87, change: 0.43, changePercent: 0.94, volume: '17.5M', marketCap: '187.1B', starred: false },
  { symbol: 'ORCL', name: 'Oracle Corp.', price: 118.76, change: 1.24, changePercent: 1.05, volume: '9.1M', marketCap: '324.3B', starred: false },
  { symbol: 'IBM', name: 'IBM Corp.', price: 143.62, change: 1.87, changePercent: 1.32, volume: '5.4M', marketCap: '132.1B', starred: false },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 398.25, change: 5.73, changePercent: 1.46, volume: '10.8M', marketCap: '177.6B', starred: false },
];

interface WatchlistFormValues {
  name: string;
  description: string;
}

interface SymbolFormValues {
  symbol: string;
  name: string;
}

const Watchlists = () => {
  const { toast } = useToast();
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [activeWatchlist, setActiveWatchlist] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [stocksData, setStocksData] = useState(initialTechStocksData);
  const [showFavorites, setShowFavorites] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<{ id: number, name: string, description: string } | null>(null);
  const [watchlistToDelete, setWatchlistToDelete] = useState<number | null>(null);
  const [openAddSymbolDialog, setOpenAddSymbolDialog] = useState(false);
  const [openNewWatchlistDialog, setOpenNewWatchlistDialog] = useState(false);
  const [openEditWatchlistDialog, setOpenEditWatchlistDialog] = useState(false);
  const [openDeleteWatchlistDialog, setOpenDeleteWatchlistDialog] = useState(false);

  const watchlistForm = useForm<WatchlistFormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const symbolForm = useForm<SymbolFormValues>({
    defaultValues: {
      symbol: '',
      name: '',
    },
  });

  const activeWatchlistData = watchlists.find(
    watchlist => watchlist.id.toString() === activeWatchlist
  );

  // Filter stocks based on search query and favorites filter
  const filteredStocks = stocksData.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return showFavorites ? (matchesSearch && stock.starred) : matchesSearch;
  });

  const handleToggleFavorite = (symbol: string) => {
    setStocksData(stocks => 
      stocks.map(stock => 
        stock.symbol === symbol 
          ? { ...stock, starred: !stock.starred } 
          : stock
      )
    );
    
    toast({
      title: "Favorites updated",
      description: `${symbol} ${stocksData.find(s => s.symbol === symbol)?.starred ? 'removed from' : 'added to'} favorites`,
    });
  };

  const handleCreateWatchlist = (data: WatchlistFormValues) => {
    const newWatchlist = {
      id: watchlists.length + 1,
      name: data.name,
      description: data.description,
      symbols: 0,
    };
    
    setWatchlists([...watchlists, newWatchlist]);
    setActiveWatchlist(newWatchlist.id.toString());
    setOpenNewWatchlistDialog(false);
    watchlistForm.reset();
    
    toast({
      title: "Watchlist created",
      description: `${data.name} watchlist has been created`
    });
  };

  const handleEditWatchlist = (data: WatchlistFormValues) => {
    if (!editingWatchlist) return;
    
    setWatchlists(lists => 
      lists.map(list => 
        list.id === editingWatchlist.id 
          ? { ...list, name: data.name, description: data.description } 
          : list
      )
    );
    
    setOpenEditWatchlistDialog(false);
    setEditingWatchlist(null);
    
    toast({
      title: "Watchlist updated",
      description: `${data.name} watchlist has been updated`
    });
  };

  const handleDeleteWatchlist = () => {
    if (!watchlistToDelete) return;
    
    setWatchlists(lists => lists.filter(list => list.id !== watchlistToDelete));
    
    if (activeWatchlist === watchlistToDelete.toString() && watchlists.length > 1) {
      setActiveWatchlist(watchlists[0].id.toString());
    }
    
    setOpenDeleteWatchlistDialog(false);
    setWatchlistToDelete(null);
    
    toast({
      title: "Watchlist deleted",
      description: `Watchlist has been removed`
    });
  };

  const handleAddSymbol = (data: SymbolFormValues) => {
    const newSymbol = {
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price: Math.random() * 500 + 50,
      change: Math.random() * 10 - 5,
      changePercent: Math.random() * 5 - 2.5,
      volume: `${Math.floor(Math.random() * 30) + 1}.${Math.floor(Math.random() * 9)}M`,
      marketCap: `${Math.floor(Math.random() * 1000) + 1}.${Math.floor(Math.random() * 9)}B`,
      starred: false,
    };
    
    setStocksData([newSymbol, ...stocksData]);
    
    // Update watchlist symbols count
    setWatchlists(lists => 
      lists.map(list => 
        list.id.toString() === activeWatchlist 
          ? { ...list, symbols: list.symbols + 1 } 
          : list
      )
    );
    
    setOpenAddSymbolDialog(false);
    symbolForm.reset();
    
    toast({
      title: "Symbol added",
      description: `${data.symbol.toUpperCase()} has been added to the watchlist`
    });
  };

  const handleRemoveSymbol = (symbol: string) => {
    setStocksData(stocks => stocks.filter(stock => stock.symbol !== symbol));
    
    // Update watchlist symbols count
    setWatchlists(lists => 
      lists.map(list => 
        list.id.toString() === activeWatchlist 
          ? { ...list, symbols: list.symbols - 1 } 
          : list
      )
    );
    
    toast({
      title: "Symbol removed",
      description: `${symbol} has been removed from the watchlist`
    });
  };

  const openEditDialog = (watchlist: typeof watchlists[0]) => {
    setEditingWatchlist(watchlist);
    watchlistForm.reset({
      name: watchlist.name,
      description: watchlist.description
    });
    setOpenEditWatchlistDialog(true);
  };

  const openDeleteDialog = (id: number) => {
    setWatchlistToDelete(id);
    setOpenDeleteWatchlistDialog(true);
  };

  return (
    <DashboardLayout pageTitle="Watchlists">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Watchlists</h1>
            <p className="text-muted-foreground">Monitor and track your favorite securities</p>
          </div>
          <Dialog open={openNewWatchlistDialog} onOpenChange={setOpenNewWatchlistDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Watchlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Watchlist</DialogTitle>
                <DialogDescription>
                  Add a new watchlist to organize your securities
                </DialogDescription>
              </DialogHeader>
              <Form {...watchlistForm}>
                <form onSubmit={watchlistForm.handleSubmit(handleCreateWatchlist)} className="space-y-4">
                  <FormField
                    control={watchlistForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Watchlist" {...field} />
                        </FormControl>
                        <FormDescription>A short name for your watchlist</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={watchlistForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe this watchlist" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Watchlist</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>My Watchlists</CardTitle>
              <CardDescription>
                {watchlists.length} watchlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {watchlists.map((watchlist) => (
                  <div key={watchlist.id} className="flex flex-col space-y-1">
                    <Button
                      variant={activeWatchlist === watchlist.id.toString() ? 'default' : 'outline'}
                      className="w-full justify-between"
                      onClick={() => setActiveWatchlist(watchlist.id.toString())}
                    >
                      <div className="flex flex-col items-start">
                        <span>{watchlist.name}</span>
                        <span className="text-xs text-muted-foreground">{watchlist.symbols} symbols</span>
                      </div>
                      <div className="flex">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(watchlist);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(watchlist.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    watchlistForm.reset({ name: '', description: '' });
                    setOpenNewWatchlistDialog(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Watchlist
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>{activeWatchlistData?.name || 'Watchlist'}</CardTitle>
                  <CardDescription>{activeWatchlistData?.description || 'Your securities'}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={openEditWatchlistDialog} onOpenChange={setOpenEditWatchlistDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Watchlist</DialogTitle>
                        <DialogDescription>
                          Update your watchlist details
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...watchlistForm}>
                        <form onSubmit={watchlistForm.handleSubmit(handleEditWatchlist)} className="space-y-4">
                          <FormField
                            control={watchlistForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="My Watchlist" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={watchlistForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe this watchlist" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={openAddSymbolDialog} onOpenChange={setOpenAddSymbolDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Symbol
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Stock Symbol</DialogTitle>
                        <DialogDescription>
                          Add a new security to your watchlist
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...symbolForm}>
                        <form onSubmit={symbolForm.handleSubmit(handleAddSymbol)} className="space-y-4">
                          <FormField
                            control={symbolForm.control}
                            name="symbol"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Symbol</FormLabel>
                                <FormControl>
                                  <Input placeholder="AAPL" {...field} />
                                </FormControl>
                                <FormDescription>Stock ticker symbol (e.g., AAPL, MSFT)</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={symbolForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Apple Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit">Add Symbol</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search symbols..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs 
                  defaultValue="all" 
                  value={showFavorites ? "favorites" : "all"} 
                  onValueChange={(value) => setShowFavorites(value === "favorites")}
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
                    {filteredStocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {showFavorites 
                            ? "No favorite stocks found. Star some stocks to add them to favorites." 
                            : "No stocks found matching your search criteria."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStocks.map((stock) => (
                        <TableRow key={stock.symbol}>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleToggleFavorite(stock.symbol)}
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
                                onClick={() => handleRemoveSymbol(stock.symbol)}
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
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Gainers</CardTitle>
              <CardDescription>Best performing stocks today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stocksData
                  .filter(stock => stock.changePercent > 0)
                  .sort((a, b) => b.changePercent - a.changePercent)
                  .slice(0, 5)
                  .map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${stock.price.toFixed(2)}</div>
                        <div className="text-xs text-green-600">+{stock.changePercent.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Losers</CardTitle>
              <CardDescription>Worst performing stocks today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stocksData
                  .filter(stock => stock.changePercent < 0)
                  .sort((a, b) => a.changePercent - b.changePercent)
                  .slice(0, 5)
                  .map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${stock.price.toFixed(2)}</div>
                        <div className="text-xs text-red-600">{stock.changePercent.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>By Market Cap</CardTitle>
              <CardDescription>Largest companies by capitalization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stocksData
                  .sort((a, b) => {
                    const aValue = parseFloat(a.marketCap.replace(/[^0-9.]/g, ''));
                    const bValue = parseFloat(b.marketCap.replace(/[^0-9.]/g, ''));
                    return bValue - aValue;
                  })
                  .slice(0, 5)
                  .map((stock, index) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          <Badge variant="outline" className="mr-2">{index + 1}</Badge>
                          {stock.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stock.marketCap}</div>
                        <div className="text-xs text-muted-foreground">Market Cap</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete watchlist confirmation dialog */}
      <Dialog open={openDeleteWatchlistDialog} onOpenChange={setOpenDeleteWatchlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Watchlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this watchlist? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteWatchlistDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWatchlist}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Watchlists;
