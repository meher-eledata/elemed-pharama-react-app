import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Autocomplete,
    Modal,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { paymentMethods } from "../../../../../config/constants/OrderDetail.constants";

interface SplitPayment {
    id: string;
    paymentMethod: string;
    amount: number | string; // Allow string for input handling
    details: string;
}

interface PaymentSplitModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (payments: SplitPayment[]) => void;
    totalAmount: number;
    existingPayments?: SplitPayment[];
}

const PaymentSplitModal: React.FC<PaymentSplitModalProps> = ({
    open,
    onClose,
    onSave,
    totalAmount,
    existingPayments = [],
}) => {
    const [payments, setPayments] = useState<SplitPayment[]>([]);

    useEffect(() => {
        if (open) {
            if (existingPayments && existingPayments.length > 0) {
                setPayments(existingPayments);
            } else {
                // Initial state: One empty row
                setPayments([{ id: Date.now().toString(), paymentMethod: "Cash", amount: "", details: "" }]);
            }
        }
    }, [open, existingPayments]);

    const handleAddRow = () => {
        setPayments([
            ...payments,
            { id: Date.now().toString(), paymentMethod: "Cash", amount: "", details: "" }
        ]);
    };

    const handleRemoveRow = (id: string) => {
        if (payments.length === 1) {
            // Don't remove the last row, just clear it? Or allow removing everything?
            // Usually keeping one row is better UX for "Add Payment" modal
            setPayments([{ ...payments[0], paymentMethod: "Cash", amount: "", details: "" }]);
            return;
        }
        setPayments(payments.filter((p) => p.id !== id));
    };

    const handleUpdateRow = (id: string, field: keyof SplitPayment, value: any) => {
        setPayments(payments.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleSave = () => {
        // Filter out empty rows or convert string amount to number
        const validPayments = payments
            .filter(p => p.amount !== "" && parseFloat(p.amount.toString()) > 0)
            .map(p => ({
                ...p,
                amount: parseFloat(p.amount.toString())
            }));

        onSave(validPayments);
        onClose();
    };

    // Calculate total currently entered
    const currentTotal = payments.reduce((sum, p) => {
        const val = parseFloat(p.amount.toString());
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "800px", // Increased width
                    bgcolor: "background.paper",
                    borderRadius: "12px",
                    boxShadow: 24,
                    p: 4,
                    outline: "none",
                    minHeight: "500px", // Added minHeight for better initial appearance
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: "'Lexend', sans-serif",
                        fontWeight: 600,
                        mb: 3,
                        color: "#1A212B",
                    }}
                >
                    Payment details
                </Typography>

                {/* List of Editable Payments */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', mb: 2 }}>
                    {payments.map((p, index) => (
                        <Box key={p.id} sx={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <Box sx={{ flex: 1 }}>
                                <Autocomplete
                                    options={paymentMethods}
                                    value={p.paymentMethod}
                                    onChange={(_, newValue) => handleUpdateRow(p.id, 'paymentMethod', newValue || "Cash")}
                                    disableClearable
                                    popupIcon={<ArrowDropDownIcon sx={{ color: '#6B7280' }} />}
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
                                            padding: '0px !important',
                                            maxHeight: '300px !important',
                                            minHeight: 'unset !important',
                                            overflow: 'auto',
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Payment Method"
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                    backgroundColor: '#fff',
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Box>
                            <Box sx={{ width: "120px" }}>
                                <TextField
                                    type="number"
                                    placeholder="Amount"
                                    value={p.amount}
                                    onChange={(e) => handleUpdateRow(p.id, 'amount', e.target.value)}
                                    size="small"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            backgroundColor: '#fff',
                                        }
                                    }}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    placeholder="Details"
                                    value={p.details}
                                    onChange={(e) => handleUpdateRow(p.id, 'details', e.target.value)}
                                    size="small"
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            backgroundColor: '#fff',
                                        }
                                    }}
                                />
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => handleRemoveRow(p.id)}
                                sx={{ mt: 0.5 }}
                            >
                                <CloseIcon fontSize="small" color="error" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>

                {/* Add More Button (Below the list) */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddRow}
                    sx={{
                        bgcolor: "#6366F1",
                        color: "white",
                        textTransform: "none",
                        borderRadius: "8px",
                        mb: 4,
                        "&:hover": { bgcolor: "#4F46E5" },
                    }}
                >
                    Add more
                </Button>

                {/* Footer */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "12px", pt: 2 }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: "#374151",
                            bgcolor: "#F3F4F6",
                            textTransform: "none",
                            borderRadius: "8px",
                            px: 3,
                            "&:hover": { bgcolor: "#E5E7EB" },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        sx={{
                            bgcolor: "#6366F1",
                            color: "white",
                            textTransform: "none",
                            borderRadius: "8px",
                            px: 4,
                            "&:hover": { bgcolor: "#4F46E5" },
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default PaymentSplitModal;
