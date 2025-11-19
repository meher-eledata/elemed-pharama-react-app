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

export interface SendEmailTestRequest {
  toEmail: string;
  rawToken?: string; // Optional - backend will look up the token for the email address internally
}

// Response for sending email test
export interface SendEmailTestResponse {
  message: string;
}

export interface GetAllUsersResponse {
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    last_login: string | null;
  }>;
}

export interface UpdateUserRoleRequest {
  userId: number;
  role: string; // 'admin' or 'pharmacist'
}

export interface UpdateUserRoleResponse {
  message: string;
  user: {
    id: number;
    role: string;
  };
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdminUser'] as const,
  endpoints: (builder) => ({
    getAllUsers: builder.query<GetAllUsersResponse, void>({
      query: () => ({
        url: 'admin/get-all-users',
        method: 'GET',
      }),
      providesTags: ['AdminUser'],
    }),
    createUser: builder.mutation<CreateUserResponse, CreateUserRequest>({
      query: (body) => ({
        url: 'admin/create-user',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUser'],
    }),
    sendEmailTest: builder.mutation<SendEmailTestResponse, SendEmailTestRequest>({
      query: (body) => ({
        url: 'admin/send-email-test',
        method: 'POST',
        body,
      }),
    }),
    updateUserRole: builder.mutation<UpdateUserRoleResponse, UpdateUserRoleRequest>({
      query: ({ userId, role }) => ({
        url: `admin/update-user-role/${userId}`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['AdminUser'],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useSendEmailTestMutation,
  useUpdateUserRoleMutation,
} = adminApi;
