// src/hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { sessionService } from '@/services/session.service';
import type { UserPreferencesDto, ChangePasswordRequestDto } from '@/types/dto';

// ── Query keys ────────────────────────────────────────────────────────────────

const USER_PROFILE_KEY = ['user', 'profile'];
const USER_PREFERENCES_KEY = ['user', 'preferences'];
const USER_SESSIONS_KEY = ['user', 'sessions'];

// ── Profile ───────────────────────────────────────────────────────────────────

export const useUserProfile = () => {
  return useQuery({
    queryKey: USER_PROFILE_KEY,
    queryFn: () => userService.getUserProfile(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof userService.updateProfile>[0]) =>
      userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY });
    },
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY });
    },
  });
};

// ── Preferences ───────────────────────────────────────────────────────────────

export const useUserPreferences = () => {
  return useQuery({
    queryKey: USER_PREFERENCES_KEY,
    queryFn: () => userService.getUserPreferences(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<UserPreferencesDto>) =>
      userService.updateUserPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_KEY });
    },
  });
};

// ── Password ──────────────────────────────────────────────────────────────────

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwords: ChangePasswordRequestDto) =>
      userService.changePassword(passwords),
  });
};

// ── Sessions ──────────────────────────────────────────────────────────────────

export const useUserSessions = () => {
  return useQuery({
    queryKey: USER_SESSIONS_KEY,
    queryFn: () => sessionService.getActiveSessions(),
    staleTime: 60 * 1000, // 1 min — sessions change more frequently
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_SESSIONS_KEY });
    },
  });
};
