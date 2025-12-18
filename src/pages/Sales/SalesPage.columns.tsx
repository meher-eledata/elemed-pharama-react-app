import React, { useState } from 'react';
import { Box, TextField, IconButton, Tooltip, Select, MenuItem, FormControl, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { TableColumn } from '../../components/PharmaTable';
import { Product } from './SalesPage.types';
import { SALES_PAGE_CONSTANTS } from '../../config/constants/SalesPage.constants';
import DeleteNewIcon from '../../assets/DeleteNew.svg';
import { AppDispatch } from '../../redux/store';
import { updateItemDetails } from '../../redux/slices/cartSlice';
import { useGetDoctorsQuery } from '../../redux/slices/salesApi';

interface GetTableColumnsParams {
  editingRowId: string | null;
  selectedItems: string[];
  dispatch: AppDispatch;
  handleEditClick: (productId: string) => void;
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  handleDeleteClick: (productId?: string) => void;
  apiProducts: any[];
}

// Discount Field Component with Authorization
const DiscountField: React.FC<{
  item: Product;
  dispatch: AppDispatch;
  isEditing: boolean;
}> = ({ item, dispatch, isEditing }) => {
  // Note: get-doctors endpoint returns 404, so we skip this query
  // For now, we'll work with doctor names only - ID will be undefined
  const { data: doctors = [], isLoading: isLoadingDoctors } = useGetDoctorsQuery(undefined, { skip: true });

  if (!isEditing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <span>{item.discount}%</span>
        {item.discount >= 1 && item.discountAuthorizedBy && (
          <span style={{ fontSize: '11px', color: '#728197' }}>
            Auth: {item.discountAuthorizedBy}
          </span>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
      <TextField
        value={item.discount}
        onChange={(e) => {
          const value = parseInt(e.target.value) || 0;
              dispatch(updateItemDetails({
                id: item.id,
                updates: { 
                  discount: Math.max(0, Math.min(100, value)),
                  // Clear discountAuthorizedBy and discountAuthorizedById if discount is set to 0
                  ...(value < 1 && { 
                    discountAuthorizedBy: undefined,
                    discountAuthorizedById: undefined
                  })
                }
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
      {item.discount >= 1 && (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={item.discountAuthorizedById || ""}
            onChange={(e) => {
              const selectedDoctor = doctors.find(d => d.id === Number(e.target.value));
              dispatch(updateItemDetails({
                id: item.id,
                updates: { 
                  discountAuthorizedBy: selectedDoctor?.name || '',
                  discountAuthorizedById: selectedDoctor?.id
                }
              }));
            }}
            displayEmpty
            sx={{ 
              height: '32px',
              borderRadius: '8px',
              fontSize: '12px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D1D5DB',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: SALES_PAGE_CONSTANTS.PRIMARY_COLOR,
              },
            }}
          >
            <MenuItem value="">
              <em>Discount Authorized by</em>
            </MenuItem>
            {isLoadingDoctors ? (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Loading doctors...
              </MenuItem>
            ) : (
              doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export const getTableColumns = ({
  editingRowId,
  selectedItems,
  dispatch,
  handleEditClick,
  handleSaveClick,
  handleCancelClick,
  handleDeleteClick,
  apiProducts,
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
      <DiscountField 
        item={item} 
        dispatch={dispatch} 
        isEditing={editingRowId === item.id}
      />
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
                  color: SALES_PAGE_CONSTANTS.GRAY_TEXT_COLOR
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
                  color: SALES_PAGE_CONSTANTS.GRAY_TEXT_COLOR,
                  backgroundColor: 'transparent',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: SALES_PAGE_CONSTANTS.GRAY_TEXT_COLOR
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

