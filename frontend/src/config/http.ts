// Access environment variables for API configuration
const API_CONFIG = {
  BASE_URL: '/api' // This will be proxied by Vite's dev server
};

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
