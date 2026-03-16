import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { userService } from '@/services/user.service';

/**
 * Hook to fetch paginated user activity from the backend.
 * Uses React Query for caching and automatic refetching.
 *
 * @param page - Zero-based page index
 * @param size - Number of items per page
 * @param type - Activity category filter: 'all' | 'trade' | 'login' | 'broker' | 'setting'
 */
export const useActivity = (page: number, size: number, type: string) => {
    return useQuery({
        queryKey: ['activity', page, size, type],
        queryFn: () => userService.getActivity(page, size, type),
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};
