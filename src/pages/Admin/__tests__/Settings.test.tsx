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
  useGetDocumentNumberingQuery,
  useUpdateDocumentNumberingMutation,
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
const mockUseGetDocNumbering =
  useGetDocumentNumberingQuery as jest.MockedFunction<typeof useGetDocumentNumberingQuery>;
const mockUseUpdateDocNumbering =
  useUpdateDocumentNumberingMutation as jest.MockedFunction<typeof useUpdateDocumentNumberingMutation>;

// GET /api/org/document-numbering always returns exactly these four, in this order;
// absent rows come back as disabled defaults.
const SCHEMES = [
  {
    doc_type: 'sales_invoice',
    enabled: true,
    template: 'SI-EL-{YY}-{SEQ:6}',
    seq_start: 2296,
    reset_cycle: 'annual',
    reset_anchor_month: 4,
    reset_anchor_day: 1,
    reset_to: 1,
    preview: 'SI-EL-26-002296',
  },
  {
    doc_type: 'sales_return',
    enabled: false,
    template: null,
    seq_start: null,
    reset_cycle: 'none',
    reset_anchor_month: 4,
    reset_anchor_day: 1,
    reset_to: 1,
    preview: null,
  },
  {
    doc_type: 'receipt',
    enabled: false,
    template: null,
    seq_start: null,
    reset_cycle: 'none',
    reset_anchor_month: 4,
    reset_anchor_day: 1,
    reset_to: 1,
    preview: null,
  },
  {
    doc_type: 'purchase_return',
    enabled: false,
    template: null,
    seq_start: null,
    reset_cycle: 'none',
    reset_anchor_month: 4,
    reset_anchor_day: 1,
    reset_to: 1,
    preview: null,
  },
];

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
  invoice_number_enabled: false,
  invoice_number_template: null,
  invoice_number_reset: 'none',
  invoice_seq_start: null,
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
let updateDocNumberingTrigger: jest.Mock;

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

  updateDocNumberingTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve({ scheme: SCHEMES[0] }) });
  mockUseGetDocNumbering.mockReturnValue(createMockQueryResult({ schemes: SCHEMES }) as any);
  mockUseUpdateDocNumbering.mockReturnValue([updateDocNumberingTrigger, { isLoading: false }] as any);
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

describe('Settings — Document Numbering', () => {
  const DOC = SETTINGS_LABELS.SECTIONS.DOCUMENT_NUMBERING;

  // The section renders only while its accordion is open; each doc type expands on click.
  const openDocSection = async (docType: keyof typeof DOC.DOC_TYPES = 'sales_invoice') => {
    renderSettings();
    fireEvent.click(screen.getByText(DOC.TITLE));
    await waitFor(() => {
      expect(screen.getByText(DOC.DOC_TYPES[docType])).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(DOC.DOC_TYPES[docType]));
    await waitFor(() => {
      expect(screen.getByLabelText(DOC.TEMPLATE_LABEL)).toBeInTheDocument();
    });
  };

  it('lists all four series in the order the API returns them', async () => {
    renderSettings();
    fireEvent.click(screen.getByText(DOC.TITLE));
    await waitFor(() => {
      expect(screen.getByText(DOC.DOC_TYPES.sales_invoice)).toBeInTheDocument();
    });
    expect(screen.getByText(DOC.DOC_TYPES.sales_return)).toBeInTheDocument();
    expect(screen.getByText(DOC.DOC_TYPES.receipt)).toBeInTheDocument();
    expect(screen.getByText(DOC.DOC_TYPES.purchase_return)).toBeInTheDocument();
    // The summary line shows the backend-rendered SAMPLE (never the live counter).
    expect(screen.getByText(DOC.SUMMARY_EXAMPLE('SI-EL-26-002296'))).toBeInTheDocument();
  });

  it('seeds the expanded form from the scheme, with the one-time cutover left blank', async () => {
    await openDocSection();
    expect(screen.getByLabelText(DOC.TEMPLATE_LABEL)).toHaveValue('SI-EL-{YY}-{SEQ:6}');
    expect(screen.getByLabelText(DOC.START_LABEL)).toHaveValue(null);
    expect(screen.getByLabelText(DOC.RESET_TO_LABEL)).toHaveValue(1);
  });

  // The sales_invoice scheme is annual anchored 1 April, so {YY} is the FINANCIAL
  // year's — computed here independently of the util so the assertion cannot flip in
  // January (calendar-year expectations were only right from April to December).
  const currentFyYy = () => {
    const now = new Date();
    const fy = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
    return String(fy % 100).padStart(2, '0');
  };

  it('examples from reset_to, and from a typed cutover once one is entered', async () => {
    const user = userEvent.setup();
    await openDocSection();
    const yy = currentFyYy();
    // Cutover box blank → the sample rule falls back to reset_to (1).
    expect(screen.getByText(`SI-EL-${yy}-000001`)).toBeInTheDocument();

    await user.type(screen.getByLabelText(DOC.START_LABEL), '2296');
    await waitFor(() => {
      expect(screen.getByText(`SI-EL-${yy}-002296`)).toBeInTheDocument();
    });
  });

  // The live example must agree with the number the server would issue: on the annual
  // 1-April cycle the token year is the PERIOD BUCKET's, so a February preview shows the
  // financial year that is still running. Frozen to 15 Feb 2026 (FY2025) so the two
  // renderings actually differ — from April to December they coincide.
  it('previews the FINANCIAL year in February, and follows an anchor change', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 1, 15));
    try {
      await openDocSection();
      expect(screen.getByText('SI-EL-25-000001')).toBeInTheDocument();

      // Anchor moved to 1 January → the bucket is the calendar year again (legacy).
      fireEvent.mouseDown(screen.getByLabelText(DOC.ANCHOR_MONTH_LABEL));
      fireEvent.click(screen.getByRole('option', { name: DOC.MONTHS[0] }));
      await waitFor(() => {
        expect(screen.getByText('SI-EL-26-000001')).toBeInTheDocument();
      });
    } finally {
      jest.useRealTimers();
    }
  });

  // The summary row shows the SERVER-rendered `preview`; the expanded panel shows the
  // CLIENT mirror. They sit side by side in the UI, so for the same scheme, the same
  // sample sequence and the same period they must agree BYTE FOR BYTE — a disagreement
  // is how an admin loses trust in both. The clock is frozen inside FY2026 so the
  // server fixture ('SI-EL-26-002296', rendered when the server's now() was in FY2026)
  // and the client's now() are in the SAME bucket; the sample sequence is made equal by
  // typing the scheme's own seq_start into the cutover box, which is exactly the
  // `seq_start ?? reset_to` rule the server samples with.
  it("the expanded client preview is byte-identical to the server's summary example", async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 5, 15)); // 15 June 2026 — inside FY2026
    try {
      await openDocSection();
      fireEvent.change(screen.getByLabelText(DOC.START_LABEL), { target: { value: '2296' } });

      const serverPreview = SCHEMES[0].preview as string;
      await waitFor(() => {
        // Panel: the client mirror, rendered from the unsaved form values.
        expect(screen.getByText(serverPreview)).toBeInTheDocument();
      });
      // Summary: the server's own string, untouched by the client renderer.
      expect(screen.getByText(DOC.SUMMARY_EXAMPLE(serverPreview))).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  // Same agreement across the FY boundary: with the clock inside FY2025 the server
  // would have rendered '25', and so must the client. Pinning both sides of the anchor
  // is what proves the agreement is not a coincidence of the current calendar year.
  it('client and server previews agree on the OTHER side of the 1-April anchor too', async () => {
    const fy2025Scheme = { ...SCHEMES[0], preview: 'SI-EL-25-002296' };
    mockUseGetDocNumbering.mockReturnValue(
      createMockQueryResult({ schemes: [fy2025Scheme, ...SCHEMES.slice(1)] }) as any,
    );
    jest.useFakeTimers().setSystemTime(new Date(2026, 1, 15)); // 15 Feb 2026 — still FY2025
    try {
      await openDocSection();
      fireEvent.change(screen.getByLabelText(DOC.START_LABEL), { target: { value: '2296' } });

      await waitFor(() => {
        expect(screen.getByText('SI-EL-25-002296')).toBeInTheDocument();
      });
      expect(screen.getByText(DOC.SUMMARY_EXAMPLE('SI-EL-25-002296'))).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows the annual anchor pickers only for the annual cycle', async () => {
    // sales_return starts on the 'none' cycle, so the anchors start hidden.
    await openDocSection('sales_return');
    expect(screen.queryByLabelText(DOC.ANCHOR_MONTH_LABEL)).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText(DOC.RESET_LABEL));
    fireEvent.click(screen.getByRole('option', { name: DOC.RESET_ANNUAL }));

    await waitFor(() => {
      expect(screen.getByLabelText(DOC.ANCHOR_MONTH_LABEL)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(DOC.ANCHOR_DAY_LABEL)).toHaveValue(1);
  });

  it('saves one doc_type WITHOUT seq_start when no cutover was entered', async () => {
    const user = userEvent.setup();
    await openDocSection();
    await user.click(screen.getByText(DOC.SAVE_BUTTON));

    await waitFor(() => {
      // seq_start is omitted, so the live counter is not rewound by an unrelated edit.
      expect(updateDocNumberingTrigger).toHaveBeenCalledWith({
        doc_type: 'sales_invoice',
        enabled: true,
        template: 'SI-EL-{YY}-{SEQ:6}',
        reset_cycle: 'annual',
        reset_anchor_month: 4,
        reset_anchor_day: 1,
        reset_to: 1,
      });
    });
    await waitFor(() => {
      expect(
        screen.getByText(DOC.SAVE_SUCCESS(DOC.DOC_TYPES.sales_invoice)),
      ).toBeInTheDocument();
    });
  });

  it('sends a typed cutover once, then clears the field', async () => {
    const user = userEvent.setup();
    await openDocSection();
    await user.type(screen.getByLabelText(DOC.START_LABEL), '2296');
    await user.click(screen.getByText(DOC.SAVE_BUTTON));

    await waitFor(() => {
      expect(updateDocNumberingTrigger).toHaveBeenCalledWith(
        expect.objectContaining({ doc_type: 'sales_invoice', seq_start: 2296 }),
      );
    });
    await waitFor(() => {
      expect(screen.getByLabelText(DOC.START_LABEL)).toHaveValue(null);
    });
  });

  it('omits reset_to when the restart field is blanked, never sending 0', async () => {
    const user = userEvent.setup();
    await openDocSection();
    await user.clear(screen.getByLabelText(DOC.RESET_TO_LABEL));
    await user.click(screen.getByText(DOC.SAVE_BUTTON));

    await waitFor(() => {
      expect(updateDocNumberingTrigger).toHaveBeenCalledWith(
        expect.not.objectContaining({ reset_to: expect.anything() }),
      );
    });
  });

  it('blocks save when enabled but the format is empty', async () => {
    const user = userEvent.setup();
    await openDocSection('sales_return');
    // sales_return is disabled with no template in the fixture — turn it on.
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByText(DOC.SAVE_BUTTON));

    await waitFor(() => {
      expect(screen.getByText(DOC.TEMPLATE_REQUIRED)).toBeInTheDocument();
    });
    expect(updateDocNumberingTrigger).not.toHaveBeenCalled();
  });

  it('shows the backend-worded reason inline for an invalid format and blocks save', async () => {
    const user = userEvent.setup();
    await openDocSection();
    const templateField = screen.getByLabelText(DOC.TEMPLATE_LABEL);
    await user.clear(templateField);
    await user.type(templateField, 'NO-SEQ-{YY}');

    await waitFor(() => {
      // Worded with THIS endpoint's request field name, like the backend validator.
      expect(
        screen.getByText('template must contain exactly one SEQ token'),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText(DOC.SAVE_BUTTON));
    expect(updateDocNumberingTrigger).not.toHaveBeenCalled();
  });

  it('surfaces the server message when the save is rejected', async () => {
    updateDocNumberingTrigger.mockReturnValue({
      unwrap: () => Promise.reject({ status: 403, data: { message: 'Forbidden' } }),
    });
    const user = userEvent.setup();
    await openDocSection();
    await user.click(screen.getByText(DOC.SAVE_BUTTON));

    await waitFor(() => {
      expect(screen.getByText('Forbidden')).toBeInTheDocument();
    });
  });

  it('staff org_role sees read-only fields and no save button', async () => {
    mockUseGetMe.mockReturnValue(
      createMockQueryResult({
        user: { id: 2, username: 'staff', email: 's@x.com', first_name: 'S', last_name: 'T', org_role: 'staff' },
        organization: { id: 1, name: 'Test Pharmacy', slug: 'test-pharmacy' },
        activeModules: ['pharmacy'],
      }) as any,
    );
    await openDocSection();
    expect(screen.getByText(DOC.READ_ONLY_NOTE)).toBeInTheDocument();
    expect(screen.getByLabelText(DOC.TEMPLATE_LABEL)).toBeDisabled();
    expect(screen.queryByText(DOC.SAVE_BUTTON)).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // The read-only path in full. The PUT is role-gated server-side (403 for anyone
  // who is not owner/admin), so the UI must (a) never offer the control to those
  // roles, (b) keep EVERY input inert — not just the format field — so nothing
  // can be typed that the server would only reject, and (c) still surface the
  // server's 403 if one ever arrives anyway.
  // ---------------------------------------------------------------------------
  const asRole = (org_role: string) =>
    mockUseGetMe.mockReturnValue(
      createMockQueryResult({
        user: { id: 2, username: org_role, email: 's@x.com', first_name: 'S', last_name: 'T', org_role },
        organization: { id: 1, name: 'Test Pharmacy', slug: 'test-pharmacy' },
        activeModules: ['pharmacy'],
      }) as any,
    );

  it.each(['staff', 'viewer', undefined])(
    'org_role %s: every editable control is disabled and the whole section is inert',
    async (role) => {
      asRole(role as string);
      await openDocSection();

      expect(screen.getByText(DOC.READ_ONLY_NOTE)).toBeInTheDocument();
      expect(screen.getByLabelText(DOC.TEMPLATE_LABEL)).toBeDisabled();
      expect(screen.getByLabelText(DOC.START_LABEL)).toBeDisabled();
      expect(screen.getByLabelText(DOC.RESET_TO_LABEL)).toBeDisabled();
      expect(screen.getByLabelText(DOC.ANCHOR_DAY_LABEL)).toBeDisabled();
      expect(screen.getByRole('checkbox')).toBeDisabled();
      expect(screen.queryByText(DOC.SAVE_BUTTON)).not.toBeInTheDocument();
      // Values are still READABLE — read-only is not hidden.
      expect(screen.getByLabelText(DOC.TEMPLATE_LABEL)).toHaveValue('SI-EL-{YY}-{SEQ:6}');
    },
  );

  it.each(['owner', 'admin'])('org_role %s keeps the save control and no read-only note', async (role) => {
    asRole(role);
    await openDocSection();

    expect(screen.queryByText(DOC.READ_ONLY_NOTE)).not.toBeInTheDocument();
    expect(screen.getByLabelText(DOC.TEMPLATE_LABEL)).not.toBeDisabled();
    expect(screen.getByText(DOC.SAVE_BUTTON)).toBeInTheDocument();
  });

  // A 403 on the GET (the role is not allowed to read the schemes at all) must degrade
  // to the load-error line — never a blank section and never a half-seeded form that
  // looks editable.
  it('a 403 from the schemes query shows the load error and renders no form at all', async () => {
    mockUseGetDocNumbering.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 403, data: { error: 'Forbidden' } },
      isFetching: false,
      isSuccess: false,
      isUninitialized: false,
      refetch: jest.fn(),
    } as any);
    renderSettings();
    fireEvent.click(screen.getByText(DOC.TITLE));

    await waitFor(() => {
      expect(screen.getByText(DOC.LOAD_ERROR)).toBeInTheDocument();
    });
    expect(screen.queryByText(DOC.DOC_TYPES.sales_invoice)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(DOC.TEMPLATE_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByText(DOC.SAVE_BUTTON)).not.toBeInTheDocument();
  });

  it('shows the loading line while the schemes query is in flight', async () => {
    mockUseGetDocNumbering.mockReturnValue(createMockQueryResult(undefined, true) as any);
    renderSettings();
    fireEvent.click(screen.getByText(DOC.TITLE));

    await waitFor(() => {
      expect(screen.getByText(DOC.LOADING)).toBeInTheDocument();
    });
    expect(screen.queryByText(DOC.DOC_TYPES.sales_invoice)).not.toBeInTheDocument();
  });

  // Belt and braces: if the PUT 403s anyway (role changed in another tab, or a direct
  // call), the server's message is what the admin sees — not a generic failure.
  it('surfaces a 403 from the PUT verbatim', async () => {
    updateDocNumberingTrigger.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: 403, data: { error: 'Only an owner or admin can change numbering' } }),
    });
    const user = userEvent.setup();
    await openDocSection();
    await user.click(screen.getByText(DOC.SAVE_BUTTON));

    await waitFor(() => {
      expect(screen.getByText('Only an owner or admin can change numbering')).toBeInTheDocument();
    });
  });
});
