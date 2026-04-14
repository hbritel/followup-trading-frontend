import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicProfileService } from '@/services/publicProfile.service';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

const MY_PROFILE_KEY = ['social', 'my-profile'];
const BROWSE_KEY = ['social', 'browse'];

export const useMyPublicProfile = () => {
  return useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: async () => {
      try {
        return await publicProfileService.getMyProfile();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publicProfileService.createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      toast.success('Public profile created.');
    },
    onError: () => {
      toast.error('Failed to create profile. Please try again.');
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publicProfileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      toast.success('Profile updated.');
    },
    onError: () => {
      toast.error('Failed to update profile. Please try again.');
    },
  });
};

export const useRefreshMetrics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publicProfileService.refreshMetrics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_PROFILE_KEY });
      toast.success('Profile metrics refreshed.');
    },
    onError: (error: unknown) => {
      const isRateLimited = error instanceof Error && 'isRateLimited' in error;
      if (!isRateLimited) {
        toast.error('Failed to refresh metrics. Please try again.');
      }
    },
  });
};

export const useBrowseProfiles = (page: number, size: number, sort: string) => {
  return useQuery({
    queryKey: [...BROWSE_KEY, page, size, sort],
    queryFn: () => publicProfileService.browseProfiles(page, size, sort),
    staleTime: 60 * 1000,
  });
};

export const usePublicProfile = (username: string | undefined) => {
  return useQuery({
    queryKey: ['social', 'profile', username],
    queryFn: () => publicProfileService.getPublicProfile(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
};
