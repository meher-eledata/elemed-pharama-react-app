import React from "react";
import { OrderReceiveRow } from "../types";
import { getReceiptFileUrl } from "../../../redux/slices/receiveApi";

interface InvoiceAttachmentProps {
  row: OrderReceiveRow;
}

const InvoiceAttachment: React.FC<InvoiceAttachmentProps> = ({ row }) => {
  // Determine the file URL
  let fileUrl: string | null = null;
  let isBase64 = false;
  let isImage = false;
  let fileName: string | undefined = undefined;

  // Check for receipt_file_name to determine file type
  if (row.receipt_file_name) {
    fileName = row.receipt_file_name.toLowerCase();
    // Check if file is an image based on extension
    isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
  }

  if (row.invoice_attachment) {
    // Check if it's a base64 data URL (starts with data:)
    isBase64 = row.invoice_attachment.startsWith('data:');
    if (isBase64) {
      // Legacy: base64 data URL (old format)
      fileUrl = row.invoice_attachment;
      isImage = row.invoice_attachment.startsWith('data:image/');
    } else {
      // If it's not base64, it might be a URL - use it as-is
      fileUrl = row.invoice_attachment;
      // Check if it's an image URL
      if (!isImage) {
        isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileUrl);
      }
    }
  }

  // If no attachment URL from database, try to use receipt_file_url or construct from receiptId
  // Only try to get file if we have evidence that a file exists (receipt_file_name or receipt_file_url)
  if (!fileUrl && row.receiptId) {
    // Check if we have file metadata from backend
    if (row.receipt_file_name || row.receipt_file_url) {
      // Always use the /receive/{receipt_id}/file endpoint to fetch files
      // The backend serves files through this endpoint, not directly from the file path
      fileUrl = getReceiptFileUrl(row.receiptId);
      // If we have a file name, check if it's an image
      if (!isImage && fileName) {
        isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
      }
    }
    // If no receipt_file_name or receipt_file_url, don't try to construct URL
    // This means no file has been uploaded for this receipt
  }

  // If still no file URL, show "No attachment"
  // Also check explicitly if file fields are null to avoid trying to fetch non-existent files
  if (!fileUrl || (!row.receipt_file_name && !row.receipt_file_url && !row.invoice_attachment)) {
    return <span style={{ color: '#9CA3AF' }}>No attachment</span>;
  }

  if (isImage) {
    // For images (base64 or server-stored), show a clickable thumbnail that opens in a new tab
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          // Prevent navigation if file doesn't exist
          if (!row.receipt_file_name && !row.receipt_file_url && !row.invoice_attachment) {
            e.preventDefault();
          }
        }}
      >
        <img
          src={fileUrl}
          alt="Invoice Receipt"
          style={{
            maxWidth: '6.25rem', // 100px = 6.25rem
            maxHeight: '3.75rem', // 60px = 3.75rem
            objectFit: 'contain',
            border: '0.0625rem solid #D1D5DB', // 1px = 0.0625rem
            borderRadius: '0.25rem', // 4px = 0.25rem
            padding: '0.125rem', // 2px = 0.125rem
            backgroundColor: '#F9FAFB'
          }}
          onError={(e) => {
            // If image fails to load, replace with "No attachment" message
            const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '<span style="color: #9CA3AF;">No attachment</span>';
            }
          }}
        />
      </a>
    );
  } else {
    // For other file types (PDF, DOC, etc.) or new file URLs, show as clickable link
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#3B82F6',
          textDecoration: 'underline',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          // Prevent navigation if file doesn't exist
          if (!row.receipt_file_name && !row.receipt_file_url && !row.invoice_attachment) {
            e.preventDefault();
          }
        }}
      >
        {fileName ? `View ${fileName}` : 'View Attachment'}
      </a>
    );
  }
};

export default InvoiceAttachment;
