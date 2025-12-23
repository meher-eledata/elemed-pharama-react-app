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
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            maxWidth: '400px',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontSize: '16px' }}>⚠️</span>
          {error}
        </Typography>
      </ValidationErrorBox>
    </ValidationErrorContainer>
  );
};

export default ValidationErrorAlert;

