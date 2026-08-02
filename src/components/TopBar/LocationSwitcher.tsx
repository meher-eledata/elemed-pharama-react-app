import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  selectActiveLocations,
  selectCurrentLocationId,
  setCurrentLocation,
} from '../../redux/slices/orgSlice';
import { LOCATION_LABELS } from '../../config/label/Locations.labels';

/**
 * Top-bar location switcher. Rendered only when the org has more than one
 * active location (with a single location the backend scopes automatically).
 * While no location is selected, a blocking-but-dismissable dialog prompts the
 * user to pick one — pharmacy writes fail server-side until they do.
 */
export const LocationSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const locations = useSelector(selectActiveLocations);
  const currentLocationId = useSelector(selectCurrentLocationId);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [promptDismissed, setPromptDismissed] = React.useState(false);
  const open = Boolean(anchorEl);

  if (locations.length <= 1) return null;

  const current = locations.find((l) => l.id === currentLocationId) ?? null;

  const handleSelect = (id: number) => {
    setAnchorEl(null);
    dispatch(setCurrentLocation(id));
  };

  return (
    <>
      <Box
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label={LOCATION_LABELS.SWITCHER.PLACEHOLDER}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        // Real keyboard support for the role="button" control (Enter/Space),
        // matching native button semantics.
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setAnchorEl(e.currentTarget);
          }
        }}
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
          <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: current ? '#1A212B' : '#6B7280',
            fontFamily: "'Lexend', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          {current ? current.name : LOCATION_LABELS.SWITCHER.PLACEHOLDER}
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
        {locations.map((location) => {
          const isActive = location.id === currentLocationId;
          return (
            <MenuItem
              key={location.id}
              selected={isActive}
              onClick={() => handleSelect(location.id)}
              sx={{
                py: 1,
                fontFamily: "'Lexend', sans-serif",
                '&.Mui-selected': { backgroundColor: 'rgba(92, 23, 229, 0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: '#5C17E5', minWidth: 36 }}>
                <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={location.name}
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

      {/* First-visit prompt: multiple active locations but none selected yet. */}
      <Dialog
        open={currentLocationId == null && !promptDismissed}
        onClose={() => setPromptDismissed(true)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, pb: 0.5 }}>
          {LOCATION_LABELS.SWITCHER.DIALOG_TITLE}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 1 }}>
            {LOCATION_LABELS.SWITCHER.DIALOG_SUBTITLE}
          </Typography>
          <List>
            {locations.map((location) => (
              <ListItemButton
                key={location.id}
                onClick={() => handleSelect(location.id)}
                sx={{ borderRadius: '10px' }}
              >
                <ListItemIcon sx={{ color: '#5C17E5', minWidth: 36 }}>
                  <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={location.name}
                  secondary={location.address || undefined}
                  primaryTypographyProps={{ sx: { fontSize: '14px', fontWeight: 600 } }}
                  secondaryTypographyProps={{ sx: { fontSize: '12px' } }}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LocationSwitcher;
