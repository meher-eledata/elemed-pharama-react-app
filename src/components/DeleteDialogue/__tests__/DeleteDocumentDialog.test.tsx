import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DeleteDocumentDialog, { MIN_REASON_LENGTH } from '../DeleteDocumentDialog';

// -----------------------------------------------------------------------------
// ONE dialog serves both the sales-invoice and goods-receipt delete flows. They used to
// be two near-duplicate components that had silently drifted apart — different minimum
// reason lengths, one showing a spinner while busy and the other not, one dismissable
// mid-delete and the other not. None of those were per-feature decisions, so they are
// pinned here once and both call sites inherit them.
// -----------------------------------------------------------------------------
const setup = (over: Partial<React.ComponentProps<typeof DeleteDocumentDialog>> = {}) => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  render(
    <DeleteDocumentDialog
      open
      documentLabel="receipt"
      documentNumber="PI-EL-26-000243"
      consequenceText="The received stock will be taken back out of inventory."
      onClose={onClose}
      onConfirm={onConfirm}
      {...over}
    />
  );
  return { onConfirm, onClose };
};

const reasonField = () => screen.getByLabelText(/Reason for deletion/i);
const confirmButton = () => screen.getByRole('button', { name: /^Delete$/i });

describe('DeleteDocumentDialog', () => {
  it('names the document and its number in the title', () => {
    setup();
    expect(screen.getByText(/Delete receipt PI-EL-26-000243\?/i)).toBeInTheDocument();
  });

  it('works for the other document type from the same component', () => {
    setup({ documentLabel: 'invoice', documentNumber: 'INV-1042' });
    expect(screen.getByText(/Delete invoice INV-1042\?/i)).toBeInTheDocument();
  });

  it('degrades gracefully when the document has no number (legacy rows)', () => {
    setup({ documentNumber: null });
    expect(screen.getByText(/Delete receipt\?/i)).toBeInTheDocument();
  });

  it('states the real consequences rather than a generic warning', () => {
    setup();
    expect(screen.getByText(/taken back out of inventory/i)).toBeInTheDocument();
  });

  it(`requires a reason of at least ${MIN_REASON_LENGTH} characters`, async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();

    expect(confirmButton()).toBeDisabled();

    await user.type(reasonField(), 'a'.repeat(MIN_REASON_LENGTH - 1));
    expect(confirmButton()).toBeDisabled();

    await user.type(reasonField(), 'a');
    expect(confirmButton()).toBeEnabled();

    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('whitespace alone is not a reason', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(reasonField(), '     ');
    expect(confirmButton()).toBeDisabled();
  });

  it('trims the reason before handing it over', async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    await user.type(reasonField(), '  Entered twice by mistake  ');
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith('Entered twice by mistake');
  });

  it('cannot be dismissed while the delete is in flight', () => {
    setup({ isDeleting: true });

    // The request is already on the wire — closing here would strand the user not
    // knowing whether it landed. Close and Cancel are both inert, and the confirm
    // shows progress instead of being re-fireable.
    expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Cancel$/i })).toBeDisabled();
    expect(screen.getByText(/Deleting\.\.\./i)).toBeInTheDocument();
  });

  it('does not carry a previous reason into the next deletion', () => {
    const { rerender } = render(
      <DeleteDocumentDialog
        open
        documentLabel="receipt"
        documentNumber="R-1"
        consequenceText="x"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    const props = {
      documentLabel: 'receipt',
      documentNumber: 'R-1',
      consequenceText: 'x',
      onClose: jest.fn(),
      onConfirm: jest.fn(),
    };
    rerender(<DeleteDocumentDialog open={false} {...props} />);
    rerender(<DeleteDocumentDialog open {...props} />);

    expect((reasonField() as HTMLTextAreaElement).value).toBe('');
  });
});
