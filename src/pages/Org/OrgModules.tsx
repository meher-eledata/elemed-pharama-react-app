import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Snackbar, Alert, Switch } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useGetMeQuery, useToggleModuleMutation } from '../../redux/slices/orgApi';
import { setOrgContext } from '../../redux/slices/orgSlice';
import { MODULES, ALL_MODULE_KEYS, COMING_SOON_MODULE_KEYS } from '../../config/modules.config';
import { extractErrorMessage } from '../../utils/errorUtils';
import { ORG_LABELS } from '../../config/label/Org.labels';
import { ComingSoonChip } from '../../components/Common';

const M = ORG_LABELS.MODULES;
// pharmacy is the core app — its switch is always-on and disabled so an admin can
// never zero-out the base product. Only optional modules toggle.
const CORE_MODULE_KEY = 'pharmacy';

const OrgModules: React.FC = () => {
  const dispatch = useDispatch();
  const [pendingModuleKey, setPendingModuleKey] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const { data: meData, isLoading, isError } = useGetMeQuery();
  const [toggleModule] = useToggleModuleMutation();

  const activeModules = meData?.activeModules ?? [];
  // Coming-soon modules cannot be enabled: static registry list merged with the
  // backend's /me report (the backend also rejects enabling them with a 400).
  const comingSoonModules = new Set<string>([
    ...COMING_SOON_MODULE_KEYS,
    ...(meData?.comingSoonModules ?? []),
  ]);

  const handleToggleModule = async (moduleKey: string, label: string, enabled: boolean) => {
    setPendingModuleKey(moduleKey);
    try {
      const result = await toggleModule({ module_key: moduleKey, enabled }).unwrap();
      // toggleModule invalidates 'Me' so OrgBootstrap re-seeds context, but dispatch
      // here too so the switcher/sidebar update immediately (no refetch round-trip).
      dispatch(
        setOrgContext({
          organization: meData?.organization ?? null,
          activeModules: result.activeModules,
        }),
      );
      showToast(enabled ? M.ENABLED_SUCCESS(label) : M.DISABLED_SUCCESS(label), 'success');
    } catch (err) {
      showToast(extractErrorMessage(err, M.TOGGLE_ERROR), 'error');
    } finally {
      setPendingModuleKey(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '24px' }}>
      <Box>
        <Typography
          sx={{ fontWeight: 700, fontSize: '32px', color: '#1A212B', fontFamily: "'Lexend', sans-serif", mb: 0.5 }}
        >
          {M.PAGE_TITLE}
        </Typography>
        <Typography sx={{ fontSize: '16px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
          {M.SUBTITLE}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: '900px', width: '100%' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
            <CircularProgress size={18} />
            <Typography sx={{ fontSize: '14px', fontFamily: "'Lexend', sans-serif" }}>{M.LOADING}</Typography>
          </Box>
        )}
        {!isLoading && isError && (
          <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: "'Lexend', sans-serif" }}>
            {M.LOAD_ERROR}
          </Typography>
        )}
        {!isLoading && !isError && ALL_MODULE_KEYS.map((key) => {
          const mod = MODULES[key];
          const isCore = key === CORE_MODULE_KEY;
          const isComingSoon = comingSoonModules.has(key);
          const isEnabled = !isComingSoon && (isCore || activeModules.includes(key));
          return (
            <Box
              key={key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                padding: '12px 16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', fontFamily: "'Lexend', sans-serif" }}>
                    {mod.label}
                  </Typography>
                  {isCore && (
                    <Typography
                      sx={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#5C17E5',
                        backgroundColor: 'rgba(92, 23, 229, 0.1)',
                        borderRadius: '6px',
                        px: 1,
                        py: '2px',
                        fontFamily: "'Lexend', sans-serif",
                      }}
                    >
                      {M.CORE_TAG}
                    </Typography>
                  )}
                  {isComingSoon && <ComingSoonChip />}
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: "'Lexend', sans-serif", mt: '2px' }}>
                  {mod.description}
                </Typography>
              </Box>
              <Switch
                checked={isEnabled}
                disabled={isCore || isComingSoon || pendingModuleKey === key}
                onChange={(e) => handleToggleModule(key, mod.label, e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#5C17E5' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#5C17E5' },
                }}
              />
            </Box>
          );
        })}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrgModules;
