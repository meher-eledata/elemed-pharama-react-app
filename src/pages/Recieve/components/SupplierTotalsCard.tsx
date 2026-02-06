import React from "react";
import { Box, Typography } from "@mui/material";
import { SupplierTotals } from "../types";

interface SupplierTotalsCardProps {
  supplierTotals: SupplierTotals;
  supplierName: string;
}

const SupplierTotalsCard: React.FC<SupplierTotalsCardProps> = ({
  supplierTotals,
  supplierName,
}) => {
  if (!supplierName) return null;

  const formatCurrency = (value: number) => {
    return `₹${Math.round(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: "24px",
        padding: "16px 24px",
        backgroundColor: "#F6F8FB",
        borderRadius: "12px",
        border: "1px solid #E6ECF5",
        marginTop: "16px",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: "#728197",
          }}
        >
          Amount Paid
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "#10B981",
          }}
        >
          {formatCurrency(supplierTotals.amountPaid)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: "#728197",
          }}
        >
          Pending Amount
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "#F59E0B",
          }}
        >
          {formatCurrency(supplierTotals.pendingAmount)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: "#728197",
          }}
        >
          Credit Available
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Lexend', sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            color: "#3B82F6",
          }}
        >
          {formatCurrency(supplierTotals.creditAvailable)}
        </Typography>
      </Box>
    </Box>
  );
};

export default SupplierTotalsCard;
