import React from 'react';
import { Box, Typography } from '@mui/material';
import { StandardButton } from '../../components/Common';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import InventoryIcon from '@mui/icons-material/Inventory';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import { selectActiveModules, selectOrgLoaded } from '../../redux/slices/orgSlice';
import { ADMIN_LABELS } from '../../config/label/Admin.labels';
import { ADMIN_CONSTANTS } from '../../config/constants/Admin.constants';

interface CardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: string;
  onAction: () => void;
  iconBgColor: string;
}

const Card: React.FC<CardProps> = ({ icon, title, desc, action, onAction, iconBgColor }) => (
  <Box
    sx={{
      borderRadius: ADMIN_CONSTANTS.CARDS.RADIUS,
      border: ADMIN_CONSTANTS.CARDS.BORDER,
      backgroundColor: ADMIN_CONSTANTS.CARDS.BG,
      padding: ADMIN_CONSTANTS.CARDS.PADDING,
      boxShadow: ADMIN_CONSTANTS.CARDS.SHADOW,
      display: 'flex',
      flexDirection: 'column',
      gap: ADMIN_CONSTANTS.CARDS.GAP,
      flex: 1,
      minWidth: ADMIN_CONSTANTS.CARDS.MIN_WIDTH,
      maxWidth: ADMIN_CONSTANTS.CARDS.MAX_WIDTH,
    }}
  >
    <Box
      sx={{
        width: ADMIN_CONSTANTS.CARDS.ICON_CIRCLE_SIZE,
        height: ADMIN_CONSTANTS.CARDS.ICON_CIRCLE_SIZE,
        borderRadius: '50%',
        backgroundColor: iconBgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1,
      }}
    >
      <Box sx={{ color: '#5C17E5' }}>{icon}</Box>
    </Box>
    <Typography sx={{ fontWeight: 700, color: ADMIN_CONSTANTS.CARDS.TITLE_COLOR, fontSize: '18px', fontFamily: "'Lexend', sans-serif" }}>
      {title}
    </Typography>
    <Typography sx={{ color: ADMIN_CONSTANTS.CARDS.DESC_COLOR, fontSize: '14px', lineHeight: 1.5, fontFamily: "'Lexend', sans-serif" }}>
      {desc}
    </Typography>
    <Box sx={{ mt: 'auto', pt: 1 }}>
      <StandardButton
        onClick={onAction}
        variant="primary"
        size="medium"
        sx={{
          height: ADMIN_CONSTANTS.ACTION_BUTTON.HEIGHT,
          minWidth: ADMIN_CONSTANTS.ACTION_BUTTON.MIN_WIDTH,
          borderRadius: ADMIN_CONSTANTS.ACTION_BUTTON.RADIUS,
          backgroundColor: ADMIN_CONSTANTS.ACTION_BUTTON.BG,
          color: ADMIN_CONSTANTS.ACTION_BUTTON.COLOR,
          fontWeight: ADMIN_CONSTANTS.ACTION_BUTTON.FONT_WEIGHT,
          fontSize: ADMIN_CONSTANTS.ACTION_BUTTON.FONT_SIZE,
          '&:hover': { backgroundColor: ADMIN_CONSTANTS.ACTION_BUTTON.HOVER_BG },
        }}
      >
        {action}
      </StandardButton>
    </Box>
  </Box>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Same source the TopBar greets from — auth state is rehydrated from
  // localStorage when the store is created, so it is present on first render.
  const user = useSelector((state: RootState) => state.auth.user);
  // Module-gated tile, loading-safe like the sidebar: shown until /me says otherwise.
  const activeModules = useSelector(selectActiveModules);
  const orgLoaded = useSelector(selectOrgLoaded);
  const showCompliance = !orgLoaded || activeModules.includes('compliance');
  const displayName = user
    ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username)
    : '';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2, 
      padding: '24px',
      paddingTop: '12px',
      overflow: 'hidden',
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
          {displayName ? `${ADMIN_LABELS.GREETING_PREFIX}, ${displayName}!` : `${ADMIN_LABELS.GREETING_PREFIX}!`}
        </Typography>
        <Typography 
          sx={{ 
            color: '#1A212B', 
            fontSize: '16px',
            fontFamily: "'Lexend', sans-serif",
            fontWeight: 400
          }}
        >
          {ADMIN_LABELS.SUBTITLE}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: { xs: 2, md: 3 },
          rowGap: { xs: 2, md: 3 },
          alignItems: 'stretch',
          maxWidth: { xs: '100%', md: '1050px', lg: '1600px' },
          marginLeft: 0,
          marginRight: 'auto',
        }}
      >
        <Card
          icon={<LocalPharmacyOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.DASHBOARD.TITLE}
          desc={ADMIN_LABELS.SECTIONS.DASHBOARD.DESC}
          action={ADMIN_LABELS.SECTIONS.DASHBOARD.ACTION}
          onAction={() => navigate('/dashboard')}
          iconBgColor={ADMIN_CONSTANTS.ICON_COLORS.DASHBOARD}
        />
        <Card
          icon={<PeopleAltOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.USER_MGMT.TITLE}
          desc={ADMIN_LABELS.SECTIONS.USER_MGMT.DESC}
          action={ADMIN_LABELS.SECTIONS.USER_MGMT.ACTION}
          onAction={() => navigate('/admin/users')}
          iconBgColor={ADMIN_CONSTANTS.ICON_COLORS.USER_MGMT}
        />
        <Card
          icon={<BarChartOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.REPORTS.TITLE}
          desc={ADMIN_LABELS.SECTIONS.REPORTS.DESC}
          action={ADMIN_LABELS.SECTIONS.REPORTS.ACTION}
          onAction={() => navigate('/admin/reports')}
          iconBgColor={ADMIN_CONSTANTS.ICON_COLORS.REPORTS}
        />
        <Card
          icon={<StorageIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title="Master"
          desc="Access and Manage master data of products, suppliers, customers and doctors"
          action="Go to Master"
          onAction={() => navigate('/admin/master')}
          iconBgColor="#F0F4FF"
        />
        <Card
          icon={<InventoryIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title="Inventory Adjustment"
          desc="Adjust inventory quantities for products and batches"
          action="Adjust Inventory"
          onAction={() => navigate('/admin/inventory-adjustment')}
          iconBgColor="#E0E7FF"
        />
        <Card
          icon={<FolderOpenOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title="Historical Data"
          desc="Upload, browse, and download historical data files for the pharmacy."
          action="Manage Files"
          onAction={() => navigate('/admin/historical-data')}
          iconBgColor="#E0F2F1"
        />
        <Card
          icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.SUPPLIER_CREDIT.TITLE}
          desc={ADMIN_LABELS.SECTIONS.SUPPLIER_CREDIT.DESC}
          action={ADMIN_LABELS.SECTIONS.SUPPLIER_CREDIT.ACTION}
          onAction={() => navigate('/admin/supplier-credit')}
          iconBgColor={ADMIN_CONSTANTS.ICON_COLORS.SUPPLIER_CREDIT}
        />
        {showCompliance && (
          <Card
            icon={<VerifiedUserOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
            title="Compliance"
            desc="Licences and statutory papers, their renewal dates and expiry reminders."
            action="Go to Compliance"
            onAction={() => navigate('/admin/compliance')}
            iconBgColor="#EDE9FE"
          />
        )}
        <Card
          icon={<AssignmentOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.AUDIT.TITLE}
          desc={ADMIN_LABELS.SECTIONS.AUDIT.DESC}
          action={ADMIN_LABELS.SECTIONS.AUDIT.ACTION}
          onAction={() => navigate('/admin/audit')}
          iconBgColor={ADMIN_CONSTANTS.ICON_COLORS.AUDIT}
        />
        <Card
          icon={<SettingsOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.SETTINGS.TITLE}
          desc={ADMIN_LABELS.SECTIONS.SETTINGS.DESC}
          action={ADMIN_LABELS.SECTIONS.SETTINGS.ACTION}
          onAction={() => navigate('/admin/settings')}
          iconBgColor={ADMIN_CONSTANTS.ICON_COLORS.SETTINGS}
        />
      </Box>
    </Box>
  );
};

export default AdminDashboard;


