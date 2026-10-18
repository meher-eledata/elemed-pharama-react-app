import React from "react";
import { TableRow, TableCell } from "@mui/material";
import { OrderReceiveRow } from "../types";
import { formatWholeCurrency } from "../../../utils/reportFormat";

interface OrderReceiveFooterProps {
  sortedData: OrderReceiveRow[];
  activeTab: number;
  currentPage: number;
}

const OrderReceiveFooter: React.FC<OrderReceiveFooterProps> = ({ sortedData, activeTab, currentPage }) => {
  if (sortedData.length === 0 || activeTab !== 2 || currentPage !== 1) {
    return null;
  }

  const totalAmount = sortedData.reduce((sum, row) => sum + (row.amt || 0), 0);
  const totalAmountPaid = sortedData.reduce((sum, row) => sum + (row.amountPaid || 0), 0);
  const totalPendingAmount = sortedData.reduce((sum, row) => sum + (row.pendingAmount || 0), 0);
  const totalCreditAvailable = sortedData.reduce((sum, row) => sum + (row.creditAvailable || 0), 0);

  return (
    <TableRow
      sx={{
        backgroundColor: '#F9FAFB',
      }}
    >
      <TableCell
        sx={{
          padding: '12px 16px',
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 600,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#374151',
        }}
      >
        Total:
      </TableCell>

      <TableCell sx={{ padding: '12px 16px' }} />
      <TableCell sx={{ padding: '12px 16px' }} />
      <TableCell sx={{ padding: '12px 16px' }} />
      <TableCell sx={{ padding: '12px 16px' }} />
      <TableCell sx={{ padding: '12px 16px' }} />

      <TableCell
        sx={{
          padding: '12px 12px',
          textAlign: 'left',
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          color: '#1A212B',
        }}
      >
        {formatWholeCurrency(totalAmount)}
      </TableCell>

      <TableCell
        sx={{
          padding: '12px 12px',
          textAlign: 'left',
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          color: '#1A212B',
        }}
      >
        {formatWholeCurrency(totalAmountPaid)}
      </TableCell>

      <TableCell
        sx={{
          padding: '12px 12px',
          textAlign: 'left',
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          color: '#1A212B',
        }}
      >
        {formatWholeCurrency(totalPendingAmount)}
      </TableCell>

      <TableCell
        sx={{
          padding: '12px 12px',
          textAlign: 'left',
          fontFamily: "'Lexend', sans-serif",
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '24px',
          color: '#1A212B',
        }}
      >
        {formatWholeCurrency(totalCreditAvailable)}
      </TableCell>

      <TableCell sx={{ padding: '12px 16px' }} />
    </TableRow>
  );
};

export default OrderReceiveFooter;
