// src/services/trade.service.ts
import apiClient from './apiClient';
import type { Trade } from '@/components/trades/TradesTableWrapper';

// --- Backend DTO types (match TradeDto.Response from Java backend) ---

/** Tag object returned by the backend */
interface TagResponse {
    id: string;
    name: string;
}

/** Strategy object returned by the backend */
interface StrategyResponse {
    id: string;
    name: string;
}

/**
 * Raw response shape from GET /api/v1/trades.
 * Field names match the Java TradeDto.Response exactly.
 */
export interface TradeApiResponse {
    id: string;
    symbol: string;
    direction: string;        // "LONG" | "SHORT"
    status: string;           // "OPEN" | "CLOSED"
    entryDate: string;
    exitDate: string | null;
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    stopLoss: number | null;
    takeProfit: number | null;
    profitLoss: number | null;           // backend name
    profitLossPercentage: number | null;  // backend name
    fees: number | null;
    notes: string | null;
    tags: TagResponse[];
    strategies: StrategyResponse[];
    createdAt: string;
    updatedAt: string;
    balance?: number;
}

export interface PageDto<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface TradeListParams {
    page?: number;
    size?: number;
    accountIds?: string;
    direction?: string;
    status?: string;
    searchText?: string;
    entryDateFrom?: string;
    entryDateTo?: string;
}

export interface AnalyticsDashboard {
    totalProfitLoss: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalFees: number;
    longProfitLoss: number;
    shortProfitLoss: number;
    bestTrade: number;
    worstTrade: number;
    priorEquity: number;
    equityCurve: { date: string; dailyProfit: number; dailyVolume: number }[];
}

// --- Mapping: Backend DTO → Frontend Trade type ---

/**
 * Maps a raw backend TradeApiResponse to the frontend Trade interface.
 * Handles field renaming and type normalization.
 */
export const mapApiResponseToTrade = (r: TradeApiResponse): Trade => ({
    id: r.id,
    symbol: r.symbol,
    type: r.direction?.toLowerCase() as Trade['type'],       // LONG → long
    status: r.status?.toLowerCase() as Trade['status'],       // CLOSED → closed
    direction: r.direction?.toLowerCase() as Trade['direction'],
    entryDate: r.entryDate,
    exitDate: r.exitDate ?? undefined,
    entryPrice: r.entryPrice,
    exitPrice: r.exitPrice ?? undefined,
    quantity: r.quantity,
    stopLoss: r.stopLoss ?? undefined,
    takeProfit: r.takeProfit ?? undefined,
    profit: r.profitLoss ?? undefined,                        // renamed
    profitPercentage: r.profitLossPercentage ?? undefined,    // renamed
    fees: r.fees ?? undefined,
    notes: r.notes ?? undefined,
    tags: r.tags?.map(t => t.name) ?? [],
    strategy: r.strategies?.[0]?.name ?? undefined,
    currency: 'USD',   // backend doesn't send currency yet
    balance: r.balance !== undefined && r.balance !== null ? r.balance : undefined, // Check for running balance
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
});

// --- Helpers ---

/**
 * Format a monetary value using the trade's currency.
 * Example: formatCurrency(100.50, 'USD') => "$100.50"
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // Fallback for unknown currency codes
        return `${currency} ${amount.toFixed(2)}`;
    }
};

// --- Service ---
export const tradeService = {
    /**
     * Get paginated trades for the authenticated user.
     * Backend returns PageDto<TradeDto.Response>.
     */
    getTrades: async (params?: TradeListParams): Promise<PageDto<Trade>> => {
        const searchBody: Record<string, unknown> = {
            page: params?.page || 0,
            size: params?.size || 50,
        };
        if (params?.accountIds) searchBody.accountIds = [params.accountIds];
        if (params?.direction) searchBody.direction = params.direction.toUpperCase();
        if (params?.status) searchBody.status = params.status.toUpperCase();
        if (params?.searchText) searchBody.searchText = params.searchText;
        if (params?.entryDateFrom) searchBody.entryDateFrom = params.entryDateFrom;
        if (params?.entryDateTo) searchBody.entryDateTo = params.entryDateTo;

        const response = await apiClient.post<any>('/trades/search', searchBody);
        
        const mappedContent = (response.data.trades || []).map(mapApiResponseToTrade);
        
        return {
            content: mappedContent,
            pageNumber: response.data.page,
            pageSize: response.data.size,
            totalElements: response.data.totalCount,
            totalPages: response.data.totalPages,
            last: response.data.page >= (response.data.totalPages - 1)
        };
    },

    /**
     * Get Dashboard Analytics from the new aggregated SQL endpoint.
     */
    getAnalytics: async (accountIds?: string, startDate?: string, endDate?: string): Promise<AnalyticsDashboard> => {
        const params: Record<string, string> = {};
        if (accountIds) params.accountIds = accountIds;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await apiClient.get<AnalyticsDashboard>('/analytics/dashboard', {
            params: Object.keys(params).length > 0 ? params : undefined,
        });
        return response.data;
    },

    /**
     * Get a single trade by ID.
     */
    getTrade: async (tradeId: string): Promise<Trade> => {
        const response = await apiClient.get<TradeApiResponse>(`/trades/${tradeId}`);
        return mapApiResponseToTrade(response.data);
    },

    /**
     * Delete a trade.
     */
    deleteTrade: async (tradeId: string): Promise<void> => {
        await apiClient.delete(`/trades/${tradeId}`);
    },

    /**
     * Fetch all trades (unpaginated) for export.
     * Sends a large page size to get everything in one request.
     */
    getAllTrades: async (accountIds?: string): Promise<Trade[]> => {
        const searchBody = {
            page: 0,
            size: 10000,
            accountIds: accountIds ? [accountIds] : undefined
        };
        const response = await apiClient.post<any>('/trades/search', searchBody);
        return (response.data.trades || []).map(mapApiResponseToTrade);
    },
};
