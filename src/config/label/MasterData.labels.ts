export const MASTER_DATA_LABELS = {
  PAGE_TITLE: 'Master Data',
  SUBTITLE: 'Add new entries (product, doctor, customer, supplier) to the database.',
  CARDS: {
    PRODUCT: {
      TITLE: 'Add New Product',
      DESC: 'Register new inventory items and manage product information.',
      ACTION: 'Add Product',
      BADGE_LABEL: 'products',
    },
    CUSTOMER: {
      TITLE: 'Add New Customer',
      DESC: 'Onboard new clients and patrons with their contact details.',
      ACTION: 'Add Customer',
      BADGE_LABEL: 'customers',
    },
    SUPPLIER: {
      TITLE: 'Add New Supplier',
      DESC: 'Integrate new material providers and vendor relationships.',
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

