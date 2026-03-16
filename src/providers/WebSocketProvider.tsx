import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '@/contexts/auth-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface WebSocketContextValue {
  /** Raw STOMP client — use the `subscribe` helper instead when possible. */
  client: Client | null;
  /** Current connection state. */
  connected: boolean;
  connectionState: ConnectionState;
  /**
   * Subscribe to a STOMP topic.
   * Returns an unsubscribe function — call it in your cleanup (useEffect return).
   *
   * @example
   * useEffect(() => subscribe('/topic/prices/123', (msg) => …), [subscribe]);
   */
  subscribe: (topic: string, callback: (message: IMessage) => void) => () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Backoff helper — 1s → 2s → 4s → 8s → … → 30s cap
// ---------------------------------------------------------------------------

const calcBackoff = (attempt: number): number =>
  Math.min(1000 * Math.pow(2, attempt), 30_000);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  // Keep a stable map of active subscriptions so we can re-subscribe after
  // a disconnect/reconnect cycle without requiring consumers to re-register.
  const pendingSubscriptions = useRef<
    Map<string, (message: IMessage) => void>
  >(new Map());

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (clientRef.current?.active) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setConnectionState('connecting');

    const stompClient = new Client({
      // SockJS factory — used instead of a plain WebSocket URL so the
      // transport falls back gracefully (xhr-streaming → long-polling, etc.)
      webSocketFactory: () => new SockJS('/ws') as unknown as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      // We handle reconnect manually so we can apply exponential backoff and
      // only reconnect when the user is still authenticated.
      reconnectDelay: 0,

      onConnect: () => {
        reconnectAttemptRef.current = 0;
        setConnectionState('connected');

        // Re-subscribe all pending topics (important after a reconnect)
        pendingSubscriptions.current.forEach((callback, topic) => {
          stompClient.subscribe(topic, callback);
        });
      },

      onDisconnect: () => {
        setConnectionState('disconnected');
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message'], frame.body);
        setConnectionState('disconnected');
        scheduleReconnect();
      },

      onWebSocketError: (event) => {
        console.error('[WebSocket] WebSocket error:', event);
        setConnectionState('disconnected');
        scheduleReconnect();
      },

      onWebSocketClose: () => {
        setConnectionState('disconnected');
        scheduleReconnect();
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleReconnect = useCallback(() => {
    // Don't reconnect if user logged out
    if (!localStorage.getItem('accessToken')) return;
    clearReconnectTimer();

    const delay = calcBackoff(reconnectAttemptRef.current);
    reconnectAttemptRef.current += 1;

    console.debug(
      `[WebSocket] Scheduling reconnect attempt ${reconnectAttemptRef.current} in ${delay}ms`
    );

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connect();
    }, delay);
  }, [clearReconnectTimer, connect]);

  // Connect when the user becomes authenticated; disconnect on logout.
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      // User logged out — tear everything down cleanly
      clearReconnectTimer();
      reconnectAttemptRef.current = 0;

      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
      clientRef.current = null;
      pendingSubscriptions.current.clear();
      setConnectionState('disconnected');
    }

    return () => {
      clearReconnectTimer();
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
    };
  }, [isAuthenticated, connect, clearReconnectTimer]);

  // ---------------------------------------------------------------------------
  // Public subscribe helper
  // ---------------------------------------------------------------------------

  const subscribe = useCallback(
    (topic: string, callback: (message: IMessage) => void): (() => void) => {
      // Register in the pending map so it survives reconnects
      pendingSubscriptions.current.set(topic, callback);

      let stompSub: StompSubscription | null = null;

      if (clientRef.current?.connected) {
        stompSub = clientRef.current.subscribe(topic, callback);
      }

      return () => {
        pendingSubscriptions.current.delete(topic);
        stompSub?.unsubscribe();
      };
    },
    []
  );

  const value: WebSocketContextValue = {
    client: clientRef.current,
    connected: connectionState === 'connected',
    connectionState,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
