import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, TextField, IconButton } from "@mui/material";
import { OrderReceiveRow, ProductItem } from "./OrderReceive"; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";

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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (productData) {
      setEditableProducts(productData.products);
    }
  }, [productData]);

  if (!productData) {
    return <Typography>No product data available.</Typography>;
  }

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveClick = (index: number) => {
    const updatedProductData = {
      ...productData,
      products: editableProducts,
    };
    onUpdateProduct(updatedProductData);
    setEditingIndex(null);
  };

  const handleCancelClick = () => {
    setEditableProducts(productData.products);
    setEditingIndex(null);
  };

  const handleDeleteClick = (index: number) => {
    setDeletingIndex(index);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingIndex !== null) {
      const updatedProducts = editableProducts.filter((_, idx) => idx !== deletingIndex);
      const updatedProductData = {
        ...productData,
        products: updatedProducts,
      };
      onUpdateProduct(updatedProductData);
      setEditableProducts(updatedProducts);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body1">
          Receipt number {productData.reNo}
        </Typography>
        <Typography variant="body1">
          Supplier name {productData.supplier}
        </Typography>
      </Box>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Product name
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Type
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Quantity
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              HSN code
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Amount
            </Typography>
          </Grid>
        </Grid>
        
        {editableProducts.map((product, index) => (
          <Grid container spacing={2} sx={{ mt: 1 }} key={index}>
            <Grid item xs={2}>
              {editingIndex === index ? (
                <TextField
                  name="productName"
                  value={product.productName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, index)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              ) : (
                <Typography variant="body2">{product.productName}</Typography>
              )}
            </Grid>
            <Grid item xs={2}>
              {editingIndex === index ? (
                <TextField
                  name="type"
                  value={product.type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, index)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              ) : (
                <Typography variant="body2">{product.type}</Typography>
              )}
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
                <Typography variant="body2">{product.quantity}</Typography>
              )}
            </Grid>
            <Grid item xs={2}>
              {editingIndex === index ? (
                <TextField
                  name="hsnCode"
                  value={product.hsnCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, index)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              ) : (
                <Typography variant="body2">{product.hsnCode}</Typography>
              )}
            </Grid>
            <Grid item xs={2}>
              {editingIndex === index ? (
                <TextField
                  name="amount"
                  value={product.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, index)}
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              ) : (
                <Typography variant="body2">{product.amount}</Typography>
              )}
            </Grid>
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {editingIndex === index ? (
                <>
                  <IconButton onClick={() => handleSaveClick(index)}>
                    <CheckCircleOutlineIcon color="success" />
                  </IconButton>
                  <IconButton onClick={handleCancelClick}>
                    <CancelIcon color="error" />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(index)}>
                    <DeleteIcon sx={{ color: '#666' }} />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => handleEditClick(index)}>
                  <EditIcon sx={{ color: '#666' }} />
                </IconButton>
              )}
            </Grid>
          </Grid>
        ))}
      </Paper>
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </Box>
  );
};

export default ProductDetailsModalContent;