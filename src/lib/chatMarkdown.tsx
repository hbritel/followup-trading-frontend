import React from 'react';

/**
 * Minimal inline + block markdown renderer for chat messages.
 *
 * <p>Covers exactly what an LLM reliably emits for short replies:</p>
 * <ul>
 *   <li>Paragraphs (blank line)</li>
 *   <li>Bullet lists ("- item" or "* item")</li>
 *   <li>Numbered lists ("1. item", "2. item" …)</li>
 *   <li>Inline: {@code **bold**}, {@code *italic*}, {@code `code`}</li>
 * </ul>
 *
 * <p>Deliberately does NOT try to be a full markdown engine — we don't want
 * tables, images, or link rewriting inside a chat bubble.</p>
 */
export function renderChatMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Group consecutive list items so they render inside a single <ul>/<ol>.
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const Tag: 'ul' | 'ol' = listBuffer.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={
          listBuffer.ordered
            ? 'my-1 ml-5 list-decimal space-y-0.5'
            : 'my-1 ml-5 list-disc space-y-0.5'
        }
      >
        {listBuffer.items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>,
    );
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    const orderedMatch = /^\s*\d+[.)]\s+(.*)$/.exec(line);

    if (bulletMatch) {
      if (listBuffer && listBuffer.ordered) flushList();
      listBuffer ??= { ordered: false, items: [] };
      listBuffer.items.push(bulletMatch[1]);
      continue;
    }
    if (orderedMatch) {
      if (listBuffer && !listBuffer.ordered) flushList();
      listBuffer ??= { ordered: true, items: [] };
      listBuffer.items.push(orderedMatch[1]);
      continue;
    }

    flushList();

    if (line.trim() === '') {
      blocks.push(<div key={`br-${blocks.length}`} className="h-2" />);
    } else {
      blocks.push(
        <p key={`p-${blocks.length}`} className="m-0">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();

  return <>{blocks}</>;
}

/**
 * Parses **bold**, *italic*, and `code` inside a single line.
 *
 * <p>We walk the string character-by-character instead of using a global regex
 * so that overlapping delimiters ({@code **italic bold**} for instance)
 * behave predictably.</p>
 */
function renderInline(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;

  while (i < text.length) {
    // **bold**
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2);
      if (end > i + 2) {
        tokens.push(<strong key={keyCounter++}>{text.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }
    // *italic*   (avoid matching a lone '*' that's part of '**')
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end > i + 1) {
        tokens.push(<em key={keyCounter++}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }
    // `code`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i + 1) {
        tokens.push(
          <code
            key={keyCounter++}
            className="rounded bg-muted-foreground/10 px-1 py-0.5 text-[0.9em] font-mono"
          >
            {text.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }
    // Plain char — coalesce until the next special marker for fewer nodes.
    const nextSpecial = findNextSpecial(text, i);
    tokens.push(text.slice(i, nextSpecial));
    i = nextSpecial;
  }

  return <>{tokens}</>;
}

function findNextSpecial(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === '*' || c === '`') return i;
  }
  return text.length;
}
