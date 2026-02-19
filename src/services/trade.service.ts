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
}

export interface TradeListParams {
    page?: number;
    size?: number;
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
     * Get trades for the authenticated user.
     * Backend returns a flat List<TradeDto.Response>, already mapped to frontend Trade type.
     */
    getTrades: async (params?: TradeListParams): Promise<Trade[]> => {
        const response = await apiClient.get<TradeApiResponse[]>('/trades', { params });
        return response.data.map(mapApiResponseToTrade);
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
};
