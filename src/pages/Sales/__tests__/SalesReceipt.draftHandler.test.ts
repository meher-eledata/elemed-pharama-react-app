import { executeSaveDraft } from '../SalesReceipt.draftHandler';
import { transformCartItemsForEdit } from '../SalesReceipt.handlers';
import { SalesReceiptItem } from '../SalesReceipt.types';
import { SalesFormData } from '../../../redux/slices/cartSlice';

// One representative line item. transformCartItemsForEdit (the real edit-flow reverse
// transform) is reused verbatim so the payload's `items` are asserted loss-free.
const makeItem = (over: Partial<SalesReceiptItem> = {}): SalesReceiptItem => ({
  id: '1',
  productName: 'Paracetamol',
  product_id: 42,
  batch: 'B1',
  expiryDate: '2027-01-01',
  quantity: '2',
  type: 'tablet',
  unitPrice: '10',
  mrp: '12',
  discount: '0',
  discountPercent: '0',
  cgst: '0',
  cgstPercent: '0',
  sgst: '0',
  sgstPercent: '0',
  igst: '0',
  igstPercent: '0',
  amount: '20',
  ...over,
});

const financials = {
  totalValue: '20',
  totalDiscount: '0',
  taxAmount: '0',
  totalPayableAmount: '20',
};

const formData = { customerName: 'John Doe' } as unknown as SalesFormData;

const baseParams = () => {
  const createDraft = jest.fn((_body: any) => ({ unwrap: () => Promise.resolve({ id: 99 }) }));
  const updateDraft = jest.fn((_body: any) => ({ unwrap: () => Promise.resolve({ id: 5 }) }));
  const showToast = jest.fn();
  const onCreated = jest.fn();
  return {
    createDraft,
    updateDraft,
    showToast,
    onCreated,
    params: {
      formData,
      salesItems: [makeItem()],
      financials,
      splitPayments: [{ method: 'Cash', amount: '20' }],
      doctorId: 3,
      patientType: 'OPD',
      customerName: 'John Doe',
      customerMobile: '5551231000',
      customerId: 7,
      invoiceNumber: 'INV-1',
      invoiceDate: '2026-08-04',
      createDraft,
      updateDraft,
      showToast,
      onCreated,
    },
  };
};

describe('executeSaveDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty-cart guard', () => {
    it('toasts a warning and makes no create/update call when there are no items', async () => {
      const { createDraft, updateDraft, showToast, params } = baseParams();
      await executeSaveDraft({ ...params, salesItems: [] });

      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/empty draft/i),
        'warning'
      );
      expect(createDraft).not.toHaveBeenCalled();
      expect(updateDraft).not.toHaveBeenCalled();
    });
  });

  describe('create (no draftId)', () => {
    it('calls createDraft (never updateDraft) with a loss-free payload', async () => {
      const { createDraft, updateDraft, onCreated, params } = baseParams();
      await executeSaveDraft(params);

      expect(updateDraft).not.toHaveBeenCalled();
      expect(createDraft).toHaveBeenCalledTimes(1);

      const body = createDraft.mock.calls[0][0];
      // The payload snapshot is assembled from exactly these six fields, loss-free.
      expect(body.payload).toEqual({
        formData,
        items: transformCartItemsForEdit(params.salesItems),
        financials,
        splitPayments: params.splitPayments,
        doctorId: 3,
        patientType: 'OPD',
      });
    });

    it('assembles the denormalized summary columns on the request body', async () => {
      const { createDraft, params } = baseParams();
      await executeSaveDraft(params);

      const body = createDraft.mock.calls[0][0];
      expect(body.customer_id).toBe(7);
      expect(body.customer_name).toBe('John Doe');
      expect(body.customer_phone).toBe('5551231000');
      expect(body.invoice_number).toBe('INV-1');
      expect(body.invoice_date).toBe('2026-08-04');
      expect(body.total_amount).toBe(20);
      expect(body.item_count).toBe(1);
    });

    it('reports the new server id back through onCreated and toasts success', async () => {
      const { onCreated, showToast, params } = baseParams();
      await executeSaveDraft(params);

      expect(onCreated).toHaveBeenCalledWith(99);
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/saved successfully/i),
        'success'
      );
    });

    it('omits an invalid invoice_date instead of forwarding garbage', async () => {
      const { createDraft, params } = baseParams();
      await executeSaveDraft({ ...params, invoiceDate: 'not-a-date' });

      const body = createDraft.mock.calls[0][0];
      expect(body.invoice_date).toBeUndefined();
    });
  });

  describe('update (draftId present)', () => {
    it('calls updateDraft with the id (never createDraft) and toasts updated', async () => {
      const { createDraft, updateDraft, showToast, params } = baseParams();
      await executeSaveDraft({ ...params, draftId: 5 });

      expect(createDraft).not.toHaveBeenCalled();
      expect(updateDraft).toHaveBeenCalledTimes(1);

      const arg = updateDraft.mock.calls[0][0];
      expect(arg.id).toBe(5);
      expect(arg.payload).toEqual({
        formData,
        items: transformCartItemsForEdit(params.salesItems),
        financials,
        splitPayments: params.splitPayments,
        doctorId: 3,
        patientType: 'OPD',
      });
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/updated successfully/i),
        'success'
      );
    });
  });

  describe('failure handling', () => {
    it('toasts an error when the create call rejects', async () => {
      const { showToast, params } = baseParams();
      const createDraft = jest.fn((_body: any) => ({
        unwrap: () => Promise.reject({ data: { message: 'boom' } }),
      }));
      await executeSaveDraft({ ...params, createDraft });

      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/boom/i),
        'error'
      );
    });
  });
});
