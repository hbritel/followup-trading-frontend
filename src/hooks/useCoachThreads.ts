import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coachChatService } from '@/services/coachChat.service';
import type { CoachThread } from '@/types/coachThread';

// ---------------------------------------------------------------------------
// Query keys — exported so external components (e.g. the chat hook on send)
// can invalidate the list when a message lands and bumps `lastMessagePreview`
// or `updatedAt` on a thread.
// ---------------------------------------------------------------------------

export const COACH_THREADS_KEY = ['coach', 'threads'] as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Lists active threads for the current user, newest-first by {@code updatedAt}.
 *
 * Stale: 30 s — threads list shifts whenever a message lands, so a short
 * staleness window keeps the sidebar responsive without hammering the API
 * on every focus event.
 */
export const useCoachThreads = () =>
  useQuery<CoachThread[]>({
    queryKey: COACH_THREADS_KEY,
    queryFn: async () => {
      const { data } = await coachChatService.listThreads();
      return data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new thread. On success, refetches the list and returns the
 * created thread to the caller — typically the sidebar then auto-selects it.
 */
export const useCreateCoachThread = () => {
  const queryClient = useQueryClient();

  return useMutation<CoachThread, Error, string | undefined>({
    mutationFn: async (title) => {
      const { data } = await coachChatService.createThread(title);
      return data;
    },
    onSuccess: (thread) => {
      // Push the new thread into the cache immediately (newest first), then
      // invalidate so the canonical list refetches in the background.
      queryClient.setQueryData<CoachThread[]>(COACH_THREADS_KEY, (prev) =>
        prev ? [thread, ...prev.filter((t) => t.id !== thread.id)] : [thread],
      );
      queryClient.invalidateQueries({ queryKey: COACH_THREADS_KEY });
    },
  });
};

/**
 * Renames a thread. Optimistic — patches the cache immediately, rolls back
 * on error so the sidebar never shows a stale title for the user's own edit.
 */
export const useRenameCoachThread = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CoachThread,
    Error,
    { id: string; title: string },
    { previous?: CoachThread[] }
  >({
    mutationFn: async ({ id, title }) => {
      const { data } = await coachChatService.renameThread(id, title);
      return data;
    },
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: COACH_THREADS_KEY });
      const previous = queryClient.getQueryData<CoachThread[]>(COACH_THREADS_KEY);
      queryClient.setQueryData<CoachThread[]>(COACH_THREADS_KEY, (prev) =>
        prev?.map((t) => (t.id === id ? { ...t, title } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(COACH_THREADS_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      // Always reconcile with the server — the rename also bumps updatedAt.
      queryClient.invalidateQueries({ queryKey: COACH_THREADS_KEY });
    },
  });
};

/**
 * Archives (soft-deletes) a thread. Optimistic — removes it from the sidebar
 * cache immediately, rolls back on error so the user's mistake doesn't leave
 * the UI in an inconsistent state.
 */
export const useArchiveCoachThread = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    string,
    { previous?: CoachThread[] }
  >({
    mutationFn: async (id) => {
      await coachChatService.archiveThread(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: COACH_THREADS_KEY });
      const previous = queryClient.getQueryData<CoachThread[]>(COACH_THREADS_KEY);
      queryClient.setQueryData<CoachThread[]>(COACH_THREADS_KEY, (prev) =>
        prev?.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(COACH_THREADS_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COACH_THREADS_KEY });
    },
  });
};
