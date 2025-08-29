import React, { useState } from "react";
import { Box, Button, Tabs, Tab, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import "./OrderReceive.scss";
import { ReusableTable, TableColumn, FilterOption } from "../../components/PharmaTable";
import ReceiveSupplierModal from "../../components/Modal/ReceiveSupplier/ReceiveSupplierModal";
import ConfirmationDialog from "../../components/DeleteDialogue/ConfirmationDialog"
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

export interface OrderReceiveRow {
  reNo: string;
  poNo: string;
  supplier: string;
  received: string;
  status: string;
  reBy: string;
  amt: number;
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
    { reNo: "RA7896", poNo: "po5378", supplier: "AA company", received: "22/05/2025", status: "Received", reBy: "Username A", amt: 25650 },
    { reNo: "RA7897", poNo: "po5379", supplier: "BB company", received: "27/05/2025", status: "Not Received", reBy: "Username B", amt: 6470 },
  ]);
  const [supplier, setSupplier] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [rowToDeleteId, setRowToDeleteId] = useState<string | null>(null);

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
              <VisibilityIcon sx={{ fontSize: '18px', color: '#666', cursor: 'pointer' }} />
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
          data={data}
          searchAndFilterConfig={{ filterOptions }}
          currentSearchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters((prev) => !prev)}
          currentFilterKey={filterKey}
          onFilterSelect={setFilterKey}
          totalRows={data.length}
          rowsPerPage={5}
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
    </Box>
  );
};

export default OrderReceive;