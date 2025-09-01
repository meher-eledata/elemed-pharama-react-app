import React, { useState, useMemo } from "react";
import { Box, Button, Tabs, Tab, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import "./OrderReceive.scss";
import { ReusableTable, TableColumn, FilterOption } from "../../components/PharmaTable";
import ReceiveSupplierModal from "../../components/Modal/ReceiveSupplier/ReceiveSupplierModal";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog"
import CommonModal from "../../components/CommonModal/CommonModal";
import ProductDetailsModalContent from "./ProductDetailsModalContent";

import {
  ORDER_RECEIVE_TITLE,
  ADD_RECEIVE_BUTTON,
  TAB_RECEIVE_HISTORY,
  TAB_CURRENT_ORDER,
} from "../../config/label/OrderReceive.labels";
import {
  ADD_BUTTON_COLOR,
  ADD_BUTTON_HOVER_COLOR,
  TAB_INDICATOR_STYLE,
} from "../../config/constants/OrderReceive.constants";

import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

// Define a new interface for a single product item
export interface ProductItem {
  productName: string;
  type: string;
  quantity: number;
  hsnCode: string;
  amount: number;
}

// Update the main interface to include an array of products
export interface OrderReceiveRow {
  reNo: string;
  poNo: string;
  supplier: string;
  received: string;
  status: string;
  reBy: string;
  amt: number;
  products: ProductItem[];
}

const OrderReceive: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterKey, setFilterKey] = useState<string>("poNo");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "", direction: 'asc' });

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [data, setData] = useState<OrderReceiveRow[]>([
    { 
      reNo: "RA7896", 
      poNo: "po5378", 
      supplier: "AA company", 
      received: "22/05/2025", 
      status: "Received", 
      reBy: "Username A", 
      amt: 25650,
      products: [{ productName: "aabbbc", type: "Capsule", quantity: 22, hsnCode: "AD45678", amount: 2400 }]
    },
    { 
      reNo: "RA7897", 
      poNo: "po5379", 
      supplier: "BB company", 
      received: "27/05/2025", 
      status: "Not Received", 
      reBy: "Username B", 
      amt: 6470,
      products: [{ productName: "bbbb", type: "Syrup", quantity: 5, hsnCode: "AD45678", amount: 1400 }]
    },
    { 
      reNo: "RA7898", 
      poNo: "po5380", 
      supplier: "CC company", 
      received: "21/05/2025", 
      status: "Received", 
      reBy: "Username C", 
      amt: 12000,
      products: [{ productName: "cccc", type: "Liquid", quantity: 15, hsnCode: "AD45678", amount: 5000 }]
    },
    { 
      reNo: "RA7899", 
      poNo: "po5381", 
      supplier: "DD company", 
      received: "23/05/2025", 
      status: "Not Received", 
      reBy: "Username D", 
      amt: 34500,
      products: [{ productName: "dddd", type: "Tablet", quantity: 30, hsnCode: "AD45678", amount: 2000 }]
    },
    { 
      reNo: "RA7900", 
      poNo: "po5382", 
      supplier: "EE company", 
      received: "26/05/2025", 
      status: "Received", 
      reBy: "Username E", 
      amt: 9800,
      products: [{ productName: "eeee", type: "Capsule", quantity: 10, hsnCode: "AD45678", amount: 800 }]
    },
    { 
      reNo: "RA7901", 
      poNo: "po5383", 
      supplier: "FF company", 
      received: "28/05/2025", 
      status: "Received", 
      reBy: "Username F", 
      amt: 50000,
      products: [
        { productName: "ffff", type: "Tablet", quantity: 15, hsnCode: "HSN-F1", amount: 10000 },
        { productName: "gggg", type: "Liquid", quantity: 5, hsnCode: "HSN-F2", amount: 5000 }
      ]
    },
    { 
      reNo: "RA7902", 
      poNo: "po5384", 
      supplier: "GG company", 
      received: "20/05/2025", 
      status: "Not Received", 
      reBy: "Username G", 
      amt: 7500,
      products: [{ productName: "hhhh", type: "Capsule", quantity: 8, hsnCode: "AD45678", amount: 2500 }]
    },
    { 
      reNo: "RA7903", 
      poNo: "po5385", 
      supplier: "HH company", 
      received: "25/05/2025", 
      status: "Received", 
      reBy: "Username H", 
      amt: 22000,
      products: [{ productName: "iiii", type: "Syrup", quantity: 20, hsnCode: "AD45678", amount: 12000 }]
    },
    { 
      reNo: "RA7904", 
      poNo: "po5386", 
      supplier: "II company", 
      received: "29/05/2025", 
      status: "Not Received", 
      reBy: "Username I", 
      amt: 15500,
      products: [{ productName: "jjjj", type: "Tablet", quantity: 12, hsnCode: "AD45678", amount: 3500 }]
    },
    { 
      reNo: "RA7905", 
      poNo: "po5387", 
      supplier: "JJ company", 
      received: "30/05/2025", 
      status: "Received", 
      reBy: "Username J", 
      amt: 6780,
      products: [{ productName: "kkkk", type: "Capsule", quantity: 7, hsnCode: "AD45678", amount: 1780 }]
    },
  ]);
  const [supplier, setSupplier] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderReceiveRow | null>(null);

  const handleEditClick = (row: OrderReceiveRow) => {
    setEditingRowId(row.reNo);
  };

  const handleSaveClick = (row: OrderReceiveRow) => {
    console.log("Saving data for row:", row);
    setEditingRowId(null);
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
  };

  const handleDeleteClick = (reNo: string) => {
    setRowToDeleteId(reNo);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (rowToDeleteId) {
      const newData = data.filter(row => row.reNo !== rowToDeleteId);
      setData(newData);
      setIsDeleteDialogOpen(false);
      setRowToDeleteId(null);
    }
  };

  const handleViewDetailsClick = (row: OrderReceiveRow) => {
    setSelectedProduct(row);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateProduct = (updatedProduct: OrderReceiveRow) => {
    setData(data.map(row => (row.reNo === updatedProduct.reNo ? updatedProduct : row)));
  };

  const handleDeleteProductFromModal = () => {
    if (selectedProduct) {
      const newData = data.filter(row => row.reNo !== selectedProduct.reNo);
      setData(newData);
      setIsDetailsModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof OrderReceiveRow];
        const bValue = b[sortConfig.key as keyof OrderReceiveRow];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const rowsPerPage = 5;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  const columns: TableColumn<OrderReceiveRow>[] = [
    {
      key: "reNo",
      header: "Receipt number",
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingRowId === row.reNo ? (
            <input type="text" value={row.reNo} style={{ width: '100%', boxSizing: 'border-box' }} />
          ) : (
            <>
              <span>{row.reNo}</span>
              <VisibilityIcon
                sx={{ fontSize: '18px', color: '#666', cursor: 'pointer' }}
                onClick={() => handleViewDetailsClick(row)}
              />
            </>
          )}
        </Box>
      )
    },
    {
      key: "poNo", header: "PO number", render: (row) => (
        editingRowId === row.reNo ? (
          <input type="text" value={row.poNo} style={{ width: '100%', boxSizing: 'border-box' }} />
        ) : (
          <span>{row.poNo}</span>
        )
      )
    },
    {
      key: "supplier", header: "Supplier name", render: (row) => (
        editingRowId === row.reNo ? (
          <input type="text" value={row.supplier} style={{ width: '100%', boxSizing: 'border-box' }} />
        ) : (
          <span>{row.supplier}</span>
        )
      )
    },
    {
      key: "received", header: "Received on", render: (row) => (
        editingRowId === row.reNo ? (
          <input type="text" value={row.received} style={{ width: '100%', boxSizing: 'border-box' }} />
        ) : (
          <span>{row.received}</span>
        )
      )
    },
    {
      key: "status", header: "Received status", render: (row) => (
        editingRowId === row.reNo ? (
          <input type="text" value={row.status} style={{ width: '100%', boxSizing: 'border-box' }} />
        ) : (
          <span>{row.status}</span>
        )
      )
    },
    {
      key: "reBy", header: "Received by", render: (row) => (
        editingRowId === row.reNo ? (
          <input type="text" value={row.reBy} style={{ width: '100%', boxSizing: 'border-box' }} />
        ) : (
          <span>{row.reBy}</span>
        )
      )
    },
    {
      key: "amt", header: "Total amount", render: (row) => (
        editingRowId === row.reNo ? (
          <input type="text" value={row.amt} style={{ width: '100%', boxSizing: 'border-box' }} />
        ) : (
          <span>{row.amt}</span>
        )
      )
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingRowId === row.reNo ? (
            <>
              <CheckCircleOutlineIcon sx={{ color: '#4CAF50', cursor: 'pointer' }} onClick={() => handleSaveClick(row)} />
              <CancelIcon sx={{ color: '#F44336', cursor: 'pointer' }} onClick={() => handleCancelClick()} />
              <DeleteIcon sx={{ color: '#666', cursor: 'pointer' }} onClick={() => handleDeleteClick(row.reNo)} />
            </>
          ) : (
            <EditIcon sx={{ color: '#666', cursor: 'pointer' }} onClick={() => handleEditClick(row)} />
          )}
        </Box>
      )
    }
  ];

  const filterOptions: FilterOption[] = [
    { key: "reNo", label: "Receipt number" },
    { key: "poNo", label: "PO No" },
    { key: "supplier", label: "Supplier" },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSortRequest = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <Box className="order-receive">
      <Box className="header">
        <Typography variant="h5" className="title">
          {ORDER_RECEIVE_TITLE}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          className="add-btn"
          sx={{
            backgroundColor: ADD_BUTTON_COLOR,
            "&:hover": { backgroundColor: ADD_BUTTON_HOVER_COLOR },
          }}
          onClick={() => setOpen(true)}
        >
          {ADD_RECEIVE_BUTTON}
        </Button>
      </Box>
      <Box className="tabs">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: TAB_INDICATOR_STYLE }}
        >
          <Tab label={TAB_RECEIVE_HISTORY} />
          <Tab label={TAB_CURRENT_ORDER} />
        </Tabs>
      </Box>
      <Box className="tab-content">
        <ReusableTable<OrderReceiveRow>
          columns={columns}
          data={paginatedData}
          searchAndFilterConfig={{ filterOptions }}
          currentSearchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters((prev) => !prev)}
          currentFilterKey={filterKey}
          onFilterSelect={setFilterKey}
          totalRows={data.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      </Box>
      <ReceiveSupplierModal
        open={open}
        onClose={() => setOpen(false)}
        supplier={supplier}
        setSupplier={setSupplier}
        onNext={() => {
          console.log("Selected Supplier:", supplier);
          setOpen(false);
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this record? This action cannot be undone."
      />

      <CommonModal
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Details of products"
        content={
          <ProductDetailsModalContent
            productData={selectedProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProductFromModal}
          />
        }
      />
    </Box>
  );
};

export default OrderReceive;