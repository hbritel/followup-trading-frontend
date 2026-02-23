import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  brokerService,
  type BrokerResponse,
  type BrokerConnectionResponse,
  type CredentialSchemaResponse,
  type ConnectBrokerRequest,
} from '@/services/broker.service';

/**
 * Fetch the broker catalog (all available brokers).
 * GET /api/v1/brokers
 */
export const useBrokers = () => {
  return useQuery<BrokerResponse[]>({
    queryKey: ['brokers'],
    queryFn: brokerService.getBrokers,
    staleTime: 30 * 60 * 1000,   // Broker catalog rarely changes
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

/**
 * Fetch the user's existing broker connections.
 * GET /api/v1/broker-connections
 */
export const useBrokerConnections = () => {
  return useQuery<BrokerConnectionResponse[]>({
    queryKey: ['broker-connections'],
    queryFn: brokerService.getConnections,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

/**
 * Fetch credential schema for a broker + protocol combination.
 * GET /api/v1/brokers/{code}/credential-schema?protocol=
 */
export const useCredentialSchema = (brokerCode: string | null, protocol?: string) => {
  return useQuery<CredentialSchemaResponse>({
    queryKey: ['credential-schema', brokerCode, protocol],
    queryFn: () => brokerService.getCredentialSchema(brokerCode!, protocol),
    enabled: !!brokerCode,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Mutation to connect a new broker.
 * POST /api/v1/broker-connections
 * Automatically invalidates the broker-connections cache on success.
 */
export const useConnectBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ConnectBrokerRequest) => brokerService.connectBroker(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
    },
  });
};

/**
 * Mutation to disconnect a broker.
 * DELETE /api/v1/broker-connections/{id}
 */
export const useDisconnectBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => brokerService.disconnectBroker(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
    },
  });
};

/**
 * Mutation to trigger a sync for a specific connection.
 * POST /api/v1/broker-connections/{id}/sync
 */
export const useSyncConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => brokerService.syncConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-connections'] });
    },
  });
};

/**
 * Mutation to test a broker connection.
 * POST /api/v1/broker-connections/{id}/test
 */
export const useTestConnection = () => {
  return useMutation({
    mutationFn: (connectionId: string) => brokerService.testConnection(connectionId),
  });
};
