import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, TextField, Divider, InputAdornment, Autocomplete, MenuItem, IconButton } from '@mui/material';
import { useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { orderLabels } from '../../config/label/OrderDetail.labels';
import { themeColors, typography } from '../../config/constants/OrderDetail.constants';
import TickMarkSvg from '../../assets/Right.svg';
import PlusIcon from "../../assets/PlusIcon.svg";
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import NewProductModal from '../../components/Modal/NewProduct/NewProductModal';
import DropDownIcon from '../../assets/DropDown.svg';
import LastModal from "../../components/Modal/lastOne/LastModal";
import { masterProducts, ProductMaster } from '../../data/masterData';

interface OrderDetailsProps {
    labels: typeof orderLabels;
}

export interface PharmaTableRow {
    productId: string;
    qtyReceived: number;
    qtyFree: number;
    batch: string;
    pp: number;
    sp: number;
    mrp: number;
    cgst: number;
    sgst: number;
    igst: number;
    disc: number | string;
    margPercent: number | string;
    salesDiscPercent: number | string;
    expiryDate: string;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ labels }) => {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "", direction: 'asc' });
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
    const [isLastModalOpen, setIsLastModalOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductMaster | null>(null);

    const selectedSupplier = (location.state as any)?.selectedSupplier || "";
    const selectedPO = (location.state as any)?.selectedPO || "";
    const [supplierName, setSupplierName] = useState<string>(selectedSupplier);
    const [poNumber, setPoNumber] = useState<string>(selectedPO);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const [pharmaTableData, setPharmaTableData] = useState<PharmaTableRow[]>([]);

    const handleSaveProduct = (newProduct: PharmaTableRow) => {
        setPharmaTableData(prevData => [...prevData, newProduct]);
        setIsLastModalOpen(false);
    };

    const handleEdit = (rowToEdit: PharmaTableRow) => {
        console.log('Edit clicked for:', rowToEdit.productId);
    };

    const handleDelete = (productIdToDelete: string) => {
        if (window.confirm(`Are you sure you want to delete product ID: ${productIdToDelete}?`)) {
            setPharmaTableData(prevData =>
                prevData.filter(row => row.productId !== productIdToDelete)
            );
        }
    };

    const pharmaTableColumns: TableColumn<PharmaTableRow>[] = [
        // The checkbox column is no longer needed here.
        { key: "productId", header: "Product ID", sortable: true, render: (row) => <span>{row.productId}</span> },
        { key: "qtyReceived", header: "Qty Received", sortable: true, render: (row) => <span>{row.qtyReceived}</span> },
        { key: "qtyFree", header: "Qty Free", sortable: true, render: (row) => <span>{row.qtyFree}</span> },
        { key: "batch", header: "Batch", render: (row) => <span>{row.batch}</span> },
        { key: "expiryDate", header: "Expiry Date", render: (row) => <span>{row.expiryDate}</span> },
        { key: "pp", header: "PP", render: (row) => <span>{row.pp}</span> },
        { key: "sp", header: "SP", render: (row) => <span>{row.sp}</span> },
        { key: "mrp", header: "MRP", render: (row) => <span>{row.mrp}</span> },
        { key: "cgst", header: "CGST", render: (row) => <span>{row.cgst}</span> },
        { key: "sgst", header: "SGST", render: (row) => <span>{row.sgst}</span> },
        { key: "igst", header: "IGST", render: (row) => <span>{row.igst}</span> },
        { key: "disc", header: "Disc", render: (row) => <span>{row.disc}</span> },
        { key: "margPercent", header: "Marg %", render: (row) => <span>{row.margPercent}</span> },
        { key: "salesDiscPercent", header: "Sales Disc %", render: (row) => <span>{row.salesDiscPercent}</span> },
        {
            key: "actions",
            header: "Actions",
            columnWidth: "10%",
            render: (row) => (
                <Box sx={{ display: 'flex', gap: '8px' }}>
                    <IconButton onClick={() => handleEdit(row)} sx={{ padding: 0 }}>
                        <EditIcon sx={{ color: '#4E5B6E', width: 24, height: 24 }} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(row.productId)} sx={{ padding: 0 }}>
                        <DeleteIcon sx={{ color: '#4E5B6E', width: 24, height: 24 }} />
                    </IconButton>
                </Box>
            )
        }
    ];

    const handleSortRequest = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...pharmaTableData];

        if (searchTerm.trim()) {
            const filterKey = "productId";
            sortableItems = sortableItems.filter(item => {
                const value = (item as any)[filterKey];
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof PharmaTableRow];
                const bValue = b[sortConfig.key as keyof PharmaTableRow];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [pharmaTableData, sortConfig, searchTerm]);

    const rowsPerPage = 5;
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, rowsPerPage]);

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0px' }} >
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: themeColors.textPrimary, fontSize: typography.headerSize }}>
                    {labels.orderDetails}
                </Typography>
                <Box sx={{ display: 'flex', gap: '12px' }}>
                    <Button variant="outlined" disableRipple sx={{ borderColor: themeColors.cancelButtonBorder, color: themeColors.cancelButtonBorder, backgroundColor: 'transparent', "&:hover": { backgroundColor: "transparent" }, "&:active": { backgroundColor: "transparent" }, "&:focusVisible": { backgroundColor: "transparent" }, height: '48px', width: '86px', borderRadius: '12px', fontFamily: 'Lexend', fontWeight: 500, fontSize: '12px', lineHeight: '24px', border: '2px solid' }}>
                        {labels.cancelButton}
                    </Button>
                    <Button variant="contained" sx={{ backgroundColor: '#5C17E5', borderRadius: '12px', width: '166px', height: '48px', fontFamily: 'Lexend', textTransform: 'none' }}>
                        <img src={TickMarkSvg} alt="Right Icon" style={{ width: '20px', height: '20px', marginRight: '2px' }} />
                        Order Received
                    </Button>
                </Box>
            </Box>
            <Divider sx={{ marginTop: '16px', border: '0.5px solid #CBD4E1' }} />

            <Box sx={{ display: 'flex', gap: '24px', marginTop: '10px' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '516px', gap: '4px', height: '48px' }}>
                    <Typography sx={{ fontFamily: 'Lexend', fontWeight: 500, fontSize: '12px', lineHeight: '18px', color: '#728197' }}>Supplier Name</Typography>
                    <TextField placeholder="Enter supplier name and GSTIN" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} variant="outlined" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', height: '48px', backgroundColor: '#F6F8FB', '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: '#9AA8BC' }, '&.Mui-focused fieldset': { borderColor: '#9AA8BC' } }, '& .MuiOutlinedInput-input': { padding: '12px 16px', fontFamily: 'Lexend', fontSize: '16px', lineHeight: '24px', color: '#1A212B' } }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '274px', gap: '4px' }}>
                    <Typography sx={{ fontFamily: 'Lexend', fontWeight: 500, fontSize: '12px', lineHeight: '18px', color: '#728197' }}>Invoice No</Typography>
                    <TextField select value={poNumber || '45788999'} onChange={(e) => setPoNumber(e.target.value)} variant="outlined" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', height: '48px', '& fieldset': { borderColor: '#9AA8BC' }, '&:hover fieldset': { borderColor: '#9AA8BC' }, '&.Mui-focused fieldset': { borderColor: '#9AA8BC' } }, '& .MuiOutlinedInput-input': { padding: '12px 16px', fontFamily: 'Lexend', fontSize: '16px', lineHeight: '24px', color: '#728197' } }} SelectProps={{ IconComponent: (props) => (<img {...props as any} src={DropDownIcon} alt="dropdown" style={{ width: 20, height: 20, pointerEvents: 'none' }} />) }}>
                        {poNumber && <MenuItem value={poNumber}>{poNumber}</MenuItem>}
                        <MenuItem value="45788999">45788999</MenuItem>
                        <MenuItem value="98765432">98765432</MenuItem>
                        <MenuItem value="12345678">12345678</MenuItem>
                    </TextField>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '274px', gap: '4px' }}>
                    <Typography sx={{ fontFamily: 'Lexend', fontWeight: 500, fontSize: '12px', lineHeight: '18px', color: '#525E6F' }}>Invoice Date</Typography>
                    <TextField variant="outlined" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', height: '48px', '& fieldset': { borderColor: '#9AA8BC' }, '&:hover fieldset': { borderColor: '#9AA8BC' }, '&.Mui-focused fieldset': { borderColor: '#9AA8BC' } }, '& .MuiOutlinedInput-input': { padding: '12px 16px', fontFamily: 'Lexend', fontSize: '16px', lineHeight: '24px' } }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '275px', gap: '4px' }}>
                    <Typography sx={{ fontFamily: 'Lexend', fontWeight: 500, fontSize: '12px', lineHeight: '18px', color: '#525E6F' }}>Credit</Typography>
                    <TextField variant="outlined" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', height: '48px', '& fieldset': { borderColor: '#9AA8BC' }, '&:hover fieldset': { borderColor: '#9AA8BC' }, '&.Mui-focused fieldset': { borderColor: '#9AA8BC' } }, '& .MuiOutlinedInput-input': { padding: '12px 16px', fontFamily: 'Lexend', fontSize: '16px', lineHeight: '24px' } }} />
                </Box>
            </Box>
            <Divider sx={{ marginTop: '10px', border: '0.3px solid #CBD4E14D' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '24px', marginBottom: '24px', gap: '16px', width: '100%' }}>
                <Autocomplete
                    disablePortal
                    id="find-product-autocomplete"
                    options={masterProducts}
                    getOptionLabel={(option) => option.productName}
                    sx={{ width: '344px', height: '48px', '& .MuiOutlinedInput-root': { height: '48px', borderRadius: '12px', padding: '12px 16px', backgroundColor: '#FFFFFF', border: '1px solid #9AA8BC' }, '& .MuiInputBase-input': { padding: 0, fontFamily: 'Lexend', fontSize: '16px', fontWeight: 400, lineHeight: '24px', color: '#728197' } }}
                    onChange={(event, newValue) => {
                        setSelectedProduct(newValue);
                        if (newValue) {
                            setIsLastModalOpen(true);
                        } else {
                            setIsLastModalOpen(false);
                        }
                    }}
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Find Product" InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#728197', width: '24px', height: '24px' }} /></InputAdornment>) }} />
                    )}
                />
                <Button sx={{ height: '48px', borderRadius: '12px', border: 'none', backgroundColor: '#FFFFFF', padding: '12px 16px', gap: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'none', fontFamily: 'Lexend', fontWeight: 500, fontSize: '16px', lineHeight: '24px', color: '#27313F', whiteSpace: 'nowrap', minWidth: 'fit-content', '&:hover': { backgroundColor: '#FFFFFF', boxShadow: 'none' } }} onClick={() => setIsNewProductModalOpen(true)}>
                    <img src={PlusIcon} alt="Add Product" style={{ width: '20px', height: '20px' }} />
                    Add Product
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1, height: '24px', padding: '0px', gap: '8px' }}>
                    <Typography variant="body1" sx={{ fontFamily: 'Lexend', fontWeight: 500, fontSize: '14px', lineHeight: '24px', color: '#728197', whiteSpace: 'nowrap' }}>
                        No. Of. Items: {pharmaTableData.length}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ marginTop: '24px' }}>
                <ReusableTable<PharmaTableRow>
                    columns={pharmaTableColumns}
                    data={paginatedData}
                    searchAndFilterConfig={{ filterOptions: [{ key: 'productId', label: 'Product ID' }, { key: 'batch', label: 'Batch' }] }}
                    currentSearchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    showFilters={false}
                    onShowFiltersToggle={() => { }}
                    currentFilterKey={""}
                    onFilterSelect={() => { }}
                    totalRows={sortedData.length}
                    rowsPerPage={rowsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onSortRequest={handleSortRequest}
                    sortConfig={sortConfig}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                />
            </Box>

            <LastModal
                open={isLastModalOpen}
                onClose={() => {
                    setIsLastModalOpen(false);
                }}
                onSave={handleSaveProduct}
                productName={selectedProduct?.productName}
                gstinCode={selectedProduct?.gstinCode}
                hsnCode={selectedProduct?.hsnCode}
                discountPercentage={selectedProduct?.discountPercentage}
                availableItems={selectedProduct?.availableItems}
            />

            <NewProductModal open={isNewProductModalOpen} onClose={() => setIsNewProductModalOpen(false)} />
        </>
    );
};

export default OrderDetails;