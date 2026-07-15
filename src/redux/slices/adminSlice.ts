import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

export type IdentityDocumentType = 0 | 1;

export type UserRole = 0 | 1;

// Text fields posted as multipart/form-data to POST /api/admin/create-user.
export interface CreateUserRequest {
  superusername: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string;
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

// Optional file parts attached to the multipart create-user request.
export interface CreateUserFiles {
  id_document?: File; // optional identity/document verification upload
  pharmacist_certificate?: File; // required when role === 1 (pharmacist)
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

// PUT /api/admin/users/:id/disable | /enable — status mapped to "inactive" | "active".
export interface SetUserStatusResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    status: string;
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

// As-built shape of an activity_log row from GET /api/admin/get-activity-log.
// The backend sends snake_case columns; `role` is an INTEGER (0=Admin, 1=Pharmacist) or null
// for system/unmatched rows. All consumer code must defensively String()/null-default these.
export interface ActivityLogEntry {
  id?: number;
  username?: string;
  userAvatar?: string;
  accessLevel?: string;
  role?: number | string | null;
  module?: string;
  module_name?: string;
  eventType?: string;
  event_type?: string;
  eventTime?: string;
  event_time?: string;
  eventDetails?: string;
  event_details?: string;
  quantityChanged?: string | number;
  quantity_changed?: string | number;
  relatedId?: string | number;
  related_id?: string | number;
  ipAddress?: string | null;
  ip_address?: string | null;
}

export interface GetActivityLogResponse {
  activityLog: ActivityLogEntry[];
}

// Daily Report Email recipients (notification_preferences-backed).
// CRITICAL: `id` is a Postgres BIGINT serialized as a numeric STRING — keep it a string everywhere.
export interface Recipient {
  id: string;
  email: string;
  enabled: boolean;
}

export interface GetDailyReportRecipientsResponse {
  recipients: Recipient[];
}

export interface AddDailyReportRecipientRequest {
  email: string;
}

export interface DailyReportRecipientResponse {
  recipient: Recipient;
}

export interface RemoveDailyReportRecipientResponse {
  message: string;
}

export interface SendDailyReportNowRequest {
  date?: string;
  to?: string[];
}

export interface SendDailyReportNowResponse {
  sent: number;
  failed: number;
  recipients: string[];
  date: string | null;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdminUser', 'DailyReportRecipient'] as const,
  endpoints: (builder) => ({
    getAllUsers: builder.query<GetAllUsersResponse, void>({
      query: () => ({
        url: 'admin/get-all-users',
        method: 'GET',
      }),
      providesTags: ['AdminUser'],
    }),
    createUser: builder.mutation<CreateUserResponse, CreateUserRequest & CreateUserFiles>({
      query: ({ id_document, pharmacist_certificate, ...fields }) => {
        const formData = new FormData();
        // Append every defined text field; the backend reads them from req.body.
        (Object.keys(fields) as Array<keyof CreateUserRequest>).forEach((key) => {
          const value = fields[key];
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        if (id_document) formData.append('id_document', id_document);
        if (pharmacist_certificate) {
          formData.append('pharmacist_certificate', pharmacist_certificate);
        }
        // NOTE: do NOT set Content-Type — the browser adds the multipart boundary.
        return { url: 'admin/create-user', method: 'POST', body: formData };
      },
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
    disableUser: builder.mutation<SetUserStatusResponse, number>({
      query: (id) => ({
        url: `admin/users/${id}/disable`,
        method: 'PUT',
      }),
      invalidatesTags: ['AdminUser'],
    }),
    enableUser: builder.mutation<SetUserStatusResponse, number>({
      query: (id) => ({
        url: `admin/users/${id}/enable`,
        method: 'PUT',
      }),
      invalidatesTags: ['AdminUser'],
    }),
    getActivityLog: builder.query<GetActivityLogResponse, void>({
      query: () => ({
        url: 'admin/get-activity-log',
        method: 'GET',
      }),
      providesTags: ['AdminUser'],
    }),
    getDailyReportRecipients: builder.query<GetDailyReportRecipientsResponse, void>({
      query: () => ({
        url: 'admin/daily-report/recipients',
        method: 'GET',
      }),
      providesTags: ['DailyReportRecipient'],
    }),
    addDailyReportRecipient: builder.mutation<DailyReportRecipientResponse, AddDailyReportRecipientRequest>({
      query: (body) => ({
        url: 'admin/daily-report/recipients',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DailyReportRecipient'],
    }),
    removeDailyReportRecipient: builder.mutation<RemoveDailyReportRecipientResponse, string>({
      query: (id) => ({
        url: `admin/daily-report/recipients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DailyReportRecipient'],
    }),
    sendDailyReportNow: builder.mutation<SendDailyReportNowResponse, SendDailyReportNowRequest | void>({
      query: (body) => ({
        url: 'admin/daily-report/send-now',
        method: 'POST',
        body: body ?? {},
      }),
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useDisableUserMutation,
  useEnableUserMutation,
  useSendEmailTestMutation,
  useUpdateUserRoleMutation,
  useGetActivityLogQuery,
  useGetDailyReportRecipientsQuery,
  useAddDailyReportRecipientMutation,
  useRemoveDailyReportRecipientMutation,
  useSendDailyReportNowMutation,
} = adminApi;
