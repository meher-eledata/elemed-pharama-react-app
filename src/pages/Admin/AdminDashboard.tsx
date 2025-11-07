import React from 'react';
import { Box, Typography } from '@mui/material';
import { StandardButton } from '../../components/Common';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useNavigate } from 'react-router-dom';
import { ADMIN_LABELS } from '../../config/label/Admin.labels';
import { ADMIN_CONSTANTS } from '../../config/constants/Admin.constants';

const Card: React.FC<{ icon: React.ReactNode; title: string; desc: string; action: string; onAction: () => void }> = ({ icon, title, desc, action, onAction }) => (
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
      minWidth: 360,
    }}
  >
    <Box sx={{ color: '#5C17E5', mb: 1 }}>{icon}</Box>
    <Typography sx={{ fontWeight: 700, color: ADMIN_CONSTANTS.CARDS.TITLE_COLOR, fontSize: '16px' }}>{title}</Typography>
    <Typography sx={{ color: ADMIN_CONSTANTS.CARDS.DESC_COLOR, fontSize: '13px' }}>{desc}</Typography>
    <Box>
      <StandardButton
        onClick={onAction}
        variant="primary"
        size="medium"
        sx={{
          height: ADMIN_CONSTANTS.ACTION_BUTTON.HEIGHT,
          minWidth: ADMIN_CONSTANTS.ACTION_BUTTON.MIN_WIDTH,
          width: '80%',
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
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Box>
        <Typography variant="h4" fontWeight={700}>{ADMIN_LABELS.PAGE_TITLE}</Typography>
        <Typography sx={{ color: '#728197', mt: 0.5 }}>{ADMIN_LABELS.SUBTITLE}</Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(360px, 1fr))' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Card
          icon={<PeopleAltOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.USER_MGMT.TITLE}
          desc={ADMIN_LABELS.SECTIONS.USER_MGMT.DESC}
          action={ADMIN_LABELS.SECTIONS.USER_MGMT.ACTION}
          onAction={() => navigate('/admin/users')}
        />
        <Card
          icon={<BarChartOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.REPORTS.TITLE}
          desc={ADMIN_LABELS.SECTIONS.REPORTS.DESC}
          action={ADMIN_LABELS.SECTIONS.REPORTS.ACTION}
          onAction={() => navigate('/admin/reports')}
        />
        <Card
          icon={<AssignmentOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.AUDIT.TITLE}
          desc={ADMIN_LABELS.SECTIONS.AUDIT.DESC}
          action={ADMIN_LABELS.SECTIONS.AUDIT.ACTION}
          onAction={() => navigate('/admin/audit')}
        />
        <Card
          icon={<SettingsOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={ADMIN_LABELS.SECTIONS.SETTINGS.TITLE}
          desc={ADMIN_LABELS.SECTIONS.SETTINGS.DESC}
          action={ADMIN_LABELS.SECTIONS.SETTINGS.ACTION}
          onAction={() => navigate('/admin/settings')}
        />
      </Box>
    </Box>
  );
};

export default AdminDashboard;


