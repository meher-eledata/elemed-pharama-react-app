import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { OrderReceiveRow } from "../types";
import {
  getReceiptFileUrl,
  useLazyGetReceiptFileLinkQuery,
} from "../../../redux/slices/receiveApi";
import { RootState } from "../../../redux/store";

interface InvoiceAttachmentProps {
  row: OrderReceiveRow;
}

const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;

const InvoiceAttachment: React.FC<InvoiceAttachmentProps> = ({ row }) => {
  const token = useSelector((s: RootState) => s.auth.token);
  const [triggerFileLink] = useLazyGetReceiptFileLinkQuery();

  // --- Determine file presence / type (legacy logic preserved) ---
  let isBase64 = false;
  let isImage = false;
  let fileName: string | undefined = undefined;

  if (row.receipt_file_name) {
    fileName = row.receipt_file_name.toLowerCase();
    isImage = IMAGE_EXT_REGEX.test(fileName);
  }

  // base64 data URLs are self-contained: use directly, no network call.
  let base64Url: string | null = null;
  if (row.invoice_attachment) {
    isBase64 = row.invoice_attachment.startsWith("data:");
    if (isBase64) {
      base64Url = row.invoice_attachment;
      isImage = row.invoice_attachment.startsWith("data:image/");
    } else if (!isImage) {
      // Non-base64 invoice_attachment string: treat as a possible image by extension.
      isImage = IMAGE_EXT_REGEX.test(row.invoice_attachment);
    }
  }

  const hasFile =
    !!row.receipt_file_name || !!row.receipt_file_url || !!row.invoice_attachment;

  // For non-base64 server files we resolve a usable URL via the authenticated flow.
  const isServerFile = hasFile && !isBase64 && !!row.receiptId;

  // --- Authenticated URL resolver for server-stored files ---
  const resolveUsableUrl = useCallback(async (): Promise<string | null> => {
    if (!row.receiptId) return null;
    try {
      // 1. Ask the backend for a (presigned) link.
      const link = await triggerFileLink(row.receiptId).unwrap();
      if (link?.url) {
        return link.url;
      }
    } catch {
      // fall through to blob fetch
    }

    // 2. Local-disk driver (url null) → authenticated blob fetch of the /file route.
    try {
      const baseUrl = getReceiptFileUrl(row.receiptId); // `${VITE_API_BASE_URL}receive/${id}/file`
      const res = await fetch(baseUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return null;
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [row.receiptId, token, triggerFileLink]);

  // --- Image thumbnail: resolve on mount (only for server image files) ---
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!(isServerFile && isImage)) return;

    let cancelled = false;
    let resolvedUrl: string | null = null;

    (async () => {
      const url = await resolveUsableUrl();
      if (cancelled) {
        // Resolved after unmount: clean up any blob we created.
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
        return;
      }
      if (url) {
        resolvedUrl = url;
        setImageUrl(url);
      } else {
        setImageFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      // Revoke only blob object URLs; never presigned https urls.
      if (resolvedUrl && resolvedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resolvedUrl);
      }
    };
  }, [isServerFile, isImage, resolveUsableUrl]);

  // --- Click handler for PDFs/other server files (lazy resolve on click) ---
  const handleServerFileClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      const url = await resolveUsableUrl();
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        // Graceful no-op: nothing usable to open.
        console.error("InvoiceAttachment: could not resolve a usable file URL");
      }
    },
    [resolveUsableUrl]
  );

  // --- No attachment ---
  if (!hasFile) {
    return <span style={{ color: "#9CA3AF" }}>No attachment</span>;
  }

  // ===== base64 data URL branch (self-contained, no network) =====
  if (isBase64 && base64Url) {
    if (isImage) {
      return (
        <a
          href={base64Url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", cursor: "pointer" }}
        >
          <img
            src={base64Url}
            alt="Invoice Receipt"
            style={{
              maxWidth: "6.25rem",
              maxHeight: "3.75rem",
              objectFit: "contain",
              border: "0.0625rem solid #D1D5DB",
              borderRadius: "0.25rem",
              padding: "0.125rem",
              backgroundColor: "#F9FAFB",
            }}
          />
        </a>
      );
    }
    return (
      <a
        href={base64Url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#3B82F6",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {fileName ? `View ${fileName}` : "View Attachment"}
      </a>
    );
  }

  // ===== server-stored file (authenticated flow) =====
  if (isImage) {
    if (imageFailed) {
      return <span style={{ color: "#9CA3AF" }}>No attachment</span>;
    }
    if (!imageUrl) {
      // Resolving — keep layout minimal/neutral.
      return <span style={{ color: "#9CA3AF" }}>…</span>;
    }
    return (
      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-block", cursor: "pointer" }}
      >
        <img
          src={imageUrl}
          alt="Invoice Receipt"
          style={{
            maxWidth: "6.25rem",
            maxHeight: "3.75rem",
            objectFit: "contain",
            border: "0.0625rem solid #D1D5DB",
            borderRadius: "0.25rem",
            padding: "0.125rem",
            backgroundColor: "#F9FAFB",
          }}
          onError={() => setImageFailed(true)}
        />
      </a>
    );
  }

  // PDFs / other: clickable link, lazily resolved on click (no eager fetch on mount).
  return (
    <a
      href="#"
      onClick={handleServerFileClick}
      style={{
        color: "#3B82F6",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {fileName ? `View ${fileName}` : "View Attachment"}
    </a>
  );
};

export default InvoiceAttachment;
