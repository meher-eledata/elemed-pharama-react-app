// import React, { useState, useEffect } from "react";
// import { Box, Typography, Paper, Grid, TextField, IconButton } from "@mui/material";
// import { OrderReceiveRow, ProductItem } from "./OrderReceive";
// import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
// import CheckIcon from '@mui/icons-material/Check';
// import CloseIcon from '@mui/icons-material/Close';
// import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
// import { useEditReceiptLineQuantityMutation, useDeleteReceiptLineMutation } from "../../redux/slices/receiveApi";

// interface ProductDetailsModalContentProps {
//   productData: OrderReceiveRow | null;
//   onUpdateProduct: (updatedProduct: OrderReceiveRow) => void;
//   onDeleteProduct: () => void;
// }

// const ProductDetailsModalContent: React.FC<ProductDetailsModalContentProps> = ({
//   productData,
//   onUpdateProduct,
//   onDeleteProduct,
// }) => {
//   const [editingIndex, setEditingIndex] = useState<number | null>(null);
//   const [editableProducts, setEditableProducts] = useState<ProductItem[]>(productData?.products || []);
//   const [editLineQuantity, { isLoading: savingLine }] = useEditReceiptLineQuantityMutation();
//   const [deleteReceiptLine, { isLoading: deletingLine }] = useDeleteReceiptLineMutation();


//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
//   const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

//   useEffect(() => {
//     if (productData) {
//       setEditableProducts(productData.products);
//     }
//   }, [productData]);

//   if (!productData) {
//     return <Typography>No product data available.</Typography>;
//   }

//   const handleEditClick = (index: number) => {
//     setEditingIndex(index);
//   };

//   const handleSaveClick = async (index: number) => {
//     const product = editableProducts[index];
//     if (!product || !product.lineId) {
//       setEditingIndex(null);
//       return;
//     }
//     try {
//       await editLineQuantity({ id: product.lineId, received_qty: Number(product.quantity) }).unwrap();
//       const updatedProductData = {
//         ...productData,
//         products: editableProducts,
//       };
//       onUpdateProduct(updatedProductData);
//     } catch (e) {
//       console.error("Update quantity failed", e);
//     } finally {
//       setEditingIndex(null);
//     }
//   };

//   const handleCancelClick = () => {
//     setEditableProducts(productData.products);
//     setEditingIndex(null);
//   };

//   const handleDeleteClick = (index: number) => {
//     setDeletingIndex(index);
//     setIsDeleteDialogOpen(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (deletingIndex !== null) {
//       const product = editableProducts[deletingIndex];
//       if (product?.lineId) {
//         try {
//           await deleteReceiptLine({ id: product.lineId }).unwrap();
//         } catch (e) {
//           console.error("Delete line failed", e);
//         }
//       }
//       const updatedProducts = editableProducts.filter((_, idx) => idx !== deletingIndex);
//       const updatedProductData = {
//         ...productData,
//         products: updatedProducts,
//       };
//       onUpdateProduct(updatedProductData);
//       setEditableProducts(updatedProducts);
//       setIsDeleteDialogOpen(false);
//       setDeletingIndex(null);
//     }
//   };

//   const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
//     const { name, value } = event.target;
//     const newProducts = [...editableProducts];
//     newProducts[index] = {
//       ...newProducts[index],
//       [name]: value,
//     };
//     setEditableProducts(newProducts);
//   };

//   return (
//     <Box>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
//         <Typography variant="body1">
//           Receipt number {productData.reNo}
//         </Typography>
//         <Typography variant="body1">
//           Supplier name {productData.supplier}
//         </Typography>
//       </Box>
//       <Paper variant="outlined" sx={{ p: 2 }}>
//         <Grid container spacing={2}>
//           <Grid item xs={2}>
//             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//               Product name
//             </Typography>
//           </Grid>
//           <Grid item xs={2}>
//             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//               Type
//             </Typography>
//           </Grid>
//           <Grid item xs={2}>
//             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//               Quantity
//             </Typography>
//           </Grid>
//           <Grid item xs={2}>
//             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//               HSN code
//             </Typography>
//           </Grid>
//           <Grid item xs={2}>
//             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//               Amount
//             </Typography>
//           </Grid>
//         </Grid>

//         {editableProducts.map((product, index) => (
//           <Grid container spacing={2} sx={{ mt: 1 }} key={index}>
//             <Grid item xs={2}>
//               <Typography variant="body2">{product.productName}</Typography>
//             </Grid>
//             <Grid item xs={2}>
//               <Typography variant="body2">{product.type}</Typography>
//             </Grid>
//             <Grid item xs={2}>
//               {editingIndex === index ? (
//                 <TextField
//                   name="quantity"
//                   value={product.quantity}
//                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e, index)}
//                   variant="outlined"
//                   size="small"
//                   fullWidth
//                 />
//               ) : (
//                 <Typography variant="body2">{product.quantity}</Typography>
//               )}
//             </Grid>
//             <Grid item xs={2}>
//               <Typography variant="body2">{product.hsnCode}</Typography>
//             </Grid>
//             <Grid item xs={2}>
//               <Typography variant="body2">{product.amount}</Typography>
//             </Grid>
//             <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               {editingIndex === index ? (
//                 <>
//                   <IconButton onClick={() => handleSaveClick(index)}>
//                     <CheckIcon sx={{ color: '#000000' }} />
//                   </IconButton>
//                   <IconButton onClick={handleCancelClick}>
//                     <CloseIcon sx={{ color: '#000000' }} />
//                   </IconButton>
//                   <IconButton onClick={() => handleDeleteClick(index)}>
//                     <DeleteIcon sx={{ color: '#000000' }} />
//                   </IconButton>
//                 </>
//               ) : (
//                 <IconButton onClick={() => handleEditClick(index)}>
//                   <EditIcon sx={{ color: '#000000' }} />
//                 </IconButton>
//               )}
//             </Grid>
//           </Grid>
//         ))}
//       </Paper>
//       <ConfirmationDialog
//         open={isDeleteDialogOpen}
//         onClose={() => setIsDeleteDialogOpen(false)}
//         onConfirm={handleConfirmDelete}
//         title="Confirm Deletion"
//         message="Are you sure you want to delete this product? This action cannot be undone."
//       />
//     </Box>
//   );
// };

// export default ProductDetailsModalContent;


import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, TextField, IconButton } from "@mui/material";
import { OrderReceiveRow, ProductItem } from "./OrderReceive"; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog";
import { useEditReceiptLineQuantityMutation, useDeleteReceiptLineMutation } from "../../redux/slices/receiveApi";

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
    } catch (e) {
      console.error("Update quantity failed", e);
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
        } catch (e) {
          console.error("Delete line failed", e);
        }
      }
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
              <Typography variant="body2">{product.productName}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{product.type}</Typography>
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
              <Typography variant="body2">{product.hsnCode}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{product.amount}</Typography>
            </Grid>
            <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', gap: 1,justifyContent:'center', }}>
              {editingIndex === index ? (
                <>
                  <IconButton onClick={() => handleSaveClick(index)}>
                    <CheckIcon sx={{ color: '#000000' }} />
                  </IconButton>
                  <IconButton onClick={handleCancelClick}>
                    <CloseIcon sx={{ color: '#000000' }} />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(index)}>
                    <DeleteIcon sx={{ color: '#000000' }} />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => handleEditClick(index)} sx={{ p: 0, display: 'flex', alignItems: 'center' }}>
      <EditIcon sx={{ color: '#000000', fontSize: 20 }} />
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







