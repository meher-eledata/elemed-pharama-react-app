import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAccessibleAreas, renderAreaIcon } from '../../config/areas.config';
import { selectOrgLoaded } from '../../redux/slices/orgSlice';
import { LAUNCHER_LABELS as L } from '../../config/label/Launcher.labels';

/**
 * Post-login landing. Computes the areas the viewer can access:
 *  - 0 areas  → friendly "no access" message
 *  - 1 area   → redirect straight into it (no tile picker)
 *  - >1 areas → a grid of large tiles to choose from
 * Until org context loads, `useAccessibleAreas()` returns [] and we show a
 * lightweight loading state rather than flashing the wrong destination.
 */
const Launcher: React.FC = () => {
  const navigate = useNavigate();
  const areas = useAccessibleAreas();
  const loaded = useSelector(selectOrgLoaded);

  if (!loaded) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          backgroundColor: '#F6F8FB',
        }}
      >
        <CircularProgress sx={{ color: '#5C17E5' }} />
        <Typography sx={{ color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
          {L.LOADING}
        </Typography>
      </Box>
    );
  }

  // Single area — route straight in (the common case for single-module users).
  if (areas.length === 1) {
    return <Navigate to={areas[0].homeRoute} replace />;
  }

  // Edge case: authenticated but no accessible area.
  if (areas.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          px: 3,
          textAlign: 'center',
          backgroundColor: '#F6F8FB',
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '24px',
            color: '#1A212B',
            fontFamily: "'Lexend', sans-serif",
          }}
        >
          {L.NO_ACCESS_TITLE}
        </Typography>
        <Typography
          sx={{
            fontSize: '15px',
            color: '#6B7280',
            fontFamily: "'Lexend', sans-serif",
            maxWidth: 420,
          }}
        >
          {L.NO_ACCESS_BODY}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        px: 3,
        py: 6,
        backgroundColor: '#F6F8FB',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '32px',
            color: '#1A212B',
            fontFamily: "'Lexend', sans-serif",
          }}
        >
          {L.TITLE}
        </Typography>
        <Typography
          sx={{
            mt: 1,
            fontSize: '16px',
            color: '#6B7280',
            fontFamily: "'Lexend', sans-serif",
          }}
        >
          {L.SUBTITLE}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(240px, 280px))',
            md: 'repeat(3, minmax(240px, 280px))',
          },
          gap: 3,
          justifyContent: 'center',
        }}
      >
        {areas.map((area) => (
          <Box
            key={area.key}
            role="button"
            tabIndex={0}
            onClick={() => navigate(area.homeRoute)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(area.homeRoute);
              }
            }}
            sx={{
              cursor: 'pointer',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2,
              transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(92, 23, 229, 0.18)',
                borderColor: '#5C17E5',
              },
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'rgba(92, 23, 229, 0.1)',
                color: '#5C17E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderAreaIcon(area, 36)}
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '20px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {area.label}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
                lineHeight: 1.5,
              }}
            >
              {area.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Launcher;
