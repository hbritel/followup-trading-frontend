// src/services/broker.service.ts
import apiClient from './apiClient';

// --- Types ---
export interface BrokerConnectionResponse {
    id: string;
    brokerType: string;
    displayName: string;
    connectionStatus: string;
    syncFrequency: string;
    enabled: boolean;
    lastSyncTime: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SyncResultResponse {
    id: string;
    status: string;
    startTime: string;
    endTime: string | null;
    tradesImported: number;
    tradesSkipped: number;
    tradesFailed: number;
    errorMessage: string | null;
}

export interface ConnectBrokerRequest {
    brokerType: string;
    credentials: string;
    syncFrequency?: string;
    displayName?: string;
}

// --- Service ---
export const brokerService = {
    /**
     * Get all broker connections for the authenticated user.
     */
    getConnections: async (): Promise<BrokerConnectionResponse[]> => {
        const response = await apiClient.get<BrokerConnectionResponse[]>('/broker-connections');
        return response.data;
    },

    /**
     * Connect a new broker.
     */
    connectBroker: async (request: ConnectBrokerRequest): Promise<BrokerConnectionResponse> => {
        const response = await apiClient.post<BrokerConnectionResponse>('/broker-connections', request);
        return response.data;
    },

    /**
     * Disconnect (delete) a broker connection.
     */
    disconnectBroker: async (connectionId: string): Promise<void> => {
        await apiClient.delete(`/broker-connections/${connectionId}`);
    },

    /**
     * Trigger a sync for a specific connection.
     * Sends an Idempotency-Key header to prevent duplicate syncs.
     */
    syncConnection: async (connectionId: string, idempotencyKey?: string): Promise<SyncResultResponse> => {
        const headers: Record<string, string> = {};
        if (idempotencyKey) {
            headers['Idempotency-Key'] = idempotencyKey;
        }
        const response = await apiClient.post<SyncResultResponse>(
            `/broker-connections/${connectionId}/sync`,
            {},
            { headers }
        );
        return response.data;
    },

    /**
     * Sync all active connections.
     */
    syncAll: async (): Promise<SyncResultResponse[]> => {
        const response = await apiClient.post<SyncResultResponse[]>('/broker-connections/sync-all');
        return response.data;
    },

    /**
     * Get sync history for a connection.
     */
    getSyncHistory: async (connectionId: string): Promise<SyncResultResponse[]> => {
        const response = await apiClient.get<SyncResultResponse[]>(
            `/broker-connections/${connectionId}/sync/history`
        );
        return response.data;
    },

    /**
     * Test a broker connection.
     */
    testConnection: async (connectionId: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post<{ success: boolean; message: string }>(
            `/broker-connections/${connectionId}/test`
        );
        return response.data;
    },

    /**
     * Get list of supported broker types.
     */
    getSupportedBrokers: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/broker-connections/supported');
        return response.data;
    },
};
