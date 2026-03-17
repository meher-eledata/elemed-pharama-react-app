// Sales Page Types and Interfaces

export interface Product {
  id: string;
  name: string;
  batch: string;
  avlQty: string;
  mrp: number;
  sp: number;
  unit_selling_price: number;
  expiry: string;
  quantity: number;
  type: string;
  discount: number;
  product_id?: number; // Product ID for fetching batches
  discountAuthorizedBy?: string; // Name of person authorizing the discount
  discountAuthorizedById?: number; // ID of doctor authorizing the discount
  // GST fields (optional - only populated when coming back from Receipt page)
  cgst?: string;
  cgstPercent?: string;
  sgst?: string;
  sgstPercent?: string;
  igst?: string;
  igstPercent?: string;
  amount?: string;
  pack_qty?: number;
}

export interface ApiProduct {
  id: string;
  name: string;
  batch?: string;
  avlQty?: string;
  mrp?: number;
  sp?: number;
  expiry?: string;
}

export interface SalesPageState {
  productType: string;
  availableTypes: string[];
  brand: string;
  qty: number;
  discount: number;
  findProduct: string;
  selectedItems: string[];
  productsData: Product[];
  cartItems: Product[];
  isProductSelected: boolean;
  showTypeDropdown: boolean;
  validationError: string;
  validatedData: any;
  productId: string;
  priceType: 'SP' | 'MRP';
  editingRowId: string | null;
  deleteDialogOpen: boolean;
  itemsToDelete: string[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
}

export interface ValidationRequest {
  product_name: string;
  product_id: string;
  quantity: number;
  type: string;
  disc: number;
}

export interface ValidationResponse {
  mrp?: number;
  selling_price?: number;
  message?: string;
}

