import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mentorService } from '@/services/mentor.service';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import type { CreateInstanceRequestDto, UpdateSharingRequestDto } from '@/types/dto';

const INSTANCE_KEY = ['mentor', 'instance'];
const STUDENTS_KEY = ['mentor', 'students'];
const MY_MENTOR_KEY = ['mentor', 'my-instance'];

// ── Mentor (teacher) hooks ──────────────────────────────────

export const useMentorInstance = () => {
  return useQuery({
    queryKey: INSTANCE_KEY,
    queryFn: mentorService.getMyInstance,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInstanceRequestDto) => mentorService.createInstance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success('Mentor instance created.');
    },
    onError: () => {
      toast.error('Failed to create mentor instance.');
    },
  });
};

export const useUpdateInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateInstanceRequestDto>) => mentorService.updateInstance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      toast.success('Mentor instance updated.');
    },
    onError: () => {
      toast.error('Failed to update mentor instance.');
    },
  });
};

export const useMentorStudents = () => {
  return useQuery({
    queryKey: STUDENTS_KEY,
    queryFn: mentorService.getStudents,
    staleTime: 60 * 1000,
  });
};

export const useRemoveStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => mentorService.removeStudent(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      toast.success('Student removed.');
    },
    onError: () => {
      toast.error('Failed to remove student.');
    },
  });
};

export const useStudentMetrics = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'student-metrics', userId],
    queryFn: () => mentorService.getStudentMetrics(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

export const useStudentTrades = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'student-trades', userId],
    queryFn: () => mentorService.getStudentTrades(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

export const useStudentPsychology = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'student-psychology', userId],
    queryFn: () => mentorService.getStudentPsychology(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
};

// ── Student hooks ───────────────────────────────────────────

export const useJoinInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => mentorService.joinInstance(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_KEY });
      toast.success('Joined!');
    },
    onError: () => {
      toast.error('Failed to join mentor instance.');
    },
  });
};

export const useLeaveInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mentorService.leaveInstance(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_KEY });
      toast.success('You have left the mentor instance.');
    },
    onError: () => {
      toast.error('Failed to leave mentor instance.');
    },
  });
};

export const useMyMentorInstance = () => {
  return useQuery({
    queryKey: MY_MENTOR_KEY,
    queryFn: async () => {
      try {
        return await mentorService.getMyMentorInstance();
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

export const useUpdateSharing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSharingRequestDto) => mentorService.updateSharing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_MENTOR_KEY });
      toast.success('Sharing preferences updated.');
    },
    onError: () => {
      toast.error('Failed to update sharing preferences.');
    },
  });
};

// ── Public hook ─────────────────────────────────────────────

export const usePublicMentorInstance = (inviteCode: string | undefined) => {
  return useQuery({
    queryKey: ['mentor', 'public', inviteCode],
    queryFn: () => mentorService.getPublicInstance(inviteCode!),
    enabled: !!inviteCode,
    staleTime: 5 * 60 * 1000,
  });
};
