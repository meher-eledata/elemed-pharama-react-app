import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { COMPLIANCE_CONSTANTS } from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface DocumentRowMenuProps {
  // Omitted when the document has no current version — there is nothing to edit,
  // so the item is hidden rather than shown disabled.
  onEditVersion?: () => void;
  onEditDocument: () => void;
}

// Overflow for a document row's secondary edit actions. Both items open an
// existing flow; nothing here is destructive, so no confirmation step.
const DocumentRowMenu: React.FC<DocumentRowMenuProps> = ({ onEditVersion, onEditDocument }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = anchorEl !== null;

  const runAndClose = (action: () => void) => () => {
    setAnchorEl(null);
    action();
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label={L.ACTIONS.MORE_ACTIONS}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ color: '#6B7280', '&:hover': { backgroundColor: '#F3F4F6' } }}
      >
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {onEditVersion && (
          <MenuItem
            onClick={runAndClose(onEditVersion)}
            sx={{ fontFamily: C.FONT, fontSize: '14px', color: '#1A212B' }}
          >
            {L.ACTIONS.EDIT_VERSION_DETAILS}
          </MenuItem>
        )}
        <MenuItem
          onClick={runAndClose(onEditDocument)}
          sx={{ fontFamily: C.FONT, fontSize: '14px', color: '#1A212B' }}
        >
          {L.DOCUMENT_EDIT.ACTION}
        </MenuItem>
      </Menu>
    </>
  );
};

export default DocumentRowMenu;
