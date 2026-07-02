global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleGuard } from '../../../guards/RoleGuard';
import { ADMIN_CONSTANTS } from '../../../config/constants/Admin.constants';

// The real Masterpage pulls in a large set of RTK Query hooks (masterApi /
// salesApi); rendering it through the full <Pages> tree is far heavier than this
// guard/route assertion needs. We stand in a lightweight marker so the test
// exercises RoleGuard + the /admin/master route registration, mirroring the
// admin subtree shape in src/pages/index.tsx.
const MasterStub = () => <div>MASTER_VIEW</div>;
const DashboardStub = () => <div>DASHBOARD_VIEW</div>;
const LoginStub = () => <div>LOGIN_VIEW</div>;

// Minimal auth store. RoleGuard reads state.auth.{user, isAuthenticated} and
// maps numeric roles via ROLE_MAP { 0: 'admin', 1: 'pharmacist' }.
const createStore = (auth: any) =>
  configureStore({
    reducer: {
      auth: (state = auth) => state,
    },
  });

// Mirrors the admin subtree of src/pages/index.tsx:
//   <Route element={<RoleGuard allowedRoles={['admin','Admin']} />}>
//     <Route path={ADMIN_CONSTANTS.ROUTE_BASE}>
//       <Route path="master" element={<Masterpage/>} />
//   ...plus the /dashboard redirect target RoleGuard sends non-admins to.
const renderAt = (path: string, auth: any) =>
  render(
    <Provider store={createStore(auth)}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<LoginStub />} />
          <Route path="/dashboard" element={<DashboardStub />} />
          <Route element={<RoleGuard allowedRoles={['admin', 'Admin']} />}>
            <Route path={ADMIN_CONSTANTS.ROUTE_BASE}>
              <Route path="master" element={<MasterStub />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('/admin/master route + RoleGuard', () => {
  it('registers the master route under ADMIN_CONSTANTS.ROUTE_BASE as /admin/master', () => {
    expect(`${ADMIN_CONSTANTS.ROUTE_BASE}/master`).toBe('/admin/master');
  });

  it('renders the Master view for an admin (numeric role 0) at /admin/master', () => {
    renderAt('/admin/master', {
      user: { id: 1, role: 0 },
      isAuthenticated: true,
    });
    expect(screen.getByText('MASTER_VIEW')).toBeInTheDocument();
    expect(screen.queryByText('DASHBOARD_VIEW')).not.toBeInTheDocument();
  });

  it("renders the Master view for an admin (string role 'admin') at /admin/master", () => {
    renderAt('/admin/master', {
      user: { id: 1, role: 'admin' },
      isAuthenticated: true,
    });
    expect(screen.getByText('MASTER_VIEW')).toBeInTheDocument();
  });

  it('redirects a pharmacist (numeric role 1) away from /admin/master to /dashboard', () => {
    renderAt('/admin/master', {
      user: { id: 2, role: 1 },
      isAuthenticated: true,
    });
    expect(screen.queryByText('MASTER_VIEW')).not.toBeInTheDocument();
    expect(screen.getByText('DASHBOARD_VIEW')).toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor away from /admin/master (not rendered)', () => {
    renderAt('/admin/master', {
      user: null,
      isAuthenticated: false,
    });
    expect(screen.queryByText('MASTER_VIEW')).not.toBeInTheDocument();
    // RoleGuard sends unauthenticated visitors to '/'.
    expect(screen.getByText('LOGIN_VIEW')).toBeInTheDocument();
  });
});
