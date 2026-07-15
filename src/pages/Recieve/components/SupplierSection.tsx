import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { PharmaDatePicker } from "../../../components/Common";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { orderLabels } from "../../../config/label/OrderDetail.labels";
import { orderDetailsStyles } from "../styles";

interface SupplierSectionProps {
  supplierName: string;
  setSupplierName: (val: string) => void;
  supplierSearchTerm: string;
  setSupplierSearchTerm: (val: string) => void;
  filteredSupplierOptions: string[];
  isSuppliersLoading: boolean;
  suppliersError: string | null;
  retryFetchSuppliers: () => void;
  onAddNewSupplier: () => void;
  poNumber: string;
  setPoNumber: (val: string) => void;
  invoiceDate: string;
  setInvoiceDate: (val: string) => void;
  invoiceNumber: string;
  setInvoiceNumber: (val: string) => void;
  invoiceNumberError?: string;
}

const SupplierSection: React.FC<SupplierSectionProps> = ({
  supplierName,
  setSupplierName,
  supplierSearchTerm,
  setSupplierSearchTerm,
  filteredSupplierOptions,
  isSuppliersLoading,
  suppliersError,
  retryFetchSuppliers,
  onAddNewSupplier,
  poNumber,
  setPoNumber,
  invoiceDate,
  setInvoiceDate,
  invoiceNumber,
  setInvoiceNumber,
  invoiceNumberError,
}) => {
  return (
    <Box sx={{ display: "flex", gap: "32px", marginTop: "10px" }}>
      {/* Supplier Name */}
      <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
        <Typography sx={orderDetailsStyles.labelText}>
          {orderLabels.supplierName}
        </Typography>
        <Autocomplete
          options={isSuppliersLoading ? ["Loading suppliers..."] : filteredSupplierOptions}
          value={supplierName || null}
          onChange={(_, newValue) => {
            if (newValue === orderLabels.addNewSupplier) {
              onAddNewSupplier();
            } else if (newValue && newValue !== "Loading suppliers...") {
              setSupplierName(newValue);
            } else if (newValue === null) {
              setSupplierName('');
            }
          }}
          onInputChange={(_, newInputValue) => setSupplierSearchTerm(newInputValue)}
          inputValue={supplierSearchTerm}
          disableListWrap={true}
          getOptionDisabled={(option) => option === "Loading suppliers..."}
          PaperComponent={({ children }) => (
            <Box sx={orderDetailsStyles.dropdownPaper}>
              {children}
            </Box>
          )}
          slotProps={{
            popper: {
              sx: {
                "& .MuiPaper-root": {
                  minWidth: "274px",
                  width: "fit-content",
                  padding: "0 !important",
                  marginTop: "4px !important",
                  height: "auto !important",
                  minHeight: "unset !important",
                  overflow: "hidden",
                  "& .MuiAutocomplete-listbox": {
                    padding: "4px 0 !important",
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
            const isAddNewSupplier = option === orderLabels.addNewSupplier;
            const isLoading = option === "Loading suppliers...";
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
                  ...(isAddNewSupplier ? {
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
            ...orderDetailsStyles.autocompleteField,
            "& .MuiOutlinedInput-root": {
              ...orderDetailsStyles.autocompleteField['& .MuiOutlinedInput-root'],
              "& fieldset": {
                borderColor: suppliersError ? "#d32f2f" : "#D1D5DB",
              },
              "&:hover fieldset": {
                borderColor: suppliersError ? "#d32f2f" : "#D1D5DB",
              },
              "&.Mui-focused fieldset": {
                borderColor: suppliersError ? "#d32f2f" : "#5C17E5",
                borderWidth: "2px",
              },
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={isSuppliersLoading ? "Loading suppliers..." : orderLabels.enterSupplierName}
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
        {suppliersError && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, ml: 1.5, color: '#d32f2f', fontSize: '0.75rem' }}>
            <span>{suppliersError}</span>
            <Button
              size="small"
              onClick={retryFetchSuppliers}
              sx={{ minWidth: 'auto', padding: '0px 4px', fontSize: '10px', textTransform: 'none', color: '#5C17E5' }}
            >
              Retry
            </Button>
          </Box>
        )}
      </Box>

      {/* PO Number */}
      <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
        <Typography sx={orderDetailsStyles.labelText}>
          {orderLabels.poNumber}
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
          placeholder={orderLabels.enterPoNumber}
          sx={orderDetailsStyles.formField}
        />
      </Box>

      {/* Invoice Date */}
      <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
        <Typography sx={orderDetailsStyles.labelText}>
          {orderLabels.invoiceDate}
        </Typography>
        <PharmaDatePicker
          value={
            invoiceDate
              ? (() => {
                const parsed = dayjs(invoiceDate, 'DD/MM/YYYY');
                return parsed.isValid() ? parsed : null;
              })()
              : null
          }
          onChange={(newValue: Dayjs | null) => {
            const formattedDate = newValue ? newValue.format('DD/MM/YYYY') : '';
            setInvoiceDate(formattedDate);
          }}
          width={274}
        />
      </Box>

      {/* Invoice Number */}
      <Box sx={{ display: "flex", flexDirection: "column", width: "274px", gap: "4px" }}>
        <Typography sx={orderDetailsStyles.labelText}>
          Invoice Number
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Enter Invoice Number"
          error={!!invoiceNumberError}
          helperText={invoiceNumberError || ''}
          sx={orderDetailsStyles.formField}
        />
      </Box>
    </Box>
  );
};

export default SupplierSection;
