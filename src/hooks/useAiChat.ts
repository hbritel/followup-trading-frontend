import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { aiService, type AiChatMessageResponse } from '@/services/ai.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useAiChat = (): UseAiChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const history: AiChatMessageResponse[] = await aiService.getChatHistory();
      setMessages(
        history.map((msg) => ({
          id: msg.id,
          role: (msg.role?.toLowerCase() ?? 'assistant') as 'user' | 'assistant',
          content: msg.content,
          createdAt: msg.createdAt,
        })),
      );
    } catch {
      // Non-blocking — history load failure is silent on first open
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await aiService.clearChatHistory();
      setMessages([]);
    } catch {
      toast.error('Failed to clear chat history. Please try again.');
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const assistantPlaceholder: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsStreaming(true);

    const assistantId = assistantPlaceholder.id;

    try {
      const response = await aiService.sendChatMessage(text.trim());

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();

          if (dataStr === '[DONE]') {
            setIsStreaming(false);
            readerRef.current = null;
            return;
          }

          try {
            const parsed = JSON.parse(dataStr) as { token?: string };
            if (parsed.token) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: msg.content + parsed.token }
                    : msg,
                ),
              );
            }
          } catch {
            // Malformed JSON line — skip silently
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred.';

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
              }
            : msg,
        ),
      );

      toast.error('AI Coach is unavailable. Please try again later.');
    } finally {
      setIsStreaming(false);
      readerRef.current = null;
    }
  }, [isStreaming]);

  // Cancel any in-progress stream on unmount
  const cancelStream = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel().catch(() => undefined);
      readerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Expose cancel for cleanup — consumers can call it if needed
  void cancelStream;

  return { messages, isStreaming, sendMessage, loadHistory, clearHistory };
};
