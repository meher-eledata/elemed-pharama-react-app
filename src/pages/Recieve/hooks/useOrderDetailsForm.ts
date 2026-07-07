import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { PharmaTableRow, SupplierTotals } from "../types";

interface LocationState {
  selectedSupplier?: string;
  selectedPO?: string;
  selectedOrder?: any;
  isEditMode?: boolean;
  receiptId?: number;
  receiptNumber?: string;
  transactionNumber?: string;
  paymentVendor?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
}

export const useOrderDetailsForm = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  // Extract location state
  const locationState = location.state as LocationState || {};
  const selectedSupplier = locationState.selectedSupplier || "";
  const selectedPO = locationState.selectedPO || "";
  const selectedOrder = locationState.selectedOrder || null;
  const isEditMode = locationState.isEditMode || false;
  const receiptId = locationState.receiptId || null;
  const receiptNumber = locationState.receiptNumber || "";
  const navigationTransactionNumber = locationState.transactionNumber || "";
  const navigationPaymentVendor = locationState.paymentVendor || "";
  const navigationInvoiceDate = locationState.invoiceDate || "";
  const navigationInvoiceNumber = locationState.invoiceNumber || "";

  // Form fields state
  const [supplierName, setSupplierName] = useState<string>(
    (isEditMode && selectedOrder ? selectedOrder.supplier : selectedSupplier) || ""
  );
  const [supplierSearchTerm, setSupplierSearchTerm] = useState<string>("");
  const [poNumber, setPoNumber] = useState<string>(
    isEditMode && selectedOrder ? selectedOrder.poNo : selectedPO
  );
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceNumberError, setInvoiceNumberError] = useState<string>("");
  const [transactionNumber, setTransactionNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [paymentVendor, setPaymentVendor] = useState<string>("");

  // Invoice file state
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string>("");
  const [invoiceAttachmentUrl, setInvoiceAttachmentUrl] = useState<string>("");
  const [isExistingFile, setIsExistingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Original values tracking (for change detection in edit mode)
  const [originalReceiptLines, setOriginalReceiptLines] = useState<PharmaTableRow[]>([]);
  const [originalFormValues, setOriginalFormValues] = useState({
    supplierName: '',
    poNumber: '',
    invoiceDate: '',
    invoiceNumber: '',
    transactionNumber: '',
    paymentVendor: '',
    paymentMethod: 'Cash',
  });
  const [originalInvoiceFile, setOriginalInvoiceFile] = useState<File | null>(null);
  const [originalInvoiceAttachmentUrl, setOriginalInvoiceAttachmentUrl] = useState<string>('');

  // Supplier totals state
  const [supplierTotals, setSupplierTotals] = useState<SupplierTotals>({
    amountPaid: 0,
    pendingAmount: 0,
    creditAvailable: 0,
  });

  // UI state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);

  // Focus states
  const [isSupplierFocused, setIsSupplierFocused] = useState(false);
  const [isVendorFocused, setIsVendorFocused] = useState(false);
  const [isTransactionFocused, setIsTransactionFocused] = useState(false);
  const [isTransactionHovered, setIsTransactionHovered] = useState(false);

  // Modal states
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);
  const [isReceiptDeleteDialogOpen, setIsReceiptDeleteDialogOpen] = useState<boolean>(false);
  const [isUploadConfirmationDialogOpen, setIsUploadConfirmationDialogOpen] = useState<boolean>(false);
  const [isProceedToPaymentDialogOpen, setIsProceedToPaymentDialogOpen] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInvoiceFile(file);
      setInvoiceFileName(file.name);

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setInvoiceAttachmentUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just show the filename
        setInvoiceAttachmentUrl('');
      }
      setIsExistingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setInvoiceFile(null);
    setInvoiceFileName("");
    setInvoiceAttachmentUrl("");
    setIsExistingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setSupplierName("");
    setPoNumber("");
    setInvoiceDate("");
    setInvoiceNumber("");
    setInvoiceNumberError("");
    setTransactionNumber("");
    setPaymentVendor("");
    setInvoiceFile(null);
    setInvoiceFileName("");
    setInvoiceAttachmentUrl("");
    setSaveSuccess(false);
    setSaveError(null);
  };

  return {
    // Location state
    selectedSupplier,
    selectedPO,
    selectedOrder,
    isEditMode,
    receiptId,
    receiptNumber,
    navigationTransactionNumber,
    navigationPaymentVendor,
    navigationInvoiceDate,
    navigationInvoiceNumber,
    user,

    // Form fields
    supplierName,
    setSupplierName,
    supplierSearchTerm,
    setSupplierSearchTerm,
    poNumber,
    setPoNumber,
    invoiceDate,
    setInvoiceDate,
    invoiceNumber,
    setInvoiceNumber,
    invoiceNumberError,
    setInvoiceNumberError,
    transactionNumber,
    setTransactionNumber,
    paymentMethod,
    setPaymentMethod,
    paymentVendor,
    setPaymentVendor,

    // Invoice file
    invoiceFile,
    setInvoiceFile,
    invoiceFileName,
    setInvoiceFileName,
    invoiceAttachmentUrl,
    setInvoiceAttachmentUrl,
    isExistingFile,
    setIsExistingFile,
    fileInputRef,
    handleFileChange,
    handleRemoveFile,

    // Original values
    originalReceiptLines,
    setOriginalReceiptLines,
    originalFormValues,
    setOriginalFormValues,
    originalInvoiceFile,
    setOriginalInvoiceFile,
    originalInvoiceAttachmentUrl,
    setOriginalInvoiceAttachmentUrl,

    // Supplier totals
    supplierTotals,
    setSupplierTotals,

    // UI state
    isSaving,
    setIsSaving,
    saveError,
    setSaveError,
    saveSuccess,
    setSaveSuccess,
    isDeleting,
    setIsDeleting,
    deleteError,
    setDeleteError,
    deleteSuccess,
    setDeleteSuccess,

    // Focus states
    isSupplierFocused,
    setIsSupplierFocused,
    isVendorFocused,
    setIsVendorFocused,
    isTransactionFocused,
    setIsTransactionFocused,
    isTransactionHovered,
    setIsTransactionHovered,

    // Modal states
    isNewProductModalOpen,
    setIsNewProductModalOpen,
    isNewSupplierModalOpen,
    setIsNewSupplierModalOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    rowToDeleteId,
    setRowToDeleteId,
    isReceiptDeleteDialogOpen,
    setIsReceiptDeleteDialogOpen,
    isUploadConfirmationDialogOpen,
    setIsUploadConfirmationDialogOpen,
    isProceedToPaymentDialogOpen,
    setIsProceedToPaymentDialogOpen,

    // Utilities
    resetForm,
  };
};
