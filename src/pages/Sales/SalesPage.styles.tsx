import React from 'react';
import { Box, styled } from '@mui/material';

// Custom Dropdown Icon Component - REMOVED for standardization
// export const CustomDropdownIcon = (props: any) => (
//   <svg
//     {...(props as any)}
//     width="12"
//     height="12"
//     viewBox="0 0 12 12"
//     fill="none"
//     style={{
//       pointerEvents: "none",
//       color: "#6B7280",
//     }}
//   >
//     <path
//       d="M3 4.5L6 7.5L9 4.5"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//   </svg>
// );

// Container for the product selection form
export const ProductSelectionContainer = styled(Box)({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px',
  background: '#f7f9fc',
  padding: '24px',
  borderRadius: '8px',
});

// Container for form fields
export const FormFieldsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'flex-end',
  gap: '80px',
});

// Container for bulk actions bar
export const BulkActionsContainer = styled(Box)({
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#F8F9FA',
  border: '1px solid #E9ECEF',
  borderRadius: '8px',
  padding: '12px 16px',
  gap: '16px',
});

// Container for validation error
export const ValidationErrorContainer = styled(Box)({
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '4px',
  paddingRight: '24px',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'flex-end',
});

export const ValidationErrorBox = styled(Box)({
  backgroundColor: '#FEE2E2',
  border: '1px solid #EF4444',
  borderRadius: '6px',
  padding: '6px 12px',
  display: 'inline-block',
  maxWidth: 'fit-content',
});

