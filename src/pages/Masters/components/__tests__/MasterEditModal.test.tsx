import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MasterEditModal from '../MasterEditModal';
import {
  MASTER_VIEW_CONFIG,
  type MasterCategory,
} from '../../../../config/constants/MasterView.constants';
import { useGetProductFieldOptionsQuery } from '../../../../redux/slices/masterApi';

// The product edit form's Type / Unit-of-Measure are `select` fields sourced from this
// query. Mock the slice (auto-mocked-slice gotcha: a new hook auto-mocks to undefined and
// would break these no-Provider renders).
jest.mock('../../../../redux/slices/masterApi', () => ({
  useGetProductFieldOptionsQuery: jest.fn(),
}));

beforeEach(() => {
  (useGetProductFieldOptionsQuery as jest.Mock).mockReturnValue({
    // Include the row's stored values ('tablet' / 'strip') so the selects show them.
    data: { types: ['tablet', 'capsule'], units: ['strip', 'bottle'] },
  });
});

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
    // phone is EDITABLE again — the server returns it MASKED (contains '*'). The untouched
    // masked prefill is treated as UNCHANGED: not validated and omitted from the body.
    phone: '******1000',
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
    unit_of_measure: 'strip',
    schedule: 'H',
    min_qty: 10,
    max_qty: 100,
    mrp: 50,
    selling_price: 45,
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

      // The customer's editable `phone` prefills MASKED (contains '*') and is left
      // untouched here, so it is OMITTED from the body (treated as unchanged). Every other
      // editable whitelist key must be present.
      const maskedUntouched = (key: string) =>
        category === 'customer' &&
        key === 'phone' &&
        String(ROWS[category][key]).includes('*');
      const expectedEditable = editableKeys(category).filter((k) => !maskedUntouched(k));
      for (const key of expectedEditable) {
        expect(body).toHaveProperty(key);
      }
      // The untouched masked phone must NOT be in the body.
      for (const key of editableKeys(category)) {
        if (maskedUntouched(key)) {
          expect(Object.prototype.hasOwnProperty.call(body, key)).toBe(false);
        }
      }

      // No locked key (other than the PK itself, which lives in the locked-field list
      // but is the legitimate identifier) leaks into the body.
      const lockedNonPk = lockedKeys(category).filter((k) => k !== pk);
      for (const key of lockedNonPk) {
        expect(Object.prototype.hasOwnProperty.call(body, key)).toBe(false);
      }

      // The body key set is EXACTLY pk + editable keys (minus an untouched masked phone).
      const expectedKeys = new Set<string>([pk, ...expectedEditable]);
      expect(new Set(Object.keys(body))).toEqual(expectedKeys);
    }
  );

  it('product: description is editable but package_info/dosage/discount are no longer rendered or sent', () => {
    const { onSave } = renderModal('product');

    // description is still part of the edit form.
    expect(screen.getByLabelText('Description')).toBeInTheDocument();

    // The removed fields must not render at all.
    expect(screen.queryByLabelText('Package Info')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Dosage')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Discount')).not.toBeInTheDocument();

    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body).toHaveProperty('description');
    expect(Object.prototype.hasOwnProperty.call(body, 'package_info')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'dosage')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'discount')).toBe(false);
  });

  it('product: Type and Unit of Measure are dropdowns; Type is now editable and sent', () => {
    const { onSave } = renderModal('product');

    // Both render as MUI Selects (combobox role), not text inputs.
    const typeCombo = screen.getByLabelText('Type');
    const unitCombo = screen.getByLabelText('Unit of Measure');
    expect(typeCombo).toHaveAttribute('role', 'combobox');
    expect(unitCombo).toHaveAttribute('role', 'combobox');

    // Type is editable now (backend accepts it) — its current stored value is shown.
    expect(within(typeCombo).getByText('tablet')).toBeInTheDocument();

    // Change Type to another option and confirm it's emitted as a plain string. The
    // dropdown now shows the predefined dosage-form list (merged with distinct DB values),
    // so pick a predefined option ('Capsule'); the lowercase distinct 'capsule' is deduped.
    fireEvent.mouseDown(typeCombo);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Capsule'));

    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body.type).toBe('Capsule');
    // Unit of measure (untouched) keeps its stored value.
    expect(body.unit_of_measure).toBe('strip');
  });

  it('product: Schedule is a dropdown of the FIXED statutory list; a pick is sent, blank clears to null', () => {
    const { onSave } = renderModal('product');

    const scheduleCombo = screen.getByLabelText('Schedule');
    expect(scheduleCombo).toHaveAttribute('role', 'combobox');
    // Stored value prefilled.
    expect(within(scheduleCombo).getByText('H')).toBeInTheDocument();

    // The fixed statutory codes (incl. the explicit 'NONE') are offered; dynamic
    // field-options values are NOT.
    fireEvent.mouseDown(scheduleCombo);
    const listbox = screen.getByRole('listbox');
    for (const code of ['NONE', 'G', 'H', 'H1', 'X', 'C', 'C1', 'K']) {
      expect(within(listbox).getByText(code)).toBeInTheDocument();
    }
    expect(within(listbox).queryByText('capsule')).not.toBeInTheDocument();

    fireEvent.click(within(listbox).getByText('X'));
    submit();
    expect((onSave.mock.calls[0][0] as Record<string, unknown>).schedule).toBe('X');
  });

  it('product: clearing Schedule (blank option) submits schedule: null', () => {
    const { onSave } = renderModal('product');

    const scheduleCombo = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(scheduleCombo);
    // The blank "—" MenuItem clears the value.
    fireEvent.click(within(screen.getByRole('listbox')).getByText('—'));

    submit();
    expect((onSave.mock.calls[0][0] as Record<string, unknown>).schedule).toBeNull();
  });

  it('product: a stored value not in the options list is still shown/selected', () => {
    (useGetProductFieldOptionsQuery as jest.Mock).mockReturnValue({
      // 'tablet' (the row's type) is intentionally absent from the list.
      data: { types: ['capsule'], units: ['strip', 'bottle'] },
    });
    const { onSave } = renderModal('product');

    const typeCombo = screen.getByLabelText('Type');
    // The off-list current value is prepended so editing other fields never drops it.
    expect(within(typeCombo).getByText('tablet')).toBeInTheDocument();

    submit();
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body.type).toBe('tablet');
  });

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

  it('customer: phone is EDITABLE (not read-only/disabled)', () => {
    renderModal('customer');
    const phone = inputForLabel('Phone') as HTMLInputElement;
    expect(phone.disabled).toBe(false);
    expect(phone.readOnly).toBe(false);
  });

  it('customer: untouched masked phone does NOT block save and is OMITTED from the body', () => {
    const { onSave } = renderModal('customer');

    // The masked prefill (******1000) is left untouched — no validation error, save proceeds.
    submit();
    expect(onSave).toHaveBeenCalledTimes(1);
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    // Phone is treated as unchanged → never sent, so the masked value can't overwrite it.
    expect(Object.prototype.hasOwnProperty.call(body, 'phone')).toBe(false);
  });

  it('customer: a new valid 10-digit phone is sent in the body', () => {
    const { onSave } = renderModal('customer');

    const phone = inputForLabel('Phone') as HTMLInputElement;
    fireEvent.change(phone, { target: { value: '9876543210' } });

    submit();
    expect(onSave).toHaveBeenCalledTimes(1);
    const body = onSave.mock.calls[0][0] as Record<string, unknown>;
    expect(body.phone).toBe('9876543210');
  });

  it('customer: an invalid (short) new phone blocks save', () => {
    const { onSave } = renderModal('customer');

    const phone = inputForLabel('Phone') as HTMLInputElement;
    fireEvent.change(phone, { target: { value: '12345' } });

    submit();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Phone must be exactly 10 digits')).toBeInTheDocument();
  });
});
