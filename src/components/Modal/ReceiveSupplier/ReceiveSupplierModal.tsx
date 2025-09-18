import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem,
  Typography,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useGetUniqueSupplierNamesQuery } from "../../../redux/slices/receiveApi";

import {
  CANCEL_BUTTON_STYLE,
  NEXT_BUTTON_STYLE,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          fontFamily: FONT_FAMILY,
        }}
      >
        {MODAL_TITLE}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small">
          <Typography
            sx={{
              fontFamily: FONT_FAMILY,
              color: "#728197",
              marginBottom: "4px"
            }}
          >
            {FIND_SUPPLIER_LABEL}
          </Typography>
           <Select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            displayEmpty
            sx={SELECT_STYLE}
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
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            ...CANCEL_BUTTON_STYLE,
            '&:hover': {
              backgroundColor: 'transparent',
            },
            '&.MuiButtonBase-root': {
              '&.Mui-focusVisible': {
                backgroundColor: 'transparent',
              },
            },
          }}
          disableRipple 
        >
          {BUTTON_CANCEL}
        </Button>

        <Button
          variant="contained"
          sx={{
            ...NEXT_BUTTON_STYLE,
            '&:hover': {
              backgroundColor: NEXT_BUTTON_STYLE.backgroundColor, 
              boxShadow: 'none',
            },
          }}
          onClick={onNext}
          disabled={loadingSuppliers || !supplier}
          disableRipple
        >
          {BUTTON_NEXT}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiveSupplierModal;