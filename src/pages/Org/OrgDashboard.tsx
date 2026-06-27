import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { StandardButton } from '../../components/Common';
import { ADMIN_CONSTANTS } from '../../config/constants/Admin.constants';
import { ORG_LABELS } from '../../config/label/Org.labels';
import { useGetMeQuery } from '../../redux/slices/orgApi';

const D = ORG_LABELS.DASHBOARD;

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

const OrgDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: me } = useGetMeQuery();
  const orgName = me?.organization?.name;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '24px', paddingTop: '12px' }}>
      <Box sx={{ mb: 1 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, fontSize: '32px', color: '#1A212B', fontFamily: "'Lexend', sans-serif", mb: 0.5 }}
        >
          {D.PAGE_TITLE}
        </Typography>
        <Typography sx={{ color: '#1A212B', fontSize: '16px', fontFamily: "'Lexend', sans-serif" }}>
          {orgName ? `${orgName} — ${D.SUBTITLE}` : D.SUBTITLE}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: { xs: 2, md: 3 },
          alignItems: 'stretch',
          maxWidth: { xs: '100%', md: '1050px', lg: '1600px' },
        }}
      >
        <Card
          icon={<GroupsOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={D.SECTIONS.ROLES.TITLE}
          desc={D.SECTIONS.ROLES.DESC}
          action={D.SECTIONS.ROLES.ACTION}
          onAction={() => navigate('/org/roles')}
          iconBgColor="#E3F2FD"
        />
        <Card
          icon={<ViewModuleOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={D.SECTIONS.MODULES.TITLE}
          desc={D.SECTIONS.MODULES.DESC}
          action={D.SECTIONS.MODULES.ACTION}
          onAction={() => navigate('/org/modules')}
          iconBgColor="#F3E5F5"
        />
        <Card
          icon={<SettingsOutlinedIcon sx={{ fontSize: ADMIN_CONSTANTS.CARDS.ICON_SIZE }} />}
          title={D.SECTIONS.SETTINGS.TITLE}
          desc={D.SECTIONS.SETTINGS.DESC}
          action={D.SECTIONS.SETTINGS.ACTION}
          onAction={() => navigate('/org/settings')}
          iconBgColor="#E8F5E9"
        />
      </Box>
    </Box>
  );
};

export default OrgDashboard;
