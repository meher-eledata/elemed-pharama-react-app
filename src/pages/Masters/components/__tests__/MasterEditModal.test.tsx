import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MasterEditModal from '../MasterEditModal';
import {
  MASTER_VIEW_CONFIG,
  type MasterCategory,
} from '../../../../config/constants/MasterView.constants';

/**
 * Contract under test (see .claude/memory/api-contract.md, POST /api/master/update-*):
 *   - The edit modal renders every field but LOCKED fields (editable: false) must be
 *     read-only/disabled — the backend silently strips them, so the UI must not let the
 *     user believe they can be edited.
 *   - On submit, the body handed to onSave() must contain ONLY the PK + the editable
 *     whitelist fields, and NEVER a locked field (mass-assignment protection mirrored
 *     client-side).
 *   - gender is an INTEGER code (number), not a string.
 *
 * MasterEditModal receives onSave() from its parent (the parent wires it to the RTK Query
 * useUpdate*Mutation). The component boundary we assert is therefore the onSave payload:
 * whatever the modal emits is exactly what gets sent to the mutation. We spy on onSave.
 */

// A representative full row per category. Includes BOTH locked and editable values so we
// can prove the locked ones never leak into the submitted body.
const ROWS: Record<MasterCategory, Record<string, unknown>> = {
  customer: {
    id: 42,
    name: 'Acme Health',
    // phone is now an EDITABLE + required field, must be exactly 10 digits.
    phone: '5551231000',
    email: 'acme@example.com',
    gstin: 'GST123',
    pancard_num: 'PAN123',
    drug_license: 'DL123',
    // billing_address is now required in edit.
    billing_address: '1 Old Billing St',
    shipping_address: '1 Old Shipping St',
    address_line1: 'Line1',
    address_line2: 'Line2',
    city: 'Oldtown',
    state: 'OldState',
    postal_code: '00001',
    country: 'India',
    // Canonical gender: 1=Male, 2=Female, 3=Other. (Female)
    gender: 2,
  },
  supplier: {
    id: 7,
    supplier_name: 'PharmaCo',
    supplier_code: 'PC-001',
    gst_number: 'GSTSUP',
    cst_number: 'CSTSUP',
    contact_name: 'Old Contact',
    address: 'Old Addr',
    city: 'Oldcity',
    state: 'OldState',
    pin: '11111',
    country: 'India',
    phone_number: '555-2000',
    email_id: 'sup@example.com',
    notes: 'old notes',
  },
  product: {
    product_id: 99,
    product_code: 'PROD-99',
    brand_id: 3,
    hsn_id: 5,
    type: 'tablet',
    expiry: '2027-01-01',
    current_qty: 500,
    description: 'Old description',
    package_info: 'box of 10',
    unit_of_measure: 'strip',
    dosage: '500mg',
    min_qty: 10,
    max_qty: 100,
    mrp: 50,
    selling_price: 45,
    discount: 5,
  },
  doctor: {
    id: 'DOC-1',
    name: 'Dr. Old',
    // doctor.phone is LOCKED (editable: false) so it is never sent and not validated.
    phone: '5553331000',
    email: 'doc@example.com',
    gstin: 'GSTDOC',
    pancard_num: 'PANDOC',
    drug_license: 'DLDOC',
    branch: 'Old Branch',
    address: 'Old Addr',
    city: 'Oldcity',
    state: 'OldState',
    pin: '22222',
    country: 'India',
    // Canonical gender: 1=Male, 2=Female, 3=Other. (Male)
    gender: 1,
  },
};

const renderModal = (
  category: MasterCategory,
  overrides: Partial<React.ComponentProps<typeof MasterEditModal>> = {}
) => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <MasterEditModal
      open
      category={category}
      row={ROWS[category]}
      saving={false}
      onClose={onClose}
      onSave={onSave}
      {...overrides}
    />
  );
  return { onSave, onClose, ...utils };
};

const lockedKeys = (category: MasterCategory) =>
  MASTER_VIEW_CONFIG[category].fields.filter((f) => !f.editable).map((f) => f.key);
const editableKeys = (category: MasterCategory) =>
  MASTER_VIEW_CONFIG[category].fields.filter((f) => f.editable).map((f) => f.key);

// Find the rendered input element for a given field by its label.
const inputForLabel = (label: string): HTMLInputElement | HTMLTextAreaElement => {
  const el = screen.getByLabelText(label, { exact: true });
  return el as HTMLInputElement | HTMLTextAreaElement;
};

const submit = () => {
  const saveBtn = screen.getByRole('button', { name: /save/i });
  fireEvent.click(saveBtn);
};

const categories: MasterCategory[] = ['customer', 'supplier', 'product', 'doctor'];

describe('MasterEditModal — locked fields render read-only', () => {
  it.each(categories)('%s: every locked field is disabled/read-only', (category) => {
    renderModal(category);
    for (const key of lockedKeys(category)) {
      const field = MASTER_VIEW_CONFIG[category].fields.find((f) => f.key === key)!;
      const input = inputForLabel(field.label);
      // disabled OR readOnly — either makes the value uneditable by the user.
      const uneditable =
        (input as HTMLInputElement).disabled || (input as HTMLInputElement).readOnly;
      expect(uneditable).toBe(true);
    }
  });

  it('customer: editable fields are NOT disabled (sanity — locked check is meaningful)', () => {
    renderModal('customer');
    // address_line1 is editable text; it must be editable.
    const input = inputForLabel('Address Line 1') as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(false);
  });
});

describe('MasterEditModal — submit payload contains only PK + editable whitelist', () => {
  it.each(categories)(
    '%s: onSave body has the PK and every editable key, and NO locked key',
    (category) => {
      const { onSave } = renderModal(category);
      submit();

      expect(onSave).toHaveBeenCalledTimes(1);
      const body = onSave.mock.calls[0][0] as Record<string, unknown>;

      const config = MASTER_VIEW_CONFIG[category];
      const pk = config.pkKey;

      // PK present and equal to the row's PK.
      expect(body).toHaveProperty(pk);
      expect(body[pk]).toBe(ROWS[category][pk]);

      // Every editable whitelist key present.
      for (const key of editableKeys(category)) {
        expect(body).toHaveProperty(key);
      }

      // No locked key (other than the PK itself, which lives in the locked-field list
      // but is the legitimate identifier) leaks into the body.
      const lockedNonPk = lockedKeys(category).filter((k) => k !== pk);
      for (const key of lockedNonPk) {
        expect(Object.prototype.hasOwnProperty.call(body, key)).toBe(false);
      }

      // The body key set is EXACTLY pk + editable keys — nothing extra.
      const expectedKeys = new Set<string>([pk, ...editableKeys(category)]);
      expect(new Set(Object.keys(body))).toEqual(expectedKeys);
    }
  );

  it('customer: an edit to an editable field is reflected; locked fields untouched', () => {
    const { onSave } = renderModal('customer');

    const cityInput = inputForLabel('City') as HTMLInputElement;
    fireEvent.change(cityInput, { target: { value: 'Newtown' } });

    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body.city).toBe('Newtown');
    // Locked compliance fields must not appear at all.
    expect(Object.prototype.hasOwnProperty.call(body, 'gstin')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'name')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'pancard_num')).toBe(false);
  });
});

describe('MasterEditModal — gender is sent as an integer code, not a string', () => {
  it('customer: selecting a gender option sends a number', () => {
    const { onSave } = renderModal('customer');

    // Open the gender Select and choose "Female". Canonical code for Female is 2.
    const genderCombo = screen.getByLabelText('Gender');
    fireEvent.mouseDown(genderCombo);
    const listbox = within(screen.getByRole('listbox'));
    fireEvent.click(listbox.getByText('Female'));

    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof body.gender).toBe('number');
    expect(body.gender).toBe(2);
  });

  it('customer: selecting "Male" sends canonical code 1', () => {
    const { onSave } = renderModal('customer');

    const genderCombo = screen.getByLabelText('Gender');
    fireEvent.mouseDown(genderCombo);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Male'));

    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body.gender).toBe(1);
  });

  it('customer: selecting "Other" sends canonical code 3', () => {
    const { onSave } = renderModal('customer');

    const genderCombo = screen.getByLabelText('Gender');
    fireEvent.mouseDown(genderCombo);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Other'));

    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body.gender).toBe(3);
  });

  it('doctor: pre-filled integer gender is emitted as a number (not "1")', () => {
    // ROWS.doctor.gender = 1 (canonical Male). Without touching the control it should
    // serialize back to the integer 1, never the string "1".
    const { onSave } = renderModal('doctor');
    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof body.gender).toBe('number');
    expect(body.gender).toBe(1);
  });
});

describe('MasterEditModal — required + phone validation blocks save', () => {
  // Required editable fields render with a trailing " *" in their accessible label,
  // so match by a leading-anchored regex rather than exact text.
  const requiredInput = (labelStart: string): HTMLInputElement | HTMLTextAreaElement =>
    screen.getByLabelText(new RegExp(`^${labelStart}`)) as
      | HTMLInputElement
      | HTMLTextAreaElement;

  it('customer: clearing required billing_address blocks save (field marked required)', () => {
    const { onSave } = renderModal('customer');

    const billing = requiredInput('Billing Address') as HTMLTextAreaElement;
    fireEvent.change(billing, { target: { value: '' } });
    // The required attribute is what gates an empty submit.
    expect(billing.required).toBe(true);

    submit();

    expect(onSave).not.toHaveBeenCalled();
  });

  it('customer: clearing required phone blocks save (field marked required)', () => {
    const { onSave } = renderModal('customer');

    const phone = requiredInput('Phone') as HTMLInputElement;
    fireEvent.change(phone, { target: { value: '' } });
    expect(phone.required).toBe(true);

    submit();

    expect(onSave).not.toHaveBeenCalled();
  });

  it('customer: a non-10-digit phone blocks save and shows the exactly-10-digits error', () => {
    const { onSave } = renderModal('customer');

    // The phone input strips non-digits and caps at 10; 5 digits fails /^\d{10}$/.
    const phone = requiredInput('Phone') as HTMLInputElement;
    fireEvent.change(phone, { target: { value: '55512' } });
    expect(phone.value).toBe('55512');

    submit();

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Phone must be exactly 10 digits')).toBeInTheDocument();
  });

  it('customer: phone input strips non-digits and caps at 10', () => {
    const { onSave } = renderModal('customer');

    const phone = requiredInput('Phone') as HTMLInputElement;
    fireEvent.change(phone, { target: { value: '555-123-1000-99' } });
    // Non-digits stripped, capped to first 10 digits.
    expect(phone.value).toBe('5551231000');

    submit();
    // Valid 10-digit phone + non-empty billing => save proceeds.
    expect(onSave).toHaveBeenCalledTimes(1);
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body.phone).toBe('5551231000');
  });
});
