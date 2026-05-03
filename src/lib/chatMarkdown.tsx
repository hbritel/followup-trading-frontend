import React from 'react';
import CitationLink from '@/components/ai/CitationLink';

/**
 * Sprint 5 PR D — matches citation markers the coach emits when grounded
 * in long-term memory: {@code [trade:UUID]}, {@code [journal:UUID]},
 * {@code [debrief:UUID]}, {@code [briefing:UUID]}. UUIDs are validated
 * loosely (8-4-4-4-12 hex) so a typo in the LLM output renders as plain
 * text instead of a broken link.
 */
const CITATION_PATTERN =
  /^\[(trade|journal|debrief|briefing):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/i;

/**
 * Minimal inline + block markdown renderer for chat messages.
 *
 * <p>Covers exactly what an LLM reliably emits for short replies:</p>
 * <ul>
 *   <li>Paragraphs (blank line)</li>
 *   <li>Headings (# h1, ## h2, ### h3, #### h4)</li>
 *   <li>Fenced code blocks (```...```), language hint optional</li>
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
  let codeBuffer: { lang: string; lines: string[] } | null = null;

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

  const flushCode = () => {
    if (!codeBuffer) return;
    blocks.push(
      <pre
        key={`code-${blocks.length}`}
        className="my-2 overflow-x-auto rounded-md bg-muted-foreground/10 p-3 text-xs font-mono leading-relaxed"
      >
        <code>{codeBuffer.lines.join('\n')}</code>
      </pre>,
    );
    codeBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');

    // Fenced code block: opening ```lang or closing ```.
    const fenceMatch = /^\s*```(.*)$/.exec(line);
    if (fenceMatch) {
      if (codeBuffer) {
        // Closing fence — flush.
        flushCode();
      } else {
        // Opening fence — flush any list first, then start a code block.
        flushList();
        codeBuffer = { lang: fenceMatch[1].trim(), lines: [] };
      }
      continue;
    }

    if (codeBuffer) {
      codeBuffer.lines.push(rawLine);
      continue;
    }

    const headingMatch = /^\s*(#{1,4})\s+(.*)$/.exec(line);
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    const orderedMatch = /^\s*\d+[.)]\s+(.*)$/.exec(line);

    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const sizeClass =
        level === 1
          ? 'text-base font-bold mt-3 mb-1'
          : level === 2
            ? 'text-sm font-bold mt-2 mb-1'
            : level === 3
              ? 'text-sm font-semibold mt-2 mb-0.5'
              : 'text-xs font-semibold mt-1 mb-0.5 uppercase tracking-wide';
      const Tag = (`h${Math.min(level, 4)}` as 'h1' | 'h2' | 'h3' | 'h4');
      blocks.push(
        <Tag key={`h-${blocks.length}`} className={sizeClass}>
          {renderInline(content)}
        </Tag>,
      );
      continue;
    }

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
  flushCode();

  return <>{blocks}</>;
}

/**
 * Parses **bold**, *italic*, and `code` inside a single line.
 *
 * <p>Designed to be SAFE on partial / in-flight streamed text: when a marker
 * has no matching closer yet (e.g. the LLM just emitted {@code **bo} and the
 * rest is still streaming), we emit the opener verbatim and advance past it,
 * rather than looping looking for a closer that isn't there yet.</p>
 *
 * <p>The previous implementation infinite-looped on an unclosed {@code **}
 * because {@code findNextSpecial} returned the current index, and the main
 * loop didn't advance — the tokens array grew until the JS engine threw
 * "Invalid array length", crashing the chat page during streaming.</p>
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
      } else {
        // Not closed yet — emit the opener literally and move past both chars.
        tokens.push('**');
        i += 2;
      }
      continue;
    }
    // *italic*   (avoid matching a lone '*' that's part of '**')
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end > i + 1) {
        tokens.push(<em key={keyCounter++}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
      } else {
        tokens.push('*');
        i += 1;
      }
      continue;
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
      } else {
        tokens.push('`');
        i += 1;
      }
      continue;
    }
    // [trade:uuid] / [journal:uuid] / [debrief:uuid] / [briefing:uuid]
    if (text[i] === '[') {
      const slice = text.slice(i);
      const m = CITATION_PATTERN.exec(slice);
      if (m) {
        const [, type, id] = m;
        tokens.push(<CitationLink key={keyCounter++} type={type.toLowerCase()} id={id} />);
        i += m[0].length;
        continue;
      }
      // Not a citation — emit the bracket and move on.
      tokens.push('[');
      i += 1;
      continue;
    }
    // Plain char — coalesce up to the NEXT special marker. Crucially we
    // search from i+1 so progress is guaranteed even when text[i] itself
    // is a leftover character that no rule above matched.
    const nextSpecial = findNextSpecial(text, i + 1);
    tokens.push(text.slice(i, nextSpecial));
    i = nextSpecial;
  }

  return <>{tokens}</>;
}

function findNextSpecial(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === '*' || c === '`' || c === '[') return i;
  }
  return text.length;
}
