import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DeleteDocumentTrigger from '../DeleteDocumentTrigger';

// -----------------------------------------------------------------------------
// Shared by the sales-invoice and goods-receipt edit screens. Deliberately red TEXT
// rather than a filled button: deleting is the rare destructive path and should not
// out-shout Save. The receipts screen previously used a large filled red button reading
// "Delete the full receipt"; this is the sales screen's quieter treatment, now common.
// -----------------------------------------------------------------------------
describe('DeleteDocumentTrigger', () => {
  it('renders the given label', () => {
    render(<DeleteDocumentTrigger label="Delete Receipt" onClick={jest.fn()} />);
    expect(screen.getByText('Delete Receipt')).toBeInTheDocument();
  });

  it('is exposed as a button to assistive tech despite not being a <button>', () => {
    render(<DeleteDocumentTrigger label="Delete Invoice" onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete Invoice' })).toBeInTheDocument();
  });

  it('fires on click', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<DeleteDocumentTrigger label="Delete Receipt" onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Delete Receipt' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([['Enter', '{Enter}'], ['Space', ' ']])(
    'is keyboard-operable with %s',
    async (_label, key) => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<DeleteDocumentTrigger label="Delete Receipt" onClick={onClick} />);

      screen.getByRole('button', { name: 'Delete Receipt' }).focus();
      await user.keyboard(key);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  );

  it('does nothing when disabled — by click or by keyboard', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<DeleteDocumentTrigger label="Delete Receipt" onClick={onClick} disabled />);

    const trigger = screen.getByRole('button', { name: 'Delete Receipt' });
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    // Also out of the tab order, so it cannot be reached by keyboard at all.
    expect(trigger).toHaveAttribute('tabindex', '-1');

    await user.click(trigger);
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });
});
