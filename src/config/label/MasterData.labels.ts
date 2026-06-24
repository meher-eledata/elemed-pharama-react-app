export const MASTER_DATA_LABELS = {
  PAGE_TITLE: 'Master Data',
  SUBTITLE: 'Add new entries / edit existing entries',
  CARDS: {
    PRODUCT: {
      TITLE: 'Add New Product',
      DESC: 'Add a new product to the master catalogue',
      ACTION: 'Add Product',
      BADGE_LABEL: 'products',
    },
    CUSTOMER: {
      TITLE: 'Add New Customer',
      DESC: 'Add a new customer to the master records',
      ACTION: 'Add Customer',
      BADGE_LABEL: 'customers',
    },
    SUPPLIER: {
      TITLE: 'Add New Supplier',
      DESC: 'Add a new supplier to the master records',
      ACTION: 'Add Supplier',
      BADGE_LABEL: 'suppliers',
    },
    DOCTOR: {
      TITLE: 'Add New Doctor or management',
      DESC: 'Expand the network of medical professionals and their specialties.',
      ACTION: 'Add Doctor',
      BADGE_LABEL: 'members',
    },
  },
} as const;

export type MasterDataLabels = typeof MASTER_DATA_LABELS;

