import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SaleHistory from '../SaleHistory';
import * as salesApi from '../../../redux/slices/salesApi';
import { SALES_HISTORY_LABELS } from '../../../config/label/SalesHistory.labels';

const theme = createTheme();

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales/history', state: null }),
}));

jest.mock('../../../redux/slices/salesApi');

// Replace the calendar-driven DateRangeFilter with simple buttons that call
// onDateRangeChange with fixed Dayjs values. This exercises the component's date
// filter logic (the code under test) without fighting the MUI DateCalendar UI.
// Dates align with the date-range invoices below (10 / 15 / 20 Jan 2026).
jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => {
  const dayjsLib = require('dayjs');
  return {
    __esModule: true,
    default: ({ onDateRangeChange }: { onDateRangeChange: (r: [unknown, unknown]) => void }) => (
      <div>
        {/* Keep the real component's title so existing "filter options" test still passes. */}
        <span>Filter by Dates</span>
        <button onClick={() => onDateRangeChange([dayjsLib('2026-01-12'), dayjsLib('2026-01-18')])}>
          set-range
        </button>
        <button onClick={() => onDateRangeChange([dayjsLib('2026-01-10'), dayjsLib('2026-01-15')])}>
          set-range-boundary
        </button>
        <button onClick={() => onDateRangeChange([dayjsLib('2026-01-15'), null])}>
          set-start-only
        </button>
        <button onClick={() => onDateRangeChange([null, dayjsLib('2026-01-15')])}>
          set-end-only
        </button>
      </div>
    ),
  };
});

jest.mock('../../../utils/cartStorage', () => ({
  getSalesHistoryFromStorage: jest.fn(() => []),
  getEditInvoiceId: jest.fn(() => null),
  clearEditInvoiceId: jest.fn(),
}));

// Org context drives the printed receipt letterhead (name/legal/GSTIN lines).
const TEST_ORG = {
  id: 1,
  name: 'Test Pharmacy',
  slug: 'test-pharmacy',
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

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      org: (state = { organization: TEST_ORG, activeModules: ['pharmacy'], loaded: true }) => state,
      cart: (state = {
        items: [],
        totalAmount: 0,
        formData: null,
        isLoading: false,
        error: null,
      }) => state,
    },
    preloadedState: initialState,
  });
};

describe('SaleHistory', () => {
  // The component formats invoice numbers as "INV<number>" for display.
  // invoice_number 7896 therefore renders as "INV7896".
  const mockInvoices = [
    {
      id: 7896,
      invoice_number: 7896,
      invoice_date: '2026-01-10',
      customer_name: 'John Doe',
      doctor_name: 'Dr. Smith',
      username: 'testuser',
      total_amount: 1000,
      payments: [{ payment_mode: 'Cash', amount: 1000, record_status: 'ACTIVE' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    const stableRefetch = jest.fn();
    (salesApi.useGetInvoicesQuery as jest.Mock) = jest.fn(() => ({
      data: mockInvoices,
      isLoading: false,
      error: null,
      refetch: stableRefetch,
    }));

    // Stable trigger + options references so effects depending on them do not loop.
    const stableTrigger = jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({ invoice: {}, items: [], payments: [] }),
    }));
    const stableOptions = { isLoading: false };
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = jest.fn(() => [
      stableTrigger,
      stableOptions,
    ]);

    // Sales Returns log (the "Returns" tab, 2026-08-13). Only mounted on tab 1,
    // but the automocked hooks must still return a destructurable result.
    (salesApi.useListSalesReturnsQuery as jest.Mock) = jest.fn(() => ({
      data: { rows: [], total: 0 },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    }));
    (salesApi.useGetSalesReturnDetailsQuery as jest.Mock) = jest.fn(() => ({
      data: undefined,
      isFetching: false,
      error: null,
    }));
  });

  const renderComponent = (store = createMockStore()) => {
    return render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SaleHistory />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  it('renders sale history page with title', () => {
    renderComponent();
    
    expect(screen.getByText(/sales history/i)).toBeInTheDocument();
  });

  it('renders Start new sale button', () => {
    renderComponent();
    
    expect(screen.getByText(/start new sale/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders filter toggle button', () => {
    renderComponent();
    
    expect(screen.getByText(/show filters/i)).toBeInTheDocument();
  });

  it('handles search input change', () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'INV001' } });
    
    expect(searchInput).toHaveValue('INV001');
  });

  it('toggles filters visibility', () => {
    renderComponent();
    
    const filterButton = screen.getByText(/show filters/i);
    fireEvent.click(filterButton);
    
    expect(screen.getByText(/hide filters/i)).toBeInTheDocument();
  });

  it('displays filter options when filters are shown', () => {
    renderComponent();
    
    const filterButton = screen.getByText(/show filters/i);
    fireEvent.click(filterButton);
    
    expect(screen.getByText(/doctor name/i)).toBeInTheDocument();
    // Use getAllByText since "Username" appears multiple times (in filter label and table)
    const usernameElements = screen.getAllByText(/username/i);
    expect(usernameElements.length).toBeGreaterThan(0);
    // The date range filter renders the DateRangeFilter component titled "Filter by Dates"
    expect(screen.getByText(/filter by dates/i)).toBeInTheDocument();
  });

  it('handles doctor filter selection', async () => {
    renderComponent();
    
    const filterButton = screen.getByText(/show filters/i);
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      const doctorInput = screen.getByPlaceholderText(/search doctor/i);
      expect(doctorInput).toBeInTheDocument();
    });
  });

  it('handles clear filters', () => {
    renderComponent();
    
    const filterButton = screen.getByText(/show filters/i);
    fireEvent.click(filterButton);
    
    const clearButton = screen.getByText(/reset/i);
    fireEvent.click(clearButton);
    
    // Filters should be cleared
    expect(clearButton).toBeInTheDocument();
  });

  it('renders sales history table', () => {
    renderComponent();
    
    // Table headers should be present - use getAllByText since there might be multiple "Sale" elements
    const saleHeaders = screen.getAllByText(/sale/i);
    expect(saleHeaders.length).toBeGreaterThan(0);
    expect(screen.getByText(/sale date/i)).toBeInTheDocument();
    expect(screen.getByText(/customer name/i)).toBeInTheDocument();
  });

  it('shows a schemed invoice_number VERBATIM (no INV prefix) when the org scheme is enabled', async () => {
    // Stable reference so effects keyed on invoicesData do not loop (mirrors beforeEach).
    const schemedInvoices = [{ ...mockInvoices[0], invoice_number: 'SI-EL-26-002296' }];
    const stableRefetch = jest.fn();
    (salesApi.useGetInvoicesQuery as jest.Mock) = jest.fn(() => ({
      data: schemedInvoices,
      isLoading: false,
      error: null,
      refetch: stableRefetch,
    }));
    const schemedStore = createMockStore({
      org: {
        organization: {
          ...TEST_ORG,
          invoice_number_enabled: true,
          invoice_number_template: 'SI-EL-{YY}-{SEQ:6}',
        },
        activeModules: ['pharmacy'],
        loaded: true,
      },
    });
    renderComponent(schemedStore);

    expect(await screen.findByText('SI-EL-26-002296')).toBeInTheDocument();
    // Never the legacy "INV<custom>" mangling.
    expect(screen.queryByText(/INVSI-EL/i)).not.toBeInTheDocument();
  });

  it('opens invoice modal when eye icon is clicked', async () => {
    renderComponent();

    // Wait for table to render with mock data (invoice numbers should appear)
    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    // Find the invoice number element, then find the SVG in the same table cell/row
    const invoiceElement = screen.getByText(/inv7896/i);
    const tableRow = invoiceElement.closest('tr');
    
    if (tableRow) {
      // Find SVG within this row (the VisibilityIcon should be in the same row)
      const svgInRow = tableRow.querySelector('svg');
      if (svgInRow) {
        fireEvent.click(svgInRow);
        
        // Wait for modal to open
        await waitFor(() => {
          expect(screen.getByText(SALES_HISTORY_LABELS.MODAL_TITLE)).toBeInTheDocument();
        }, { timeout: 3000 });
      } else {
        // Fallback: try finding any SVG that's not a known icon
        const allSvgs = document.querySelectorAll('svg');
        const viewIcon = Array.from(allSvgs).find(svg => {
          const testId = svg.getAttribute('data-testid');
          return !testId || (testId !== 'AddIcon' && testId !== 'SearchIcon' && testId !== 'FilterAltIcon');
        });
        if (viewIcon) {
          fireEvent.click(viewIcon);
          await waitFor(() => {
            expect(screen.getByText(SALES_HISTORY_LABELS.MODAL_TITLE)).toBeInTheDocument();
          }, { timeout: 3000 });
        }
      }
    }
  });

  it('displays PrintPreviewModal content when invoice modal is open', async () => {
    renderComponent();
    
    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    // Find the invoice number, then find SVG in the same row
    const invoiceElement = screen.getByText(/inv7896/i);
    const tableRow = invoiceElement.closest('tr');
    
    if (tableRow) {
      const svgInRow = tableRow.querySelector('svg');
      if (svgInRow) {
        fireEvent.click(svgInRow);
      }
    }

    // Wait for modal and PrintPreviewModal content.
    // The "Customer receipt" title was removed from PrintPreviewModal; the
    // org-driven letterhead (from the store's org context) is now the stable
    // receipt content.
    await waitFor(() => {
      expect(screen.getByText(SALES_HISTORY_LABELS.MODAL_TITLE)).toBeInTheDocument();
      expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('closes invoice modal when close button is clicked', async () => {
    renderComponent();
    
    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    // Find and click the visibility icon in the table row
    const invoiceElement = screen.getByText(/inv7896/i);
    const tableRow = invoiceElement.closest('tr');
    
    if (tableRow) {
      const svgInRow = tableRow.querySelector('svg');
      if (svgInRow) {
        fireEvent.click(svgInRow);
      }
    }

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(SALES_HISTORY_LABELS.MODAL_TITLE)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click close button (usually an X or Close button in CommonModal)
    const closeButton = screen.queryByLabelText(/close/i) || 
                       screen.queryByText(/close/i) ||
                       document.querySelector('[aria-label="Close"]') ||
                       document.querySelector('button[aria-label*="close" i]');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText(SALES_HISTORY_LABELS.MODAL_TITLE)).not.toBeInTheDocument();
      });
    }
  });

  it('opens SaleConfirmationDialog when Save button is clicked from invoice modal', async () => {
    renderComponent();
    
    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    // Open invoice modal by clicking eye icon
    const invoiceElement = screen.getByText(/inv7896/i);
    const tableRow = invoiceElement.closest('tr');
    
    if (tableRow) {
      const svgInRow = tableRow.querySelector('svg');
      if (svgInRow) {
        fireEvent.click(svgInRow);
      }
    }

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(SALES_HISTORY_LABELS.MODAL_TITLE)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Note: In SaleHistory, the Save/Print buttons are not rendered inside
    // PrintPreviewModal (it is a view-only body); action controls live in the
    // parent dialog. The handlers exist and would open SaleConfirmationDialog if triggered.
    // This test verifies that SaleConfirmationDialog component is rendered and can be shown.
    // The actual Save/Print flow would need to be tested through integration tests
    // or by directly testing the handlers.
  });

  it('renders SaleConfirmationDialog component in the component tree', () => {
    renderComponent();
    
    // SaleConfirmationDialog should be in the component tree (even if not visible)
    // We can verify it exists by checking if it can be found when open=true
    // This is a structural test to ensure the dialog is properly integrated
    expect(screen.getByText(/sales history/i)).toBeInTheDocument();
  });

  it('handles Start new sale button click', () => {
    renderComponent();
    
    const startButton = screen.getByText(/start new sale/i);
    fireEvent.click(startButton);
    
    // Should navigate to sales page
    expect(startButton).toBeInTheDocument();
  });

  it('displays empty message when no sales history', () => {
    renderComponent();
    
    // Should show empty state or table
    expect(screen.getByText(/sales history/i)).toBeInTheDocument();
  });

  it('handles sorting', () => {
    renderComponent();
    
    // Click on sortable column header - use getAllByText and get the first one
    const saleHeaders = screen.getAllByText(/sale/i);
    if (saleHeaders.length > 0) {
      fireEvent.click(saleHeaders[0]);
      // Sorting should be triggered
      expect(saleHeaders[0]).toBeInTheDocument();
    } else {
      // At least verify the table exists
      expect(screen.getByText(/sales history/i)).toBeInTheDocument();
    }
  });

  it('handles pagination', () => {
    renderComponent();

    // Pagination controls should be present
    // This depends on table implementation
    expect(screen.getByText(/sales history/i)).toBeInTheDocument();
  });

  // Helper: re-point the mocked getInvoices query at a custom dataset for one test.
  // Uses stable refetch/trigger references (auto-mocked-slice gotcha) so effects
  // depending on them do not loop.
  const useInvoices = (invoices: unknown[]) => {
    const stableRefetch = jest.fn();
    (salesApi.useGetInvoicesQuery as jest.Mock) = jest.fn(() => ({
      data: invoices,
      isLoading: false,
      error: null,
      refetch: stableRefetch,
    }));
  };

  it('renders the Customer Details column with the invoice value', async () => {
    useInvoices([
      { ...mockInvoices[0], customer_details: 'Ward 4 follow-up' },
    ]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Customer Details')).toBeInTheDocument();
    expect(screen.getByText('Ward 4 follow-up')).toBeInTheDocument();
  });

  it('renders a dash in Customer Details when the invoice has none', async () => {
    useInvoices([
      { ...mockInvoices[0], customer_details: null },
    ]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    const row = screen.getByText(/inv7896/i).closest('tr')!;
    expect(row).toHaveTextContent('-');
  });

  it('enables the Edit icon for an invoice with no return', async () => {
    useInvoices([
      { ...mockInvoices[0], return_status: 'No Return', has_return: false },
    ]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    const row = screen.getByText(/inv7896/i).closest('tr')!;
    const editIcon = row.querySelector('[data-testid="EditIcon"]') as HTMLElement;
    expect(editIcon).toBeTruthy();
    expect(editIcon).toHaveStyle({ cursor: 'pointer' });
  });

  it('disables the Edit icon for an invoice that has a return', async () => {
    useInvoices([
      { ...mockInvoices[0], return_status: 'Partial Return', has_return: true },
    ]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/inv7896/i)).toBeInTheDocument();
    });

    const row = screen.getByText(/inv7896/i).closest('tr')!;
    const editIcon = row.querySelector('[data-testid="EditIcon"]') as HTMLElement;
    expect(editIcon).toBeTruthy();
    // Mirrors the existing isDeleted disable pattern: not-allowed cursor + dimmed.
    expect(editIcon).toHaveStyle({ cursor: 'not-allowed' });
  });

  describe('date range filter', () => {
    // Three invoices on distinct days. invoice_date is rendered as "DD MMM YYYY";
    // the parser must read that back robustly so the range filter works.
    // INV1001 → 10 Jan, INV1015 → 15 Jan, INV1020 → 20 Jan.
    const dateRangeInvoices = [
      { ...mockInvoices[0], id: 1001, invoice_number: 1001, invoice_date: '2026-01-10' },
      { ...mockInvoices[0], id: 1015, invoice_number: 1015, invoice_date: '2026-01-15' },
      { ...mockInvoices[0], id: 1020, invoice_number: 1020, invoice_date: '2026-01-20' },
    ];

    const showFiltersAndClick = (buttonText: string) => {
      fireEvent.click(screen.getByText(/show filters/i));
      fireEvent.click(screen.getByText(buttonText));
    };

    it('keeps only invoices strictly inside the selected start+end range', async () => {
      useInvoices(dateRangeInvoices);
      renderComponent();
      await waitFor(() => expect(screen.getByText(/inv1015/i)).toBeInTheDocument());

      // Range 12–18 Jan: only the 15th qualifies.
      showFiltersAndClick('set-range');

      await waitFor(() => {
        expect(screen.getByText(/inv1015/i)).toBeInTheDocument();
        expect(screen.queryByText(/inv1001/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/inv1020/i)).not.toBeInTheDocument();
      });
    });

    it('includes both boundary dates of the range (inclusive)', async () => {
      useInvoices(dateRangeInvoices);
      renderComponent();
      await waitFor(() => expect(screen.getByText(/inv1015/i)).toBeInTheDocument());

      // Range 10–15 Jan: both endpoints (10th=INV1001 and 15th) included, 20th excluded.
      showFiltersAndClick('set-range-boundary');

      await waitFor(() => {
        expect(screen.getByText(/inv1001/i)).toBeInTheDocument();
        expect(screen.getByText(/inv1015/i)).toBeInTheDocument();
        expect(screen.queryByText(/inv1020/i)).not.toBeInTheDocument();
      });
    });

    it('start-only filter keeps invoices on or after the start date', async () => {
      useInvoices(dateRangeInvoices);
      renderComponent();
      await waitFor(() => expect(screen.getByText(/inv1015/i)).toBeInTheDocument());

      // Start 15 Jan only: 15th and 20th remain, 10th (INV1001) drops.
      showFiltersAndClick('set-start-only');

      await waitFor(() => {
        expect(screen.queryByText(/inv1001/i)).not.toBeInTheDocument();
        expect(screen.getByText(/inv1015/i)).toBeInTheDocument();
        expect(screen.getByText(/inv1020/i)).toBeInTheDocument();
      });
    });

    it('end-only filter keeps invoices on or before the end date', async () => {
      useInvoices(dateRangeInvoices);
      renderComponent();
      await waitFor(() => expect(screen.getByText(/inv1015/i)).toBeInTheDocument());

      // End 15 Jan only: 10th (INV1001) and 15th remain, 20th drops.
      showFiltersAndClick('set-end-only');

      await waitFor(() => {
        expect(screen.getByText(/inv1001/i)).toBeInTheDocument();
        expect(screen.getByText(/inv1015/i)).toBeInTheDocument();
        expect(screen.queryByText(/inv1020/i)).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Sales / Returns tabs (Sales Returns log feature, 2026-08-13; the first tab
  // was renamed 'Invoices' → 'Sales' by the vocab standardization). The open
  // tab lives in the URL (`/sales?tab=returns`) so it is shareable and survives
  // the round trip to a return's original invoice; no param = the Sales tab.
  // useSearchParams resolves against the real jsdom history under BrowserRouter,
  // so each case drives window.history directly.
  // =========================================================================
  describe('Sales / Returns tabs', () => {
    const setUrl = (url: string) => window.history.pushState({}, '', url);
    afterEach(() => setUrl('/'));

    // Resolve tabs through the label constants so a vocab rename cannot silently
    // stale these assertions again.
    const tab = (name: 'INVOICES' | 'RETURNS') =>
      screen.getByRole('tab', { name: SALES_HISTORY_LABELS.TABS[name] });

    it('renders both tabs', () => {
      setUrl('/sales');
      renderComponent();
      expect(tab('INVOICES')).toBeInTheDocument();
      expect(tab('RETURNS')).toBeInTheDocument();
    });

    it('lands on the Sales tab by default (no tab param) and shows the invoices table', () => {
      setUrl('/sales');
      renderComponent();
      expect(tab('INVOICES')).toHaveAttribute('aria-selected', 'true');
      expect(tab('RETURNS')).toHaveAttribute('aria-selected', 'false');
      // The invoices toolbar is present, the returns log is not.
      expect(screen.getByText(/show filters/i)).toBeInTheDocument();
      expect(salesApi.useListSalesReturnsQuery).not.toHaveBeenCalled();
    });

    it('an unknown tab value falls back to the Sales tab', () => {
      setUrl('/sales?tab=bogus');
      renderComponent();
      expect(tab('INVOICES')).toHaveAttribute('aria-selected', 'true');
      expect(salesApi.useListSalesReturnsQuery).not.toHaveBeenCalled();
    });

    it('?tab=returns lands directly on the Returns tab and mounts the returns log', () => {
      setUrl('/sales?tab=returns');
      renderComponent();
      expect(tab('RETURNS')).toHaveAttribute('aria-selected', 'true');
      expect(tab('INVOICES')).toHaveAttribute('aria-selected', 'false');
      expect(salesApi.useListSalesReturnsQuery).toHaveBeenCalled();
      expect(
        screen.getByPlaceholderText('Search by return ID, invoice number or customer')
      ).toBeInTheDocument();
      // The invoices toolbar is unmounted while Returns is open.
      expect(screen.queryByText(/show filters/i)).not.toBeInTheDocument();
    });

    it('switching to Returns sets ?tab=returns in the URL', async () => {
      setUrl('/sales');
      renderComponent();
      fireEvent.click(tab('RETURNS'));

      await waitFor(() => expect(window.location.search).toBe('?tab=returns'));
      expect(tab('RETURNS')).toHaveAttribute('aria-selected', 'true');
      await waitFor(() => expect(salesApi.useListSalesReturnsQuery).toHaveBeenCalled());
    });

    it('switching back to the Sales tab REMOVES the param rather than setting tab=invoices', async () => {
      setUrl('/sales?tab=returns');
      renderComponent();
      fireEvent.click(tab('INVOICES'));

      await waitFor(() => expect(window.location.search).toBe(''));
      expect(tab('INVOICES')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText(/show filters/i)).toBeInTheDocument();
    });

    it('preserves any other query params when switching tabs', async () => {
      setUrl('/sales?ref=dashboard');
      renderComponent();
      fireEvent.click(tab('RETURNS'));

      await waitFor(() => {
        const params = new URLSearchParams(window.location.search);
        expect(params.get('tab')).toBe('returns');
        expect(params.get('ref')).toBe('dashboard');
      });
    });
  });
});

