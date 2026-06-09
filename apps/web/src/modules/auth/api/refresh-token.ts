import { apiClient } from '@/lib/api-client';
import { queryClient } from '@/app/providers';

export async function refreshToken() {
  try {
    console.log('Attempting refresh token...');
    const response = await apiClient.post(
      '/auth/refresh',
      {},
      {
        withCredentials: true,
      },
    );
    console.log('Refresh response:', response.data);
    if (!response.data?.success) {
      throw new Error('Refresh failed');
    }
    return response.data;
  } catch (_error) {
    console.error('Refresh _error:', _error);
    queryClient.setQueryData(['user'], null);
    throw _error;
  }
}
