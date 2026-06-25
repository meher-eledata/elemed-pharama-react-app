// Config-driven definitions for the Master tab VIEW (table) + EDIT (form) UI.
// The edit form renders every field below; only fields flagged `editable: true`
// are sent in the update request body (matching the recorded API contract whitelist).
// LOCKED fields (editable: false) are rendered read-only/disabled.

export type MasterCategory = 'customer' | 'supplier' | 'product' | 'doctor';

export type MasterFieldType = 'text' | 'number' | 'multiline' | 'gender';

export interface MasterColumnDef {
  // dot-free key matching the row object property
  key: string;
  header: string;
}

export interface MasterFieldDef {
  key: string;
  label: string;
  type: MasterFieldType;
  // true => editable (sent in update body); false => LOCKED (read-only, never sent)
  editable: boolean;
  // true => must be non-empty to save (enforced generically in MasterEditModal)
  required?: boolean;
}

export interface MasterCategoryConfig {
  // primary key property name on the row + in the update body
  pkKey: string;
  // row property name used by the VIEW modal's client-side "search by name" filter
  searchKey: string;
  columns: MasterColumnDef[];
  fields: MasterFieldDef[];
}

// Returns true when a raw row value should be treated as empty/missing for display.
// Covers: null, undefined, empty/whitespace-only strings, the actual number NaN, and the
// literal strings "nan"/"NaN"/"NAN" (case-insensitive) that leak in from pandas-style exports.
// Legitimate values — including the number 0 and real text — are NOT treated as empty.
export const isEmptyMasterValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return Number.isNaN(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed.toLowerCase() === 'nan';
  }
  return false;
};

// Gender integer code <-> label mapping (backend model uses INTEGER).
// CANONICAL ENCODING (app-wide, verified 2026-06-24): 1 = Male, 2 = Female, 3 = Other.
export const MASTER_GENDER_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Other' },
];

export const MASTER_VIEW_CONFIG: Record<MasterCategory, MasterCategoryConfig> = {
  customer: {
    pkKey: 'id',
    searchKey: 'name',
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'email', header: 'Email' },
      { key: 'city', header: 'City' },
      { key: 'state', header: 'State' },
    ],
    fields: [
      // LOCKED
      { key: 'id', label: 'Customer ID', type: 'text', editable: false },
      { key: 'name', label: 'Name', type: 'text', editable: false },
      { key: 'email', label: 'Email', type: 'text', editable: false },
      { key: 'gstin', label: 'GSTIN', type: 'text', editable: false },
      { key: 'pancard_num', label: 'PAN Card Number', type: 'text', editable: false },
      { key: 'drug_license', label: 'Drug License', type: 'text', editable: false },
      // EDITABLE (whitelist)
      { key: 'phone', label: 'Phone', type: 'text', editable: true, required: true },
      { key: 'billing_address', label: 'Billing Address', type: 'multiline', editable: true, required: true },
      { key: 'shipping_address', label: 'Shipping Address', type: 'multiline', editable: true },
      { key: 'address_line1', label: 'Address Line 1', type: 'text', editable: true },
      { key: 'address_line2', label: 'Address Line 2', type: 'text', editable: true },
      { key: 'city', label: 'City', type: 'text', editable: true },
      { key: 'state', label: 'State', type: 'text', editable: true },
      { key: 'postal_code', label: 'Postal Code', type: 'text', editable: true },
      { key: 'country', label: 'Country', type: 'text', editable: true },
      { key: 'gender', label: 'Gender', type: 'gender', editable: true },
    ],
  },

  supplier: {
    pkKey: 'id',
    searchKey: 'supplier_name',
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'supplier_name', header: 'Supplier Name' },
      { key: 'supplier_code', header: 'Code' },
      { key: 'contact_name', header: 'Contact' },
      { key: 'phone_number', header: 'Phone' },
      { key: 'city', header: 'City' },
    ],
    fields: [
      // LOCKED
      { key: 'id', label: 'Supplier ID', type: 'text', editable: false },
      { key: 'supplier_name', label: 'Supplier Name', type: 'text', editable: false },
      { key: 'supplier_code', label: 'Supplier Code', type: 'text', editable: false },
      { key: 'gst_number', label: 'GST Number', type: 'text', editable: false },
      { key: 'cst_number', label: 'CST Number', type: 'text', editable: false },
      // EDITABLE (whitelist)
      { key: 'contact_name', label: 'Contact Name', type: 'text', editable: true },
      { key: 'address', label: 'Address', type: 'multiline', editable: true },
      { key: 'city', label: 'City', type: 'text', editable: true },
      { key: 'state', label: 'State', type: 'text', editable: true },
      { key: 'pin', label: 'PIN', type: 'text', editable: true },
      { key: 'country', label: 'Country', type: 'text', editable: true },
      { key: 'phone_number', label: 'Phone Number', type: 'text', editable: true },
      { key: 'email_id', label: 'Email', type: 'text', editable: true },
      { key: 'notes', label: 'Notes', type: 'multiline', editable: true },
    ],
  },

  product: {
    pkKey: 'product_id',
    searchKey: 'name',
    columns: [
      { key: 'product_id', header: 'ID' },
      { key: 'product_code', header: 'Code' },
      { key: 'name', header: 'Name' },
      { key: 'brand_name', header: 'Brand' },
      { key: 'description', header: 'Description' },
      { key: 'unit_of_measure', header: 'Unit' },
      { key: 'hsn_id', header: 'HSN Code' },
    ],
    fields: [
      // LOCKED
      { key: 'product_id', label: 'Product ID', type: 'text', editable: false },
      { key: 'product_code', label: 'Product Code', type: 'text', editable: false },
      { key: 'brand_id', label: 'Brand ID', type: 'text', editable: false },
      { key: 'type', label: 'Type', type: 'text', editable: false },
      { key: 'current_qty', label: 'Current Qty', type: 'text', editable: false },
      // EDITABLE (whitelist)
      { key: 'hsn_id', label: 'HSN Code', type: 'text', editable: true },
      { key: 'description', label: 'Description', type: 'multiline', editable: true },
      { key: 'package_info', label: 'Package Info', type: 'text', editable: true },
      { key: 'unit_of_measure', label: 'Unit of Measure', type: 'text', editable: true },
      { key: 'dosage', label: 'Dosage', type: 'text', editable: true },
      { key: 'min_qty', label: 'Min Qty', type: 'number', editable: true },
      { key: 'max_qty', label: 'Max Qty', type: 'number', editable: true },
      { key: 'discount', label: 'Discount', type: 'number', editable: true },
    ],
  },

  doctor: {
    pkKey: 'id',
    searchKey: 'name',
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'email', header: 'Email' },
      { key: 'branch', header: 'Branch' },
      { key: 'city', header: 'City' },
    ],
    fields: [
      // LOCKED
      { key: 'id', label: 'Doctor ID', type: 'text', editable: false },
      { key: 'name', label: 'Name', type: 'text', editable: false },
      { key: 'phone', label: 'Phone', type: 'text', editable: false },
      { key: 'email', label: 'Email', type: 'text', editable: false },
      { key: 'gstin', label: 'GSTIN', type: 'text', editable: false },
      { key: 'pancard_num', label: 'PAN Card Number', type: 'text', editable: false },
      { key: 'drug_license', label: 'Drug License', type: 'text', editable: false },
      // EDITABLE (whitelist)
      { key: 'branch', label: 'Branch', type: 'text', editable: true },
      { key: 'address', label: 'Address', type: 'multiline', editable: true },
      { key: 'city', label: 'City', type: 'text', editable: true },
      { key: 'state', label: 'State', type: 'text', editable: true },
      { key: 'pin', label: 'PIN', type: 'text', editable: true },
      { key: 'country', label: 'Country', type: 'text', editable: true },
      { key: 'gender', label: 'Gender', type: 'gender', editable: true },
    ],
  },
};

// Backend projects customers/doctors by role: admin gets the full record, while
// pharmacists (any non-admin) get exactly { id, name, phone }. So for pharmacists we
// must not render the PII columns/fields (email, gstin, pancard_num, drug_license,
// addresses, city, state, …) — they arrive undefined and would show as blank cells.
// We also hide `id` from pharmacists, so they see ONLY Name & Phone. `id` is still
// present in the row data (this whitelist filters column/field DEFINITIONS only), so
// the table row key and edit PK (both read row[pkKey] directly) keep working.
const PHARMACIST_VISIBLE_KEYS: ReadonlySet<string> = new Set(['name', 'phone']);

// Categories whose backend response is role-projected (PII stripped for pharmacists).
const ROLE_PROJECTED_CATEGORIES: ReadonlySet<MasterCategory> = new Set(['customer', 'doctor']);

// Returns the role-appropriate VIEW/EDIT config for a category.
// - Admin (or any non-projected category) → the full config, unchanged.
// - Pharmacist + a role-projected category (customer/doctor) → only Name & Phone
//   columns and only the matching fields, so no empty PII cells/fields are rendered.
export const getMasterViewConfig = (
  category: MasterCategory,
  isAdmin: boolean,
): MasterCategoryConfig => {
  const config = MASTER_VIEW_CONFIG[category];
  if (isAdmin || !ROLE_PROJECTED_CATEGORIES.has(category)) return config;
  return {
    ...config,
    columns: config.columns.filter((c) => PHARMACIST_VISIBLE_KEYS.has(c.key)),
    fields: config.fields.filter((f) => PHARMACIST_VISIBLE_KEYS.has(f.key)),
  };
};
