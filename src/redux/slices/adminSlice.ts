import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export type IdentityDocumentType = 0 | 1;

export type UserRole = 0 | 1;

export interface CreateUserRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  identity_document: IdentityDocumentType;
  identity_document_number: string;
  role: UserRole;
}

// Response when user is created successfully
export interface CreateUserResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    identity_document: IdentityDocumentType;
    identity_document_number: string;
    role: UserRole;
  };
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdminUser'] as const,
  endpoints: (builder) => ({
    createUser: builder.mutation<CreateUserResponse, CreateUserRequest>({
      query: (body) => ({
        url: 'admin/create-user',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUser'],
    }),
  }),
});

export const {
  useCreateUserMutation,
} = adminApi;
