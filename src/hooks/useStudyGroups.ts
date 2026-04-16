import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyGroupService } from '@/services/studyGroup.service';
import type { CreateGroupRequestDto } from '@/types/dto';

const KEYS = {
  publicGroups: ['study-groups', 'public'] as const,
  myGroups: ['study-groups', 'my'] as const,
  detail: (id: string) => ['study-groups', id] as const,
  members: (id: string) => ['study-groups', id, 'members'] as const,
};

export const usePublicGroups = () =>
  useQuery({
    queryKey: KEYS.publicGroups,
    queryFn: () => studyGroupService.getPublicGroups(),
    staleTime: 2 * 60_000,
    gcTime: 15 * 60_000,
  });

export const useMyGroups = () =>
  useQuery({
    queryKey: KEYS.myGroups,
    queryFn: () => studyGroupService.getMyGroups(),
    staleTime: 2 * 60_000,
    gcTime: 15 * 60_000,
  });

export const useGroupDetail = (id: string) =>
  useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => studyGroupService.getGroupDetail(id),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useGroupMembers = (id: string) =>
  useQuery({
    queryKey: KEYS.members(id),
    queryFn: () => studyGroupService.getMembers(id),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useCreateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupRequestDto) => studyGroupService.createGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myGroups });
      qc.invalidateQueries({ queryKey: KEYS.publicGroups });
    },
  });
};

export const useJoinGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studyGroupService.joinGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-groups'] });
    },
  });
};

export const useJoinByInviteCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => studyGroupService.joinByInviteCode(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-groups'] });
    },
  });
};

export const useLeaveGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studyGroupService.leaveGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-groups'] });
    },
  });
};

export const useDeleteGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studyGroupService.deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-groups'] });
    },
  });
};
