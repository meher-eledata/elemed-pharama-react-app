import React, { useState } from "react";
import { Grid, Typography, Box, Skeleton } from "@mui/material";
import SummaryCard from "./SummaryCard";
import CommonModal from "../../../components/CommonModal/CommonModal";
import {
    useGetInvoiceStatsQuery,
    useGetInventoryByDateQuery,
} from "../../../redux/slices/dashboardApi";
import { ReusableTable, TableColumn } from "../../PharmaTable/index";

interface ModalItem {
    product_id: string;
    name: string;
    batchNumber: string;
    currentQuantity: number;
    minQty: number;
    maxQty: number;
    expiryDate: string;
    activityDate: string;
}

interface InventoryMetricsCardProps {
    dateRange: {
        startDate: string | null;
        endDate: string | null;
    };
}

const InventoryMetrics: React.FC<InventoryMetricsCardProps> = ({ dateRange }) => {
    const {
        data: invoiceStats,
        isLoading: isInvoiceStatsLoading,
        error: invoiceStatsError,
    } = useGetInvoiceStatsQuery(dateRange);

    const {
        data: inventoryStats,
        isLoading: isInventoryStatsLoading,
        error: inventoryStatsError,
    } = useGetInventoryByDateQuery(dateRange);

    const isLoading = isInvoiceStatsLoading || isInventoryStatsLoading;
    const error = invoiceStatsError || inventoryStatsError;

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalData, setModalData] = useState<any[]>([]);

    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    }>({
        key: "",
        direction: "asc",
    });

    const handleOpenModal = (title: string, items: ModalItem[]) => {
        setModalTitle(title);
        setModalData(items || []);
        setModalOpen(true);
    };

    const onSortRequest = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedModalData = [...modalData].sort((a, b) => {
        if (sortConfig.key) {
            const aValue = a[sortConfig.key as keyof ModalItem];
            const bValue = b[sortConfig.key as keyof ModalItem];

            if (typeof aValue === "string" && typeof bValue === "string") {
                return sortConfig.direction === "asc"
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
            }
        }
        return 0;
    });

    if (isLoading) {
        return (
            <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                        <Skeleton variant="rectangular" height={150} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography color="error">Failed to load dashboard data.</Typography>
            </Box>
        );
    }

    const cards = [
        {
            title: "Low Stock Items",
            value: inventoryStats?.belowMinProducts?.length ?? 0,
            actionText: "View Items",
            disabled: (inventoryStats?.belowMinProducts?.length ?? 0) === 0, // 👈 disable if 0
            onActionClick: () =>
                handleOpenModal("Low Stock Items", inventoryStats?.belowMinProducts || []),
        },
        {
            title: "Excess Stock",
            value: inventoryStats?.aboveMaxProducts?.length ?? 0,
            actionText: "View Items",
            disabled: (inventoryStats?.aboveMaxProducts?.length ?? 0) === 0, // 👈 disable if 0
            onActionClick: () =>
                handleOpenModal("Excess Stock", inventoryStats?.aboveMaxProducts || []),
        },
        {
            title: "Expired Stock",
            value: inventoryStats?.expiredProducts?.length ?? 0,
            actionText: "View Items",
            disabled: (inventoryStats?.expiredProducts?.length ?? 0) === 0, // 👈 disable if 0
            onActionClick: () =>
                handleOpenModal("Expired Stock", inventoryStats?.expiredProducts || []),
        },
        {
            title: "Latest Batch Received",
            content: invoiceStats?.latestBatchReceivedOn
                ? new Date(invoiceStats.latestBatchReceivedOn).toLocaleDateString()
                : "N/A",
        },
        {
            title: "% of Return",
            content: `${invoiceStats?.returns || 0}%`,
        },
        {
            title: "Days With Active Sales (MTD)",
            content: `${invoiceStats?.activeSalesDays || 0} Days`,
        },
    ];

    const columns: TableColumn<any>[] = [
        { key: "product_id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "batchNumber", header: "Batch No" },
        { key: "currentQuantity", header: "Quantity" },
        { key: "minQty", header: "Min Qty" },
        { key: "maxQty", header: "Max Qty" },
        {
            key: "expiryDate",
            header: "Expiry",
            render: (item) =>
                item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A",
        },
        {
            key: "activityDate",
            header: "Activity Date",
            render: (item) =>
                item.activityDate ? new Date(item.activityDate).toLocaleString() : "N/A",
        },
    ];

    return (
        <>
            <Grid container spacing={2}>
                {cards.map((card, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                        <SummaryCard {...card} />
                    </Grid>
                ))}
            </Grid>
            <CommonModal
                open={modalOpen}
                title={modalTitle}
                onClose={() => setModalOpen(false)}
                content={
                    <ReusableTable
                        columns={columns}
                        data={sortedModalData}
                        emptyMessage="No items found"
                        searchAndFilterConfig={{
                            filterOptions: [],
                        }}
                        currentSearchTerm=""
                        onSearchChange={() => { }}
                        showFilters={false}
                        onShowFiltersToggle={() => { }}
                        currentFilterKey=""
                        onFilterSelect={() => { }}
                        totalRows={modalData.length}
                        rowsPerPage={10}
                        currentPage={1}
                        onPageChange={() => { }}
                        onSortRequest={onSortRequest}
                        sortConfig={sortConfig}
                    />
                }
            />
        </>
    );
};

export default InventoryMetrics;
