import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { TableColumn } from "../../../components/PharmaTable";
import { OrderReceiveRow, PurchaseOrderRow } from "../types";
import InvoiceAttachment from "./InvoiceAttachment";
import {
  ORDER_RECEIVE_TABLE_HEADERS,
  PURCHASE_ORDER_TABLE_HEADERS,
} from "../../../config/label/OrderReceive.labels";
import { ORDER_RECEIVE_CONSTANTS } from "../../../config/constants/OrderReceive.constants";
import { capitalizeFirstLetter } from "../utils";
import { TickMarkIcon } from "../styles";

export const getOrderReceiveColumns = (
  editingRowId: string | null,
  editingDraft: OrderReceiveRow | null,
  setEditingDraft: React.Dispatch<React.SetStateAction<OrderReceiveRow | null>>,
  handleViewDetailsClick: (row: OrderReceiveRow) => void,
  handleEditClick: (row: OrderReceiveRow) => void,
  handlePaymentDetailsClick: (row: OrderReceiveRow) => void,
  handleSaveClick: (row: OrderReceiveRow) => void,
  handleCancelClick: () => void,
  validateInlineEditing: () => boolean
): TableColumn<OrderReceiveRow>[] => [
  {
    key: "reNo",
    header: ORDER_RECEIVE_TABLE_HEADERS.RECEIPT_NUMBER,
    render: (row) => (
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0.125rem',
        minHeight: '1.5rem',
        width: '100%',
        position: 'relative'
      }}>
        <VisibilityIcon
          sx={{
            fontSize: ORDER_RECEIVE_CONSTANTS.ICONS.RECEIPT_VIEW_SIZE,
            color: ORDER_RECEIVE_CONSTANTS.ICONS.MUTED_COLOR,
            cursor: 'pointer',
            padding: '0.125rem',
            borderRadius: '0.25rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              color: ORDER_RECEIVE_CONSTANTS.ICONS.MUTED_COLOR
            }
          }}
          onClick={() => handleViewDetailsClick(row)}
        />
        <span style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {row.reNo}
        </span>
      </Box>
    )
  },
  {
    key: "poNo",
    header: ORDER_RECEIVE_TABLE_HEADERS.PO_NUMBER,
    render: (row) => (
      editingRowId === row.reNo ? (
        <input
          type="text"
          value={editingDraft?.poNo ?? ''}
          onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, poNo: e.target.value } : prev))}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      ) : (
        <span>{row.poNo}</span>
      )
    )
  },
  {
    key: "supplier",
    header: ORDER_RECEIVE_TABLE_HEADERS.SUPPLIER_NAME,
    render: (row) => (
      <span>{row.supplier}</span>
    )
  },
  {
    key: "received",
    header: ORDER_RECEIVE_TABLE_HEADERS.RECEIVED_ON,
    render: (row) => (
      editingRowId === row.reNo ? (
        <input
          type="text"
          value={editingDraft?.received ?? ''}
          onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, received: e.target.value } : prev))}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      ) : (
        <span>{row.received}</span>
      )
    )
  },
  {
    key: "reBy",
    header: ORDER_RECEIVE_TABLE_HEADERS.CREATED_BY,
    render: (row) => (
      editingRowId === row.reNo ? (
        <input
          type="text"
          value={editingDraft?.reBy ?? ''}
          onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, reBy: e.target.value } : prev))}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      ) : (
        <span>{capitalizeFirstLetter(row.reBy)}</span>
      )
    )
  },
  {
    key: "amt",
    header: ORDER_RECEIVE_TABLE_HEADERS.TOTAL_AMOUNT,
    render: (row) => (
      editingRowId === row.reNo ? (
        <input
          type="number"
          value={editingDraft?.amt ?? 0}
          onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, amt: Number(e.target.value) } : prev))}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      ) : (
        <span>{row.amt}</span>
      )
    )
  },
  {
    key: "amountPaid",
    header: ORDER_RECEIVE_TABLE_HEADERS.AMOUNT_PAID,
    sortable: true,
    render: (row) => (
      <span>{row.amountPaid !== undefined && row.amountPaid > 0 ? row.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
    )
  },
  {
    key: "pendingAmount",
    header: ORDER_RECEIVE_TABLE_HEADERS.PENDING_AMOUNT,
    sortable: true,
    render: (row) => (
      <span>{row.pendingAmount !== undefined && row.pendingAmount > 0 ? row.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
    )
  },
  {
    key: "creditAvailable",
    header: "Credit available for supplier (₹)",
    headerRender: () => (
      <Tooltip title="Credit available for the supplier" arrow placement="top">
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          lineHeight: 1.2,
          cursor: 'help',
          whiteSpace: 'pre-line'
        }}>
          <span>Credit available</span>
          <span>for supplier (₹)</span>
        </Box>
      </Tooltip>
    ),
    sortable: true,
    render: (row) => (
      <span>{row.creditAvailable !== undefined && row.creditAvailable > 0 ? row.creditAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
    )
  },
  {
    key: "invoice_attachment",
    header: ORDER_RECEIVE_TABLE_HEADERS.INVOICE_ATTACHMENT,
    headerRender: () => (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        lineHeight: 1.2
      }}>
        <span>Invoice</span>
        <span>Attachment</span>
      </Box>
    ),
    render: (row) => <InvoiceAttachment row={row} />
  },
  {
    key: "actions",
    header: ORDER_RECEIVE_TABLE_HEADERS.ACTIONS,
    sortable: false,
    columnWidth: "12%",
    render: (row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {editingRowId === row.reNo ? (
          <Box sx={{ display: 'flex', gap: '0.75rem' }}>
            <Box
              onClick={() => validateInlineEditing() ? handleSaveClick(row) : null}
              sx={{
                cursor: validateInlineEditing() ? 'pointer' : 'not-allowed',
                color: validateInlineEditing() ? ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR : '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: validateInlineEditing() ? 1 : 0.5
              }}
            >
              <TickMarkIcon />
            </Box>
            <CloseIcon
              sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer' }}
              onClick={() => handleCancelClick()}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '60px' }}>
            <EditIcon
              sx={{ color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR, cursor: 'pointer', fontSize: 18, flexShrink: 0 }}
              onClick={() => handleEditClick(row)}
            />
            <Typography
              onClick={() => handlePaymentDetailsClick(row)}
              sx={{
                color: ORDER_RECEIVE_CONSTANTS.ICONS.DEFAULT_COLOR,
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': {
                  opacity: 0.7
                }
              }}
            >
              ₹
            </Typography>
          </Box>
        )}
      </Box>
    )
  }
];

export const getPurchaseOrderColumns = (
  handlePurchaseOrderClick: (row: PurchaseOrderRow) => void
): TableColumn<PurchaseOrderRow>[] => [
  {
    key: "reNo",
    header: PURCHASE_ORDER_TABLE_HEADERS.RECEIPT_NUMBER,
    render: (row) => <span>RA{row.receiptId}</span>
  },
  {
    key: "poNo",
    header: PURCHASE_ORDER_TABLE_HEADERS.PO_NUMBER,
    render: (row) => (
      <span
        style={{ cursor: 'pointer' }}
        onClick={() => handlePurchaseOrderClick(row)}
      >
        {row.poNo}
      </span>
    )
  },
  {
    key: "orderedDate",
    header: PURCHASE_ORDER_TABLE_HEADERS.ORDERED_DATE,
    render: (row) => <span>{row.orderedDate}</span>
  },
  {
    key: "supplier",
    header: PURCHASE_ORDER_TABLE_HEADERS.SUPPLIER_NAME,
    render: (row) => <span>{row.supplier}</span>
  },
  {
    key: "totalAmount",
    header: PURCHASE_ORDER_TABLE_HEADERS.TOTAL_AMOUNT,
    render: (row) => <span>{row.totalAmount}</span>
  },
  {
    key: "status",
    header: PURCHASE_ORDER_TABLE_HEADERS.STATUS,
    render: (row) => <span>{row.status}</span>
  },
  {
    key: "createdBy",
    header: PURCHASE_ORDER_TABLE_HEADERS.CREATED_BY,
    render: (row) => <span>{capitalizeFirstLetter(row.createdBy || 'System')}</span>
  }
];
