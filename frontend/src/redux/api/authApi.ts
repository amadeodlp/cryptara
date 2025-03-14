import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  message: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

// Get the API URL from environment variables
const apiUrl = import.meta.env.VITE_API_URL || '';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: apiUrl, // Use the environment variable instead of relative path
    prepareHeaders: (headers, { getState }) => {
      // Add token to headers if available
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
