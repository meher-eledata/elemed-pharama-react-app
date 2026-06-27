import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import {
  useAccessibleAreas,
  currentAreaKeyFromPath,
  renderAreaIcon,
} from '../../config/areas.config';

/**
 * Header control letting the user move between the AREAS they can access. The
 * current area is derived from the URL (`currentAreaKeyFromPath`) so it stays in
 * sync on direct navigation. Renders nothing when the user has a single area —
 * there is nowhere to switch to.
 */
export const ModuleSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const areas = useAccessibleAreas();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (areas.length <= 1) return null;

  const currentKey = currentAreaKeyFromPath(location.pathname);
  const current = areas.find((a) => a.key === currentKey) ?? areas[0];

  const handleSelect = (homeRoute: string) => {
    setAnchorEl(null);
    navigate(homeRoute);
  };

  return (
    <>
      <Box
        role="button"
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          transition: 'border-color 0.12s ease, background-color 0.12s ease',
          '&:hover': { borderColor: '#5C17E5', backgroundColor: 'rgba(92, 23, 229, 0.04)' },
        }}
      >
        <Box sx={{ color: '#5C17E5', display: 'flex', alignItems: 'center' }}>
          {renderAreaIcon(current, 20)}
        </Box>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1A212B',
            fontFamily: "'Lexend', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          {current.label}
        </Typography>
        <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#6B7280' }} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { mt: 0.5, minWidth: 240, borderRadius: '12px' } }}
      >
        {areas.map((area) => {
          const isActive = area.key === current.key;
          return (
            <MenuItem
              key={area.key}
              selected={isActive}
              onClick={() => handleSelect(area.homeRoute)}
              sx={{
                py: 1,
                fontFamily: "'Lexend', sans-serif",
                '&.Mui-selected': { backgroundColor: 'rgba(92, 23, 229, 0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: '#5C17E5', minWidth: 36 }}>
                {renderAreaIcon(area, 20)}
              </ListItemIcon>
              <ListItemText
                primary={area.label}
                primaryTypographyProps={{
                  sx: {
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1A212B',
                    fontFamily: "'Lexend', sans-serif",
                  },
                }}
              />
              {isActive && <CheckIcon sx={{ fontSize: 18, color: '#5C17E5', ml: 1 }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default ModuleSwitcher;
