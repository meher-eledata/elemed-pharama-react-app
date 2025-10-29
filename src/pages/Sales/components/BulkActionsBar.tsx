import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { BulkActionsContainer } from '../SalesPage.styles';
import { SALES_PAGE_LABELS } from '../../../config/label/SalesPage.labels';
import DeleteNewIcon from '../../../assets/DeleteNew.svg';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onDelete }) => {
  if (selectedCount === 0) return null;

  return (
    <BulkActionsContainer>
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 500, 
          color: '#495057',
          marginRight: 1
        }}
      >
        {SALES_PAGE_LABELS.APPLY_ACTION_LABEL}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={onDelete}
          sx={{
            padding: '8px',
            backgroundColor: 'transparent',
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: '#F8F9FA',
            },
            '&:focus': {
              backgroundColor: '#F8F9FA',
            }
          }}
          title={`Delete ${selectedCount} selected item(s)`}
        >
          <img src={DeleteNewIcon} alt="Delete" style={{ width: '16px', height: '16px' }} />
        </IconButton>
      </Box>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#6C757D',
          fontSize: '12px',
          marginLeft: 'auto'
        }}
      >
        {selectedCount} {SALES_PAGE_LABELS.ITEMS_SELECTED}
      </Typography>
    </BulkActionsContainer>
  );
};

export default BulkActionsBar;

