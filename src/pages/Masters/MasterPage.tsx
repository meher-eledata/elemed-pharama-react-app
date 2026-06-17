import React, { useState, useCallback } from "react";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { StandardButton } from "../../components/Common";
import InventoryIcon from '@mui/icons-material/Inventory';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import NewProductModal from "../../components/Modal/NewProduct/NewProductModal";
import CustomerModal from "../../components/Modal/NewCustomer/CustomerModal";
import NewSupplierModal from "../../components/Modal/NewSupplier/NewSupplierModal";
import NewDoctorModal from "../../components/Modal/NewDoctor/NewDoctorModal";
import { MASTER_DATA_CONSTANTS } from "../../config/constants/MasterData.constants";
import { MASTER_DATA_LABELS } from "../../config/label/MasterData.labels";
import { MASTER_VIEW_LABELS } from "../../config/label/MasterView.labels";
import type { MasterCategory } from "../../config/constants/MasterView.constants";
import MasterViewModal from "./components/MasterViewModal";
import {
  useAddCustomerMutation
} from "../../redux/slices/salesApi";
import {
  useGetMasterCountsQuery,
  useAddSupplierMutation,
  useAddDoctorMutation,
  useGetCustomersQuery,
  useGetSuppliersQuery,
  useGetProductsQuery,
  useGetDoctorsQuery,
  useUpdateCustomerMutation,
  useUpdateSupplierMutation,
  useUpdateProductMutation,
  useUpdateDoctorMutation,
} from "../../redux/slices/masterApi";

interface CardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: string;
  onAction: () => void;
  onView: () => void;
  iconBgColor: string;
  count: number;
  badgeLabel: string;
}

const Card: React.FC<CardProps> = ({ icon, title, desc, action, onAction, onView, iconBgColor, count, badgeLabel }) => (
  <Box
    sx={{
      borderRadius: MASTER_DATA_CONSTANTS.CARDS.RADIUS,
      border: MASTER_DATA_CONSTANTS.CARDS.BORDER,
      backgroundColor: MASTER_DATA_CONSTANTS.CARDS.BG,
      padding: MASTER_DATA_CONSTANTS.CARDS.PADDING,
      boxShadow: MASTER_DATA_CONSTANTS.CARDS.SHADOW,
      display: 'flex',
      flexDirection: 'column',
      gap: MASTER_DATA_CONSTANTS.CARDS.GAP,
      flex: 1,
      minWidth: MASTER_DATA_CONSTANTS.CARDS.MIN_WIDTH,
      maxWidth: MASTER_DATA_CONSTANTS.CARDS.MAX_WIDTH,
      position: 'relative',
    }}
  >

    <Box
      sx={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        borderRadius: MASTER_DATA_CONSTANTS.BADGE.RADIUS,
        padding: MASTER_DATA_CONSTANTS.BADGE.PADDING,
        backgroundColor: MASTER_DATA_CONSTANTS.BADGE.BG,
        color: MASTER_DATA_CONSTANTS.BADGE.TEXT_COLOR,
        fontSize: MASTER_DATA_CONSTANTS.BADGE.FONT_SIZE,
        fontWeight: MASTER_DATA_CONSTANTS.BADGE.FONT_WEIGHT,
        fontFamily: "'Lexend', sans-serif",
      }}
    >
      {count} {badgeLabel}
    </Box>

    <Box
      sx={{
        width: MASTER_DATA_CONSTANTS.CARDS.ICON_CIRCLE_SIZE,
        height: MASTER_DATA_CONSTANTS.CARDS.ICON_CIRCLE_SIZE,
        borderRadius: '50%',
        backgroundColor: iconBgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1,
      }}
    >
      <Box sx={{ color: '#5C17E5' }}>
        {icon}
      </Box>
    </Box>

    <Typography
      sx={{
        fontWeight: 700,
        color: MASTER_DATA_CONSTANTS.CARDS.TITLE_COLOR,
        fontSize: '18px',
        fontFamily: "'Lexend', sans-serif",
        pr: 8,
      }}
    >
      {title}
    </Typography>

    <Typography
      sx={{
        color: MASTER_DATA_CONSTANTS.CARDS.DESC_COLOR,
        fontSize: '14px',
        lineHeight: 1.5,
        fontFamily: "'Lexend', sans-serif",
        pr: 8,
      }}
    >
      {desc}
    </Typography>

    <Box sx={{ mt: 'auto', pt: 1, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      <StandardButton
        onClick={onAction}
        variant="primary"
        size="medium"
        sx={{
          height: MASTER_DATA_CONSTANTS.ACTION_BUTTON.HEIGHT,
          minWidth: MASTER_DATA_CONSTANTS.ACTION_BUTTON.MIN_WIDTH,
          borderRadius: MASTER_DATA_CONSTANTS.ACTION_BUTTON.RADIUS,
          backgroundColor: MASTER_DATA_CONSTANTS.ACTION_BUTTON.BG,
          color: MASTER_DATA_CONSTANTS.ACTION_BUTTON.COLOR,
          fontWeight: MASTER_DATA_CONSTANTS.ACTION_BUTTON.FONT_WEIGHT,
          fontSize: MASTER_DATA_CONSTANTS.ACTION_BUTTON.FONT_SIZE,
          '&:hover': { backgroundColor: MASTER_DATA_CONSTANTS.ACTION_BUTTON.HOVER_BG },
        }}
      >
        {action}
      </StandardButton>
      <StandardButton
        onClick={onView}
        variant="secondary"
        size="medium"
        sx={{
          height: MASTER_DATA_CONSTANTS.ACTION_BUTTON.HEIGHT,
          minWidth: MASTER_DATA_CONSTANTS.ACTION_BUTTON.MIN_WIDTH,
          borderRadius: MASTER_DATA_CONSTANTS.ACTION_BUTTON.RADIUS,
          fontWeight: MASTER_DATA_CONSTANTS.ACTION_BUTTON.FONT_WEIGHT,
          fontSize: MASTER_DATA_CONSTANTS.ACTION_BUTTON.FONT_SIZE,
        }}
      >
        {MASTER_VIEW_LABELS.VIEW_ACTION}
      </StandardButton>
    </Box>
  </Box>
);

const Masterpage: React.FC = () => {
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Which category's view/edit table is open (null = none).
  const [viewCategory, setViewCategory] = useState<MasterCategory | null>(null);

  const { data: masterCounts, isLoading: loadingCounts } = useGetMasterCountsQuery();
  const [addCustomer] = useAddCustomerMutation();
  const [addSupplier] = useAddSupplierMutation();
  const [addDoctor] = useAddDoctorMutation();

  // List queries — only fetch when that category's view modal is open.
  const customersQuery = useGetCustomersQuery(undefined, { skip: viewCategory !== 'customer' });
  const suppliersQuery = useGetSuppliersQuery(undefined, { skip: viewCategory !== 'supplier' });
  const productsQuery = useGetProductsQuery(undefined, { skip: viewCategory !== 'product' });
  const doctorsQuery = useGetDoctorsQuery(undefined, { skip: viewCategory !== 'doctor' });

  // Update mutations.
  const [updateCustomer] = useUpdateCustomerMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [updateDoctor] = useUpdateDoctorMutation();

  const productCount = masterCounts?.products ?? 0;
  const customerCount = masterCounts?.customers ?? 0;
  const doctorCount = masterCounts?.doctors ?? 0;
  const supplierCount = masterCounts?.suppliers ?? 0;

  const handleCustomerSubmit = useCallback(async (customerData: any) => {
    try {
      await addCustomer({
        name: customerData.customerName,
        email: customerData.emailId || null,
        phone: customerData.mobileNumber,
        billing_address: customerData.billingAddress,
        shipping_address: customerData.shippingAddress || null,
        gstin: customerData.gstin || null,
        pancard_num: customerData.pancardNum || null,
        drug_license: customerData.drugLicense || null,
        gender: customerData.gender === 'Male' ? 0 : customerData.gender === 'Female' ? 1 : null,
      }).unwrap();
      setCustomerModalOpen(false);
      setSnackbarMessage(`Customer "${customerData.customerName}" created successfully!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding customer:', error);
      setSnackbarMessage('Failed to add customer. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      throw error;
    }
  }, [addCustomer]);

  const handleSupplierSubmit = useCallback(async (supplierData: any) => {
    try {
      await addSupplier({
        supplier_name: supplierData.supplierName,
        supplier_code: supplierData.supplierCode,
        contact_name: supplierData.contactName,
        address: supplierData.address,
        city: supplierData.city,
        state: supplierData.state,
        pin: supplierData.pin,
        country: supplierData.country,
        phone_number: supplierData.phoneNumber,
        gst_number: supplierData.gstin || '',
        cst_number: supplierData.cstNumber || '',
        notes: supplierData.tinNumber || '',
      }).unwrap();
      setSupplierModalOpen(false);
      setSnackbarMessage(`Supplier "${supplierData.supplierName}" added successfully!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding supplier:', error);
      setSnackbarMessage('Failed to add supplier. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      throw error;
    }
  }, [addSupplier]);

  const handleDoctorSubmit = useCallback(async (doctorData: any) => {
    try {
      const doctorPayload: any = {
        doctor_name: doctorData.doctorName,
        contact_name: doctorData.doctorName, // Using doctor name as contact name
        address: doctorData.branch || '',
        city: '',
        state: '',
        pin: '',
        country: '',
        phone_number: doctorData.mobileNumber || '',
        gst_number: '',
        cst_number: '',
        notes: doctorData.role || '',
      };

      // Only include email if it has a value
      if (doctorData.email && doctorData.email.trim()) {
        doctorPayload.email = doctorData.email.trim();
      }

      await addDoctor(doctorPayload).unwrap();
      setDoctorModalOpen(false);
      setSnackbarMessage(`Doctor "${doctorData.doctorName}" added successfully!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding doctor:', error);
      setSnackbarMessage('Failed to add doctor. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      throw error;
    }
  }, [addDoctor]);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: '24px',
      paddingTop: '12px',
      overflow: 'hidden',
      fontFamily: "'Lexend', sans-serif",
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      <Box sx={{ mb: -1, mt: -1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: '32px',
            color: '#1A212B',
            fontFamily: "'Lexend', sans-serif",
            mb: 1
          }}
        >
          {MASTER_DATA_LABELS.PAGE_TITLE}
        </Typography>
        <Typography
          sx={{
            color: '#1A212B',
            fontSize: '16px',
            fontFamily: "'Lexend', sans-serif",
            fontWeight: 400
          }}
        >
          {MASTER_DATA_LABELS.SUBTITLE}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: { xs: 2, md: 3 },
          rowGap: { xs: 2, md: 3 },
          alignItems: 'stretch',
          maxWidth: { xs: '100%', md: '65.625rem', lg: '100rem' }, // 1050px = 65.625rem, 1600px = 100rem
          marginLeft: 0,
          marginRight: 'auto',
        }}
      >
        <Card
          icon={<InventoryIcon />}
          title={MASTER_DATA_LABELS.CARDS.PRODUCT.TITLE}
          desc={MASTER_DATA_LABELS.CARDS.PRODUCT.DESC}
          action={MASTER_DATA_LABELS.CARDS.PRODUCT.ACTION}
          onAction={() => setProductModalOpen(true)}
          onView={() => setViewCategory('product')}
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.PRODUCT}
          count={loadingCounts ? 0 : productCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.PRODUCT.BADGE_LABEL}
        />

        <Card
          icon={<PersonAddIcon />}
          title={MASTER_DATA_LABELS.CARDS.CUSTOMER.TITLE}
          desc={MASTER_DATA_LABELS.CARDS.CUSTOMER.DESC}
          action={MASTER_DATA_LABELS.CARDS.CUSTOMER.ACTION}
          onAction={() => setCustomerModalOpen(true)}
          onView={() => setViewCategory('customer')}
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.CUSTOMER}
          count={loadingCounts ? 0 : customerCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.CUSTOMER.BADGE_LABEL}
        />

        <Card
          icon={<LocalShippingIcon />}
          title={MASTER_DATA_LABELS.CARDS.SUPPLIER.TITLE}
          desc={MASTER_DATA_LABELS.CARDS.SUPPLIER.DESC}
          action={MASTER_DATA_LABELS.CARDS.SUPPLIER.ACTION}
          onAction={() => setSupplierModalOpen(true)}
          onView={() => setViewCategory('supplier')}
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.SUPPLIER}
          count={loadingCounts ? 0 : supplierCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.SUPPLIER.BADGE_LABEL}
        />

        <Card
          icon={<MedicalServicesIcon />}
          title={MASTER_DATA_LABELS.CARDS.DOCTOR.TITLE}
          desc={MASTER_DATA_LABELS.CARDS.DOCTOR.DESC}
          action={MASTER_DATA_LABELS.CARDS.DOCTOR.ACTION}
          onAction={() => setDoctorModalOpen(true)}
          onView={() => setViewCategory('doctor')}
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.DOCTOR}
          count={loadingCounts ? 0 : doctorCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.DOCTOR.BADGE_LABEL}
        />
      </Box>

      <NewProductModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onProductAdded={() => {
          setProductModalOpen(false);
          setSnackbarMessage('Product added successfully!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }}
      />

      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSubmit={handleCustomerSubmit}
      />

      <NewSupplierModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSubmit={handleSupplierSubmit}
      />

      <NewDoctorModal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        onSubmit={handleDoctorSubmit}
      />

      <MasterViewModal
        open={viewCategory === 'customer'}
        category="customer"
        rows={(customersQuery.data ?? []) as unknown as Record<string, unknown>[]}
        isLoading={customersQuery.isLoading || customersQuery.isFetching}
        isError={customersQuery.isError}
        onClose={() => setViewCategory(null)}
        onUpdate={(body) => updateCustomer(body as any).unwrap()}
      />

      <MasterViewModal
        open={viewCategory === 'supplier'}
        category="supplier"
        rows={(suppliersQuery.data ?? []) as unknown as Record<string, unknown>[]}
        isLoading={suppliersQuery.isLoading || suppliersQuery.isFetching}
        isError={suppliersQuery.isError}
        onClose={() => setViewCategory(null)}
        onUpdate={(body) => updateSupplier(body as any).unwrap()}
      />

      <MasterViewModal
        open={viewCategory === 'product'}
        category="product"
        rows={(productsQuery.data ?? []) as unknown as Record<string, unknown>[]}
        isLoading={productsQuery.isLoading || productsQuery.isFetching}
        isError={productsQuery.isError}
        onClose={() => setViewCategory(null)}
        onUpdate={(body) => updateProduct(body as any).unwrap()}
      />

      <MasterViewModal
        open={viewCategory === 'doctor'}
        category="doctor"
        rows={(doctorsQuery.data ?? []) as unknown as Record<string, unknown>[]}
        isLoading={doctorsQuery.isLoading || doctorsQuery.isFetching}
        isError={doctorsQuery.isError}
        onClose={() => setViewCategory(null)}
        onUpdate={(body) => updateDoctor(body as any).unwrap()}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Masterpage;
