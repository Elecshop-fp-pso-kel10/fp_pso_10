import { refreshToken } from '@/modules/auth/api/refresh-token';
import { apiClient } from './api-client';
import { queryClient } from '@/app/providers';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;  // was: any
}> = [];

// error param typed as unknown; cast only where response shape is needed
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const resetRefreshState = () => {
  isRefreshing = false;
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async (error: unknown) => {  // was: any
    // Cast once to access axios-specific fields
    const axiosError = error as {
      config: { _retry?: boolean; url?: string };
      response?: { status: number };
    };

    const originalRequest = axiosError.config;

    if (originalRequest._retry || axiosError.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      console.warn('Refresh got stuck, resetting state');
      resetRefreshState();
      queryClient.setQueryData(['user'], null);
      queryClient.cancelQueries({ queryKey: ['user'] });
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshToken();
      processQueue(null, 'refreshed');
      return apiClient(originalRequest);
    } catch (refreshError: unknown) {  // was: _error (flagged) + referenced wrong var
      processQueue(error, null);
      throw refreshError;
    } finally {
      resetRefreshState();
    }
  },
);