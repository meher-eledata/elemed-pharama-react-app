import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { RootState } from "../../../redux/store";
import {
  useGetReceiptsQuery,
  useGetCurrentPurchaseOrdersQuery,
  useGetReceiptLinesQuery,
} from "../../../redux/slices/receiveApi";
import { useGetBatchesForProductMutation } from "../../../redux/slices/inventoryApi";
import { OrderReceiveRow, PurchaseOrderRow } from "../types";
import { capitalizeFirstLetter } from "../utils";

export const useOrderReceiveData = (activeTab: number) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [productNameCache, setProductNameCache] = useState<{ [key: number]: string }>({});

  const { data: receipts, isLoading: loadingReceipts, error: receiptsError, refetch: refetchReceipts } = useGetReceiptsQuery(undefined, {
    skip: activeTab !== 2,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: purchaseOrders, isLoading: loadingPurchaseOrders, error: purchaseOrdersError, refetch: refetchPurchaseOrders } = useGetCurrentPurchaseOrdersQuery(undefined, {
    skip: activeTab !== 1,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: receiptLines, isLoading: loadingReceiptLines, error: receiptLinesError } = useGetReceiptLinesQuery(
    selectedReceiptId !== null ? { receipt_id: selectedReceiptId } : (undefined as any),
    { skip: selectedReceiptId === null }
  );

  const [getBatchesForProduct] = useGetBatchesForProductMutation();

  useEffect(() => {
    if (!receiptLines || receiptLines.length === 0) return;

    const fetchMissingProductNames = async () => {
      const missingNames: { [key: number]: Promise<string> } = {};

      for (const line of receiptLines) {
        if ((!line.product_name || line.product_name === null) && line.product_id && line.product_id > 0) {
          if (!productNameCache[line.product_id]) {
            missingNames[line.product_id] = getBatchesForProduct({ product_id: line.product_id })
              .unwrap()
              .then((result) => result.product.product_name)
              .catch(() => {
                return `Product ID: ${line.product_id}`;
              });
          }
        }
      }

      if (Object.keys(missingNames).length === 0) return;

      const results = await Promise.allSettled(
        Object.entries(missingNames).map(async ([productId, promise]) => {
          const name = await promise;
          return { productId: parseInt(productId), name };
        })
      );

      const newCache = { ...productNameCache };
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newCache[result.value.productId] = result.value.name;
        }
      });

      if (Object.keys(newCache).length > Object.keys(productNameCache).length) {
        setProductNameCache(newCache);
      }
    };

    fetchMissingProductNames();
  }, [receiptLines, getBatchesForProduct, productNameCache]);

  const mappedReceipts: OrderReceiveRow[] = useMemo(() => {
    return (receipts || [])
      .filter((receipt) => {
        if (receipt.id === 13 || receipt.receipt_id === 13) {
          console.log("🚀 Debug RA13:", JSON.stringify(receipt, null, 2));
        }
        return receipt.receipt_status.toLowerCase() === 'received';
      })
      .map((receipt) => {
        const receiptId = receipt.receipt_id || receipt.id || 0;
        const amountPaid = receipt.total_paid || 0;
        const pendingAmount = receipt.amount_left_to_pay || 0;

        // Use paid + pending as the authoritative source for receipt total, 
        // as total_amount/po_total_amount might reflect the original PO value, not the actual receipt value.
        let totalAmount = amountPaid + pendingAmount;

        // If the derived total is 0, check if we should fall back to existing fields
        // This handles cases where paid/pending might be missing (though they shouldn't be based on type definition)
        // or if it's a truly 0 value receipt vs a data error.
        if (totalAmount === 0) {
          const explicitTotal = (receipt.total_amount !== undefined && receipt.total_amount !== null)
            ? (typeof receipt.total_amount === 'string' ? parseFloat(receipt.total_amount) : receipt.total_amount)
            : null;

          if (explicitTotal !== null && explicitTotal > 0) {
            totalAmount = explicitTotal;
          } else if (receipt.po_total_amount && parseFloat(receipt.po_total_amount) > 0) {
            // Only use PO total as last resort if everything else is 0
            // But be careful as this causes the mismatch for partial orders. 
            // We assume if paid+pending is 0, maybe it's a fresh PO record masquerading as receipt?
            // But mappedReceipts filters for 'received'.
            // So we keep comparable logic but prefer the calculated sum.
            totalAmount = parseFloat(receipt.po_total_amount);
          }
        }

        const creditAvailable = receipt.supplier_credit_available
          ? parseFloat(receipt.supplier_credit_available)
          : 0;
        const transactionNumber = receipt.last_transaction_number || receipt.transaction_number || '';
        const paymentVendor = receipt.last_payment_vendor || receipt.payment_vendor || '';
        const supplierName = receipt.supplier_name || 'N/A';

        return {
          receiptId: receiptId,
          // reNo stays the internal RA-key the row actions/lookups depend on; the GRN
          // number is carried separately for display.
          reNo: `RA${receiptId}`,
          receipt_number: receipt.receipt_number ?? null,
          poNo: receipt.po_number || String(receipt.po_id),
          invoice_number: receipt.invoice_number, // The SUPPLIER's invoice number
          po_id: receipt.po_id,
          supplier: supplierName,
          supplierId: receipt.supplier_id || 0,
          received: (receipt as any).invoice_date
            ? dayjs((receipt as any).invoice_date).format('MMM DD, YYYY h:mm A')
            : dayjs(receipt.received_on).format('MMM DD, YYYY h:mm A'),
          receivedRaw: (receipt as any).invoice_date || receipt.received_on,
          status: receipt.receipt_status,
          reBy: receipt.received_by,
          amt: totalAmount,
          products: [],
          transaction_number: transactionNumber,
          payment_vendor: paymentVendor,
          invoice_date: (receipt as any).invoice_date || null,
          invoice_attachment: (receipt as any).invoice_attachment || undefined,
          receipt_file_name: receipt.receipt_file_name || undefined,
          receipt_file_url: receipt.receipt_file_url || undefined,
          amountPaid: amountPaid,
          pendingAmount: pendingAmount,
          creditAvailable: creditAvailable,
        };
      });
  }, [receipts]);

  const mappedPurchaseOrders: PurchaseOrderRow[] = useMemo(() => {
    return (purchaseOrders || [])
      .filter((po) => po.status.toLowerCase() !== 'received')
      .map((po, index) => ({
        receiptId: index + 1000,
        poNo: po.po_number,
        orderedDate: po.ordered_date,
        supplier: po.supplier_name,
        totalAmount: po.total_amount,
        status: po.status,
        createdBy: user ? capitalizeFirstLetter(`${user.first_name} ${user.last_name}`.trim() || user.username) : 'System'
      }));
  }, [purchaseOrders, user]);

  return {
    receipts: mappedReceipts,
    rawReceipts: receipts,
    purchaseOrders: mappedPurchaseOrders,
    loadingReceipts,
    loadingPurchaseOrders,
    receiptsError,
    purchaseOrdersError,
    refetchReceipts,
    refetchPurchaseOrders,
    receiptLines,
    loadingReceiptLines,
    selectedReceiptId,
    setSelectedReceiptId,
    productNameCache
  };
};
