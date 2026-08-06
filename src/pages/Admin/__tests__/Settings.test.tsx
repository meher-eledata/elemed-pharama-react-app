import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../Settings';
import { SETTINGS_LABELS } from '../../../config/label/Settings.labels';
import {
  useGetDailyReportRecipientsQuery,
  useAddDailyReportRecipientMutation,
  useRemoveDailyReportRecipientMutation,
  useSendDailyReportNowMutation,
} from '../../../redux/slices/adminSlice';
import {
  useGetMeQuery,
  useToggleModuleMutation,
  useGetOrgQuery,
  useUpdateOrgMutation,
  useUpdateOrgLogoMutation,
  useDeleteOrgLogoMutation,
} from '../../../redux/slices/orgApi';

// Auto-mock the admin + org slices. GOTCHA (gotchas.md → "New RTK Query hook breaks auto-mocked
// slice test suites"): every hook the component uses MUST get a return value in beforeEach,
// or array-destructuring the mutation tuples throws "undefined is not iterable".
jest.mock('../../../redux/slices/adminSlice');
jest.mock('../../../redux/slices/orgApi');

const theme = createTheme();
const DAILY = SETTINGS_LABELS.SECTIONS.DAILY_REPORTS;

const mockUseGetRecipients =
  useGetDailyReportRecipientsQuery as jest.MockedFunction<typeof useGetDailyReportRecipientsQuery>;
const mockUseAddRecipient =
  useAddDailyReportRecipientMutation as jest.MockedFunction<typeof useAddDailyReportRecipientMutation>;
const mockUseRemoveRecipient =
  useRemoveDailyReportRecipientMutation as jest.MockedFunction<typeof useRemoveDailyReportRecipientMutation>;
const mockUseSendNow =
  useSendDailyReportNowMutation as jest.MockedFunction<typeof useSendDailyReportNowMutation>;
const mockUseGetMe = useGetMeQuery as jest.MockedFunction<typeof useGetMeQuery>;
const mockUseToggleModule =
  useToggleModuleMutation as jest.MockedFunction<typeof useToggleModuleMutation>;
const mockUseGetOrg = useGetOrgQuery as jest.MockedFunction<typeof useGetOrgQuery>;
const mockUseUpdateOrg = useUpdateOrgMutation as jest.MockedFunction<typeof useUpdateOrgMutation>;
const mockUseUpdateOrgLogo =
  useUpdateOrgLogoMutation as jest.MockedFunction<typeof useUpdateOrgLogoMutation>;
const mockUseDeleteOrgLogo =
  useDeleteOrgLogoMutation as jest.MockedFunction<typeof useDeleteOrgLogoMutation>;

const ORG_PROFILE = {
  id: 1,
  name: 'Test Pharmacy',
  slug: 'test-pharmacy',
  status: 'active',
  country: null,
  timezone: null,
  currency: null,
  logo_url: null,
  legal_name: 'Testco Pvt Ltd',
  address: '1 Test Street',
  dl_numbers: 'DL-1, DL-2',
  gstin: 'GSTIN123',
  phone: '000-111',
};

// id is a BIGINT serialized as a STRING (see adminSlice Recipient type).
const RECIPIENTS = [
  { id: '1', email: 'alice@x.com', enabled: true },
  { id: '2', email: 'bob@x.com', enabled: true },
];

const createMockQueryResult = (data: any, isLoading = false, isError = false) => ({
  data,
  isLoading,
  isError,
  error: isError ? { message: 'boom' } : null,
  isFetching: false,
  isSuccess: !isLoading && !isError,
  isUninitialized: false,
  refetch: jest.fn(),
});

const createMockStore = () =>
  configureStore({
    reducer: { auth: (state = { user: { username: 'admin' } }) => state },
  });

const renderSettings = () =>
  render(
    <Provider store={createMockStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Settings />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>,
  );

// The recipient list / add input / send button only render once the accordion is open.
const openDailyReportsSection = async () => {
  fireEvent.click(screen.getByText(DAILY.TITLE));
  await waitFor(() => {
    expect(screen.getByPlaceholderText(DAILY.ADD_PLACEHOLDER)).toBeInTheDocument();
  });
};

// Default mutation tuple: [trigger, { isLoading }]. trigger returns { unwrap }.
let addTrigger: jest.Mock;
let removeTrigger: jest.Mock;
let sendTrigger: jest.Mock;
let updateOrgTrigger: jest.Mock;
let updateOrgLogoTrigger: jest.Mock;
let deleteOrgLogoTrigger: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  addTrigger = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({ recipient: RECIPIENTS[0] }) });
  removeTrigger = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({ message: 'Recipient removed' }) });
  sendTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve({ sent: 2, failed: 0, recipients: [], date: '17 Jun 2026' }) });

  mockUseGetRecipients.mockReturnValue(
    createMockQueryResult({ recipients: RECIPIENTS }) as any,
  );
  mockUseAddRecipient.mockReturnValue([addTrigger, { isLoading: false }] as any);
  mockUseRemoveRecipient.mockReturnValue([removeTrigger, { isLoading: false }] as any);
  mockUseSendNow.mockReturnValue([sendTrigger, { isLoading: false }] as any);

  mockUseGetMe.mockReturnValue(
    createMockQueryResult({
      user: { id: 1, username: 'admin', email: 'a@x.com', first_name: 'A', last_name: 'D', org_role: 'owner' },
      organization: { id: 1, name: 'Test Pharmacy', slug: 'test-pharmacy' },
      activeModules: ['pharmacy'],
    }) as any,
  );
  mockUseToggleModule.mockReturnValue([
    jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({ activeModules: ['pharmacy'] }) }),
    { isLoading: false },
  ] as any);

  updateOrgTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve({ organization: ORG_PROFILE }) });
  updateOrgLogoTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve({ organization: ORG_PROFILE }) });
  deleteOrgLogoTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve({ organization: ORG_PROFILE }) });

  mockUseGetOrg.mockReturnValue(createMockQueryResult({ organization: ORG_PROFILE }) as any);
  mockUseUpdateOrg.mockReturnValue([updateOrgTrigger, { isLoading: false }] as any);
  mockUseUpdateOrgLogo.mockReturnValue([updateOrgLogoTrigger, { isLoading: false }] as any);
  mockUseDeleteOrgLogo.mockReturnValue([deleteOrgLogoTrigger, { isLoading: false }] as any);
});

describe('Settings — Daily Report Recipients', () => {
  it('renders the page and the Daily Report Recipients section title', () => {
    renderSettings();
    expect(screen.getByText(SETTINGS_LABELS.PAGE_TITLE)).toBeInTheDocument();
    expect(screen.getByText(DAILY.TITLE)).toBeInTheDocument();
  });

  it('renders the recipient list from the query when expanded', async () => {
    renderSettings();
    await openDailyReportsSection();

    expect(screen.getByText('alice@x.com')).toBeInTheDocument();
    expect(screen.getByText('bob@x.com')).toBeInTheDocument();
  });

  it('shows the loading state while recipients are loading', async () => {
    mockUseGetRecipients.mockReturnValue(createMockQueryResult(undefined, true) as any);
    renderSettings();
    await openDailyReportsSection();

    expect(screen.getByText(DAILY.LOADING)).toBeInTheDocument();
  });

  it('shows the empty state when there are no recipients', async () => {
    mockUseGetRecipients.mockReturnValue(
      createMockQueryResult({ recipients: [] }) as any,
    );
    renderSettings();
    await openDailyReportsSection();

    expect(screen.getByText(DAILY.EMPTY)).toBeInTheDocument();
  });

  it('shows the load-error state when the query errors', async () => {
    mockUseGetRecipients.mockReturnValue(createMockQueryResult(undefined, false, true) as any);
    renderSettings();
    await openDailyReportsSection();

    expect(screen.getByText(DAILY.LOAD_ERROR)).toBeInTheDocument();
  });

  it('typing an invalid email shows the validation message and does NOT call add', async () => {
    const user = userEvent.setup();
    renderSettings();
    await openDailyReportsSection();

    await user.type(screen.getByPlaceholderText(DAILY.ADD_PLACEHOLDER), 'not-an-email');
    await user.click(screen.getByText(DAILY.ADD_BUTTON));

    await waitFor(() => {
      expect(screen.getByText(DAILY.INVALID_EMAIL)).toBeInTheDocument();
    });
    expect(addTrigger).not.toHaveBeenCalled();
  });

  it('a valid email calls the add trigger and shows the success snackbar', async () => {
    const user = userEvent.setup();
    renderSettings();
    await openDailyReportsSection();

    await user.type(screen.getByPlaceholderText(DAILY.ADD_PLACEHOLDER), 'new@x.com');
    await user.click(screen.getByText(DAILY.ADD_BUTTON));

    await waitFor(() => {
      expect(addTrigger).toHaveBeenCalledWith({ email: 'new@x.com' });
    });
    await waitFor(() => {
      expect(screen.getByText(DAILY.ADD_SUCCESS)).toBeInTheDocument();
    });
  });

  it('delete calls the remove trigger with the STRING id', async () => {
    renderSettings();
    await openDailyReportsSection();

    // One delete IconButton per recipient row.
    const deleteButtons = screen.getAllByRole('button').filter((b) =>
      b.querySelector('svg[data-testid="DeleteIcon"]'),
    );
    expect(deleteButtons.length).toBe(RECIPIENTS.length);

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(removeTrigger).toHaveBeenCalledWith('1');
    });
    // id is passed as a string, never coerced to a number.
    expect(typeof removeTrigger.mock.calls[0][0]).toBe('string');
  });

  it('Send now calls the send trigger and shows the result snackbar (sent count)', async () => {
    const user = userEvent.setup();
    renderSettings();
    await openDailyReportsSection();

    await user.click(screen.getByText(DAILY.SEND_NOW_BUTTON));

    await waitFor(() => {
      expect(sendTrigger).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(DAILY.SEND_SUCCESS(2))).toBeInTheDocument();
    });
  });

  it('Send now is disabled when there are no recipients', async () => {
    mockUseSendNow.mockReturnValue([sendTrigger, { isLoading: false }] as any);
    mockUseGetRecipients.mockReturnValue(
      createMockQueryResult({ recipients: [] }) as any,
    );
    renderSettings();
    await openDailyReportsSection();

    const sendButton = screen.getByText(DAILY.SEND_NOW_BUTTON).closest('button');
    expect(sendButton).toBeDisabled();
    fireEvent.click(sendButton as HTMLElement);
    expect(sendTrigger).not.toHaveBeenCalled();
  });
});

describe('Settings — Pharmacy Profile', () => {
  const PROFILE = SETTINGS_LABELS.SECTIONS.PHARMACY_PROFILE;

  const openProfileSection = async () => {
    fireEvent.click(screen.getByText(PROFILE.TITLE));
    await waitFor(() => {
      expect(screen.getByLabelText(new RegExp(PROFILE.FIELDS.NAME))).toBeInTheDocument();
    });
  };

  it('renders the org profile fields seeded from getOrg', async () => {
    renderSettings();
    await openProfileSection();

    expect(screen.getByLabelText(new RegExp(PROFILE.FIELDS.NAME))).toHaveValue('Test Pharmacy');
    expect(screen.getByLabelText(PROFILE.FIELDS.LEGAL_NAME)).toHaveValue('Testco Pvt Ltd');
    expect(screen.getByLabelText(PROFILE.FIELDS.ADDRESS)).toHaveValue('1 Test Street');
    expect(screen.getByLabelText(PROFILE.FIELDS.DL_NUMBERS)).toHaveValue('DL-1, DL-2');
    expect(screen.getByLabelText(PROFILE.FIELDS.GSTIN)).toHaveValue('GSTIN123');
    expect(screen.getByLabelText(PROFILE.FIELDS.PHONE)).toHaveValue('000-111');
  });

  it('saving sends the edited fields (empty branding fields as null) and shows success', async () => {
    const user = userEvent.setup();
    renderSettings();
    await openProfileSection();

    const nameField = screen.getByLabelText(new RegExp(PROFILE.FIELDS.NAME));
    await user.clear(nameField);
    await user.type(nameField, 'Renamed Pharmacy');
    const gstinField = screen.getByLabelText(PROFILE.FIELDS.GSTIN);
    await user.clear(gstinField);

    await user.click(screen.getByText(PROFILE.SAVE_BUTTON));

    await waitFor(() => {
      expect(updateOrgTrigger).toHaveBeenCalledWith({
        name: 'Renamed Pharmacy',
        legal_name: 'Testco Pvt Ltd',
        address: '1 Test Street',
        dl_numbers: 'DL-1, DL-2',
        gstin: null,
        phone: '000-111',
      });
    });
    await waitFor(() => {
      expect(screen.getByText(PROFILE.SAVE_SUCCESS)).toBeInTheDocument();
    });
  });

  it('an empty name blocks the save with a validation message', async () => {
    const user = userEvent.setup();
    renderSettings();
    await openProfileSection();

    await user.clear(screen.getByLabelText(new RegExp(PROFILE.FIELDS.NAME)));
    await user.click(screen.getByText(PROFILE.SAVE_BUTTON));

    await waitFor(() => {
      expect(screen.getByText(PROFILE.NAME_REQUIRED)).toBeInTheDocument();
    });
    expect(updateOrgTrigger).not.toHaveBeenCalled();
  });

  it('staff org_role sees read-only fields and no save button', async () => {
    mockUseGetMe.mockReturnValue(
      createMockQueryResult({
        user: { id: 2, username: 'staff', email: 's@x.com', first_name: 'S', last_name: 'T', org_role: 'staff' },
        organization: { id: 1, name: 'Test Pharmacy', slug: 'test-pharmacy' },
        activeModules: ['pharmacy'],
      }) as any,
    );
    renderSettings();
    await openProfileSection();

    expect(screen.getByText(PROFILE.READ_ONLY_NOTE)).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(PROFILE.FIELDS.NAME))).toBeDisabled();
    expect(screen.queryByText(PROFILE.SAVE_BUTTON)).not.toBeInTheDocument();
    expect(screen.queryByText(PROFILE.LOGO.CHOOSE_BUTTON)).not.toBeInTheDocument();
  });

  it('removing the logo asks for confirmation and calls deleteOrgLogo', async () => {
    mockUseGetOrg.mockReturnValue(
      createMockQueryResult({
        organization: { ...ORG_PROFILE, logo_url: 'data:image/png;base64,abc' },
      }) as any,
    );
    const user = userEvent.setup();
    renderSettings();
    await openProfileSection();

    await user.click(screen.getByText(PROFILE.LOGO.REMOVE_BUTTON));
    // ConfirmationDialog is open; confirm.
    await waitFor(() => {
      expect(screen.getByText(PROFILE.LOGO.REMOVE_CONFIRM_TITLE)).toBeInTheDocument();
    });
    const confirmButtons = screen.getAllByText(PROFILE.LOGO.REMOVE_BUTTON);
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(deleteOrgLogoTrigger).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(PROFILE.LOGO.REMOVE_SUCCESS)).toBeInTheDocument();
    });
  });
});
