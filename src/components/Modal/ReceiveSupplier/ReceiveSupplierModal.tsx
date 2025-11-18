import React from "react";
import {
  Modal,
  Box,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Typography,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { StandardButton } from "../../Common";
import { useGetUniqueSupplierNamesQuery } from "../../../redux/slices/receiveApi";
import styled from '@mui/system/styled';

import {
  SELECT_STYLE,
  MENU_PROPS,
  FONT_FAMILY
} from "../../../config/constants/ReceiveSupliers.constants";
import {
  MODAL_TITLE,
  FIND_SUPPLIER_LABEL,
  PLACEHOLDER_SELECT,
  BUTTON_CANCEL,
  BUTTON_NEXT
} from "../../../config/label/ReceiveSupliers.labels";

interface ReceiveSupplierModalProps {
  open: boolean;
  onClose: () => void;
  supplier: string;
  setSupplier: (value: string) => void;
  onNext?: () => void;
  supplierOptions?: string[];
}

const ReceiveSupplierModal: React.FC<ReceiveSupplierModalProps> = ({
  open,
  onClose,
  supplier,
  setSupplier,
  onNext,
  supplierOptions
}) => {
  const { data: apiSupplierNames, isLoading: loadingSuppliers, error: suppliersError } = useGetUniqueSupplierNamesQuery(undefined, {
    skip: !open
  });

  const availableSuppliers = apiSupplierNames || supplierOptions || [];

  const StyledFormControl = styled(FormControl)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
      height: '44px',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      fontSize: '14px',
      
      '& fieldset': {
        borderColor: '#e2e8f0',
        borderWidth: '2px',
      },
      
      '&:hover fieldset': {
        borderColor: '#D1D5DB',
        borderWidth: '2px',
      },
      
      '&.Mui-focused fieldset': {
        borderColor: '#D1D5DB',
        borderWidth: '2px',
      },
    },
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="receive-supplier-modal-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={{
        position: 'relative',
        width: '90%',
        maxWidth: '500px',
        bgcolor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        p: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        outline: 'none',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        {/* Enhanced Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          pb: 1.5,
          mb: 1
        }}>
          <Box>
            <Typography
              id="receive-supplier-modal-title"
              variant="h5"
              component="h2"
              sx={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 600,
                fontSize: '22px',
                color: '#1a202c',
                margin: 0,
                mb: 0.5,
              }}
            >
              {MODAL_TITLE}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{
                color: '#718096',
                fontSize: '14px',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              Select a supplier to receive products.
            </Typography>
          </Box>
          <IconButton 
            aria-label="close" 
            onClick={onClose} 
            sx={{ 
              color: '#718096',
              backgroundColor: '#f7fafc',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              '&:hover': {
                backgroundColor: '#edf2f7',
                color: '#2d3748',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Form Content */}
        <Box sx={{ flex: 1 }}>
          <StyledFormControl fullWidth>
            <Typography
              variant="body2"
              sx={{
                mb: 0.5,
                color: '#4a5568',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: "'Lexend', sans-serif"
              }}
            >
              {FIND_SUPPLIER_LABEL}
            </Typography>
            <Select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              displayEmpty
              MenuProps={MENU_PROPS}
              disabled={loadingSuppliers}
            >
              <MenuItem value="">
                <em>{PLACEHOLDER_SELECT}</em>
              </MenuItem>
              {loadingSuppliers ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                  <span style={{ marginLeft: 8 }}>Loading suppliers...</span>
                </MenuItem>
              ) : suppliersError ? (
                <MenuItem disabled>
                  <span style={{ color: 'red' }}>Error loading suppliers</span>
                </MenuItem>
              ) : availableSuppliers.length > 0 ? (
                availableSuppliers.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <em>No suppliers available</em>
                </MenuItem>
              )}
            </Select>
          </StyledFormControl>
        </Box>

        {/* Enhanced Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          pt: 2,
          borderTop: '1px solid #e2e8f0',
          mt: 'auto'
        }}>
          <StandardButton
            variant="secondary"
            size="medium"
            onClick={onClose}
          >
            {BUTTON_CANCEL}
          </StandardButton>
          <StandardButton
            variant="primary"
            size="medium"
            onClick={onNext}
            disabled={loadingSuppliers || !supplier}
          >
            {BUTTON_NEXT}
          </StandardButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default ReceiveSupplierModal;