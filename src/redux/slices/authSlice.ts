
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const TOKEN_KEY = 'pharma_auth_token';
const USER_KEY = 'pharma_user';


const loadAuthFromStorage = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch (error) {
    console.error('Failed to load auth from storage:', error);
    return { token: null, user: null };
  }
};


const saveAuthToStorage = (token: string, user: User) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save auth to storage:', error);
  }
};


const removeAuthFromStorage = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to remove auth from storage:', error);
  }
};

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/',
    }),
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: 'login',
                method: 'POST',
                body: credentials,
            }),
        }),
        passwordRecovery: builder.mutation<PasswordRecoveryResponse, PasswordRecoveryRequest>({
            query: (body) => ({
                url: 'password-recovery',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useLoginMutation, usePasswordRecoveryMutation } = authApi;

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

interface LoginRequest {
    username: string;
    password: string;
}

interface PasswordRecoveryRequest {
    username: string;
}

interface PasswordRecoveryResponse {
    message: string;
    dev_reset_token?: string; // Only in development
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
}

const { token: savedToken, user: savedUser } = loadAuthFromStorage();

const initialState: AuthState = {
    token: savedToken,
    user: savedUser,
    isAuthenticated: !!savedToken && !!savedUser,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ token: string; user: User }>
        ) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            
            // Persist to localStorage
            saveAuthToStorage(action.payload.token, action.payload.user);
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            
            // Remove from localStorage
            removeAuthFromStorage();
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;