import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// ---------------------------------------------------------------------------
// Outpatient (OPD) module API. All routes are mounted under /api/outpatient/*
// on the backend and are module-gated + role-gated (receptionist/doctor;
// superadmin/admin bypass). A 403 here is benign (lacks role) — baseQuery only
// logs out on 401. Types are colocated and match the recorded API contract.
// ---------------------------------------------------------------------------

export type AppointmentType = 'consultation' | 'service';
export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';
export type AppointmentSource = 'booked' | 'walk_in';
export type ProviderType = 'doctor' | 'service';

// ----- Patients -----
export interface OutpatientPatient {
  id: number;
  name: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  mrn?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
}

export interface CreatePatientRequest {
  name: string;
  gender?: string;
  phone?: string;
  email?: string;
  mrn?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

// ----- Services -----
export interface OutpatientService {
  id: number;
  name: string;
  description?: string | null;
  duration_min?: number | null;
  active: boolean;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration_min?: number;
  active?: boolean;
}

// ----- Providers (doctors) -----
export interface OutpatientProvider {
  id: number;
  name: string;
  branch?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  user_id?: number | null;
}

// ----- Availability / slots -----
export interface OutpatientAvailability {
  id: number;
  provider_type: ProviderType;
  provider_id: number;
  weekday?: number | null; // 0=Sun … 6=Sat (recurring)
  specific_date?: string | null; // 'YYYY-MM-DD' (one-off)
  start_time?: string; // 'HH:mm'
  end_time?: string; // 'HH:mm'
  slot_duration_min?: number;
  accepts_walk_ins?: boolean;
  active?: boolean;
}

export interface AvailabilityWriteRequest {
  provider_type: ProviderType;
  provider_id: number;
  weekday?: number | null;
  weekdays?: number[];
  specific_date?: string | null;
  start_time?: string;
  end_time?: string;
  slot_duration_min?: number;
  accepts_walk_ins?: boolean;
  active?: boolean;
}

export interface OutpatientSlot {
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
  available: boolean;
}

// ----- Appointments -----
export interface AppointmentJoins {
  Patient?: { name: string; phone?: string | null; mrn?: string | null };
  Doctor?: { name: string } | null;
  Service?: { name: string } | null;
}

export interface OutpatientAppointment extends AppointmentJoins {
  id: number;
  patient_id: number;
  appointment_type: AppointmentType;
  doctor_id?: number | null;
  service_id?: number | null;
  scheduled_start: string; // ISO
  scheduled_end?: string | null;
  slot_duration_min?: number | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  token_number?: number | null;
  cancel_reason?: string | null;
  cancelled_reason?: string | null;
  check_in_at?: string | null; // ISO
  priority?: number | null;
}

// Queue entry: an appointment plus its computed position in the live queue.
export interface QueueEntry {
  position: number;
  appointment: OutpatientAppointment;
}

export interface GetAppointmentsParams {
  date_from?: string;
  date_to?: string;
  doctor_id?: number;
  service_id?: number;
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  patient_id?: number;
  source?: AppointmentSource;
  q?: string;
}

export interface GetAppointmentsResponse {
  appointments: OutpatientAppointment[];
}

// Either a full ISO `scheduled_start`, OR a `scheduled_start` date + `time`.
export interface CreateAppointmentRequest {
  patient_id: number;
  appointment_type: AppointmentType;
  doctor_id?: number;
  service_id?: number;
  scheduled_start: string; // ISO or 'YYYY-MM-DD'
  time?: string; // 'HH:mm' when scheduled_start is a date
  slot_duration_min?: number;
}

export interface RescheduleAppointmentRequest {
  scheduled_start: string; // ISO or 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  doctor_id?: number;
  service_id?: number;
  slot_duration_min?: number;
}

export interface RegisterWalkInRequest {
  patient_id: number;
  doctor_id: number;
}

export interface WalkInResponse {
  appointment: OutpatientAppointment;
  token_number: number;
}

export interface LinkProviderUserRequest {
  provider_id: number;
  user_id: number;
}

export const outpatientApi = createApi({
  reducerPath: 'outpatientApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Appointment', 'Patient', 'Availability', 'Queue'] as const,
  endpoints: (builder) => ({
    // ----- Patients -----
    getPatients: builder.query<OutpatientPatient[], { search?: string } | void>({
      query: (arg) => ({
        url: 'outpatient/patients',
        params: arg?.search ? { search: arg.search } : undefined,
      }),
      providesTags: ['Patient'],
    }),
    // Alias kept distinct so components reading "search" intent are explicit.
    searchPatients: builder.query<OutpatientPatient[], string>({
      query: (search) => ({
        url: 'outpatient/patients',
        params: search ? { search } : undefined,
      }),
      providesTags: ['Patient'],
    }),
    getPatient: builder.query<OutpatientPatient, number>({
      query: (id) => `outpatient/patients/${id}`,
      providesTags: ['Patient'],
    }),
    createPatient: builder.mutation<{ patient: OutpatientPatient }, CreatePatientRequest>({
      query: (body) => ({ url: 'outpatient/patients', method: 'POST', body }),
      invalidatesTags: ['Patient'],
    }),

    // ----- Services -----
    getServices: builder.query<OutpatientService[], { active?: boolean } | void>({
      query: (arg) => ({
        url: 'outpatient/services',
        params: arg && arg.active !== undefined ? { active: arg.active } : undefined,
      }),
    }),
    createService: builder.mutation<{ service: OutpatientService }, CreateServiceRequest>({
      query: (body) => ({ url: 'outpatient/services', method: 'POST', body }),
      invalidatesTags: ['Availability'],
    }),
    updateService: builder.mutation<
      { service: OutpatientService },
      { id: number } & Partial<CreateServiceRequest>
    >({
      query: ({ id, ...body }) => ({ url: `outpatient/services/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Availability'],
    }),

    // ----- Providers -----
    getProviders: builder.query<OutpatientProvider[], void>({
      query: () => 'outpatient/providers',
    }),
    linkProviderUser: builder.mutation<OutpatientProvider, LinkProviderUserRequest>({
      query: ({ provider_id, ...body }) => ({
        url: `outpatient/providers/${provider_id}/link-user`,
        method: 'PUT',
        body,
      }),
    }),

    // ----- Availability / slots -----
    getAvailability: builder.query<
      OutpatientAvailability[],
      { provider_type: ProviderType; provider_id: number }
    >({
      query: (params) => ({ url: 'outpatient/availability', params }),
      providesTags: ['Availability'],
    }),
    createAvailability: builder.mutation<
      | OutpatientAvailability
      | { availability?: OutpatientAvailability; availabilities?: OutpatientAvailability[] },
      AvailabilityWriteRequest
    >({
      query: (body) => ({ url: 'outpatient/availability', method: 'POST', body }),
      invalidatesTags: ['Availability'],
    }),
    updateAvailability: builder.mutation<
      OutpatientAvailability,
      { id: number } & Partial<AvailabilityWriteRequest>
    >({
      query: ({ id, ...body }) => ({ url: `outpatient/availability/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Availability'],
    }),
    deleteAvailability: builder.mutation<{ message: string }, number>({
      query: (id) => ({ url: `outpatient/availability/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Availability'],
    }),
    getSlots: builder.query<
      OutpatientSlot[],
      { provider_type: ProviderType; provider_id: number; date: string }
    >({
      query: (params) => ({ url: 'outpatient/slots', params }),
      providesTags: ['Availability'],
    }),

    // ----- Appointments -----
    getAppointments: builder.query<GetAppointmentsResponse, GetAppointmentsParams | void>({
      query: (params) => ({
        url: 'outpatient/appointments',
        params: params || undefined,
      }),
      providesTags: ['Appointment'],
    }),
    getAppointment: builder.query<{ appointment: OutpatientAppointment }, number>({
      query: (id) => `outpatient/appointments/${id}`,
      providesTags: ['Appointment'],
    }),
    createAppointment: builder.mutation<
      { appointment: OutpatientAppointment },
      CreateAppointmentRequest
    >({
      query: (body) => ({ url: 'outpatient/appointments', method: 'POST', body }),
      invalidatesTags: ['Appointment', 'Queue', 'Availability'],
    }),
    rescheduleAppointment: builder.mutation<
      { appointment: OutpatientAppointment },
      { id: number } & RescheduleAppointmentRequest
    >({
      query: ({ id, ...body }) => ({
        url: `outpatient/appointments/${id}/reschedule`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Appointment', 'Queue', 'Availability'],
    }),
    cancelAppointment: builder.mutation<
      { appointment: OutpatientAppointment },
      { id: number; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `outpatient/appointments/${id}/cancel`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Appointment', 'Queue', 'Availability'],
    }),
    checkInAppointment: builder.mutation<{ appointment: OutpatientAppointment }, { id: number }>({
      query: ({ id }) => ({ url: `outpatient/appointments/${id}/check-in`, method: 'PUT' }),
      invalidatesTags: ['Appointment', 'Queue'],
    }),
    setAppointmentStatus: builder.mutation<
      { appointment: OutpatientAppointment },
      { id: number; status: AppointmentStatus }
    >({
      query: ({ id, status }) => ({
        url: `outpatient/appointments/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Appointment', 'Queue'],
    }),

    // ----- Walk-ins -----
    registerWalkIn: builder.mutation<WalkInResponse, RegisterWalkInRequest>({
      query: (body) => ({ url: 'outpatient/walk-ins', method: 'POST', body }),
      invalidatesTags: ['Appointment', 'Queue'],
    }),
    cancelWalkIn: builder.mutation<
      { appointment: OutpatientAppointment },
      { id: number; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `outpatient/appointments/${id}/cancel-walk-in`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Appointment', 'Queue'],
    }),

    // ----- Queue (B2b) -----
    getQueue: builder.query<{ queue: QueueEntry[] }, { doctor_id?: number } | void>({
      query: (params) => ({ url: 'outpatient/queue', params: params || undefined }),
      providesTags: ['Queue'],
    }),
    callNext: builder.mutation<{ appointment: OutpatientAppointment }, { doctor_id: number }>({
      query: (body) => ({ url: 'outpatient/queue/call-next', method: 'POST', body }),
      invalidatesTags: ['Queue', 'Appointment'],
    }),
    skipAppointment: builder.mutation<{ appointment: OutpatientAppointment }, { id: number }>({
      query: ({ id }) => ({ url: `outpatient/appointments/${id}/skip`, method: 'PUT' }),
      invalidatesTags: ['Queue', 'Appointment'],
    }),
    noShowAppointment: builder.mutation<{ appointment: OutpatientAppointment }, { id: number }>({
      query: ({ id }) => ({ url: `outpatient/appointments/${id}/no-show`, method: 'PUT' }),
      invalidatesTags: ['Queue', 'Appointment'],
    }),
    reorderQueue: builder.mutation<
      { queue: OutpatientAppointment[] },
      { doctor_id: number; ordered_ids: number[] }
    >({
      query: (body) => ({ url: 'outpatient/queue/reorder', method: 'PUT', body }),
      invalidatesTags: ['Queue'],
    }),
  }),
});

export const {
  useGetPatientsQuery,
  useLazyGetPatientsQuery,
  useSearchPatientsQuery,
  useLazySearchPatientsQuery,
  useGetPatientQuery,
  useCreatePatientMutation,
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useGetProvidersQuery,
  useLinkProviderUserMutation,
  useGetAvailabilityQuery,
  useCreateAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useDeleteAvailabilityMutation,
  useGetSlotsQuery,
  useLazyGetSlotsQuery,
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useCreateAppointmentMutation,
  useRescheduleAppointmentMutation,
  useCancelAppointmentMutation,
  useCheckInAppointmentMutation,
  useSetAppointmentStatusMutation,
  useRegisterWalkInMutation,
  useCancelWalkInMutation,
  useGetQueueQuery,
  useCallNextMutation,
  useSkipAppointmentMutation,
  useNoShowAppointmentMutation,
  useReorderQueueMutation,
} = outpatientApi;
