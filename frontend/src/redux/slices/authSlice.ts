import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return rejectWithValue(error.message);

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        name: profile?.username || email.split('@')[0],
        email: data.user.email!,
      },
      token: data.session.access_token,
    };
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (
    { name, email, password }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: name, app_name: 'Cryptara' },
        emailRedirectTo: 'https://cryptara.lat',
      },
    });
    if (error) return rejectWithValue(error.message);
  }
);

export const restoreSessionThunk = createAsyncThunk('auth/restoreSession', async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.session.user.id)
    .single();

  return {
    user: {
      id: data.session.user.id,
      name: profile?.username || data.session.user.email!.split('@')[0],
      email: data.session.user.email!,
    },
    token: data.session.access_token,
  };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      supabase.auth.signOut();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
