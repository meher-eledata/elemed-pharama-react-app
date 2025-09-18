// src/data/masterData.ts
export interface ProductMaster {
  id: string;
  productName: string;
  poNo?: string;
  date?: string;
  supplier?: string;
  gstinCode?: string;
  hsnCode?: string;
  discountPercentage?: number;
  availableItems?: number;
  minimumQty?: number;
  batch?: string;
}

export const masterProducts: ProductMaster[] = [
  {
    id: '1',
    productName: '2-0 Mersilk Syringe',
    poNo: '2897655790...',
    date: '21 May, 2025',
    supplier: '2-0 Mersilk Syringe',
    gstinCode: '1348907689999',
    hsnCode: '30049099',
    discountPercentage: 10,
    availableItems: 5,
    minimumQty: 5,
  },
  {
    id: '2',
    productName: '3-0 Mersilk 90cm NW 5',
    poNo: '3289765764...',
    date: '2 Jun, 2025',
    supplier: '3-0 Mersilk 90cm NW 5...',
    gstinCode: '7678876767',
    hsnCode: '30041010',
    discountPercentage: 15,
    availableItems: 50,
    minimumQty: 50,
  },
  {
    id: '3',
    productName: 'Paracetamol',
    poNo: '7843765704...',
    date: '12 Apr, 2025',
    supplier: 'Generic Pharma',
    gstinCode: '7268172618',
    hsnCode: '30049099',
    discountPercentage: 60,
    availableItems: 214,
    minimumQty: 10,
  },
  {
    id: '3',
   productName: 'Dolo',
    poNo: '7843765706...',
    date: '12 Apr, 2025',
    supplier: 'Generic Pharma',
    gstinCode: '7268172618',
    hsnCode: '30049099',
    discountPercentage: 60,
    availableItems: 214,
    minimumQty: 10,
  },
];
