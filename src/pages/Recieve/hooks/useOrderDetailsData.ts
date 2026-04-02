import { useState, useMemo, startTransition } from "react";
import { SupplierOption, ProductOption } from "../types";
import { useGetReceiptsQuery } from "../../../redux/slices/receiveApi";
import { orderLabels } from "../../../config/label/OrderDetail.labels";

export const useOrderDetailsData = (isEditMode: boolean, receiptId: number | null) => {
  // Supplier state
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState<boolean>(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);

  // Product state
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [productOptionsWithIds, setProductOptionsWithIds] = useState<ProductOption[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Fetch receipt data when in edit mode
  const { data: receiptsData } = useGetReceiptsQuery(undefined, {
    skip: !isEditMode || !receiptId,
  });

  // Fetch all receipts for supplier totals calculation
  const { data: allReceiptsData } = useGetReceiptsQuery(undefined);

  const fetchSupplierNames = async () => {
    try {
      setIsSuppliersLoading(true);
      setSuppliersError(null);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/receive/unique-supplier-names`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
        supplier_name: item.supplier_name || item.name || '',
        supplier_id: item.supplier_id || item.id || 0
      })) : [];
      setSupplierOptions(normalizedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch suppliers';
      setSuppliersError(errorMessage);
      setSupplierOptions([]);
    } finally {
      startTransition(() => {
        setIsSuppliersLoading(false);
      });
    }
  };

  const fetchAllProducts = async () => {
    try {
      setIsProductsLoading(true);
      setProductsError(null);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/receive/get-products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const products = await response.json();

      const productData = products
        .map((product: any) => {
          if (Array.isArray(product) && product.length >= 2) {
            return { name: product[0], id: product[1] };
          } else if (product && typeof product === 'object') {
            return { 
              name: product.name || product.product_name || product.productName || '', 
              id: product.id || product.product_id || product.productId 
            };
          }
          return null;
        })
        .filter((product: any) => product && product.name && product.name.trim() !== '' && product.id);

      setProductOptions(productData.map((p: ProductOption) => p.name) as string[]);
      setProductOptionsWithIds(productData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      setProductsError(errorMessage);
      setProductOptions([]);
    } finally {
      startTransition(() => {
        setIsProductsLoading(false);
      });
    }
  };

  const filteredSupplierOptions = useMemo(() => {
    const options = supplierOptions.map(s => s.supplier_name);
    const validOptions = options.filter(option => option && typeof option === 'string');
    return [...validOptions, orderLabels.addNewSupplier];
  }, [supplierOptions]);

  const autocompleteProductOptions = useMemo(() => {
    if (isProductsLoading) {
      return ["Loading products..."];
    }
    const validOptions = productOptions.filter(option => option && typeof option === 'string');
    return [...validOptions, orderLabels.addProducts];
  }, [productOptions, isProductsLoading]);

  const filterProductOptions = useMemo(() => {
    return (options: string[], state: any) => {
      const inputValue = state.inputValue.toLowerCase().trim();
      if (!inputValue) {
        const uniqueOptions = Array.from(new Set(options));
        return uniqueOptions;
      }

      const filtered = options.filter(option => {
        const optionStr = String(option).toLowerCase();
        return optionStr.includes(inputValue) || option === orderLabels.addProducts || option === "Loading products...";
      });

      const uniqueFiltered = Array.from(new Set(filtered));
      return uniqueFiltered;
    };
  }, []);

  const getProductIdFromName = (productName: string): number | null => {
    if (!productName || !productOptionsWithIds || productOptionsWithIds.length === 0) {
      return null;
    }

    const normalize = (str: string) => str.trim().toLowerCase();
    const normalizedProductName = normalize(productName);

    let product = productOptionsWithIds.find(p => normalize(p.name) === normalizedProductName);

    if (!product) {
      product = productOptionsWithIds.find(p =>
        normalize(p.name).includes(normalizedProductName) ||
        normalizedProductName.includes(normalize(p.name))
      );
    }

    return product ? product.id : null;
  };

  return {
    // Supplier data
    supplierOptions,
    setSupplierOptions,
    isSuppliersLoading,
    suppliersError,
    fetchSupplierNames,
    filteredSupplierOptions,

    // Product data
    productOptions,
    productOptionsWithIds,
    isProductsLoading,
    productsError,
    fetchAllProducts,
    autocompleteProductOptions,
    filterProductOptions,
    getProductIdFromName,

    // Receipt data
    receiptsData,
    allReceiptsData,
  };
};
