// src/types/coachThread.ts
//
// Mirrors the backend ChatThreadDto returned by /api/v1/coach/threads.
// Threads are soft-archive (DELETE returns 204 and removes from list); the
// `id` is the canonical handle for all message-scoped operations.

export interface CoachThread {
  /** UUID, server-assigned. Stable across renames and message edits. */
  id: string;
  /** User-editable display name. May be empty server-side; UI falls back to "(untitled)". */
  title: string;
  /** ISO-8601 timestamp of thread creation. */
  createdAt: string;
  /** ISO-8601 timestamp of the last message in the thread (or last rename). */
  updatedAt: string;
  /**
   * Truncated preview of the most recent message in the thread.
   * Null when the thread has no messages yet (just created).
   */
  lastMessagePreview: string | null;
}
