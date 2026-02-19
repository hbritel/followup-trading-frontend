// src/services/trade.service.ts
import apiClient from './apiClient';

// --- Types ---
export interface TradeResponse {
    id: string;
    symbol: string;
    type: string;
    status: string;
    direction: string;
    entryDate: string;
    exitDate: string | null;
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    profit: number | null;
    profitPercentage: number | null;
    commission: number | null;
    swap: number | null;
    currency: string;
    stopLoss: number | null;
    takeProfit: number | null;
    notes: string | null;
    tags: string[];
    strategy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TradeListParams {
    page?: number;
    size?: number;
    status?: string;
    type?: string;
    symbol?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

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
     */
    getTrades: async (params?: TradeListParams): Promise<PaginatedResponse<TradeResponse>> => {
        const response = await apiClient.get<PaginatedResponse<TradeResponse>>('/trades', { params });
        return response.data;
    },

    /**
     * Get a single trade by ID.
     */
    getTrade: async (tradeId: string): Promise<TradeResponse> => {
        const response = await apiClient.get<TradeResponse>(`/trades/${tradeId}`);
        return response.data;
    },

    /**
     * Delete a trade.
     */
    deleteTrade: async (tradeId: string): Promise<void> => {
        await apiClient.delete(`/trades/${tradeId}`);
    },
};
