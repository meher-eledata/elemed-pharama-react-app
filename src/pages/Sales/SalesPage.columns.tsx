import React from 'react';
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
  apiProducts: any[];
}

// Discount Field Component
const DiscountField: React.FC<{
  item: Product;
  dispatch: AppDispatch;
  isEditing: boolean;
}> = ({ item, dispatch, isEditing }) => {
  if (!isEditing) {
    return <span>{item.discount}</span>;
  }

  return (
    <TextField
      value={item.discount}
      onChange={(e) => {
        let inputValue = e.target.value;
        // Prevent leading zero (e.g., "05" -> "5")
        if (inputValue.length > 1 && inputValue.startsWith('0')) {
          inputValue = inputValue.substring(1);
          e.target.value = inputValue; // Force browser to sync immediately
        }
        const value = parseInt(inputValue) || 0;
        dispatch(updateItemDetails({
          id: item.id,
          updates: {
            discount: Math.max(0, Math.min(100, value)),
          }
        }));
      }}
      onFocus={(e) => {
        e.target.select();
      }}
      size="small"
      type="number"
      inputProps={{ min: 0, max: 100, step: "1", style: { textAlign: 'center' } }}
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
      header: "Units",
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
          Math.floor(parseFloat(item.avlQty || '0'))
        )
      )
    },
    {
      key: "pack_qty",
      header: "Package info",
      render: (item) => item.pack_qty || 1
    },
    {
      key: "unit_price",
      header: "Unit Price",
      render: (item) => item.unit_selling_price ? item.unit_selling_price.toFixed(2) : "0.00"
    },
    {
      key: "mrp",
      header: "Box MRP",
      render: (item) => item.mrp ? item.mrp.toFixed(2) : "0.00"
    },
    {
      key: "sp",
      header: "Box SP",
      render: (item) => item.sp ? item.sp.toFixed(2) : "0.00"
    },
    {
      key: "total_amount",
      header: "Total Amount",
      render: (item) => {
        const discountMultiplier = 1 - ((item.discount || 0) / 100);
        return (item.unit_selling_price * item.quantity * discountMultiplier).toFixed(2);
      }
    },
    {
      key: "expiry",
      header: "Expiry",
      render: (item) => {
        if (!item.expiry) return '—';
        const d = new Date(item.expiry);
        if (isNaN(d.getTime())) return item.expiry;
        return d.toLocaleDateString('en-GB');
      }
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
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start', alignItems: 'center', width: '100%', pl: 1 }}>
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

