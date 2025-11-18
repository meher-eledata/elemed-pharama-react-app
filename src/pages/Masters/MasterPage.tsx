import React, { useState, useMemo } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { StandardButton } from "../../components/Common";
import AddIcon from "@mui/icons-material/Add";
import {
  ADD_BUTTON_COLOR,
  ADD_BUTTON_HOVER_COLOR,
  TAB_INDICATOR_STYLE,
} from "../../config/constants/OrderReceive.constants";
import {
  ReusableTable,
  TableColumn,
  FilterOption,
} from "../../components/PharmaTable";


interface OrderReceiveRow {
  poNo: string;
  date: string;
  supplier: string;
  product: string;
  minimumQty: number;
}

const Masterpage: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

//   const [activeTab, setActiveTab] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterKey, setFilterKey] = useState<string>("poNo");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "poNo", direction: "asc" });

  const columns: TableColumn<OrderReceiveRow>[] = [
    { key: "poNo", header: "PO No" },
    { key: "date", header: "Date" },
    { key: "supplier", header: "Supplier" },
    { key: "product", header: "Product" },
    { key: "minimumQty", header: "Minimum Qty" },
  ];

  const handleSortRequest = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      // Revert to default sorting instead of clearing
      setSortConfig({ key: "poNo", direction: "asc" });
      return;
    }
    setSortConfig({ key, direction });
  };

  const data: OrderReceiveRow[] = [
    {
      poNo: "2897655790...",
      date: "21 May, 2025",
      supplier: "2-0 Mersilk Syringe",
      product: "2-0 Mersilk Syringe",
      minimumQty: 5,
    },
    {
      poNo: "3289765764...",
      date: "2 Jun, 2025",
      supplier: "3-0 Mersilk 90cm NW 5...",
      product: "3-0 Mersilk 90cm NW 5...",
      minimumQty: 50,
    },
  ];

  // Apply sorting to data
  const sortedData = useMemo(() => {
    // Always apply sorting - if no specific sort, use default
    const currentSort = sortConfig.key || 'poNo';
    const currentDirection = sortConfig.key ? sortConfig.direction : 'asc';
    
    return [...data].sort((a, b) => {
      const aValue = a[currentSort as keyof OrderReceiveRow];
      const bValue = b[currentSort as keyof OrderReceiveRow];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return currentDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return currentDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const filterOptions: FilterOption[] = [
    { key: "poNo", label: "PO No" },
    { key: "date", label: "Date", type: "date" },
    { key: "supplier", label: "Supplier" },
    { key: "product", label: "Product" },
    { key: "minimumQty", label: "Minimum Qty", type: "number" },
  ];

  return (
    <Box sx={{fontFamily: "'Lexend', sans-serif"}}>
      <Box
        className="header"
        sx={{ display: "flex", justifyContent: "space-between", padding:'0px 18px', }}
      >
        <Typography
          variant="h5"
          sx={{ fontFamily: "'Lexend', sans-serif", fontWeight: "600", fontSize: "36px" }}
        >
          Products
        </Typography>

        <StandardButton
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          variant="primary"
          size="large"
        >
          Add Product
        </StandardButton>
      </Box>
      <Box className="tab-content" sx={{
          fontFamily: "'Lexend', sans-serif",
          "& .MuiTableCell-root": {
            fontFamily: "'Lexend', sans-serif", // ✅ force table cells to use Lexend
          },
        }}>
        <ReusableTable<OrderReceiveRow > 
          columns={columns}
          data={sortedData}
          searchAndFilterConfig={{ filterOptions }}
          currentSearchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          showFilters={showFilters}
          onShowFiltersToggle={() => setShowFilters((prev) => !prev)}
          currentFilterKey={filterKey}
          onFilterSelect={setFilterKey}
          totalRows={sortedData.length}
          rowsPerPage={5}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
          selectedRows={selectedRows}         
      setSelectedRows={setSelectedRows}

          
        />
      </Box>
    </Box>
  );
};

export default Masterpage;