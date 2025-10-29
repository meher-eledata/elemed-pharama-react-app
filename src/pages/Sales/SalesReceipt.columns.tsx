import React, { Dispatch, SetStateAction } from 'react';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { TableColumn } from '../../components/PharmaTable';
import { SalesReceiptItem } from './SalesReceipt.types';
import DeleteNewIcon from '../../assets/DeleteNew.svg';

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
    header: 'Product',
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
    header: 'Qty',
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.quantity}
          onChange={(e) => {
            setSalesItems(prev => prev.map(product => 
              product.id === item.id ? { ...product, quantity: e.target.value } : product
            ));
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
    key: 'type',
    header: 'Type',
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.type}
          onChange={(e) => {
            setSalesItems(prev => prev.map(product => 
              product.id === item.id ? { ...product, type: e.target.value } : product
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
          {item.type}
        </Typography>
      )
    )
  },
  {
    key: 'batch',
    header: 'Batch',
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
    header: 'Price',
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.unitPrice}
          onChange={(e) => {
            setSalesItems(prev => prev.map(product => 
              product.id === item.id ? { ...product, unitPrice: e.target.value } : product
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
          {item.unitPrice}
        </Typography>
      )
    )
  },
  {
    key: 'discount',
    header: 'Disc',
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.discountPercent}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            setSalesItems(prev => prev.map(product => 
              product.id === item.id ? { 
                ...product, 
                discountPercent: Math.max(0, Math.min(100, value)).toString() 
              } : product
            ));
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
    header: 'CGST (%)',
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.cgstPercent}
          onChange={(e) => {
            const newCgstPercent = e.target.value;
            
            if (applyGstToAll) {
              // Update first row and apply to ALL products at once
              setSalesItems(prev => {
                const updated = [...prev];
                // Update the first row's value
                if (updated.length > 0) {
                  updated[0] = { ...updated[0], cgstPercent: newCgstPercent };
                }
                // Apply first row's value to all products
                return updated.map(product => ({
                  ...product,
                  cgstPercent: newCgstPercent,
                  cgst: (parseFloat(product.amount) * parseFloat(newCgstPercent || '0') / 100).toFixed(2),
                }));
              });
            } else {
              // Only update the current item
              setSalesItems(prev => prev.map(product => 
                product.id === item.id ? { ...product, cgstPercent: newCgstPercent } : product
              ));
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
    header: 'SGST (%)',
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.sgstPercent}
          onChange={(e) => {
            const newSgstPercent = e.target.value;
            
            if (applyGstToAll) {
              // Update first row and apply to ALL products at once
              setSalesItems(prev => {
                const updated = [...prev];
                // Update the first row's value
                if (updated.length > 0) {
                  updated[0] = { ...updated[0], sgstPercent: newSgstPercent };
                }
                // Apply first row's value to all products
                return updated.map(product => ({
                  ...product,
                  sgstPercent: newSgstPercent,
                  sgst: (parseFloat(product.amount) * parseFloat(newSgstPercent || '0') / 100).toFixed(2),
                }));
              });
            } else {
              // Only update the current item
              setSalesItems(prev => prev.map(product => 
                product.id === item.id ? { ...product, sgstPercent: newSgstPercent } : product
              ));
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
    header: 'IGST (%)',
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.igstPercent}
          onChange={(e) => {
            const newIgstPercent = e.target.value;
            
            if (applyGstToAll) {
              // Update first row and apply to ALL products at once
              setSalesItems(prev => {
                const updated = [...prev];
                // Update the first row's value
                if (updated.length > 0) {
                  updated[0] = { ...updated[0], igstPercent: newIgstPercent };
                }
                // Apply first row's value to all products
                return updated.map(product => ({
                  ...product,
                  igstPercent: newIgstPercent,
                  igst: (parseFloat(product.amount) * parseFloat(newIgstPercent || '0') / 100).toFixed(2),
                }));
              });
            } else {
              // Only update the current item
              setSalesItems(prev => prev.map(product => 
                product.id === item.id ? { ...product, igstPercent: newIgstPercent } : product
              ));
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
    header: 'Amt (₹)',
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
          {item.amount}
        </Typography>
      )
    )
  },
  {
    key: 'actions',
    header: 'Actions',
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
                  color: '#5C17E5'
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
                  color: '#EF4444'
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

