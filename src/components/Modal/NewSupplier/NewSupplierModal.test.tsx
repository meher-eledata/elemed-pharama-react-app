import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewSupplierModal from './NewSupplierModal';

/**
 * NewSupplierModal (#10) — GSTIN is a required, format-validated field that mirrors the
 * backend rule. The modal is a self-contained presentational component (props only, no
 * RTK Query hooks), so no slice mocking is needed here.
 *
 * We fill every OTHER required field so the only validation error under test is the
 * GSTIN one (an unfilled required field would also raise the generic "Please fill in..."
 * alert, which we deliberately avoid to keep the assertions focused).
 */

const renderModal = (onSubmit = jest.fn()) => {
  const onClose = jest.fn();
  render(<NewSupplierModal isOpen onClose={onClose} onSubmit={onSubmit} />);
  return { onSubmit, onClose };
};

// Fill the non-GSTIN required fields so GSTIN is the sole validation gate.
const fillRequiredExceptGstin = () => {
  fireEvent.change(screen.getByPlaceholderText('Supplier name *'), { target: { value: 'Acme Pharma' } });
  fireEvent.change(screen.getByPlaceholderText('Contact name *'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByPlaceholderText('Phone number *'), { target: { value: '9876543210' } });
  fireEvent.change(screen.getByPlaceholderText('Email id *'), { target: { value: 'vendor@acme.com' } });
  fireEvent.change(screen.getByPlaceholderText('Supplier code *'), { target: { value: 'AC1' } });
};

const clickAdd = () => fireEvent.click(screen.getByRole('button', { name: 'Add' }));

describe('NewSupplierModal — GSTIN validation (#10)', () => {
  it('blocks submit and shows the required error when GSTIN is blank', () => {
    const { onSubmit } = renderModal();
    fillRequiredExceptGstin();
    // GSTIN left blank.
    clickAdd();

    expect(screen.getByText('GSTIN is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks submit and shows the format error when GSTIN is malformed', () => {
    const { onSubmit } = renderModal();
    fillRequiredExceptGstin();
    fireEvent.change(screen.getByPlaceholderText('GSTIN *'), { target: { value: '27AAPFU0939F1XV' } });
    clickAdd();

    expect(screen.getByText('Enter a valid 15-character GSTIN')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the normalized (uppercased) GSTIN when all fields are valid', () => {
    const { onSubmit } = renderModal();
    fillRequiredExceptGstin();
    // lower-case entry: the field auto-uppercases and submit normalises before onSubmit.
    fireEvent.change(screen.getByPlaceholderText('GSTIN *'), { target: { value: '27aapfu0939f1zv' } });
    clickAdd();

    expect(screen.queryByText('GSTIN is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Enter a valid 15-character GSTIN')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({ gstin: '27AAPFU0939F1ZV' }),
    );
  });
});
