import React, { Dispatch, SetStateAction } from 'react';
import { Box, TextField, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { TableColumn } from '../../components/PharmaTable';
import { Product } from './SalesPage.types';
import { SALES_PAGE_CONSTANTS } from '../../config/constants/SalesPage.constants';
import DeleteNewIcon from '../../assets/DeleteNew.svg';
import { AppDispatch } from '../../redux/store';
import { updateItemDetails } from '../../redux/slices/cartSlice';

interface GetTableColumnsParams {
  editingRowId: string | null;
  selectedItems: string[];
  dispatch: AppDispatch;
  handleEditClick: (productId: string) => void;
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  handleDeleteClick: (productId?: string) => void;
}

export const getTableColumns = ({
  editingRowId,
  selectedItems,
  dispatch,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  handleDeleteClick,
}: GetTableColumnsParams): TableColumn<Product>[] => [
  {
    key: "checkbox",
    header: "", 
    sortable: false, 
  },
  { 
    key: "name", 
    header: "Product", 
    render: (item) => item.name 
  },
  { 
    key: "avlQty", 
    header: "Qty", 
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.avlQty}
          onChange={(e) => {
            dispatch(updateItemDetails({
              id: item.id,
              updates: { avlQty: e.target.value }
            }));
          }}
          size="small"
          sx={{ 
            width: 100,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              height: '32px',
              '&:hover fieldset': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
              '&.Mui-focused fieldset': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
            },
          }}
        />
      ) : (
        item.avlQty
      )
    )
  },
  { 
    key: "batch", 
    header: "Batch", 
    render: (item) => item.batch 
  },
  { 
    key: "mrp", 
    header: "MRP", 
    render: (item) => item.mrp 
  },
  { 
    key: "sp", 
    header: "SP", 
    render: (item) => item.sp 
  },
  { 
    key: "expiry", 
    header: "Expiry", 
    render: (item) => item.expiry 
  },
  { 
    key: "type", 
    header: "Type", 
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.type}
          onChange={(e) => {
            dispatch(updateItemDetails({
              id: item.id,
              updates: { type: e.target.value }
            }));
          }}
          size="small"
          sx={{ 
            width: 100,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              height: '32px',
              '&:hover fieldset': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
              '&.Mui-focused fieldset': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
            },
          }}
        />
      ) : (
        item.type
      )
    )
  },
  { 
    key: "discount", 
    header: "Disc %", 
    render: (item) => (
      editingRowId === item.id ? (
        <TextField
          value={item.discount}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            dispatch(updateItemDetails({
              id: item.id,
              updates: { discount: Math.max(0, Math.min(100, value)) }
            }));
          }}
          size="small"
          type="number"
          inputProps={{ min: 0, max: 100, style: { textAlign: 'center' } }}
          sx={{ 
            width: 80,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              height: '32px',
              '&:hover fieldset': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
              '&.Mui-focused fieldset': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
            },
          }}
        />
      ) : (
        item.discount
      )
    )
  },
  {
    key: "actions",
    header: "Actions",
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
                color: SALES_PAGE_CONSTANTS.GRAY_TEXT_COLOR,
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: SALES_PAGE_CONSTANTS.PRIMARY_COLOR
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <Tooltip 
              title={
                selectedItems.length > 1 
                  ? `Delete this item (${selectedItems.length} items selected)` 
                  : "Delete this item"
              }
              arrow
            >
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(item.id)}
                sx={{ 
                  padding: '4px',
                  color: selectedItems.includes(item.id) && selectedItems.length > 1 
                    ? '#EF4444' 
                    : SALES_PAGE_CONSTANTS.GRAY_TEXT_COLOR,
                  backgroundColor: selectedItems.includes(item.id) && selectedItems.length > 1 
                    ? '#FEF2F2' 
                    : 'transparent',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: selectedItems.includes(item.id) && selectedItems.length > 1 
                      ? '#FEE2E2' 
                      : 'transparent',
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
                    filter: selectedItems.includes(item.id) && selectedItems.length > 1 
                      ? 'none' 
                      : 'brightness(0) saturate(100%) invert(45%) sepia(8%) saturate(1038%) hue-rotate(185deg) brightness(95%) contrast(86%)'
                  }} 
                />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    )
  },
];

