import { API_CONFIG } from './contracts';

export const baseConfig = {
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers: Headers, { getState }: any) => {
    // Apply auth token if available
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
};
