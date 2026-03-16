import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { journalService } from '@/services/journal.service';
import type { JournalEntryRequestDto } from '@/types/dto';

const JOURNAL_KEY = ['journal'];

export const useJournalEntries = () => {
  return useQuery({
    queryKey: JOURNAL_KEY,
    queryFn: () => journalService.getEntries(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

export const useJournalEntryByDate = (date: string) => {
  return useQuery({
    queryKey: [...JOURNAL_KEY, 'date', date],
    queryFn: () => journalService.getEntryByDate(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: JournalEntryRequestDto) => journalService.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY });
    },
  });
};

export const useUpdateJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JournalEntryRequestDto }) =>
      journalService.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY });
    },
  });
};

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => journalService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY });
    },
  });
};
