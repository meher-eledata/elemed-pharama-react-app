import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Autocomplete,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { PharmaDatePicker } from "../../components/Common";
import dayjs, { Dayjs } from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { paymentMethods, paymentVendors, themeColors } from "../../config/constants/OrderDetail.constants";
import { ReusableTable, TableColumn } from "../../components/PharmaTable";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import {
  useUpsertPurchaseOrderPaymentsMutation,
  useGetPurchaseOrderPaymentsMutation,
  useGetSupplierCreditBalanceQuery,
  useAdjustSupplierCreditMutation
} from "../../redux/slices/receiveApi";

const TickMarkIcon = (props: any) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    style={{
      pointerEvents: "none",
      color: "currentColor",
      overflow: "visible"
    }}
  >
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface PaymentRow {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  paymentMethod: string;
  paymentVendor: string;
  amount: number;
  details: string;
  isEditing?: boolean;
}

const PaymentDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [upsertPurchaseOrderPayments, { isLoading: isSavingPayments }] = useUpsertPurchaseOrderPaymentsMutation();
  const [getPurchaseOrderPayments, { isLoading: isFetchingPayments }] = useGetPurchaseOrderPaymentsMutation();

  // Get data from navigation state
  const navigationState = location.state as any;
  const supplierName = navigationState?.supplierName || "";
  const poNumber = navigationState?.poNumber || "";
  const poId = navigationState?.poId || null;
  const invoiceDate = navigationState?.invoiceDate || "";
  const pharmaTableData = navigationState?.pharmaTableData || [];
  const isEditMode = navigationState?.isEditMode || false;
  const receiptId = navigationState?.receiptId || null;
  const receiptNumber = navigationState?.receiptNumber || "";
  const supplierId = navigationState?.supplierId || null;

  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(navigationState?.totalAmount || 0);

  const [creditAvailable, setCreditAvailable] = useState<number>(navigationState?.creditAvailable || 0);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState<boolean>(false);
  const [tempCreditValue, setTempCreditValue] = useState<string>("");
  const [isCreditManuallyEdited, setIsCreditManuallyEdited] = useState<boolean>(false);

  // Adjust Supplier Credit State
  const [adjustSupplierCredit, { isLoading: isAdjustingCredit }] = useAdjustSupplierCreditMutation();
  const [creditDirection, setCreditDirection] = useState<"IN" | "OUT">("IN");
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [creditNotes, setCreditNotes] = useState<string>("");

  // Fetch current payments on mount if poId is available
  useEffect(() => {
    const fetchPayments = async () => {
      if (poId) {
        try {
          const response = await getPurchaseOrderPayments({ po_id: poId }).unwrap();
          if (response && response.payments) {
            const mappedPayments: PaymentRow[] = response.payments.map((p) => ({
              id: p.id.toString(),
              transactionNumber: p.transaction_number,
              transactionDate: dayjs(p.created_at).format("DD/MM/YYYY"),
              paymentMethod: p.payment_method,
              paymentVendor: p.payment_vendor || "",
              amount: p.payment_amount,
              details: "", // Details might not be in the get-payments response
            }));
            setPaymentRows(mappedPayments);
          }
        } catch (err) {
          console.error("Failed to fetch payments:", err);
          setSaveError("Failed to fetch existing payments for this purchase order.");
        }
      }
    };

    fetchPayments();
  }, [poId, getPurchaseOrderPayments]);

  // Fetch supplier credit balance
  const { data: supplierCreditData } = useGetSupplierCreditBalanceQuery(
    { supplier_id: Number(supplierId) },
    { skip: !supplierId }
  );

  useEffect(() => {
    if (supplierCreditData && !isCreditManuallyEdited) {
      setCreditAvailable(supplierCreditData.available_credit);
    }
  }, [supplierCreditData, isCreditManuallyEdited]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<PaymentRow>>({});
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState<boolean>(false);
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isFinalSaveConfirmationOpen, setIsFinalSaveConfirmationOpen] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Form fields for adding new payment
  const [transactionNumber, setTransactionNumber] = useState<string>(navigationState?.transactionNumber || "");
  const [transactionDate, setTransactionDate] = useState<Dayjs | null>(
    navigationState?.invoiceDate ? dayjs(navigationState.invoiceDate) : dayjs()
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(navigationState?.paymentMethod || "Cash");
  const [paymentVendor, setPaymentVendor] = useState<string>(navigationState?.paymentVendor || "");
  const [amount, setAmount] = useState<string>(navigationState?.amount?.toString() || "");
  const [details, setDetails] = useState<string>("");

  const paymentTableColumns: TableColumn<PaymentRow>[] = [
    {
      key: "transactionNumber",
      header: "Transaction number",
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            variant="outlined"
            fullWidth
            value={editingData.transactionNumber || row.transactionNumber}
            onChange={(e) => setEditingData({ ...editingData, transactionNumber: e.target.value })}
            sx={{
              width: "180px",
              "& .MuiOutlinedInput-root": {
                height: "36px",
                fontSize: "14px",
              },
            }}
          />
        ) : (
          <span>{row.transactionNumber}</span>
        )
      ),
    },
    {
      key: "transactionDate",
      header: "Transaction date",
      render: (row) => (
        editingRowId === row.id ? (
          <PharmaDatePicker
            value={editingData.transactionDate ? dayjs(editingData.transactionDate, "DD/MM/YYYY") : dayjs(row.transactionDate, "DD/MM/YYYY")}
            onChange={(newValue) => setEditingData({ ...editingData, transactionDate: newValue?.format("DD/MM/YYYY") || "" })}
            width={180}
          />
        ) : (
          <span>{row.transactionDate}</span>
        )
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment method",
      render: (row) => (
        editingRowId === row.id ? (
          <Autocomplete
            size="small"
            options={paymentMethods}
            value={editingData.paymentMethod || row.paymentMethod}
            onChange={(_, newValue) => setEditingData({ ...editingData, paymentMethod: newValue || "" })}
            disableClearable
            slotProps={{
              popper: {
                sx: {
                  "& .MuiPaper-root": {
                    borderRadius: "12px",
                    marginTop: "4px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                    border: "1px solid #E6ECF5",
                    height: "auto !important",
                    minHeight: "unset !important",
                    padding: "0px !important",
                    overflow: "hidden",
                    "& .MuiAutocomplete-listbox": {
                      padding: "0px !important",
                      maxHeight: "300px !important",
                      minHeight: "unset !important",
                      overflow: "auto",
                    },
                  },
                },
              },
            }}
            ListboxProps={{
              sx: {
                padding: "0px !important",
                maxHeight: "300px !important",
                minHeight: "unset !important",
                overflow: "auto",
              },
            }}
            sx={{ width: "150px" }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "36px",
                    fontSize: "14px",
                  },
                }}
              />
            )}
          />
        ) : (
          <span>{row.paymentMethod}</span>
        )
      ),
    },
    {
      key: "paymentVendor",
      header: "Payment vendor",
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            variant="outlined"
            fullWidth
            value={editingData.paymentVendor || row.paymentVendor}
            onChange={(e) => setEditingData({ ...editingData, paymentVendor: e.target.value })}
            sx={{
              width: "150px",
              "& .MuiOutlinedInput-root": {
                height: "36px",
                fontSize: "14px",
              },
            }}
          />
        ) : (
          <span>{row.paymentVendor || "-"}</span>
        )
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            variant="outlined"
            fullWidth
            value={editingData.amount !== undefined ? editingData.amount : row.amount}
            onChange={(e) => setEditingData({ ...editingData, amount: parseFloat(e.target.value) || 0 })}
            sx={{
              width: "120px",
              "& .MuiOutlinedInput-root": {
                height: "36px",
                fontSize: "14px",
              },
            }}
          />
        ) : (
          <span>₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        )
      ),
    },
    {
      key: "details",
      header: "Payment details",
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            variant="outlined"
            fullWidth
            value={editingData.details || row.details}
            onChange={(e) => setEditingData({ ...editingData, details: e.target.value })}
            sx={{
              width: "180px",
              "& .MuiOutlinedInput-root": {
                height: "36px",
                fontSize: "14px",
              },
            }}
          />
        ) : (
          <span>{row.details || "-"}</span>
        )
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {editingRowId === row.id ? (
            <>
              <Box
                onClick={() => {
                  setPendingSaveId(row.id);
                  setIsSaveConfirmationOpen(true);
                }}
                sx={{
                  cursor: 'pointer',
                  color: "#10B981",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  '&:hover': { opacity: 0.8 }
                }}
              >
                <TickMarkIcon />
              </Box>
              <Box
                onClick={() => {
                  setEditingRowId(null);
                  setEditingData({});
                }}
                sx={{
                  cursor: 'pointer',
                  color: "#EF4444",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  '&:hover': { opacity: 0.8 }
                }}
              >
                <CloseIcon sx={{ fontSize: '18px' }} />
              </Box>
            </>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={() => handleEditClick(row)}
                sx={{ color: "#000000" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(row.id)}
                sx={{ color: "#000000" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      ),
    },
  ];

  const handleAddPayment = () => {
    if (!transactionNumber.trim() || !transactionDate || !amount.trim()) {
      return;
    }

    const currentTotalPaid = paymentRows.reduce((sum, row) => sum + row.amount, 0);
    const newAmount = parseFloat(amount) || 0;
    const remainingBalance = totalAmount - currentTotalPaid;

    if (newAmount > remainingBalance) {
      alert(`Payment amount (₹${newAmount.toFixed(2)}) exceeds the remaining balance (₹${remainingBalance.toFixed(2)}).`);
      return;
    }

    const newPayment: PaymentRow = {
      id: Date.now().toString(),
      transactionNumber: transactionNumber.trim(),
      transactionDate: transactionDate.format("DD/MM/YYYY"),
      paymentMethod,
      paymentVendor: paymentVendor || "",
      amount: parseFloat(amount) || 0,
      details: details.trim(),
    };

    setPaymentRows([...paymentRows, newPayment]);

    // Reset form
    setTransactionNumber("");
    setTransactionDate(null);
    setPaymentMethod("Cash");
    setPaymentVendor("");
    setAmount("");
    setDetails("");
  };

  const handleEditClick = (row: PaymentRow) => {
    setEditingRowId(row.id);
    setEditingData({
      transactionNumber: row.transactionNumber,
      transactionDate: row.transactionDate,
      paymentMethod: row.paymentMethod,
      paymentVendor: row.paymentVendor,
      amount: row.amount,
      details: row.details,
    });
  };

  const handleConfirmSave = () => {
    if (pendingSaveId) {
      const rowToEdit = paymentRows.find(r => r.id === pendingSaveId);
      if (rowToEdit) {
        const otherPaymentsTotal = paymentRows
          .filter(r => r.id !== pendingSaveId)
          .reduce((sum, r) => sum + r.amount, 0);
        const editedAmount = editingData.amount !== undefined ? editingData.amount : rowToEdit.amount;
        const remainingBalance = totalAmount - otherPaymentsTotal;

        if (editedAmount > remainingBalance) {
          alert(`Edited amount (₹${editedAmount.toFixed(2)}) exceeds the remaining balance (₹${remainingBalance.toFixed(2)}).`);
          setIsSaveConfirmationOpen(false);
          setPendingSaveId(null);
          return;
        }
      }

      setPaymentRows(paymentRows.map(row => {
        if (row.id === pendingSaveId) {
          return {
            ...row,
            transactionNumber: editingData.transactionNumber || row.transactionNumber,
            transactionDate: editingData.transactionDate || row.transactionDate,
            paymentMethod: editingData.paymentMethod || row.paymentMethod,
            paymentVendor: editingData.paymentVendor || row.paymentVendor,
            amount: editingData.amount !== undefined ? editingData.amount : row.amount,
            details: editingData.details || row.details,
          };
        }
        return row;
      }));
      setEditingRowId(null);
      setEditingData({});
      setPendingSaveId(null);
    }
    setIsSaveConfirmationOpen(false);
  };

  const handleCancelSave = () => {
    setIsSaveConfirmationOpen(false);
    setPendingSaveId(null);
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setIsDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      setPaymentRows(paymentRows.filter(row => row.id !== pendingDeleteId));
      setPendingDeleteId(null);
    }
    setIsDeleteConfirmationOpen(false);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
    setPendingDeleteId(null);
  };
  const handleOpenCreditModal = () => {
    setCreditDirection("IN");
    setCreditAmount("");
    setCreditNotes("");
    setIsCreditModalOpen(true);
  };

  const handleSaveCredit = async () => {
    if (!supplierId) {
      return;
    }
    const amountVal = parseFloat(creditAmount);
    if (!amountVal || amountVal <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const createdBy = user?.username || user?.first_name || "meher";
      await adjustSupplierCredit({
        supplier_id: Number(supplierId),
        direction: creditDirection,
        amount: amountVal,
        credit_type: "ADJUSTMENT",
        notes: creditNotes,
        created_by: createdBy
      }).unwrap();

      setIsCreditModalOpen(false);
      setIsCreditManuallyEdited(false);
      setSuccessMessage("Supplier credit updated successfully");
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to adjust credit:", error);
      alert("Failed to adjust credit. Please try again.");
    }
  };

  const handleCancel = () => {
    // Navigate back to order receive without saving changes
    navigate('/receive/order-receive');
  };

  const handleSave = () => {
    // Show confirmation dialog before saving
    setIsFinalSaveConfirmationOpen(true);
  };

  const handleConfirmFinalSave = async () => {
    if (!receiptId) {
      setSaveError('Receipt ID is missing. Please go back and try again.');
      setIsFinalSaveConfirmationOpen(false);
      return;
    }

    try {
      // Get created_by from user, fallback to "meher"
      const createdBy = user?.username || user?.first_name || "meher";

      // Transform paymentRows to match API structure
      const payments = paymentRows.map(row => {
        // Convert transaction_date from DD/MM/YYYY to YYYY-MM-DD
        let transactionDateFormatted = "";
        if (row.transactionDate) {
          const parsedDate = dayjs(row.transactionDate, "DD/MM/YYYY");
          if (parsedDate.isValid()) {
            transactionDateFormatted = parsedDate.format("YYYY-MM-DD");
          } else {
            // Try parsing as ISO format if DD/MM/YYYY fails
            const isoDate = dayjs(row.transactionDate);
            transactionDateFormatted = isoDate.isValid() ? isoDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
          }
        } else {
          transactionDateFormatted = dayjs().format("YYYY-MM-DD");
        }

        const paymentId = row.id && row.id.length < 13 && !isNaN(parseInt(row.id)) ? parseInt(row.id) : undefined;
        return {
          id: paymentId,
          payment_method: row.paymentMethod,
          direction: "OUT",
          payment_vendor: row.paymentVendor && row.paymentVendor.trim() !== "" ? row.paymentVendor : null,
          transaction_number: row.transactionNumber,
          transaction_date: transactionDateFormatted,
          payment_amount: row.amount,
          details: row.details || "",
        };
      });

      const payload = {
        receipt_id: receiptId,
        created_by: createdBy,
        payments: payments,
      };

      await upsertPurchaseOrderPayments(payload).unwrap();

      setSuccessMessage("Payment details saved successfully!");
      setSaveSuccess(true);
      setIsFinalSaveConfirmationOpen(false);

      // Navigate back to order receive after successful save
      setTimeout(() => {
        navigate('/receive/order-receive');
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'Failed to save payment details';

      if (error?.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (Array.isArray(error.data.errors) && error.data.errors.length > 0) {
          errorMessage = error.data.errors[0];
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status) {
        errorMessage = `Server error (${error.status}): ${error.status === 404 ? 'Endpoint not found' : error.status === 500 ? 'Internal server error' : 'Unknown error'}`;
      }

      setSaveError(errorMessage);
      setIsFinalSaveConfirmationOpen(false);
    }
  };

  const handleCancelFinalSave = () => {
    setIsFinalSaveConfirmationOpen(false);
  };

  return (
    <Box sx={{ padding: "24px" }}>
      {/* Payment Details Section */}
      <Box sx={{ marginBottom: "32px" }}>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontWeight: 600,
            fontSize: "18px",
            lineHeight: "24px",
            color: "#1A212B",
            marginBottom: "16px",
          }}
        >
          Payment Details
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#728197",
                }}
              >
                Transaction Number
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="Enter transaction number"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    height: "44px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&:hover fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#728197",
                      borderWidth: "2px",
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#728197",
                }}
              >
                Transaction Date
              </Typography>
              <PharmaDatePicker
                value={transactionDate}
                onChange={(newValue: Dayjs | null) => setTransactionDate(newValue)}
                width={274}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#728197",
                }}
              >
                Payment method
              </Typography>
              <Autocomplete
                options={paymentMethods}
                value={paymentMethod}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setPaymentMethod(newValue);
                  }
                }}
                disableClearable
                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiPaper-root": {
                        borderRadius: "12px",
                        marginTop: "4px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                        border: "1px solid #E6ECF5",
                        height: "auto !important",
                        minHeight: "unset !important",
                        padding: "0px !important",
                        overflow: "hidden",
                        "& .MuiAutocomplete-listbox": {
                          padding: "0px !important",
                          maxHeight: "300px !important",
                          minHeight: "unset !important",
                          overflow: "auto",
                        },
                      },
                    },
                  },
                }}
                ListboxProps={{
                  sx: {
                    padding: "0px !important",
                    maxHeight: "300px !important",
                    minHeight: "unset !important",
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select payment method"
                    variant="outlined"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "18px",
                        height: "44px",
                        backgroundColor: "#FFFFFF",
                        "& fieldset": {
                          borderColor: "#D1D5DB",
                        },
                        "&:hover fieldset": {
                          borderColor: "#D1D5DB",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#728197",
                          borderWidth: "2px",
                          outline: "none",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        padding: "12px 16px",
                        fontFamily: "'Lexend', sans-serif",
                        fontSize: "16px",
                        lineHeight: "24px",
                        color: "#728197",
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#728197",
                }}
              >
                Payment vendor
              </Typography>
              <Autocomplete
                options={paymentVendors}
                value={paymentVendor || null}
                onChange={(_, newValue) => {
                  setPaymentVendor(newValue || "");
                }}
                disableClearable={!paymentVendor}

                // ADD these two props to fix height control:
                disableListWrap={true}  // stops MUI from pre-calculating large height
                PaperComponent={({ children }) => (
                  <Box
                    sx={{
                      padding: 0,
                      marginTop: "4px",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      backgroundColor: "#fff",
                    }}
                  >
                    {children}
                  </Box>
                )}

                slotProps={{
                  popper: {
                    sx: {
                      "& .MuiPaper-root": {
                        minWidth: "274px",
                        width: "fit-content",
                        padding: "0 !important",
                        marginTop: "4px !important",
                        height: "auto !important",
                        minHeight: "unset !important",
                        overflow: "hidden",
                        "& .MuiAutocomplete-listbox": {
                          padding: "4px 0 !important",
                          margin: "0 !important",
                          maxHeight: "300px !important",
                          minHeight: "unset !important",
                          overflow: "auto",
                          "& .MuiAutocomplete-option": {
                            marginBottom: "0 !important",
                            paddingBottom: "8px !important",
                          },
                        },
                      },
                    },
                  },
                }}

                ListboxProps={{
                  sx: {
                    padding: "4px 0 !important",
                    maxHeight: "none !important",
                    "& li:last-child": {
                      marginBottom: "0 !important",
                    },
                  },
                }}

                sx={{
                  minWidth: "274px",
                  width: "274px",
                }}

                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select bank / vendor"
                    variant="outlined"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "18px",
                        height: "44px",
                        backgroundColor: "#FFFFFF",
                        "& fieldset": {
                          borderColor: "#D1D5DB",
                        },
                        "&:hover fieldset": {
                          borderColor: "#D1D5DB",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#728197",
                          borderWidth: "2px",
                          outline: "none",
                        },
                      },
                      "& .MuiOutlinedInput-input": {
                        padding: "12px 16px",
                        fontFamily: "'Lexend', sans-serif",
                        fontSize: "16px",
                        lineHeight: "24px",
                        color: "#728197",
                      },
                    }}
                  />
                )}
              />

            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#728197",
                }}
              >
                Amount
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    height: "44px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&:hover fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#728197",
                      borderWidth: "2px",
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 500,
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#728197",
                }}
              >
                Details
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Enter details"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    height: "44px",
                    backgroundColor: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&:hover fieldset": {
                      borderColor: "#D1D5DB",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#728197",
                      borderWidth: "2px",
                      outline: "none",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 16px",
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#728197",
                  },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "#EF4444",
                }}
              >
                *INR {creditAvailable.toLocaleString('en-IN')} credit available with this supplier
              </Typography>
              <IconButton
                size="small"
                onClick={handleOpenCreditModal}
                sx={{
                  padding: "4px",
                  color: "#5C17E5",
                  backgroundColor: "#F3F0FF",
                  "&:hover": {
                    backgroundColor: "#EBE5FF",
                  },
                }}
              >
                <EditIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPayment}
              disabled={!transactionNumber.trim() || !transactionDate || !amount.trim()}
              sx={{
                backgroundColor: "#5C17E5",
                color: "#FFFFFF",
                textTransform: "none",
                borderRadius: "12px",
                padding: "8px 16px",
                height: "36px",
                minWidth: "auto",
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 500,
                fontSize: "14px",
                "&:hover": {
                  backgroundColor: "#4A14C7",
                },
                "&:disabled": {
                  backgroundColor: "#D1D5DB",
                  color: "#9CA3AF",
                },
                "& .MuiButton-startIcon": {
                  marginRight: "4px",
                  "& svg": {
                    fontSize: "18px",
                  },
                },
              }}
            >
              Add new payment
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Payment Details Table */}
      <Box sx={{ marginBottom: "32px" }}>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontWeight: 600,
            fontSize: "18px",
            lineHeight: "24px",
            color: "#1A212B",
            marginBottom: "16px",
          }}
        >
          Payment details
        </Typography>

        <ReusableTable<PaymentRow>
          columns={paymentTableColumns}
          data={paymentRows}
          emptyMessage="No payment details added yet"
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => { }}
          showFilters={false}
          onShowFiltersToggle={() => { }}
          currentFilterKey=""
          onFilterSelect={() => { }}
          totalRows={paymentRows.length}
          rowsPerPage={10}
          currentPage={1}
          onPageChange={() => { }}
          onSortRequest={() => { }}
          sortConfig={{ key: "", direction: "asc" }}
          selectedRows={[]}
          setSelectedRows={() => { }}
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          sx={{
            borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
            color: themeColors.cancelButtonBorder || "#27313F",
            textTransform: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontFamily: "'Lexend', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            "&:hover": {
              borderColor: themeColors.cancelButtonBorder || "#CBD4E1",
              backgroundColor: "#F9FAFB",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={paymentRows.length === 0 || isSavingPayments}
          sx={{
            backgroundColor: paymentRows.length === 0 ? "#D1D5DB" : "#5C17E5",
            color: "#FFFFFF",
            textTransform: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontFamily: "'Lexend', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            "&:hover": {
              backgroundColor: paymentRows.length === 0 ? "#D1D5DB" : "#4A14C7",
            },
            "&:disabled": {
              backgroundColor: "#D1D5DB",
              color: "#9CA3AF",
            },
          }}
        >
          {isSavingPayments ? (
            <>
              <CircularProgress size={16} sx={{ color: "#FFFFFF", marginRight: "8px" }} />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </Box>

      <ConfirmationDialog
        open={isSaveConfirmationOpen}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Save Changes"
        message="Are you sure you want to save the changes to this payment record?"
        confirmLabel="Yes, Save Changes"
        cancelLabel="Cancel"
      />

      <ConfirmationDialog
        open={isDeleteConfirmationOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
      />

      <ConfirmationDialog
        open={isFinalSaveConfirmationOpen}
        onClose={handleCancelFinalSave}
        onConfirm={handleConfirmFinalSave}
        title="Save Payment Details"
        message="Are you sure you want to save all payment details? You will be redirected to the order receive page."
        confirmLabel="Yes, Save"
        cancelLabel="Cancel"
      />

      <Snackbar
        open={!!saveError}
        autoHideDuration={6000}
        onClose={() => setSaveError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSaveError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {saveError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSaveSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>


      <ConfirmationDialog
        open={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onConfirm={handleSaveCredit}
        title="Adjust Supplier Credit"
        confirmLabel={isAdjustingCredit ? "Saving..." : "Save Adjustment"}
        cancelLabel="Cancel"
        message={
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>
              Manually adjust the available credit for this supplier.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={creditDirection === "IN" ? "contained" : "outlined"}
                onClick={() => setCreditDirection("IN")}
                sx={{
                  flex: 1,
                  textTransform: 'none',
                  bgcolor: creditDirection === "IN" ? '#5C17E5' : 'transparent',
                  color: creditDirection === "IN" ? '#FFFFFF' : '#6B7280',
                  borderColor: creditDirection === "IN" ? '#5C17E5' : '#E5E7EB',
                  '&:hover': {
                    bgcolor: creditDirection === "IN" ? '#4C14CC' : '#F9FAFB',
                    borderColor: creditDirection === "IN" ? '#4C14CC' : '#D1D5DB',
                  }
                }}
              >
                Add Credit (IN)
              </Button>
              <Button
                variant={creditDirection === "OUT" ? "contained" : "outlined"}
                onClick={() => setCreditDirection("OUT")}
                sx={{
                  flex: 1,
                  textTransform: 'none',
                  bgcolor: creditDirection === "OUT" ? '#5C17E5' : 'transparent',
                  color: creditDirection === "OUT" ? '#FFFFFF' : '#6B7280',
                  borderColor: creditDirection === "OUT" ? '#5C17E5' : '#E5E7EB',
                  '&:hover': {
                    bgcolor: creditDirection === "OUT" ? '#4C14CC' : '#F9FAFB',
                    borderColor: creditDirection === "OUT" ? '#4C14CC' : '#D1D5DB',
                  }
                }}
              >
                Subtract Credit (OUT)
              </Button>
            </Box>

            <TextField
              fullWidth
              autoFocus
              type="number"
              variant="outlined"
              label="Amount"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />

            <TextField
              fullWidth
              variant="outlined"
              label="Notes"
              multiline
              rows={2}
              value={creditNotes}
              onChange={(e) => setCreditNotes(e.target.value)}
              placeholder="Reason for adjustment..."
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          </Box>
        }
      />
    </Box>
  );
};

export default PaymentDetails;

