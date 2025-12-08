import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Snackbar, Alert, Tooltip } from "@mui/material";
import { OrderReceiveRow, ProductItem } from "./OrderReceive"; 
import { ReusableTable, TableColumn } from "../../components/PharmaTable";
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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'productName',
    direction: 'asc'
  });
  const rowsPerPage = 5;

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  useEffect(() => {
    if (productData) {
      setEditableProducts(productData.products);
    }
  }, [productData]);

  const sortedProducts = useMemo(() => {
    const activeSortKey = sortConfig.key || 'productName';
    const activeSortDirection = sortConfig.direction || 'asc';
    
    return [...editableProducts].sort((a, b) => {
      const aValue = a[activeSortKey as keyof ProductItem];
      const bValue = b[activeSortKey as keyof ProductItem];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return activeSortDirection === 'asc'
          ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
          : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return activeSortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' })
        : String(bValue).localeCompare(String(aValue), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [editableProducts, sortConfig]);

  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: 'productName', direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const columns: TableColumn<ProductItem>[] = [
    {
      key: 'productName',
      header: PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.PRODUCT_NAME,
      sortable: true,
      columnWidth: '25%',
    },
    {
      key: 'type',
      header: PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.TYPE,
      sortable: true,
      columnWidth: '12%',
    },
    {
      key: 'quantity',
      header: PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.QUANTITY,
      sortable: true,
      columnWidth: '20%',
    },
    {
      key: 'hsnCode',
      header: PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.HSN_CODE,
      sortable: true,
      columnWidth: '23%',
      render: (item) => (
        <Tooltip title="Harmonized System of Nomenclature (HSN) Code" arrow placement="top">
          <span style={{ cursor: 'help' }}>{item.hsnCode || '-'}</span>
        </Tooltip>
      ),
    },
    {
      key: 'amount',
      header: PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.AMOUNT,
      sortable: true,
      columnWidth: '20%',
      render: (item) => `₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
  ];

  if (!productData) {
    return <Typography>{PRODUCT_DETAILS_MODAL_LABELS.TOAST.NO_DATA}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_VARIANT}>
          {PRODUCT_DETAILS_MODAL_LABELS.RECEIPT_PREFIX} <span style={{ fontWeight: 'bold' }}>{productData.reNo}</span>
        </Typography>
        <Typography variant={PRODUCT_DETAILS_MODAL_CONSTANTS.TYPOGRAPHY.HEADER_VARIANT}>
          {PRODUCT_DETAILS_MODAL_LABELS.SUPPLIER_PREFIX} <span style={{ fontWeight: 'bold' }}>{productData.supplier}</span>
        </Typography>
      </Box>
      
      <ReusableTable<ProductItem>
        columns={columns}
        data={sortedProducts}
        selectedRows={[]}
        setSelectedRows={() => {}}
        emptyMessage="No product details available for this receipt."
        searchAndFilterConfig={{ filterOptions: [] }}
        currentSearchTerm=""
        onSearchChange={() => {}}
        showFilters={false}
        onShowFiltersToggle={() => {}}
        currentFilterKey=""
        onFilterSelect={() => {}}
        totalRows={sortedProducts.length}
        rowsPerPage={rowsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSortRequest={handleSortRequest}
        sortConfig={sortConfig}
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