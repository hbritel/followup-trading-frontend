import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/hooks/useAiChat';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

/**
 * Parses minimal markdown: **bold**, *italic*, `code`, and bullet lists.
 * Returns an array of React nodes.
 */
const parseMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const isBullet = /^[\s]*[-*]\s/.test(line);
    const content = isBullet ? line.replace(/^[\s]*[-*]\s/, '') : line;

    // Parse inline formatting within a line
    const inlineNodes = parseInline(content, `${lineIndex}`);

    if (isBullet) {
      nodes.push(
        <li key={`li-${lineIndex}`} className="ml-4 list-disc">
          {inlineNodes}
        </li>,
      );
    } else if (line.trim() === '') {
      nodes.push(<br key={`br-${lineIndex}`} />);
    } else {
      nodes.push(<span key={`span-${lineIndex}`}>{inlineNodes}</span>);
      if (lineIndex < lines.length - 1) {
        nodes.push(<br key={`br-after-${lineIndex}`} />);
      }
    }
  });

  return nodes;
};

const parseInline = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, `code` — in that order of precedence
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`${keyPrefix}-text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </React.Fragment>,
      );
    }

    if (match[2] !== undefined) {
      // **bold**
      parts.push(
        <strong key={`${keyPrefix}-bold-${match.index}`} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined) {
      // *italic*
      parts.push(
        <em key={`${keyPrefix}-italic-${match.index}`} className="italic">
          {match[3]}
        </em>,
      );
    } else if (match[4] !== undefined) {
      // `code`
      parts.push(
        <code
          key={`${keyPrefix}-code-${match.index}`}
          className="rounded bg-black/20 px-1 py-0.5 font-mono text-xs"
        >
          {match[4]}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    parts.push(
      <React.Fragment key={`${keyPrefix}-text-end`}>
        {text.slice(lastIndex)}
      </React.Fragment>,
    );
  }

  return parts;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && isStreaming;

  const formattedTime = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex w-full gap-2',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'glass-card text-foreground',
        )}
      >
        {isEmpty ? (
          /* Animated dots while waiting for first token */
          <span className="flex items-center gap-1" aria-label="AI is thinking">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
          </span>
        ) : (
          <>
            <div className="whitespace-pre-wrap break-words">
              {parseMarkdown(message.content)}
              {isStreaming && !isUser && (
                <span className="ml-0.5 inline-block animate-pulse select-none font-normal opacity-70">
                  |
                </span>
              )}
            </div>
          </>
        )}

        <p
          className={cn(
            'mt-1.5 text-[10px] tabular-nums',
            isUser ? 'text-primary-foreground/60' : 'text-muted-foreground',
          )}
        >
          {formattedTime}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
