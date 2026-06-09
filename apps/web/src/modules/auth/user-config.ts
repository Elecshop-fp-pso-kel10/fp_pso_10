import { authApi } from '@/modules/auth/api/auth-api';

// Axios error shape for retry logic
interface ApiError {
  response?: {
    status?: number;
  };
}

export const userQueryConfig = {
  queryKey: ['user'],
  queryFn: authApi.getProfile,
  retry: (failureCount: number, error: ApiError) => {  // was: any
    if (error?.response?.status === 401) {
      return failureCount < 1;
    }
    if (error?.response?.status === 403) {
      return false;
    }
    return failureCount < 3;
  },
  staleTime: 1000 * 60 * 5,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;