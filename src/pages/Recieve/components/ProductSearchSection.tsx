import React, { RefObject } from "react";
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import { orderLabels } from "../../../config/label/OrderDetail.labels";
import { orderDetailsStyles } from "../styles";

interface ProductSearchSectionProps {
  findProductTerm: string;
  setFindProductTerm: (val: string) => void;
  autocompleteProductOptions: string[];
  filterProductOptions: (options: string[], state: any) => string[];
  isProductsLoading: boolean;
  onProductSelect: (productName: string) => void;
  onAddNewProduct: () => void;
  // Invoice upload props
  invoiceFile: File | null;
  invoiceFileName: string;
  invoiceAttachmentUrl: string;
  isExistingFile: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
}

const ProductSearchSection: React.FC<ProductSearchSectionProps> = ({
  findProductTerm,
  setFindProductTerm,
  autocompleteProductOptions,
  filterProductOptions,
  isProductsLoading,
  onProductSelect,
  onAddNewProduct,
  invoiceFile,
  invoiceFileName,
  invoiceAttachmentUrl,
  isExistingFile,
  fileInputRef,
  handleFileChange,
  handleRemoveFile,
}) => {
  const isImage = invoiceFile?.type?.startsWith('image/') ||
    (invoiceAttachmentUrl && (invoiceAttachmentUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(invoiceAttachmentUrl)));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", marginTop: "24px", marginBottom: "24px", gap: "16px", width: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: "32px" }}>
        {/* Find Product */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Typography sx={orderDetailsStyles.labelText}>
            {orderLabels.findProduct}
          </Typography>
          <Box sx={{ display: 'inline-block', width: '320px' }} data-product-search>
            <Autocomplete
              options={isProductsLoading ? ["Loading products..."] : autocompleteProductOptions}
              value={findProductTerm || null}
              onChange={(_, newValue, reason) => {
                if (reason === 'clear') {
                  setFindProductTerm("");
                  return;
                }
                if (newValue === orderLabels.addProducts) {
                  onAddNewProduct();
                  setFindProductTerm("");
                } else if (newValue && newValue !== "Loading products...") {
                  onProductSelect(newValue);
                  // Don't clear immediately - let the field show the selected value
                  // The hook will clear it after adding to table
                } else if (newValue === null) {
                  setFindProductTerm("");
                }
              }}
              onInputChange={(_, newInputValue, reason) => {
                if (reason !== 'reset') {
                  setFindProductTerm(newInputValue);
                }
              }}
              inputValue={findProductTerm}
              freeSolo
              disableClearable={false}
              disableListWrap={true}
              getOptionDisabled={(option) => option === "Loading products..."}
              filterOptions={filterProductOptions}
              PaperComponent={({ children }) => (
                <Box sx={orderDetailsStyles.dropdownPaper}>
                  {children}
                </Box>
              )}
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiPaper-root": {
                      minWidth: "320px",
                      width: "fit-content",
                      padding: "0 !important",
                      marginTop: "4px !important",
                      height: "auto !important",
                      minHeight: "unset !important",
                      overflow: "hidden",
                      "& .MuiAutocomplete-listbox": {
                        padding: "0px !important",
                        margin: "0 !important",
                        maxHeight: "300px !important",
                        minHeight: "unset !important",
                        overflow: "auto",
                      },
                    },
                  },
                },
              }}
              ListboxProps={{
                sx: {
                  padding: '0px !important',
                  maxHeight: '300px !important',
                  minHeight: 'unset !important',
                  overflow: 'auto',
                }
              }}
              renderOption={(props, option) => {
                const isAddProduct = option === orderLabels.addProducts;
                const isLoading = option === "Loading products...";
                const { key, ...optionProps } = props as any;
                return (
                  <Box
                    key={key}
                    component="li"
                    {...optionProps}
                    sx={{
                      borderRadius: "8px",
                      margin: "2px 8px !important",
                      fontSize: "14px",
                      fontFamily: "'Lexend', sans-serif",
                      ...(isAddProduct ? {
                        backgroundColor: '#5C17E5 !important',
                        color: '#ffffff !important',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#4A14C7 !important',
                        }
                      } : {
                        '&:hover': {
                          backgroundColor: "#F3E8FF",
                          color: "#5C17E5",
                        },
                        '&.Mui-selected': {
                          backgroundColor: "#5C17E5",
                          color: "#ffffff",
                          '&:hover': {
                            backgroundColor: '#4A14C7',
                          },
                        },
                      })
                    }}
                  >
                    {isLoading && <CircularProgress size={16} sx={{ mr: 1 }} color="primary" />}
                    {option}
                  </Box>
                );
              }}
              sx={{
                width: "320px",
                "& .MuiOutlinedInput-root": {
                  height: "44px",
                  borderRadius: "30px",
                  backgroundColor: "#FFFFFF",
                  padding: "0 16px",
                  paddingRight: "40px !important",
                  "& fieldset": {
                    borderColor: "#D1D5DB",
                  },
                  "&:hover fieldset": {
                    borderColor: "#D1D5DB",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#5C17E5",
                    borderWidth: "2px",
                  },
                },
                "& .MuiAutocomplete-endAdornment": {
                  right: "14px",
                },
                "& .MuiAutocomplete-clearIndicator": {
                  visibility: "visible !important",
                  display: "flex !important",
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={isProductsLoading ? "Loading products..." : orderLabels.searchByProductName}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <React.Fragment>
                        <InputAdornment position="start" sx={{ ml: 1.5, mr: 1.5 }}>
                          <SearchIcon sx={{ color: '#9CA3AF', fontSize: '20px' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </React.Fragment>
                    ),
                    endAdornment: (
                      <React.Fragment>
                        {findProductTerm && (
                          <IconButton
                            size="small"
                            onClick={() => setFindProductTerm("")}
                            sx={{
                              padding: '4px',
                              marginRight: '4px',
                              color: '#9CA3AF',
                              '&:hover': {
                                color: '#374151',
                                backgroundColor: 'transparent',
                              },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                        )}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A212B",
                      ml: 1,
                    },
                    "& .MuiOutlinedInput-root": {
                      paddingLeft: '0 !important',
                    }
                  }}
                />
              )}
            />
          </Box>
        </Box>

        {/* Invoice Upload */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Typography sx={orderDetailsStyles.labelText}>
            {orderLabels.invoiceAttachment || "Invoice Attachment"}
          </Typography>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx"
            style={{ display: 'none' }}
          />

          {invoiceFile || invoiceAttachmentUrl ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                height: "44px",
                borderRadius: "22px",
                border: "1px solid #D1D5DB",
                backgroundColor: "#F9FAFB",
                minWidth: "200px",
                maxWidth: "280px",
              }}
            >
              {isImage && invoiceAttachmentUrl ? (
                <a
                  href={invoiceAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block' }}
                >
                  <img
                    src={invoiceAttachmentUrl}
                    alt="Invoice preview"
                    style={{
                      maxWidth: '30px',
                      maxHeight: '28px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                    }}
                  />
                </a>
              ) : null}

              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography
                  sx={{
                    fontSize: '13px',
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {invoiceFileName || 'Uploaded file'}
                </Typography>
                {isExistingFile && (
                  <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>
                    Existing file
                  </Typography>
                )}
              </Box>

              <IconButton
                size="small"
                onClick={handleRemoveFile}
                sx={{
                  padding: '4px',
                  color: '#6B7280',
                  '&:hover': { backgroundColor: 'transparent', color: '#EF4444' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0 16px",
                height: "44px",
                borderRadius: "22px",
                border: "1px dashed #D1D5DB",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.2s",
                minWidth: "180px",
                "&:hover": {
                  borderColor: "#5C17E5",
                  backgroundColor: "#F3E8FF",
                },
              }}
            >
              <UploadIcon sx={{ color: '#9CA3AF', fontSize: '20px' }} />
              <Typography
                sx={{
                  fontFamily: "'Lexend', sans-serif",
                  fontSize: "14px",
                  color: "#728197",
                }}
              >
                Upload Invoice
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProductSearchSection;
