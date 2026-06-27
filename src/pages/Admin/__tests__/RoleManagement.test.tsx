import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import RoleManagement from '../RoleManagement';
import { ROLE_MANAGEMENT_LABELS as L } from '../../../config/label/RoleManagement.labels';
import {
  useGetAllUsersQuery,
  useGetRoleOptionsQuery,
  useUpdateUserRolesMutation,
  useSetManageRolesMutation,
} from '../../../redux/slices/adminSlice';

// Auto-mock the admin slice. GOTCHA: every hook the component uses MUST get a return value
// in beforeEach, or array-destructuring the mutation tuples throws "undefined is not iterable".
jest.mock('../../../redux/slices/adminSlice');
// orgApi.util.invalidateTags is dispatched on save; provide a no-op so dispatch is safe.
jest.mock('../../../redux/slices/orgApi', () => ({
  orgApi: { util: { invalidateTags: () => ({ type: 'orgApi/invalidate' }) } },
}));

const theme = createTheme();

const mockUseGetAllUsers = useGetAllUsersQuery as jest.MockedFunction<typeof useGetAllUsersQuery>;
const mockUseGetRoleOptions = useGetRoleOptionsQuery as jest.MockedFunction<typeof useGetRoleOptionsQuery>;
const mockUseUpdateUserRoles = useUpdateUserRolesMutation as jest.MockedFunction<typeof useUpdateUserRolesMutation>;
const mockUseSetManageRoles = useSetManageRolesMutation as jest.MockedFunction<typeof useSetManageRolesMutation>;

const USERS = [
  {
    id: 1,
    name: 'Alice',
    email: 'alice@x.com',
    role: 'admin',
    status: 'active',
    last_login: null,
    org_role: 'admin',
    module_roles: { outpatient: 'receptionist' },
    can_manage_roles: false,
  },
  {
    id: 2,
    name: 'Bob',
    email: 'bob@x.com',
    role: 'pharmacist',
    status: 'active',
    last_login: null,
    org_role: 'member',
    module_roles: {},
    can_manage_roles: false,
  },
];

const ROLE_OPTIONS = {
  org_roles: ['superadmin', 'admin', 'member'],
  module_roles: { pharmacy: ['pharmacist'], inpatient: [], outpatient: ['receptionist', 'doctor'] },
};

const createMockQueryResult = (data: any) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
  isFetching: false,
  isSuccess: true,
  isUninitialized: false,
  refetch: jest.fn(),
});

// org slice with a configurable viewer context.
const makeStore = (org: { orgRole: string | null; canManageRoles: boolean }) =>
  configureStore({
    reducer: {
      auth: (state = { user: { username: 'admin' }, isAuthenticated: true }) => state,
      org: (
        state = {
          organization: null,
          activeModules: [],
          orgRole: org.orgRole,
          moduleRoles: {},
          canManageRoles: org.canManageRoles,
          loaded: true,
        },
      ) => state,
    },
  });

const renderPage = (org: { orgRole: string | null; canManageRoles: boolean }) =>
  render(
    <Provider store={makeStore(org)}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <RoleManagement />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>,
  );

let updateTrigger: jest.Mock;
let manageTrigger: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  updateTrigger = jest.fn().mockReturnValue({
    unwrap: () =>
      Promise.resolve({ message: 'ok', user: { id: 1, org_role: 'admin', module_roles: {}, can_manage_roles: false } }),
  });
  manageTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve({ message: 'ok', user: { id: 1, can_manage_roles: true } }) });

  mockUseGetAllUsers.mockReturnValue(createMockQueryResult({ users: USERS }) as any);
  mockUseGetRoleOptions.mockReturnValue(createMockQueryResult(ROLE_OPTIONS) as any);
  mockUseUpdateUserRoles.mockReturnValue([updateTrigger, { isLoading: false }] as any);
  mockUseSetManageRoles.mockReturnValue([manageTrigger, { isLoading: false }] as any);
});

describe('RoleManagement', () => {
  it('renders users with org role and module role chips', () => {
    renderPage({ orgRole: 'superadmin', canManageRoles: false });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('outpatient: receptionist')).toBeInTheDocument();
  });

  it('shows the read-only notice and no edit action for a plain member viewer', () => {
    renderPage({ orgRole: 'member', canManageRoles: false });
    expect(screen.getByText(L.READ_ONLY_NOTICE)).toBeInTheDocument();
    expect(screen.queryByLabelText(L.EDIT_TOOLTIP)).not.toBeInTheDocument();
  });

  it('allows a manage-roles admin to edit and save module roles', async () => {
    renderPage({ orgRole: 'admin', canManageRoles: true });
    expect(screen.queryByText(L.READ_ONLY_NOTICE)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText(L.EDIT_TOOLTIP)[0]);
    expect(await screen.findByText(L.DIALOG.TITLE)).toBeInTheDocument();

    // Change the outpatient module role (receptionist -> doctor) so the save has a diff.
    const outpatientSelect = screen.getByText('receptionist');
    fireEvent.mouseDown(outpatientSelect);
    const doctorOption = await screen.findByRole('option', { name: 'doctor' });
    fireEvent.click(doctorOption);

    fireEvent.click(screen.getByText(L.DIALOG.SAVE));
    await waitFor(() => expect(updateTrigger).toHaveBeenCalledWith({
      userId: 1,
      module_roles: { outpatient: 'doctor' },
    }));
    await waitFor(() => expect(screen.getByText(L.MESSAGES.UPDATE_SUCCESS)).toBeInTheDocument());
  });
});
