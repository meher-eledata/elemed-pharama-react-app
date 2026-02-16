import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
  receiveApi,
  useSubmitReceiptMutation,
  useEditReceiptMutation,
  useUploadReceiptFileMutation,
} from "../../../redux/slices/receiveApi";
import { PharmaTableRow, SupplierOption, ProductOption } from "../types";

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
}

export const useOrderDetailsSubmit = (params: SubmitHookParams) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitReceipt, { isLoading: isSubmittingReceipt }] = useSubmitReceiptMutation();
  const [editReceipt, { isLoading: isEditingReceipt }] = useEditReceiptMutation();
  const [uploadReceiptFile] = useUploadReceiptFileMutation();

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
  } = params;

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
      const productId = getProductIdFromName(row.productId);
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
      po_number: poNumber.trim(),
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
        // Calculate taxes based on base amount (pre-discount) for consistency
        const taxAmount = baseAmount * ((cgst + sgst + igst) / 100);
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
          cgst: row.cgst,
          sgst: row.sgst,
          igst: row.igst,
          discount: typeof row.disc === 'number' ? row.disc : 0,
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
          cgst: row.cgst.toString(),
          sgst: row.sgst.toString(),
          igst: row.igst.toString(),
          discount: (typeof row.disc === 'number' ? row.disc : 0).toString(),
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
      po_number: poNumber,
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
        // Calculate taxes based on base amount (pre-discount) for consistency
        const taxAmount = baseAmount * ((cgst + sgst + igst) / 100);
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
      return 'Please complete all required fields for products (Product Name and Quantity Received)';
    }
    return null;
  };

  const proceedWithSave = async () => {
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

      let result;
      let finalReceiptId: number | null = null;

      if (isEditMode && receiptId) {
        const editPayload = transformFormDataToEditPayload();
        result = await editReceipt(editPayload).unwrap();
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

        try {
          result = await submitReceipt(submitPayload).unwrap();
          finalReceiptId = result.receipt_id || (result as any).receiptId;
        } catch (rtkError) {
          // Only attempt manual fetch if we didn't already get a result
          if (!finalReceiptId) {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/';
            const response = await fetch(`${apiBaseUrl}receive/submit-receipt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submitPayload)
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            result = await response.json();
            finalReceiptId = result.receipt_id || result.receiptId;
          }
        }
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
      let errorMessage = 'Failed to submit receipt';
      if (error?.data) {
        if (typeof error.data === 'string') errorMessage = error.data;
        else if (error.data.message) errorMessage = error.data.message;
        else if (error.data.error) errorMessage = error.data.error;
        else if (Array.isArray(error.data.errors) && error.data.errors.length > 0) errorMessage = error.data.errors[0];
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setSaveError(errorMessage);
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

      let result;
      let newReceiptId: number | null = null;
      try {
        result = await submitReceipt(submitPayload).unwrap();
        newReceiptId = result.receipt_id || (result as any).receiptId;
      } catch (rtkError) {
        // Only attempt manual fetch if we didn't already get a result
        if (!newReceiptId) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/';
          const response = await fetch(`${apiBaseUrl}receive/submit-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitPayload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          result = await response.json();
          newReceiptId = result.receipt_id || result.receiptId;
        }
      }

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
            receiptNumber: `RA${newReceiptId}`,
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
      let errorMessage = 'Failed to submit receipt';
      if (error?.data) {
        if (typeof error.data === 'string') errorMessage = error.data;
        else if (error.data.message) errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setSaveError(errorMessage);
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

      let result;
      let newReceiptId: number | null = null;
      try {
        // Optimistically use RTK Query
        result = await submitReceipt(submitPayload).unwrap();
        newReceiptId = result.receipt_id || (result as any).receiptId;
      } catch (rtkError) {
        // Fallback to manual fetch
        if (!newReceiptId) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/';
          const response = await fetch(`${apiBaseUrl}receive/submit-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitPayload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          result = await response.json();
          newReceiptId = result.receipt_id || result.receiptId;
        }
      }

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
      let errorMessage = 'Failed to submit receipt';
      if (error?.data) {
        if (typeof error.data === 'string') errorMessage = error.data;
        else if (error.data.message) errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReceipt = async () => {
    if (!isEditMode || !receiptId) {
      setDeleteError('No receipt selected for deletion');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(false);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/receive/delete-receipt/${receiptId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setDeleteSuccess(true);
      dispatch(receiveApi.util.invalidateTags(['Receive']));

      setTimeout(() => {
        navigate('/receive/order-receive');
      }, 2000);

    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete receipt');
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
