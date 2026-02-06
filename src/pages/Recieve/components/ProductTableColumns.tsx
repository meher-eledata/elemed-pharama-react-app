import React from "react";
import { Box, TextField, IconButton, Tooltip } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CloseIcon from "@mui/icons-material/Close";
import dayjs, { Dayjs } from "dayjs";
import { TableColumn } from "../../../components/PharmaTable";
import { PharmaTableRow } from "../types";
import { PharmaDatePicker } from "../../../components/Common";
import { orderLabels } from "../../../config/label/OrderDetail.labels";
import { orderDetailsStyles, TickMarkIcon } from "../styles";

interface ProductTableColumnsParams {
  editingRowId: string | null;
  editingData: Partial<PharmaTableRow>;
  updateEditingData: (field: keyof PharmaTableRow, value: any) => void;
  startEditing: (row: PharmaTableRow) => void;
  saveRow: () => void;
  cancelEditing: () => void;
  deleteRow: (rowId: string) => void;
}

export const getProductTableColumns = ({
  editingRowId,
  editingData,
  updateEditingData,
  startEditing,
  saveRow,
  cancelEditing,
  deleteRow,
}: ProductTableColumnsParams): TableColumn<PharmaTableRow>[] => {
  const inputFieldStyles = orderDetailsStyles.tableInputField;
  const numberInputStyles = orderDetailsStyles.tableNumberInput;

  const calculateAmount = (row: PharmaTableRow, data: Partial<PharmaTableRow> = {}) => {
    const unitPrice = typeof data.pp === 'number' ? data.pp : (typeof row.pp === 'number' ? row.pp : 0);
    const qty = data.qtyReceived !== undefined ? data.qtyReceived : (row.qtyReceived || 0);
    const cgst = typeof data.cgst === 'number' ? data.cgst : (typeof row.cgst === 'number' ? row.cgst : 0);
    const sgst = typeof data.sgst === 'number' ? data.sgst : (typeof row.sgst === 'number' ? row.sgst : 0);
    const igst = typeof data.igst === 'number' ? data.igst : (typeof row.igst === 'number' ? row.igst : 0);
    const discount = typeof data.disc === 'number' ? data.disc : (typeof row.disc === 'number' ? row.disc : 0);

    const baseAmount = unitPrice * qty;
    const discountAmount = baseAmount * (discount / 100);
    const amountAfterDiscount = baseAmount - discountAmount;
    // Calculate taxes based on base amount (pre-discount) for consistency across the app
    const taxAmount = baseAmount * ((cgst + sgst + igst) / 100);
    return amountAfterDiscount + taxAmount;
  };

  return [
    {
      key: "productId",
      header: orderLabels.productName,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            value={editingData.productId || ""}
            onChange={(e) => updateEditingData("productId", e.target.value)}
            variant="outlined"
            fullWidth
            sx={inputFieldStyles}
          />
        ) : (
          <Tooltip title={row.productId} arrow placement="top">
            <span style={{
              display: 'inline-block',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'help'
            }}>
              {row.productId}
            </span>
          </Tooltip>
        )
      ),
    },
    {
      key: "batchNumber",
      header: orderLabels.batchNumber,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            value={editingData.batchNumber || ""}
            onChange={(e) => {
              const value = e.target.value;
              const alphanumericValue = value.replace(/[^A-Za-z0-9]/g, '');
              if (alphanumericValue.length <= 8) {
                updateEditingData("batchNumber", alphanumericValue);
              }
            }}
            variant="outlined"
            fullWidth
            inputProps={{ maxLength: 8, pattern: '[A-Za-z0-9]*' }}
            sx={inputFieldStyles}
          />
        ) : (
          <span>{row.batchNumber || '-'}</span>
        )
      ),
    },
    {
      key: "qtyReceived",
      header: orderLabels.receivedQty,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.qtyReceived || ""}
            onChange={(e) => updateEditingData("qtyReceived", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.qtyReceived}</span>
        )
      ),
    },
    {
      key: "qtyFree",
      header: orderLabels.freeQty,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.qtyFree || ""}
            onChange={(e) => updateEditingData("qtyFree", Number(e.target.value))}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.qtyFree}</span>
        )
      ),
    },
    {
      key: "expiryDate",
      header: orderLabels.expiryDate,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <PharmaDatePicker
              value={
                'expiryDate' in editingData
                  ? editingData.expiryDate ?? null
                  : row.expiryDate ?? null
              }
              onChange={(newValue: Dayjs | null) => {
                updateEditingData("expiryDate", newValue);
              }}
              minDate={dayjs().startOf('day')}
              placeholder="MM/DD/YYYY"
              width="100%"
              height={32}
            />
          </Box>
        ) : (
          <span>{row.expiryDate && dayjs.isDayjs(row.expiryDate) && row.expiryDate.isValid() ? row.expiryDate.format('DD/MM/YYYY') : '-'}</span>
        )
      ),
    },
    {
      key: "pp",
      header: orderLabels.unitPrice,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <TextField
              size="small"
              type="number"
              value={editingData.pp || ""}
              onChange={(e) => updateEditingData("pp", Number(e.target.value))}
              variant="outlined"
              fullWidth
              sx={{ ...numberInputStyles, width: '100%', maxWidth: '100%' }}
            />
          </Box>
        ) : (
          <span>{row.pp}</span>
        )
      ),
    },
    {
      key: "cgst",
      header: `${orderLabels.cgst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.cgst !== undefined ? ((editingData.cgst as any) === "" || editingData.cgst === null ? "" : Number(editingData.cgst)) : (row.cgst || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("cgst", val === "" ? ("" as any) : Number(val) || 0);
            }}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.cgst}</span>
        )
      ),
    },
    {
      key: "sgst",
      header: `${orderLabels.sgst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.sgst !== undefined ? ((editingData.sgst as any) === "" || editingData.sgst === null ? "" : Number(editingData.sgst)) : (row.sgst || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("sgst", val === "" ? ("" as any) : Number(val) || 0);
            }}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.sgst}</span>
        )
      ),
    },
    {
      key: "igst",
      header: `${orderLabels.igst} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.igst !== undefined ? (String(editingData.igst) === "" || editingData.igst === null ? "" : Number(editingData.igst)) : (row.igst || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("igst", val === "" ? ("" as any) : Number(val) || 0);
            }}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.igst}</span>
        )
      ),
    },
    {
      key: "disc",
      header: `${orderLabels.discount} (%)`,
      sortable: false,
      render: (row) => (
        editingRowId === row.id ? (
          <TextField
            size="small"
            type="number"
            value={editingData.disc !== undefined ? ((editingData.disc as any) === "" || editingData.disc === null ? "" : Number(editingData.disc)) : (row.disc || "")}
            onChange={(e) => {
              const val = e.target.value;
              updateEditingData("disc", val === "" ? ("" as any) : Number(val) || 0);
            }}
            variant="outlined"
            fullWidth
            sx={numberInputStyles}
          />
        ) : (
          <span>{row.disc}</span>
        )
      ),
    },
    {
      key: "amount",
      header: "Amount (₹)",
      sortable: false,
      render: (row) => {
        if (editingRowId === row.id) {
          const defaultAmount = calculateAmount(row, editingData);
          const amountValue = editingData.amount !== undefined
            ? ((editingData.amount as any) === "" || editingData.amount === null ? "" : Number(editingData.amount))
            : defaultAmount;

          return (
            <TextField
              size="small"
              type="number"
              value={amountValue}
              onChange={(e) => {
                const val = e.target.value;
                updateEditingData("amount" as keyof PharmaTableRow, val === "" ? ("" as any) : Number(val) || 0);
              }}
              variant="outlined"
              fullWidth
              sx={numberInputStyles}
            />
          );
        } else {
          const rowTotal = (row as any).amount !== undefined && (row as any).amount !== null
            ? parseFloat(String((row as any).amount))
            : calculateAmount(row, {});

          return (
            <span>
              ₹{Math.round(rowTotal).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          );
        }
      },
    },
    {
      key: "actions",
      header: orderLabels.actions,
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', marginRight: '10px' }}>
          {editingRowId === row.id ? (
            <>
              <IconButton
                size="small"
                onClick={saveRow}
                sx={{
                  padding: '4px',
                  color: '#10B981',
                  '&:hover': { backgroundColor: 'transparent', color: '#059669' }
                }}
              >
                <TickMarkIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={cancelEditing}
                sx={{
                  padding: '4px',
                  color: '#EF4444',
                  '&:hover': { backgroundColor: 'transparent', color: '#DC2626' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={() => startEditing(row)}
                sx={{
                  padding: '4px',
                  color: '#6B7280',
                  '&:hover': { backgroundColor: 'transparent', color: '#374151' }
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => deleteRow(row.id!)}
                sx={{
                  padding: '4px',
                  color: '#6B7280',
                  '&:hover': { backgroundColor: 'transparent', color: '#374151' }
                }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      ),
    },
  ];
};
