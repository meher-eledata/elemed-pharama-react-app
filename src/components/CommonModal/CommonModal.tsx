import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { ADD_BUTTON_COLOR, ADD_BUTTON_HOVER_COLOR } from "../../config/constants/OrderReceive.constants";

interface CommonModalProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

const CommonModal: React.FC<CommonModalProps> = ({
  open,
  title,
  content,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{content}</DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          sx={{
            backgroundColor: ADD_BUTTON_COLOR,
            color: "#FFFFFF",
            textTransform: "none",
            borderRadius: "10px",
            px: 2.5,
            "&:hover": { backgroundColor: ADD_BUTTON_HOVER_COLOR },
            "&:focus": { backgroundColor: ADD_BUTTON_HOVER_COLOR },
            "&:active": { backgroundColor: ADD_BUTTON_HOVER_COLOR },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommonModal;
