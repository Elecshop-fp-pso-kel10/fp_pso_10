import axios from 'axios';

export const apiClient = axios.create({
  baseURL: typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL : '/v1',
  withCredentials: true,
});
