import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';
import { ADMIN_LABELS } from '../../../config/label/Admin.labels';

// The dashboard reads org context too (the compliance tile is module-gated), so
// the fixture store carries an `org` slice alongside `auth`.
const orgState = { organization: null, activeModules: ['pharmacy', 'compliance'], loaded: true };

const renderWithUser = (user: unknown) => {
  const store = configureStore({
    reducer: { auth: (state = { user }) => state, org: (state = orgState) => state },
    preloadedState: { auth: { user }, org: orgState },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </Provider>
  );
};

describe('AdminDashboard greeting', () => {
  it('greets the logged-in user by full name', () => {
    renderWithUser({ username: 'aanderson', first_name: 'Alice', last_name: 'Anderson' });
    expect(screen.getByText(`${ADMIN_LABELS.GREETING_PREFIX}, Alice Anderson!`)).toBeInTheDocument();
    expect(screen.queryByText(/Guest/)).not.toBeInTheDocument();
  });

  it('falls back to the username when the name fields are empty', () => {
    renderWithUser({ username: 'aanderson', first_name: '', last_name: '' });
    expect(screen.getByText(`${ADMIN_LABELS.GREETING_PREFIX}, aanderson!`)).toBeInTheDocument();
  });

  it('never shows a placeholder name when there is no user', () => {
    renderWithUser(null);
    expect(screen.getByText(`${ADMIN_LABELS.GREETING_PREFIX}!`)).toBeInTheDocument();
  });
});
