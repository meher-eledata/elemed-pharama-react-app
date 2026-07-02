export const MASTER_DATA_LABELS = {
  PAGE_TITLE: 'Master Data',
  SUBTITLE: 'Add new entries / edit existing entries',
  CARDS: {
    PRODUCT: {
      TITLE: 'Products',
      DESC: 'Add a new product to the master records',
      ACTION: 'Add Product',
      BADGE_LABEL: 'products',
    },
    CUSTOMER: {
      TITLE: 'Customers',
      DESC: 'Add a new customer to the master records',
      ACTION: 'Add Customer',
      BADGE_LABEL: 'customers',
    },
    SUPPLIER: {
      TITLE: 'Suppliers',
      DESC: 'Add a new supplier to the master records',
      ACTION: 'Add Supplier',
      BADGE_LABEL: 'suppliers',
    },
    DOCTOR: {
      TITLE: 'Doctors',
      DESC: 'Add a new doctor to the master records',
      ACTION: 'Add Doctor',
      BADGE_LABEL: 'members',
    },
  },
} as const;

export type MasterDataLabels = typeof MASTER_DATA_LABELS;

