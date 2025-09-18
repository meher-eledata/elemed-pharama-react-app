import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, TextField, IconButton, Snackbar, Alert } from "@mui/material";
import { OrderReceiveRow, ProductItem } from "./OrderReceive"; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import { useEditReceiptLineQuantityMutation, useDeleteReceiptLineMutation } from "../../redux/slices/receiveApi";
import { PRODUCT_DETAILS_MODAL_CONSTANTS } from "../../config/constants/ProductDetailsModal.constants";
import { PRODUCT_DETAILS_MODAL_LABELS } from "../../config/label/ProductDetailsModal.labels";

interface ProductDetailsModalContentProps {
  productData: OrderReceiveRow | null;
  onUpdateProduct: (updatedProduct: OrderReceiveRow) => void;
  onDeleteProduct: () => void;
}

const ProductDetailsModalContent: React.FC<ProductDetailsModalContentProps> = ({
  productData,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editableProducts, setEditableProducts] = useState<ProductItem[]>(productData?.products || []);
  const [editLineQuantity, { isLoading: savingLine }] = useEditReceiptLineQuantityMutation();
  const [deleteReceiptLine, { isLoading: deletingLine }] = useDeleteReceiptLineMutation();


  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  useEffect(() => {
    if (productData) {
      setEditableProducts(productData.products);
    }
  }, [productData]);

  if (!productData) {
    return <Typography>{PRODUCT_DETAILS_MODAL_LABELS.TOAST.NO_DATA}</Typography>;
  }

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveClick = async (index: number) => {
    const product = editableProducts[index];
    if (!product || !product.lineId) {
      setEditingIndex(null);
      return;
    }
    try {
      await editLineQuantity({ id: product.lineId, received_qty: Number(product.quantity) }).unwrap();
      const updatedProductData = {
        ...productData,
        products: editableProducts,
      };
      onUpdateProduct(updatedProductData);
      setSnackbarSeverity('success');
      setSnackbarMessage(PRODUCT_DETAILS_MODAL_LABELS.TOAST.UPDATE_SUCCESS);
      setSnackbarOpen(true);
    } catch (e) {
      console.error("Update quantity failed", e);
      setSnackbarSeverity('error');
      setSnackbarMessage(PRODUCT_DETAILS_MODAL_LABELS.TOAST.UPDATE_FAILED);
      setSnackbarOpen(true);
    } finally {
      setEditingIndex(null);
    }
  };

  const handleCancelClick = () => {
    setEditableProducts(productData.products);
    setEditingIndex(null);
  };

  const handleDeleteClick = (index: number) => {
    setDeletingIndex(index);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingIndex !== null) {
      const product = editableProducts[deletingIndex];
      if (product?.lineId) {
        try {
          await deleteReceiptLine({ id: product.lineId }).unwrap();
          
          // Only update local state if API call succeeds
          const updatedProducts = editableProducts.filter((_, idx) => idx !== deletingIndex);
          const updatedProductData = {
            ...productData,
            products: updatedProducts,
          };
          onUpdateProduct(updatedProductData);
          setEditableProducts(updatedProducts);
          
          setSnackbarSeverity('success');
          setSnackbarMessage(PRODUCT_DETAILS_MODAL_LABELS.TOAST.DELETE_SUCCESS);
          setSnackbarOpen(true);
        } catch (e) {
          console.error("Delete line failed", e);
          setSnackbarSeverity('error');
          setSnackbarMessage(PRODUCT_DETAILS_MODAL_LABELS.TOAST.DELETE_FAILED);
          setSnackbarOpen(true);
        }
      }
      setIsDeleteDialogOpen(false);
      setDeletingIndex(null);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = event.target;
    const newProducts = [...editableProducts];
    newProducts[index] = {
      ...newProducts[index],
      [name]: value,
    };
    setEditableProducts(newProducts);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.HEADER_GAP }}>
        <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_VARIANT}>
          {PRODUCT_DETAILS_MODAL_LABELS.RECEIPT_PREFIX} {productData.reNo}
        </Typography>
        <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_VARIANT}>
          {PRODUCT_DETAILS_MODAL_LABELS.SUPPLIER_PREFIX} {productData.supplier}
        </Typography>
      </Box>
      <Paper variant="outlined" sx={{ p: PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.PAPER_PADDING }}>
        <Grid container spacing={PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.GRID_SPACING} alignItems="center">
          <Grid item xs={2}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.PRODUCT_NAME}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.TYPE}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.QUANTITY}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.HSN_CODE}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.AMOUNT}
            </Typography>
          </Grid>
        </Grid>
        
        {editableProducts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No product details available for this receipt.
            </Typography>
          </Box>
        ) : (
          editableProducts.map((product, index) => (
          <Grid container spacing={PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.GRID_SPACING} sx={{ mt: PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.ROW_MARGIN_TOP }} alignItems="center" key={index}>
            <Grid item xs={2}>
              <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.productName}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.type}</Typography>
            </Grid>
            <Grid item xs={2}>
              {editingIndex === index ? (
                <TextField
                  name="quantity"
                  value={product.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, index)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              ) : (
                <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.quantity}</Typography>
              )}
            </Grid>
            <Grid item xs={2}>
              <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.hsnCode}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.amount}</Typography>
            </Grid>
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-start' }}>
              {editingIndex === index ? (
                <>
                  <IconButton size="small" onClick={() => handleSaveClick(index)} sx={{ p: 0 }}>
                    <CheckIcon sx={{ color: PRODUCT_DETAILS_MODAL_CONSTANTS.ICONS.COLOR }} />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelClick} sx={{ p: 0 }}>
                    <CloseIcon sx={{ color: PRODUCT_DETAILS_MODAL_CONSTANTS.ICONS.COLOR,'&:hover': {
      backgroundColor: 'transparent',
    }, }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(index)} sx={{ p: 0 }}>
                    <DeleteIcon sx={{ color: PRODUCT_DETAILS_MODAL_CONSTANTS.ICONS.COLOR }} />
                  </IconButton>
                </>
              ) : (
                <IconButton size="small" onClick={() => handleEditClick(index)} sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <EditIcon sx={{ color: PRODUCT_DETAILS_MODAL_CONSTANTS.ICONS.COLOR, fontSize: PRODUCT_DETAILS_MODAL_CONSTANTS.ICONS.EDIT_SIZE }} />
                </IconButton>
              )}
            </Grid>
          </Grid>
        ))
        )}
      </Paper>
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={PRODUCT_DETAILS_MODAL_LABELS.DIALOG.TITLE}
        message={PRODUCT_DETAILS_MODAL_LABELS.DIALOG.MESSAGE}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={PRODUCT_DETAILS_MODAL_CONSTANTS.SNACKBAR.AUTOHIDE_MS}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={PRODUCT_DETAILS_MODAL_CONSTANTS.SNACKBAR.ANCHOR}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetailsModalContent;


