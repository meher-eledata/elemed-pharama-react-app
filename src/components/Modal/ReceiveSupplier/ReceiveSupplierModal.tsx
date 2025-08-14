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
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
}

const ReceiveSupplierModal: React.FC<ReceiveSupplierModalProps> = ({
  open,
  onClose,
  supplier,
  setSupplier,
  onNext
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          fontFamily: FONT_FAMILY
        }}
      >
        {MODAL_TITLE}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
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
          >
            <MenuItem value="">
              <em>{PLACEHOLDER_SELECT}</em>
            </MenuItem>
            <MenuItem value="supplier1">Supplier 1</MenuItem>
            <MenuItem value="supplier2">Supplier 2</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={CANCEL_BUTTON_STYLE}>
          {BUTTON_CANCEL}
        </Button>
        <Button variant="contained" sx={NEXT_BUTTON_STYLE} onClick={onNext}>
          {BUTTON_NEXT}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiveSupplierModal;
