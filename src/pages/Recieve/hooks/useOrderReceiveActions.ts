import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  useEditReceiptMutation,
  useDeleteReceiptMutation,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);

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
  const [deleteReceipt, { isLoading: deleting }] = useDeleteReceiptMutation();

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleEditClick = (row: OrderReceiveRow) => {
    let invoiceDateValue = '';
    if (row.invoice_date) {
      try {
        const date = dayjs(row.invoice_date);
        if (date.isValid()) {
          invoiceDateValue = date.format('DD/MM/YYYY');
        } else {
          invoiceDateValue = row.invoice_date;
        }
      } catch (e) {
        invoiceDateValue = row.invoice_date;
      }
    } else if (row.received) {
      try {
        const receivedDate = dayjs(row.received, 'MMM DD, YYYY h:mm A');
        if (receivedDate.isValid()) {
          invoiceDateValue = receivedDate.format('DD/MM/YYYY');
        }
      } catch (e) {
      }
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
        invoiceDate: invoiceDateValue
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

  const handleDeleteClick = (rowNo: string) => {
    setRowToDeleteId(rowNo);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDeleteId) {
      setIsDeleteDialogOpen(false);
      return;
    }
    const row = tableData.find((r) => r.reNo === rowToDeleteId);
    if (!row) {
      setIsDeleteDialogOpen(false);
      setRowToDeleteId(null);
      return;
    }

    const receiptId = Number(row.reNo.replace('RA', ''));

    try {
      await deleteReceipt({ id: receiptId }).unwrap();
      setTableData(tableData.filter((r) => r.reNo !== rowToDeleteId));
      await refetchReceipts();
      showSnackbar('Deleted successfully', 'success');
    } catch (e) {
      showSnackbar(`Delete failed: ${extractErrorMessage(e)}`, 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setRowToDeleteId(null);
    }
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
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    rowToDeleteId,
    setRowToDeleteId,
    snackbar,
    setSnackbar,
    handleEditClick,
    handleSaveClick,
    handleCancelClick,
    handleDeleteClick,
    handleConfirmDelete,
    handlePaymentDetailsClick,
    validateInlineEditing,
    saving,
    deleting
  };
};
