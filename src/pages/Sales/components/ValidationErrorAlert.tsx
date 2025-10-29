import React from 'react';
import { Typography } from '@mui/material';
import { ValidationErrorContainer, ValidationErrorBox } from '../SalesPage.styles';

interface ValidationErrorAlertProps {
  error: string;
}

const ValidationErrorAlert: React.FC<ValidationErrorAlertProps> = ({ error }) => {
  if (!error) return null;

  return (
    <ValidationErrorContainer>
      <ValidationErrorBox>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#EF4444',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '14px' }}>⚠</span>
          {error}
        </Typography>
      </ValidationErrorBox>
    </ValidationErrorContainer>
  );
};

export default ValidationErrorAlert;

