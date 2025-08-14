import React, { useState } from "react";
import { Box, Button, Tabs, Tab, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import "./OrderReceive.scss";
import { ReusableTable, TableColumn, FilterOption } from "../../components/PharmaTable";
import ReceiveSupplierModal from "../../components/Modal/ReceiveSupplier/ReceiveSupplierModal"// import modal

// constants & labels
import {
  ORDER_RECEIVE_TITLE,
  ADD_RECEIVE_BUTTON,
  TAB_CURRENT_ORDER,
  TAB_RECEIVE_HISTORY,
} from "../../config/label/OrderReceive.labels";

import {
  ADD_BUTTON_COLOR,
  ADD_BUTTON_HOVER_COLOR,
  TAB_INDICATOR_STYLE
} from "../../config/constants/OrderReceive.constants"

// ======================
// Types
// ======================
interface OrderReceiveRow {
  poNo: string;
  date: string;
  supplier: string;
  product: string;
  minimumQty: number;
}

const OrderReceive: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterKey, setFilterKey] = useState<string>("customer");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State for modal
  const [supplier, setSupplier] = useState("");

  // Table columns
  const columns: TableColumn<OrderReceiveRow>[] = [
    { key: "poNo", header: "PO No" },
    { key: "date", header: "Date" },
    { key: "supplier", header: "Supplier" },
    { key: "product", header: "Product" },
    { key: "minimumQty", header: "Minimum Qty" },
  ];

  // Table data
  const data: OrderReceiveRow[] = [
    { poNo: "2897655790...", date: "21 May, 2025", supplier: "2-0 Mersilk Syringe", product: "2-0 Mersilk Syringe", minimumQty: 5 },
    { poNo: "3289765764...", date: "2 Jun, 2025", supplier: "3-0 Mersilk 90cm NW 5...", product: "3-0 Mersilk 90cm NW 5...", minimumQty: 50 },
  ];

  const filterOptions: FilterOption[] = [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box className="order-receive">
      {/* HEADER */}
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
            "&:hover": { backgroundColor: ADD_BUTTON_HOVER_COLOR }
          }}
          onClick={() => setOpen(true)}
        >
          {ADD_RECEIVE_BUTTON}
        </Button>
      </Box>

      {/* TABS */}
      <Box className="tabs">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: TAB_INDICATOR_STYLE }}
        >
          <Tab label={TAB_CURRENT_ORDER} />
          <Tab label={TAB_RECEIVE_HISTORY} />
        </Tabs>
      </Box>

      {/* TAB CONTENT */}
      <Box className="tab-content">
        <ReusableTable<OrderReceiveRow>
          columns={columns}
          data={data}
          searchAndFilterConfig={{ filterOptions }}
          currentSearchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters(prev => !prev)}
          currentFilterKey={filterKey}
          onFilterSelect={setFilterKey}
          totalRows={data.length}
          rowsPerPage={5}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </Box>

      {/* MODAL */}
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
    </Box>
  );
};

export default OrderReceive;