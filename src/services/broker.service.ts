// src/services/broker.service.ts
import apiClient from './apiClient';

// --- Types ---
export interface BrokerConnectionResponse {
    id: string;
    brokerType: string;
    brokerCode?: string;
    protocol?: string;
    brokerDisplayName?: string;
    displayName: string;
    status: string;
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
    brokerType?: string; // Legacy
    brokerCode?: string; // New flow
    protocol?: string;   // New flow
    displayName?: string;
    credentials: string; // Must be a JSON string for the backend
    syncFrequency?: string;
}

export interface BrokerResponse {
    code: string;
    displayName: string;
    logoUrl?: string;
    propFirm: boolean;
    country?: string;
    defaultProtocol: string;
    supportedProtocols: {
        protocol: string;
        displayName: string;
    }[];
}

export interface CredentialField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    helpText?: string;
}

export interface CredentialSchemaResponse {
    brokerCode: string;
    brokerName: string;
    protocol: string;
    protocolName: string;
    fields: CredentialField[];
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
     * Get the catalog of supported brokers.
     */
    getBrokers: async (): Promise<BrokerResponse[]> => {
        const response = await apiClient.get<BrokerResponse[]>('/brokers');
        return response.data;
    },

    /**
     * Get the credential schema (required fields) for a specific broker & protocol.
     */
    getCredentialSchema: async (brokerCode: string, protocol?: string): Promise<CredentialSchemaResponse> => {
        const response = await apiClient.get<CredentialSchemaResponse>(`/brokers/${brokerCode}/credential-schema`, {
            params: protocol ? { protocol } : {}
        });
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
     * Update broker connection settings.
     */
    updateSettings: async (connectionId: string, request: { syncFrequency?: string; enabled?: boolean; displayName?: string }): Promise<BrokerConnectionResponse> => {
        const response = await apiClient.put<BrokerConnectionResponse>(`/broker-connections/${connectionId}/settings`, request);
        return response.data;
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
