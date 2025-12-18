import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { StandardButton } from "../../components/Common";
import InventoryIcon from '@mui/icons-material/Inventory';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import NewProductModal from "../../components/Modal/NewProduct/NewProductModal";
import CustomerModal from "../../components/Modal/NewCustomer/CustomerModal";
import NewSupplierModal from "../../components/Modal/NewSupplier/NewSupplierModal";
import { MASTER_DATA_CONSTANTS } from "../../config/constants/MasterData.constants";
import { MASTER_DATA_LABELS } from "../../config/label/MasterData.labels";
import {
  useGetSalesProductsQuery,
  useGetCustomersQuery,
  useGetDoctorNamesQuery,
  useAddCustomerMutation
} from "../../redux/slices/salesApi";
import { useGetUniqueSupplierNamesQuery } from "../../redux/slices/receiveApi";

interface CardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: string;
  onAction: () => void;
  iconBgColor: string;
  count: number;
  badgeLabel: string;
}

const Card: React.FC<CardProps> = ({ icon, title, desc, action, onAction, iconBgColor, count, badgeLabel }) => (
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

    <Box sx={{ mt: 'auto', pt: 1 }}>
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
    </Box>
  </Box>
);

const Masterpage: React.FC = () => {
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  const { data: products = [], isLoading: loadingProducts } = useGetSalesProductsQuery();
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomersQuery();
  const { data: doctorNames = [], isLoading: loadingDoctors } = useGetDoctorNamesQuery();
  const { data: supplierNames = [], isLoading: loadingSuppliers } = useGetUniqueSupplierNamesQuery();

  const [addCustomer] = useAddCustomerMutation();

  const productCount = products.length;
  const customerCount = customers.length;
  const doctorCount = doctorNames.length;
  const supplierCount = supplierNames.length;

  const handleCustomerSubmit = async (customerData: any) => {
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
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

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
          maxWidth: { xs: '100%', md: '1050px', lg: '1600px' },
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
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.PRODUCT}
          count={loadingProducts ? 0 : productCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.PRODUCT.BADGE_LABEL}
        />

        <Card
          icon={<PersonAddIcon />}
          title={MASTER_DATA_LABELS.CARDS.CUSTOMER.TITLE}
          desc={MASTER_DATA_LABELS.CARDS.CUSTOMER.DESC}
          action={MASTER_DATA_LABELS.CARDS.CUSTOMER.ACTION}
          onAction={() => setCustomerModalOpen(true)}
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.CUSTOMER}
          count={loadingCustomers ? 0 : customerCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.CUSTOMER.BADGE_LABEL}
        />

        <Card
          icon={<LocalShippingIcon />}
          title={MASTER_DATA_LABELS.CARDS.SUPPLIER.TITLE}
          desc={MASTER_DATA_LABELS.CARDS.SUPPLIER.DESC}
          action={MASTER_DATA_LABELS.CARDS.SUPPLIER.ACTION}
          onAction={() => setSupplierModalOpen(true)}
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.SUPPLIER}
          count={loadingSuppliers ? 0 : supplierCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.SUPPLIER.BADGE_LABEL}
        />

        <Card
          icon={<MedicalServicesIcon />}
          title={MASTER_DATA_LABELS.CARDS.DOCTOR.TITLE}
          desc={MASTER_DATA_LABELS.CARDS.DOCTOR.DESC}
          action={MASTER_DATA_LABELS.CARDS.DOCTOR.ACTION}
          onAction={() => {
          }}
          iconBgColor={MASTER_DATA_CONSTANTS.ICON_COLORS.DOCTOR}
          count={loadingDoctors ? 0 : doctorCount}
          badgeLabel={MASTER_DATA_LABELS.CARDS.DOCTOR.BADGE_LABEL}
        />
      </Box>

      <NewProductModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onProductAdded={() => {
          setProductModalOpen(false);
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
        onSubmit={async (supplierData) => {
          try {
            // TODO: Add API call to add supplier
            // await addSupplier({ ... }).unwrap();
            setSupplierModalOpen(false);
          } catch (error) {
            console.error('Error adding supplier:', error);
            throw error;
          }
        }}
      />
    </Box>
  );
};

export default Masterpage;
