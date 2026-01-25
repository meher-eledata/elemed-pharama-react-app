import React, { Dispatch, SetStateAction } from 'react';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { TableColumn } from '../../components/PharmaTable';
import { SalesReceiptItem } from './SalesReceipt.types';
import DeleteNewIcon from '../../assets/DeleteNew.svg';
import { SALES_RECEIPT_LABELS } from '../../config/label/SalesReceipt.labels';
import { recalculateSalesItemAmount } from './SalesReceipt.utils.calculation';

interface GetTableColumnsParams {
  editingRowId: string | null;
  applyGstToAll: boolean;
  setSalesItems: Dispatch<SetStateAction<SalesReceiptItem[]>>;
  handleEditClick: (itemId: string) => void;
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  handleDeleteClick: (itemId?: string) => void;
  isReturnDetailsMode?: boolean;
}

export const getTableColumns = ({
  editingRowId,
  applyGstToAll,
  setSalesItems,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  handleDeleteClick,
  isReturnDetailsMode = false,
}: GetTableColumnsParams): TableColumn<SalesReceiptItem>[] => [
    {
      key: 'productName',
      header: SALES_RECEIPT_LABELS.TABLE_HEADER_PRODUCT,
      sortable: true,
      render: (item) => (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
          {item.productName}
        </Typography>
      )
    },
    {
      key: 'quantity',
      header: SALES_RECEIPT_LABELS.TABLE_HEADER_QUANTITY,
      render: (item) => (
        (isReturnDetailsMode || editingRowId !== item.id) ? (
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
            {Math.floor(parseFloat(item.quantity || '0'))}
          </Typography>
        ) : (
          <Box sx={{ overflow: 'visible', display: 'inline-block' }}>
            <TextField
              value={item.quantity}
              onChange={(e) => {
                setSalesItems(prev => prev.map(product => {
                  if (product.id === item.id) {
                    const updated = { ...product, quantity: e.target.value };
                    return recalculateSalesItemAmount(updated);
                  }
                  return product;
                }));
              }}
              disabled={!item.productName || item.productName.trim() === ''}
              size="small"
              sx={{
                width: 80,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '32px',
                  '&:hover fieldset': {
                    borderColor: '#5C17E5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '8px 12px',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                },
                '& .MuiInputBase-root': {
                  overflow: 'visible',
                },
              }}
            />
          </Box>
        )
      )
    },
    {
      key: 'batch',
      header: SALES_RECEIPT_LABELS.TABLE_HEADER_BATCH,
      render: (item) => (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
          {item.batch}
        </Typography>
      )
    },
    {
      key: 'unitPrice',
      header: SALES_RECEIPT_LABELS.TABLE_HEADER_UNIT_PRICE,
      render: (item) => (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
          {Math.floor(parseFloat(item.unitPrice || '0'))}
        </Typography>
      )
    },
    {
      key: 'discount',
      header: SALES_RECEIPT_LABELS.TABLE_HEADER_DISC,
      render: (item) => (
        (isReturnDetailsMode || editingRowId !== item.id) ? (
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
            {item.discountPercent}
          </Typography>
        ) : (
          <Box sx={{ overflow: 'visible', display: 'inline-block' }}>
            <TextField
              value={item.discountPercent}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setSalesItems(prev => prev.map(product => {
                  if (product.id === item.id) {
                    const updated = {
                      ...product,
                      discountPercent: Math.max(0, Math.min(100, value)).toString()
                    };
                    return recalculateSalesItemAmount(updated);
                  }
                  return product;
                }));
              }}
              disabled={!item.productName || item.productName.trim() === ''}
              size="small"
              type="number"
              inputProps={{ min: 0, max: 100, style: { textAlign: 'center' } }}
              sx={{
                width: 70,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '32px',
                  '&:hover fieldset': {
                    borderColor: '#5C17E5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '8px 12px',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                },
                '& .MuiInputBase-root': {
                  overflow: 'visible',
                },
              }}
            />
          </Box>
        )
      )
    },
    {
      key: 'cgst',
      header: `${SALES_RECEIPT_LABELS.TABLE_HEADER_CGST} (%)`,
      render: (item) => (
        (isReturnDetailsMode || editingRowId !== item.id) ? (
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
            {item.cgstPercent}
          </Typography>
        ) : (
          <Box sx={{ overflow: 'visible', display: 'inline-block' }}>
            <TextField
              value={item.cgstPercent}
              onChange={(e) => {
                setSalesItems(prev => prev.map(product => {
                  if (product.id === item.id) {
                    const updated = { ...product, cgstPercent: e.target.value };
                    return recalculateSalesItemAmount(updated);
                  }
                  return product;
                }));
              }}
              disabled={!item.productName || item.productName.trim() === ''}
              size="small"
              sx={{
                width: 70,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '32px',
                  '&:hover fieldset': {
                    borderColor: '#5C17E5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '8px 12px',
                  fontSize: '14px',
                },
              }}
            />
          </Box>
        )
      )
    },
    {
      key: 'sgst',
      header: `${SALES_RECEIPT_LABELS.TABLE_HEADER_SGST} (%)`,
      render: (item) => (
        (isReturnDetailsMode || editingRowId !== item.id) ? (
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
            {item.sgstPercent}
          </Typography>
        ) : (
          <Box sx={{ overflow: 'visible', display: 'inline-block' }}>
            <TextField
              value={item.sgstPercent}
              onChange={(e) => {
                setSalesItems(prev => prev.map(product => {
                  if (product.id === item.id) {
                    const updated = { ...product, sgstPercent: e.target.value };
                    return recalculateSalesItemAmount(updated);
                  }
                  return product;
                }));
              }}
              disabled={!item.productName || item.productName.trim() === ''}
              size="small"
              sx={{
                width: 70,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '32px',
                  '&:hover fieldset': {
                    borderColor: '#5C17E5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '8px 12px',
                  fontSize: '14px',
                },
              }}
            />
          </Box>
        )
      )
    },
    {
      key: 'igst',
      header: `${SALES_RECEIPT_LABELS.TABLE_HEADER_IGST} (%)`,
      render: (item) => (
        (isReturnDetailsMode || editingRowId !== item.id) ? (
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
            {item.igstPercent}
          </Typography>
        ) : (
          <Box sx={{ overflow: 'visible', display: 'inline-block' }}>
            <TextField
              value={item.igstPercent}
              onChange={(e) => {
                setSalesItems(prev => prev.map(product => {
                  if (product.id === item.id) {
                    const updated = { ...product, igstPercent: e.target.value };
                    return recalculateSalesItemAmount(updated);
                  }
                  return product;
                }));
              }}
              disabled={!item.productName || item.productName.trim() === ''}
              size="small"
              sx={{
                width: 70,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: '32px',
                  '&:hover fieldset': {
                    borderColor: '#5C17E5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5C17E5',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '8px 12px',
                  fontSize: '14px',
                },
              }}
            />
          </Box>
        )
      )
    },
    {
      key: 'amount',
      header: SALES_RECEIPT_LABELS.TABLE_HEADER_AMOUNT,
      render: (item) => (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'nowrap' }}>
          ₹{item.amount}
        </Typography>
      )
    },
    {
      key: isReturnDetailsMode ? 'returnStatus' : 'actions',
      header: isReturnDetailsMode ? 'Return Status' : SALES_RECEIPT_LABELS.TABLE_HEADER_ACTIONS,
      sortable: false,
      render: (item) => {
        if (isReturnDetailsMode) {
          // Return Status column for return details mode
          const originalQty = item.original_quantity || parseFloat(item.quantity) || 0;
          const returnedQty = item.returned_quantity || 0;
          const statusText = returnedQty === 0
            ? '0 return'
            : `${returnedQty} out of ${originalQty} return`;

          return (
            <Typography sx={{
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#1A212B'
            }}>
              {statusText}
            </Typography>
          );
        }

        // Actions column for normal/edit mode
        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start', pl: 1 }}>
            {editingRowId === item.id ? (
              <>
                <IconButton
                  size="small"
                  onClick={handleSaveClick}
                  sx={{
                    padding: '4px',
                    color: '#000000',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#000000'
                    }
                  }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleCancelClick}
                  sx={{
                    padding: '4px',
                    color: '#000000',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#000000'
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton
                  size="small"
                  onClick={() => handleEditClick(item.id)}
                  sx={{
                    padding: '4px',
                    color: '#6B7280',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#6B7280'
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(item.id)}
                  sx={{
                    padding: '4px',
                    color: '#6B7280',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#6B7280'
                    }
                  }}
                >
                  <img
                    src={DeleteNewIcon}
                    alt="Delete"
                    style={{
                      width: '16px',
                      height: '16px',
                      filter: 'brightness(0) saturate(100%) invert(45%) sepia(8%) saturate(1038%) hue-rotate(185deg) brightness(95%) contrast(86%)'
                    }}
                  />
                </IconButton>
              </>
            )}
          </Box>
        );
      }
    }
  ];

