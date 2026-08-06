import { SalesFormData } from '../../redux/slices/cartSlice';
import {
  DraftPayload,
  DraftRequest,
  CreateDraftResponse,
  UpdateDraftResponse,
} from '../../redux/slices/draftsApi';
import { SalesReceiptItem } from './SalesReceipt.types';
import { transformCartItemsForEdit } from './SalesReceipt.handlers';
import { extractErrorMessage, logError } from '../../utils/errorUtils';

interface ExecuteSaveDraftParams {
  draftId?: number; // present when resuming an existing draft → PUT instead of POST
  formData: SalesFormData;
  salesItems: SalesReceiptItem[];
  financials: DraftPayload['financials'];
  splitPayments: any[];
  doctorId?: number;
  patientType: string;
  customerName: string;
  customerMobile: string;
  customerId?: number;
  invoiceNumber: string;
  invoiceDate: string; // canonical ISO YYYY-MM-DD from receipt state
  createDraft: (body: DraftRequest) => any;
  updateDraft: (body: { id: number } & DraftRequest) => any;
  showToast: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  onCreated?: (id: number) => void; // lets the caller remember the new server id
}

// Lean counterpart of executeSave: assembles a loss-free snapshot of the in-progress
// sale and persists it as a server draft. No line/stock/invoice-number/finalize/
// navigation logic — resuming a draft rebuilds the cart from `payload`.
export const executeSaveDraft = async ({
  draftId,
  formData,
  salesItems,
  financials,
  splitPayments,
  doctorId,
  patientType,
  customerName,
  customerMobile,
  customerId,
  invoiceNumber,
  invoiceDate,
  createDraft,
  updateDraft,
  showToast,
  onCreated,
}: ExecuteSaveDraftParams): Promise<boolean> => {
  try {
    if (!salesItems || salesItems.length === 0) {
      showToast('Cannot save an empty draft. Add at least one product first.', 'warning');
      return false;
    }

    // Loss-free item snapshot — same reverse transform the edit flow uses to
    // rehydrate the redux cart (transformCartItemsForEdit → setCartItems).
    const items = transformCartItemsForEdit(salesItems);

    const payload: DraftPayload = {
      formData,
      items,
      financials,
      splitPayments: splitPayments || [],
      doctorId,
      patientType,
    };

    // Only send a valid ISO date; otherwise omit so the backend keeps it null.
    const invoice_date = /^\d{4}-\d{2}-\d{2}$/.test((invoiceDate || '').trim())
      ? invoiceDate.trim()
      : undefined;

    const body: DraftRequest = {
      customer_id: customerId && customerId > 0 ? customerId : undefined,
      customer_name: customerName || undefined,
      customer_phone: customerMobile || undefined,
      invoice_number: invoiceNumber || undefined,
      invoice_date,
      total_amount: parseFloat(financials.totalPayableAmount || '0') || 0,
      item_count: salesItems.length,
      payload,
    };

    if (draftId) {
      const result: UpdateDraftResponse = await updateDraft({ id: draftId, ...body }).unwrap();
      void result;
      showToast('Draft updated successfully!', 'success');
    } else {
      const result: CreateDraftResponse = await createDraft(body).unwrap();
      if (result?.id && onCreated) onCreated(result.id);
      showToast('Draft saved successfully!', 'success');
    }
    return true;
  } catch (error: unknown) {
    logError(error, 'SalesReceipt.executeSaveDraft');
    showToast(extractErrorMessage(error, 'Failed to save draft. Please try again.'), 'error');
    return false;
  }
};
