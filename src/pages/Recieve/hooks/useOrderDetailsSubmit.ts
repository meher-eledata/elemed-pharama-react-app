import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  useSubmitReceiptMutation,
  useEditReceiptMutation,
  useUploadReceiptFileMutation,
  useDeleteReceiptMutation,
} from "../../../redux/slices/receiveApi";
import { useIdempotencyKey } from "../../../hooks/useIdempotencyKey";
import { duplicateDocumentNumberMessage, extractErrorMessage } from "../../../utils/errorUtils";
import { PharmaTableRow, SupplierOption, ProductOption } from "../types";

// Every submit/edit failure surfaces through setSaveError. The 409 DUPLICATE_RECEIPT_NUMBER
// is a retryable counter anomaly rather than bad input, so it is named ahead of the generic
// unwrapping (mirrors SalesReceipt.saveHandler's DUPLICATE_INVOICE_NUMBER branch).
const resolveReceiptSaveError = (error: any): string => {
  const duplicateNumber = duplicateDocumentNumberMessage(error);
  if (duplicateNumber) return duplicateNumber;
  if (error?.data) {
    if (typeof error.data === 'string') return error.data;
    if (error.data.message) return error.data.message;
    if (error.data.error) return error.data.error;
    if (Array.isArray(error.data.errors) && error.data.errors.length > 0) return error.data.errors[0];
  }
  return error?.message || 'Failed to submit receipt';
};

// The delete endpoint answers with DISCRIMINABLE codes rather than prose, so the
// pharmacist gets told what to do instead of an HTTP number. These are refusals, not
// faults: the receipt is intact and the message says why it stayed that way.
const resolveReceiptDeleteError = (error: any): string => {
  const code = error?.data?.error;
  switch (code) {
    case 'RECEIPT_HAS_SUPPLIER_RETURNS':
      return 'This receipt has supplier returns raised against it. Cancel those returns first, then delete the receipt.';
    case 'RECEIPT_STOCK_ALREADY_CONSUMED':
      return error?.data?.message
        || 'This receipt cannot be deleted because its stock has already been sold or adjusted.';
    case 'RECEIPT_DELETED':
      return 'This receipt has already been deleted.';
    default:
      break;
  }
  if (error?.data?.message) return error.data.message;
  if (typeof error?.data?.error === 'string') return error.data.error;
  return extractErrorMessage(error, 'Failed to delete the receipt. Please try again.');
};

interface SubmitHookParams {
  supplierName: string;
  supplierOptions: SupplierOption[];
  poNumber: string;
  invoiceDate: string;
  invoiceNumber: string;
  transactionNumber: string;
  paymentVendor: string;
  paymentMethod: string;
  pharmaTableData: PharmaTableRow[];
  originalReceiptLines: PharmaTableRow[];
  productOptionsWithIds: ProductOption[];
  invoiceFile: File | null;
  isEditMode: boolean;
  receiptId: number | null;
  user: any;
  setIsSaving: (val: boolean) => void;
  setSaveError: (val: string | null) => void;
  setSaveSuccess: (val: boolean) => void;
  setSavedReceiptNumber: (val: string | null) => void;
  setIsDeleting: (val: boolean) => void;
  setDeleteError: (val: string | null) => void;
  setDeleteSuccess: (val: boolean) => void;
  resetForm: () => void;
  setPharmaTableData: (data: PharmaTableRow[]) => void;
  setFindProductTerm: (val: string) => void;
  setEditingRowId: (val: string | null) => void;
  setEditingData: (val: any) => void;
  setIsProductSelected: (val: boolean) => void;
  isProductRowComplete: (row: PharmaTableRow) => boolean;
  allReceiptsData?: any[];
  // Draft id from useInvoiceExtraction when the form was pre-filled from an
  // extraction (null/absent for manual entry). Sent as the optional
  // `extraction_id` on submit-receipt and consumed after a successful save.
  extractionId?: number | null;
  clearExtractionId?: () => void;
}

export const useOrderDetailsSubmit = (params: SubmitHookParams) => {
  const navigate = useNavigate();
  const [submitReceipt, { isLoading: isSubmittingReceipt }] = useSubmitReceiptMutation();
  const [editReceipt, { isLoading: isEditingReceipt }] = useEditReceiptMutation();
  const [uploadReceiptFile] = useUploadReceiptFileMutation();
  const [deleteReceiptMutation] = useDeleteReceiptMutation();
  // One key per pending logical submission: reused on retry of the same failed
  // payload, regenerated when the payload changes, cleared after success.
  const { getKey: getIdempotencyKey, reset: resetIdempotencyKey } = useIdempotencyKey();

  const {
    supplierName,
    supplierOptions,
    poNumber,
    invoiceDate,
    invoiceNumber,
    transactionNumber,
    paymentVendor,
    paymentMethod,
    pharmaTableData,
    originalReceiptLines,
    productOptionsWithIds,
    invoiceFile,
    isEditMode,
    receiptId,
    user,
    setIsSaving,
    setSaveError,
    setSaveSuccess,
    setSavedReceiptNumber,
    setIsDeleting,
    setDeleteError,
    setDeleteSuccess,
    resetForm,
    setPharmaTableData,
    setFindProductTerm,
    setEditingRowId,
    setEditingData,
    setIsProductSelected,
    isProductRowComplete,
    allReceiptsData,
    extractionId,
    clearExtractionId,
  } = params;

  // Optional extract-invoice draft link. Kept OUTSIDE the payload passed to
  // getIdempotencyKey so the idempotency key stays byte-identical whether or
  // not an extraction id is present.
  const extractionIdField =
    typeof extractionId === "number" ? { extraction_id: extractionId } : {};
  const consumeExtractionId = () => clearExtractionId?.();

  const getProductIdFromName = (productName: string): number | null => {
    if (!productName || !productOptionsWithIds || productOptionsWithIds.length === 0) {
      return null;
    }
    const normalize = (str: string) => str.trim().toLowerCase();
    const normalizedProductName = normalize(productName);
    let product = productOptionsWithIds.find(p => normalize(p.name) === normalizedProductName);
    if (!product) {
      product = productOptionsWithIds.find(p =>
        normalize(p.name).includes(normalizedProductName) ||
        normalizedProductName.includes(normalize(p.name))
      );
    }
    return product ? product.id : null;
  };

  const transformFormDataToApiPayload = () => {
    const normalize = (str: string) => str.trim().toLowerCase();
    const normalizedSupplierName = normalize(supplierName);
    const selectedSupplierData = supplierOptions.find(s =>
      normalize(s.supplier_name) === normalizedSupplierName
    );
    const isExistingSupplier = selectedSupplierData && selectedSupplierData.supplier_id > 0;

    const lines = pharmaTableData.map((row) => {
      const productId = row.product_id || getProductIdFromName(row.productId) || 0;
      let expiryDateFormatted: string;
      if (row.expiryDate) {
        if (dayjs.isDayjs(row.expiryDate) && row.expiryDate.isValid()) {
          expiryDateFormatted = row.expiryDate.format('YYYY-MM-DD');
        } else if (typeof row.expiryDate === 'string') {
          const parsed = dayjs(row.expiryDate);
          expiryDateFormatted = parsed.isValid() ? parsed.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
        } else {
          expiryDateFormatted = dayjs().format('YYYY-MM-DD');
        }
      } else {
        expiryDateFormatted = dayjs().format('YYYY-MM-DD');
      }

      return {
        product: row.productId,
        product_id: productId,
        batch_number: row.batchNumber || "",
        received_qty: Number(row.qtyReceived) || 0,
        free_qty: Number(row.qtyFree) || 0,
        expiry_date: expiryDateFormatted,
        purchase_price: Number(row.pp) || 0,
        cgst: Number(row.cgst) || 0,
        sgst: Number(row.sgst) || 0,
        igst: Number(row.igst) || 0,
        discount: Number(row.disc) || 0,
        mrp: Number(row.mrp) || 0,
        selling_price: Number(row.sp) || 0,
        pack_qty: row.pack || ""
      };
    });

    if (!isExistingSupplier || !selectedSupplierData?.supplier_id || selectedSupplierData.supplier_id <= 0) {
      throw new Error(`Supplier "${supplierName}" not found. Please select a supplier from the dropdown.`);
    }

    const createdBy = user?.username || user?.first_name || "meher";

    const payload = {
      supplier_name: supplierName.trim(),
      supplier_id: selectedSupplierData.supplier_id,
      po_number: poNumber.trim() || null,
      invoice_number: invoiceNumber.trim(),
      notes: "",
      created_by: createdBy,
      lines: lines,
      total_amount: pharmaTableData.reduce((sum, item) => {
        const unitPrice = Number(item.pp) || 0;
        const qty = Number(item.qtyReceived) || 0;
        const cgst = Number(item.cgst) || 0;
        const sgst = Number(item.sgst) || 0;
        const igst = Number(item.igst) || 0;
        const discount = Number(item.disc) || 0;

        const baseAmount = unitPrice * qty;
        const discountAmount = baseAmount * (discount / 100);
        const amountAfterDiscount = baseAmount - discountAmount;
        // Calculate taxes based on discounted amount for consistency with invoice totals
        const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);
        return sum + (amountAfterDiscount + taxAmount);
      }, 0)
    };
    return payload;
  };

  const detectChanges = () => {
    const originalIds = new Set(originalReceiptLines.map(row => row.id));
    const currentIds = new Set(pharmaTableData.map(row => row.id));

    const isDatabaseId = (id: string | undefined) => {
      if (!id) return false;
      return /^\d+$/.test(id) && parseInt(id) < 1000000000000;
    };

    const formatExpiryDate = (row: PharmaTableRow): string => {
      if (row.expiryDate && dayjs.isDayjs(row.expiryDate) && row.expiryDate.isValid()) {
        return row.expiryDate.format('YYYY-MM-DD');
      }
      return '';
    };

    const deleted = originalReceiptLines
      .filter(originalRow => !currentIds.has(originalRow.id))
      .map(row => ({ receipt_line_id: parseInt(row.id || '0') }));

    const added = pharmaTableData
      .filter(currentRow => {
        if (!originalIds.has(currentRow.id)) return true;
        if (currentRow.id && !isDatabaseId(currentRow.id)) return true;
        return false;
      })
      .map(row => {
        const productId = row.product_id || getProductIdFromName(row.productId);
        return {
          product: row.productId,
          product_id: productId || 0,
          batch_number: row.batchNumber || '',
          received_qty: row.qtyReceived,
          free_qty: row.qtyFree,
          expiry_date: formatExpiryDate(row),
          purchase_price: row.pp,
          cgst: Number(row.cgst) || 0,
          sgst: Number(row.sgst) || 0,
          igst: Number(row.igst) || 0,
          discount: Number(row.disc) || 0,
          mrp: row.mrp,
          selling_price: row.sp,
          pack_qty: row.pack
        };
      });

    const edited = pharmaTableData
      .filter(currentRow => {
        if (!isDatabaseId(currentRow.id)) return false;
        const originalRow = originalReceiptLines.find(orig => orig.id === currentRow.id);
        if (!originalRow) return false;

        const expiryDateChanged =
          (originalRow.expiryDate === null && currentRow.expiryDate !== null) ||
          (originalRow.expiryDate !== null && currentRow.expiryDate === null) ||
          (originalRow.expiryDate && currentRow.expiryDate &&
            !originalRow.expiryDate.isSame(currentRow.expiryDate, 'day'));

        return (
          originalRow.productId !== currentRow.productId ||
          originalRow.qtyReceived !== currentRow.qtyReceived ||
          originalRow.qtyFree !== currentRow.qtyFree ||
          originalRow.pp !== currentRow.pp ||
          originalRow.cgst !== currentRow.cgst ||
          originalRow.sgst !== currentRow.sgst ||
          originalRow.igst !== currentRow.igst ||
          originalRow.disc !== currentRow.disc ||
          originalRow.mrp !== currentRow.mrp ||
          originalRow.sp !== currentRow.sp ||
          (originalRow.pack || '') !== (currentRow.pack || '') ||
          expiryDateChanged
        );
      })
      .map(row => {
        const originalRow = originalReceiptLines.find(orig => orig.id === row.id);
        const productId = row.product_id || originalRow?.product_id || getProductIdFromName(row.productId);
        const expiryDateFormatted = formatExpiryDate(row);

        return {
          receipt_line_id: parseInt(row.id || '0'),
          po_line_id: row.po_line_id || originalRow?.po_line_id || 0,
          batch_id: row.batch_id || originalRow?.batch_id || 0,
          batch_number: row.batchNumber || originalRow?.batchNumber || '',
          product_id: productId || 0,
          product_name: row.productId,
          received_qty: row.qtyReceived,
          free_qty: row.qtyFree,
          expiry_date: expiryDateFormatted,
          purchase_price: row.pp.toString(),
          cgst: (Number(row.cgst) || 0).toString(),
          sgst: (Number(row.sgst) || 0).toString(),
          igst: (Number(row.igst) || 0).toString(),
          discount: (Number(row.disc) || 0).toString(),
          mrp: row.mrp.toString(),
          selling_price: row.sp.toString(),
          pack_qty: (row.pack || '').toString()
        };
      });

    return { deleted, added, edited };
  };

  const transformFormDataToEditPayload = () => {
    const selectedSupplierData = supplierOptions.find(s => s.supplier_name === supplierName);
    const supplierId = selectedSupplierData ? selectedSupplierData.supplier_id : 0;
    const { deleted, added, edited } = detectChanges();

    let formattedInvoiceDate: string | undefined;
    if (invoiceDate && invoiceDate.trim()) {
      const parsedDate = dayjs(invoiceDate, 'DD/MM/YYYY');
      if (parsedDate.isValid()) {
        formattedInvoiceDate = parsedDate.toISOString();
      }
    }

    return {
      receipt_id: receiptId!,
      po_id: parseInt(poNumber) || 1,
      supplier_name: supplierName,
      supplier_id: supplierId,
      po_number: poNumber?.trim() || null,
      payment_method: paymentMethod,
      payment_vendor: paymentVendor,
      transaction_number: transactionNumber,
      invoice_number: invoiceNumber,
      ...(formattedInvoiceDate && { invoice_date: formattedInvoiceDate }),
      notes: "",
      created_by: "meher",
      total_amount: pharmaTableData.reduce((sum, item) => {
        const unitPrice = Number(item.pp) || 0;
        const qty = Number(item.qtyReceived) || 0;
        const cgst = Number(item.cgst) || 0;
        const sgst = Number(item.sgst) || 0;
        const igst = Number(item.igst) || 0;
        const discount = Number(item.disc) || 0;

        const baseAmount = unitPrice * qty;
        const discountAmount = baseAmount * (discount / 100);
        const amountAfterDiscount = baseAmount - discountAmount;
        // Calculate taxes based on discounted amount for consistency with invoice totals
        const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);
        return sum + (amountAfterDiscount + taxAmount);
      }, 0),
      Deleted: deleted,
      Added: added,
      Edited: edited
    };
  };

  const validateForm = (): string | null => {
    if (!supplierName.trim()) return 'Please fill in the Supplier Name';
    if (pharmaTableData.length === 0) return 'Please add at least one product to the table';

    const incompleteProducts = pharmaTableData.filter(row => !isProductRowComplete(row));
    if (incompleteProducts.length > 0) {
      return 'Please complete all mandatory fields for all products (Batch, Expiry, Pack Info, Qty, Purchase Price, MRP)';
    }
    return null;
  };

  const proceedWithSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      // An edit issues no new number, so never carry one over from a previous submit.
      setSavedReceiptNumber(null);

      const validationError = validateForm();
      if (validationError) {
        setSaveError(validationError);
        setIsSaving(false);
        return;
      }

      let result;
      let finalReceiptId: number | null = null;

      if (isEditMode && receiptId) {
        const editPayload = transformFormDataToEditPayload();
        result = await editReceipt({
          ...editPayload,
          idempotency_key: getIdempotencyKey(JSON.stringify(editPayload)),
        }).unwrap();
        resetIdempotencyKey();
        finalReceiptId = receiptId;
      } else {
        let submitPayload;
        try {
          submitPayload = transformFormDataToApiPayload();
        } catch (validationError: any) {
          setSaveError(validationError.message || 'Invalid form data. Please ensure supplier is selected from dropdown.');
          setIsSaving(false);
          return;
        }

        // Never re-submit on error (a timeout-after-commit was duplicating stock);
        // the outer catch surfaces the error to the user via setSaveError.
        result = await submitReceipt({
          ...submitPayload,
          idempotency_key: getIdempotencyKey(JSON.stringify(submitPayload)),
          ...extractionIdField,
        }).unwrap();
        resetIdempotencyKey();
        consumeExtractionId();
        finalReceiptId = result.receipt_id || (result as any).receiptId;
        // The server-issued GRN number, shown in the success snackbar.
        setSavedReceiptNumber(result.receipt_number ?? null);
      }

      // Upload file if selected
      if (invoiceFile && finalReceiptId) {
        try {
          await uploadReceiptFile({ receiptId: finalReceiptId, file: invoiceFile }).unwrap();
        } catch (uploadError) {
          console.error('Failed to upload invoice file:', uploadError);
        }
      }

      if (!isEditMode) {
        localStorage.setItem('lastReceiptData', JSON.stringify({
          poNumber,
          invoiceNumber,
          supplierName,
          timestamp: new Date().toISOString()
        }));
      }

      setSaveSuccess(true);

      setTimeout(() => {
        setPharmaTableData([]);
        setFindProductTerm("");
        setEditingRowId(null);
        setEditingData({});
        setIsProductSelected(false);
        setSaveSuccess(false);
        navigate('/receive/order-receive');
      }, 2000);

    } catch (error: any) {
      setSaveError(resolveReceiptSaveError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceedToPayment = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const validationError = validateForm();
      if (validationError) {
        setSaveError(validationError);
        setIsSaving(false);
        return;
      }

      let submitPayload;
      try {
        submitPayload = transformFormDataToApiPayload();
      } catch (validationError: any) {
        setSaveError(validationError.message || 'Invalid form data.');
        setIsSaving(false);
        return;
      }

      // Never re-submit on error (a timeout-after-commit was duplicating stock);
      // the outer catch surfaces the error to the user via setSaveError.
      const result = await submitReceipt({
        ...submitPayload,
        idempotency_key: getIdempotencyKey(JSON.stringify(submitPayload)),
        ...extractionIdField,
      }).unwrap();
      resetIdempotencyKey();
      consumeExtractionId();
      const newReceiptId: number | null = result.receipt_id || (result as any).receiptId;

      if (newReceiptId) {
        if (invoiceFile) {
          try {
            await uploadReceiptFile({ receiptId: newReceiptId, file: invoiceFile }).unwrap();
          } catch (uploadError) {
            console.error('Failed to upload invoice file:', uploadError);
          }
        }

        const selectedSupplierData = supplierOptions.find(s => s.supplier_name === supplierName);
        const supplierId = selectedSupplierData ? selectedSupplierData.supplier_id : 0;

        // Calculate total credit available for this supplier from all receipts
        let totalCreditAvailable = 0;
        if (allReceiptsData && Array.isArray(allReceiptsData)) {
          totalCreditAvailable = allReceiptsData
            .filter(r => r.supplier_id === supplierId || r.supplier_name === supplierName)
            .reduce((sum, r) => {
              const credit = r.supplier_credit_available ? parseFloat(r.supplier_credit_available) : 0;
              return sum + credit;
            }, 0);
        }

        navigate('/receive/payment-details', {
          state: {
            supplierName,
            supplierId,
            poNumber,
            invoiceDate,
            invoiceNumber,
            pharmaTableData,
            isEditMode: false,
            receiptId: newReceiptId,
            receiptNumber: result.receipt_number ?? `RA${newReceiptId}`,
            creditAvailable: totalCreditAvailable,
            totalAmount: pharmaTableData.reduce((sum, item) => {
              const unitPrice = Number(item.pp) || 0;
              const qty = Number(item.qtyReceived) || 0;
              const cgst = Number(item.cgst) || 0;
              const sgst = Number(item.sgst) || 0;
              const igst = Number(item.igst) || 0;
              const discount = Number(item.disc) || 0;

              const baseAmount = unitPrice * qty;
              const discountAmount = baseAmount * (discount / 100);
              const amountAfterDiscount = baseAmount - discountAmount;
              const taxAmount = amountAfterDiscount * ((cgst + sgst + igst) / 100);
              return sum + (amountAfterDiscount + taxAmount);
            }, 0),
          }
        });
      }
    } catch (error: any) {
      setSaveError(resolveReceiptSaveError(error));
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndPayLater = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const validationError = validateForm();
      if (validationError) {
        setSaveError(validationError);
        setIsSaving(false);
        return;
      }

      let submitPayload;
      try {
        submitPayload = transformFormDataToApiPayload();
      } catch (validationError: any) {
        setSaveError(validationError.message || 'Invalid form data.');
        setIsSaving(false);
        return;
      }

      // Never re-submit on error (a timeout-after-commit was duplicating stock);
      // the outer catch surfaces the error to the user via setSaveError.
      const result = await submitReceipt({
        ...submitPayload,
        idempotency_key: getIdempotencyKey(JSON.stringify(submitPayload)),
        ...extractionIdField,
      }).unwrap();
      resetIdempotencyKey();
      consumeExtractionId();
      const newReceiptId: number | null = result.receipt_id || (result as any).receiptId;
      // The server-issued GRN number, shown in the success snackbar.
      setSavedReceiptNumber(result.receipt_number ?? null);

      if (newReceiptId) {
        if (invoiceFile) {
          try {
            await uploadReceiptFile({ receiptId: newReceiptId, file: invoiceFile }).unwrap();
          } catch (uploadError) {
            console.error('Failed to upload invoice file:', uploadError);
          }
        }

        setSaveSuccess(true);
        // Navigate back to list after success
        setTimeout(() => {
          setPharmaTableData([]);
          setFindProductTerm("");
          setEditingRowId(null);
          setEditingData({});
          setIsProductSelected(false);
          setSaveSuccess(false);
          navigate('/receive/order-receive');
        }, 1500);
      }
    } catch (error: any) {
      setSaveError(resolveReceiptSaveError(error));
    } finally {
      setIsSaving(false);
    }
  };

  // Soft-deletes the whole receipt. `deletionReason` is REQUIRED — the endpoint 400s
  // without it, and it is the audit trail for why the stock was reversed, so the caller
  // must collect it from the user first (see the delete dialog in OrderDetails).
  //
  // Goes through the RTK Query mutation rather than a hand-rolled fetch so the cache
  // invalidation is the slice's (Receive + Dashboard + Inventory + Reports — a delete
  // moves stock and changes the purchase/GST reports, and the old hand-rolled call
  // invalidated only 'Receive', leaving stale inventory and report screens behind).
  const deleteReceipt = async (deletionReason: string) => {
    if (!isEditMode || !receiptId) {
      setDeleteError('No receipt selected for deletion');
      return;
    }

    const reason = (deletionReason || '').trim();
    if (!reason) {
      setDeleteError('A reason is required to delete a receipt.');
      return;
    }

    // Server-authoritative attribution is the audit username; this is the
    // who-asked-for-it field the endpoint stamps on the receipt row.
    const deletedBy = user?.username || user?.first_name || 'unknown';

    try {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(false);

      await deleteReceiptMutation({
        receipt_id: receiptId,
        deleted_by: deletedBy,
        deletion_reason: reason,
      }).unwrap();

      setDeleteSuccess(true);

      setTimeout(() => {
        navigate('/receive/order-receive');
      }, 2000);

    } catch (error) {
      setDeleteError(resolveReceiptDeleteError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isSubmittingReceipt,
    isEditingReceipt,
    proceedWithSave,
    handleProceedToPayment,
    handleSaveAndPayLater,
    deleteReceipt,
    validateForm,
  };
};
