import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalesReceipt from '../SalesReceipt';
import { executeSave } from '../SalesReceipt.saveHandler';
import cartReducer from '../../../redux/slices/cartSlice';
import * as salesApi from '../../../redux/slices/salesApi';
import * as receiveApi from '../../../redux/slices/receiveApi';

// Bug 2026-10-19 (prod data corruption): Sale History -> Edit -> Save multiplied every line's
// stored per-strip invoice_lines.mrp by its quantity on each save (100 -> 300 -> 900), and Save
// was enabled on an untouched invoice. Edit mode must keep the stored mrp, send only changed
// lines as Edited, and keep Save disabled until something changes.

// Stable trigger identity per hook, like RTK Query — a fresh function on every render would
// re-run the page's invoice-load effect and reset the form mid-test.
const makeMutation = (resolved: any = { data: {} }) => {
  const result = [jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue(resolved) })), { isLoading: false }];
  return jest.fn(() => result);
};

let mockLocationState: any = null;
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/sales/receipt', state: mockLocationState }),
}));
jest.mock('../../../redux/slices/orgApi', () => ({
  orgApi: { util: { invalidateTags: () => ({ type: 'orgApi/invalidateTags' }) } },
  useGetNextDocumentNumberQuery: () => ({ data: undefined, isFetching: false }),
}));
jest.mock('../../../redux/slices/salesApi');
jest.mock('../../../redux/slices/receiveApi');
jest.mock('../../../utils/cartStorage', () => ({
  clearCartFromStorage: jest.fn(),
  clearFormDataFromStorage: jest.fn(),
  getCartFromStorage: jest.fn(() => ({ items: [], total: 0 })),
  getFormDataFromStorage: jest.fn(() => null),
  setEditInvoiceId: jest.fn(),
  saveSalesHistoryToStorage: jest.fn(),
}));

const line = (overrides: Record<string, any>) => ({
  invoice_id: 13,
  quantity: '3.00',
  rate: '10.0000',
  selling_price: '10.00',
  discount: '0.0000',
  discount_authority: null,
  cgst: '2.5000',
  sgst: '2.5000',
  igst: '0.0000',
  product_type: 'Tablet',
  hsn_id: '30049099',
  schedule: null,
  brand_name: 'Cipla',
  expiry_date: '2027-12-31T06:00:00.000Z',
  returned_quantity: 0,
  ...overrides,
});

// Shape captured from the live get-invoice-details response in the E2E repro.
const invoiceDetails = {
  invoice: {
    id: 13,
    invoice_number: '1',
    customer_id: 1,
    customer_phone: '+919876543210',
    customer_details: null,
    doctor_id: 1,
    discount: '0.0000',
    total_amount: '90.00',
    record_status: 'ACTIVE',
    invoice_date: '2026-10-19',
    patient_type: 1,
  },
  customer_phone: '+919876543210',
  doctor: { id: '1', name: 'Arvind Rao', phone: '+919900112233', email: 'arvind.rao@medicare.in' },
  lines: [
    line({ invoice_line_id: 23, product_id: 1, batch_number: 'MRPR-A10', mrp: '100.0000', name: 'Strip10', pack_qty: 10 }),
    line({ invoice_line_id: 24, product_id: 2, batch_number: 'MRPR-B1', quantity: '2.00', rate: '30.0000', selling_price: '30.00', mrp: '30.0000', name: 'Single', pack_qty: 1 }),
  ],
  payments: [{ id: 1, direction: 'IN', payment_method: 'CASH', payment_amount: 90, status: 'ACTIVE' }],
  total_refunded: 0,
};

const organization = {
  id: 1,
  name: 'EleMed',
  slug: 'elemed',
  invoice_number_enabled: false,
  invoice_number_template: null,
  invoice_number_reset: 'none' as const,
  invoice_seq_start: null,
};

const renderEditScreen = () =>
  render(
    <Provider
      store={configureStore({
        reducer: {
          auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
          org: (state = { organization, activeModules: ['pharmacy'], loaded: true }) => state,
          cart: cartReducer,
        },
      })}
    >
      <ThemeProvider theme={createTheme()}>
        <BrowserRouter>
          <SalesReceipt />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

const saveButton = () => screen.getByRole('button', { name: 'Save' });

describe('SalesReceipt edit mode — stored MRP and change detection', () => {
  let editTrigger: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // What SaleHistory passes when Edit is clicked.
    mockLocationState = {
      isEditMode: true,
      invoiceId: 13,
      customer_id: 1,
      customerName: 'Meher Baba',
      customerMobile: '+919876543210',
      customerCity: '',
      doctorName: 'Arvind Rao',
      doctorMobile: '',
      doctorEmail: '',
      paymentMode: 'CASH',
      invoiceNumber: 'INV1',
      salesItems: [],
    };
    editTrigger = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ message: 'ok', invoice_id: 13 }) }));
    const doctorNames = { data: ['Arvind Rao'], isLoading: false };
    const customerNames = { data: [], refetch: jest.fn() };
    const customerOptions = { data: [], isLoading: false };
    (salesApi.useGetDoctorNamesQuery as jest.Mock) = jest.fn(() => doctorNames);
    (salesApi.useGetAllCustomerNamesQuery as jest.Mock) = jest.fn(() => customerNames);
    (salesApi.useGetCustomerOptionsQuery as jest.Mock) = jest.fn(() => customerOptions);
    (salesApi.useSubmitSaleMutation as jest.Mock) = makeMutation();
    (salesApi.useAddCustomerMutation as jest.Mock) = makeMutation();
    (salesApi.useGetCustomerPhonesMutation as jest.Mock) = makeMutation();
    // The doctor auto-fill path: one exact match fills mobile + email after load.
    (salesApi.useGetDoctorPhonesAndEmailsMutation as jest.Mock) = makeMutation({
      info: [{ phone: '+919900112233', email: 'arvind.rao@medicare.in' }],
    });
    (salesApi.useUpdateSalesMutation as jest.Mock) = makeMutation();
    const editResult = [editTrigger, { isLoading: false }];
    (salesApi.useEditSaleMutation as jest.Mock) = jest.fn(() => editResult);
    (salesApi.useDeleteSalesMutation as jest.Mock) = makeMutation();
    (salesApi.useUpsertInvoicePaymentsMutation as jest.Mock) = makeMutation();
    (salesApi.useDeleteInvoiceMutation as jest.Mock) = makeMutation();
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation(invoiceDetails);
    const products = { data: [{ product_id: 1, name: 'Strip10' }, { product_id: 2, name: 'Single' }], isLoading: false, isError: false, error: null };
    (receiveApi.useGetProductsQuery as jest.Mock) = jest.fn(() => products);
  });

  it('keeps Save disabled on an untouched invoice and enables it after a change', async () => {
    renderEditScreen();
    await waitFor(() => expect(screen.getAllByText('Strip10').length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.getByDisplayValue('+919900112233')).toBeInTheDocument());

    expect(saveButton()).toBeDisabled();

    fireEvent.change(screen.getAllByPlaceholderText('Details')[0], { target: { value: 'Ward 4' } });
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  it('a header-only save sends one id-only line, so no stored line field is rewritten', async () => {
    renderEditScreen();
    await waitFor(() => expect(screen.getAllByText('Strip10').length).toBeGreaterThan(0));

    fireEvent.change(screen.getAllByPlaceholderText('Details')[0], { target: { value: 'Ward 4' } });
    await waitFor(() => expect(saveButton()).toBeEnabled());
    fireEvent.click(saveButton());
    const confirm = await screen.findByRole('button', { name: 'Confirm' });
    fireEvent.click(confirm);

    await waitFor(() => expect(editTrigger).toHaveBeenCalled());
    const payload = (editTrigger.mock.calls[0] as any[])[0];
    expect(payload.Added).toEqual([]);
    expect(payload.Deleted).toEqual([]);
    // edit-sale 400s on a payload with no lines and keeps every omitted field as stored.
    expect(payload.Edited).toEqual([{ invoice_line_id: 23 }]);
    expect(payload.customer_details).toBe('Ward 4');
  });

  it('enables Save when only the discount authority changes', async () => {
    // Round trip through the cart ("Add product to cart"): same lines, new authority.
    const cartItem = (overrides: Record<string, any>) => ({
      product_id: 1, name: 'Strip10', batch: 'MRPR-A10', mrp: 100, sp: 30, unit_selling_price: 10, quantity: 3,
      discount: 0, type: 'Tablet', cgstPercent: '2.5', sgstPercent: '2.5', igstPercent: '0', pack_qty: 10, expiry: '',
      ...overrides,
    });
    const details = {
      ...invoiceDetails,
      lines: [{ ...invoiceDetails.lines[0], rate: '10', discount_authority: 'Arvind Rao' }],
    };
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation(details);

    mockLocationState = { ...mockLocationState, cartItems: [cartItem({ id: 'c1', discountAuthorizedBy: 'Arvind Rao' })] };
    const { unmount } = renderEditScreen();
    await waitFor(() => expect(screen.getAllByText('Strip10').length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.getByDisplayValue('+919900112233')).toBeInTheDocument());
    expect(saveButton()).toBeDisabled();
    unmount();

    mockLocationState = { ...mockLocationState, cartItems: [cartItem({ id: 'c1', discountAuthorizedBy: 'Dr. Mehta' })] };
    renderEditScreen();
    await waitFor(() => expect(screen.getAllByText('Strip10').length).toBeGreaterThan(0));
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });

  describe('stored GST percents', () => {
    const taxLine = (id: number, name: string, rate: string, cgst: string, sgst: string, igst: string) =>
      line({ invoice_line_id: id, product_id: id, batch_number: `B${id}`, name, quantity: '1.00', rate, selling_price: rate, mrp: rate, cgst, sgst, igst, pack_qty: 1 });
    const taxDetails = {
      ...invoiceDetails,
      invoice: { ...invoiceDetails.invoice, total_amount: '547.00' },
      lines: [
        { ...taxLine(31, 'ZeroGst', '50.0000', '0.0000', '0.0000', '0.0000'), quantity: '2.00' },
        taxLine(32, 'IgstOnly', '112.0000', '0.0000', '0.0000', '12.0000'),
        taxLine(33, 'Gst5', '105.0000', '2.5000', '2.5000', '0.0000'),
        taxLine(34, 'Gst12', '112.0000', '6.0000', '6.0000', '0.0000'),
        taxLine(35, 'Gst18', '118.0000', '9.0000', '9.0000', '0.0000'),
      ],
    };

    const taxCells = (product: string) => {
      const headers = screen.getAllByRole('columnheader').map((h) => h.textContent?.trim() ?? '');
      const cells = screen.getByText(product).closest('tr')!.querySelectorAll('td');
      return ['CGST (%)', 'SGST (%)', 'IGST (%)'].map((h) => cells[headers.findIndex((t) => t.startsWith(h))].textContent);
    };

    beforeEach(() => {
      (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation(taxDetails);
    });

    it('shows each line with its stored rates (0% and IGST-only stay as stored, not 9 + 9)', async () => {
      renderEditScreen();
      await waitFor(() => expect(screen.getByText('ZeroGst')).toBeInTheDocument());
      expect(taxCells('ZeroGst')).toEqual(['0', '0', '0']);
      expect(taxCells('IgstOnly')).toEqual(['0', '0', '12']);
      expect(taxCells('Gst5')).toEqual(['2.5', '2.5', '0']);
      expect(taxCells('Gst12')).toEqual(['6', '6', '0']);
      expect(taxCells('Gst18')).toEqual(['9', '9', '0']);
      // Tax-inclusive: 0 + 12 + 5 + 12 + 18.
      expect(screen.getByDisplayValue('47.00')).toBeInTheDocument();
    });

    it('editing the quantity of a 0% line sends 0% tax, and only that line', async () => {
      renderEditScreen();
      await waitFor(() => expect(screen.getByText('ZeroGst')).toBeInTheDocument());
      const row = () => screen.getByText('ZeroGst').closest('tr')!;
      fireEvent.click(within(row()).getByTestId('EditIcon'));
      fireEvent.change(within(row()).getByDisplayValue('2'), { target: { value: '3' } });
      fireEvent.click(within(row()).getByTestId('CheckIcon'));

      await waitFor(() => expect(saveButton()).toBeEnabled());
      fireEvent.click(saveButton());
      fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(editTrigger).toHaveBeenCalled());
      const payload = (editTrigger.mock.calls[0] as any[])[0];
      expect(payload.Edited).toHaveLength(1);
      expect(payload.Edited[0]).toMatchObject({ invoice_line_id: 31, quantity: 3, cgst: 0, sgst: 0, igst: 0 });
    });
  });
});

describe('executeSave edit-sale line diff', () => {
  const item = (overrides: Record<string, any>) => ({
    productName: 'Strip10',
    product_id: 1,
    batch: 'MRPR-A10',
    quantity: '3',
    unitPrice: '10.0000',
    mrp: '100',
    discount: '0',
    discountPercent: '0',
    cgst: '0',
    cgstPercent: '2.5',
    sgst: '0',
    sgstPercent: '2.5',
    igst: '0',
    igstPercent: '0',
    amount: '30.00',
    pack_qty: 10,
    type: 'Tablet',
    ...overrides,
  });
  const original = [item({ id: '23' }), item({ id: '24', product_id: 2, batch: 'MRPR-B1', quantity: '2', unitPrice: '30.0000', mrp: '30', pack_qty: 1 })];

  const run = async (salesItems: any[]) => {
    const editTrigger = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ message: 'ok', invoice_id: 13 }) }));
    await executeSave({
      customerName: 'Meher Baba',
      customerMobile: '+919876543210',
      customerCity: '',
      customerDetails: '',
      patientType: 'Out Patient',
      doctorName: 'Arvind Rao',
      doctorMobile: '',
      doctorEmail: '',
      paymentMode: 'Cash',
      insuranceCompany: '',
      invoiceNumber: 'INV1',
      invoiceDate: '2026-10-19',
      salesItems,
      originalSalesItems: original,
      totalValue: '90',
      totalDiscount: '0',
      taxAmount: '0',
      totalPayableAmount: '90',
      selectedCustomer: { id: 1, name: 'Meher Baba', mobile: '+919876543210' } as any,
      apiProducts: [{ product_id: 1, name: 'Strip10' }, { product_id: 2, name: 'Single' }],
      isProductsLoading: false,
      isProductsError: false,
      productsError: null,
      user: { username: 'testuser' },
      showToast: jest.fn(),
      resetForm: jest.fn(),
      clearCart: jest.fn(),
      navigate: jest.fn(),
      skipNavigation: true,
      submitSale: jest.fn(),
      editSale: editTrigger,
      isEditMode: true,
      invoiceId: 13,
    } as any);
    return (editTrigger.mock.calls[0] as any[])[0];
  };

  it('sends only the changed line as Edited, with the stored mrp', async () => {
    const payload = await run([item({ id: '23', quantity: '4' }), original[1]]);
    expect(payload.Edited).toHaveLength(1);
    expect(payload.Edited[0]).toMatchObject({ invoice_line_id: 23, quantity: 4, mrp: 100 });
    expect(payload.Added).toEqual([]);
    expect(payload.Deleted).toEqual([]);
  });

  it('omits untouched lines when another line is deleted', async () => {
    const payload = await run([original[1]]);
    expect(payload.Deleted).toEqual([23]);
    expect(payload.Edited).toEqual([]);
  });
});
