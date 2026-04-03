import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { tagService } from '@/services/tag.service';
import type { TagRequestDto } from '@/types/dto';

const TAGS_KEY = ['tags'];

export const useTags = () => {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: () => tagService.getTags(),
    placeholderData: keepPreviousData,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagRequestDto) => tagService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagRequestDto }) =>
      tagService.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      // Refresh trades since tag associations are removed on delete
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};
