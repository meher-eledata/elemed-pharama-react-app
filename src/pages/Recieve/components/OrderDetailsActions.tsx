import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { StandardButton } from "../../../components/Common";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { orderLabels } from "../../../config/label/OrderDetail.labels";

interface OrderDetailsActionsProps {
  isEditMode: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onProceedToPayment: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

const OrderDetailsActions: React.FC<OrderDetailsActionsProps> = ({
  isEditMode,
  isSaving,
  isDeleting,
  onSave,
  onProceedToPayment,
  onCancel,
  onDelete,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "16px",
        marginTop: "24px",
        paddingTop: "24px",
        borderTop: "1px solid #E6ECF5",
      }}
    >
      {isEditMode && (
        <StandardButton
          variant="outline"
          onClick={onDelete}
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteOutlinedIcon />}
          sx={{
            color: "#EF4444",
            borderColor: "#EF4444",
            "&:hover": {
              backgroundColor: "#FEF2F2",
              borderColor: "#DC2626",
            },
          }}
        >
          {isDeleting ? "Deleting..." : orderLabels.deleteReceipt || "Delete Receipt"}
        </StandardButton>
      )}

      <StandardButton
        variant="secondary"
        onClick={onCancel}
        disabled={isSaving}
      >
        {orderLabels.cancel || "Cancel"}
      </StandardButton>

      {!isEditMode && (
        <StandardButton
          variant="outline"
          onClick={onProceedToPayment}
          disabled={isSaving}
        >
          {orderLabels.proceedToPayment || "Proceed to Payment"}
        </StandardButton>
      )}

      <StandardButton
        variant="primary"
        onClick={onSave}
        disabled={isSaving}
        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {isSaving ? "Saving..." : (isEditMode ? orderLabels.updateReceipt || "Update Receipt" : orderLabels.saveReceipt || "Save Receipt")}
      </StandardButton>
    </Box>
  );
};

export default OrderDetailsActions;
