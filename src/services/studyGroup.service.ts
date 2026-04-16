import apiClient from './apiClient';
import type { StudyGroupDto, GroupMemberDto, CreateGroupRequestDto } from '@/types/dto';

export const studyGroupService = {
  getPublicGroups: async (page = 0, size = 20): Promise<StudyGroupDto[]> => {
    const response = await apiClient.get<StudyGroupDto[]>('/study-groups', { params: { page, size } });
    return response.data;
  },

  getMyGroups: async (): Promise<StudyGroupDto[]> => {
    const response = await apiClient.get<StudyGroupDto[]>('/study-groups/my');
    return response.data;
  },

  createGroup: async (data: CreateGroupRequestDto): Promise<StudyGroupDto> => {
    const response = await apiClient.post<StudyGroupDto>('/study-groups', data);
    return response.data;
  },

  getGroupDetail: async (id: string): Promise<StudyGroupDto> => {
    const response = await apiClient.get<StudyGroupDto>(`/study-groups/${id}`);
    return response.data;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await apiClient.delete(`/study-groups/${id}`);
  },

  joinGroup: async (id: string): Promise<void> => {
    await apiClient.post(`/study-groups/${id}/join`);
  },

  joinByInviteCode: async (code: string): Promise<void> => {
    await apiClient.post(`/study-groups/join/${code}`);
  },

  leaveGroup: async (id: string): Promise<void> => {
    await apiClient.delete(`/study-groups/${id}/leave`);
  },

  getMembers: async (id: string): Promise<GroupMemberDto[]> => {
    const response = await apiClient.get<GroupMemberDto[]>(`/study-groups/${id}/members`);
    return response.data;
  },
};
