import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import NewDoctorModal from '../NewDoctorModal';

/**
 * Frontend-only feature under test: the NewDoctor modal after the canonical
 * Doctor-payload refactor. Field state changed (doctorName->name, mobileNumber->phone),
 * a Gender dropdown (1/2/3) was added, and the legacy Role field was removed.
 *
 * These assertions lock in the new contract:
 *  - no Role field is rendered,
 *  - `name` is required (empty submit is blocked + shows an error, onSubmit not called),
 *  - a valid submit hands back the canonical `{ name, phone, gender, ... }` shape.
 */

const renderModal = (
  overrides: Partial<React.ComponentProps<typeof NewDoctorModal>> = {},
) => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  const utils = render(
    <NewDoctorModal isOpen onClose={onClose} onSubmit={onSubmit} {...overrides} />,
  );
  return { onClose, onSubmit, ...utils };
};

describe('NewDoctorModal', () => {
  it('renders the modal without any Role field', () => {
    renderModal();

    expect(screen.getByText('New Doctor')).toBeInTheDocument();
    // Canonical name field is present (placeholder doubles as the label).
    expect(screen.getByPlaceholderText('Name *')).toBeInTheDocument();
    // Legacy Role field is gone.
    expect(screen.queryByText(/^Role$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
  });

  it('renders a Gender dropdown instead of Role', () => {
    renderModal();
    // The gender Select is labelled "Gender".
    expect(screen.getByLabelText('Gender')).toBeInTheDocument();
  });

  it('does not render the GSTIN or PAN Card Number fields', () => {
    renderModal();
    expect(screen.queryByPlaceholderText('GSTIN')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('PAN Card Number')).not.toBeInTheDocument();
  });

  it('renders the license field labelled "License" (not "Drug License")', () => {
    renderModal();
    expect(screen.getByPlaceholderText('License')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Drug License')).not.toBeInTheDocument();
  });

  it('blocks submit and shows an error when name is empty', () => {
    const { onSubmit } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/required fields: Name/i),
    ).toBeInTheDocument();
  });

  it('submits the canonical doctor fields when name is provided', () => {
    const { onSubmit } = renderModal();

    fireEvent.change(screen.getByPlaceholderText('Name *'), {
      target: { value: 'Dr. Strange' },
    });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), {
      target: { value: '9876543210' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    // Canonical keys present; legacy keys absent.
    expect(submitted).toMatchObject({
      name: 'Dr. Strange',
      phone: '9876543210',
    });
    expect(submitted).toHaveProperty('gender', null);
    expect(submitted).not.toHaveProperty('doctor_name');
    expect(submitted).not.toHaveProperty('mobileNumber');
    expect(submitted).not.toHaveProperty('role');
    // Removed compliance fields are no longer collected/submitted.
    expect(submitted).not.toHaveProperty('gstin');
    expect(submitted).not.toHaveProperty('pancard_num');
  });

  it('submits the selected gender as the canonical integer code', () => {
    const { onSubmit } = renderModal();

    fireEvent.change(screen.getByPlaceholderText('Name *'), {
      target: { value: 'Dr. Who' },
    });

    // Open the Gender select and pick "Female" (canonical code 2).
    fireEvent.mouseDown(screen.getByLabelText('Gender'));
    const listbox = within(screen.getByRole('listbox'));
    fireEvent.click(listbox.getByText('Female'));

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Dr. Who', gender: 2 });
  });
});
