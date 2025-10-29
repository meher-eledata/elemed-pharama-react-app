import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Paper, Grid, IconButton, Snackbar, Alert, Pagination } from "@mui/material";
import { OrderReceiveRow, ProductItem } from "./OrderReceive"; 
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
  const [editableProducts, setEditableProducts] = useState<ProductItem[]>(productData?.products || []);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5; // Show 5 items per page

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  useEffect(() => {
    if (productData) {
      setEditableProducts(productData.products);
    }
  }, [productData]);

  // Calculate pagination
  const totalPages = Math.ceil(editableProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return editableProducts.slice(startIndex, endIndex);
  }, [editableProducts, currentPage, itemsPerPage]);

  if (!productData) {
    return <Typography>{PRODUCT_DETAILS_MODAL_LABELS.TOAST.NO_DATA}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.HEADER_GAP }}>
        <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_VARIANT}>
          {PRODUCT_DETAILS_MODAL_LABELS.RECEIPT_PREFIX} <span style={{ fontWeight: 'bold' }}>{productData.reNo}</span>
        </Typography>
        <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_VARIANT}>
          {PRODUCT_DETAILS_MODAL_LABELS.SUPPLIER_PREFIX} <span style={{ fontWeight: 'bold' }}>{productData.supplier}</span>
        </Typography>
      </Box>
      <Paper variant="outlined" sx={{ p: PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.PAPER_PADDING }}>
        {/* Table Headers */}
        <Grid container spacing={PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.GRID_SPACING} alignItems="center">
          <Grid item xs={2.4}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.PRODUCT_NAME}
            </Typography>
          </Grid>
          <Grid item xs={2.4}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.TYPE}
            </Typography>
          </Grid>
          <Grid item xs={2.4}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.QUANTITY}
            </Typography>
          </Grid>
          <Grid item xs={2.4}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.HSN_CODE}
            </Typography>
          </Grid>
          <Grid item xs={2.4}>
            <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT} sx={{ fontWeight: PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_WEIGHT }}>
              {PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.AMOUNT}
            </Typography>
          </Grid>
        </Grid>
        
        {/* Table Data */}
        {editableProducts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No product details available for this receipt.
            </Typography>
          </Box>
        ) : (
          paginatedProducts.map((product, index) => (
            <Grid container spacing={PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.GRID_SPACING} sx={{ mt: PRODUCT_DETAILS_MODAL_CONSTANTS.LAYOUT.ROW_MARGIN_TOP }} alignItems="center" key={index}>
              <Grid item xs={2.4}>
                <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.productName}</Typography>
              </Grid>
              <Grid item xs={2.4}>
                <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.type}</Typography>
              </Grid>
              <Grid item xs={2.4}>
                <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.quantity}</Typography>
              </Grid>
              <Grid item xs={2.4}>
                <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.hsnCode}</Typography>
              </Grid>
              <Grid item xs={2.4}>
                <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.CELL_VARIANT}>{product.amount}</Typography>
              </Grid>
            </Grid>
          ))
        )}
      </Paper>
      
      {/* Pagination */}
      {editableProducts.length > itemsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {currentPage} of {totalPages} pages
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              sx={{ 
                color: currentPage === 1 ? '#9CA3AF' : '#5C17E5',
                '&:hover': {
                  backgroundColor: currentPage === 1 ? 'transparent' : '#F3E8FF'
                }
              }}
            >
              <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
            </IconButton>
            <IconButton 
              size="small" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              sx={{ 
                color: currentPage === totalPages ? '#9CA3AF' : '#5C17E5',
                '&:hover': {
                  backgroundColor: currentPage === totalPages ? 'transparent' : '#F3E8FF'
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      )}

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