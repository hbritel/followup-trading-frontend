import apiClient from './apiClient';
import type {
  MentorInstanceDto,
  MentorStudentDto,
  CreateInstanceRequestDto,
  UpdateSharingRequestDto,
} from '@/types/dto';

const MENTOR_BASE = '/mentor';

export const mentorService = {
  // ── Mentor (teacher) endpoints ───────────────────────────

  createInstance: (data: CreateInstanceRequestDto) =>
    apiClient.post<MentorInstanceDto>(`${MENTOR_BASE}/instance`, data),

  updateInstance: (data: Partial<CreateInstanceRequestDto>) =>
    apiClient.put<MentorInstanceDto>(`${MENTOR_BASE}/instance`, data),

  getMyInstance: () =>
    apiClient.get<MentorInstanceDto>(`${MENTOR_BASE}/instance`),

  getStudents: () =>
    apiClient.get<MentorStudentDto[]>(`${MENTOR_BASE}/students`),

  removeStudent: (userId: string) =>
    apiClient.delete(`${MENTOR_BASE}/students/${userId}`),

  getStudentMetrics: (userId: string) =>
    apiClient.get(`${MENTOR_BASE}/students/${userId}/metrics`),

  getStudentTrades: (userId: string) =>
    apiClient.get(`${MENTOR_BASE}/students/${userId}/trades`),

  getStudentPsychology: (userId: string) =>
    apiClient.get(`${MENTOR_BASE}/students/${userId}/psychology`),

  // ── Student endpoints ────────────────────────────────────

  joinInstance: (inviteCode: string) =>
    apiClient.post(`${MENTOR_BASE}/join`, { inviteCode }),

  leaveInstance: () =>
    apiClient.delete(`${MENTOR_BASE}/membership`),

  getMyMentorInstance: () =>
    apiClient.get<MentorInstanceDto>(`${MENTOR_BASE}/my-instance`),

  updateSharing: (data: UpdateSharingRequestDto) =>
    apiClient.put(`${MENTOR_BASE}/sharing`, data),

  // ── Public ───────────────────────────────────────────────

  getPublicInstance: (inviteCode: string) =>
    apiClient.get<MentorInstanceDto>(`/public/mentor/${inviteCode}`),
};
