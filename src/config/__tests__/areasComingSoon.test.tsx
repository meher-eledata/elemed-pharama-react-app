global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAccessibleAreas, COMING_SOON_AREA_KEYS } from '../areas.config';
import { OrgGuard } from '../../guards/OrgGuard';

// Full-access org context: superadmin with every module active server-side
// would still never see coming-soon areas.
const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT', isAuthenticated: true, user: { role: 0 } }) => state,
      org: (
        state = {
          organization: { id: 1, name: 'Acme', slug: 'acme' },
          activeModules: ['pharmacy'],
          orgRole: 'superadmin',
          moduleRoles: { pharmacy: 'pharmacist' },
          canManageRoles: true,
          loaded: true,
        },
      ) => state,
    },
  });

const AreasProbe: React.FC = () => {
  const areas = useAccessibleAreas();
  return <div data-testid="areas">{areas.map((a) => a.key).join(',')}</div>;
};

describe('Coming Soon area gating', () => {
  it('lists outpatient and org as coming-soon areas', () => {
    expect(COMING_SOON_AREA_KEYS).toEqual(expect.arrayContaining(['outpatient', 'org']));
  });

  it('useAccessibleAreas never returns coming-soon areas, even for a superadmin', () => {
    render(
      <Provider store={createStore()}>
        <MemoryRouter>
          <AreasProbe />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByTestId('areas')).toHaveTextContent(/^pharmacy$/);
  });

  it('OrgGuard redirects direct /org visits to the pharmacy home', () => {
    render(
      <Provider store={createStore()}>
        <MemoryRouter initialEntries={['/org']}>
          <Routes>
            <Route element={<OrgGuard />}>
              <Route path="/org" element={<div>org home</div>} />
            </Route>
            <Route path="/dashboard" element={<div>pharmacy dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('pharmacy dashboard')).toBeInTheDocument();
    expect(screen.queryByText('org home')).not.toBeInTheDocument();
  });
});
