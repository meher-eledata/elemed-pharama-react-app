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
}

export const getTableColumns = ({
  editingRowId,
  applyGstToAll,
  setSalesItems,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  handleDeleteClick,
}: GetTableColumnsParams): TableColumn<SalesReceiptItem>[] => [
  {
    key: 'productName',
    header: SALES_RECEIPT_LABELS.TABLE_HEADER_PRODUCT,
    sortable: true,
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.productName}
          onChange={(e) => {
            setSalesItems(prev => prev.map(product => 
              product.id === item.id ? { ...product, productName: e.target.value } : product
            ));
          }}
          size="small"
          sx={{ 
            width: 150,
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.productName}
        </Typography>
      )
    )
  },
  {
    key: 'quantity',
    header: SALES_RECEIPT_LABELS.TABLE_HEADER_QUANTITY,
    render: (item) => (
      editingRowId === item.id ? (
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.quantity}
        </Typography>
      )
    )
  },
  {
    key: 'batch',
    header: SALES_RECEIPT_LABELS.TABLE_HEADER_BATCH,
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.batch}
          onChange={(e) => {
            setSalesItems(prev => prev.map(product => 
              product.id === item.id ? { ...product, batch: e.target.value } : product
            ));
          }}
          size="small"
          sx={{ 
            width: 100,
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.batch}
        </Typography>
      )
    )
  },
  {
    key: 'unitPrice',
    header: SALES_RECEIPT_LABELS.TABLE_HEADER_UNIT_PRICE,
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.unitPrice}
          onChange={(e) => {
            setSalesItems(prev => prev.map(product => {
              if (product.id === item.id) {
                const updated = { ...product, unitPrice: e.target.value };
                return recalculateSalesItemAmount(updated);
              }
              return product;
            }));
          }}
          size="small"
          type="number"
          sx={{ 
            width: 100,
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.unitPrice}
        </Typography>
      )
    )
  },
  {
    key: 'discount',
    header: SALES_RECEIPT_LABELS.TABLE_HEADER_DISC,
    render: (item) => (
      editingRowId === item.id ? (
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.discountPercent}%
        </Typography>
      )
    )
  },
  {
    key: 'cgst',
    header: `${SALES_RECEIPT_LABELS.TABLE_HEADER_CGST} (%)`,
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.cgstPercent}
          onChange={(e) => {
            const newCgstPercent = e.target.value;
            
            if (applyGstToAll) {
              // Update first row and apply to ALL products at once
              setSalesItems(prev => {
                return prev.map(product => {
                  const updated = { ...product, cgstPercent: newCgstPercent };
                  return recalculateSalesItemAmount(updated);
                });
              });
            } else {
              // Only update the current item
              setSalesItems(prev => prev.map(product => {
                if (product.id === item.id) {
                  const updated = { ...product, cgstPercent: newCgstPercent };
                  return recalculateSalesItemAmount(updated);
                }
                return product;
              }));
            }
          }}
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.cgstPercent}
        </Typography>
      )
    )
  },
  {
    key: 'sgst',
    header: `${SALES_RECEIPT_LABELS.TABLE_HEADER_SGST} (%)`,
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.sgstPercent}
          onChange={(e) => {
            const newSgstPercent = e.target.value;
            
            if (applyGstToAll) {
              // Update first row and apply to ALL products at once
              setSalesItems(prev => {
                return prev.map(product => {
                  const updated = { ...product, sgstPercent: newSgstPercent };
                  return recalculateSalesItemAmount(updated);
                });
              });
            } else {
              // Only update the current item
              setSalesItems(prev => prev.map(product => {
                if (product.id === item.id) {
                  const updated = { ...product, sgstPercent: newSgstPercent };
                  return recalculateSalesItemAmount(updated);
                }
                return product;
              }));
            }
          }}
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.sgstPercent}
        </Typography>
      )
    )
  },
  {
    key: 'igst',
    header: `${SALES_RECEIPT_LABELS.TABLE_HEADER_IGST} (%)`,
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.igstPercent}
          onChange={(e) => {
            const newIgstPercent = e.target.value;
            
            if (applyGstToAll) {
              // Update first row and apply to ALL products at once
              setSalesItems(prev => {
                return prev.map(product => {
                  const updated = { ...product, igstPercent: newIgstPercent };
                  return recalculateSalesItemAmount(updated);
                });
              });
            } else {
              // Only update the current item
              setSalesItems(prev => prev.map(product => {
                if (product.id === item.id) {
                  const updated = { ...product, igstPercent: newIgstPercent };
                  return recalculateSalesItemAmount(updated);
                }
                return product;
              }));
            }
          }}
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          {item.igstPercent}
        </Typography>
      )
    )
  },
  {
    key: 'amount',
    header: SALES_RECEIPT_LABELS.TABLE_HEADER_AMOUNT,
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.amount}
          onChange={(e) => {
            setSalesItems(prev => prev.map(product => 
              product.id === item.id ? { ...product, amount: e.target.value } : product
            ));
          }}
          size="small"
          type="number"
          sx={{ 
            width: 100,
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
          }}
        />
      ) : (
        <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#1A212B' }}>
          ₹{item.amount}
        </Typography>
      )
    )
  },
  {
    key: 'actions',
    header: SALES_RECEIPT_LABELS.TABLE_HEADER_ACTIONS,
    sortable: false,
    render: (item) => (
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
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
    )
  }
];

