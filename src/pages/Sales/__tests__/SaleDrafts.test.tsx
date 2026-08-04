import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SaleDrafts from '../SaleDrafts';
import * as draftsApi from '../../../redux/slices/draftsApi';

const theme = createTheme();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../redux/slices/draftsApi');

type DraftRow = draftsApi.DraftListItem;

const makeDraft = (over: Partial<DraftRow> = {}): DraftRow => ({
  id: 1,
  customer_name: 'John Doe',
  customer_phone: '5551231000',
  invoice_number: 'INV-1',
  invoice_date: '2026-08-01',
  total_amount: '100',
  item_count: 2,
  status: 'DRAFT',
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-01T10:00:00Z',
  ...over,
});

// Minimal store: the component only uses useDispatch (to seed the cart on resume);
// a stub cart reducer is enough (mirrors SaleHistory.test.tsx).
const createMockStore = () =>
  configureStore({
    reducer: {
      cart: (state = { items: [], formData: null }) => state,
    },
  });

// Mutable per-test handles for the mocked draftsApi hooks.
let deleteDraftMock: jest.Mock;
let deleteUnwrap: jest.Mock;
let triggerGetDraft: jest.Mock;

const setupHooks = (opts: {
  data?: DraftRow[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  openResolves?: boolean; // false → pending promise so openingId stays set
  isDeleting?: boolean;
}) => {
  (draftsApi.useGetDraftsQuery as jest.Mock) = jest.fn(() => ({
    data: opts.data ?? [],
    isLoading: opts.isLoading ?? false,
    isError: opts.isError ?? false,
    error: opts.error ?? null,
  }));

  triggerGetDraft = jest.fn(() => ({
    unwrap: () =>
      opts.openResolves === false
        ? new Promise(() => {}) // never resolves → row stays in the "opening" state
        : Promise.resolve({ id: 1, payload: { items: [], formData: null, splitPayments: [] } }),
  }));
  (draftsApi.useLazyGetDraftQuery as jest.Mock) = jest.fn(() => [triggerGetDraft]);

  deleteUnwrap = jest.fn(() => Promise.resolve({ message: 'ok', id: 1 }));
  deleteDraftMock = jest.fn(() => ({ unwrap: deleteUnwrap }));
  (draftsApi.useDeleteDraftMutation as jest.Mock) = jest.fn(() => [
    deleteDraftMock,
    { isLoading: opts.isDeleting ?? false },
  ]);
};

const renderComponent = () =>
  render(
    <Provider store={createMockStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <SaleDrafts />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

describe('SaleDrafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading spinner while drafts are loading', () => {
    setupHooks({ isLoading: true });
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the error message when the query fails', () => {
    setupHooks({ isError: true, error: { data: { message: 'Boom failed to load' } } });
    renderComponent();
    expect(screen.getByText(/boom failed to load/i)).toBeInTheDocument();
  });

  it('renders the empty message when there are no drafts', () => {
    setupHooks({ data: [] });
    renderComponent();
    expect(
      screen.getByText(/no saved drafts yet\. save a sale as a draft to see it here\./i)
    ).toBeInTheDocument();
  });

  it('renders a populated list of drafts', () => {
    setupHooks({
      data: [
        makeDraft({ id: 1, customer_name: 'John Doe' }),
        makeDraft({ id: 2, customer_name: 'Jane Roe' }),
      ],
    });
    renderComponent();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Roe')).toBeInTheDocument();
  });

  describe('Amount column numeric sort', () => {
    // Two drafts whose amounts sort DIFFERENTLY under numeric vs lexicographic ordering:
    //   numeric asc:        90  <  1000   → Beta, then Alpha
    //   lexicographic asc: "1000" < "90"  → Alpha, then Beta
    // Proving Beta-before-Alpha on asc proves the string→number coercion.
    const sortData = [
      makeDraft({ id: 1, customer_name: 'Alpha', total_amount: '1000', created_at: '2026-08-01T09:00:00Z' }),
      makeDraft({ id: 2, customer_name: 'Beta', total_amount: '90', created_at: '2026-08-02T09:00:00Z' }),
    ];

    const clickAmountSort = () => {
      const amountHeader = screen.getByText('Amount').closest('th') as HTMLElement;
      const upArrow = amountHeader.querySelector(
        '[data-testid="KeyboardArrowUpIcon"]'
      ) as HTMLElement;
      fireEvent.click(upArrow);
    };

    const bodyRowNames = () =>
      screen
        .getAllByRole('row')
        .slice(1) // drop the header row
        .map((row) => (within(row).queryByText(/Alpha|Beta/)?.textContent ?? ''));

    it('sorts the Amount column numerically, not lexicographically', () => {
      setupHooks({ data: sortData });
      renderComponent();

      // Amounts render rounded + localised: "1000" → "1,000", "90" → "90".
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();

      // First click on the Amount header → ascending.
      clickAmountSort();

      const names = bodyRowNames();
      // Numeric asc → 90 (Beta) before 1000 (Alpha). Lexicographic would be the reverse.
      expect(names).toEqual(['Beta', 'Alpha']);
    });

    it('reverses to descending on the second Amount click (numeric)', () => {
      setupHooks({ data: sortData });
      renderComponent();

      const clickIt = () => clickAmountSort();
      clickIt(); // asc
      clickIt(); // desc

      const names = bodyRowNames();
      // Numeric desc → 1000 (Alpha) before 90 (Beta).
      expect(names).toEqual(['Alpha', 'Beta']);
    });
  });

  describe('row actions', () => {
    it('exposes accessible Open and Discard icon buttons per row', () => {
      setupHooks({ data: [makeDraft()] });
      renderComponent();
      expect(screen.getByLabelText('Open draft')).toBeInTheDocument();
      expect(screen.getByLabelText('Discard draft')).toBeInTheDocument();
    });

    it('opens the confirmation dialog and calls deleteDraft on confirm', async () => {
      setupHooks({ data: [makeDraft({ id: 7 })] });
      renderComponent();

      // Dialog is not shown until Discard is clicked.
      expect(screen.queryByText(/are you sure you want to discard this draft/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Discard draft'));

      // ConfirmationDialog now visible.
      expect(
        screen.getByText(/are you sure you want to discard this draft/i)
      ).toBeInTheDocument();

      // Confirm → deleteDraft(id).unwrap().
      fireEvent.click(screen.getByRole('button', { name: /^discard$/i }));

      await waitFor(() => {
        expect(deleteDraftMock).toHaveBeenCalledWith(7);
        expect(deleteUnwrap).toHaveBeenCalled();
      });
    });

    it('does not call deleteDraft when the dialog is cancelled', async () => {
      setupHooks({ data: [makeDraft({ id: 7 })] });
      renderComponent();

      fireEvent.click(screen.getByLabelText('Discard draft'));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(deleteDraftMock).not.toHaveBeenCalled();
      // MUI Dialog unmounts after its exit transition — wait it out.
      await waitFor(() =>
        expect(
          screen.queryByText(/are you sure you want to discard this draft/i)
        ).not.toBeInTheDocument()
      );
    });

    it('scopes the per-row Open disabled state to the opened row only', async () => {
      setupHooks({
        openResolves: false, // keep openingId set so the disabled state is observable
        data: [
          makeDraft({ id: 1, customer_name: 'Alpha', created_at: '2026-08-02T09:00:00Z' }),
          makeDraft({ id: 2, customer_name: 'Beta', created_at: '2026-08-01T09:00:00Z' }),
        ],
      });
      renderComponent();

      // Default sort is created_at desc → Alpha (later) is the first row.
      const alphaRow = screen.getByText('Alpha').closest('tr') as HTMLElement;
      const betaRow = screen.getByText('Beta').closest('tr') as HTMLElement;

      const alphaOpen = within(alphaRow).getByLabelText('Open draft');
      const betaOpen = within(betaRow).getByLabelText('Open draft');

      // Both enabled before any interaction.
      expect(alphaOpen).not.toBeDisabled();
      expect(betaOpen).not.toBeDisabled();

      fireEvent.click(alphaOpen);

      // Only Alpha's Open button becomes disabled (spinner); Beta's stays enabled.
      await waitFor(() => {
        expect(within(alphaRow).getByLabelText('Open draft')).toBeDisabled();
      });
      expect(within(betaRow).getByLabelText('Open draft')).not.toBeDisabled();
      expect(triggerGetDraft).toHaveBeenCalledWith(1);
    });
  });
});
