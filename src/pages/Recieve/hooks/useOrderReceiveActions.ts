import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  useEditReceiptMutation,
  EditReceiptRequest,
  Receipt
} from "../../../redux/slices/receiveApi";
import { OrderReceiveRow } from "../types";
import { extractErrorMessage } from "../../../utils/errorUtils";

export const useOrderReceiveActions = (
  receipts: Receipt[] | undefined,
  refetchReceipts: () => void,
  tableData: OrderReceiveRow[],
  setTableData: (data: OrderReceiveRow[]) => void
) => {
  const navigate = useNavigate();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<OrderReceiveRow | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: "",
    severity: 'success'
  });

  const [editReceipt, { isLoading: saving }] = useEditReceiptMutation();

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleEditClick = (row: OrderReceiveRow) => {
    // Prefill the Invoice Date ONLY from the record's real supplier invoice date. A
    // null/absent invoice_date must leave this blank — editReceipt now PERSISTS the
    // value, so falling back to the goods-received date here would save the goods-in
    // date as the supplier invoice date and re-corrupt the two dates this feature splits.
    let invoiceDateValue = '';
    if (row.invoice_date) {
      try {
        const date = dayjs(row.invoice_date);
        invoiceDateValue = date.isValid() ? date.format('DD/MM/YYYY') : row.invoice_date;
      } catch (e) {
        invoiceDateValue = row.invoice_date;
      }
    }

    // Prefill the editable goods-received date from the record (DD/MM/YYYY for the picker).
    let receiptDateValue = '';
    if (row.receipt_date) {
      const rd = dayjs(row.receipt_date);
      receiptDateValue = rd.isValid() ? rd.format('DD/MM/YYYY') : row.receipt_date;
    }

    navigate('/receive/order-details', {
      state: {
        isEditMode: true,
        selectedOrder: row,
        receiptId: row.receiptId,
        // OUR GRN number; legacy rows without one fall back to the internal RA-key.
        receiptNumber: row.receipt_number || row.reNo,
        transactionNumber: row.transaction_number || '',
        paymentVendor: row.payment_vendor || '',
        invoiceDate: invoiceDateValue,
        receiptDate: receiptDateValue
      }
    });
  };

  const buildChanges = (original: OrderReceiveRow, draft: OrderReceiveRow): EditReceiptRequest => {
    const receiptId = original.receiptId;
    const originalReceipt = receipts?.find(r => {
      const rId = r.receipt_id || r.id || 0;
      return `RA${rId}` === original.reNo;
    });
    if (!originalReceipt) {
      throw new Error("Original receipt not found");
    }

    const parsedPoId = Number(draft.poNo);
    const safePoId = Number.isNaN(parsedPoId) ? originalReceipt.po_id : parsedPoId;

    const originalAmount = originalReceipt.po_total_amount
      ? parseFloat(originalReceipt.po_total_amount)
      : (originalReceipt.total_amount || 0);
    const parsedAmount = Number(draft.amt);
    const safeAmount = Number.isNaN(parsedAmount) ? originalAmount : parsedAmount;

    const supplierName = originalReceipt.supplier_name || '';

    return {
      receipt_id: receiptId,
      po_id: safePoId,
      supplier_name: supplierName,
      supplier_id: originalReceipt.supplier_id || 0,
      po_number: draft.poNo,
      payment_method: '',
      payment_vendor: '',
      transaction_number: '',
      notes: '',
      created_by: originalReceipt.received_by,
      Deleted: [],
      Edited: [],
      Added: []
    };
  };

  const validateInlineEditing = () => {
    if (!editingDraft) return false;
    return !!(editingDraft.amt && editingDraft.amt > 0);
  };

  const handleSaveClick = async (row: OrderReceiveRow) => {
    if (!editingDraft) {
      setEditingRowId(null);
      return;
    }

    if (!editingDraft.amt || editingDraft.amt <= 0) {
      showSnackbar('Please enter a valid Total Amount', 'error');
      return;
    }

    try {
      const editRequest = buildChanges(row, editingDraft);
      await editReceipt(editRequest).unwrap();
      await refetchReceipts();
      showSnackbar('Updated successfully', 'success');
    } catch (e) {
      showSnackbar(`Update failed: ${extractErrorMessage(e)}`, 'error');
    } finally {
      setEditingRowId(null);
      setEditingDraft(null);
    }
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditingDraft(null);
  };

  const handlePaymentDetailsClick = (row: OrderReceiveRow) => {
    navigate('/receive/payment-details', {
      state: {
        supplierName: row.supplier,
        supplierId: row.supplierId,
        poNumber: row.poNo,
        poId: row.po_id,
        invoiceDate: row.invoice_date || "",
        receiptId: row.receiptId,
        receiptNumber: row.receipt_number || row.reNo,
        isEditMode: true,
        transactionNumber: row.transaction_number || "",
        paymentVendor: row.payment_vendor || "",
        paymentMethod: (row as any).last_payment_method || "Cash",
        amount: row.amountPaid || "",
        creditAvailable: row.creditAvailable || 0,
        totalAmount: row.amt || 0,
        pharmaTableData: [],
      }
    });
  };

  return {
    editingRowId,
    setEditingRowId,
    editingDraft,
    setEditingDraft,
    snackbar,
    setSnackbar,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handlePaymentDetailsClick,
    validateInlineEditing,
    saving
  };
};
