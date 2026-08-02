
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
        return { token: null, user: null };
    }
};

const saveAuthToStorage = (token: string, user: User) => {
    try {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
    }
};

const removeAuthFromStorage = () => {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } catch (error) {
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
        signup: builder.mutation<SignupResponse, SignupRequest>({
            query: (body) => ({
                url: 'signup',
                method: 'POST',
                body,
            }),
        }),
        passwordRecovery: builder.mutation<PasswordRecoveryResponse, PasswordRecoveryRequest>({
            query: (body) => ({
                url: 'send-password-change-email',
                method: 'POST',
                body,
            }),
        }),
        resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
            query: (body) => ({
                url: 'create-new-password',
                method: 'POST',
                body,
            }),
        }),

        createPassword: builder.mutation<CreatePasswordResponse, CreatePasswordRequest>({
            query: (body) => ({
                url: 'create-new-password',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useLoginMutation, useSignupMutation, usePasswordRecoveryMutation, useResetPasswordMutation, useCreatePasswordMutation } = authApi;

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: number | string;
    org_id?: number;
    org_role?: 'owner' | 'admin' | 'staff' | string;
}

interface LoginResponse {
    token: string;
    user: User;
}

interface LoginRequest {
    username: string;
    password: string;
}

// POST /api/signup (PUBLIC) — creates an organization + owner user and returns
// an auth token plus the org. `pharmacy` is always enabled server-side; `modules`
// adds others (e.g. 'inpatient').
export interface SignupRequest {
    org_name: string;
    email: string;
    password: string;
    username: string;
    first_name: string;
    last_name: string;
    modules?: string[];
}

export interface SignupResponse {
    token: string;
    user: User;
    organization: { id: number; name: string; slug: string };
}

interface PasswordRecoveryRequest {
    username: string;
}

interface PasswordRecoveryResponse {
    message: string;
    dev_reset_token?: string;
}

interface ResetPasswordRequest {
    token: string;
    password: string;
}

interface ResetPasswordResponse {
    message: string;
}

interface CreatePasswordRequest {
    token: string;
    password: string;
}

interface CreatePasswordResponse {
    message: string;
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

            saveAuthToStorage(action.payload.token, action.payload.user);
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;

            removeAuthFromStorage();
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;